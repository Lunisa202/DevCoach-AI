interface DevCoachLogoProps {
  className?: string
}

export function DevCoachLogo({ className = 'h-12 w-12' }: DevCoachLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      aria-label="DevCoach AI logo"
    >
      {/* Outer circle — represents coaching/guidance */}
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" className="text-indigo-600 dark:text-indigo-400" />

      {/* Code brackets </> */}
      <path
        d="M22 24l-8 8 8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-700 dark:text-slate-200"
      />
      <path
        d="M42 24l8 8-8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-700 dark:text-slate-200"
      />

      {/* AI spark — small diamond/star in center */}
      <path
        d="M32 22l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"
        fill="currentColor"
        className="text-indigo-600 dark:text-indigo-400"
      />
    </svg>
  )
}
