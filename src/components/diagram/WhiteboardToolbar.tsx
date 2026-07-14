import {
  Eraser,
  Highlighter,
  MousePointer2,
  MoveUpRight,
  PenLine,
  Square,
  Circle,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react'
import { useWhiteboardStore, WHITEBOARD_COLORS, type WhiteboardTool } from '@/store/whiteboardStore'

const TOOLS: { tool: WhiteboardTool; icon: typeof MousePointer2; label: string }[] = [
  { tool: 'select', icon: MousePointer2, label: 'Select / pan' },
  { tool: 'pen', icon: PenLine, label: 'Pen' },
  { tool: 'highlighter', icon: Highlighter, label: 'Highlighter' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'rectangle', icon: Square, label: 'Rectangle' },
  { tool: 'ellipse', icon: Circle, label: 'Ellipse' },
  { tool: 'arrow', icon: MoveUpRight, label: 'Arrow' },
  { tool: 'eraser', icon: Eraser, label: 'Eraser (click an annotation)' },
]

export function WhiteboardToolbar({ diagramId }: { diagramId: string }) {
  const activeTool = useWhiteboardStore((s) => s.activeTool)
  const activeColor = useWhiteboardStore((s) => s.activeColor)
  const setTool = useWhiteboardStore((s) => s.setTool)
  const setColor = useWhiteboardStore((s) => s.setColor)
  const undo = useWhiteboardStore((s) => s.undo)
  const clearDiagram = useWhiteboardStore((s) => s.clearDiagram)
  const hasAnnotations = useWhiteboardStore((s) => (s.annotationsByDiagram[diagramId]?.length ?? 0) > 0)

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0f1220]/95 p-1.5 shadow-lg shadow-black/40 backdrop-blur-sm">
      {TOOLS.map(({ tool, icon: Icon, label }) => (
        <button
          key={tool}
          onClick={() => setTool(tool)}
          title={label}
          aria-label={label}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
            activeTool === tool ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-300 hover:bg-white/10'
          }`}
        >
          <Icon size={15} />
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-white/10" />

      <div className="flex items-center gap-1 px-0.5">
        {WHITEBOARD_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setColor(color)}
            title={color}
            aria-label={`Color ${color}`}
            className={`h-5 w-5 shrink-0 rounded-full transition ${
              activeColor === color ? 'ring-2 ring-white/70 ring-offset-1 ring-offset-[#0f1220]' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-white/10" />

      <button
        onClick={() => undo(diagramId)}
        disabled={!hasAnnotations}
        title="Undo last annotation"
        aria-label="Undo last annotation"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Undo2 size={15} />
      </button>
      <button
        onClick={() => clearDiagram(diagramId)}
        disabled={!hasAnnotations}
        title="Clear all annotations on this diagram"
        aria-label="Clear all annotations"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-400/20 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}
