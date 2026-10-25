#!/usr/bin/env python3
"""build-catalog.py — regenerates data/listings.json + public/art/** thumbnails for atelierbisko-site.

Source of truth:
  - /srv/projects/art-vault/<slug>/meta.json   — every artwork Jovan has approved for publish
    (status.publish.on == true). This is the catalogue; NOT the Etsy snapshot alone, so an
    artwork shows up here even before (or without ever) going live on Etsy.
  - data/etsy-snapshot.json                     — raw Etsy pull (written by fetch-etsy.py) used
    to attach price/variants/tags/description/room-photos when an artwork IS listed on Etsy.

What it does:
  1. Re-pulls the Etsy snapshot (unless --skip-etsy-fetch) via fetch-etsy.py.
  2. Scans art-vault for every approved artwork, finds its FLAT bare-print image (never a room
     mockup), and composes/exports a consistent Fine-Art-America-style card thumbnail:
     light card background, thin margin, soft shadow, title + logo — object-contain, never cropped.
     Writes public/art/<slug>/card-800.webp (grid) and card-1600.webp (detail hero).
  3. Matches each artwork to its live Etsy listing (via meta.status.listings.etsy, which already
     carries the real listing id/url — no guessing) for price/variants/description/room photos.
     Falls back to a live Redbubble link, else no buy link ("Coming soon").
  4. Finds the 3 Etsy "Sets" (duo/trio bundle listings), resolves their member artworks by the
     `mj-print-N` tag Etsy's own image alt-text already carries, and builds a side-by-side
     bare-print composite thumbnail for each (never the room mockup Etsy uses for the set photo).
  5. Writes the final data/listings.json the Next.js app reads at build time.

Run: python3 scripts/build-catalog.py
     python3 scripts/build-catalog.py --skip-etsy-fetch     (reuse cached data/etsy-snapshot.json)
"""
import sys, os, re, json, glob, time, subprocess, argparse

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT = "/srv/projects/art-vault"
ETSY_SNAPSHOT = os.path.join(ROOT, "data", "etsy-snapshot.json")
OUT_JSON = os.path.join(ROOT, "data", "listings.json")
PUBLIC_ART = os.path.join(ROOT, "public", "art")
FONT_PATH = os.path.join(ROOT, "src", "fonts", "EBGaramond.ttf")

CARD_BG = (246, 241, 230)       # matches --cream
CARD_SHADOW_RGBA = (27, 25, 21)  # matches --ink, used at low alpha


def slugify(title, maxlen=70):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:maxlen]


# ---------------------------------------------------------------------------
# Vault scanning
# ---------------------------------------------------------------------------

def load_approved_vault_artworks():
    approved = []
    for meta_path in sorted(glob.glob(os.path.join(VAULT, "*", "meta.json"))):
        try:
            m = json.load(open(meta_path))
        except Exception as ex:
            print(f"  WARN: unreadable {meta_path}: {ex}", file=sys.stderr)
            continue
        pub = m.get("status", {}).get("publish", {})
        if isinstance(pub, dict) and pub.get("on") is True:
            folder = os.path.dirname(meta_path)
            m["_folder"] = folder
            m["_vault_slug"] = os.path.basename(folder)
            approved.append(m)
    return approved


def find_bare_print_source(meta):
    """Return (path, is_pre_composed) for the flat artwork image — NEVER a room mockup.
    Prefers the already-composed Pinterest 'fullprint' pin (FAA-style, baked by the listing
    pipeline); falls back to the raw source/original.png so we can compose our own card."""
    folder = meta["_folder"]
    pin_dir = os.path.join(folder, "listing", "pinterest")
    if os.path.isdir(pin_dir):
        for f in sorted(os.listdir(pin_dir)):
            if "fullprint" in f:
                return os.path.join(pin_dir, f), True
    src = os.path.join(folder, "source", "original.png")
    if os.path.exists(src):
        return src, False
    # last resort: the master upscale (large, slow to decode, but better than nothing)
    master = meta.get("status", {}).get("master")
    if master and master.get("file"):
        p = os.path.join(folder, master["file"])
        if os.path.exists(p):
            return p, False
    return None, False


# ---------------------------------------------------------------------------
# Card compositing (FAA-style: light card, thin margin, soft shadow, caption)
# ---------------------------------------------------------------------------

_font_cache = {}


def _font(size):
    if size not in _font_cache:
        try:
            _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
        except Exception:
            _font_cache[size] = ImageFont.load_default()
    return _font_cache[size]


def compose_card(art_img, title, out_h=1600):
    """Compose a Fine-Art-America-style card from a raw (un-composed) artwork image:
    cream card background, the print inset with a thin even margin + extra bottom margin
    for a caption, soft drop shadow under the print. Returns a PIL RGB image `out_h` tall."""
    w, h = art_img.size
    ratio = w / h
    out_w = int(round(out_h * ratio))
    # overall card is slightly taller than the art to leave room for margins + caption
    margin = int(out_h * 0.055)
    caption_h = int(out_h * 0.085)
    card_w = out_w + margin * 2
    card_h = out_h + margin * 2 + caption_h

    card = Image.new("RGB", (card_w, card_h), CARD_BG)

    # soft drop shadow behind the print
    shadow = Image.new("L", (out_w + 40, out_h + 40), 0)
    sd = ImageDraw.Draw(shadow)
    sd.rectangle([20, 20, out_w + 20, out_h + 20], fill=70)
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    shadow_rgba = Image.new("RGBA", shadow.size, CARD_SHADOW_RGBA + (0,))
    shadow_rgba.putalpha(shadow)
    card.paste(Image.new("RGB", shadow.size, CARD_BG), (0, 0))  # no-op, keeps alpha compositing simple
    card_rgba = card.convert("RGBA")
    card_rgba.alpha_composite(shadow_rgba, (margin - 20, margin - 20))
    card = card_rgba.convert("RGB")

    art_resized = art_img.convert("RGB").resize((out_w, out_h), Image.LANCZOS)
    card.paste(art_resized, (margin, margin))

    # thin hairline frame around the print
    d = ImageDraw.Draw(card)
    d.rectangle([margin, margin, margin + out_w - 1, margin + out_h - 1], outline=(210, 203, 186), width=1)

    # caption: title (serif) centered, small logo-style wordmark bottom-right
    cap_y = margin + out_h + int(caption_h * 0.32)
    fsize = max(12, int(out_h * 0.02))
    f = _font(fsize)
    short_title = title if len(title) < 46 else title[:43] + "..."
    bbox = d.textbbox((0, 0), short_title, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((card_w - tw) / 2, cap_y), short_title, fill=(74, 70, 61), font=f)

    mark_f = _font(max(10, int(out_h * 0.016)))
    mark = "ATELIER BISKO"
    mbbox = d.textbbox((0, 0), mark, font=mark_f)
    mw = mbbox[2] - mbbox[0]
    d.text((card_w - margin - mw, card_h - margin * 0.62), mark, fill=(150, 143, 125), font=mark_f)

    return card


def load_precomposed_card(path, out_h):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    out_w = int(round(out_h * (w / h)))
    return im.resize((out_w, out_h), Image.LANCZOS)


def export_card(meta, slug, title):
    """Writes public/art/<slug>/card-800.webp + card-1600.webp. Returns dict with both sizes'
    src/width/height for the JSON, plus the 1600 PIL image (so set composites can reuse it)."""
    src_path, is_precomposed = find_bare_print_source(meta)
    out_dir = os.path.join(PUBLIC_ART, slug)
    os.makedirs(out_dir, exist_ok=True)

    sizes = {}
    big_img = None
    for h in (1600, 800):
        if src_path is None:
            # no source image at all — shouldn't happen for approved art, but don't crash the build
            im = Image.new("RGB", (int(h * 0.667), h), CARD_BG)
        elif is_precomposed:
            im = load_precomposed_card(src_path, h)
        else:
            raw = Image.open(src_path)
            im = compose_card(raw, title, out_h=h)
        out_path = os.path.join(out_dir, f"card-{h}.webp")
        im.save(out_path, "WEBP", quality=86, method=5)
        sizes[h] = {
            "src": f"/art/{slug}/card-{h}.webp",
            "width": im.width,
            "height": im.height,
        }
        if h == 1600:
            big_img = im
    return sizes, big_img


def export_set_composite(slug, member_cards, title):
    """Side-by-side composite of each member's bare-print card (not the room mockup)."""
    out_dir = os.path.join(PUBLIC_ART, slug)
    os.makedirs(out_dir, exist_ok=True)
    sizes = {}
    for h in (1600, 800):
        gap = int(h * 0.03)
        imgs = []
        for m in member_cards:
            im = m[h]
            imgs.append(im)
        total_w = sum(im.width for im in imgs) + gap * (len(imgs) - 1)
        canvas = Image.new("RGB", (total_w, h), CARD_BG)
        x = 0
        for im in imgs:
            canvas.paste(im, (x, 0))
            x += im.width + gap
        out_path = os.path.join(out_dir, f"card-{h}.webp")
        canvas.save(out_path, "WEBP", quality=86, method=5)
        sizes[h] = {"src": f"/art/{slug}/card-{h}.webp", "width": canvas.width, "height": canvas.height}
    return sizes


# ---------------------------------------------------------------------------
# Etsy matching
# ---------------------------------------------------------------------------

def load_etsy_snapshot():
    return json.load(open(ETSY_SNAPSHOT))


def etsy_item_for_listing_id(etsy_items_by_id, listing_id):
    if listing_id is None:
        return None
    return etsy_items_by_id.get(str(listing_id)) or etsy_items_by_id.get(int(listing_id) if str(listing_id).isdigit() else listing_id)


def buy_info_for_artwork(meta, etsy_items_by_id):
    """Returns (buy_url, buy_label, etsy_item_or_None)."""
    listings = meta.get("status", {}).get("listings", {})
    etsy = listings.get("etsy")
    if isinstance(etsy, dict) and etsy.get("url") and etsy.get("state") == "active":
        lid = etsy.get("etsy_listing_id")
        etsy_item = etsy_item_for_listing_id(etsy_items_by_id, lid)
        return etsy["url"], "Buy on Etsy", etsy_item
    rb_status = listings.get("redbubble")
    rb = meta.get("redbubble")
    if rb_status == "live" and isinstance(rb, dict) and rb.get("url"):
        return rb["url"], "View on Redbubble", None
    return None, "Coming soon", None


# ---------------------------------------------------------------------------
# Main build
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-etsy-fetch", action="store_true", help="reuse cached data/etsy-snapshot.json instead of re-pulling from Etsy")
    args = ap.parse_args()

    if not args.skip_etsy_fetch:
        print("== pulling fresh Etsy snapshot ==", file=sys.stderr)
        subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "fetch-etsy.py")], check=True)

    etsy_snap = load_etsy_snapshot()
    etsy_items_by_id = {str(i["listing_id"]): i for i in etsy_snap["items"]}

    print("== scanning art-vault for approved artworks ==", file=sys.stderr)
    approved = load_approved_vault_artworks()
    print(f"  {len(approved)} approved artworks", file=sys.stderr)

    items = []
    artwork_card_cache = {}  # vault slug -> {800: PIL, 1600: PIL}  (for set composites)

    for meta in approved:
        vault_slug = meta["_vault_slug"]
        title = meta.get("title") or vault_slug
        buy_url, buy_label, etsy_item = buy_info_for_artwork(meta, etsy_items_by_id)

        slug = etsy_item["slug"] if etsy_item else slugify(title) + "-" + vault_slug.split("__")[-1]

        print(f"  [{len(items)+1}/{len(approved)}] {vault_slug} -> {slug}", file=sys.stderr)
        card_sizes, card_1600_img = export_card(meta, slug, title)
        # also need the 800 version in-memory for potential set composites
        card_800_img = Image.open(os.path.join(PUBLIC_ART, slug, "card-800.webp")).convert("RGB")
        artwork_card_cache[vault_slug] = {800: card_800_img, 1600: card_1600_img}

        gallery = [{
            "src": card_sizes[1600]["src"],
            "alt": title,
            "width": card_sizes[1600]["width"],
            "height": card_sizes[1600]["height"],
            "kind": "card",
        }]

        if etsy_item:
            description = etsy_item["description"]
            tags = etsy_item["tags"]
            price_min, price_max, currency = etsy_item["price_min"], etsy_item["price_max"], etsy_item["currency"]
            variants = etsy_item["variants"]
            for img in etsy_item["images"]:
                gallery.append({
                    "src": img["url_full"],
                    "alt": img["alt"] or title,
                    "width": img["width"],
                    "height": img["height"],
                    "kind": "remote",
                })
        else:
            description = meta.get("prompt") or title
            tags = []
            price_min = price_max = None
            currency = "USD"
            variants = []

        items.append({
            "id": vault_slug,
            "kind": "artwork",
            "slug": slug,
            "title": title,
            "description": description,
            "url": buy_url,
            "buy_label": buy_label,
            "tags": tags,
            "section": "Prints",
            "price_min": price_min,
            "price_max": price_max,
            "currency": currency,
            "variants": variants,
            "card": {"src800": card_sizes[800]["src"], "src1600": card_sizes[1600]["src"],
                      "w800": card_sizes[800]["width"], "h800": card_sizes[800]["height"],
                      "w1600": card_sizes[1600]["width"], "h1600": card_sizes[1600]["height"]},
            "gallery": gallery,
            "num_favorers": etsy_item.get("num_favorers", 0) if etsy_item else 0,
        })

    # ---- Sets: Etsy bundle listings, matched to member vault artworks via mj-print-N in image alt ----
    print("== building Sets ==", file=sys.stderr)
    approved_vault_slugs = {m["_vault_slug"] for m in approved}
    set_count = 0
    for etsy_item in etsy_snap["items"]:
        if etsy_item.get("section") != "Sets" and not etsy_item.get("is_set"):
            continue
        prints_in_title = set()
        for img in etsy_item["images"]:
            prints_in_title.update(re.findall(r"mj-print-\d+", img.get("alt", "")))
        if not prints_in_title:
            print(f"  WARN: set '{etsy_item['slug']}' has no mj-print-N refs in image alt text, skipping composite", file=sys.stderr)
            continue
        member_slugs = []
        for tag in sorted(prints_in_title):
            matches = [s for s in approved_vault_slugs if s.endswith("__" + tag)]
            if matches:
                member_slugs.append(matches[0])
            else:
                print(f"  WARN: set '{etsy_item['slug']}' references {tag}, no approved vault match", file=sys.stderr)
        if len(member_slugs) < 2:
            continue

        member_cards = [artwork_card_cache[s] for s in member_slugs if s in artwork_card_cache]
        if len(member_cards) < 2:
            print(f"  WARN: set '{etsy_item['slug']}' members not in card cache, skipping", file=sys.stderr)
            continue

        set_slug = etsy_item["slug"]
        print(f"  set: {set_slug} <- {member_slugs}", file=sys.stderr)
        card_sizes = export_set_composite(set_slug, member_cards, etsy_item["title"])
        set_count += 1

        gallery = [{
            "src": card_sizes[1600]["src"],
            "alt": etsy_item["title"],
            "width": card_sizes[1600]["width"],
            "height": card_sizes[1600]["height"],
            "kind": "card",
        }]
        for img in etsy_item["images"]:
            gallery.append({
                "src": img["url_full"],
                "alt": img["alt"] or etsy_item["title"],
                "width": img["width"],
                "height": img["height"],
                "kind": "remote",
            })

        items.append({
            "id": f"set-{etsy_item['listing_id']}",
            "kind": "set",
            "slug": set_slug,
            "title": etsy_item["title"],
            "description": etsy_item["description"],
            "url": etsy_item["url"],
            "buy_label": "Buy on Etsy",
            "tags": etsy_item["tags"],
            "section": "Sets",
            "price_min": etsy_item["price_min"],
            "price_max": etsy_item["price_max"],
            "currency": etsy_item["currency"],
            "variants": etsy_item["variants"],
            "card": {"src800": card_sizes[800]["src"], "src1600": card_sizes[1600]["src"],
                      "w800": card_sizes[800]["width"], "h800": card_sizes[800]["height"],
                      "w1600": card_sizes[1600]["width"], "h1600": card_sizes[1600]["height"]},
            "gallery": gallery,
            "num_favorers": etsy_item.get("num_favorers", 0),
            "members": member_slugs,
        })

    snapshot = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "shop": etsy_snap["shop"],
        "sections": ["Prints", "Sets"],
        "items": items,
    }
    with open(OUT_JSON, "w") as f:
        json.dump(snapshot, f, indent=1)

    n_prints = sum(1 for i in items if i["kind"] == "artwork")
    n_sets = sum(1 for i in items if i["kind"] == "set")
    n_with_buy = sum(1 for i in items if i["kind"] == "artwork" and i["url"])
    print(f"\nwrote {OUT_JSON}: {n_prints} prints + {n_sets} sets ({n_with_buy} prints have a live buy link)", file=sys.stderr)

    # public/ size sanity check
    total = 0
    for dirpath, _, filenames in os.walk(os.path.join(ROOT, "public")):
        for fn in filenames:
            total += os.path.getsize(os.path.join(dirpath, fn))
    print(f"public/ total size: {total/1e6:.1f} MB", file=sys.stderr)


if __name__ == "__main__":
    main()
