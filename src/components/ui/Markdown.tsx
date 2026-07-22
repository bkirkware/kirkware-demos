import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { interpolateEnvVars } from '@/lib/envVarTokens'

/**
 * Narrative markdown with env-var interpolation. Font size deliberately
 * inherits from the wrapper (body text passes text-[17px], diagram
 * narratives text-[15px], …) so one renderer serves every context.
 * GFM is enabled: pipe tables, strikethrough, and autolinks work.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  const envVars = useEnvVarsStore((s) => s.vars)
  const resolved = useMemo(() => interpolateEnvVars(children, envVars), [children, envVars])

  return (
    <div className={`prose-demo ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 leading-relaxed text-slate-300/90 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
          em: ({ children }) => <em className="text-slate-200">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200">
              {children}
            </code>
          ),
          ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1.5 text-slate-300/90 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-slate-300/90 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-100">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-100">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 text-xl font-semibold text-slate-100">{children}</h3>,
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-xl border border-white/10 last:mb-0">
              <table className="w-full border-collapse text-[0.92em]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-white/10 px-4 py-2.5 text-left text-[0.85em] font-semibold tracking-wide text-slate-200 uppercase">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-white/5 px-4 py-2.5 text-slate-300/90">{children}</td>,
          img: ({ src, alt, title }) => (
            <span className="mb-3 block last:mb-0">
              <img src={src} alt={alt ?? ''} className="max-w-full rounded-xl border border-white/10 shadow-lg shadow-black/30" />
              {(title ?? alt) && <span className="mt-2 block text-center text-[0.8em] text-slate-500">{title ?? alt}</span>}
            </span>
          ),
        }}
      >
        {resolved}
      </ReactMarkdown>
    </div>
  )
}
