import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { Maximize2, Minus, Plus } from 'lucide-react'
import type { DiagramDef } from '@/types/demo'
import { useWhiteboardStore } from '@/store/whiteboardStore'
import { computeDiagramBounds } from './layout'
import { DiagramNodeView } from './DiagramNodeView'
import { DiagramEdgeView } from './DiagramEdgeView'
import { GroupFrame } from './GroupFrame'
import { WhiteboardLayer } from './WhiteboardLayer'
import { WhiteboardToolbar } from './WhiteboardToolbar'

interface Props {
  diagram: DiagramDef
  visibleNodeIds: string[]
  visibleEdgeIds: string[]
  activeNodeIds?: string[]
  activeEdgeIds?: string[]
}

const PADDING = 56
const MIN_SCALE = 0.25
const MAX_SCALE = 2.5

export function ArchitectureDiagram({
  diagram,
  visibleNodeIds,
  visibleEdgeIds,
  activeNodeIds = [],
  activeEdgeIds = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null)
  const activeTool = useWhiteboardStore((s) => s.activeTool)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const nodeMap = useMemo(() => new Map(diagram.nodes.map((n) => [n.id, n])), [diagram])
  const bounds = useMemo(() => computeDiagramBounds(diagram.nodes), [diagram])

  const visibleNodes = diagram.nodes.filter((n) => visibleNodeIds.includes(n.id))
  const visibleEdges = diagram.edges.filter(
    (e) => visibleEdgeIds.includes(e.id) && visibleNodeIds.includes(e.source) && visibleNodeIds.includes(e.target),
  )
  const visibleGroups = diagram.groups?.filter((g) =>
    diagram.nodes.some((n) => n.group === g.id && visibleNodeIds.includes(n.id)),
  )

  const fitScale = containerSize
    ? Math.min(
        (containerSize.width - PADDING * 2) / bounds.width,
        (containerSize.height - PADDING * 2) / bounds.height,
        1,
      )
    : 1

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {containerSize && (
        <TransformWrapper
          key={diagram.id}
          initialScale={fitScale}
          minScale={MIN_SCALE}
          maxScale={MAX_SCALE}
          limitToBounds={false}
          centerOnInit
          wheel={{ step: 0.1 }}
          doubleClick={{ mode: 'zoomIn', step: 0.6, disabled: activeTool !== 'select' }}
          panning={{ disabled: activeTool !== 'select' }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <WhiteboardToolbar diagramId={diagram.id} />

              <div className="absolute right-4 bottom-4 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-[#0f1220]/95 p-1.5 shadow-lg shadow-black/40 backdrop-blur-sm">
                <button
                  onClick={() => zoomOut()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10"
                  aria-label="Zoom out"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10"
                  aria-label="Fit to view"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => zoomIn()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10"
                  aria-label="Zoom in"
                >
                  <Plus size={16} />
                </button>
              </div>

              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                <div className="relative" style={{ width: bounds.width, height: bounds.height }}>
                  <AnimatePresence>{visibleGroups?.map((g) => <GroupFrame key={g.id} group={g} />)}</AnimatePresence>

                  <svg
                    className="absolute inset-0"
                    width={bounds.width}
                    height={bounds.height}
                    style={{ pointerEvents: 'none' }}
                  >
                    <AnimatePresence>
                      {visibleEdges.map((e) => (
                        <DiagramEdgeView
                          key={e.id}
                          edge={e}
                          source={nodeMap.get(e.source)!}
                          target={nodeMap.get(e.target)!}
                          active={activeEdgeIds.includes(e.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </svg>

                  <AnimatePresence>
                    {visibleNodes.map((n) => (
                      <DiagramNodeView key={n.id} node={n} active={activeNodeIds.includes(n.id)} />
                    ))}
                  </AnimatePresence>

                  <WhiteboardLayer diagramId={diagram.id} width={bounds.width} height={bounds.height} />
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      )}
    </div>
  )
}
