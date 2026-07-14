import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Copy, Eye, EyeOff, Info, Loader2, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { useEnvProfilesStore } from '@/store/envProfilesStore'
import { useEditModeStore } from '@/store/editModeStore'

interface EnvRow {
  id: number
  key: string
  value: string
  sensitive: boolean
  show: boolean
}

type EnvSource = 'env' | 'example' | 'none'

let nextRowId = 0
function makeRow(key: string, value: string, sensitive: boolean): EnvRow {
  return { id: nextRowId++, key, value, sensitive, show: false }
}

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export function SettingsView() {
  const editsEnabled = useEditModeStore((s) => s.enabled)
  const setEditsEnabled = useEditModeStore((s) => s.setEnabled)
  const [rows, setRows] = useState<EnvRow[]>([])
  const [source, setSource] = useState<EnvSource>('none')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingAs, setSavingAs] = useState(false)
  const [savedAsFilename, setSavedAsFilename] = useState<string | null>(null)
  const [saveAsError, setSaveAsError] = useState<string | null>(null)
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedAsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/env-settings')
        const data = await res.json()
        setRows(
          (data.vars as { key: string; value: string; sensitive: boolean }[]).map((v) =>
            makeRow(v.key, v.value, v.sensitive),
          ),
        )
        setSource(data.source)
      } catch {
        setError('Could not reach the local env-settings endpoint — is `npm run dev` running?')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      if (savedTimeout.current) clearTimeout(savedTimeout.current)
      if (savedAsTimeout.current) clearTimeout(savedAsTimeout.current)
    }
  }, [])

  function updateRow(id: number, patch: Partial<EnvRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow('', '', false)])
  }

  const trimmedKeys = rows.map((r) => r.key.trim())
  const duplicateKeys = new Set(
    trimmedKeys.filter((k, i) => k && trimmedKeys.indexOf(k) !== i),
  )
  const invalidKeys = rows.filter((r) => r.key.trim() && !KEY_PATTERN.test(r.key.trim()))
  const canSave = rows.every((r) => r.key.trim()) && duplicateKeys.size === 0 && invalidKeys.length === 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError(null)
    try {
      const vars = rows.map((r) => ({ key: r.key.trim(), value: r.value, sensitive: r.sensitive }))
      const res = await fetch('/api/env-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vars }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Save failed (${res.status})`)
        return
      }
      setRows(
        (data.vars as { key: string; value: string; sensitive: boolean }[]).map((v) =>
          makeRow(v.key, v.value, v.sensitive),
        ),
      )
      setSource('env')
      setSaved(true)
      if (savedTimeout.current) clearTimeout(savedTimeout.current)
      savedTimeout.current = setTimeout(() => setSaved(false), 2500)
      useEnvVarsStore.getState().refresh()
    } catch {
      setError('Could not reach the local env-settings endpoint — is `npm run dev` running?')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAs() {
    if (!canSave) return
    setSavingAs(true)
    setSaveAsError(null)
    try {
      const vars = rows.map((r) => ({ key: r.key.trim(), value: r.value, sensitive: r.sensitive }))
      const res = await fetch('/api/env-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', vars }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setSaveAsError(data.error ?? `Save As failed (${res.status})`)
        return
      }
      setSource('env')
      setSavedAsFilename(data.filename)
      if (savedAsTimeout.current) clearTimeout(savedAsTimeout.current)
      savedAsTimeout.current = setTimeout(() => setSavedAsFilename(null), 3500)
      useEnvVarsStore.getState().refresh()
      useEnvProfilesStore.getState().refresh()
    } catch {
      setSaveAsError('Could not reach the local env-profiles endpoint — is `npm run dev` running?')
    } finally {
      setSavingAs(false)
    }
  }

  return (
    <main className="bg-app-grid relative min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-12 py-12">
        <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage environment variables used by the "Run Live" scripts across demos and the Sandbox. Values are
          stored in <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">.env</code> at the project
          root and sourced into every live shell command. Variables marked{' '}
          <span className="font-semibold text-slate-300">Sensitive</span> are masked here and hidden from hover
          previews in command blocks; the list of sensitive names is stored in{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">env.masked</code>.
        </p>

        <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
              <Pencil size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">Enable Edits</div>
              <p className="mt-0.5 text-xs text-slate-400">
                Show Edit buttons on scripts and text throughout the app, so you can tweak a demo live and save the
                changes back to its source file. Off by default to keep the presentation clean.
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={editsEnabled}
            onClick={() => setEditsEnabled(!editsEnabled)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${editsEnabled ? 'bg-cyan-400' : 'bg-white/15'}`}
            type="button"
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                editsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {source === 'example' && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/6 p-4 text-sm text-amber-200">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              No <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">.env</code> file was found, so
              these values were loaded from <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">env.example</code>.
              Fill in the REDACTED values and click Save to create your <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">.env</code>.
            </span>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/6 p-4 text-sm text-rose-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              <span>Name</span>
              <span>Value</span>
              <span>Sensitive</span>
              <span></span>
            </div>
            <div className="divide-y divide-white/5">
              {rows.map((row) => {
                const trimmed = row.key.trim()
                const invalid = trimmed !== '' && !KEY_PATTERN.test(trimmed)
                const duplicate = trimmed !== '' && duplicateKeys.has(trimmed)
                const masked = row.sensitive && !row.show
                return (
                  <div key={row.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 px-4 py-2">
                    <input
                      value={row.key}
                      onChange={(e) => updateRow(row.id, { key: e.target.value })}
                      placeholder="VAR_NAME"
                      spellCheck={false}
                      className={`w-full rounded-md border bg-black/20 px-2.5 py-1.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/40 ${
                        invalid || duplicate ? 'border-rose-400/50' : 'border-white/10'
                      }`}
                    />
                    <div className="relative">
                      <input
                        value={row.value}
                        onChange={(e) => updateRow(row.id, { value: e.target.value })}
                        type={masked ? 'password' : 'text'}
                        placeholder="value"
                        spellCheck={false}
                        className={`w-full rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400/40 ${
                          row.sensitive ? 'pr-8' : ''
                        }`}
                      />
                      {row.sensitive && (
                        <button
                          onClick={() => updateRow(row.id, { show: !row.show })}
                          className="absolute inset-y-0 right-1.5 flex items-center text-slate-500 hover:text-slate-300"
                          title={row.show ? 'Hide value' : 'Show value'}
                          type="button"
                        >
                          {row.show ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                    <label className="flex items-center justify-center" title="Mask this value and hide it from hover previews">
                      <input
                        type="checkbox"
                        checked={row.sensitive}
                        onChange={(e) => updateRow(row.id, { sensitive: e.target.checked, show: false })}
                        className="h-4 w-4 accent-cyan-400"
                      />
                    </label>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="flex items-center justify-center rounded-md p-1.5 text-slate-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                      title="Remove variable"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
              {rows.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-500">No environment variables yet.</div>
              )}
            </div>
            <div className="border-t border-white/10 px-4 py-2.5">
              <button
                onClick={addRow}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-cyan-300 transition hover:bg-white/5"
                type="button"
              >
                <Plus size={14} /> Add variable
              </button>
            </div>
          </div>
        )}

        {!loading && (invalidKeys.length > 0 || duplicateKeys.size > 0) && (
          <p className="mt-3 text-xs text-rose-300">
            {invalidKeys.length > 0 && 'Names must start with a letter or underscore and contain only letters, numbers, and underscores. '}
            {duplicateKeys.size > 0 && 'Duplicate variable names are not allowed.'}
          </p>
        )}

        {!loading && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleSaveAs}
              disabled={!canSave || savingAs}
              title="Save a named snapshot as .env-<HUB_FQDN>, switchable later from the top bar"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {savingAs ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
              {savingAs ? 'Saving…' : 'Save As'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-300">
                <CheckCircle2 size={15} /> Saved to .env and env.masked
              </span>
            )}
            {savedAsFilename && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-300">
                <CheckCircle2 size={15} /> Saved as <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">{savedAsFilename}</code>
              </span>
            )}
            {saveAsError && (
              <span className="flex items-center gap-1.5 text-sm text-rose-300">
                <AlertTriangle size={15} /> {saveAsError}
              </span>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
