import {
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    Code2,
    FileCode2,
    Gauge,
    GitBranch,
    GitCommitHorizontal,
    Headphones,
    Heart,
    Menu,
    MessageSquareCode,
    Mic,
    Radio,
    RefreshCw,
    ScanSearch,
    Sparkles,
    Ticket,
    X,
    Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DevCoachLogo } from '../components/DevCoachLogo'

/* ─── Reveal on scroll ─── */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(node) } },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Gamificación', href: '#gamificacion' },
    { label: 'Tecnología', href: '#tech-stack' },
  ]

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <DevCoachLogo className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">DevCoach AI</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Iniciar sesión
          </Link>
          <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-colors">
            Empieza gratis
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="flex size-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 md:hidden" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-center text-sm font-medium">
                Iniciar sesión
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white">
                Empieza gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* ─── Hero Section ─── */
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-32 right-0 h-[380px] w-[380px] rounded-full bg-purple-500/15 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                <Sparkles className="size-3.5" />
                Demuestra que entiendes tu código
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                Tu IA escribe el código.{' '}
                <span className="text-indigo-600 dark:text-indigo-400">¿Puedes defenderlo?</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                DevCoach AI no mide si programaste — mide si <strong>entiendes</strong> lo que hiciste.
                Conecta tu repo, recibe feedback personalizado, y demuestra tu comprensión técnica
                en una entrevista con IA.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all hover:scale-[1.02]">
                  Empieza gratis
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 backdrop-blur hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <GitBranch className="size-4" />
                  Cómo funciona
                </a>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" /> Gratis para empezar
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" /> Sin tarjeta
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400" /> Tu código, tu ritmo
                </span>
              </div>
            </Reveal>
          </div>

          {/* Visual mock */}
          <Reveal delay={200}>
            <HeroMock />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─── Hero Mock (visual demo card) ─── */
function HeroMock() {
  const dims = [
    { label: 'Comprensión del problema', score: 17, color: 'bg-emerald-400' },
    { label: 'Justificación técnica', score: 18, color: 'bg-emerald-400' },
    { label: 'Conocimiento de alternativas', score: 17, color: 'bg-emerald-400' },
    { label: 'Conciencia de limitaciones', score: 18, color: 'bg-emerald-400' },
    { label: 'Claridad de comunicación', score: 19, color: 'bg-emerald-400' },
  ]

  return (
    <div className="relative animate-[float_6s_ease-in-out_infinite]">
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl" />
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 p-1.5 shadow-2xl backdrop-blur-xl">
        {/* window bar */}
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-yellow-400" />
          <span className="size-3 rounded-full bg-green-400" />
          <span className="ml-3 font-mono text-xs text-slate-500 dark:text-slate-400">devcoach — evaluación</span>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/60 p-4">
          {/* Header: Aprobado + score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Aprobado</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-800 dark:text-white">89</span>
              <span className="text-xs text-slate-500 dark:text-slate-400"> de 100</span>
            </div>
          </div>

          {/* Progress bar total */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: '89%' }} />
          </div>

          {/* Evaluación por dimensión */}
          <p className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">Evaluación por dimensión</p>
          <div className="mt-2 space-y-2.5">
            {dims.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{d.label}</span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{d.score}/20</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.score / 20) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Conceptos a profundizar */}
          <p className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">Conceptos a profundizar</p>
          <div className="mt-2 space-y-1.5">
            <div className="rounded-md border-l-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-500/5 px-2.5 py-1.5">
              <p className="text-[10px] text-slate-600 dark:text-slate-400">Race Conditions en peticiones HTTP con AbortController</p>
            </div>
            <div className="rounded-md border-l-2 border-indigo-400 bg-indigo-50 dark:bg-indigo-500/5 px-2.5 py-1.5">
              <p className="text-[10px] text-slate-600 dark:text-slate-400">Testing unitario de timers y componentes con debounce</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── How It Works ─── */
const steps = [
  { icon: GitBranch, title: 'Conecta tu repo', desc: 'Vincula tu repositorio de GitHub en segundos.' },
  { icon: FileCode2, title: 'Elige los archivos', desc: 'Seleccionas qué código quieres que la IA analice.' },
  { icon: ScanSearch, title: 'Análisis de código', desc: 'El agente Code Reviewer detecta fortalezas y debilidades.' },
  { icon: Ticket, title: 'Tickets de mejora', desc: 'Recibes 3 tickets personalizados y accionables.' },
  { icon: GitCommitHorizontal, title: 'Resuelve con un commit', desc: 'Aplicas la mejora haciendo un commit real en tu repo.' },
  { icon: MessageSquareCode, title: 'Entrevista técnica', desc: 'El Tech Lead te entrevista por chat o por voz.' },
  { icon: ClipboardCheck, title: 'Feedback con puntaje', desc: 'El Evaluator te evalúa en 5 dimensiones.' },
]

function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Cómo funciona</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Un ciclo de aprendizaje sobre tu propio código
          </h2>
          <p className="mt-4 text-pretty text-slate-600 dark:text-slate-400">
            Análisis → mejora → validación. Cada vuelta te hace un mejor desarrollador.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 70}>
              <div className="group relative h-full rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 p-5 backdrop-blur transition-all hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-800 dark:text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.desc}</p>
              </div>
            </Reveal>
          ))}

          <Reveal delay={steps.length * 70}>
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-500/5 p-5 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <RefreshCw className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold text-indigo-600 dark:text-indigo-400">Y vuelta a empezar</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Repite el ciclo con nuevos archivos y sigue creciendo.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─── AI Agents ─── */
const agents = [
  {
    icon: Code2,
    name: 'Code Reviewer',
    tagline: 'Analiza tu código como un senior de verdad',
    desc: 'Revisa tu código y detecta fortalezas, malos olores y oportunidades de mejora con contexto real.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
  },
  {
    icon: Ticket,
    name: 'Ticket Generator',
    tagline: '3 tickets de mejora concretos y accionables',
    desc: 'Transforma el análisis en tareas claras que puedes resolver con un commit, priorizadas por impacto.',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    icon: Headphones,
    name: 'Tech Lead',
    tagline: 'Te entrevista sobre tus decisiones técnicas',
    desc: 'Te hace preguntas por chat o voz para entender si de verdad comprendes lo que implementaste.',
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
  },
  {
    icon: Gauge,
    name: 'Evaluator',
    tagline: 'Evalúa tu comprensión en 5 dimensiones',
    desc: 'Genera un feedback detallado con puntaje para que sepas exactamente qué reforzar.',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-500/10',
  },
]

function Agents() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[140px]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Inteligencia Artificial</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            4 agentes de IA especializados
          </h2>
          <p className="mt-4 text-pretty text-slate-600 dark:text-slate-400">
            Cada uno cumple un rol distinto en tu proceso de mejora, como un equipo real.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {agents.map((agent, i) => (
            <Reveal key={agent.name} delay={i * 90}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-500/30">
                <div className={`flex size-12 items-center justify-center rounded-xl ${agent.bg}`}>
                  <agent.icon className={`size-6 ${agent.color}`} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-800 dark:text-white">{agent.name}</h3>
                <p className={`mt-1 font-medium ${agent.color}`}>{agent.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{agent.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Voice Interview ─── */
const bars = [0.4, 0.75, 0.5, 0.95, 0.6, 0.85, 0.45, 0.7, 0.55, 0.9, 0.5, 0.8, 0.42, 0.68]

function VoiceInterview() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 p-8 backdrop-blur-xl sm:p-12">
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/10 blur-[120px]" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-[120px]" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                <Radio className="size-3.5" />
                Innovación
              </span>
              <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                La primera plataforma que te entrevista por voz sobre tu propio código
              </h2>
              <p className="mt-5 text-pretty leading-relaxed text-slate-600 dark:text-slate-400">
                Habla con el Tech Lead como en una entrevista real. Explica tus decisiones,
                justifica tu enfoque y recibe feedback al instante — con tu voz, sin escribir
                una sola línea.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Zap className="size-4 text-indigo-500" />
                  Speech-to-text en tiempo real
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Zap className="size-4 text-indigo-500" />
                  Feedback instantáneo
                </span>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 p-6 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                      TL
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Tech Lead</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        Escuchando<span className="inline-flex w-4"><span className="animate-[dotPulse_1.4s_infinite]">.</span><span className="animate-[dotPulse_1.4s_0.2s_infinite]">.</span><span className="animate-[dotPulse_1.4s_0.4s_infinite]">.</span></span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-100 dark:bg-green-500/15 px-2 py-1 text-[10px] font-semibold text-green-700 dark:text-green-400 animate-[livePulse_2s_ease-in-out_infinite]">
                    ● LIVE
                  </span>
                </div>

                {/* audio bars */}
                <div className="mt-8 flex h-24 items-center justify-center gap-1.5">
                  {bars.map((h, i) => (
                    <span
                      key={i}
                      className="landing-audio-bar w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500"
                      style={{
                        animationDuration: `${1.4 + (i % 5) * 0.25}s`,
                        animationDelay: `${i * 0.05}s`,
                        ['--bar-h' as string]: `${h * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <p className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-center text-sm text-slate-600 dark:text-slate-400 animate-[fadeInOut_4s_ease-in-out_infinite]">
                  "Elegí memoización para evitar renders innecesarios…"
                </p>

                <div className="mt-6 flex justify-center">
                  <span className="relative flex size-14 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <span className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping" />
                    <Mic className="relative size-6" />
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Evaluation Section ─── */
/* ─── Gamification Section ─── */
function Gamification() {
  const badges = [
    { icon: '🎯', title: 'Primera sangre', desc: 'Aprueba tu primera entrevista' },
    { icon: '🔥', title: 'En racha', desc: '3 días consecutivos' },
    { icon: '💯', title: 'Perfeccionista', desc: '100/100 en una entrevista' },
    { icon: '🏆', title: 'Veterano', desc: '10 tickets completados' },
    { icon: '🧠', title: 'Maestro', desc: 'Alcanza nivel 5' },
    { icon: '👑', title: 'Leyenda', desc: 'Acumula 1000 XP' },
  ]

  return (
    <section id="gamificacion" className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Gamificación</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Aprende jugando, sube de nivel
          </h2>
          <p className="mt-4 text-pretty text-slate-600 dark:text-slate-400">
            XP, niveles, rachas y logros desbloqueables. Compite en el ranking global y demuestra tu progreso.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {/* XP/Level mockup */}
          <Reveal>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 p-6 backdrop-blur">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xl">
                  5
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 dark:text-white">Nivel 5 — Maestro</p>
                  <div className="mt-1.5 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 w-[65%]" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">650 / 1000 XP para nivel 6</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">⭐ 850 XP total</span>
                <span className="flex items-center gap-1.5">🔥 7 días de racha</span>
                <span className="flex items-center gap-1.5">🏆 #3 en ranking</span>
              </div>
            </div>
          </Reveal>

          {/* Badges grid */}
          <Reveal delay={100}>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 p-6 backdrop-blur">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">8 logros desbloqueables</p>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((b) => (
                  <div key={b.title} className="flex flex-col items-center text-center p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
                    <span className="text-2xl mb-1">{b.icon}</span>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{b.title}</p>
                    <p className="text-[10px] text-slate-400">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─── Evaluation Section ─── */
const dimensions = [
  { label: 'Comprensión del problema', value: 88 },
  { label: 'Justificación técnica', value: 76 },
  { label: 'Conocimiento de alternativas', value: 82 },
  { label: 'Conciencia de limitaciones', value: 71 },
  { label: 'Claridad de comunicación', value: 90 },
]

function Evaluation() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Evaluación</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Tu comprensión, medida en 5 dimensiones
          </h2>
          <p className="mt-4 text-pretty text-slate-600 dark:text-slate-400">
            No solo si funciona — sino si entiendes por qué funciona.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          {/* Radar chart */}
          <Reveal className="flex justify-center">
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 p-6 backdrop-blur">
              <RadarChart />
            </div>
          </Reveal>

          {/* Bars */}
          <div className="space-y-5">
            {dimensions.map((d, i) => (
              <Reveal key={d.label} delay={i * 80}>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
                    <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{d.value}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${d.value}%` }}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Radar Chart SVG ─── */
function RadarChart() {
  const SIZE = 260
  const CENTER = SIZE / 2
  const RADIUS = 100

  function point(index: number, ratio: number) {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    return {
      x: CENTER + Math.cos(angle) * RADIUS * ratio,
      y: CENTER + Math.sin(angle) * RADIUS * ratio,
    }
  }

  const dataPoints = dimensions.map((d, i) => point(i, d.value / 100))
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-auto w-full max-w-[300px]" role="img" aria-label="Radar de evaluación">
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={dimensions.map((_, i) => { const p = point(i, level); return `${p.x},${p.y}` }).join(' ')}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={1}
        />
      ))}
      {dimensions.map((_, i) => {
        const p = point(i, 1)
        return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
      })}
      <polygon points={dataPath} fill="rgba(99,102,241,0.2)" stroke="rgb(99,102,241)" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="rgb(99,102,241)" />
      ))}
    </svg>
  )
}

/* ─── Tech Stack ─── */
const stack = [
  'React 19', 'TypeScript', 'Tailwind CSS', 'FastAPI', 'Python',
  'Gemini AI', 'Groq AI', 'Supabase', 'PostgreSQL', 'AWS',
  'GitHub API', 'Redux Toolkit', 'Vite',
]

function TechStack() {
  return (
    <section id="tech-stack" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal>
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Tech Stack</span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Construido con tecnología moderna
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 backdrop-blur transition-colors hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 px-6 py-14 text-center backdrop-blur-xl sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/15 blur-[120px]" />
            <div className="relative">
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                ¿Listo para demostrar que{' '}
                <span className="text-indigo-600 dark:text-indigo-400">entiendes tu código?</span>
              </h2>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all hover:scale-[1.02]"
              >
                <GitBranch className="size-5" />
                Conecta tu GitHub
              </Link>
              <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                Gratis. Sin tarjeta. Solo tu código y tus ganas de mejorar.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <DevCoachLogo className="h-7 w-7" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">DevCoach AI</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} DevCoach AI — Hackathon Kiro 2026
          </p>
          <p className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            Made with <Heart className="size-4 fill-pink-500 text-pink-500" /> and AI
          </p>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Built by{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">Camilo</span>,{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">Abner</span>,{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">Carolina</span> &{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">Génesis</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ─── Main Landing Page Export ─── */
export function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Agents />
      <VoiceInterview />
      <Gamification />
      <Evaluation />
      <TechStack />
      <FinalCTA />
      <Footer />
    </div>
  )
}
