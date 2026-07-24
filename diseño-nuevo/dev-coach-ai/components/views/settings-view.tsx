'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { user } from '@/lib/data'
import {
  User,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Save,
} from 'lucide-react'

export function SettingsView() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-8">
      <ProfileSection />
      <PasswordSection />
      <ApiKeySection />
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  onSave,
}: {
  icon: typeof User
  title: string
  description: string
  children: React.ReactNode
  onSave: () => void
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
      <div className="flex justify-end border-t border-border bg-muted/30 px-5 py-3">
        <SaveButton onSave={onSave} />
      </div>
    </section>
  )
}

function SaveButton({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        onSave()
        setSaved(true)
        setTimeout(() => setSaved(false), 1800)
      }}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
        saved
          ? 'bg-success text-success-foreground'
          : 'bg-primary text-primary-foreground hover:brightness-110',
      )}
    >
      {saved ? <Check className="size-4" /> : <Save className="size-4" />}
      {saved ? 'Guardado' : 'Guardar cambios'}
    </button>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20'

function ProfileSection() {
  const [name, setName] = useState(user.name)
  return (
    <SectionCard
      icon={User}
      title="Perfil"
      description="Tu información pública dentro de DevCoach AI."
      onSave={() => {}}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-semibold text-white shadow-lg shadow-primary/25">
          {user.initials}
        </div>
        <button
          type="button"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Cambiar avatar
        </button>
      </div>
      <Field label="Nombre">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Correo electrónico" hint="El correo no se puede modificar.">
        <input
          value={user.email}
          readOnly
          className={cn(inputClass, 'cursor-not-allowed opacity-60')}
        />
      </Field>
    </SectionCard>
  )
}

function PasswordSection() {
  return (
    <SectionCard
      icon={KeyRound}
      title="Cambiar contraseña"
      description="Usa una contraseña segura que no reutilices en otros sitios."
      onSave={() => {}}
    >
      <PasswordField label="Contraseña actual" />
      <PasswordField label="Nueva contraseña" />
      <PasswordField label="Confirmar nueva contraseña" />
    </SectionCard>
  )
}

function PasswordField({ label }: { label: string }) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label}>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder="••••••••••••"
          className={cn(inputClass, 'pr-11')}
        />
        <button
          type="button"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Field>
  )
}

function ApiKeySection() {
  const [show, setShow] = useState(false)
  const configured = true
  return (
    <SectionCard
      icon={Sparkles}
      title="API Key de Gemini"
      description="Necesaria para el análisis de código y las entrevistas con IA."
      onSave={() => {}}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
          configured
            ? 'border-success/30 bg-success/10 text-success'
            : 'border-warning/30 bg-warning/10 text-warning-foreground dark:text-warning',
        )}
      >
        <span
          className={cn(
            'size-2 rounded-full',
            configured ? 'bg-success' : 'bg-warning',
          )}
        />
        {configured
          ? 'Tienes una API Key configurada.'
          : 'Aún no has configurado una API Key.'}
      </div>

      <Field label="API Key">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            defaultValue="AIzaSyD-devcoach-example-key-000"
            className={cn(inputClass, 'pr-11 font-mono')}
          />
          <button
            type="button"
            aria-label={show ? 'Ocultar clave' : 'Mostrar clave'}
            onClick={() => setShow((v) => !v)}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <a
        href="https://aistudio.google.com/app/apikey"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Obtener una clave en Google AI Studio
        <ExternalLink className="size-3.5" />
      </a>
    </SectionCard>
  )
}
