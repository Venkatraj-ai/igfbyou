import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ClipboardPaste, Loader2, ShieldCheck, Zap, Smartphone, X, History, ChevronDown } from 'lucide-react'
import { PLATFORMS, detectPlatform, type MediaResult, type Platform } from '@/lib/platforms'
import { PlatformIcon } from '@/components/PlatformIcon'
import { ResultCard } from '@/components/ResultCard'

export const Route = createFileRoute('/')({
  component: Home,
})

interface HistoryItem {
  url: string
  title: string
  platform: Platform
  at: number
}

const HISTORY_KEY = 'reelfetch:history'

const FAQ = [
  {
    q: 'Is Reelfetch free?',
    a: 'Yes. There is no sign-up, no watermark and no limit on how many links you paste.',
  },
  {
    q: 'Which links work?',
    a: 'Public YouTube videos and Shorts, Instagram reels and video posts, and Facebook videos, reels and fb.watch links. Private, age-restricted or members-only content cannot be fetched.',
  },
  {
    q: 'Why does a YouTube quality say “no audio”?',
    a: 'YouTube stores high resolutions (1080p and up) as separate video and audio streams. The formats marked with audio are ready to play; the others are video-only.',
  },
  {
    q: 'Do you store my videos?',
    a: 'No. Files stream straight from the platform to your device. Your recent links are kept only in this browser and you can clear them any time.',
  },
  {
    q: 'Can I download anything I want?',
    a: 'Only save videos you own or have permission to use. Respect creators and each platform’s terms — re-uploading someone else’s work without consent is not okay.',
  },
]

function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MediaResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const detected = detectPlatform(url)

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'))
    } catch {
      /* ignore */
    }
  }, [])

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  }

  async function fetchVideo(target = url) {
    const link = target.trim()
    if (!link) return inputRef.current?.focus()
    if (!detectPlatform(link)) {
      setError('Paste a link from YouTube, Instagram or Facebook.')
      return
    }
    setUrl(link)
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not fetch that link.')
      setResult(data)
      saveHistory(
        [{ url: link, title: data.title, platform: data.platform, at: Date.now() }, ...history.filter((h) => h.url !== link)].slice(0, 6),
      )
      requestAnimationFrame(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch that link.')
    } finally {
      setLoading(false)
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setUrl(text.trim())
        if (detectPlatform(text)) fetchVideo(text)
      }
    } catch {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="grain" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <a href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--lime)] text-[var(--ink)]">
            <ArrowRight className="h-5 w-5 rotate-90" strokeWidth={3} />
          </span>
          <span className="font-display text-2xl tracking-tight">Reelfetch</span>
        </a>
        <nav className="hidden gap-8 text-sm text-white/60 sm:flex">
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:pt-16">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORMS) as Platform[]).map((key) => {
              const active = detected === key
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
                    active ? 'border-transparent bg-white text-[var(--ink)]' : 'border-white/15 text-white/70'
                  }`}
                  style={{ color: active ? undefined : PLATFORMS[key].color }}
                >
                  <PlatformIcon platform={key} className="h-4 w-4" />
                  <span className={active ? '' : 'text-white/80'}>{PLATFORMS[key].name}</span>
                </span>
              )
            })}
          </div>

          <h1 className="font-display mt-8 max-w-4xl text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.92] tracking-tight">
            Save the video.
            <br />
            <span className="text-[var(--lime)]">Skip the hassle.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/60">
            Paste any public YouTube, Instagram or Facebook link and download it in the quality you want — MP4 video or audio, no app, no account.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchVideo()
            }}
            className="mt-10 max-w-3xl"
          >
            <div className="flex flex-col gap-2 rounded-[26px] border border-white/12 bg-[var(--panel)] p-2 shadow-[0_30px_80px_-30px_rgba(200,255,62,0.25)] focus-within:border-[var(--lime)] sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3 pl-3">
                <span className="text-white/40" style={{ color: detected ? PLATFORMS[detected].color : undefined }}>
                  {detected ? <PlatformIcon platform={detected} /> : <ArrowRight className="h-5 w-5" />}
                </span>
                <input
                  ref={inputRef}
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setError(null)
                  }}
                  placeholder="Paste a video link…"
                  aria-label="Video link"
                  className="h-14 w-full min-w-0 bg-transparent text-lg text-white placeholder:text-white/30 focus:outline-none"
                />
                {url && (
                  <button type="button" onClick={() => setUrl('')} className="p-1 text-white/40 hover:text-white" aria-label="Clear">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={pasteFromClipboard}
                  className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-[20px] border border-white/12 px-5 text-white/80 hover:bg-white/5 sm:flex-none"
                >
                  <ClipboardPaste className="h-5 w-5" /> Paste
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-[20px] bg-[var(--lime)] px-7 text-lg font-bold text-[var(--ink)] transition hover:brightness-110 disabled:opacity-70 sm:flex-none"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {loading ? 'Fetching' : 'Get video'}
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </form>

          {history.length > 0 && !result && !loading && (
            <div className="mt-8 max-w-3xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                  <History className="h-3.5 w-3.5" /> Recent
                </p>
                <button onClick={() => saveHistory([])} className="text-xs text-white/40 hover:text-white">
                  Clear
                </button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <li key={h.url}>
                    <button
                      onClick={() => fetchVideo(h.url)}
                      className="inline-flex max-w-[18rem] items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75 hover:border-white/30"
                    >
                      <span style={{ color: PLATFORMS[h.platform].color }}>
                        <PlatformIcon platform={h.platform} className="h-4 w-4" />
                      </span>
                      <span className="truncate">{h.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section id="result" className="mx-auto max-w-6xl scroll-mt-6 px-5">
          {loading && (
            <div className="grid gap-6 rounded-[28px] border border-white/10 bg-[var(--panel)] p-6 md:grid-cols-[320px_1fr]">
              <div className="shimmer aspect-video rounded-2xl md:aspect-[4/5]" />
              <div className="space-y-3">
                <div className="shimmer h-8 w-3/4 rounded-lg" />
                <div className="shimmer h-4 w-1/3 rounded" />
                <div className="h-6" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="shimmer h-14 rounded-2xl" />
                ))}
              </div>
            </div>
          )}
          {result && <ResultCard result={result} />}
        </section>

        <section id="how" className="mx-auto mt-28 max-w-6xl px-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--lime)]">How it works</p>
          <h2 className="font-display mt-3 text-4xl sm:text-5xl">Three steps. About five seconds.</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Copy the link', 'Tap Share → Copy link on any YouTube, Instagram or Facebook video.'],
              ['Paste it here', 'Drop it in the box above. We detect the platform automatically.'],
              ['Pick a quality', 'Choose HD, SD or audio and the file lands in your downloads.'],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-[24px] border border-white/10 bg-[var(--panel)] p-6">
                <span className="font-display text-5xl text-white/15">0{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-white/55">{d}</p>
              </li>
            ))}
          </ol>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              [Zap, 'No sign-up', 'Nothing to install, nothing to register.'],
              [Smartphone, 'Works on phones', 'Built for the share-sheet → paste flow.'],
              [ShieldCheck, 'Nothing stored', 'Files stream straight to your device.'],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Zap
              return (
                <div key={t as string} className="flex gap-4 rounded-[24px] border border-white/10 p-5">
                  <I className="h-6 w-6 shrink-0 text-[var(--lime)]" />
                  <div>
                    <p className="font-semibold">{t as string}</p>
                    <p className="text-sm text-white/50">{d as string}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section id="faq" className="mx-auto mt-28 max-w-3xl px-5">
          <h2 className="font-display text-4xl sm:text-5xl">Questions</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-white/40 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-white/60">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto mt-28 max-w-6xl border-t border-white/10 px-5 py-10 text-sm text-white/40">
        <p>
          © {new Date().getFullYear()} Reelfetch. Not affiliated with YouTube, Instagram, Facebook or Meta. Only download content you own or have
          permission to use.
        </p>
      </footer>
    </div>
  )
}
