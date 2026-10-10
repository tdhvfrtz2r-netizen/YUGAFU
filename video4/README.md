# 定投宽基 · 本地渲染成片

内容、画面、配乐都已定稿，配乐成品就是本目录的 `mix.m4a`。剩下的工作只是逐帧截图，再合成 mp4。
云端没有显卡，一帧要 1 秒左右；本地有显卡的话会快很多。

## 需要
- Node.js 18 以上
- ffmpeg（Mac：`brew install ffmpeg`；Windows：`winget install ffmpeg`）

## 步骤
```bash
git clone https://github.com/tdhvfrtz2r-netizen/YUGAFU.git
cd YUGAFU
git checkout claude/hello-3wwiye
cd video4
npm run setup          # 装 three、字体、playwright 和 Chromium
```

先截几张图看看画面对不对，输出到 `shots/`：
```bash
node render.js shots b6.3 b20 b36 b55 b70.5
```

逐帧渲染，一共 5805 帧，输出到 `frames/`。最后一个参数是同时开几个浏览器，有显卡的机器可以开 4：
```bash
# Mac / Linux
GPU=1 HEADED=1 node render.js frames 30 4
# Windows PowerShell
$env:GPU=1; $env:HEADED=1; node render.js frames 30 4
```
- `GPU=1` 用显卡渲染。`HEADED=1` 会弹出浏览器窗口，这样能确保走显卡，渲染期间别把窗口最小化。
- 显卡模式画面不对（发黑、缺阴影）就去掉这两个变量，用默认的软件渲染，结果一样，只是慢。
- 渲染中断了可以续：`START=秒数 node render.js frames 30 4`，从那一秒接着渲。

合成成片：
```bash
ffmpeg -framerate 30 -i frames/%05d.jpg -i mix.m4a -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a copy -shortest -movflags +faststart 定投宽基.mp4
```

## 想改内容时
- 字幕文字、出现时间：`scenes/*.js` 里的 `ctx.cap(...)` / `ctx.tag(...)`，时间写成 `B(小节号)`，一小节 2.4 秒。
- 改了画面时间点，要重新导出音效表并重做配乐（需要 Python，以及 numpy、scipy、soundfile）：
  ```bash
  node render.js events && python3 music.py
  ffmpeg -y -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k mix.m4a
  ```
- 分镜和每个数字的出处见 `分镜.md`。
