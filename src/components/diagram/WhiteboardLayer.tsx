import { useRef, useState } from 'react'
import {
  useWhiteboardStore,
  type Annotation,
  type PenAnnotation,
  type Point,
  type ShapeAnnotation,
  type TextAnnotation,
} from '@/store/whiteboardStore'
import { findAnnotationAt } from '@/lib/whiteboardHitTest'

interface Props {
  diagramId: string
  width: number
  height: number
}

function newId(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `wb-${Date.now()}-${Math.random()}`
}

// Stable reference for the "no annotations yet" case — returning a fresh []
// from the selector on every call never settles, which useSyncExternalStore
// (what zustand's hook is built on) treats as a changed snapshot forever,
// causing an infinite re-render loop.
const EMPTY_ANNOTATIONS: Annotation[] = []

function renderShape(a: ShapeAnnotation, key: string) {
  const x = Math.min(a.x1, a.x2)
  const y = Math.min(a.y1, a.y2)
  const width = Math.abs(a.x2 - a.x1)
  const height = Math.abs(a.y2 - a.y1)
  if (a.tool === 'rectangle') {
    return <rect key={key} x={x} y={y} width={width} height={height} stroke={a.color} strokeWidth={2.5} fill="none" rx={4} />
  }
  if (a.tool === 'ellipse') {
    return (
      <ellipse
        key={key}
        cx={x + width / 2}
        cy={y + height / 2}
        rx={width / 2}
        ry={height / 2}
        stroke={a.color}
        strokeWidth={2.5}
        fill="none"
      />
    )
  }
  return (
    <line
      key={key}
      x1={a.x1}
      y1={a.y1}
      x2={a.x2}
      y2={a.y2}
      stroke={a.color}
      strokeWidth={2.5}
      markerEnd={`url(#wb-arrow-${a.color.replace('#', '')})`}
    />
  )
}

function renderPen(a: PenAnnotation, key: string) {
  const points = a.points.map((p) => `${p.x},${p.y}`).join(' ')
  const isHighlighter = a.tool === 'highlighter'
  return (
    <polyline
      key={key}
      points={points}
      fill="none"
      stroke={a.color}
      strokeWidth={isHighlighter ? 18 : 3}
      strokeOpacity={isHighlighter ? 0.35 : 1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function renderDraft(draft: PenAnnotation | ShapeAnnotation) {
  switch (draft.tool) {
    case 'pen':
    case 'highlighter':
      return renderPen(draft, 'draft')
    case 'rectangle':
    case 'ellipse':
    case 'arrow':
      return renderShape(draft, 'draft')
  }
}

function renderAnnotation(a: Annotation) {
  switch (a.tool) {
    case 'pen':
    case 'highlighter':
      return renderPen(a, a.id)
    case 'text':
      return renderText(a, a.id)
    case 'rectangle':
    case 'ellipse':
    case 'arrow':
      return renderShape(a, a.id)
  }
}

function renderText(a: TextAnnotation, key: string) {
  if (!a.text) return null
  return (
    <text key={key} x={a.x} y={a.y} fill={a.color} fontSize={16} fontFamily="var(--font-sans)">
      {a.text}
    </text>
  )
}

export function WhiteboardLayer({ diagramId, width, height }: Props) {
  const activeTool = useWhiteboardStore((s) => s.activeTool)
  const activeColor = useWhiteboardStore((s) => s.activeColor)
  const annotations = useWhiteboardStore((s) => s.annotationsByDiagram[diagramId] ?? EMPTY_ANNOTATIONS)
  const addAnnotation = useWhiteboardStore((s) => s.addAnnotation)
  const removeAnnotation = useWhiteboardStore((s) => s.removeAnnotation)

  const svgRef = useRef<SVGSVGElement>(null)
  const [draft, setDraft] = useState<PenAnnotation | ShapeAnnotation | null>(null)
  const [editingText, setEditingText] = useState<{ id: string; x: number; y: number; value: string } | null>(null)
  const isDrawing = useRef(false)

  function toDiagramPoint(clientX: number, clientY: number): Point {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const scaleX = width / rect.width
    const scaleY = height / rect.height
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (activeTool === 'select') return
    const point = toDiagramPoint(e.clientX, e.clientY)

    if (activeTool === 'eraser') {
      const hit = findAnnotationAt(annotations, point)
      if (hit) removeAnnotation(diagramId, hit.id)
      return
    }

    if (activeTool === 'text') {
      setEditingText({ id: newId(), x: point.x, y: point.y, value: '' })
      return
    }

    isDrawing.current = true
    e.currentTarget.setPointerCapture(e.pointerId)

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setDraft({ id: newId(), tool: activeTool, color: activeColor, points: [point] })
    } else {
      setDraft({ id: newId(), tool: activeTool, color: activeColor, x1: point.x, y1: point.y, x2: point.x, y2: point.y })
    }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!isDrawing.current || !draft) return
    const point = toDiagramPoint(e.clientX, e.clientY)
    setDraft((prev) => {
      if (!prev) return prev
      switch (prev.tool) {
        case 'pen':
        case 'highlighter':
          return { ...prev, points: [...prev.points, point] }
        case 'rectangle':
        case 'ellipse':
        case 'arrow':
          return { ...prev, x2: point.x, y2: point.y }
      }
    })
  }

  function handlePointerUp() {
    if (!isDrawing.current) return
    isDrawing.current = false
    if (draft) {
      addAnnotation(diagramId, draft)
    }
    setDraft(null)
  }

  function commitText() {
    if (editingText && editingText.value.trim()) {
      addAnnotation(diagramId, {
        id: editingText.id,
        tool: 'text',
        color: activeColor,
        x: editingText.x,
        y: editingText.y,
        text: editingText.value,
      })
    }
    setEditingText(null)
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      width={width}
      height={height}
      style={{ pointerEvents: activeTool === 'select' ? 'none' : 'auto', cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <defs>
        {['#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#f8fafc'].map((color) => (
          <marker
            key={color}
            id={`wb-arrow-${color.replace('#', '')}`}
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={color} />
          </marker>
        ))}
      </defs>

      {annotations.map((a) => renderAnnotation(a))}

      {draft && renderDraft(draft)}

      {editingText && (
        <foreignObject x={editingText.x} y={editingText.y - 20} width={220} height={36}>
          <input
            autoFocus
            value={editingText.value}
            onChange={(e) => setEditingText((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') commitText()
            }}
            className="w-full rounded border border-cyan-400/50 bg-[#0a0d16] px-1.5 py-0.5 text-sm text-slate-100 outline-none"
            style={{ color: activeColor }}
          />
        </foreignObject>
      )}
    </svg>
  )
}
