#!/usr/bin/env bash
# Full build: PNG parts -> opening clip -> deck -> animations -> PDF preview
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build out
[ "${SKIP_RENDER:-0}" = 1 ] || { node render/render_assets.js; node render/video.js; }
node build.js build/stage1.pptx
python3 anim.py build/stage1.pptx build/anim.json out/bearing_case_v2.pptx
python3 anim.py --final build/stage1.pptx build/anim.json build/final_state.pptx
soffice --headless --convert-to pdf --outdir build build/final_state.pptx >/dev/null 2>&1
cp build/final_state.pdf out/bearing_case_v2_preview.pdf
ls -la out
python3 clickguide.py out/bearing_case_v2.pptx build/anim.json out/点击说明.md >/dev/null
cp assets/gen/opening.mp4 out/opening.mp4
