import { createFileRoute } from '@tanstack/react-router'
import { isAllowedMediaUrl } from '@/lib/resolver.server'

function safeFilename(name: string) {
  return (
    name
      .replace(/[^\p{L}\p{N} ._-]+/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'video'
  )
}

export const Route = createFileRoute('/api/download')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams
        const target = params.get('url') ?? ''
        if (!isAllowedMediaUrl(target)) {
          return new Response('This media host is not supported.', { status: 400 })
        }
        const filename = safeFilename(params.get('name') ?? 'video')

        const upstream = await fetch(target, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
            ...(request.headers.get('range') ? { Range: request.headers.get('range')! } : {}),
          },
        })
        if (!upstream.ok || !upstream.body) {
          return new Response('The media link expired. Go back and fetch the video again.', { status: 502 })
        }

        const headers = new Headers({
          'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
          'Content-Disposition': `${params.get('inline') ? 'inline' : 'attachment'}; filename="${filename.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Cache-Control': 'no-store',
        })
        for (const h of ['content-length', 'content-range', 'accept-ranges']) {
          const v = upstream.headers.get(h)
          if (v) headers.set(h, v)
        }
        return new Response(upstream.body, { status: upstream.status, headers })
      },
    },
  },
})
