'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { View } from '@/components/app-shell'
import {
  GitBranch,
  Check,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react'

const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/

export function RepoInputView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const valid = useMemo(() => GITHUB_RE.test(url.trim()), [url])
  const showValidation = url.trim().length > 0

  function handleAnalyze() {
    if (!valid) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onNavigate('files')
    }, 1400)
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-primary/25">
          <GitBranch className="size-7 text-white" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          Analiza un repositorio
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm text-muted-foreground">
          Pega la URL de un repositorio público de GitHub y la IA generará tickets
          de mejora personalizados.
        </p>

        <div className="mt-8 text-left">
          <label
            htmlFor="repo-url"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            URL del repositorio
          </label>
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border bg-card px-3 shadow-sm transition-colors focus-within:ring-2',
              showValidation && valid && 'border-success/60 focus-within:ring-success/20',
              showValidation && !valid && 'border-destructive/60 focus-within:ring-destructive/20',
              !showValidation && 'border-border focus-within:border-primary focus-within:ring-primary/20',
            )}
          >
            <GitBranch className="size-5 shrink-0 text-muted-foreground" />
            <input
              id="repo-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAnalyze()
              }}
              placeholder="https://github.com/usuario/repositorio"
              className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {showValidation && (
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  valid ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive',
                )}
              >
                {valid ? <Check className="size-4" /> : <X className="size-4" />}
              </span>
            )}
          </div>
          <p
            className={cn(
              'mt-2 flex items-center gap-1.5 text-xs',
              showValidation && !valid ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            <Lock className="size-3" />
            {showValidation && !valid
              ? 'Introduce una URL válida de GitHub (github.com/usuario/repo).'
              : 'Solo repositorios públicos. No almacenamos tu código.'}
          </p>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!valid || loading}
            className={cn(
              'mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all',
              valid && !loading
                ? 'bg-brand-gradient text-white shadow-lg shadow-primary/25 hover:brightness-110'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analizando repositorio…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analizar repositorio
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>

        {/* Sample chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Prueba con:</span>
          {['vercel/next.js', 'facebook/react', 'shadcn-ui/ui'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setUrl(`https://github.com/${s}`)}
              className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
