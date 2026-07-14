import { ExternalLink } from 'lucide-react'
import { EditableField } from '@/components/ui/EditableField'

export function StepHeader({
  stepId,
  section,
  heading,
  sourceUrl,
}: {
  stepId: string
  section: string
  heading: string
  sourceUrl?: string
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="mb-1.5 text-xs font-semibold tracking-wider text-cyan-400 uppercase">{section}</div>
        <EditableField stepId={stepId} field="heading" value={heading}>
          {(v) => <h2 className="text-2xl font-bold text-slate-100">{v}</h2>}
        </EditableField>
      </div>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
        >
          <ExternalLink size={12} /> Source
        </a>
      )}
    </div>
  )
}
