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

/** Resolves a dot-path like "callout.label" to the final PropertyAssignment, descending through nested object literals. */
function findNestedProp(root: ts.ObjectLiteralExpression, pathParts: string[]): ts.PropertyAssignment | undefined {
  let current = root
  for (let i = 0; i < pathParts.length - 1; i++) {
    const prop = findProp(current, pathParts[i])
    if (!prop || !ts.isObjectLiteralExpression(prop.initializer)) return undefined
    current = prop.initializer
  }
  return findProp(current, pathParts[pathParts.length - 1])
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

/** Finds a scalar text field (top-level, or a dot-path like "callout.label") on the step identified by `stepId`. */
function tryUpdateFieldInFile(filePath: string, stepId: string, fieldPath: string, oldValue: string, newValue: string): EditOutcome {
  const source = fs.readFileSync(filePath, 'utf-8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)
  const pathParts = fieldPath.split('.')

  let sawStale = false

  function visit(node: ts.Node): ts.Expression | undefined {
    if (isStepObject(node)) {
      const idProp = findProp(node, 'id')!
      const idValue = stringLikeValue(idProp.initializer)
      if (idValue === stepId) {
        const targetProp = findNestedProp(node, pathParts)
        if (targetProp) {
          const currentValue = stringLikeValue(targetProp.initializer)
          if (currentValue !== null) {
            if (currentValue.trim() === oldValue.trim()) {
              return targetProp.initializer
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
