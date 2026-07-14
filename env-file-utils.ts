import fs from 'node:fs'
import path from 'node:path'

export interface EnvVar {
  key: string
  value: string
}

const ENV_PATH = path.resolve(process.cwd(), '.env')
const EXAMPLE_PATH = path.resolve(process.cwd(), 'env.example')
const MASKED_PATH = path.resolve(process.cwd(), 'env.masked')

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export function parseEnvContent(content: string): EnvVar[] {
  const vars: EnvVar[] = []
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (KEY_PATTERN.test(key)) vars.push({ key, value })
  }
  return vars
}

export function serializeEnvContent(vars: EnvVar[]): string {
  const lines = vars.filter((v) => KEY_PATTERN.test(v.key.trim())).map(({ key, value }) => `${key.trim()}=${value}`)
  return lines.length > 0 ? lines.join('\n') + '\n' : ''
}

export type EnvSource = 'env' | 'example' | 'none'

export function readEnvFileVars(): { vars: EnvVar[]; source: EnvSource } {
  if (fs.existsSync(ENV_PATH)) {
    return { vars: parseEnvContent(fs.readFileSync(ENV_PATH, 'utf-8')), source: 'env' }
  }
  if (fs.existsSync(EXAMPLE_PATH)) {
    return { vars: parseEnvContent(fs.readFileSync(EXAMPLE_PATH, 'utf-8')), source: 'example' }
  }
  return { vars: [], source: 'none' }
}

export function writeEnvFile(vars: EnvVar[]): EnvVar[] {
  const cleaned = vars
    .map((v) => ({ key: v.key.trim(), value: v.value }))
    .filter((v) => KEY_PATTERN.test(v.key))
  fs.writeFileSync(ENV_PATH, serializeEnvContent(cleaned), 'utf-8')
  return cleaned
}

/** Merges `overrides` into the current .env (creating it from env.example first if needed) and writes it back. */
export function upsertEnvVars(overrides: Record<string, string>): EnvVar[] {
  const { vars } = readEnvFileVars()
  const merged = new Map(vars.map((v) => [v.key, v.value]))
  for (const [key, value] of Object.entries(overrides)) {
    merged.set(key, value)
  }
  return writeEnvFile(Array.from(merged, ([key, value]) => ({ key, value })))
}

export function readMaskedKeys(): Set<string> {
  if (!fs.existsSync(MASKED_PATH)) return new Set()
  const keys = fs
    .readFileSync(MASKED_PATH, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && KEY_PATTERN.test(line))
  return new Set(keys)
}

export function writeMaskedKeys(keys: string[]): void {
  const cleaned = keys.map((k) => k.trim()).filter((k) => KEY_PATTERN.test(k))
  const unique = Array.from(new Set(cleaned))
  fs.writeFileSync(MASKED_PATH, unique.length > 0 ? unique.join('\n') + '\n' : '', 'utf-8')
}

/** Re-read .env fresh on every call so a Settings save is immediately reflected in live commands. */
export function loadDotEnvForShell(): Record<string, string> {
  if (!fs.existsSync(ENV_PATH)) return {}
  const out: Record<string, string> = {}
  for (const { key, value } of parseEnvContent(fs.readFileSync(ENV_PATH, 'utf-8'))) {
    out[key] = value
  }
  return out
}

export interface EnvProfile {
  filename: string
  label: string
}

const PROFILE_PREFIX = '.env-'

/** Lists saved environment profiles (`.env-<name>` files) in the project root. */
export function listEnvProfiles(): EnvProfile[] {
  return fs
    .readdirSync(process.cwd(), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith(PROFILE_PREFIX) && entry.name !== PROFILE_PREFIX)
    .map((entry) => ({ filename: entry.name, label: entry.name.slice(PROFILE_PREFIX.length) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** Sanitizes a value for safe use as a filename component. */
function sanitizeFilenamePart(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9._-]/g, '-')
}

/**
 * Writes `vars` to .env (same as a normal Settings save) and additionally
 * snapshots that same content into `.env-<HUB_FQDN>`, using the HUB_FQDN
 * value found in `vars` itself — so the profile name always matches what's
 * actually being saved, not whatever happens to already be on disk.
 */
export function saveEnvProfile(vars: EnvVar[]): { ok: true; filename: string } | { ok: false; error: string } {
  const hubFqdn = vars.find((v) => v.key === 'HUB_FQDN')?.value?.trim()
  if (!hubFqdn) {
    return { ok: false, error: 'HUB_FQDN must be set to save a named environment profile.' }
  }
  const saved = writeEnvFile(vars)
  const filename = `${PROFILE_PREFIX}${sanitizeFilenamePart(hubFqdn)}`
  fs.writeFileSync(path.resolve(process.cwd(), filename), serializeEnvContent(saved), 'utf-8')
  return { ok: true, filename }
}

/** Copies a previously-saved profile's contents over .env. Rejects anything not in listEnvProfiles(). */
export function activateEnvProfile(filename: string): { ok: true } | { ok: false; error: string } {
  const known = listEnvProfiles().find((p) => p.filename === filename)
  if (!known) {
    return { ok: false, error: `Unknown environment profile: ${filename}` }
  }
  const content = fs.readFileSync(path.resolve(process.cwd(), known.filename), 'utf-8')
  fs.writeFileSync(ENV_PATH, content, 'utf-8')
  return { ok: true }
}
