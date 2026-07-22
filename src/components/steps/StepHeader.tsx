import { BookOpen, ExternalLink } from 'lucide-react'
import type { DemoLink } from '@/types/demo'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { interpolateEnvVars } from '@/lib/envVarTokens'

/**
 * Shared header for content/command/diagram steps: section eyebrow, the
 * step heading at projector scale, and link-out chips — `sourceUrl` renders
 * as a "Docs" chip, `links` as one labeled chip each.
 */
export function StepHeader({
  section,
  heading,
  sourceUrl,
  links,
}: {
  section: string
  heading: string
  sourceUrl?: string
  links?: DemoLink[]
}) {
  const envVars = useEnvVarsStore((s) => s.vars)

  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <div className="mb-2 text-[13px] font-semibold tracking-wider text-cyan-400 uppercase">{section}</div>
        <h2 className="text-4xl font-bold tracking-tight text-slate-100 text-balance">{heading}</h2>
      </div>
      {(sourceUrl || (links && links.length > 0)) && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-1">
          {sourceUrl && (
            <a
              href={interpolateEnvVars(sourceUrl, envVars)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/8 px-3 py-1.5 text-[13px] font-medium text-cyan-300 transition hover:bg-cyan-400/15"
            >
              <BookOpen size={13} /> Docs
            </a>
          )}
          {links?.map((link) => (
            <a
              key={link.url}
              href={interpolateEnvVars(link.url, envVars)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-slate-300 transition hover:bg-white/10 hover:text-slate-100"
            >
              <ExternalLink size={12} /> {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
