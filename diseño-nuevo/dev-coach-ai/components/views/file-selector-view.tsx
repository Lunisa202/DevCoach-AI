'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { fileTree, type FileNode } from '@/lib/data'
import type { View } from '@/components/app-shell'
import {
  Folder,
  FolderOpen,
  FileCode2,
  Check,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

const MAX_FILES = 50

function collectFiles(node: FileNode): string[] {
  if (node.type === 'file') return [node.path]
  return (node.children ?? []).flatMap(collectFiles)
}

function nodeMatches(node: FileNode, query: string): boolean {
  if (!query) return true
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true
  return (node.children ?? []).some((c) => nodeMatches(c, query))
}

export function FileSelectorView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(['src/components/ProductList.tsx', 'src/context/CartContext.tsx']),
  )
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(['src', 'src/components', 'src/context']),
  )
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleFile(path: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else if (next.size < MAX_FILES) next.add(path)
      return next
    })
  }

  function toggleFolder(node: FileNode) {
    const files = collectFiles(node)
    const allSelected = files.every((f) => selected.has(f))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        files.forEach((f) => next.delete(f))
      } else {
        files.forEach((f) => {
          if (next.size < MAX_FILES) next.add(f)
        })
      }
      return next
    })
  }

  function toggleOpen(path: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function handleContinue() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onNavigate('kanban')
    }, 1400)
  }

  const count = selected.size

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <button
        type="button"
        onClick={() => onNavigate('repo')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      <div className="rounded-2xl border border-border bg-card">
        {/* Header */}
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">
            Selecciona los archivos a analizar
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La IA revisará el código de los archivos seleccionados para generar
            tickets de mejora.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por nombre de archivo…"
              className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Tree */}
        <div className="max-h-[420px] overflow-y-auto p-3">
          {fileTree
            .filter((n) => nodeMatches(n, query))
            .map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                query={query}
                selected={selected}
                open={open}
                onToggleFile={toggleFile}
                onToggleFolder={toggleFolder}
                onToggleOpen={toggleOpen}
              />
            ))}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5">
          <p className="text-sm">
            <span
              className={cn(
                'font-semibold tabular-nums',
                count > 0 ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {count}
            </span>{' '}
            <span className="text-muted-foreground">
              archivo{count === 1 ? '' : 's'} seleccionado{count === 1 ? '' : 's'}{' '}
              (máx. {MAX_FILES})
            </span>
          </p>
          <button
            type="button"
            onClick={handleContinue}
            disabled={count === 0 || loading}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all',
              count > 0 && !loading
                ? 'bg-brand-gradient text-white shadow-lg shadow-primary/25 hover:brightness-110'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generando tickets…
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function TreeNode({
  node,
  depth,
  query,
  selected,
  open,
  onToggleFile,
  onToggleFolder,
  onToggleOpen,
}: {
  node: FileNode
  depth: number
  query: string
  selected: Set<string>
  open: Set<string>
  onToggleFile: (path: string) => void
  onToggleFolder: (node: FileNode) => void
  onToggleOpen: (path: string) => void
}) {
  const isOpen = open.has(node.path) || query.length > 0

  if (node.type === 'folder') {
    const files = collectFiles(node)
    const allSelected = files.length > 0 && files.every((f) => selected.has(f))
    const someSelected = files.some((f) => selected.has(f))
    return (
      <div>
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50"
          style={{ paddingLeft: depth * 16 + 8 }}
        >
          <Checkbox
            checked={allSelected}
            indeterminate={!allSelected && someSelected}
            onChange={() => onToggleFolder(node)}
            label={`Seleccionar carpeta ${node.name}`}
          />
          <button
            type="button"
            onClick={() => onToggleOpen(node.path)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            {isOpen ? (
              <FolderOpen className="size-4 shrink-0 text-primary" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-sm font-medium text-foreground">
              {node.name}
            </span>
          </button>
        </div>
        {isOpen &&
          (node.children ?? [])
            .filter((c) => nodeMatches(c, query))
            .map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                query={query}
                selected={selected}
                open={open}
                onToggleFile={onToggleFile}
                onToggleFolder={onToggleFolder}
                onToggleOpen={onToggleOpen}
              />
            ))}
      </div>
    )
  }

  const checked = selected.has(node.path)
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/50',
        checked && 'bg-primary/5',
      )}
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      <Checkbox
        checked={checked}
        onChange={() => onToggleFile(node.path)}
        label={`Seleccionar ${node.name}`}
      />
      <FileCode2 className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-mono text-sm text-foreground">
        {node.name}
      </span>
    </div>
  )
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-md border transition-colors',
        checked || indeterminate
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:border-primary/50',
      )}
    >
      {checked && <Check className="size-3.5" />}
      {indeterminate && !checked && (
        <span className="size-2 rounded-[2px] bg-primary-foreground" />
      )}
    </button>
  )
}
