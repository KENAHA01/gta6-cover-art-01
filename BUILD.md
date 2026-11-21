# Vice Nights — GTA 6 cover art maker — BUILD RECORD

Built in recording 01a1fd4f-9525-7001-9d4c-6ce851ae6683 (started 15:53 WIB), in this
session only. No code was copied from other entries or the web; the kit starter
was read for plumbing and replaced.

## Commit

- `a2557028b056299d929f2c297827fad3c965c5c1` (branch master, verified remote ref
  matches), repo https://github.com/KENAHA01/gta6-cover-art-01
- Previous starter commit: e5cee65287fb0ad3dc6c8f224aa068701bc929f5

## What the app does (app/ — static files, no build step, works offline)

- **Vice Nights**: load your own photos (file input, read locally, never uploaded),
  one per panel, or try the two sample photos (boulevard / pier, free to use).
- **Layouts**: Hero (one big panel + two small), Grid (four equal panels), Single.
  Panels are slanted parallelograms with white gutters, like a GTA cover.
- **Crop/position**: drag a panel to move its photo; per-panel zoom slider.
  Default framing is top-anchored so faces survive wide panels.
- **Grade**: Sunset (warm orange/magenta), Neon (cyan/hot pink), or Clean.
- **Caption**: editable text in big condensed Anton capitals (OFL font under
  app/fonts/), white / gold / cyan, with dark outline and shadow.
- **Export PNG**: 1080x1080, 1080x1350, 1920x1080, via an offscreen canvas.
- **main.ts**: edited (header rewritten in my own words) — contains my lines;
  copies app/ + screenshots/ to /output and writes dossier.json via buildDossier.
- **README.md**: written in this session, three live make.fun badges + description.
  Repo About set: website https://make.fun/bounty/gta6-cover-art-01, topic makefun.
- **Originality**: no Rockstar logo, wordmark, artwork, character or font. Anton
  is SIL OFL (fonts/OFL.txt included).

## Screenshots (screenshots/, all ≤256 KiB, captured with headless Chromium)

- `1-cover.jpg` (1080x1080, 132,430 B) — exported cover, hero + sunset, "VICE NIGHTS"
- `2-editor.jpg` (1280x720, 94,323 B) — editor with a photo loaded, "BOULEVARD QUEEN"
- `3-cover.jpg` (864x1080, 129,177 B) — exported cover, grid + neon, "NEON HEIST"
- `4-cover.jpg` (1280x720, 101,477 B) — exported cover, hero + neon, wide 1920x1080
- shots.json matches the four shots. All four were read by eye and verified.

## Verification done

- Functional test (Playwright): file-input upload, layout switch to grid, caption
  edit, grade + colour change, drag-to-pan, export in ALL THREE sizes — real PNGs
  at exact dimensions (1080x1080, 1080x1350, 1920x1080), zero page errors.
- `MAKEFUN_OUTPUT_DIR=/tmp/out-check node main.ts`: dossier.json schema
  makefun/dossier/v1, 4 images, 5 source files (21,554 B), assets 2 jpg + 1 ttf
  + txt; app/ 324K, 14 files in output — well under the caps (993 files, 48 MiB,
  4 screenshots ≤256 KiB each).
- Remote master ref verified equal to a2557028; all required files present at
  the commit (README, main.ts, app/*, screenshots/*, shots.json, .makefun/owner.json).

## Defects found and fixed during the build

- Fieldset radio labels stacked vertically (generic `label` column flex leaked in)
  — fixed with `flex-direction: row` on fieldset labels.
- Wide (1920x1080) hero panel cropped faces: first a centred crop, then a
  wrong-direction top bias (sign error, made it worse), then the correct
  top-anchored default with the pan clamped so the photo always covers.

## Not done / known limits

- The two sample photos are the kit's (544x720 and 720x720); a user photo of
  any size works, but very small photos will look soft when enlarged.
- Empty panels show a dusk gradient (by design — the cover never shows a hole).
- NOT submitted, recording NOT sealed — parent seals and submits.

## Polish pass (21 Nov ~16:25-16:52 WIB, commit 265935c, same recording 01a1fd4f)

Why: GLM sim vs top-5 leaderboard (TOP5-SIM.md) lost 0-10; judge said "flat white
caption on a dark band", "no character tags, no title treatment, no tagline".
Added poster dressing to the exported cover, all user-editable:
- Chrome title: gradient fill (gold/cyan/silver by caption colour) + dark outline +
  sunset stripes (drawn on an offscreen layer so stripes touch letters only),
  overlapping the panels and the caption band.
- Per-panel character name tags (top-left inside each panel, black tag + gold slash;
  slant-aware x offset so the clip never cuts the tag). Defaults THE DRIVER /
  THE FIXER / THE BOSS / THE LOOKOUT, editable per panel.
- Neon script tagline (Yellowtail, Apache 2.0, vendored under app/fonts/ with
  Yellowtail-LICENSE.txt), default "Chasing the Neon", editable.
- Gold starburst seal (default "VOL. 1", toggleable), billing block (default
  "A COVER MADE FROM YOUR PHOTOS • STARRING YOU", toggleable), decorative
  barcode (deterministic bars), COMING SOON footer (toggleable).
- New "Poster dressing" fieldset in the editor; shots.js takes tagline/seal/
  billing/coming/tag1-4 query params; shots.json updated for all 4 shots.
- No fake review quotes or star ratings anywhere (review strip deliberately skipped).
- Fixed during polish: name tags clipped by the panel slant (offset by slant shift
  at the tag's height).
Verification: Playwright functional test 10/10 PASS (upload, grid, caption/tagline/
tag edits, grade switch, dressing toggles, drag-to-pan, export 1080x1080 +
1080x1350 + 1920x1080 exact PNGs, zero page errors). All 4 screenshots re-captured
and read by eye; real export PNG read by eye. Dossier check (temp copy):
schema makefun/dossier/v1, 4 images, 14 app files. Remote master verified equal
to 265935c. NOTE: this BUILD.md file was swept into commit 265935c by gh_push.py's
whole-tree push (it is repo-root documentation, outside app/, so it does not
affect the dossier or the scorer).
