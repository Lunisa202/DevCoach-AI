/**
 * SkillRadar — SVG radar/spider chart for user's skill dimensions.
 * Renders a pentagon with the 5 evaluation dimensions averaged over time.
 */

interface SkillData {
  dimension: string
  score: number
  max_score: number
  count: number
}

interface SkillRadarProps {
  skills: SkillData[]
  size?: number
}

export function SkillRadar({ skills, size = 280 }: SkillRadarProps) {
  if (skills.length === 0) return null

  const CENTER = size / 2
  const RADIUS = size * 0.38
  const n = skills.length

  function point(index: number, ratio: number) {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    return {
      x: CENTER + Math.cos(angle) * RADIUS * ratio,
      y: CENTER + Math.sin(angle) * RADIUS * ratio,
    }
  }

  const dataPoints = skills.map((s, i) => point(i, s.score / s.max_score))
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
  const gridLevels = [0.25, 0.5, 0.75, 1]

  // Short labels for dimensions
  const shortLabels: Record<string, string> = {
    'Comprensión del problema': 'Comprensión',
    'Justificación técnica': 'Justificación',
    'Conocimiento de alternativas': 'Alternativas',
    'Conciencia de limitaciones': 'Limitaciones',
    'Claridad de comunicación': 'Comunicación',
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] h-auto">
        {/* Grid rings */}
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={skills.map((_, i) => { const p = point(i, level); return `${p.x},${p.y}` }).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-700"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {skills.map((_, i) => {
          const p = point(i, 1)
          return <line key={i} x1={CENTER} y1={CENTER} x2={p.x} y2={p.y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
        })}

        {/* Data area */}
        <polygon
          points={dataPath}
          fill="rgba(99,102,241,0.15)"
          stroke="rgb(99,102,241)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="rgb(99,102,241)" stroke="white" strokeWidth={2} />
        ))}

        {/* Labels */}
        {skills.map((s, i) => {
          const labelPos = point(i, 1.25)
          const label = shortLabels[s.dimension] ?? s.dimension
          return (
            <text
              key={i}
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-600 dark:fill-slate-400 text-[10px] font-medium"
            >
              {label}
            </text>
          )
        })}
      </svg>

      {/* Legend with scores */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
        {skills.map(s => (
          <div key={s.dimension} className="text-center">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{s.score}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">/ {s.max_score}</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {shortLabels[s.dimension] ?? s.dimension}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
