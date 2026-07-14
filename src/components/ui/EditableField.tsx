import { useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Loader2, Pencil, X } from 'lucide-react'
import { useEditModeStore } from '@/store/editModeStore'

interface EditableFieldProps {
  stepId: string
  field: string
  value: string
  multiline?: boolean
  /** 'block' anchors the Edit button to the top-right corner of a full-width wrapper (headings, paragraphs). 'inline' hugs centered hero text instead, so the button sits right next to it. */
  variant?: 'block' | 'inline'
  className?: string
  children: (value: string) => ReactNode
}

export function EditableField({ stepId, field, value, multiline, variant = 'block', className, children }: EditableFieldProps) {
  const editsEnabled = useEditModeStore((s) => s.enabled)
  const [currentValue, setCurrentValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEditing() {
    setEditValue(currentValue)
    setError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setError(null)
    setEditValue(currentValue)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/edit-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'field', stepId, field, oldValue: currentValue, newValue: editValue }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? `Save failed (${res.status})`)
        return
      }
      setCurrentValue(editValue)
      setIsEditing(false)
    } catch {
      setError('Could not reach the local edit-script endpoint — is `npm run dev` running?')
    } finally {
      setSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className={className}>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            spellCheck={false}
            rows={Math.max(3, editValue.split('\n').length)}
            className="w-full resize-y rounded-lg border border-cyan-400/30 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
          />
        ) : (
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            spellCheck={false}
            className="w-full rounded-lg border border-cyan-400/30 bg-black/30 px-3 py-2 text-sm text-slate-100 outline-none"
          />
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={cancelEditing}
            disabled={saving}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          >
            <X size={12} /> Cancel
          </button>
        </div>
        {error && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[12px] text-rose-300/90">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
      </div>
    )
  }

  if (!editsEnabled) {
    return <>{children(currentValue)}</>
  }

  const editButton = (
    <button
      onClick={startEditing}
      className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-[#0a0d16]/90 px-1.5 py-1 text-slate-400 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white/10 hover:text-slate-200"
      title="Edit this text — saves back to the demo's source file"
    >
      <Pencil size={11} />
    </button>
  )

  if (variant === 'inline') {
    return (
      <div className={`group inline-flex items-center gap-2 ${className ?? ''}`}>
        {children(currentValue)}
        {editButton}
      </div>
    )
  }

  return (
    <div className={`group relative ${className ?? ''}`}>
      {children(currentValue)}
      <div className="absolute top-0 right-0">{editButton}</div>
    </div>
  )
}
