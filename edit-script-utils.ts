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

/** Escapes text for safe embedding inside a new template literal. */
function toTemplateLiteralSource(text: string): string {
  const escaped = text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
  return '`' + escaped + '`'
}

type EditOutcome = { status: 'updated'; filePath: string } | { status: 'stale' } | { status: 'not-found' }

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

  const start = targetNode.getStart(sourceFile)
  const end = targetNode.getEnd()
  const updatedSource = source.slice(0, start) + toTemplateLiteralSource(newCode) + source.slice(end)
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
