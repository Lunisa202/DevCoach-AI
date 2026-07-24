import { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  Search,
  Loader2,
  ArrowRight,
  X,
} from "lucide-react";
import { fileTree } from "../data/mock";

type Page = "home" | "repo-input" | "file-selector" | "kanban" | "ticket-detail" | "interview" | "settings";

interface FileSelectorProps {
  dark: boolean;
  onNavigate: (page: Page, projectId?: string) => void;
}

type FileNode = {
  type: "file" | "folder";
  name: string;
  size?: string;
  open?: boolean;
  children?: FileNode[];
};

function flattenFiles(nodes: FileNode[], path = ""): { path: string; name: string; size?: string }[] {
  const result: { path: string; name: string; size?: string }[] = [];
  for (const node of nodes) {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    if (node.type === "file") {
      result.push({ path: fullPath, name: node.name, size: node.size });
    } else if (node.children) {
      result.push(...flattenFiles(node.children, fullPath));
    }
  }
  return result;
}

function FileTreeNode({
  node,
  depth,
  selected,
  onToggle,
  filter,
  dark,
  path,
}: {
  node: FileNode;
  depth: number;
  selected: Set<string>;
  onToggle: (path: string) => void;
  filter: string;
  dark: boolean;
  path: string;
}) {
  const [open, setOpen] = useState(node.open ?? false);
  const textPrimary = dark ? "text-slate-200" : "text-slate-800";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const hoverBg = dark ? "hover:bg-slate-800" : "hover:bg-slate-50";
  const checkBorder = dark ? "border-slate-600" : "border-slate-300";

  const allChildren = node.type === "folder" && node.children ? flattenFiles(node.children, path) : [];
  const allSelected = allChildren.length > 0 && allChildren.every((f) => selected.has(f.path));
  const someSelected = allChildren.some((f) => selected.has(f.path));

  const matchesFilter = filter ? node.name.toLowerCase().includes(filter.toLowerCase()) : true;
  const childrenMatchFilter = node.type === "folder" && node.children
    ? flattenFiles(node.children, path).some((f) => f.name.toLowerCase().includes(filter.toLowerCase()))
    : false;

  if (!matchesFilter && !childrenMatchFilter) return null;

  const isFile = node.type === "file";
  const isSelected = isFile && selected.has(path);

  const handleFolderSelect = () => {
    allChildren.forEach((f) => onToggle(f.path));
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-100 ${hoverBg}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => {
          if (isFile) onToggle(path);
          else setOpen((o) => !o);
        }}
      >
        {/* Expand arrow for folders */}
        {!isFile && (
          <span className={`shrink-0 ${textMuted}`}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}

        {/* Checkbox */}
        <div
          className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all
            ${isFile
              ? isSelected
                ? "bg-indigo-600 border-indigo-600"
                : `${checkBorder} bg-transparent`
              : allSelected
                ? "bg-indigo-600 border-indigo-600"
                : someSelected
                  ? "bg-indigo-400 border-indigo-400"
                  : `${checkBorder} bg-transparent`
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (isFile) onToggle(path);
            else handleFolderSelect();
          }}
        >
          {(isFile ? isSelected : allSelected || someSelected) && (
            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white" aria-hidden>
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Icon */}
        {isFile ? (
          <FileCode size={15} className="text-indigo-400 shrink-0" />
        ) : open ? (
          <FolderOpen size={15} className="text-amber-400 shrink-0" />
        ) : (
          <Folder size={15} className="text-amber-400 shrink-0" />
        )}

        {/* Name */}
        <span className={`text-sm flex-1 min-w-0 truncate ${textPrimary}`}>{node.name}</span>

        {/* File size */}
        {isFile && node.size && (
          <span className={`text-xs shrink-0 ${textMuted} font-mono`}>{node.size}</span>
        )}
      </div>

      {/* Children */}
      {!isFile && open && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
              filter={filter}
              dark={dark}
              path={`${path}/${child.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileSelector({ dark, onNavigate }: FileSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const cardBg = dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200";
  const inputBg = dark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300 text-slate-800 placeholder-slate-400";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const badgeBg = dark ? "bg-indigo-600/20 text-indigo-400" : "bg-indigo-100 text-indigo-700";

  const MAX = 50;

  const toggleFile = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else if (next.size < MAX) {
        next.add(path);
      }
      return next;
    });
  };

  const handleContinue = () => {
    if (selected.size === 0) return;
    setLoading(true);
    setTimeout(() => onNavigate("kanban", "p1"), 2000);
  };

  const clearFilter = () => setFilter("");

  return (
    <div className={`min-h-full ${bg} p-6 lg:p-8 fade-in`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${textPrimary} mb-1`}>Seleccionar archivos</h2>
          <p className={`text-sm ${textMuted}`}>
            Elige los archivos que la IA analizará para generar tickets de mejora.
          </p>
        </div>

        {/* Search + Counter bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar archivos..."
              className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200
                ${inputBg}
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
              `}
            />
            {filter && (
              <button
                onClick={clearFilter}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted} hover:text-red-400 transition-colors`}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={`shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold ${badgeBg}`}>
            {selected.size}/{MAX} archivos
          </div>
        </div>

        {/* Tree */}
        <div className={`${cardBg} border rounded-2xl p-3 mb-4 shadow-sm min-h-64 max-h-[420px] overflow-y-auto`}>
          {(fileTree as FileNode[]).map((node) => (
            <FileTreeNode
              key={node.name}
              node={node}
              depth={0}
              selected={selected}
              onToggle={toggleFile}
              filter={filter}
              dark={dark}
              path={node.name}
            />
          ))}
        </div>

        {/* Selected files chips */}
        {selected.size > 0 && (
          <div className={`${cardBg} border rounded-xl p-3 mb-4`}>
            <p className={`text-xs font-semibold ${textMuted} mb-2`}>Archivos seleccionados</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selected).map((path) => (
                <span
                  key={path}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono
                    ${dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}
                  `}
                >
                  {path.split("/").pop()}
                  <button
                    onClick={() => toggleFile(path)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={selected.size === 0 || loading}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white transition-all duration-200
            ${selected.size > 0 && !loading
              ? "btn-primary"
              : dark
                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="spin-slow" />
              Analizando con IA... generando tickets
            </>
          ) : (
            <>
              Continuar con {selected.size} archivo{selected.size !== 1 ? "s" : ""}
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {selected.size === 0 && (
          <p className={`text-center text-xs mt-2 ${textMuted}`}>
            Selecciona al menos un archivo para continuar.
          </p>
        )}
      </div>
    </div>
  );
}
