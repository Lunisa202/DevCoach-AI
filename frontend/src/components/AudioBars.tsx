import './AudioBars.css'

interface Props {
  isActive: boolean
  color?: 'indigo' | 'emerald'
  size?: 'sm' | 'md'
}

export function AudioBars({ isActive, color = 'indigo', size = 'md' }: Props) {
  const containerClass = `audio-bars audio-bars--${size}`
  const barClass = [
    'audio-bar',
    `audio-bar--${size}`,
    `audio-bar--${color}`,
    isActive ? 'audio-bar--active' : 'audio-bar--paused',
  ].join(' ')

  return (
    <div className={containerClass}>
      <div className={barClass} />
      <div className={barClass} />
      <div className={barClass} />
      <div className={barClass} />
      <div className={barClass} />
    </div>
  )
}
