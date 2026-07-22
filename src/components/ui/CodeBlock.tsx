import { useMemo, useState } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, Loader2, Play, Terminal, Zap } from 'lucide-react'
import type { CommandBlock } from '@/types/demo'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { findVarMatches, splitTokenByMatches } from '@/lib/envVarTokens'
import { VariableHover } from './VariableHover'

interface LiveResult {
  stdout: string
  stderr: string
  /** Undefined while the command is still streaming — only set once the `exit` event arrives. */
  exitCode?: number
  timedOut?: boolean
  capturedVars?: string[]
  envUpdated?: string[]
}

export function CodeBlock({ block }: { block: CommandBlock }) {
  const [copied, setCopied] = useState(false)
  const [ran, setRan] = useState(false)
  const [liveRunning, setLiveRunning] = useState(false)
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null)
  const [liveError, setLiveError] = useState<string | null>(null)
  const envVars = useEnvVarsStore((s) => s.vars)
  const knownVarNames = useMemo(() => new Set(Object.keys(envVars)), [envVars])

  async function handleCopy() {
    await navigator.clipboard.writeText(block.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  async function handleRunLive() {
    if (!block.liveId) return
    setLiveRunning(true)
    setLiveError(null)
    setLiveResult(null)
    try {
      const res = await fetch('/api/run-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: block.liveId }),
      })

      if (!res.ok) {
        const data = await res.json()
        setLiveError(data.error ?? `Request failed (${res.status})`)
        return
      }
      if (!res.body) {
        setLiveError('No response body from the run-live endpoint.')
        return
      }

      // The response is newline-delimited JSON events (stdout/stderr chunks,
      // then a final exit event) rather than one buffered blob, so long-
      // running commands like `cf push` show output as it happens.
      let stdout = ''
      let stderr = ''
      setLiveResult({ stdout, stderr })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line) continue
          const event = JSON.parse(line)
          if (event.type === 'stdout') {
            stdout += event.data
            setLiveResult((prev) => ({ ...(prev ?? { stdout: '', stderr: '' }), stdout }))
          } else if (event.type === 'stderr') {
            stderr += event.data
            setLiveResult((prev) => ({ ...(prev ?? { stdout: '', stderr: '' }), stderr }))
          } else if (event.type === 'exit') {
            setLiveResult((prev) => ({
              ...(prev ?? { stdout: '', stderr: '' }),
              stdout,
              stderr,
              exitCode: event.exitCode,
              timedOut: event.timedOut,
              capturedVars: event.capturedVars,
              envUpdated: event.envUpdated,
            }))
            if (event.envUpdated?.length > 0) {
              useEnvVarsStore.getState().refresh()
            }
          }
        }
      }
    } catch {
      setLiveError('Could not reach the local run-live endpoint — is `npm run dev` running?')
    } finally {
      setLiveRunning(false)
    }
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
          {block.liveId && (
            <button
              onClick={handleRunLive}
              disabled={liveRunning}
              className="flex items-center gap-1 rounded-md bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-wait disabled:opacity-60"
              title="Executes this exact command on your machine via the local dev server"
            >
              {liveRunning ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {liveRunning ? 'Running…' : 'Run Live'}
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
            {tokens.map((line, i) => {
              const lineText = line.map((t) => t.content).join('')
              const matches = findVarMatches(lineText, knownVarNames)
              let pos = 0
              return (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token })
                    const tokenStart = pos
                    pos += token.content.length
                    const segments = splitTokenByMatches(tokenStart, token.content, matches)
                    if (segments.length === 1 && segments[0].varName === undefined) {
                      return <span key={key} {...tokenProps} />
                    }
                    return (
                      <span key={key} className={tokenProps.className} style={tokenProps.style}>
                        {segments.map((seg, si) =>
                          seg.varName ? (
                            <VariableHover key={si} text={seg.text} varName={seg.varName} />
                          ) : (
                            <span key={si}>{seg.text}</span>
                          ),
                        )}
                      </span>
                    )
                  })}
                </div>
              )
            })}
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
            <div className="flex items-center gap-1.5 px-4 pt-2.5 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
              Simulated output
            </div>
            <div className="px-4 py-2.5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-emerald-300/90">
              {block.output}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(liveError || liveResult) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden border-t border-amber-400/20 bg-black/40"
          >
            <div className="flex items-center gap-1.5 px-4 pt-2.5 text-[10px] font-medium tracking-wide text-amber-400/80 uppercase">
              <Zap size={11} /> Live output — ran on your machine
            </div>
            {liveError && <div className="px-4 py-2.5 font-mono text-[12.5px] text-rose-300/90">{liveError}</div>}
            {liveResult && (
              <div className="px-4 py-2.5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
                {liveResult.stdout && <div className="text-slate-200">{liveResult.stdout}</div>}
                {liveResult.stderr && <div className="text-rose-300/90">{liveResult.stderr}</div>}
                {liveResult.timedOut && <div className="text-rose-300/90">Command timed out.</div>}
                {liveResult.exitCode === undefined ? (
                  liveRunning && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-400/80">
                      <Loader2 size={11} className="animate-spin" /> running…
                    </div>
                  )
                ) : (
                  <div className={`mt-1.5 text-[11px] ${liveResult.exitCode === 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                    exit code {liveResult.exitCode}
                  </div>
                )}
                {liveResult.capturedVars && liveResult.capturedVars.length > 0 && (
                  <div className="mt-1 text-[11px] text-emerald-400/80">
                    ✓ Captured {liveResult.capturedVars.join(', ')} for later live steps
                  </div>
                )}
                {liveResult.envUpdated && liveResult.envUpdated.length > 0 && (
                  <div className="mt-1 text-[11px] text-emerald-400/80">
                    ✓ Saved {liveResult.envUpdated.join(', ')} to .env — visible in Settings and on hover everywhere
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
