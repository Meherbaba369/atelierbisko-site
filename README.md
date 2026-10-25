# atelierbisko-site

Catalogue website for Atelier Bisko (atelierbisko.com). NO checkout — every artwork links out to the
live Etsy listing (https://www.etsy.com/shop/atelierbisko), or to Redbubble when that's the only live
channel, or shows "Coming soon" when the artwork isn't listed anywhere yet. Built as a static-generated
Next.js site.

## Rebuilding the catalogue

```
python3 scripts/build-catalog.py                 # fresh Etsy pull + full vault scan + thumbnails
python3 scripts/build-catalog.py --skip-etsy-fetch   # reuse cached data/etsy-snapshot.json (faster iteration)
```

This is the only command you need to run after approving new artwork in the vault, or after any Etsy
listing change. It:

1. Pulls every active Etsy listing into `data/etsy-snapshot.json` (via `scripts/fetch-etsy.py`, Etsy Open
   API v3 — public reads, no OAuth scopes needed for listings/images; inventory call uses the existing
   atelierbisko token).
2. Scans `/srv/projects/art-vault/<slug>/meta.json` for every artwork with `status.publish.on == true` —
   this is the catalogue's actual source of truth, not just "whatever's on Etsy today". An artwork shows
   up here the moment Jovan approves it, Etsy listing or not.
3. For each approved artwork, finds its flat bare-print image (the vault's own pre-composed
   Fine-Art-America-style "fullprint" Pinterest pin when one exists, else synthesizes an equivalent card
   from `source/original.png`: light card background, thin margin, soft shadow, title + logo — never a
   room mockup) and exports `public/art/<slug>/card-800.webp` (grid) + `card-1600.webp` (detail hero).
4. Matches each artwork to its live Etsy listing via `meta.status.listings.etsy` (already carries the real
   listing id/url, no guessing) for price/variants/description/room photos. Falls back to a live Redbubble
   link, else no buy link.
5. Finds Etsy "Sets" (duo/trio bundle listings), resolves member artworks via the `mj-print-N` tag already
   in Etsy's own image alt text, and builds a side-by-side bare-print composite thumbnail (never the room
   mockup) for the Sets section.
6. Writes the final `data/listings.json` that the Next.js app reads at build time (no live Etsy calls at
   request time).

`data/etsy-snapshot.json` is the raw Etsy pull (intermediate cache); `data/listings.json` is the final
catalogue the site actually reads — don't hand-edit either, rerun the script.

## Deploying

Commit + `git push origin main` — the repo is git-connected to Vercel, which deploys to
https://atelierbisko.com automatically. Never run a raw `vercel deploy` from this box (hook-blocked);
always verify with `npm run build` (a production build) before pushing, never `npm run dev`.
