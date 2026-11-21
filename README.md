[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/KENAHA01/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/KENAHA01/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Nights — GTA-style cover maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)

Entry for the [make.fun bounty gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01):
a web app that turns a person's own photos and a caption into cover art in the
style of GTA 6's posters — slanted multi-panel collage, bold condensed
lettering, a Vice City sunset or neon colour grade — and exports it as a PNG
to share.

## How it works

Open `app/index.html` in a desktop browser (or run `node serve.ts` and open
http://localhost:8080). Everything runs offline from static files; photos are
read on your own machine and never uploaded.

1. **Load photos** — one per panel, from your machine, or try the two sample
   photos. Drag a panel to move its photo; the zoom slider enlarges it.
2. **Pick a layout** — Hero (one big panel, two small), Grid (four equal
   panels), or Single (one full photo).
3. **Pick a grade** — Sunset (warm orange and magenta), Neon (cyan and hot
   pink), or Clean (no grade).
4. **Write the caption** — in big condensed Anton capitals, in white, gold
   or cyan.
5. **Export PNG** — 1080 x 1080, 1080 x 1350, or 1920 x 1080.

## Files

- `app/` — the app: `index.html`, `style.css`, `src/cover.js` (the cover
  drawing engine), `src/main.js` (wiring), `src/shots.js` (fixed scenes for
  screenshots), `fonts/Anton-Regular.ttf` (Anton, SIL Open Font License,
  see `fonts/OFL.txt`), `samples/` (two sample photos, free to use).
- `screenshots/` — four screenshots: the exported covers and the editor.
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes
  `/output/dossier.json`.
- `serve.ts` — a tiny static server for trying the app locally.

No Rockstar Games logo, wordmark, artwork, character or font is used anywhere
in this entry. The lettering is Anton, an open-licensed display face.
