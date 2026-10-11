import ytdl from '@distube/ytdl-core'
import type { MediaFormat, MediaResult, Platform } from './platforms'

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

/** Media CDNs the download proxy is allowed to fetch from. */
export const ALLOWED_MEDIA_HOSTS = [
  'googlevideo.com',
  'ytimg.com',
  'cdninstagram.com',
  'fbcdn.net',
]

export function isAllowedMediaUrl(raw: string) {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    const extra = process.env.COBALT_API_URL ? [new URL(process.env.COBALT_API_URL).hostname] : []
    return [...ALLOWED_MEDIA_HOSTS, ...extra].some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export class ResolveError extends Error {}

export async function resolveMedia(url: string, platform: Platform): Promise<MediaResult> {
  // Optional: an external cobalt-compatible extraction service is far more robust
  // against platform changes. Configure with COBALT_API_URL (+ COBALT_API_KEY).
  if (process.env.COBALT_API_URL) {
    try {
      return await resolveWithCobalt(url, platform)
    } catch (err) {
      console.warn('cobalt resolve failed, falling back', err)
    }
  }
  if (platform === 'youtube') return resolveYouTube(url)
  return resolveFromPage(url, platform)
}

async function resolveYouTube(url: string): Promise<MediaResult> {
  if (!ytdl.validateURL(url)) throw new ResolveError('That does not look like a YouTube video link.')
  let info: ytdl.videoInfo
  try {
    info = await ytdl.getInfo(url)
  } catch (err) {
    console.error('ytdl getInfo failed', err)
    throw new ResolveError('YouTube refused the request. The video may be private, age-restricted, or region-locked.')
  }
  const d = info.videoDetails
  const seen = new Set<string>()
  const formats: MediaFormat[] = []

  const muxed = info.formats
    .filter((f) => f.hasVideo && f.hasAudio && f.url)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
  for (const f of muxed) {
    const label = f.qualityLabel || `${f.height}p`
    if (seen.has(label)) continue
    seen.add(label)
    formats.push({
      id: String(f.itag),
      label,
      kind: 'video',
      ext: f.container || 'mp4',
      url: f.url,
      size: f.contentLength ? Number(f.contentLength) : undefined,
      hasAudio: true,
    })
  }

  const videoOnly = info.formats
    .filter((f) => f.hasVideo && !f.hasAudio && f.container === 'mp4' && f.url)
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
  for (const f of videoOnly) {
    const label = f.qualityLabel || `${f.height}p`
    if (seen.has(label)) continue
    seen.add(label)
    formats.push({
      id: String(f.itag),
      label: `${label} (no audio)`,
      kind: 'video',
      ext: 'mp4',
      url: f.url,
      size: f.contentLength ? Number(f.contentLength) : undefined,
      hasAudio: false,
    })
  }

  const audio = info.formats
    .filter((f) => f.hasAudio && !f.hasVideo && f.url)
    .sort((a, b) => (b.audioBitrate ?? 0) - (a.audioBitrate ?? 0))[0]
  if (audio) {
    formats.push({
      id: String(audio.itag),
      label: `Audio ${audio.audioBitrate ?? ''}kbps`.trim(),
      kind: 'audio',
      ext: audio.container === 'webm' ? 'webm' : 'm4a',
      url: audio.url,
      size: audio.contentLength ? Number(audio.contentLength) : undefined,
      hasAudio: true,
    })
  }

  if (!formats.length) throw new ResolveError('No downloadable formats were found for this video.')

  return {
    platform: 'youtube',
    title: d.title,
    author: d.author?.name,
    thumbnail: d.thumbnails?.at(-1)?.url,
    durationSeconds: Number(d.lengthSeconds) || undefined,
    formats,
  }
}

function decodeEscaped(s: string) {
  try {
    return JSON.parse(`"${s}"`) as string
  } catch {
    return s.replace(/\\\//g, '/')
  }
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function meta(html: string, prop: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop.replace(/:/g, '\\:')}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop.replace(/:/g, '\\:')}["']`,
    'i',
  )
  const m = html.match(re) || html.match(alt)
  return m ? decodeHtml(m[1]) : undefined
}

/** Instagram & Facebook: read public page metadata and embedded player JSON. */
async function resolveFromPage(url: string, platform: Platform): Promise<MediaResult> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Fetch-Mode': 'navigate',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new ResolveError(`The ${platformName(platform)} page could not be loaded (${res.status}).`)
  const html = await res.text()

  const formats: MediaFormat[] = []
  const push = (label: string, raw: string | undefined, kind: MediaFormat['kind'] = 'video') => {
    if (!raw) return
    const u = decodeHtml(decodeEscaped(raw))
    if (!u.startsWith('https://') || formats.some((f) => f.url === u)) return
    formats.push({ id: `${formats.length}`, label, kind, ext: kind === 'image' ? 'jpg' : 'mp4', url: u, hasAudio: kind === 'video' })
  }

  if (platform === 'facebook') {
    push('HD', html.match(/"(?:browser_native_hd_url|playable_url_quality_hd|hd_src)":"([^"]+)"/)?.[1])
    push('SD', html.match(/"(?:browser_native_sd_url|playable_url|sd_src)":"([^"]+)"/)?.[1])
  } else {
    push('Best', html.match(/"video_url":"([^"]+)"/)?.[1])
    const versions = html.match(/"video_versions":\[\{[^\]]*?"url":"([^"]+)"/)
    push('Original', versions?.[1])
  }
  push('Video', meta(html, 'og:video:secure_url') ?? meta(html, 'og:video'))

  const image = meta(html, 'og:image')
  if (!formats.length && image && platform === 'instagram') push('Photo', image, 'image')

  if (!formats.length) {
    throw new ResolveError(
      `No public video was found on that ${platformName(platform)} link. Private posts and stories need the owner's account, so they can't be saved.`,
    )
  }

  return {
    platform,
    title: meta(html, 'og:title') ?? `${platformName(platform)} video`,
    author: meta(html, 'og:site_name'),
    thumbnail: image,
    formats,
  }
}

interface CobaltResponse {
  status: 'tunnel' | 'redirect' | 'picker' | 'error' | 'local-processing'
  url?: string
  filename?: string
  picker?: { type: 'video' | 'photo' | 'gif'; url: string; thumb?: string }[]
  error?: { code: string }
}

async function resolveWithCobalt(url: string, platform: Platform): Promise<MediaResult> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (process.env.COBALT_API_KEY) headers.Authorization = `Api-Key ${process.env.COBALT_API_KEY}`

  const variants = [
    { label: '1080p', body: { url, videoQuality: '1080' } },
    { label: '720p', body: { url, videoQuality: '720' } },
    { label: 'Audio (MP3)', body: { url, downloadMode: 'audio', audioFormat: 'mp3' }, kind: 'audio' as const },
  ]
  const formats: MediaFormat[] = []
  let thumb: string | undefined
  let title: string | undefined

  for (const v of variants) {
    const r = await fetch(process.env.COBALT_API_URL!, { method: 'POST', headers, body: JSON.stringify(v.body) })
    const data = (await r.json()) as CobaltResponse
    if (data.status === 'error') throw new Error(data.error?.code ?? 'cobalt error')
    if ((data.status === 'tunnel' || data.status === 'redirect') && data.url) {
      title ??= data.filename?.replace(/\.[a-z0-9]+$/i, '')
      const ext = data.filename?.split('.').pop() ?? (v.kind === 'audio' ? 'mp3' : 'mp4')
      if (!formats.some((f) => f.label === v.label))
        formats.push({ id: v.label, label: v.label, kind: v.kind ?? 'video', ext, url: data.url, hasAudio: true })
    } else if (data.status === 'picker' && data.picker) {
      data.picker.forEach((p, i) =>
        formats.push({
          id: `p${i}`,
          label: `${p.type === 'photo' ? 'Photo' : 'Video'} ${i + 1}`,
          kind: p.type === 'photo' ? 'image' : 'video',
          ext: p.type === 'photo' ? 'jpg' : 'mp4',
          url: p.url,
        }),
      )
      thumb = data.picker[0]?.thumb
      break
    }
  }
  if (!formats.length) throw new Error('cobalt returned no media')
  return { platform, title: title ?? `${platformName(platform)} video`, thumbnail: thumb, formats }
}

function platformName(p: Platform) {
  return p === 'youtube' ? 'YouTube' : p === 'instagram' ? 'Instagram' : 'Facebook'
}
