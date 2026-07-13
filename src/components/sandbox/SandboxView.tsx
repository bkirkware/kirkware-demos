import { FlaskConical, ShieldCheck } from 'lucide-react'
import type { CommandBlock } from '@/types/demo'
import { CodeBlock } from '@/components/ui/CodeBlock'

const ENV_CHECK_BLOCK: CommandBlock = {
  label: 'env-check.sh',
  lang: 'bash',
  code: [
    'set -a',
    'source .env 2>/dev/null',
    'set +a',
    "while IFS='=' read -r key _; do",
    '  case "$key" in \'\'|\'#\'*) continue;; esac',
    '  echo "$key=${!key}"',
    'done < .env',
  ].join('\n'),
  liveId: 'env-check.sh',
}

const CF_TARGET_BLOCK: CommandBlock = {
  label: 'cf-target.sh',
  lang: 'bash',
  code: 'cf target -o "$CF_ORG" -s "$CF_SPACE"',
  liveId: 'cf-target.sh',
}

export function SandboxView() {
  return (
    <main className="bg-app-grid relative min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-12 py-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400">
            <FlaskConical size={16} className="text-slate-950" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">Sandbox</h1>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Helper scripts for poking at your local environment outside of any specific demo. These run for real on
          your machine via the local dev server — configure the variables they depend on in Settings first.
        </p>

        <div className="mt-8">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            <ShieldCheck size={13} /> Environment Checks
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm text-slate-400">
                Sources <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">.env</code> and echoes
                every variable it defines.
              </p>
              <CodeBlock block={ENV_CHECK_BLOCK} />
            </div>

            <div>
              <p className="mb-2 text-sm text-slate-400">
                Targets the Cloud Foundry org/space configured via{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">CF_ORG</code> /{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">CF_SPACE</code>.
              </p>
              <CodeBlock block={CF_TARGET_BLOCK} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
