# 为什么我们觉得「土」的东西，偏偏最火？

无配音的科普短片。成片：`out/video.mp4`，1920×1080，60fps，4:54，H.264（BT.709）+ AAC 立体声。
音效和配乐全部用程序合成，不用任何现成素材，也没有任何歌曲片段。

- 分镜、每个数字的出处、v4 改了什么：`分镜.md`
- B站标题、简介、数据来源：`简介.md`
- 分轨：`out/music.m4a`（只有配乐）、`out/sfx.m4a`（只有音效）。想换成自己的配乐，用音效这条和画面合成即可

## 声音
- 场景代码里，在动作发生的那一帧写 `<Cue s="click" at={…} />`；`scripts/cues.js` 把全片的音效标记收集成 `audio/cues.json`
- `scripts/sound.py` 按标记合成 31 种音效，并生成一条 100 BPM、D 大调、跟着段落走的原创配乐
- `scripts/mix.py` 混音：配乐垫底，重点句前后压低 5 dB；整体 -16 LUFS，峰值不超过 -2 dBFS

全片按 **100 BPM、4/4** 设计（1 拍 0.6 秒，1 小节 2.4 秒，共 122.5 小节），镜头都从整小节或半小节开始。下面这些关键动作落在强拍（每小节第 1 或第 3 拍）上，换配乐时对齐第 0 帧即可：

| 关键点 | 时间 | 小节 · 拍 |
|---|---|---|
| 片名"土"字定格 | 0:26.4 | 第 12 小节第 1 拍 |
| ① 大多数人，不是你（圆环画完） | 1:06.0 | 第 28 小节第 3 拍 |
| 第一把钥匙"咔" | 2:04.8 | 第 53 小节第 1 拍 |
| ② 土，是约束下的最优解（圆环画完） | 3:14.4 | 第 82 小节第 1 拍 |
| ③ 每个人，都是某个领域的下沉用户（圆环画完） | 4:34.8 | 第 115 小节第 3 拍 |
| 最后一句停稳 | 4:48.0 | 第 121 小节第 1 拍 |

## 视觉语言（`src/theme.ts`）
「灯火」：每个人是一盏灯。暖金色 = 大多数人的日常和"土"的东西；冷蓝色 = "你"的屏幕光和光罩（"我们"的正常）；粉色 = 短剧；黄铜 = 钥匙和锁。
宋体 = 叙述和观点（作者的声音），黑体 + Inter 数字 = 数据和标签。观点句带「观点」标记，引用别人的话带「引述」标记；数据句下面都有来源角标。

## 从源码到成片
需要 Node 18+、Python 3（numpy、scipy）、ffmpeg。云端没有显卡，用的是 Playwright 预装的 headless Chromium，经 `scripts/chrome-sw.sh` 走纯 CPU 光栅化；本地渲染时把 `REMOTION_BROWSER` 指向本机的 Chrome。

```bash
cd video5
npm install
bash scripts/build.sh            # 一条龙：收集音效标记 → 合成声音 → 混音 → 渲染无声母版 → 编码合成 → 自检
```

分步：

```bash
node scripts/glyphs.js                      # 收集片中用到的字，渲染前预加载字体分片
node scripts/stills.js 1440 3600 6300       # 截几帧看看（shots/f<帧号>.jpg、shots/sheet.jpg）
node scripts/audit.js                       # 读速自检：每行字够不够读完
node scripts/cues.js                        # 收集音效标记 → audio/cues.json
python3 scripts/sound.py                    # 合成音效和配乐 → audio/sfx.wav、audio/music.wav
python3 scripts/mix.py                      # 混音 → audio/mix.wav
npx remotion render src/index.ts Main out/master.mp4 --crf=14   # 无声母版
bash scripts/encode.sh                      # 两遍编码 + 合成声音 → out/video.mp4（控制在 100 MB 以内）
bash scripts/check.sh                       # 规格、每 4 秒一帧的总览图、亮度跳变
npx remotion studio src/index.ts            # 可视化预览、拖时间轴
```
4 核 CPU、无显卡：母版约 30 分钟，声音约 1 分钟，编码约 10 分钟。

## 结构
- `src/timeline.ts`：31 个镜头的小节数，镜头用名字引用；改这里，全片时间线（连同音效）自动重排。改完跑一遍 `scripts/audit.js`
- `src/theme.ts`：配色、字体、字号、缓动、入场节奏
- `src/kit/`：文字（逐字显影、观点/引述标记、来源角标、结论样式）、背景与深度计、画布工具、弹子锁、图标、音效标记 `Sound.tsx`
- `src/scenes/`：开场小测试 `Quiz`、片名 `Title`、先说「土」`Define`、第一层 `L1` + `Flip`、第二层 `L2`（天平、刀郎）+ `Tickets` + `Sorter`、第三层 `L3a`（锁、钱）+ `Scarcity` + `L3b`（时间、知识门槛）+ `L3c`（表达、四把锁）、第四层 `L4` + `Relabel`、反面 `L6`、收尾 `L7`
