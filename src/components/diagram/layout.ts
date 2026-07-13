import type { DiagramNodeDef } from '@/types/demo'
import { NODE_HEIGHT, NODE_WIDTH } from './diagramTheme'

export interface Point {
  x: number
  y: number
}

type Side = 'top' | 'bottom' | 'left' | 'right'

function nodeRect(node: DiagramNodeDef) {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? NODE_WIDTH,
    height: NODE_HEIGHT,
  }
}

function port(rect: { x: number; y: number; width: number; height: number }, side: Side): Point {
  switch (side) {
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2 }
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y }
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height }
  }
}

function cubicAt(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const mt = 1 - t
  const a = mt ** 3
  const b = 3 * mt ** 2 * t
  const c = 3 * mt * t ** 2
  const d = t ** 3
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  }
}

function dirVec(side: Side): Point {
  switch (side) {
    case 'right':
      return { x: 1, y: 0 }
    case 'left':
      return { x: -1, y: 0 }
    case 'bottom':
      return { x: 0, y: 1 }
    case 'top':
      return { x: 0, y: -1 }
  }
}

function axisGap(side: Side, p1: Point, p2: Point): number {
  return side === 'left' || side === 'right' ? Math.abs(p2.x - p1.x) : Math.abs(p2.y - p1.y)
}

function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y)
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len }
}

/** Straight-segment polyline through `points`, with rounded corners at each interior point. */
function buildElbowPath(points: Point[], radius: number): string {
  if (points.length < 2) return ''
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`

  const parts: string[] = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]
    const corner = points[i]
    const next = points[i + 1]
    const toCorner = normalize({ x: corner.x - prev.x, y: corner.y - prev.y })
    const fromCorner = normalize({ x: next.x - corner.x, y: next.y - corner.y })
    const distIn = Math.min(radius, Math.hypot(corner.x - prev.x, corner.y - prev.y) / 2)
    const distOut = Math.min(radius, Math.hypot(next.x - corner.x, next.y - corner.y) / 2)
    const before = { x: corner.x - toCorner.x * distIn, y: corner.y - toCorner.y * distIn }
    const after = { x: corner.x + fromCorner.x * distOut, y: corner.y + fromCorner.y * distOut }
    parts.push(`L ${before.x} ${before.y}`, `Q ${corner.x} ${corner.y}, ${after.x} ${after.y}`)
  }
  const last = points[points.length - 1]
  parts.push(`L ${last.x} ${last.y}`)
  return parts.join(' ')
}

/** Point at a fraction of the way along a polyline's total straight-line length (corners ignored — close enough for label placement). */
function pointAtPolylineFraction(points: Point[], fraction: number): Point {
  const segLengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y))
  const total = segLengths.reduce((a, b) => a + b, 0)
  let target = total * fraction
  for (let i = 0; i < segLengths.length; i++) {
    if (target <= segLengths[i] || i === segLengths.length - 1) {
      const t = segLengths[i] === 0 ? 0 : target / segLengths[i]
      const a = points[i]
      const b = points[i + 1]
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    }
    target -= segLengths[i]
  }
  return points[0]
}

export function computeEdgeGeometry(
  sourceNode: DiagramNodeDef,
  targetNode: DiagramNodeDef,
  sourceSide?: Side,
  targetSide?: Side,
  waypoints?: Point[],
) {
  const source = nodeRect(sourceNode)
  const target = nodeRect(targetNode)
  const dx = target.x + target.width / 2 - (source.x + source.width / 2)
  const dy = target.y + target.height / 2 - (source.y + source.height / 2)

  let sSide: Side
  let tSide: Side
  if (sourceSide && targetSide) {
    sSide = sourceSide
    tSide = targetSide
  } else if (Math.abs(dx) >= Math.abs(dy)) {
    sSide = dx >= 0 ? 'right' : 'left'
    tSide = dx >= 0 ? 'left' : 'right'
  } else {
    sSide = dy >= 0 ? 'bottom' : 'top'
    tSide = dy >= 0 ? 'top' : 'bottom'
  }

  const p1 = port(source, sSide)
  const p2 = port(target, tSide)

  if (waypoints && waypoints.length > 0) {
    const points = [p1, ...waypoints, p2]
    const path = buildElbowPath(points, 26)
    const midpoint = pointAtPolylineFraction(points, 0.5)
    return { path, start: p1, end: p2, midpoint }
  }

  // Each control point's offset is capped at half the port-to-port gap along
  // its own exit axis, so curves for close nodes never overshoot past each
  // other and loop back on themselves. Source and target are computed
  // independently so mixed-axis routing (e.g. exit bottom, enter left) works.
  const curveS = Math.max(24, Math.min(120, axisGap(sSide, p1, p2) * 0.5))
  const curveT = Math.max(24, Math.min(120, axisGap(tSide, p1, p2) * 0.5))

  const d1 = dirVec(sSide)
  const d2 = dirVec(tSide)

  const c1: Point = { x: p1.x + d1.x * curveS, y: p1.y + d1.y * curveS }
  const c2: Point = { x: p2.x + d2.x * curveT, y: p2.y + d2.y * curveT }

  const path = `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`
  const midpoint = cubicAt(0.5, p1, c1, c2, p2)

  return { path, start: p1, end: p2, midpoint }
}

export function computeDiagramBounds(nodes: DiagramNodeDef[]) {
  if (nodes.length === 0) return { width: 800, height: 500, minX: 0, minY: 0 }
  const xs = nodes.map((n) => n.position.x + (n.width ?? NODE_WIDTH))
  const ys = nodes.map((n) => n.position.y + NODE_HEIGHT)
  const minXs = nodes.map((n) => n.position.x)
  const minYs = nodes.map((n) => n.position.y)
  return {
    width: Math.max(...xs) + 40,
    height: Math.max(...ys) + 40,
    minX: Math.min(...minXs, 0),
    minY: Math.min(...minYs, 0),
  }
}
