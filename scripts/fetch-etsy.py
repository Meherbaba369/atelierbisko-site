#!/usr/bin/env python3
"""fetch-etsy.py — pulls all active atelierbisko Etsy listings into a build-time JSON snapshot.
Run: python3 scripts/fetch-etsy.py   (writes data/listings.json)
Refresh any time listings change; the Next.js site reads only the JSON (no live Etsy calls at request time).
"""
import sys, os, json, time, re, html

sys.path.insert(0, '/srv/projects/hq/ops/marketplaces')
import etsy_api as e

SECTION_NAMES = {}


def unescape(s):
    """Etsy returns listing text HTML-entity-encoded (it's meant for Etsy's own HTML rendering) —
    decode &#39; / &amp; / etc back to plain text before we render it as React text content."""
    if s is None:
        return s
    return html.unescape(s)


def load_sections():
    st, data = e.call('GET', f'/shops/{e.SHOP_ID}/sections', auth=False)
    assert st == 200, data
    for s in data['results']:
        SECTION_NAMES[s['shop_section_id']] = s['title']


def slugify(title):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip('-')
    return s[:70]


def fetch_all_active():
    out, offset = [], 0
    while True:
        st, data = e.call('GET', f'/shops/{e.SHOP_ID}/listings/active?limit=100&offset={offset}', auth=False)
        assert st == 200, data
        out += data['results']
        if len(out) >= data['count']:
            break
        offset += 100
    return out


def fetch_images(listing_id):
    st, data = e.call('GET', f'/listings/{listing_id}/images', auth=False)
    if st != 200:
        return []
    imgs = sorted(data['results'], key=lambda i: i['rank'])
    return [{
        'rank': i['rank'],
        'alt': unescape(i.get('alt_text') or ''),
        'url_570': i['url_570xN'],
        'url_full': i['url_fullxfull'],
        'width': i['full_width'],
        'height': i['full_height'],
    } for i in imgs]


def fetch_variants(listing_id):
    st, data = e.call('GET', f'/listings/{listing_id}/inventory')
    if st != 200:
        return []
    out = []
    for p in data.get('products', []):
        if p.get('is_deleted'):
            continue
        off = (p.get('offerings') or [{}])[0]
        price = off.get('price') or {}
        size_label = None
        for pv in p.get('property_values', []):
            if pv.get('property_name') == 'Size':
                size_label = (pv.get('values') or [None])[0]
        out.append({
            'sku': p.get('sku'),
            'size': size_label,
            'price_usd': round(price.get('amount', 0) / price.get('divisor', 1), 2) if price else None,
            'enabled': off.get('is_enabled', True),
        })
    return out


def main():
    load_sections()
    listings = fetch_all_active()
    print(f'{len(listings)} active listings', file=sys.stderr)
    items = []
    for idx, l in enumerate(listings):
        lid = l['listing_id']
        print(f'  [{idx+1}/{len(listings)}] {lid} {l["title"][:50]}', file=sys.stderr)
        images = fetch_images(lid)
        variants = fetch_variants(lid)
        prices = [v['price_usd'] for v in variants if v['price_usd']]
        section = SECTION_NAMES.get(l.get('shop_section_id'), 'Singles')
        items.append({
            'listing_id': lid,
            'slug': f"{slugify(l['title'])}-{lid}",
            'title': unescape(l['title']),
            'description': unescape(l['description']),
            'url': l['url'],
            'tags': [unescape(t) for t in l.get('tags', [])],
            'section': section,
            'price_min': min(prices) if prices else None,
            'price_max': max(prices) if prices else None,
            'currency': 'USD',
            'variants': variants,
            'images': images,
            'num_favorers': l.get('num_favorers', 0),
            'is_set': 'set of' in l['title'].lower() or section == 'Sets',
        })
        time.sleep(0.05)

    shop_st, shop = e.call('GET', f'/shops/{e.SHOP_ID}', auth=False)
    snapshot = {
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'shop': {
            'shop_id': e.SHOP_ID,
            'name': shop.get('shop_name'),
            'title': unescape(shop.get('title')),
            'url': shop.get('url'),
            'announcement': unescape(shop.get('announcement')),
            'icon_url': shop.get('icon_url_fullxfull'),
            'policy_shipping': unescape(shop.get('policy_shipping')),
            'policy_refunds': unescape(shop.get('policy_refunds')),
        },
        'sections': list(SECTION_NAMES.values()),
        'items': items,
    }
    out_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'listings.json')
    with open(out_path, 'w') as f:
        json.dump(snapshot, f, indent=1)
    print(f'wrote {out_path} ({len(items)} items)', file=sys.stderr)


if __name__ == '__main__':
    main()
