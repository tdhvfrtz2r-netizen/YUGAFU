// 结尾：三件事回顾 → 一句话 → 评论区 + 免责
import { THREE, B, BEAT, seg, eo, ei, eio, sm, back, lerp, C } from '../lib.js';
import { miniSet } from './title.js';

const T0 = B(72), T1 = B(80) + 1.5;
const X = [-4.7, 0, 4.7];
const items = [];

export default {
  t0: T0, t1: T1,
  build(ctx, root) {
    for (let i = 0; i < 3; i++) { const g = miniSet(i); g.position.x = X[i]; root.add(g); items.push(g); ctx.ev(T0 + .3 + i * BEAT * 2, 'pop', 1); }
    ctx.cap({ t0: T0 + .1, t1: B(75.85), html: '记住三件事', cls: 'h1', y: 74 });
    const rows = [['① 买宽基', '买整片森林，不押单棵树'], ['② 每月定投', '跌的时候，同样的钱买更多'], ['③ 用闲钱，拿得久', '让时间把雪球滚大']];
    rows.forEach(([a, b], i) => ctx.tag({ t0: T0 + .45 + i * BEAT * 2, t1: B(75.6), at: new THREE.Vector3(X[i], 0, 1.6), cls: 'tag', ay: 0, dy: 22,
      html: `<div style="font:900 40px var(--serif);text-align:center;color:#1d242c">${a}</div><div style="font:500 26px var(--sans);color:#5b6470;text-align:center;margin-top:6px">${b}</div>` }));
    ctx.cap({ t0: B(76), t1: B(78.2), html: '它不会让你一夜暴富\n但能让<b class="g">时间</b>，替你干活', cls: 'h1', y: 120, stagger: .5 });
    ctx.ev(B(76), 'hit', 20);
    ctx.cap({ t0: B(78.35), t1: T1 + 2, html: '你在定投吗？<b class="g">评论区</b>聊聊', cls: 'h1', y: 130 });
    ctx.cap({ t0: B(78.6), t1: T1 + 2, html: '觉得讲明白了，就转给需要的人', cls: 'sub', y: 245 });
    ctx.cap({ t0: B(78.6), t1: T1 + 2, html: '本视频仅为知识科普，不构成任何投资建议 · 历史数据与测算不代表未来收益 · 投资有风险', cls: 'note', y: 1012 });
    ctx.cut(T1, 1.2);
  },
  update(t, ctx) {
    const kOut = 0;
    items.forEach((g, i) => {
      const k = back(seg(t, T0 + .25 + i * BEAT * 2, T0 + .8 + i * BEAT * 2), 2.2) * (1 - eo(kOut));
      g.scale.setScalar(Math.max(.001, k)); g.visible = k > .002; g.rotation.y = (t - T0) * .22 + i;
    });
    const p = sm(seg(t, T0, B(76))), q = sm(seg(t, B(75.6), B(76.6)));
    ctx.look(0, lerp(3.9, 4.4, p) + q * 1.2, lerp(15.2, 16.2, p) + q * 2, 0, lerp(1.15, 1.2, p) + q * 2.6, 0, 30);
    ctx.sunAt(0, 0, 10);
  },
};
