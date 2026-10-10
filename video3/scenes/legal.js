/* 合规标注：开头"虚构演绎 · AI 合成配音"；讲收益的两段常驻风险提示 */
Kit.add({
  key: 'legal',
  css: `#lg-top{position:absolute;left:40px;top:28px;font-size:20px;color:rgba(243,239,232,.55);letter-spacing:.08em;z-index:58}
        #lg-risk{position:absolute;right:40px;top:28px;font-size:20px;color:rgba(243,239,232,.45);letter-spacing:.04em;z-index:58}`,
  html: `<div id="lg-top">剧情为虚构演绎 · AI 合成配音</div><div id="lg-risk">历史数据与测算不代表未来收益 · 不构成投资建议 · 投资有风险</div>`,
  text: '剧情为虚构演绎合成配音历史数据与测算不代表未来收益不构成投资建议投资有风险',
  hook(t, ctx) {
    const { T, $, Core } = ctx; const { clamp, win } = Core;
    $('lg-top').style.opacity = 1 - clamp((t - 6) / .6);
    $('lg-risk').style.opacity = win(t, T('x1') - .3, T('s1') - .3, .5);
  },
});
