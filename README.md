# atelierbisko-site

Catalogue website for Atelier Bisko (atelierbisko.com). NO checkout — every artwork links out to the
live Etsy listing (https://www.etsy.com/shop/atelierbisko). Built as a static-generated Next.js site.

- `scripts/fetch-etsy.py` — refreshes `data/listings.json` from the Etsy Open API v3 (public, no OAuth
  scopes needed for reading active listings/images; inventory call uses the existing atelierbisko token).
  Run it, commit the updated JSON, redeploy.
- `data/listings.json` — build-time snapshot, read directly by the Next.js pages (no live Etsy calls at
  request time).
