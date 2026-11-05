#!/bin/bash
# 成片编码：高质量母版（out/master.mp4，无声）+ 混音（audio/mix.wav）→ out/video.mp4
# 两遍编码按目标体积算码率，保证单个文件在 GitHub 100 MB 上限以内；另出两条分轨方便换配乐。
set -e
cd "$(dirname "$0")/.."
TARGET_MB=${TARGET_MB:-86}
AUDIO_K=192
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/master.mp4)
VK=$(python3 -c "d=$DUR; print(int(($TARGET_MB*8*1024*1024/1000 - $AUDIO_K*d)/d))")
echo "duration ${DUR}s → video ${VK} kbit/s, audio ${AUDIO_K} kbit/s"
COLOR="-pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"
ffmpeg -y -v error -i out/master.mp4 -c:v libx264 -preset slow -b:v ${VK}k -pass 1 -passlogfile shots/x264 $COLOR -an -f mp4 /dev/null
ffmpeg -y -v error -i out/master.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v ${VK}k -pass 2 -passlogfile shots/x264 $COLOR \
  -c:a aac -b:a ${AUDIO_K}k -ar 48000 -movflags +faststart -shortest out/video.mp4
ffmpeg -y -v error -i audio/music_final.wav -c:a aac -b:a 160k out/music.m4a
ffmpeg -y -v error -i audio/sfx_final.wav -c:a aac -b:a 160k out/sfx.m4a
ls -la out/video.mp4 out/music.m4a out/sfx.m4a
