/* 场景注册接口。每个 scenes/*.js 调用 Kit.add({...})：
 *   key        段落字母（与台词 id 前缀一致，如 'w'）
 *   css        该场景的样式（类名加前缀）
 *   html       字符串，一个或多个 <section class="scene" data-s=".." data-e=".."> ；元素入场用 class="a" data-in data-fx data-out
 *   setup(ctx)      构建 DOM/SVG（字体加载前调用，不要依赖时间）
 *   events(ctx)     登记粒子、震动、闪白、音效事件（时间都用 ctx.T('w3@0.5') 这类引用）
 *   hook(t, ctx)    每帧更新本场景的动画（自己判断时间窗口，窗口外直接 return）
 *   bg(t, ctx)      在背景画布上画光晕等（'lighter' 叠加模式），可返回 {dust: 0..1}
 *   fx(t, ctx)      在前景画布上画额外特效（粒子之后）
 *   worldFilter(t, ctx) 返回整个画面的 CSS filter（如倒带），否则返回空
 *   text        画布上会用到、但不在 DOM 里的文字（用于预加载字体）
 *   keywords    字幕里需要高亮成金色的词
 */
window.Kit = { list: [], add(def) { this.list.push(def); } };
