import { useState } from "react";
import { GitBranch, ArrowRight, CheckCircle, XCircle, Loader2, Lock, Globe } from "lucide-react";

type Page = "home" | "repo-input" | "file-selector" | "kanban" | "ticket-detail" | "interview" | "settings";

interface RepoInputProps {
  dark: boolean;
  onNavigate: (page: Page, projectId?: string) => void;
}

function isValidGithubUrl(url: string): boolean {
  return /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(url.trim());
}

export default function RepoInput({ dark, onNavigate }: RepoInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState<null | boolean>(null);

  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const cardBg = dark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-slate-200";
  const inputBg = dark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const helperBg = dark ? "bg-slate-700/50 border-slate-600/50" : "bg-slate-50 border-slate-200";

  const isValid = url.trim() ? isValidGithubUrl(url) : null;

  const handleAnalyze = () => {
    if (!isValid) return;
    setLoading(true);
    setValidated(null);
    setTimeout(() => {
      setLoading(false);
      setValidated(true);
      setTimeout(() => onNavigate("file-selector"), 800);
    }, 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const exampleRepos = [
    "https://github.com/vercel/next.js",
    "https://github.com/facebook/react",
    "https://github.com/microsoft/typescript",
  ];

  return (
    <div className={`min-h-full ${bg} flex items-center justify-center p-6 fade-in`}>
      <div className="w-full max-w-xl">
        {/* Icon header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/25">
            <GitBranch size={32} className="text-white" />
          </div>
          <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
            Analizar repositorio
          </h2>
          <p className={`text-sm ${textMuted}`}>
            Pega la URL de un repositorio público de GitHub
          </p>
        </div>

        {/* Input card */}
        <div className={`${cardBg} border rounded-2xl p-6 shadow-sm mb-4`}>
          <label className={`block text-xs font-semibold uppercase tracking-wider ${textMuted} mb-2`}>
            URL del repositorio
          </label>

          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <GitBranch size={18} className={textMuted} />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://github.com/usuario/repositorio"
              className={`w-full pl-10 pr-12 py-3.5 rounded-xl border text-sm font-mono transition-all duration-200 outline-none
                ${inputBg}
                ${isValid === true ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""}
                ${isValid === false ? "border-red-500 ring-2 ring-red-500/20" : ""}
                ${isValid === null && url === "" ? (dark ? "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" : "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20") : ""}
              `}
            />
            {/* Validation icon */}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {loading ? (
                <Loader2 size={18} className="text-indigo-400 spin-slow" />
              ) : isValid === true ? (
                <CheckCircle size={18} className="text-emerald-500" />
              ) : isValid === false ? (
                <XCircle size={18} className="text-red-500" />
              ) : null}
            </div>
          </div>

          {/* Validation messages */}
          <div className="mt-2 min-h-[20px]">
            {isValid === false && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle size={12} />
                URL inválida. Debe ser un repositorio de GitHub.
              </p>
            )}
            {isValid === true && !loading && (
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <CheckCircle size={12} />
                URL válida. Repositorio encontrado.
              </p>
            )}
            {isValid === null && url === "" && (
              <p className={`text-xs ${textMuted} flex items-center gap-1`}>
                <Globe size={12} />
                Solo repositorios públicos son compatibles.
              </p>
            )}
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={!isValid || loading}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200
              ${isValid && !loading
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
                Analizando repositorio...
              </>
            ) : validated ? (
              <>
                <CheckCircle size={16} />
                Repositorio verificado
              </>
            ) : (
              <>
                Analizar repositorio
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Privacy note */}
        <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border ${helperBg} mb-6`}>
          <Lock size={14} className={`${textMuted} mt-0.5 shrink-0`} />
          <p className={`text-xs ${textMuted} leading-relaxed`}>
            Solo se analiza el <strong className={textMuted}>código fuente</strong> de archivos que selecciones. No almacenamos tu código. La IA solo recibe los fragmentos que eliges compartir.
          </p>
        </div>

        {/* Example repos */}
        <div>
          <p className={`text-xs font-medium ${textMuted} mb-3 text-center`}>Ejemplos para probar</p>
          <div className="space-y-2">
            {exampleRepos.map((repo) => (
              <button
                key={repo}
                onClick={() => setUrl(repo)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-mono transition-all duration-150
                  ${dark
                    ? "bg-slate-800/40 border-slate-700 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400"
                    : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                  }
                `}
              >
                {repo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
