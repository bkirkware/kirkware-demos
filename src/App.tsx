import { useEffect } from 'react'
import { useDemoStore } from '@/store/demoStore'
import { demoRegistry } from '@/demos/registry'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ContentPanel } from '@/components/layout/ContentPanel'

function App() {
  const currentDemo = useDemoStore((s) => s.currentDemo)
  const isLoading = useDemoStore((s) => s.isLoading)
  const error = useDemoStore((s) => s.error)
  const loadDemo = useDemoStore((s) => s.loadDemo)
  const next = useDemoStore((s) => s.next)
  const prev = useDemoStore((s) => s.prev)

  useEffect(() => {
    if (demoRegistry[0]) loadDemo(demoRegistry[0].id)
  }, [loadDemo])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev])

  return (
    <div className="bg-app-grid flex h-screen flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <ContentPanel />
      </div>
      {isLoading && !currentDemo && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          Loading demo…
        </div>
      )}
      {error && (
        <div className="absolute inset-x-0 bottom-4 mx-auto w-fit rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}
    </div>
  )
}

export default App
