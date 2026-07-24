/**
 * UserAvatar — generates a colored avatar with initials based on the user's name.
 * Each unique name produces a consistent, visually distinct color.
 */

interface UserAvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Palette of distinct, accessible colors for avatars
const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-blue-500',
  'bg-fuchsia-500',
  'bg-lime-600',
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % AVATAR_COLORS.length
}

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
}

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const initials = getInitials(name || 'U')
  const color = AVATAR_COLORS[getColorIndex(name || 'User')]

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white ${color} ${sizeClasses[size]} ${className}`}
      aria-label={`Avatar de ${name}`}
    >
      {initials}
    </span>
  )
}
