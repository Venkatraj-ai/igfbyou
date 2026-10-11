# Reelfetch

Reelfetch is a free video downloader for **YouTube**, **Instagram** and **Facebook**. Paste a public link, pick a quality (HD/SD video or audio-only) and the file downloads straight to your device. No account, no app, nothing stored on the server.

## Features

- Automatic platform detection as you paste (YouTube videos & Shorts, Instagram reels/posts, Facebook videos/reels/fb.watch)
- Video preview with title, author, duration and every available quality
- One-click downloads with clean filenames, streamed through a locked-down proxy
- One-tap "Paste" from clipboard, plus a "Recent" list kept only in the browser
- Responsive, mobile-first UI

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, server routes)
- Tailwind CSS 4
- [`@distube/ytdl-core`](https://github.com/distubejs/ytdl-core) for YouTube format extraction
- Public page metadata parsing for Instagram and Facebook
- Optional: any [cobalt](https://github.com/imputnet/cobalt)-compatible API for more robust extraction
- Deployed on Netlify (server routes run as Netlify Functions)

## Running locally

```bash
pnpm install
netlify dev   # or: pnpm dev
```

## Configuration (optional)

| Variable | Purpose |
|----------|---------|
| `COBALT_API_URL` | URL of a cobalt-compatible instance. When set it is tried first for every platform. |
| `COBALT_API_KEY` | API key for that instance, if it requires one. |

Without these, the built-in extractors are used.

## Known limits

- Platforms change their pages often and may block requests from cloud servers. If YouTube or Instagram extraction starts failing, set `COBALT_API_URL` to a self-hosted cobalt instance.
- Downloads stream through a serverless function, so very long or large files can hit function time and size limits. Short clips, reels and Shorts work best.
- YouTube 1080p+ is offered as video-only (YouTube stores audio separately); merged formats are labeled with audio.

## Responsible use

Only download content you own or have permission to use, and respect each platform's terms and creators' rights.
