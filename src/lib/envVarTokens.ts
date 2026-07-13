export interface VarMatch {
  start: number
  end: number
  varName: string
}

export interface TokenSegment {
  text: string
  varName?: string
}

const VAR_PATTERN = /\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g

export interface EnvVarLookup {
  value: string
  sensitive: boolean
}

/**
 * Replaces `$VAR` / `${VAR}` references in prose/markdown with their live
 * .env value. Unknown names are left untouched; sensitive values are never
 * substituted so they can't leak into rendered text or link hrefs.
 */
export function interpolateEnvVars(text: string, vars: Record<string, EnvVarLookup>): string {
  return text.replace(VAR_PATTERN, (match, varName: string) => {
    const info = vars[varName]
    if (!info || info.sensitive) return match
    return info.value
  })
}

/** Finds `$VAR` / `${VAR}` references in a line of code that match a known env var name. */
export function findVarMatches(lineText: string, knownVarNames: ReadonlySet<string>): VarMatch[] {
  const matches: VarMatch[] = []
  for (const m of lineText.matchAll(VAR_PATTERN)) {
    const varName = m[1]
    if (!knownVarNames.has(varName)) continue
    const start = m.index ?? 0
    matches.push({ start, end: start + m[0].length, varName })
  }
  return matches
}

/**
 * Splits a single highlighted token's text into plain/variable segments using
 * line-relative offsets, so a variable reference is still detected correctly
 * even if the syntax highlighter split it across multiple tokens.
 */
export function splitTokenByMatches(tokenStart: number, tokenContent: string, matches: VarMatch[]): TokenSegment[] {
  const tokenEnd = tokenStart + tokenContent.length
  const overlapping = matches.filter((m) => m.start < tokenEnd && m.end > tokenStart)
  if (overlapping.length === 0) return [{ text: tokenContent }]

  const segments: TokenSegment[] = []
  let cursor = 0
  for (const m of overlapping) {
    const localStart = Math.max(0, m.start - tokenStart)
    const localEnd = Math.min(tokenContent.length, m.end - tokenStart)
    if (localStart > cursor) segments.push({ text: tokenContent.slice(cursor, localStart) })
    segments.push({ text: tokenContent.slice(localStart, localEnd), varName: m.varName })
    cursor = localEnd
  }
  if (cursor < tokenContent.length) segments.push({ text: tokenContent.slice(cursor) })
  return segments
}
