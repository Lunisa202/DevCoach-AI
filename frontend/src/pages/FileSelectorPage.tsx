import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { Spinner } from '../components/Spinner'
import { getRepoTree, createProject } from '../services/projectService'
import { addProject, setActiveProject } from '../store/slices/projectsSlice'
import type { TreeNode } from '../types/project'

interface LocationState {
  repoUrl: string
  owner: string
  repo: string
}

// Estructura interna del árbol para renderizado recursivo
interface TreeItem {
  name: string
  path: string
  type: 'file' | 'folder'
  children: TreeItem[]
}

const MAX_FILES = 50

export function FileSelectorPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const state = location.state as LocationState | null

  const [tree, setTree] = useState<TreeItem[]>([])
  const [isLoadingTree, setIsLoadingTree] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Redirigir si no hay state (acceso directo a /select sin pasar por RepoInput)
  useEffect(() => {
    if (!state) {
      navigate('/', { replace: true })
    }
  }, [state, navigate])

  // Cargar el árbol
  useEffect(() => {
    if (!state) return
    loadTree()
  }, [state])

  const loadTree = async () => {
    if (!state) return
    setIsLoadingTree(true)
    try {
      const nodes = await getRepoTree(state.owner, state.repo)
      setTree(buildTree(nodes))
    } catch {
      toast.error('No se pudo cargar la estructura del repositorio')
      navigate('/', { replace: true })
    } finally {
      setIsLoadingTree(false)
    }
  }

  // Convertir la lista plana de nodes en un árbol jerárquico
  const buildTree = (nodes: TreeNode[]): TreeItem[] => {
    const root: TreeItem[] = []

    for (const node of nodes) {
      const parts = node.path.split('/')
      let current = root

      for (let i = 0; i < parts.length; i++) {
        const name = parts[i]
        const partialPath = parts.slice(0, i + 1).join('/')
        const isLast = i === parts.length - 1

        let existing = current.find((item) => item.name === name)

        if (!existing) {
          existing = {
            name,
            path: partialPath,
            type: isLast && node.type === 'blob' ? 'file' : 'folder',
            children: [],
          }
          current.push(existing)
        }

        current = existing.children
      }
    }

    return sortTree(root)
  }

  // Ordenar: carpetas primero, luego archivos, ambos alfabéticos
  const sortTree = (items: TreeItem[]): TreeItem[] => {
    return items
      .map((item) => ({
        ...item,
        children: sortTree(item.children),
      }))
      .sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1
        if (a.type === 'file' && b.type === 'folder') return 1
        return a.name.localeCompare(b.name)
      })
  }

  // Obtener todos los archivos dentro de una carpeta (recursivo)
  const getFilesInFolder = (items: TreeItem[]): string[] => {
    const files: string[] = []
    for (const item of items) {
      if (item.type === 'file') {
        files.push(item.path)
      } else {
        files.push(...getFilesInFolder(item.children))
      }
    }
    return files
  }

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const toggleFolder = (item: TreeItem) => {
    const files = getFilesInFolder(item.children)
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      const allSelected = files.every((f) => next.has(f))
      if (allSelected) {
        files.forEach((f) => next.delete(f))
      } else {
        files.forEach((f) => next.add(f))
      }
      return next
    })
  }

  const toggleExpand = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!state || selectedFiles.size === 0 || selectedFiles.size > MAX_FILES) return

    setIsCreating(true)
    try {
      const result = await createProject(state.repoUrl, Array.from(selectedFiles))
      dispatch(addProject(result.project))
      dispatch(setActiveProject(result.project.id))
      toast.success('Proyecto creado')
      navigate(`/dashboard/${result.project.id}`)
    } catch (err) {
      const error = err as AxiosError<{ detail: string }>
      const message = error.response?.data?.detail ?? 'No se pudo crear el proyecto'
      toast.error(message)
    } finally {
      setIsCreating(false)
    }
  }

  // Componente recursivo del árbol
  const TreeItemComponent = ({ item, depth }: { item: TreeItem; depth: number }) => {
    const isExpanded = expandedFolders.has(item.path)

    if (item.type === 'file') {
      return (
        <label
          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <input
            type="checkbox"
            checked={selectedFiles.has(item.path)}
            onChange={() => toggleFile(item.path)}
            className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
        </label>
      )
    }

    // Folder
    const folderFiles = getFilesInFolder(item.children)
    const allSelected = folderFiles.length > 0 && folderFiles.every((f) => selectedFiles.has(f))
    const someSelected = folderFiles.some((f) => selectedFiles.has(f))

    return (
      <div>
        <div
          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected && !allSelected
            }}
            onChange={() => toggleFolder(item)}
            className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500"
          />
          <button
            onClick={() => toggleExpand(item.path)}
            className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="truncate">{item.name}</span>
          </button>
        </div>

        {isExpanded && (
          <div>
            {item.children.map((child) => (
              <TreeItemComponent key={child.path} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!state) return null

  return (
    <div className="min-h-full p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Seleccionar archivos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {state.owner}/{state.repo} — Selecciona los archivos que quieres que la IA analice
        </p>
      </div>

      {/* Counter + submit */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <span className={`text-sm font-medium ${
          selectedFiles.size > MAX_FILES ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'
        }`}>
          {selectedFiles.size} archivo{selectedFiles.size !== 1 ? 's' : ''} seleccionado{selectedFiles.size !== 1 ? 's' : ''}
          {selectedFiles.size > MAX_FILES && ` (máximo ${MAX_FILES})`}
        </span>
        <button
          onClick={handleSubmit}
          disabled={selectedFiles.size === 0 || selectedFiles.size > MAX_FILES || isCreating}
          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          {isCreating && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isCreating ? 'Analizando tu código...' : 'Analizar código'}
        </button>
      </div>

      {/* Tree */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 max-h-[60vh] overflow-y-auto">
        {isLoadingTree ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" label="Cargando estructura del repositorio..." />
          </div>
        ) : tree.length === 0 ? (
          <p className="text-center text-slate-400 dark:text-slate-500 py-8">
            No se encontraron archivos en este repositorio
          </p>
        ) : (
          tree.map((item) => (
            <TreeItemComponent key={item.path} item={item} depth={0} />
          ))
        )}
      </div>

      {/* Creating overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-xl text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-slate-700 dark:text-slate-200 font-medium">
              Analizando tu código...
            </p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Esto puede tardar 10-30 segundos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
