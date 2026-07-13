import ReactMarkdown from 'react-markdown'

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={`prose-demo ${className ?? ''}`}>
      <ReactMarkdown
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
          h1: ({ children }) => <h1 className="mb-2 text-2xl font-semibold text-slate-100">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-xl font-semibold text-slate-100">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 text-lg font-semibold text-slate-100">{children}</h3>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
