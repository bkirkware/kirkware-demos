import { motion } from 'framer-motion'
import type { DiagramNodeDef } from '@/types/demo'
import { Icon } from '@/components/ui/Icon'
import { NODE_HEIGHT, NODE_WIDTH, kindTheme } from './diagramTheme'

export function DiagramNodeView({ node, active }: { node: DiagramNodeDef; active?: boolean }) {
  const theme = kindTheme[node.kind]
  const width = node.width ?? NODE_WIDTH

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.82, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`absolute flex items-center gap-4 rounded-2xl border ${theme.border} bg-[#0f1220]/90 px-5 py-4 shadow-lg shadow-black/40 backdrop-blur-sm ${
        active ? 'animate-pulse-glow' : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width,
        height: NODE_HEIGHT,
        boxShadow: active ? `0 0 0 1px ${theme.glow}, 0 0 28px ${theme.glow}` : undefined,
      }}
    >
      {node.icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ${theme.iconColor}`}>
          <Icon name={node.icon} size={24} />
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-[17px] font-semibold text-slate-100">{node.label}</div>
        {node.sublabel && <div className="truncate text-[13px] text-slate-400">{node.sublabel}</div>}
      </div>
    </motion.div>
  )
}
