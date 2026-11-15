# 🐾 KOMI's K-Culture Diary

A thread-style PWA where the whole world reads **KOMI's everyday-Korea diary** — K-food, K-place, K-beauty and daily life — written by **KOMI's Unnie** (@ajakstudio.lab) and read by global fans.

**Live app:** https://ajak-75.github.io/KOMI-Diary/

## What it is

- **Pure white Threads-style feed** — one vertical timeline, no category tabs, hairline dividers, high-readability black type.
- **5-language UI** — English · 한국어 · 日本語 · 中文 · Español, switchable from the header pill. Choice is remembered on device.
- **Per-post Translate toggle** — sample posts carry ready-made translations (KO/JA/ZH/ES); tap 🌐 **Translate** to read in your language, **See original** to switch back.
- **Write & attach photos** — nickname (default `KOMI's Unnie`), body (500 chars), hashtags, up to 4 photos. Photos are resized on a canvas (long edge ≤1280px) and stored in `localStorage`, so the diary survives reloads.
- **Thread actions** — like ❤️, reply threads, repost 🔁, share (Web Share API → copy-link fallback, deep links like `#d=<id>`).
- **Bottom navigation** — Home · Search (tag chips + text) · Post (+) · My Diary (my posts / liked).
- **PWA** — installable on Android Chrome ("Add to Home screen", standalone full-screen) and iOS Safari; offline shell via service worker.
- **Dancheong accents** — a hand-made SVG 단청 꽃무늬 emblem (slate blue `#4B7F9F`, coral red `#E05A47`, warm orange `#EB7A2D`, sage green `#6E946B`, golden yellow `#D9B44A`) as the brand mark, the daily "오늘의 단청 스탬프" date banner, and tag-chip color points. Background stays clean white.

## Run locally

Static files only — no build step:

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

(Open via `localhost` or HTTPS so the service worker and `navigator.share` activate.)

## Files

| File | Role |
| --- | --- |
| `index.html` | App shell: header, language pill, feed, compose sheet, tab bar |
| `styles.css` | White light theme + dancheong accent tokens |
| `app.js` | Feed/state/i18n/compose/photos — vanilla JS, `localStorage` persistence |
| `manifest.webmanifest` | PWA manifest (standalone, icons) |
| `sw.js` | Offline-first service worker cache |
| `icon.svg`, `icons/` | Dancheong flower icon set (any + maskable) |
| `img/` | KOMI avatar, sample diary photos, dancheong emblem |

## Roadmap

- **Supabase** (or similar) for a shared global feed + auth, replacing device-local storage
- Push notifications for new replies
- Video attachments and multi-language auto-translate
