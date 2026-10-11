# AGENTS.md

Reelfetch — a single-page YouTube / Instagram / Facebook video downloader built with TanStack Start on Netlify.

## Architecture

```
src/
├── components/
│   ├── PlatformIcon.tsx   # Inline SVG brand marks (use var(--ink) for cut-outs)
│   └── ResultCard.tsx     # Preview + format list; downloadHref() builds proxy links
├── lib/
│   ├── platforms.ts       # Shared (client+server): types, PLATFORMS config, detectPlatform, formatters
│   └── resolver.server.ts # Server-only extraction: cobalt → ytdl-core (YouTube) → page parsing (IG/FB)
├── routes/
│   ├── __root.tsx         # HTML shell + SEO meta
│   ├── index.tsx          # The whole product UI: hero/input, results, history, how-it-works, FAQ
│   └── api/
│       ├── resolve.ts     # POST { url } → MediaResult | { error }
│       └── download.ts    # GET ?url&name[&inline] → streams media with Content-Disposition
└── styles.css             # Tailwind 4 + theme tokens (--ink, --panel, --lime), fonts, animations
```

## Key decisions

- **Proxy allowlist**: `/api/download` only fetches HTTPS URLs on `ALLOWED_MEDIA_HOSTS` (+ the cobalt host when configured) to avoid becoming an open proxy / SSRF vector. Add hosts there if a platform moves its CDN.
- **Why proxy at all**: YouTube `googlevideo.com` URLs are IP-bound to the server that resolved them, and Meta CDNs block hotlinking, so the browser can't fetch them directly. Thumbnails also go through the proxy with `inline=1`.
- **Errors**: throw `ResolveError` for user-facing messages; anything else becomes a generic message and is logged.
- **No server persistence**: nothing needs to be stored. "Recent" links live in `localStorage` (`reelfetch:history`).
- **Optional cobalt**: `COBALT_API_URL` / `COBALT_API_KEY` env vars switch on an external extractor which is tried first; built-in extractors are the fallback.

## Conventions

- TypeScript strict, `@/` alias for `src/`, Tailwind utility classes, lucide-react icons.
- Server-only code lives in `*.server.ts` files and is imported only from API routes.
- Keep the copy honest about responsible use (only download content you own or have permission to use).
