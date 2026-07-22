import { parse as parseYaml } from 'yaml'
import type { DiagramDef, DiagramEdgeDef, DiagramGroupDef, DiagramNodeDef, DiagramNodeKind } from '../src/types/demo.ts'
import { ContentError } from './errors.ts'

/**
 * Parses a demo's diagrams.yaml — a top-level mapping of diagram id to
 * { nodes, edges, groups? }, mirroring DiagramDef 1:1. Edge ids may be
 * omitted, in which case `e-<source>-<target>` is generated (and must end up
 * unique). All structural problems throw ContentError with the diagram id
 * and item index in the message, since YAML line numbers aren't tracked here.
 */

const NODE_KINDS: readonly DiagramNodeKind[] = [
  'client',
  'gateway',
  'service',
  'model',
  'data',
  'security',
  'observability',
  'external',
  'platform',
]

export function parseDiagrams(file: string, source: string): DiagramDef[] {
  let doc: unknown
  try {
    doc = parseYaml(source)
  } catch (err) {
    throw new ContentError(file, undefined, `invalid YAML: ${err instanceof Error ? err.message : String(err)}`)
  }
  if (doc == null) return []
  if (typeof doc !== 'object' || Array.isArray(doc)) {
    throw new ContentError(file, undefined, 'expected a top-level mapping of diagram-id to { nodes, edges, groups }')
  }

  const diagrams: DiagramDef[] = []
  for (const [id, value] of Object.entries(doc as Record<string, unknown>)) {
    diagrams.push(parseDiagram(file, id, value))
  }
  return diagrams
}

function parseDiagram(file: string, id: string, value: unknown): DiagramDef {
  const fail = (msg: string): never => {
    throw new ContentError(file, undefined, `diagram "${id}": ${msg}`)
  }
  if (value == null || typeof value !== 'object' || Array.isArray(value)) fail('expected { nodes, edges, groups? }')
  const obj = value as Record<string, unknown>
  for (const key of Object.keys(obj)) {
    if (!['nodes', 'edges', 'groups'].includes(key)) fail(`unknown key \`${key}\` — expected nodes, edges, groups`)
  }
  if (!Array.isArray(obj['nodes']) || obj['nodes'].length === 0) fail('needs a non-empty `nodes:` list')

  const groups: DiagramGroupDef[] | undefined = obj['groups'] == null ? undefined : parseGroups(fail, obj['groups'])
  const groupIds = new Set((groups ?? []).map((g) => g.id))

  const nodes: DiagramNodeDef[] = (obj['nodes'] as unknown[]).map((n, i) => parseNode(fail, groupIds, n, i))
  const nodeIds = new Set<string>()
  for (const n of nodes) {
    if (nodeIds.has(n.id)) fail(`duplicate node id "${n.id}"`)
    nodeIds.add(n.id)
  }

  const edges: DiagramEdgeDef[] = obj['edges'] == null ? [] : parseEdges(fail, nodeIds, obj['edges'])
  const seenEdges = new Set<string>()
  for (const e of edges) {
    if (nodeIds.has(e.id)) fail(`edge id "${e.id}" collides with a node id`)
    if (seenEdges.has(e.id)) fail(`duplicate edge id "${e.id}"`)
    seenEdges.add(e.id)
  }

  const def: DiagramDef = { id, nodes, edges }
  if (groups) def.groups = groups
  return def
}

function parseNode(fail: (msg: string) => never, groupIds: Set<string>, value: unknown, index: number): DiagramNodeDef {
  if (value == null || typeof value !== 'object') fail(`nodes[${index}] must be a mapping`)
  const n = value as Record<string, unknown>
  const where = `nodes[${index}]${typeof n['id'] === 'string' ? ` ("${n['id']}")` : ''}`
  if (typeof n['id'] !== 'string' || !n['id']) fail(`${where} needs an \`id\``)
  if (typeof n['label'] !== 'string' || !n['label']) fail(`${where} needs a \`label\``)
  if (typeof n['kind'] !== 'string' || !(NODE_KINDS as readonly string[]).includes(n['kind'])) {
    fail(`${where} needs \`kind:\` one of ${NODE_KINDS.join(', ')}`)
  }
  const pos = parsePoint(n['position'])
  if (!pos) fail(`${where} needs \`position: { x: <n>, y: <n> }\``)
  for (const key of Object.keys(n)) {
    if (!['id', 'label', 'sublabel', 'icon', 'kind', 'position', 'width', 'group'].includes(key)) {
      fail(`${where} has unknown key \`${key}\``)
    }
  }
  if (n['group'] != null && !groupIds.has(n['group'] as string)) {
    fail(`${where} references unknown group "${String(n['group'])}"`)
  }
  const node: DiagramNodeDef = {
    id: n['id'] as string,
    label: n['label'] as string,
    kind: n['kind'] as DiagramNodeKind,
    position: pos,
  }
  if (typeof n['sublabel'] === 'string') node.sublabel = n['sublabel']
  if (typeof n['icon'] === 'string') node.icon = n['icon']
  if (typeof n['width'] === 'number') node.width = n['width']
  if (typeof n['group'] === 'string') node.group = n['group']
  return node
}

function parseEdges(fail: (msg: string) => never, nodeIds: Set<string>, value: unknown): DiagramEdgeDef[] {
  if (!Array.isArray(value)) fail('`edges:` must be a list')
  return (value as unknown[]).map((v, i) => {
    if (v == null || typeof v !== 'object') fail(`edges[${i}] must be a mapping`)
    const e = v as Record<string, unknown>
    const where = `edges[${i}]${typeof e['id'] === 'string' ? ` ("${e['id']}")` : ''}`
    if (typeof e['source'] !== 'string' || !nodeIds.has(e['source'])) fail(`${where} needs \`source:\` set to a node id`)
    if (typeof e['target'] !== 'string' || !nodeIds.has(e['target'])) fail(`${where} needs \`target:\` set to a node id`)
    for (const key of Object.keys(e)) {
      if (!['id', 'source', 'target', 'label', 'animated', 'dashed', 'sourceSide', 'targetSide', 'waypoints'].includes(key)) {
        fail(`${where} has unknown key \`${key}\``)
      }
    }
    const edge: DiagramEdgeDef = {
      id: typeof e['id'] === 'string' && e['id'] ? e['id'] : `e-${e['source']}-${e['target']}`,
      source: e['source'],
      target: e['target'],
    }
    if (typeof e['label'] === 'string') edge.label = e['label']
    if (typeof e['animated'] === 'boolean') edge.animated = e['animated']
    if (typeof e['dashed'] === 'boolean') edge.dashed = e['dashed']
    for (const side of ['sourceSide', 'targetSide'] as const) {
      if (e[side] != null) {
        if (!['top', 'bottom', 'left', 'right'].includes(e[side] as string)) {
          fail(`${where} \`${side}\` must be top, bottom, left, or right`)
        }
        edge[side] = e[side] as DiagramEdgeDef['sourceSide']
      }
    }
    if (e['waypoints'] != null) {
      if (!Array.isArray(e['waypoints'])) fail(`${where} \`waypoints\` must be a list of { x, y } points`)
      edge.waypoints = (e['waypoints'] as unknown[]).map((p) => {
        const point = parsePoint(p)
        if (!point) fail(`${where} \`waypoints\` must be a list of { x, y } points`)
        return point!
      })
    }
    return edge
  })
}

function parseGroups(fail: (msg: string) => never, value: unknown): DiagramGroupDef[] {
  if (!Array.isArray(value)) fail('`groups:` must be a list')
  return (value as unknown[]).map((v, i) => {
    if (v == null || typeof v !== 'object') fail(`groups[${i}] must be a mapping`)
    const g = v as Record<string, unknown>
    const where = `groups[${i}]${typeof g['id'] === 'string' ? ` ("${g['id']}")` : ''}`
    if (typeof g['id'] !== 'string' || !g['id']) fail(`${where} needs an \`id\``)
    if (typeof g['label'] !== 'string') fail(`${where} needs a \`label\``)
    const pos = parsePoint(g['position'])
    if (!pos) fail(`${where} needs \`position: { x, y }\``)
    const size = g['size'] as Record<string, unknown> | undefined
    if (size == null || typeof size['width'] !== 'number' || typeof size['height'] !== 'number') {
      fail(`${where} needs \`size: { width, height }\``)
    }
    for (const key of Object.keys(g)) {
      if (!['id', 'label', 'position', 'size'].includes(key)) fail(`${where} has unknown key \`${key}\``)
    }
    return {
      id: g['id'] as string,
      label: g['label'] as string,
      position: pos!,
      size: { width: size!['width'] as number, height: size!['height'] as number },
    }
  })
}

function parsePoint(value: unknown): { x: number; y: number } | null {
  if (value == null || typeof value !== 'object') return null
  const p = value as Record<string, unknown>
  if (typeof p['x'] !== 'number' || typeof p['y'] !== 'number') return null
  return { x: p['x'], y: p['y'] }
}
