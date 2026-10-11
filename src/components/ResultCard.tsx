import { Download, Music, Image as ImageIcon, Film, Clock, User } from 'lucide-react'
import { PLATFORMS, formatBytes, formatDuration, type MediaResult } from '@/lib/platforms'
import { PlatformIcon } from './PlatformIcon'

export function downloadHref(url: string, name: string, inline = false) {
  const q = new URLSearchParams({ url, name })
  if (inline) q.set('inline', '1')
  return `/api/download?${q}`
}

export function ResultCard({ result }: { result: MediaResult }) {
  const p = PLATFORMS[result.platform]
  const base = result.title.slice(0, 80)

  return (
    <article className="result-in grid gap-6 rounded-[28px] border border-white/10 bg-[var(--panel)] p-4 sm:p-6 md:grid-cols-[minmax(0,320px)_1fr]">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/40 md:aspect-[4/5]">
        {result.thumbnail ? (
          <img
            src={downloadHref(result.thumbnail, 'thumb', true)}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid h-full place-items-center text-white/30">
            <Film className="h-12 w-12" />
          </div>
        )}
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold backdrop-blur"
          style={{ color: p.color }}
        >
          <PlatformIcon platform={result.platform} className="h-4 w-4" />
          <span className="text-white">{p.name}</span>
        </span>
        {result.durationSeconds ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-0.5 font-mono text-xs">
            {formatDuration(result.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col">
        <h2 className="font-display text-2xl leading-tight text-white sm:text-3xl">{result.title}</h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/55">
          {result.author && (
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" /> {result.author}
            </span>
          )}
          {result.durationSeconds ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {formatDuration(result.durationSeconds)}
            </span>
          ) : null}
        </div>

        <p className="mt-6 mb-3 font-mono text-xs uppercase tracking-[0.2em] text-white/40">Choose a format</p>
        <ul className="grid gap-2">
          {result.formats.map((f) => {
            const Icon = f.kind === 'audio' ? Music : f.kind === 'image' ? ImageIcon : Film
            return (
              <li key={f.id}>
                <a
                  href={downloadHref(f.url, `${base}${f.kind === 'audio' ? '' : ` ${f.label.split(' ')[0]}`}.${f.ext}`)}
                  className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-[var(--lime)] hover:bg-[var(--lime)]/10"
                >
                  <Icon className="h-5 w-5 shrink-0 text-white/50 group-hover:text-[var(--lime)]" />
                  <span className="font-semibold text-white">{f.label}</span>
                  <span className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[11px] uppercase text-white/60">
                    {f.ext}
                  </span>
                  {f.size ? <span className="font-mono text-xs text-white/40">{formatBytes(f.size)}</span> : null}
                  <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--lime)] px-4 py-1.5 text-sm font-bold text-[var(--ink)] transition group-hover:scale-105">
                    <Download className="h-4 w-4" /> Download
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-xs text-white/35">
          Links expire after a few hours. If a download fails, fetch the video again.
        </p>
      </div>
    </article>
  )
}
