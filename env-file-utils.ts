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
