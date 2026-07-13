import { motion } from 'framer-motion'
import type { DiagramGroupDef } from '@/types/demo'

export function GroupFrame({ group }: { group: DiagramGroupDef }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute rounded-2xl border border-white/12 bg-white/[0.015]"
      style={{
        left: group.position.x,
        top: group.position.y,
        width: group.size.width,
        height: group.size.height,
      }}
    >
      <span className="absolute -top-3.5 left-5 rounded bg-[#05070d] px-2.5 text-[13px] font-medium tracking-wide text-slate-400 uppercase">
        {group.label}
      </span>
    </motion.div>
  )
}
