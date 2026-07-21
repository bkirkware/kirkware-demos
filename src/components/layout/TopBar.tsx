import { FlaskConical, PanelLeft, PanelLeftClose, Settings as SettingsIcon, Sparkles } from 'lucide-react'
import { useDemoStore } from '@/store/demoStore'
import { useViewStore, type AppView } from '@/store/viewStore'
import { useEnvVarsStore } from '@/store/envVarsStore'
import { Icon } from '@/components/ui/Icon'
import { DemoSelector } from './DemoSelector'
import { EnvProfileSelector } from './EnvProfileSelector'

const NAV_ITEMS: { view: AppView; label: string; icon: typeof SettingsIcon }[] = [
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
  { view: 'sandbox', label: 'Sandbox', icon: FlaskConical },
]

function displayValue(info: { value: string; sensitive: boolean } | undefined) {
  if (!info) return null
  if (info.sensitive) return '•••'
  return info.value || '(empty)'
}

export function TopBar() {
  const demo = useDemoStore((s) => s.currentDemo)
  const stepIndex = useDemoStore((s) => s.currentStepIndex)
  const view = useViewStore((s) => s.view)
  const setView = useViewStore((s) => s.setView)
  const sidebarCollapsed = useViewStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useViewStore((s) => s.toggleSidebar)
  const envVars = useEnvVarsStore((s) => s.vars)
  const cfOrg = displayValue(envVars.CF_ORG)
  const cfSpace = displayValue(envVars.CF_SPACE)

  return (
    <header className="glass-panel relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
      <div className="flex items-center gap-4 min-w-0">
        {view === 'demo' && demo && (
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
        <button
          onClick={() => setView('demo')}
          className="flex items-center gap-2 shrink-0"
          title="Back to demos"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400">
            <Sparkles size={16} className="text-slate-950" />
          </div>
          <span className="text-sm font-semibold text-slate-400">Kirkware Demos</span>
        </button>
        {view === 'demo' && demo && (
          <>
            <div className="h-6 w-px shrink-0 bg-white/10" />
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold text-slate-100">{demo.meta.title}</h1>
              {demo.meta.subtitle && <p className="truncate text-xs text-slate-500">{demo.meta.subtitle}</p>}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {view === 'demo' && demo && (
          <span className="hidden font-mono text-xs text-slate-500 sm:inline mr-2">
            Step {stepIndex + 1} / {demo.steps.length}
          </span>
        )}
        {(cfOrg || cfSpace) && (
          <div
            className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-400 sm:flex"
            title="Current cf target (org / space)"
          >
            <Icon name="cloud-foundry" size={14} />
            <span className="text-slate-600">Org:</span>
            <span>{cfOrg ?? '—'}</span>
            <span className="text-slate-600">Space:</span>
            <span>{cfSpace ?? '—'}</span>
          </div>
        )}
        {NAV_ITEMS.map(({ view: itemView, label, icon: ItemIcon }) => (
          <button
            key={itemView}
            onClick={() => setView(itemView)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              view === itemView
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            <ItemIcon size={15} />
            {label}
          </button>
        ))}
        <EnvProfileSelector />
        <DemoSelector />
      </div>
    </header>
  )
}
