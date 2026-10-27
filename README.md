# Cocopets

A virtual-pet game with arcade stages, the Tower of Oblivion and the Great Rift: raise Cocopets, fight through
dungeons and bosses, and collect animas, accessories and decor.

## Play

The website version is published by GitHub Pages from the `main` branch:
**https://chuongvoxx-ops.github.io/Cocopets/**

## How the project is laid out

| Path | What it is |
| --- | --- |
| `src/js/` | The game's code, in many files. They are joined in filename order into one page. |
| `src/head.html`, `src/body.html`, `src/styles.css` | The page shell and its styles. |
| `src/build.py` | Joins everything into the playable page. |
| `assets/music/` | The music, full quality. |
| `tests/` | Browser tests (Playwright) for the game's systems, rifts and bosses. |
| `docs/NOTES.md` | Development notes: how each system works and why. |

## Building

```
python3 src/build.py --web    # the website version: dist/index.html with the songs in dist/music/
python3 src/build.py          # the single-file version (songs built in, compressed) plus test.html with test hooks
```

Every push to `main` builds the website version and publishes it (`.github/workflows/pages.yml`).

## Tests

The tests drive `test.html` in Chromium through Playwright. They were written for the development environment's
paths (`/opt/npm-tools/node_modules/playwright`, `/opt/pw-browsers/...`); point those at your own Playwright
install to run them elsewhere. `runbat.sh` runs the whole battery four at a time.

## Saves

Progress is saved in the browser. To move a save between devices or between the website and another version, use
Settings → Move your save → Copy code, then Paste code on the other side.
