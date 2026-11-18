# 🐾 KOMI's K-Culture Diary

A thread-style PWA where the whole world reads **KOMI's everyday-Korea diary** — K-food, K-place, K-beauty and daily life — written by **KOMI's Unnie** (@ajakstudio.lab) and read by global fans.

**Live app:** https://ajak-75.github.io/KOMI-Diary/

## What it is

- **Pure white Threads-style feed** — one vertical timeline, no category tabs, hairline dividers, high-readability black type.
- **The visitor's own language, from the first page** — the UI opens in the language the phone reports (`navigator.languages[0] || navigator.language`): nothing has to be picked first. **Sixteen languages travel with the app** (English · 한국어 · 日本語 · 中文 · Español · Português · Français · Deutsch · Italiano · Русский · Tiếng Việt · ไทย · Bahasa Indonesia · हिन्दी · العربية · Türkçe), five written out in `app.js` and eleven in `i18n-world.js`, so they appear instantly and work offline. **Any other language code** is translated once on the device through Google's public endpoint (`clients5.google.com/translate_a/t`, batched, `{tokens}` and the app's own names protected) and cached as `komi_ui_i18n_{lang}`; the next visit opens in it with no request, and a failed translation falls back to English. **Arabic and every other right-to-left code** flip the page (`dir="rtl"`). A phone set to Traditional Chinese gets its own `zh-TW` translation. The header pill switches language by hand (remembered), `Device language` goes back to following the phone, and `?lang=fr` overrides both for checking. Dates, month names and relative times follow the language through `Intl`.
- **Per-post live translate** — every post, the user's own included, has a 🌐 **Translate** toggle. It asks Google's translate endpoint (`translate_a/single`, `sl=auto`) for the language currently chosen in the header, keeps the result in memory for the session, and collapses back with **See original**. When the detected source already matches the target it says so instead.
- **Write & attach photos or video** — nickname (default `KOMI's Unnie`), body (500 chars), hashtags, up to 4 attachments of `image/*` and `video/*`. Photos are re-encoded on a canvas (long edge ≤1280px, JPEG) and videos kept up to 15MB and clipped at 15s (10s recommended; the length is read from the file's metadata before attaching); both go into **IndexedDB** as blobs (`komidiary.media`), while `localStorage` keeps only the text and small `{id, kind}` refs. Videos play inline with `controls playsinline`. Older posts whose photos were stored as data-URLs in `localStorage` are migrated into IndexedDB on first load.
- **Thread actions** — like ❤️, reply threads, repost 🔁, share (Web Share API → copy-link fallback, deep links like `#d=<id>`).
- **Bottom navigation** — Home · Search (tag chips + text) · Post (+) · MOMO Shop · My Diary (my posts / liked).
- **🛍️ MOMO Shop** — Momo's tsundere shop tab (`renderShop`): a banner card built from the user's Momo artwork (`img/momo-shop-banner.jpg`, `img/momo-avatar.jpg`), a translated Momo line, and products the user adds herself — one photo (IndexedDB), name, price, shop link and **Momo's tsundere one-liner** shown in a speech bubble with the same 🌐 translate toggle as a post. Text lives in `localStorage` (`komidiary.shop.v1`), the shelf starts empty (no sample products), and each card has edit / delete / "Shop" link.
- **💘 K-Star Kemi Match** — a `💘 K-Star Kemi Match` strip on top of the home feed opens a bottom sheet where a fan types their bias's name and birthday plus their own. Birth years map to the twelve Korean zodiac animals (12지신) and the pair's relation (육합 / 삼합 / 같은 띠 / 무난 / 상충) gives a deterministic **Kemi score (78–99%)**, the day's lucky **obangsaek** colour and a one-liner from KOMI — in every language the app carries. **Brag on my diary** fills the compose sheet with the reading and the tags `#KemiMatch #KOMIDiary`. For fun only: the real zodiac year follows Lunar New Year.
- **📜 Kemi Promise + first-pass filter** — five community promises (respect · no ads/spam · photos & copyright · personal info · share warmly) live in a `📜 Kemi Promise` sheet inside **My Diary**, not on the feed, in every language the app carries. Every new diary, edit and reply is checked on the device before it is saved — swearing/insults/hate, gambling, adult and ad wording (KO/EN/JA/ZH/ES), outside and spam links (`http(s)://`, `www.`, `t.me/`, `bit.ly`, `open.kakao.com`, bare domains, e-mails) and phone/account patterns. A hit holds the post back and shows a translated warning with a link to the promise sheet; the MOMO Shop product-link field is deliberately not filtered.
- **👤 My profile** — the top of **My Diary** is her own profile card: photo, nickname and a one-line intro, with a **프로필 편집 / Edit profile** button. The sheet takes an `image/*` photo that is centre-cropped square and re-encoded to a **256×256 JPEG** before it is kept as a data URL in `localStorage` (`komidiary.v1 → me.avatar`), offers **Back to the default photo** (KOMI's picture), a nickname of up to **20 characters** (empty is refused with a toast) and an intro of up to **80 characters** checked by the same Kemi filter as a post — a hit shows the 5-language Kemi Promise warning instead of saving. Saving rewrites her nickname on every diary and reply she already wrote, and her posts, comments and the compose row read the photo live from the profile, so one save changes all of them. In every language the app carries.
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
| `app.js` | Feed/state/i18n/compose/media/translate — vanilla JS; text in `localStorage`, media in IndexedDB |
| `i18n-world.js` | Eleven bundled world-language tables, laid over the English one in `app.js` |
| `manifest.webmanifest` | PWA manifest (standalone, icons) |
| `sw.js` | Offline-first service worker cache |
| `icon.svg`, `icons/` | Dancheong flower icon set (any + maskable) |
| `img/` | KOMI avatar, dancheong emblem, MOMO Shop banner + Momo avatar |

## Roadmap

- **Supabase** (or similar) for a shared global feed + auth, replacing device-local storage
- Push notifications for new replies
- Shared multi-user feed (Supabase) and server-side translation memory
