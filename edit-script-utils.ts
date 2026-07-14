import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const DEMOS_ROOT = path.resolve(process.cwd(), 'src/demos')

/** Recursively lists every .ts file under src/demos/. */
function listDemoFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listDemoFiles(full))
    } else if (entry.name.endsWith('.ts')) {
      out.push(full)
    }
  }
  return out
}

function stringLikeValue(node: ts.Expression): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return null
}

function findProp(obj: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | undefined {
  return obj.properties.find(
    (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name,
  )
}

type PathSegment = { kind: 'prop'; name: string } | { kind: 'index'; index: number }

/** Parses a path like "bullets[2].title" into [{prop:bullets}, {index:2}, {prop:title}]. */
function parsePath(fieldPath: string): PathSegment[] {
  const segments: PathSegment[] = []
  for (const part of fieldPath.split('.')) {
    const match = part.match(/^([^[\]]+)(\[(\d+)\])?$/)
    if (!match) continue
    segments.push({ kind: 'prop', name: match[1] })
    if (match[3] !== undefined) {
      segments.push({ kind: 'index', index: Number(match[3]) })
    }
  }
  return segments
}

/** Walks a parsed path from a step's object literal, descending through nested objects and array indices. */
function resolveExpression(root: ts.ObjectLiteralExpression, segments: PathSegment[]): ts.Expression | undefined {
  let current: ts.Expression = root
  for (const seg of segments) {
    if (seg.kind === 'prop') {
      if (!ts.isObjectLiteralExpression(current)) return undefined
      const prop = findProp(current, seg.name)
      if (!prop) return undefined
      current = prop.initializer
    } else {
      if (!ts.isArrayLiteralExpression(current)) return undefined
      const el = current.elements[seg.index]
      if (!el) return undefined
      current = el
    }
  }
  return current
}

/** Finds the array literal for `arrayField` on the step identified by `stepId`, across a single parsed source file. */
function findArrayLiteral(sourceFile: ts.SourceFile, stepId: string, arrayField: string): ts.ArrayLiteralExpression | undefined {
  function visit(node: ts.Node): ts.ArrayLiteralExpression | undefined {
    if (isStepObject(node)) {
      const idValue = stringLikeValue(findProp(node, 'id')!.initializer)
      if (idValue === stepId) {
        const prop = findProp(node, arrayField)
        return prop && ts.isArrayLiteralExpression(prop.initializer) ? prop.initializer : undefined
      }
    }
    return ts.forEachChild(node, visit)
  }
  return visit(sourceFile)
}

/** Serializes a new array item (plain string, or a flat string-valued object) into TS source. */
function serializeArrayItem(item: unknown): string {
  if (typeof item === 'string') return toTemplateLiteralSource(item)
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>
    const parts: string[] = []
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.length > 0) {
        parts.push(`${key}: ${toTemplateLiteralSource(value)}`)
      }
    }
    return `{ ${parts.join(', ')} }`
  }
  return toTemplateLiteralSource(String(item))
}

/** True for an object literal that looks like a DemoStep — every step type shares `id` + `type`. */
function isStepObject(node: ts.Node): node is ts.ObjectLiteralExpression {
  return ts.isObjectLiteralExpression(node) && Boolean(findProp(node, 'id')) && Boolean(findProp(node, 'type'))
}

/** Escapes text for safe embedding inside a new template literal. */
function toTemplateLiteralSource(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  return '`' + escaped + '`'
}

type EditOutcome = { status: 'updated'; filePath: string } | { status: 'stale' } | { status: 'not-found' }

/** Splices `newValue` in as a template literal replacing `targetNode`'s span, and writes the file. */
function applyEdit(filePath: string, source: string, sourceFile: ts.SourceFile, targetNode: ts.Expression, newValue: string): void {
  const start = targetNode.getStart(sourceFile)
  const end = targetNode.getEnd()
  const updatedSource = source.slice(0, start) + toTemplateLiteralSource(newValue) + source.slice(end)
  fs.writeFileSync(filePath, updatedSource, 'utf-8')
}

function tryUpdateInFile(filePath: string, stepId: string, label: string, oldCode: string, newCode: string): EditOutcome {
  const source = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

  let sawStale = false

  // Uses ts.forEachChild's return-value short-circuit protocol (returning a
  // truthy value stops the walk) rather than mutating an outer variable from
  // inside this closure — TS can't prove a closure-mutated variable is
  // non-null afterward, which would otherwise narrow it to `never`.
  function visit(node: ts.Node): ts.Expression | undefined {
    if (ts.isObjectLiteralExpression(node)) {
      const idProp = findProp(node, 'id')
      const commandsProp = findProp(node, 'commands')
      if (idProp && commandsProp && ts.isArrayLiteralExpression(commandsProp.initializer)) {
        const idValue = stringLikeValue(idProp.initializer)
        if (idValue === stepId) {
          for (const el of commandsProp.initializer.elements) {
            if (!ts.isObjectLiteralExpression(el)) continue
            const labelProp = findProp(el, 'label')
            const codeProp = findProp(el, 'code')
            if (!labelProp || !codeProp) continue
            const labelValue = stringLikeValue(labelProp.initializer)
            if (labelValue !== label) continue
            const codeValue = stringLikeValue(codeProp.initializer)
            if (codeValue === null) continue
            if (codeValue.trim() === oldCode.trim()) {
              return codeProp.initializer
            }
            sawStale = true
          }
          return undefined
        }
      }
    }
    return ts.forEachChild(node, visit)
  }
  const targetNode = visit(sourceFile)

  if (!targetNode) {
    return { status: sawStale ? 'stale' : 'not-found' }
  }

  applyEdit(filePath, source, sourceFile, targetNode, newCode)
  return { status: 'updated', filePath }
}

/** Finds a scalar text field on the step identified by `stepId` — supports dot-paths and array indices, e.g. "callout.label" or "bullets[2].title". */
function tryUpdateFieldInFile(filePath: string, stepId: string, fieldPath: string, oldValue: string, newValue: string): EditOutcome {
  const source = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)
  const segments = parsePath(fieldPath)

  let sawStale = false

  function visit(node: ts.Node): ts.Expression | undefined {
    if (isStepObject(node)) {
      const idProp = findProp(node, 'id')!
      const idValue = stringLikeValue(idProp.initializer)
      if (idValue === stepId) {
        const target = resolveExpression(node, segments)
        if (target) {
          const currentValue = stringLikeValue(target)
          if (currentValue !== null) {
            if (currentValue.trim() === oldValue.trim()) {
              return target
            }
            sawStale = true
          }
        }
        return undefined
      }
    }
    return ts.forEachChild(node, visit)
  }
  const targetNode = visit(sourceFile)

  if (!targetNode) {
    return { status: sawStale ? 'stale' : 'not-found' }
  }

  applyEdit(filePath, source, sourceFile, targetNode, newValue)
  return { status: 'updated', filePath }
}

/** Appends a new element to the end of an array field on the step identified by `stepId`. */
function tryAddArrayItemInFile(filePath: string, stepId: string, arrayField: string, item: unknown): EditOutcome {
  const source = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)
  const arrayLiteral = findArrayLiteral(sourceFile, stepId, arrayField)
  if (!arrayLiteral) return { status: 'not-found' }

  const itemSource = serializeArrayItem(item)
  const elements = arrayLiteral.elements

  let insertPos: number
  let insertText: string
  if (elements.length === 0) {
    insertPos = arrayLiteral.getStart(sourceFile) + 1
    insertText = itemSource
  } else {
    const last = elements[elements.length - 1]
    const lastStart = last.getStart(sourceFile)
    const lineStart = sourceFile.getLineStarts()[sourceFile.getLineAndCharacterOfPosition(lastStart).line]
    const indent = source.slice(lineStart, lastStart)
    insertPos = last.getEnd()
    insertText = `,\n${indent}${itemSource}`
  }

  const updatedSource = source.slice(0, insertPos) + insertText + source.slice(insertPos)
  fs.writeFileSync(filePath, updatedSource, 'utf-8')
  return { status: 'updated', filePath }
}

/** Removes the element at `index` from an array field on the step identified by `stepId`, swallowing the adjacent comma. */
function tryRemoveArrayItemInFile(
  filePath: string,
  stepId: string,
  arrayField: string,
  index: number,
  compareField: string | null,
  oldValue: string,
): EditOutcome {
  const source = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)
  const arrayLiteral = findArrayLiteral(sourceFile, stepId, arrayField)
  if (!arrayLiteral) return { status: 'not-found' }

  const elements = arrayLiteral.elements
  const target = elements[index]
  if (!target) return { status: 'not-found' }

  let currentValue: string | null
  if (compareField) {
    if (!ts.isObjectLiteralExpression(target)) return { status: 'not-found' }
    const prop = findProp(target, compareField)
    currentValue = prop ? stringLikeValue(prop.initializer) : null
  } else {
    currentValue = stringLikeValue(target)
  }
  if (currentValue === null) return { status: 'not-found' }
  if (currentValue.trim() !== oldValue.trim()) return { status: 'stale' }

  let start: number
  let end: number
  if (index < elements.length - 1) {
    start = target.getStart(sourceFile)
    end = elements[index + 1].getStart(sourceFile)
  } else if (index > 0) {
    start = elements[index - 1].getEnd()
    end = target.getEnd()
  } else {
    start = target.getStart(sourceFile)
    end = target.getEnd()
  }

  const updatedSource = source.slice(0, start) + source.slice(end)
  fs.writeFileSync(filePath, updatedSource, 'utf-8')
  return { status: 'updated', filePath }
}

export interface EditScriptResult {
  ok: boolean
  error?: string
  filePath?: string
}

/** Finds the command block identified by (stepId, label) across every demo section file and rewrites its code. */
export function updateScriptCode(stepId: string, label: string, oldCode: string, newCode: string): EditScriptResult {
  if (!stepId || !label) {
    return { ok: false, error: 'stepId and label are required' }
  }
  const files = listDemoFiles(DEMOS_ROOT)
  let sawStale = false
  for (const file of files) {
    const result = tryUpdateInFile(file, stepId, label, oldCode, newCode)
    if (result.status === 'updated') {
      return { ok: true, filePath: path.relative(process.cwd(), result.filePath) }
    }
    if (result.status === 'stale') {
      sawStale = true
    }
  }
  if (sawStale) {
    return { ok: false, error: 'The script on disk no longer matches what was displayed — reload and try again.' }
  }
  return { ok: false, error: `Could not find a "${label}" script on step "${stepId}"` }
}

/** Finds the scalar text field identified by (stepId, fieldPath) across every demo section file and rewrites it. */
export function updateStepField(stepId: string, fieldPath: string, oldValue: string, newValue: string): EditScriptResult {
  if (!stepId || !fieldPath) {
    return { ok: false, error: 'stepId and field are required' }
  }
  const files = listDemoFiles(DEMOS_ROOT)
  let sawStale = false
  for (const file of files) {
    const result = tryUpdateFieldInFile(file, stepId, fieldPath, oldValue, newValue)
    if (result.status === 'updated') {
      return { ok: true, filePath: path.relative(process.cwd(), result.filePath) }
    }
    if (result.status === 'stale') {
      sawStale = true
    }
  }
  if (sawStale) {
    return { ok: false, error: 'The content on disk no longer matches what was displayed — reload and try again.' }
  }
  return { ok: false, error: `Could not find field "${fieldPath}" on step "${stepId}"` }
}

/** Appends `item` to the array field `arrayField` on the step identified by `stepId`. */
export function addArrayItem(stepId: string, arrayField: string, item: unknown): EditScriptResult {
  if (!stepId || !arrayField) {
    return { ok: false, error: 'stepId and field are required' }
  }
  const files = listDemoFiles(DEMOS_ROOT)
  for (const file of files) {
    const result = tryAddArrayItemInFile(file, stepId, arrayField, item)
    if (result.status === 'updated') {
      return { ok: true, filePath: path.relative(process.cwd(), result.filePath) }
    }
  }
  return { ok: false, error: `Could not find array field "${arrayField}" on step "${stepId}"` }
}

/** Removes the element at `index` from the array field `arrayField` on the step identified by `stepId`. */
export function removeArrayItem(
  stepId: string,
  arrayField: string,
  index: number,
  compareField: string | null,
  oldValue: string,
): EditScriptResult {
  if (!stepId || !arrayField) {
    return { ok: false, error: 'stepId and field are required' }
  }
  const files = listDemoFiles(DEMOS_ROOT)
  let sawStale = false
  for (const file of files) {
    const result = tryRemoveArrayItemInFile(file, stepId, arrayField, index, compareField, oldValue)
    if (result.status === 'updated') {
      return { ok: true, filePath: path.relative(process.cwd(), result.filePath) }
    }
    if (result.status === 'stale') {
      sawStale = true
    }
  }
  if (sawStale) {
    return { ok: false, error: 'The item on disk no longer matches what was displayed — reload and try again.' }
  }
  return { ok: false, error: `Could not find item ${index} of array "${arrayField}" on step "${stepId}"` }
}
