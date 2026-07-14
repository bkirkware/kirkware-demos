import type { Annotation, Point } from '@/store/whiteboardStore'

const HIT_PADDING = 10

function boundsOf(a: Annotation): { minX: number; minY: number; maxX: number; maxY: number } {
  switch (a.tool) {
    case 'pen':
    case 'highlighter': {
      const xs = a.points.map((p) => p.x)
      const ys = a.points.map((p) => p.y)
      return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
    }
    case 'text': {
      const width = Math.max(24, a.text.length * 8 + 16)
      return { minX: a.x, minY: a.y - 18, maxX: a.x + width, maxY: a.y + 6 }
    }
    case 'rectangle':
    case 'ellipse':
    case 'arrow':
      return {
        minX: Math.min(a.x1, a.x2),
        minY: Math.min(a.y1, a.y2),
        maxX: Math.max(a.x1, a.x2),
        maxY: Math.max(a.y1, a.y2),
      }
  }
}

/** Finds the topmost annotation whose (padded) bounding box contains the point — good enough for a simple eraser. */
export function findAnnotationAt(annotations: Annotation[], point: Point): Annotation | null {
  for (let i = annotations.length - 1; i >= 0; i--) {
    const a = annotations[i]
    const b = boundsOf(a)
    if (
      point.x >= b.minX - HIT_PADDING &&
      point.x <= b.maxX + HIT_PADDING &&
      point.y >= b.minY - HIT_PADDING &&
      point.y <= b.maxY + HIT_PADDING
    ) {
      return a
    }
  }
  return null
}
