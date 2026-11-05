#!/bin/bash
# 成片编码：高质量母版（out/master.mp4，无声）+ 混音（audio/mix.wav）→ out/video.mp4
# 两遍编码按目标体积算码率，保证单个文件在 GitHub 100 MB 上限以内；另出两条分轨方便换配乐。
# 补丁：out/patch_<起始帧>.mp4（只重渲了一小段时），编码时按帧号原样盖在母版上，不用整片重渲。
set -e
cd "$(dirname "$0")/.."
TARGET_MB=${TARGET_MB:-86}
AUDIO_K=192
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/master.mp4)
VK=$(python3 -c "d=$DUR; print(int(($TARGET_MB*8*1024*1024/1000 - $AUDIO_K*d)/d))")
echo "duration ${DUR}s → video ${VK} kbit/s, audio ${AUDIO_K} kbit/s"

INPUTS=(-i out/master.mp4)
FILTER=""
LAST="0:v"
K=1
for P in out/patch_*.mp4; do
  [ -e "$P" ] || continue
  F0=$(basename "$P" .mp4 | sed 's/patch_//')
  N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$P")
  T0=$(python3 -c "print($F0/60)")
  T1=$(python3 -c "print(($F0+$N-0.5)/60)")
  echo "patch $P: frames $F0–$((F0+N-1))"
  INPUTS+=(-itsoffset "$T0" -i "$P")
  FILTER+="[$LAST][$K:v]overlay=eof_action=pass:enable='between(t,$T0,$T1)'[p$K];"
  LAST="p$K"
  K=$((K+1))
done
FILTER+="[$LAST]null[vout]"
COLOR=(-pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv)
ffmpeg -y -v error "${INPUTS[@]}" -filter_complex "$FILTER" -map "[vout]" -c:v libx264 -preset slow -b:v ${VK}k -pass 1 -passlogfile shots/x264 "${COLOR[@]}" -an -f mp4 /dev/null
ffmpeg -y -v error "${INPUTS[@]}" -i audio/mix.wav -filter_complex "$FILTER" -map "[vout]" -map $K:a -c:v libx264 -preset slow -b:v ${VK}k -pass 2 -passlogfile shots/x264 "${COLOR[@]}" \
  -c:a aac -b:a ${AUDIO_K}k -ar 48000 -movflags +faststart -shortest out/video.mp4
ffmpeg -y -v error -i audio/music_final.wav -c:a aac -b:a 160k out/music.m4a
ffmpeg -y -v error -i audio/sfx_final.wav -c:a aac -b:a 160k out/sfx.m4a
ls -la out/video.mp4 out/music.m4a out/sfx.m4a
