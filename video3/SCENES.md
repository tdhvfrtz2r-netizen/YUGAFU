# 场景开发规范（第一期）

画面 1920×1080，30fps，**一切画面都是时间 t 的纯函数**：渲染器会乱序跳到任意一帧截图，所以：
- 不能用 `Math.random()`、`Date`、`setTimeout`、CSS transition/animation；随机用 `Core.rng(seed)`。
- 不能依赖"上一帧"的状态；`hook(t)` 必须只根据 t 算出所有属性。

## 文件与接口
每段一个文件 `scenes/<key>.js`，调用 `Kit.add({...})`，接口说明见 `kit.js` 顶部注释。参考实现：`../video2/engine.js` 与 `../video2/index.html`（横版 v2：裁员通知、账单堆叠、曲线 + 蜗牛 + 火箭 + 尾焰、本金/收益条、电量、底气光芒、树）。可以直接拷贝其中的代码改造。

`ctx` 提供：`T` 时间引用、`Core`（缓动 eo/ei/eio/back、clamp/lerp/win、rng、ICON、SNAIL、ROCKET、GOLD/REDS 色组、drawGodRays、drawSpeedLines 等）、`$`、`P`（粒子：`P.burst({...})`、`P.stream({...})`）、`ctx.ring/flash/shake/rumble/glow`、`ctx.ev(t, kind, amp)` 登记音效、`bgc`/`fxc` 两个画布。

## 时间引用
`'w3'` 第 w3 句开始；`'w3.e'` 结束；`'w3@0.5'` 句中 50%；`'w3+0.4'`、`'w3.e-1'` 偏移。
动画要卡在**念到那个词的时刻**：用 `@比例` 估算（按字数比例），比如一句 20 个字，关键词从第 12 个字开始 → `@0.6`。

## 场景时间窗口
- 每段的 `<section class="scene">` 用 `data-s` / `data-e` 指定显示区间，前后自动淡入淡出 0.35s。
- 第一个场景从段首句前约 0.6s 开始（`data-s="w1-0.6"`），到下一段首句前约 0.5s 结束（`data-e="j1-0.5"`），相邻段之间允许交叠。
- `hook` 里先判断 `if (t < T('w1') - 1 || t > T('j1')) return;`，窗口外不要做任何事。

## 入场动画（元素加 class="a"）
`data-in` 出现时间；`data-fx`：`up`（默认）`fade` `slam`（重击，自动震屏 + 低音冲击，配 `data-shake="10..50"`）`pop`（弹出）`drop`（通知下落，自带"叮"）`left` `blur` `type`（打字）；`data-out` 消失时间；`data-d` 动画时长；`data-base` 元素本身的 transform（会和动画叠加）。

## 设计规范
- 背景深色；**阿杰 = 红 `#ff5a4e`，小林 = 金 `#f2c063`**，中性信息用白/灰，正收益金色，负值红色，绿色 `#4fd1a5` 只用于"√"。
- 字体：标题 `Noto Sans SC 900`，金句 `Noto Serif SC 900`，正文 500/700。最小字号 22px，图表标签不小于 22px。
- 安全区：重要内容在 x 80–1840、y 60–930；**y 950 以下留给字幕**。
- 同一时刻画面上只讲一件事；上一步的元素不再需要时，淡出或压暗（0.3–0.4 透明度）。
- 动效原则：入场用 ease-out，0.4–0.8s；强调用 slam/pop；数字要"数起来"（滚动计数）；图表要"画出来"（线条按时间延伸）。
- 每段至少一个"哇"的时刻（粒子、光爆、震屏、镜头推拉），但不要每句都震。
- 屏幕上的数字用阿拉伯数字，并标注口径（如"假设年化 6%""含分红""价格指数"）。

## 音效（`ctx.ev(t, kind, amp)`）
已支持：`ding` 通知、`pop` 弹出、`cash` 收银、`coins` 硬币、`hit`（amp 6–50，越大越重）、`launch` 火箭、`shatter` 碎裂、`chime` 铃、`type`（amp=时长）、`fill` 快速计数、`grow` 生长、`rewind`（amp=时长）、`whoosh` 转场、`tick` 滴答、`stamp` 盖章、`lock` 上锁、`water`（amp=时长）排水、`alarm`（amp=时长）报警、`heartbeat` 心跳。
slam/drop/pop/left 入场会自动登记对应音效，不要重复登记。

## 自检（必须做）
在 `/home/user/YUGAFU/video2` 目录下：
```bash
PAGE=../video3/index.html SHOTS=/tmp/claude-0/shots_<key> node render.js shots <时间引用1> <时间引用2> ...
```
会打印 `PAGE ERROR` / `CONSOLE` 错误（`mix.m4a` 找不到可以忽略）。把截图拼成联系表再用 Read 查看：
```bash
cd /tmp/claude-0/shots_<key> && /tmp/claude-0/sheet.sh /tmp/claude-0/sheet_<key>.jpg a.jpg b.jpg ...   # 最多 6 张，2 列
```
检查：文字是否重叠/溢出/被字幕挡住、动画是否在对的时刻、机制是否一眼能看懂、和设计规范是否一致。至少截 8 个时间点（每句至少一张，关键动作的中途也要截）。
