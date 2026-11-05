import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, mixColor, prog, rng, TAU} from '../kit/anim';
import {Cam, CanvasLayer, drawGlow, drawPerson, hexToRgb, project} from '../kit/Canvas';
import {Cue} from '../kit/Sound';
import {Line, KeySentence, SourceTag} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/** 第一层 06–08：从手机屏幕里退出来 → 100 个人 → 18 个在一二线 → 光罩 → ① 大多数人，不是你 */

const SP = 2.4;
type P = {x: number; z: number; i: number; j: number; you: boolean; inner: boolean};
const PEOPLE: P[] = [];
for (let j = 0; j < 10; j++)
  for (let i = 0; i < 10; i++) {
    const x = (i - 4.5) * SP;
    const z = 3 + j * SP;
    PEOPLE.push({x, z, i, j, you: i === 2 && j === 0, inner: i < 6 && j < 3});
  }
const YOU = PEOPLE.find((p) => p.you)!;
const PHONE = {x: YOU.x + 0.24, y: 1.25, z: YOU.z + 0.36, w: 0.072, h: 0.15};
const COOL = hexToRgb(color.cool);
const WARM = hexToRgb(color.warm);
const CARD_ICONS = ['latte', 'gadget', 'frame', 'latte', 'gadget'];

const camAt = (f: number, S7: number, S8: number, END: number): Cam => {
  // 06：从眼前的手机屏幕往后退（按对数距离插值，开头慢慢离开屏幕，再加速）
  const t = prog(f, 36, S7 - 36, ease.inOut);
  const d = Math.exp(lerp(Math.log(0.165), Math.log(6.2), t));
  const back: Cam = {x: PHONE.x + 0.55 * t, y: PHONE.y + 0.9 * t, z: PHONE.z - d, pitch: 0.12 * t, fov: (40 * Math.PI) / 180};
  if (f <= S7) return back;
  // 07–08：升降镜头升到人群上方，再继续退远
  const up = prog(f, S7, 330, ease.inOut);
  const far = prog(f, S8 - 20, END - S8 - 40, ease.inOut);
  return {
    x: lerp(back.x, -0.4, up),
    y: lerp(back.y, 30, up) + 10 * far,
    z: lerp(back.z, -15.5, up) - 8 * far,
    pitch: lerp(back.pitch, 0.8, up) + 0.03 * far,
    fov: back.fov,
  };
};

const drawPhone = (ctx: CanvasRenderingContext2D, cam: Cam, f: number) => {
  const tl = project(PHONE.x - PHONE.w / 2, PHONE.y + PHONE.h / 2, PHONE.z, cam);
  const br = project(PHONE.x + PHONE.w / 2, PHONE.y - PHONE.h / 2, PHONE.z, cam);
  if (!tl || !br) return;
  const x = tl.x;
  const y = tl.y;
  const w = br.x - tl.x;
  const h = br.y - tl.y;
  drawGlow(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 1.6, COOL, 0.35);
  ctx.fillStyle = '#0E1622';
  ctx.strokeStyle = 'rgba(142,210,255,0.5)';
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w * 0.12);
  ctx.fill();
  ctx.stroke();
  if (w < 6) return;
  // 信息流：一张张精致的小卡片往上滑
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, w * 0.12);
  ctx.clip();
  const scroll = (f / 60) * 0.35;
  const cardH = h * 0.3;
  for (let k = -1; k < 5; k++) {
    const cy = y + h * 0.06 + (k - (scroll % 1)) * (cardH + h * 0.04) - Math.floor(scroll) * 0;
    const cx = x + w * 0.08;
    const cw = w * 0.84;
    ctx.fillStyle = 'rgba(142,210,255,0.10)';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, cardH, w * 0.05);
    ctx.fill();
    // 卡片里的简笔画
    const kind = CARD_ICONS[(k + 10 + Math.floor(scroll)) % CARD_ICONS.length];
    const ix = cx + cw * 0.5;
    const iy = cy + cardH * 0.38;
    const s = cardH * 0.22;
    ctx.strokeStyle = 'rgba(220,238,255,0.85)';
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.beginPath();
    if (kind === 'latte') {
      ctx.moveTo(ix - s, iy - s * 0.5);
      ctx.lineTo(ix - s * 0.7, iy + s);
      ctx.lineTo(ix + s * 0.7, iy + s);
      ctx.lineTo(ix + s, iy - s * 0.5);
      ctx.moveTo(ix - s * 0.4, iy - s * 0.1);
      ctx.quadraticCurveTo(ix, iy - s * 0.6, ix + s * 0.4, iy - s * 0.1);
    } else if (kind === 'gadget') {
      ctx.roundRect(ix - s * 1.2, iy - s * 0.7, s * 2.4, s * 1.4, s * 0.25);
      ctx.moveTo(ix - s * 0.5, iy + s);
      ctx.lineTo(ix + s * 0.5, iy + s);
    } else {
      ctx.rect(ix - s, iy - s * 0.8, s * 2, s * 1.6);
      ctx.moveTo(ix - s * 0.7, iy + s * 0.4);
      ctx.lineTo(ix - s * 0.1, iy - s * 0.2);
      ctx.lineTo(ix + s * 0.7, iy + s * 0.5);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,238,255,0.35)';
    ctx.fillRect(cx + cw * 0.1, cy + cardH * 0.74, cw * 0.62, cardH * 0.06);
    ctx.fillRect(cx + cw * 0.1, cy + cardH * 0.86, cw * 0.38, cardH * 0.05);
  }
  ctx.restore();
};

export const L1: React.FC = () => {
  const f = useCurrentFrame();
  const S7 = len('phone');
  const S8 = S7 + len('grid');
  const END = S8 + len('key1');
  const cam = camAt(f, S7, S8, END);
  const dome = prog(f, S8 + 10, 70, ease.inOut);
  const dimForKey = prog(f, S8 + 100, 30) * 1.2;

  const shift = prog(f, S7 + 60, 300, ease.inOut) * (1 - prog(f, S8 + 100, 40, ease.inOut));
  const OX = -250 * shift;
  const OY = -90 * shift;
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.translate(OX, OY);
    // 地面上的光池
    const pool = (x: number, z: number, r: number, rgb: string, a: number) => {
      const c = project(x, 0, z, cam);
      const e = project(x + r, 0, z, cam);
      const n = project(x, 0, z + r, cam);
      if (!c || !e || !n) return;
      const rx = Math.abs(e.x - c.x);
      const ry = Math.max(4, Math.abs(n.y - c.y));
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(1, ry / rx);
      drawGlow(ctx, 0, 0, rx, rgb, a);
      ctx.restore();
    };
    const coolPool = clamp(prog(f, 90, 120));
    pool(-4.8, 5.4, 9, COOL, 0.16 * coolPool);

    const crowdVis = prog(f, 70, 90);
    const phoneC = project(PHONE.x, PHONE.y, PHONE.z, cam);
    const order = [...PEOPLE].sort((a, z) => z.z - a.z);
    let phoneDrawn = false;
    for (const p of order) {
      const pz = project(p.x, 0, p.z, cam);
      if (!phoneDrawn && phoneC && pz && pz.z < phoneC.z) {
        drawPhone(ctx, cam, f);
        phoneDrawn = true;
      }
      const foot = project(p.x, 0, p.z, cam);
      const head = project(p.x, 1.7, p.z, cam);
      if (!foot || !head) continue;
      const near = p.you ? clamp((foot.z - 1.4) / 2.2) ** 2 : clamp((foot.z - 0.6) / 1.6) * crowdVis; // 镜头穿过"你"时淡入，避免突然出现一个巨大的剪影
      const hgt = Math.max(1, foot.y - head.y);
      const k = foot.k;
      let fill = '#2A3342';
      let a = 0.9;
      let glow = 0;
      let rgb = COOL;
      if (p.inner) {
        fill = p.you ? '#B5E2FB' : mixColor('#4A6E8C', '#8CCBEF', prog(f, S7 + 40, 80));
        glow = 0.55;
      } else {
        const lit = prog(f, S7 + 120 + p.j * 10 + p.i * 3, 34);
        fill = lit > 0.02 ? `rgb(${Math.round(lerp(42, 255, lit))},${Math.round(lerp(51, 196, lit))},${Math.round(lerp(66, 110, lit))})` : fill;
        a = lerp(0.55, 0.95, lit);
        glow = 0.5 * lit;
        rgb = WARM;
      }
      const fog = f < S7 ? clamp((foot.z - 3) / 26) * 0.75 : 0;
      if (glow > 0) drawGlow(ctx, foot.x, foot.y - hgt * 0.55, hgt * 1.3, rgb, glow * 0.45 * near * (1 - fog));
      let col = fog > 0 ? mixColor(fill, '#141B27', fog) : fill;
      if (near < 1) col = mixColor('#141B27', col, near);
      drawPerson(ctx, foot.x, foot.y, hgt, col, near < 0.02 ? 0 : near < 1 ? 1 : a);
      if (p.you) {
        const ring = prog(f, 150, 40) * (1 - prog(f, S7 + 330, 60)) * clamp((foot.z - 3) / 2);
        if (ring > 0) {
          ctx.globalAlpha = ring;
          ctx.strokeStyle = color.cool;
          ctx.lineWidth = Math.max(2, k * 0.03);
          ctx.beginPath();
          ctx.arc(foot.x, head.y - Math.min(60, hgt * 0.35), Math.min(34, Math.max(10, hgt * 0.16)), 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    if (!phoneDrawn) drawPhone(ctx, cam, f);

    // 08：光罩罩住那 18 个人
    if (dome > 0) {
      const c = project(-4.8, 0, 5.4, cam);
      const e = project(-4.8 + 8.2, 0, 5.4, cam);
      const tp = project(-4.8, 6.4, 5.4, cam);
      const n = project(-4.8, 0, 5.4 + 8.2, cam);
      if (c && e && tp && n) {
        const rx = Math.abs(e.x - c.x);
        const ry = Math.abs(n.y - c.y);
        const top = c.y - tp.y;
        ctx.save();
        ctx.globalAlpha = dome;
        const g = ctx.createLinearGradient(0, c.y - top, 0, c.y + ry);
        g.addColorStop(0, 'rgba(142,210,255,0.16)');
        g.addColorStop(1, 'rgba(142,210,255,0.05)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, rx, top, 0, Math.PI, 2 * Math.PI);
        ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(190,232,255,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, rx, top, 0, Math.PI, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // 标签跟着人群走
  const cluster = project(-4.8, 0, 2.4, cam);
  const rest = project(11.4, 0.8, 16, cam);
  const lbl1 = prog(f, S7 + 110, 26) * (1 - prog(f, S8 - 20, 20));
  const lbl2 = prog(f, S7 + 250, 26) * (1 - prog(f, S8 - 20, 20));
  const lbl3 = prog(f, S7 + 390, 26) * (1 - prog(f, S8 - 20, 20));
  void rng;

  return (
    <AbsoluteFill>
      <CanvasLayer draw={draw} />
      <AbsoluteFill style={{background: '#06080C', opacity: 0.62 * dimForKey}} />
      <Cue s="notify" at={10} gain={0.55} />
      <Cue s="whoosh" at={40} dur={1.8} gain={0.8} />
      <Cue s="rise" at={S7} dur={4} gain={0.7} />
      <Cue s="sparkle" at={S7 + 120} dur={2.2} gain={0.7} />
      <Cue s="tick" at={S7 + 110} />
      <Cue s="tick" at={S7 + 250} pan={0.5} />
      <Cue s="tick" at={S7 + 390} pan={0.5} />
      <Cue s="glass" at={S8 + 10} />
      <Cue s="impact" at={S8 + 144} gain={0.8} />
      <Cue s="bell" at={S8 + 144} gain={0.6} />
      <Line text="你每天刷到的「正常」……" at={86} out={S7 + 14} y={930} size={60} />
      <Line text="如果全国只有 100 个人" at={S7 + 26} out={S8 - 22} y={120} size={58} />
      {cluster && lbl1 > 0 ? (
        <div style={{position: 'absolute', left: cluster.x + OX, top: cluster.y + OY + 34, transform: 'translate(-50%, 0)', opacity: lbl1, textAlign: 'center', whiteSpace: 'nowrap'}}>
          <div style={{fontFamily: font.sans, fontWeight: 700, fontSize: 46, color: color.cool}}>
            一二线城市 <span style={{fontSize: 64}}>18</span> 人
          </div>
          <div style={{fontFamily: font.sans, fontWeight: 500, fontSize: 32, color: color.dim, marginTop: 2}}>约占全国人口 18.1%</div>
        </div>
      ) : null}
      {rest && lbl2 > 0 ? (
        <div style={{position: 'absolute', left: 1330, top: 560, transform: 'translate(0, -50%)', opacity: lbl2, textAlign: 'left', whiteSpace: 'nowrap'}}>
          <div style={{fontFamily: font.sans, fontWeight: 700, fontSize: 46, color: color.warm}}>三线及以下城市和农村</div>
          <div style={{fontFamily: font.sans, fontWeight: 700, fontSize: 64, color: color.data, marginTop: 8}}>接近 11 亿人</div>
          <div style={{opacity: lbl3, fontFamily: font.serif, fontWeight: 600, fontSize: 42, color: color.opinion, marginTop: 22}}>
            也就是常说的「下沉市场」
          </div>
          <SourceTag text="艾瑞咨询，约 2022 年" at={S7 + 262} align="left" />
        </div>
      ) : null}
      <Line text="……只是少数人的正常。" at={S8 - 20} out={S8 + 104} y={930} size={60} />
      <KeySentence n={1} text="大多数人，不是你。" at={S8 + 108} out={END - 10} y={540} />
    </AbsoluteFill>
  );
};
