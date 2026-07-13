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

export function computeEdgeGeometry(sourceNode: DiagramNodeDef, targetNode: DiagramNodeDef) {
  const source = nodeRect(sourceNode)
  const target = nodeRect(targetNode)
  const dx = target.x + target.width / 2 - (source.x + source.width / 2)
  const dy = target.y + target.height / 2 - (source.y + source.height / 2)

  let sSide: Side
  let tSide: Side
  if (Math.abs(dx) >= Math.abs(dy)) {
    sSide = dx >= 0 ? 'right' : 'left'
    tSide = dx >= 0 ? 'left' : 'right'
  } else {
    sSide = dy >= 0 ? 'bottom' : 'top'
    tSide = dy >= 0 ? 'top' : 'bottom'
  }

  const p1 = port(source, sSide)
  const p2 = port(target, tSide)

  const horizontal = sSide === 'left' || sSide === 'right'
  const gap = horizontal ? Math.abs(p2.x - p1.x) : Math.abs(p2.y - p1.y)
  // Cap control-point offset at half the port-to-port gap so curves for close
  // nodes never overshoot past each other and loop back on themselves.
  const curve = Math.max(24, Math.min(120, gap * 0.5))

  const sDir = sSide === 'right' || sSide === 'bottom' ? 1 : -1
  const tDir = tSide === 'right' || tSide === 'bottom' ? 1 : -1

  const c1: Point = horizontal
    ? { x: p1.x + sDir * curve, y: p1.y }
    : { x: p1.x, y: p1.y + sDir * curve }
  const c2: Point = horizontal
    ? { x: p2.x + tDir * curve, y: p2.y }
    : { x: p2.x, y: p2.y + tDir * curve }

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
