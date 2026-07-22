/**
 * A content-authoring error with file/line context. Thrown from the parser
 * and validators; the Vite plugin lets it propagate so it lands in the dev
 * overlay (and fails `vite build`) with a message an author can act on.
 */
export class ContentError extends Error {
  readonly file: string
  readonly line: number | undefined

  constructor(file: string, line: number | undefined, message: string) {
    super(line != null ? `${file}:${line} — ${message}` : `${file} — ${message}`)
    this.name = 'ContentError'
    this.file = file
    this.line = line
  }
}

/** Non-fatal authoring issues (e.g. an `active:` id that isn't visible yet). */
export interface ContentWarning {
  file: string
  line?: number
  message: string
}
