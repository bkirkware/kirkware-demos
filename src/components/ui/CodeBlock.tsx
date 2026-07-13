import { useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Play, Terminal } from 'lucide-react'
import type { CommandBlock } from '@/types/demo'

export function CodeBlock({ block }: { block: CommandBlock }) {
  const [copied, setCopied] = useState(false)
  const [ran, setRan] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0d16] shadow-lg shadow-black/30">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Terminal size={13} />
          <span className="font-mono">{block.label ?? block.lang}</span>
        </div>
        <div className="flex items-center gap-2">
          {block.output && !ran && (
            <button
              onClick={() => setRan(true)}
              className="flex items-center gap-1 rounded-md bg-cyan-400/10 px-2 py-1 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
            >
              <Play size={12} /> Run
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <Highlight theme={themes.nightOwl} code={block.code.trim()} language={block.lang as never}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} overflow-x-auto px-4 py-3 text-[13px] leading-relaxed`}
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>

      <AnimatePresence>
        {ran && block.output && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/10 bg-black/40"
          >
            <div className="px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-emerald-300/90">
              {block.output}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
