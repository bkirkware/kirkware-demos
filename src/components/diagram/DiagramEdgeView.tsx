import { motion } from 'framer-motion'
import type { DiagramEdgeDef, DiagramNodeDef } from '@/types/demo'
import { computeEdgeGeometry } from './layout'

export function DiagramEdgeView({
  edge,
  source,
  target,
  active,
}: {
  edge: DiagramEdgeDef
  source: DiagramNodeDef
  target: DiagramNodeDef
  active?: boolean
}) {
  const { path, midpoint } = computeEdgeGeometry(source, target)
  const stroke = active ? '#22d3ee' : 'rgba(148,163,184,0.55)'
  const markerId = `arrow-${edge.id}`

  return (
    <g>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9.5"
          refY="5"
          markerWidth="13"
          markerHeight="13"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill={stroke} />
        </marker>
      </defs>
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={active ? 2.75 : 2}
        strokeDasharray={edge.dashed || edge.animated ? '7 7' : undefined}
        markerEnd={`url(#${markerId})`}
        style={edge.animated ? { animation: 'dash-flow 1.1s linear infinite' } : undefined}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
      />
      {edge.label && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <rect
            x={midpoint.x - edge.label.length * 4.1 - 8}
            y={midpoint.y - 13}
            width={edge.label.length * 8.2 + 16}
            height={24}
            rx={6}
            fill="#0b0e18"
            stroke="rgba(255,255,255,0.1)"
          />
          <text
            x={midpoint.x}
            y={midpoint.y + 4}
            textAnchor="middle"
            fontSize="13"
            fontFamily="var(--font-mono)"
            fill={active ? '#67e8f9' : '#94a3b8'}
          >
            {edge.label}
          </text>
        </motion.g>
      )}
    </g>
  )
}
