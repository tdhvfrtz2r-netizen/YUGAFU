#!/bin/bash
# 成片自检：规格、每 4 秒一帧的总览图、逐帧亮度跳变（找闪烁和黑帧）
cd "$(dirname "$0")/.."
V=${1:-out/video.mp4}
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,codec_name,pix_fmt -show_entries format=duration,size,bit_rate -of default=nw=1 "$V"
mkdir -p shots/check && rm -f shots/check/*.jpg
ffmpeg -v error -i "$V" -vf "fps=1/4,scale=640:-1" -q:v 4 shots/check/t%03d.jpg
n=$(ls shots/check/t*.jpg | wc -l)
for s in $(seq 0 9 $((n-1))); do
  files=$(ls shots/check/t*.jpg | sed -n "$((s+1)),$((s+9))p")
  inputs=""; k=0; for f in $files; do inputs="$inputs -i $f"; k=$((k+1)); done
  while [ $k -lt 9 ]; do inputs="$inputs -f lavfi -i color=black:s=640x360:d=1"; k=$((k+1)); done
  ffmpeg -v error -y $inputs -filter_complex "xstack=inputs=9:layout=0_0|640_0|1280_0|0_360|640_360|1280_360|0_720|640_720|1280_720" -frames:v 1 -q:v 3 shots/check/sheet_$((s/9)).jpg
done
echo "sheets: $(ls shots/check/sheet_*.jpg | wc -l)"
# 逐帧平均亮度，相邻帧差 > 18（0–255）的位置列出来
ffmpeg -v error -i "$V" -vf "scale=96:54,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=shots/check/yavg.txt" -f null -
python3 - <<'PY'
import re
v=[float(m) for m in re.findall(r"YAVG=([\d.]+)", open('shots/check/yavg.txt').read())]
print('frames', len(v), 'min', round(min(v),1), 'max', round(max(v),1))
for i in range(1,len(v)):
    if abs(v[i]-v[i-1])>18: print('jump at frame', i, f'{i/60:.2f}s', round(v[i-1],1), '->', round(v[i],1))
PY
