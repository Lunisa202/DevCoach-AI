import { Sun, Moon, Menu, Bell } from "lucide-react";

interface HeaderProps {
  dark: boolean;
  onToggleDark: () => void;
  onMenuOpen: () => void;
  title: string;
  subtitle?: string;
}

export default function Header({ dark, onToggleDark, onMenuOpen, title, subtitle }: HeaderProps) {
  const bg = dark ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const btnHover = dark ? "hover:bg-slate-800" : "hover:bg-slate-100";

  return (
    <header
      className={`fixed top-0 right-0 left-0 lg:left-[280px] z-30 h-[72px] border-b backdrop-blur-xl flex items-center px-6 gap-4 transition-colors duration-300 ${bg}`}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuOpen}
        className={`lg:hidden p-2 rounded-lg ${textMuted} ${btnHover} transition-colors`}
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className={`text-base font-semibold ${textPrimary} leading-tight`}>{title}</h1>
        {subtitle && <p className={`text-xs ${textMuted} mt-0.5`}>{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className={`p-2 rounded-lg ${textMuted} ${btnHover} transition-all duration-150 relative`}
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        <button
          onClick={onToggleDark}
          className={`p-2 rounded-lg ${textMuted} ${btnHover} transition-all duration-150`}
          title={dark ? "Modo claro" : "Modo oscuro"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
