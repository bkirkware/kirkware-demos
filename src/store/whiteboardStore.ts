import { create } from 'zustand'

export type WhiteboardTool = 'select' | 'pen' | 'highlighter' | 'text' | 'rectangle' | 'ellipse' | 'arrow' | 'eraser'

export interface Point {
  x: number
  y: number
}

interface BaseAnnotation {
  id: string
  color: string
}

export interface PenAnnotation extends BaseAnnotation {
  tool: 'pen' | 'highlighter'
  points: Point[]
}

export interface ShapeAnnotation extends BaseAnnotation {
  tool: 'rectangle' | 'ellipse' | 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface TextAnnotation extends BaseAnnotation {
  tool: 'text'
  x: number
  y: number
  text: string
}

export type Annotation = PenAnnotation | ShapeAnnotation | TextAnnotation

export const WHITEBOARD_COLORS = ['#22d3ee', '#f472b6', '#fbbf24', '#34d399', '#f8fafc'] as const

interface WhiteboardState {
  activeTool: WhiteboardTool
  activeColor: string
  annotationsByDiagram: Record<string, Annotation[]>
  setTool: (tool: WhiteboardTool) => void
  setColor: (color: string) => void
  addAnnotation: (diagramId: string, annotation: Annotation) => void
  removeAnnotation: (diagramId: string, annotationId: string) => void
  undo: (diagramId: string) => void
  clearDiagram: (diagramId: string) => void
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  activeTool: 'select',
  activeColor: WHITEBOARD_COLORS[0],
  annotationsByDiagram: {},

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),

  addAnnotation: (diagramId, annotation) =>
    set((state) => ({
      annotationsByDiagram: {
        ...state.annotationsByDiagram,
        [diagramId]: [...(state.annotationsByDiagram[diagramId] ?? []), annotation],
      },
    })),

  removeAnnotation: (diagramId, annotationId) =>
    set((state) => ({
      annotationsByDiagram: {
        ...state.annotationsByDiagram,
        [diagramId]: (state.annotationsByDiagram[diagramId] ?? []).filter((a) => a.id !== annotationId),
      },
    })),

  undo: (diagramId) =>
    set((state) => ({
      annotationsByDiagram: {
        ...state.annotationsByDiagram,
        [diagramId]: (state.annotationsByDiagram[diagramId] ?? []).slice(0, -1),
      },
    })),

  clearDiagram: (diagramId) =>
    set((state) => ({
      annotationsByDiagram: { ...state.annotationsByDiagram, [diagramId]: [] },
    })),
}))
