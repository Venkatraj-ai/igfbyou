import { createFileRoute } from '@tanstack/react-router'
import { detectPlatform } from '@/lib/platforms'
import { ResolveError, resolveMedia } from '@/lib/resolver.server'

export const Route = createFileRoute('/api/resolve')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let url = ''
        try {
          url = String(((await request.json()) as { url?: string }).url ?? '').trim()
        } catch {
          return Response.json({ error: 'Invalid request body.' }, { status: 400 })
        }
        const platform = detectPlatform(url)
        if (!platform) {
          return Response.json(
            { error: 'Paste a link from YouTube, Instagram or Facebook.' },
            { status: 400 },
          )
        }
        try {
          const result = await resolveMedia(url, platform)
          return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
        } catch (err) {
          const message =
            err instanceof ResolveError ? err.message : 'Something went wrong while fetching that link. Try again.'
          if (!(err instanceof ResolveError)) console.error(err)
          return Response.json({ error: message }, { status: 422 })
        }
      },
    },
  },
})
