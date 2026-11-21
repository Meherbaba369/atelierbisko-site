#!/usr/bin/env bash
set -euo pipefail

source_repo=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
scratch=${CATALOG_SCRATCH_DIR:-/dev/shm}
export GIT_TERMINAL_PROMPT=0
export NEXT_TELEMETRY_DISABLED=1
export PYTHONDONTWRITEBYTECODE=1

exec 9>"${XDG_RUNTIME_DIR:-$scratch}/atelierbisko-catalogue-refresh.lock"
if ! flock -n 9; then
  echo "A catalogue refresh is already running"
  exit 0
fi

work=$(mktemp -d "$scratch/atelierbisko-refresh.XXXXXXXX")
trap 'rm -rf -- "$work"' EXIT

# Keep generated files and the production build off the VPS root volume.
git clone -q --shared --no-checkout "$source_repo" "$work"
cd "$work"
git remote set-url origin "$(git -C "$source_repo" remote get-url origin)"
git fetch -q origin main
git checkout -q --detach FETCH_HEAD
ln -s "$source_repo/node_modules" node_modules

python3 scripts/build-catalog.py
python3 - <<'PY'
import json
import subprocess
from pathlib import Path
from PIL import Image

for name in ("data/etsy-snapshot.json", "data/listings.json"):
    path = Path(name)
    previous = json.loads(subprocess.check_output(["git", "show", f"HEAD:{name}"]))
    current = json.loads(path.read_bytes())
    previous.pop("generated_at", None)
    current.pop("generated_at", None)
    if current == previous:
        path.write_bytes(subprocess.check_output(["git", "show", f"HEAD:{name}"]))

catalog = json.loads(Path("data/listings.json").read_bytes())
for item in catalog["items"]:
    for size in (800, 1600):
        card = item["card"]
        image_path = Path("public") / card[f"src{size}"].lstrip("/")
        with Image.open(image_path) as image:
            if image.size != (card[f"w{size}"], card[f"h{size}"]):
                raise RuntimeError(f"Unexpected card dimensions: {image_path}")
            if all(low == high for low, high in image.convert("RGB").getextrema()):
                raise RuntimeError(f"Blank catalogue card: {image_path}")
PY

git add -- data/etsy-snapshot.json data/listings.json public/art
if git diff --cached --quiet; then
  echo "Catalogue already current"
  exit 0
fi

npm run build -- --webpack
git -c user.name="$(git -C "$source_repo" config user.name)" \
    -c user.email="$(git -C "$source_repo" config user.email)" \
    commit -qm 'Refresh Atelier Bisko catalogue from approved artwork and active listings'
git push origin HEAD:main
echo "Pushed catalogue revision $(git rev-parse --short HEAD) for Vercel deployment"
