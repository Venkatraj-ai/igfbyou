export type Platform = 'youtube' | 'instagram' | 'facebook'

export interface MediaFormat {
  id: string
  label: string
  kind: 'video' | 'audio' | 'image'
  ext: string
  /** Absolute media URL (downloaded through /api/download) */
  url: string
  size?: number
  hasAudio?: boolean
}

export interface MediaResult {
  platform: Platform
  title: string
  author?: string
  thumbnail?: string
  durationSeconds?: number
  formats: MediaFormat[]
}

export const PLATFORMS: Record<
  Platform,
  { name: string; color: string; hosts: string[]; example: string }
> = {
  youtube: {
    name: 'YouTube',
    color: '#ff3b30',
    hosts: ['youtube.com', 'youtu.be'],
    example: 'https://www.youtube.com/watch?v=…',
  },
  instagram: {
    name: 'Instagram',
    color: '#e1306c',
    hosts: ['instagram.com'],
    example: 'https://www.instagram.com/reel/…',
  },
  facebook: {
    name: 'Facebook',
    color: '#1877f2',
    hosts: ['facebook.com', 'fb.watch', 'fb.com'],
    example: 'https://www.facebook.com/watch?v=…',
  },
}

export function detectPlatform(input: string): Platform | null {
  let host: string
  try {
    host = new URL(input.trim()).hostname.toLowerCase()
  } catch {
    return null
  }
  for (const [key, p] of Object.entries(PLATFORMS) as [Platform, (typeof PLATFORMS)[Platform]][]) {
    if (p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) return key
  }
  return null
}

export function formatBytes(bytes?: number) {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export function formatDuration(seconds?: number) {
  if (!seconds) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}
