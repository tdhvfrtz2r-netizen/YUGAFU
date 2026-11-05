#!/bin/bash
# 从源码到成片：收集音效标记 → 合成声音 → 混音 → 渲染无声母版 → 编码合成 out/video.mp4
set -e
cd "$(dirname "$0")/.."
node scripts/glyphs.js
node scripts/cues.js
python3 scripts/sound.py
python3 scripts/mix.py
npx remotion render src/index.ts Main out/master.mp4 --crf=14
bash scripts/encode.sh
bash scripts/check.sh
