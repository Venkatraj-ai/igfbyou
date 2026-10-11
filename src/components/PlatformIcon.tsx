import type { Platform } from '@/lib/platforms'

export function PlatformIcon({ platform, className = 'h-5 w-5' }: { platform: Platform; className?: string }) {
  if (platform === 'youtube')
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="1.5" y="5" width="21" height="14" rx="4.5" fill="currentColor" />
        <path d="M10 9.2v5.6l4.8-2.8z" fill="var(--ink)" />
      </svg>
    )
  if (platform === 'instagram')
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="currentColor" />
      <path
        d="M13.3 21.5v-7h2.4l.4-2.8h-2.8V9.9c0-.8.3-1.4 1.4-1.4h1.5V6a19 19 0 0 0-2.2-.1c-2.2 0-3.6 1.3-3.6 3.7v2.1H8v2.8h2.4v7"
        fill="var(--ink)"
      />
    </svg>
  )
}
