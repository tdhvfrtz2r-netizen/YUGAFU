#!/usr/bin/env bash
# Full pipeline, from the original USDZ to every file in this folder.
# Needs: Python 3.13, pip install bpy==5.2.2 usd-core==26.8 numpy scipy pillow soundfile; ffmpeg; the Noto Serif/Sans SC TTFs in $FONTS.
# Run from the dorm/ folder:  FONTS=/path/to/fonts bash scripts/run_all.sh
set -euo pipefail
S=scripts; W=work; mkdir -p $W/x $W/stills $W/frames $W/export
unzip -o -q original/Untitled_Scan.usdz -d $W/x
python3 $S/extract.py $W/x/textured_output.usdc $W/mesh_raw.npz            # USD crate -> arrays
python3 $S/clean.py $W/mesh_raw.npz $W/mesh_clean.npz $W/room.json          # align, floor=0, remove debris, fit walls
python3 $S/texture.py $W/mesh_clean.npz $W/x/textured_output.jpg $W        # seam bleed + gentle tone/sharpen
python3 $S/build_scene.py -- $W/mesh_clean.npz $W/room.json $W/tex_enhanced.png $W/v2/dorm.blend   # scan + hole-filling room shell
python3 $S/extract_parts.py -- $W/v2/dorm.blend $W/parts.npz
python3 $S/export.py $W/parts.npz $W/tex_enhanced.png $W/v2/shell_atlas.png $W/export 8192 full     # GLB, USDZ, OBJ
python3 $S/stills.py -- $W/v2/dorm.blend $W/room.json $W/stills                # 4K views
python3 $S/plan_render.py -- $W/v2/dorm.blend $W/room.json $W/stills          # top-down plan
python3 $S/poster.py $W/stills $W/room.json "$FONTS" $W/stills                 # annotated plan + A3 poster
SAMPLES=8 python3 $S/video.py -- $W/v2/dorm.blend $W/room.json $W/frames       # camera move, frame by frame
python3 $S/music_dorm.py ../video2 $W/music.wav 40.5 34.5                      # piano score (uses ../video2/synth.py)
python3 $S/compose.py $W/frames $W/music.wav "$FONTS" $W/room.json video/dorm_tour.mp4
python3 $S/make_master.py -- $W/v2/dorm.blend $W/room.json $W/tex_enhanced_q95.jpg model/blender/dorm.blend
