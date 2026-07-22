import type { DemoStep, DiagramDef } from '../src/types/demo.ts'
import { ContentError, type ContentWarning } from './errors.ts'
import type { ParsedStep } from './parseSection.ts'

/**
 * Cross-cutting checks that need the fully assembled demo: diagram reveal
 * resolution, duplicate step ids, live-command allowlist membership, and
 * icon-name existence. Structural per-step checks live in parseSection.ts
 * where the line numbers are.
 */

export interface ValidateOptions {
  /** Valid `live=` ids (keys of ALLOWED_COMMANDS). */
  liveIds: ReadonlySet<string>
  /** Valid icon names (bullet `icon:` and diagram node icons). */
  iconNames: ReadonlySet<string>
}

/**
 * Resolves a diagram step's reveal sugar (`show`/`add`/`remove`/`active`,
 * mixed node and edge ids) into the typed visible/active id lists, relative
 * to the previous step on the same diagram when `add`/`remove` are used.
 * Mutates `step.fields` in place.
 */
export function resolveDiagramSugar(steps: ParsedStep[], diagrams: Map<string, DiagramDef>, warnings: ContentWarning[]): void {
  // Running visible sets per diagram id, in demo step order.
  const lastVisible = new Map<string, { nodes: Set<string>; edges: Set<string> }>()

  for (const step of steps) {
    if (step.type !== 'diagram') continue
    const diagramId = step.fields['diagramId'] as string
    const def = diagrams.get(diagramId)
    if (!def) {
      const known = [...diagrams.keys()]
      throw new ContentError(
        step.file,
        step.line,
        `unknown diagram "${diagramId}"${known.length > 0 ? ` — defined diagrams: ${known.join(', ')}` : ' — this demo has no diagrams.yaml'}`,
      )
    }
    const nodeIds = new Set(def.nodes.map((n) => n.id))
    const edgeIds = new Set(def.edges.map((e) => e.id))

    const split = (what: string, ids: string[]): { nodes: string[]; edges: string[] } => {
      const out = { nodes: [] as string[], edges: [] as string[] }
      for (const id of ids) {
        if (nodeIds.has(id)) out.nodes.push(id)
        else if (edgeIds.has(id)) out.edges.push(id)
        else {
          throw new ContentError(step.file, step.line, `\`${what}:\` id "${id}" is not a node or edge of diagram "${diagramId}"`)
        }
      }
      return out
    }

    let visibleNodes: Set<string>
    let visibleEdges: Set<string>

    const explicitNodes = step.fields['visibleNodeIds'] as string[] | undefined
    const explicitEdges = step.fields['visibleEdgeIds'] as string[] | undefined
    if (explicitNodes != null || explicitEdges != null) {
      for (const id of explicitNodes ?? []) {
        if (!nodeIds.has(id)) throw new ContentError(step.file, step.line, `visibleNodeIds: "${id}" is not a node of "${diagramId}"`)
      }
      for (const id of explicitEdges ?? []) {
        if (!edgeIds.has(id)) throw new ContentError(step.file, step.line, `visibleEdgeIds: "${id}" is not an edge of "${diagramId}"`)
      }
      visibleNodes = new Set(explicitNodes ?? [])
      visibleEdges = new Set(explicitEdges ?? [])
    } else if (step.diagram.show) {
      const s = split('show', step.diagram.show)
      visibleNodes = new Set(s.nodes)
      visibleEdges = new Set(s.edges)
    } else if (step.diagram.add || step.diagram.remove) {
      const prev = lastVisible.get(diagramId)
      if (!prev) {
        throw new ContentError(
          step.file,
          step.line,
          `\`add:\`/\`remove:\` are relative to the previous step on diagram "${diagramId}", but this is its first step — use \`show:\``,
        )
      }
      visibleNodes = new Set(prev.nodes)
      visibleEdges = new Set(prev.edges)
      if (step.diagram.add) {
        const a = split('add', step.diagram.add)
        a.nodes.forEach((id) => visibleNodes.add(id))
        a.edges.forEach((id) => visibleEdges.add(id))
      }
      if (step.diagram.remove) {
        const r = split('remove', step.diagram.remove)
        r.nodes.forEach((id) => visibleNodes.delete(id))
        r.edges.forEach((id) => visibleEdges.delete(id))
      }
    } else {
      throw new ContentError(step.file, step.line, 'diagram steps need `show:` (or `add:`/`remove:`) to say what is visible')
    }

    step.fields['visibleNodeIds'] = [...visibleNodes]
    step.fields['visibleEdgeIds'] = [...visibleEdges]
    lastVisible.set(diagramId, { nodes: visibleNodes, edges: visibleEdges })

    if (step.diagram.active) {
      const a = split('active', step.diagram.active)
      for (const id of [...a.nodes, ...a.edges]) {
        if (!visibleNodes.has(id) && !visibleEdges.has(id)) {
          warnings.push({ file: step.file, line: step.line, message: `\`active:\` id "${id}" is not visible on this step` })
        }
      }
      if (a.nodes.length > 0) step.fields['activeNodeIds'] = a.nodes
      if (a.edges.length > 0) step.fields['activeEdgeIds'] = a.edges
    }
  }
}

/** Demo-wide checks on the final typed steps. */
export function validateSteps(
  demoId: string,
  steps: (DemoStep & { __file?: string; __line?: number })[],
  diagrams: DiagramDef[],
  opts: ValidateOptions,
  warnings: ContentWarning[],
): void {
  const seen = new Map<string, string>()
  for (const step of steps) {
    const where = step.__file ?? demoId
    const line = step.__line
    if (seen.has(step.id)) {
      throw new ContentError(where, line, `duplicate step id "${step.id}" (also used in ${seen.get(step.id)})`)
    }
    seen.set(step.id, `${where}${line != null ? `:${line}` : ''}`)

    if (step.type === 'command') {
      for (const cmd of step.commands) {
        if (cmd.liveId && !opts.liveIds.has(cmd.liveId)) {
          throw new ContentError(
            where,
            line,
            `live="${cmd.liveId}" is not in ALLOWED_COMMANDS (run-live-commands.ts) — add it there or remove the live= attribute`,
          )
        }
      }
    }
    if (step.type === 'content') {
      for (const bullet of step.bullets ?? []) {
        if (bullet.icon && !opts.iconNames.has(bullet.icon)) {
          warnings.push({ file: where, line, message: `unknown icon "${bullet.icon}" (see src/components/ui/iconNames.ts)` })
        }
      }
    }
  }
  for (const diagram of diagrams) {
    for (const node of diagram.nodes) {
      if (node.icon && !opts.iconNames.has(node.icon)) {
        warnings.push({ file: demoId, message: `diagram "${diagram.id}" node "${node.id}": unknown icon "${node.icon}"` })
      }
    }
  }
}
