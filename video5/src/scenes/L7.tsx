import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog, rng, TAU} from '../kit/anim';
import {Cam, CanvasLayer, drawGlow, drawPerson, project} from '../kit/Canvas';
import {IconStar} from '../kit/Icons';
import {Lock} from '../kit/Lock';
import {Person} from '../kit/Person';
import {Cue} from '../kit/Sound';
import {KeySentence, Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/** 收尾 28–31：我们呢？在本行嫌它土，换个领域就是下沉用户 → 下沉是离信息源的距离 → ③ → 先看锁再评钥匙 → 你觉得土的，是十亿人的日常 */

const C = {x: 960, y: 470};
const FIELDS = ['你的本行', '理财', '健身'];
const N = 30;
const layout = (seed: number) => {
  const r = rng(seed);
  return Array.from({length: N}, () => {
    const rad = 90 + Math.sqrt(r()) * 470;
    const a = r() * TAU;
    return {x: C.x + Math.cos(a) * rad * 1.35, y: C.y + Math.sin(a) * rad * 0.72};
  });
};
const LAYOUTS = [layout(3), layout(8), layout(21)];
const ME = [
  {x: C.x - 120, y: C.y + 60},
  {x: C.x - 640, y: C.y + 300},
  {x: C.x + 660, y: C.y + 290},
];

const Rings: React.FC<{f: number}> = ({f}) => {
  // 0→1：AI 换成理财；1→2：理财换成健身
  const s1 = prog(f, 320, 50, ease.inOut);
  const s2 = prog(f, 478, 40, ease.inOut);
  const stage = s1 + s2;
  const i0 = Math.min(1, Math.floor(stage));
  const t = stage - i0;
  const me = {x: lerp(ME[i0].x, ME[i0 + 1].x, t), y: lerp(ME[i0].y, ME[i0 + 1].y, t)};
  const vis = prog(f, 40, 40);
  const card = prog(f, 370, 30, ease.out) * (1 - prog(f, 478, 20));
  const star = prog(f, 418, 16, ease.back);
  return (
    <>
      <CanvasLayer
        draw={(ctx) => {
          if (vis <= 0) return;
          ctx.globalAlpha = vis;
          drawGlow(ctx, C.x, C.y, 300, '255,224,163', 0.35);
          for (let k = 1; k <= 5; k++) {
            ctx.strokeStyle = `rgba(255,214,150,${0.32 - k * 0.05})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(C.x, C.y, k * 120 * 1.35, k * 120 * 0.72, 0, 0, TAU);
            ctx.stroke();
          }
          const pts = LAYOUTS[i0].map((p, i) => ({x: lerp(p.x, LAYOUTS[i0 + 1][i].x, t), y: lerp(p.y, LAYOUTS[i0 + 1][i].y, t)}));
          for (const p of pts) {
            const d = Math.hypot((p.x - C.x) / 1.35, (p.y - C.y) / 0.72);
            const lit = clamp(1 - d / 640);
            drawPerson(ctx, p.x, p.y + 30, 54, `rgb(${Math.round(lerp(70, 255, lit))},${Math.round(lerp(80, 200, lit))},${Math.round(lerp(98, 120, lit))})`, vis);
          }
          const dm = Math.hypot((me.x - C.x) / 1.35, (me.y - C.y) / 0.72);
          const litMe = clamp(1 - dm / 640);
          drawGlow(ctx, me.x, me.y, 70, '142,210,255', 0.35 * vis);
          drawPerson(ctx, me.x, me.y + 36, 72, `rgb(${Math.round(lerp(60, 170, litMe))},${Math.round(lerp(90, 224, litMe))},${Math.round(lerp(120, 250, litMe))})`, vis);
          ctx.strokeStyle = color.cool;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(me.x, me.y - 64, 14, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }}
      />
      {FIELDS.map((name, i) => {
        const o = i === 0 ? 1 - s1 : i === 1 ? s1 * (1 - s2) : s2;
        return (
          <div
            key={name}
            style={{
              position: 'absolute',
              left: C.x,
              top: C.y,
              transform: 'translate(-50%, -50%)',
              fontFamily: font.sans,
              fontWeight: 700,
              fontSize: 54,
              color: '#22170A',
              background: color.warmHi,
              borderRadius: 999,
              padding: '14px 34px',
              opacity: o * vis,
              boxShadow: '0 0 60px rgba(255,214,150,0.7)',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: me.x + 70,
          top: me.y - 150,
          opacity: card,
          transform: `translateY(${(1 - card) * 30}px)`,
          width: 420,
          padding: '20px 24px',
          background: 'rgba(22,30,42,0.95)',
          border: `2px solid ${color.line}`,
          borderRadius: 14,
          fontFamily: font.sans,
          fontWeight: 700,
          fontSize: 32,
          color: color.ink,
        }}
      >
        <div>理财入门</div>
        <div style={{fontSize: 26, fontWeight: 500, color: color.dim, marginTop: 6}}>全网最全 · 不跳步</div>
        <div style={{height: 6, background: color.faint, borderRadius: 3, marginTop: 16, marginRight: 70}} />
        <div style={{position: 'absolute', right: 20, top: 30, transform: `scale(${0.8 + 0.5 * star - 0.3 * prog(f, 434, 12)})`}}>
          <IconStar size={56} c={color.warm} w={7} fill={star > 0.3 ? color.warm : 'none'} />
        </div>
      </div>
    </>
  );
};

const Many: React.FC<{f: number}> = ({f}) => {
  const r = rng(77);
  const src = Array.from({length: 13}, () => ({x: 160 + r() * 1600, y: 140 + r() * 760, ph: r() * 90}));
  const vis = prog(f, 0, 40);
  return (
    <CanvasLayer
      draw={(ctx) => {
        ctx.globalAlpha = vis;
        for (const s of src) {
          drawGlow(ctx, s.x, s.y, 90, '255,214,150', 0.35);
          for (let k = 0; k < 3; k++) {
            const t = ((f + s.ph + k * 30) % 90) / 90;
            ctx.strokeStyle = `rgba(255,200,120,${(1 - t) * 0.4})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(s.x, s.y, 20 + t * 220, (20 + t * 220) * 0.6, 0, 0, TAU);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,240,210,0.95)';
          ctx.beginPath();
          ctx.arc(s.x, s.y, 6, 0, TAU);
          ctx.fill();
        }
        const rr = rng(5);
        for (let i = 0; i < 160; i++) {
          const x = 100 + rr() * 1720;
          const y = 120 + rr() * 820;
          let best = 1e9;
          for (const s of src) best = Math.min(best, Math.hypot(x - s.x, (y - s.y) / 0.6));
          const lit = clamp(1 - best / 420);
          drawPerson(ctx, x, y + 12, 30, `rgb(${Math.round(lerp(70, 255, lit))},${Math.round(lerp(80, 196, lit))},${Math.round(lerp(98, 110, lit))})`, 0.95);
        }
        ctx.globalAlpha = 1;
      }}
    />
  );
};

const Sea: React.FC<{f: number; dur: number}> = ({f, dur}) => (
  <CanvasLayer
    draw={(ctx) => {
      const up = prog(f, 0, dur, ease.inOut);
      const cam: Cam = {x: 0, y: lerp(6, 30, up), z: lerp(-30, -46, up), pitch: lerp(0.32, 0.62, up), fov: (42 * Math.PI) / 180};
      const r = rng(2026);
      for (let i = 0; i < 5200; i++) {
        const a = r() * TAU;
        const rad = Math.sqrt(r()) * 70;
        const x = Math.cos(a) * rad;
        const z = Math.sin(a) * rad + 40;
        const p = project(x, 0, z, cam);
        if (!p) continue;
        const ph = r() * 200;
        const click = ((f + ph) % 200) < 6 ? 1 : 0;
        const tw = 0.55 + 0.45 * Math.sin(f / 14 + ph);
        const s = Math.max(0.8, p.k * 0.09);
        if (click) drawGlow(ctx, p.x, p.y, s * 9, '255,214,150', 0.6);
        ctx.fillStyle = `rgba(255,${Math.round(190 + 40 * tw)},${Math.round(110 + 60 * tw)},${0.35 + 0.55 * tw})`;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }}
  />
);

export const L7: React.FC = () => {
  const f = useCurrentFrame();
  const S21 = len('rings');
  const S22 = S21 + len('many');
  const S23 = S22 + len('lock');
  const END = S23 + len('sea');
  const zoomOut = prog(f, S21 - 6, 70, ease.inOut);
  const dim = prog(f, S21 + 240, 26);
  const endFade = prog(f, END - 30, 30, ease.in);
  return (
    <AbsoluteFill>
      {[0, 1, 2, 3].map((k) => (
        <Cue key={'r' + k} s="ping" at={48 + k * 72} gain={0.3} />
      ))}
      <Cue s="whoosh" at={320} dur={0.9} gain={0.5} />
      <Cue s="pop" at={372} gain={0.6} pan={0.2} />
      <Cue s="star" at={418} pan={0.2} />
      <Cue s="whoosh" at={478} dur={0.8} gain={0.5} />
      <Cue s="whoosh" at={S21 - 6} dur={1.2} gain={0.55} />
      {[0, 1, 2, 3, 4].map((k) => (
        <Cue key={'m' + k} s="ping" at={S21 + 20 + k * 44} gain={0.22} pan={((k * 37) % 9) / 9 - 0.5} />
      ))}
      <Cue s="impact" at={S21 + 288} />
      <Cue s="bell" at={S21 + 288} gain={0.7} />
      <Cue s="glass" at={S22 + 96} gain={0.45} pan={0.3} />
      <Cue s="slide" at={S22 + 130} dur={(216 - 130) / 60} pan={0.3} />
      <Cue s="click" at={S22 + 216} pan={0.3} />
      <Cue s="swell" at={S23} dur={4} gain={0.6} />
      <Cue s="sparkle" at={S23 + 10} dur={5} gain={0.4} />
      <Cue s="bell" at={S23 + 72} gain={0.5} />
      {f < S21 + 80 ? (
        <AbsoluteFill style={{transform: `scale(${1 - 0.62 * zoomOut})`, transformOrigin: `${C.x}px ${C.y}px`, opacity: 1 - prog(f, S21 + 30, 50)}}>
          <Rings f={f} />
        </AbsoluteFill>
      ) : null}
      <Line text="我们呢？" at={8} out={92} y={150} size={70} />
      <Line text="在自己的本行，我们嫌长教程磨叽、嫌它土；" at={100} out={320} y={965} size={56} />
      <Line text="换到理财、健身，我们也要「全网最全、不跳步」。" at={338} out={S21 - 10} y={965} size={56} />
      {f >= S21 && f < S22 ? (
        <AbsoluteFill style={{opacity: (1 - 0.7 * dim) * prog(f, S21, 50)}}>
          <Many f={f - S21} />
        </AbsoluteFill>
      ) : null}
      <Line text="下沉不是地理位置，是你离信息源有多远。" at={S21 + 20} out={S21 + 232} y={965} size={56} kind="opinion" opinion />
      <KeySentence n={3} text="每个人，都是某个领域的下沉用户。" at={S21 + 252} out={S22 - 12} y={540} opinion />
      {f >= S22 && f < S23 ? (
        <AbsoluteFill style={{opacity: prog(f, S22, 20) * (1 - prog(f, S23 - 16, 16))}}>
          <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
            <Person x={330} y={900} s={300} c={color.warm} />
          </svg>
          <Lock x={1250} y={540} scale={0.8} bits={[0.9, 0.2, 0.7, 0.05, 0.55]} lockIn={S22 + 96} keyIn={S22 + 130} click={S22 + 216} label="他的处境" />
        </AbsoluteFill>
      ) : null}
      <Line text="别用自己的口味判断世界。" at={S22 + 10} out={S23 - 14} y={150} size={62} kind="opinion" />
      <Line text="问一句「他的处境是什么」，" at={S22 + 230} out={S23 - 14} y={870} size={56} kind="opinion" />
      <Line text="比问「他的品味好不好」有用得多。" at={S22 + 272} out={S23 - 14} y={950} size={56} kind="opinion" />
      {f >= S23 ? (
        <AbsoluteFill style={{opacity: prog(f, S23, 30)}}>
          <Sea f={f - S23} dur={len('sea')} />
        </AbsoluteFill>
      ) : null}
      <Line text="你觉得土的，是十亿人的日常。" at={S23 + 21} y={470} kind="key" size={84} />
      <Line text="全片数据来源见视频简介" at={S23 + 120} y={1010} kind="small" size={28} />
      <AbsoluteFill style={{background: '#000', opacity: endFade}} />
    </AbsoluteFill>
  );
};
