'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {mounted && isDark ? (
        <Sun className="size-[18px]" />
      ) : (
        <Moon className="size-[18px]" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </button>
  )
}
