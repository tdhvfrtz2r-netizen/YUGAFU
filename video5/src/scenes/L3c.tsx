import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog, rng, TAU} from '../kit/anim';
import {CanvasLayer, drawGlow} from '../kit/Canvas';
import {Lock} from '../kit/Lock';
import {Person} from '../kit/Person';
import {Cue} from '../kit/Sound';
import {KeySentence, Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';
import {LockCount} from './L3a';

/** 第三层 15–16：锁④表达（线团捋成声波，一圈传一圈）；小结：四把锁全开 → ② 土，是约束下的最优解 */

const CX = 600;
const CY = 676;
const NPTS = 240;

const knot = (t: number) => {
  const a = t * Math.PI * 7;
  const r = 46 + 52 * Math.sin(t * 17 + 1.3);
  return [CX + r * Math.cos(a + Math.sin(t * 9)), CY + r * 0.85 * Math.sin(a * 1.07)];
};
const wave = (t: number) => [CX + t * 1180, CY - 10 + 50 * Math.sin(t * Math.PI * 7) * (1 - 0.4 * t)];

const R = rng(11);
const FANS = Array.from({length: 34}, (_, i) => ({
  x: 1010 + (i % 12) * 66 + (R() - 0.5) * 24,
  y: 770 + Math.floor(i / 12) * 54 + (R() - 0.5) * 10,
  s: 62 + R() * 12,
}));

const Express: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 120, 30) * (1 - prog(f, len('express') - 18, 18));
  if (vis <= 0) return null;
  const m = prog(f, 168, 54, ease.inOut);
  let d = '';
  for (let i = 0; i <= NPTS; i++) {
    const t = i / NPTS;
    const [kx, ky] = knot(t);
    const [wx, wy] = wave(t);
    d += `${i ? 'L' : 'M'}${lerp(kx, wx, m).toFixed(1)} ${lerp(ky, wy, m).toFixed(1)}`;
  }
  const ringT = (k: number) => ((f - 222 + k * 20) % 80) / 80;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <Person x={CX} y={900} s={400} c="#3A4558" />
      <path d={d} stroke={m > 0.5 ? color.warmHi : '#9AA6B8'} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {f > 222
        ? [0, 1, 2, 3].map((k) => {
            const t = ringT(k);
            return <circle key={k} cx={CX} cy={CY} r={60 + t * 760} fill="none" stroke={color.warm} strokeWidth={3} opacity={(1 - t) * 0.45} />;
          })
        : null}
      {FANS.map((p, i) => {
        const reach = (p.x - CX) / 760;
        const lit = prog(f, 222 + reach * 80, 20);
        const t = ((f - 222 - reach * 80 + i * 7) % 60) / 60;
        return (
          <g key={i}>
            {lit > 0.5 ? <circle cx={p.x} cy={p.y - p.s * 0.6} r={20 + t * 50} fill="none" stroke={color.warm} strokeWidth={2} opacity={(1 - t) * 0.5 * lit} /> : null}
            <Person x={p.x} y={p.y} s={p.s} c={lit > 0.02 ? color.warm : '#3A4558'} o={0.35 + 0.65 * lit} />
          </g>
        );
      })}
    </svg>
  );
};

const LOCKS = [
  {label: '钱', icon: 'cup' as const, bits: [0.3, 0.9, 0.5, 0.15, 0.7]},
  {label: '时间和情绪', icon: 'phone' as const, bits: [0.6, 0.2, 0.95, 0.4, 0.1]},
  {label: '知识门槛', icon: 'stairs' as const, bits: [0.15, 0.75, 0.35, 0.9, 0.5]},
  {label: '表达', icon: 'wave' as const, bits: [0.8, 0.45, 0.1, 0.6, 0.3]},
];

const drawField = (ctx: CanvasRenderingContext2D, f: number) => {
  const r = rng(5);
  for (let k = 0; k < 900; k++) {
    const x = r() * 1920;
    const y = 120 + r() * 860;
    const d = Math.hypot(x - 960, y - 430) / 1100;
    const p = clamp((f - 96 - d * 90) / 14);
    if (p <= 0) continue;
    const tw = 0.6 + 0.4 * Math.sin(f / 9 + k);
    drawGlow(ctx, x, y, 10 + r() * 10, '255,181,71', 0.5 * p * tw);
    ctx.fillStyle = `rgba(255,224,163,${0.9 * p})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, TAU);
    ctx.fill();
  }
};

const AllOpen: React.FC<{f: number}> = ({f}) => {
  const shrink = prog(f, 90, 70, ease.inOut);
  const k = lerp(1, 0.62, shrink);
  return (
    <AbsoluteFill>
      <CanvasLayer draw={(ctx) => drawField(ctx, f)} />
      <AbsoluteFill style={{transform: `scale(${k})`, transformOrigin: '960px 430px', opacity: 1 - 0.5 * shrink}}>
        {LOCKS.map((l, i) => {
          const x = (i % 2 ? 1440 : 700) - 70;
          const y = i < 2 ? 300 : 580;
          // 缩小之后锁上的字太小，淡掉（前面已经看清过）；"刚好"标签放在缩放层外面，字号保持可读
          return <Lock key={l.label} x={x + 70} y={y} scale={0.44} bits={l.bits} keyIn={-60} click={-12} label={l.label} icon={l.icon} labelOpacity={1 - shrink} />;
        })}
      </AbsoluteFill>
      {LOCKS.map((l, i) => {
        const x = (i % 2 ? 1440 : 700) - 70;
        const y = i < 2 ? 300 : 580;
        const flip = prog(f, 40 + i * 10, 16, ease.inOut);
        const sx = Math.abs(Math.cos(flip * Math.PI));
        const back = flip > 0.5;
        return (
          <div
            key={l.label}
            style={{
              position: 'absolute',
              left: 960 + (x - 115 - 960) * k,
              top: 430 + (y + 72 - 430) * k,
              transform: `translate(-50%, 0) scaleX(${sx})`,
              fontFamily: back ? font.sans : font.serif,
              fontWeight: 700,
              fontSize: lerp(34, 30, shrink),
              color: back ? '#1A1206' : color.ink,
              background: back ? color.warmHi : '#3A4558',
              padding: '6px 16px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
              opacity: 1 - 0.25 * shrink,
            }}
          >
            {back ? '刚好' : '土'}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const L3c: React.FC = () => {
  const f = useCurrentFrame();
  const S16 = len('express');
  const END = S16 + len('allOpen');
  const g = f - S16;
  const zoom = prog(f, 98, 44, ease.in);
  const dim = prog(g, 250, 24);
  return (
    <AbsoluteFill>
      {f < 150 ? (
        <AbsoluteFill style={{transform: `scale(${1 + zoom * 2.2})`, transformOrigin: '1060px 500px', opacity: 1 - zoom}}>
          <Lock x={1160} y={520} scale={0.72} bits={LOCKS[3].bits} lockIn={-8} keyIn={2} click={80} label="表达" icon="wave" />
        </AbsoluteFill>
      ) : null}
      <Cue s="slide" at={2} dur={1.2} />
      <Cue s="click" at={80} />
      <Cue s="whoosh" at={98} dur={0.8} gain={0.55} />
      <Cue s="whoosh" at={168} dur={0.9} gain={0.5} pan={-0.4} />
      <Cue s="chime" at={222} gain={0.55} pan={-0.4} />
      {[0, 1, 2, 3].map((k) => (
        <Cue key={k} s="ping" at={222 + k * 80} gain={0.35} pan={-0.3} />
      ))}
      <Cue s="swell" at={230} dur={3} gain={0.6} pan={0.3} />
      {[0, 1, 2, 3].map((k) => (
        <Cue key={'p' + k} s="peel" at={S16 + 48 + k * 10} gain={0.55} pan={k % 2 ? 0.4 : -0.4} />
      ))}
      <Cue s="whoosh" at={S16 + 90} dur={1.2} gain={0.5} />
      <Cue s="sparkle" at={S16 + 100} dur={2.8} gain={0.7} />
      <Cue s="impact" at={S16 + 288} gain={0.85} />
      <Cue s="bell" at={S16 + 288} gain={0.65} />
      {f < S16 ? <LockCount n={4} at={2} out={130} /> : null}
      {f < S16 ? <Express f={f} /> : null}
      <Line text="好记、能跟着唱的旋律，" at={96} out={S16 - 14} y={170} size={58} />
      <Line text="替普通人说出了自己说不出的情绪。" at={200} out={S16 - 14} y={260} size={58} kind="opinion" opinion />
      {g >= 0 ? (
        <AbsoluteFill style={{opacity: 1 - 0.8 * dim}}>
          <AllOpen f={g} />
        </AbsoluteFill>
      ) : null}
      <Line text="「土」不是缺点，是精准回应了大多数人的处境。" at={S16 + 16} out={S16 + 240} y={880} size={58} kind="opinion" opinion />
      <KeySentence n={2} text="土，是约束下的最优解。" at={S16 + 252} out={END - 12} y={540} opinion />
    </AbsoluteFill>
  );
};
