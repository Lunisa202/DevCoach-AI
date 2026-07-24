import { useState } from "react";
import {
  User,
  Lock,
  Key,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  ExternalLink,
  Camera,
  Mail,
  Shield,
} from "lucide-react";
import { currentUser } from "../data/mock";

interface SettingsProps {
  dark: boolean;
}

function SettingCard({
  dark,
  icon,
  title,
  description,
  children,
  onSave,
  saved,
}: {
  dark: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saved: boolean;
}) {
  const cardBg = dark ? "bg-slate-800 border-slate-700/50" : "bg-white border-slate-200";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const divider = dark ? "border-slate-700/50" : "border-slate-100";
  const iconBg = dark ? "bg-indigo-600/20 text-indigo-400" : "bg-indigo-100 text-indigo-600";

  return (
    <div className={`${cardBg} border rounded-2xl shadow-sm overflow-hidden`}>
      <div className={`flex items-start gap-4 px-6 py-5 border-b ${divider}`}>
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${textPrimary}`}>{title}</h3>
          <p className={`text-xs ${textMuted} mt-0.5 leading-relaxed`}>{description}</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">{children}</div>

      <div className={`px-6 pb-5 flex items-center justify-between`}>
        <div className="h-5">
          {saved && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-500 fade-in">
              <CheckCircle size={13} />
              Guardado correctamente
            </p>
          )}
        </div>
        <button
          onClick={onSave}
          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
        >
          <Save size={15} />
          Guardar
        </button>
      </div>
    </div>
  );
}

function SettingInput({
  dark,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  hint,
  rightEl,
}: {
  dark: boolean;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  rightEl?: React.ReactNode;
}) {
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const inputBg = disabled
    ? dark
      ? "bg-slate-700/50 border-slate-700 text-slate-500 cursor-not-allowed"
      : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
    : dark
      ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div>
      <label className={`block text-xs font-semibold ${textMuted} mb-1.5 uppercase tracking-wider`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 ${inputBg} ${rightEl ? "pr-12" : ""}`}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {hint && <p className={`mt-1 text-xs ${textMuted}`}>{hint}</p>}
    </div>
  );
}

export default function Settings({ dark }: SettingsProps) {
  const [name, setName] = useState(currentUser.name);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [apiKey, setApiKey] = useState("AIza••••••••••••••••••••••••••••");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [savedApi, setSavedApi] = useState(false);

  const bg = dark ? "bg-slate-900" : "bg-slate-50";
  const textMuted = dark ? "text-slate-400" : "text-slate-500";
  const textPrimary = dark ? "text-slate-100" : "text-slate-900";
  const avatarRing = dark ? "ring-slate-700" : "ring-slate-200";
  const btnIconClass = dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700";

  const save = (setSaved: (v: boolean) => void) => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasApiKey = true;

  return (
    <div className={`min-h-full ${bg} p-6 lg:p-8 fade-in`}>
      <div className="max-w-xl mx-auto space-y-5">
        {/* Page header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Configuración</h2>
          <p className={`text-sm ${textMuted} mt-1`}>Administra tu cuenta y preferencias.</p>
        </div>

        {/* Profile */}
        <SettingCard
          dark={dark}
          icon={<User size={18} />}
          title="Perfil"
          description="Tu nombre e información pública."
          onSave={() => save(setSavedProfile)}
          saved={savedProfile}
        >
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className={`relative w-16 h-16 rounded-2xl ring-2 ${avatarRing} overflow-hidden`}>
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold">
                {currentUser.initials}
              </div>
              <button className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={16} className="text-white" />
              </button>
            </div>
            <div>
              <p className={`text-sm font-medium ${textPrimary}`}>{currentUser.initials}</p>
              <p className={`text-xs ${textMuted}`}>Click para cambiar foto</p>
            </div>
          </div>

          <SettingInput
            dark={dark}
            label="Nombre completo"
            value={name}
            onChange={setName}
            placeholder="Tu nombre"
          />

          <SettingInput
            dark={dark}
            label="Correo electrónico"
            value={currentUser.email}
            onChange={() => {}}
            disabled
            hint="El correo no se puede cambiar."
            rightEl={<Mail size={15} className={textMuted} />}
          />
        </SettingCard>

        {/* Password */}
        <SettingCard
          dark={dark}
          icon={<Lock size={18} />}
          title="Cambiar contraseña"
          description="Usa una contraseña fuerte de al menos 8 caracteres."
          onSave={() => save(setSavedPw)}
          saved={savedPw}
        >
          <SettingInput
            dark={dark}
            label="Contraseña actual"
            type={showCurrentPw ? "text" : "password"}
            value={currentPw}
            onChange={setCurrentPw}
            placeholder="••••••••"
            rightEl={
              <button
                onClick={() => setShowCurrentPw((v) => !v)}
                className={`${btnIconClass} transition-colors`}
              >
                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <SettingInput
            dark={dark}
            label="Nueva contraseña"
            type={showNewPw ? "text" : "password"}
            value={newPw}
            onChange={setNewPw}
            placeholder="••••••••"
            rightEl={
              <button
                onClick={() => setShowNewPw((v) => !v)}
                className={`${btnIconClass} transition-colors`}
              >
                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <SettingInput
            dark={dark}
            label="Confirmar contraseña"
            type={showConfirmPw ? "text" : "password"}
            value={confirmPw}
            onChange={setConfirmPw}
            placeholder="••••••••"
            hint={newPw && confirmPw && newPw !== confirmPw ? "⚠ Las contraseñas no coinciden." : undefined}
            rightEl={
              <button
                onClick={() => setShowConfirmPw((v) => !v)}
                className={`${btnIconClass} transition-colors`}
              >
                {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
        </SettingCard>

        {/* API Key */}
        <SettingCard
          dark={dark}
          icon={<Key size={18} />}
          title="Clave API de Gemini"
          description="Necesaria para el análisis de código y las entrevistas de IA."
          onSave={() => save(setSavedApi)}
          saved={savedApi}
        >
          {/* Status indicator */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium ${hasApiKey ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-600"}`}>
            <Shield size={13} />
            {hasApiKey ? "API Key configurada y activa" : "Sin API Key — funciones de IA deshabilitadas"}
          </div>

          <SettingInput
            dark={dark}
            label="API Key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={setApiKey}
            placeholder="AIzaSy..."
            rightEl={
              <button
                onClick={() => setShowApiKey((v) => !v)}
                className={`${btnIconClass} transition-colors`}
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            Obtener API Key en Google AI Studio
            <ExternalLink size={12} />
          </a>
        </SettingCard>
      </div>
    </div>
  );
}
