import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, keys, lerp, prog, rng} from '../kit/anim';
import {Person} from '../kit/Person';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {b, color, ease, font} from '../theme';

/** 第二层 09–10（整层是观点）：天平——声音大的一边很轻，掏钱的一边很重；刀郎的例子 */

const PX = 960;
const PY = 360;
const ARM = 470;
const HANG = 210;

const R = rng(42);
const CROWD = Array.from({length: 26}, (_, i) => ({
  x: 1210 + (i % 13) * 50 + (Math.floor(i / 13) ? 25 : 0) + (R() - 0.5) * 14,
  y: 862 - Math.floor(i / 13) * 30,
  s: 54 + R() * 10,
  t: 272 + i * 6 + R() * 6,
  kind: i % 3 === 0 ? 'glass' : 'coin',
}));

const Token: React.FC<{x: number; y: number; kind: string; o?: number}> = ({x, y, kind, o = 1}) =>
  kind === 'coin' ? (
    <g opacity={o}>
      <ellipse cx={x} cy={y} rx={15} ry={6} fill={color.warm} />
      <ellipse cx={x} cy={y - 2} rx={15} ry={6} fill={color.warmHi} opacity={0.6} />
    </g>
  ) : (
    <g opacity={o} stroke={color.warmHi} strokeWidth={2.5} fill="rgba(255,181,71,0.35)">
      <path d={`M${x - 9} ${y - 14} L${x + 9} ${y - 14} L${x} ${y} L${x + 9} ${y + 14} L${x - 9} ${y + 14} L${x} ${y} Z`} />
    </g>
  );

const Scale: React.FC<{f: number}> = ({f}) => {
  const theta = keys(f, [
    [272, 0],
    [476, 10.5],
    [506, 9.2],
    [536, 9.6],
  ], ease.inOut);
  const rad = (theta * Math.PI) / 180;
  const L = {x: PX - ARM * Math.cos(rad), y: PY - ARM * Math.sin(rad)};
  const Rr = {x: PX + ARM * Math.cos(rad), y: PY + ARM * Math.sin(rad)};
  const panL = {x: L.x, y: L.y + HANG};
  const panR = {x: Rr.x, y: Rr.y + HANG};
  const leftIn = prog(f, 90, 40);
  const ringsOn = clamp((f - 120) / 20) * (1 - clamp((f - 520) / 30));
  const words = ['好音乐', '好电影', '好内容'];

  // 右盘里越堆越高的钱和沙漏
  const landed = CROWD.filter((c) => f > c.t + 34);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="domeL" cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor={color.cool} stopOpacity={0.16} />
          <stop offset="1" stopColor={color.cool} stopOpacity={0.02} />
        </radialGradient>
      </defs>
      {/* 立柱和底座 */}
      <line x1={PX} y1={PY} x2={PX} y2={930} stroke={color.brass} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
      <path d={`M${PX - 120} 940 Q${PX} 900 ${PX + 120} 940 Z`} fill={color.brassDeep} />
      <path d={`M${PX - 24} ${PY - 40} L${PX + 24} ${PY - 40} L${PX} ${PY - 4} Z`} fill={color.brassHi} />
      {/* 横梁 */}
      <line x1={L.x} y1={L.y} x2={Rr.x} y2={Rr.y} stroke={color.brassHi} strokeWidth={9} strokeLinecap="round" />
      <circle cx={PX} cy={PY} r={13} fill={color.brassHi} />
      {[L, Rr].map((e, i) => (
        <g key={i}>
          <line x1={e.x} y1={e.y} x2={e.x - 170} y2={e.y + HANG} stroke={color.brass} strokeWidth={2} opacity={0.7} />
          <line x1={e.x} y1={e.y} x2={e.x + 170} y2={e.y + HANG} stroke={color.brass} strokeWidth={2} opacity={0.7} />
          <circle cx={e.x} cy={e.y} r={7} fill={color.brassHi} />
        </g>
      ))}
      {[panL, panR].map((p, i) => (
        <path key={i} d={`M${p.x - 190} ${p.y} Q${p.x} ${p.y + 70} ${p.x + 190} ${p.y} Z`} fill={color.brassDeep} stroke={color.brassHi} strokeWidth={3} />
      ))}

      {/* 左盘：光罩里的少数人，举着话筒，声音很大 */}
      <g opacity={leftIn}>
        <path d={`M${panL.x - 175} ${panL.y} A175 160 0 0 1 ${panL.x + 175} ${panL.y} Z`} fill="url(#domeL)" stroke="rgba(190,232,255,0.45)" strokeWidth={2} />
        {[-90, -30, 30, 90].map((dx, i) => (
          <g key={i}>
            <rect x={panL.x + dx - 22} y={panL.y - 22} width={44} height={22} rx={4} fill="#22344A" />
            <Person x={panL.x + dx} y={panL.y - 22} s={74} c="#9AD3F5" />
            <path d={`M${panL.x + dx + 10} ${panL.y - 66} l26 -12 l0 26 Z`} fill={color.cool} />
          </g>
        ))}
        {Array.from({length: 4}).map((_, k) => {
          const t = ((f - 120 + k * 22) % 88) / 88;
          if (ringsOn <= 0 || f < 120) return null;
          const r = 60 + t * 330;
          return (
            <circle key={k} cx={panL.x} cy={panL.y - 80} r={r} fill="none" stroke={color.cool} strokeWidth={3} opacity={(1 - t) * 0.5 * ringsOn} />
          );
        })}
        {words.map((w, i) => {
          const st = 150 + i * 70;
          const t = clamp((f - st) / 150);
          if (t <= 0 || t >= 1) return null;
          return (
            <text
              key={w}
              x={panL.x + (i - 1) * 150}
              y={panL.y - 190 - t * 90}
              textAnchor="middle"
              fontFamily={font.serif}
              fontWeight={600}
              fontSize={44}
              fill={color.cool}
              opacity={Math.sin(t * Math.PI) * 0.9 * ringsOn}
            >
              {w}
            </text>
          );
        })}
      </g>

      {/* 右边：光罩外的人群，投进钱和时间 */}
      {CROWD.map((c, i) => {
        const vis = prog(f, 246 + i * 3, 30);
        const fly = clamp((f - c.t) / 34);
        const tx = lerp(c.x, panR.x + ((i * 37) % 200) - 100, ease.inOut(fly));
        const ty = lerp(c.y - c.s, panR.y - 10 - Math.floor(landed.indexOf(c) / 8) * 16, ease.inOut(fly)) - Math.sin(fly * Math.PI) * 160;
        return (
          <g key={i}>
            <Person x={c.x} y={c.y} s={c.s} c={color.warm} o={vis * 0.95} />
            {fly > 0 && fly < 1 ? <Token x={tx} y={ty} kind={c.kind} /> : null}
          </g>
        );
      })}
      {landed.map((c, k) => (
        <Token key={k} x={panR.x - 120 + (k % 8) * 34} y={panR.y + 4 - Math.floor(k / 8) * 15} kind={c.kind} />
      ))}
    </svg>
  );
};

const Daolang: React.FC<{f: number}> = ({f}) => {
  const y0 = 610;
  const x2004 = 560;
  const xLater = 1440;
  const appear = prog(f, 0, 30);
  const travel = prog(f, 150, 60, ease.inOut);
  const crowd = prog(f, 190, 60);
  const lift = prog(f, 230, 80, ease.out);
  const px = lerp(x2004, xLater, travel);
  const py = y0 - 8 - lift * 150;
  const critics = [-150, -100, -50, 0];
  const leave = prog(f, 70, 70, ease.inOut);
  const R2 = rng(7);
  const fans = Array.from({length: 44}, (_, i) => ({x: 1090 + (i % 15) * 50 + (R2() - 0.5) * 20, y: y0 + 175 + Math.floor(i / 15) * 34, s: 44 + R2() * 8}));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: appear}}>
      <line x1={200} y1={y0} x2={1720} y2={y0} stroke={color.line} strokeWidth={3} />
      <line x1={200} y1={y0} x2={px} y2={y0} stroke={color.warm} strokeWidth={3} opacity={travel > 0 ? 0.8 : 0} />
      {[
        {x: x2004, t: '2004'},
        {x: xLater, t: '多年后'},
      ].map((m) => (
        <g key={m.t}>
          <line x1={m.x} y1={y0 - 10} x2={m.x} y2={y0 + 10} stroke={color.dim} strokeWidth={3} />
          <text x={m.x} y={y0 + 62} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={40} fill={color.dim}>
            {m.t}
          </text>
        </g>
      ))}
      {/* 评判的人转身离开 */}
      {critics.map((dx, i) => (
        <Person key={i} x={x2004 - 140 + dx - leave * 160} y={y0 - 4} s={70} c="#7FB3D6" o={0.9 * (1 - leave * 0.85)} />
      ))}
      {/* 听的人：声波汇成浪，把他托起来 */}
      {fans.map((p, i) => (
        <Person key={i} x={p.x} y={p.y} s={p.s} c={color.warm} o={crowd * 0.9} />
      ))}
      {crowd > 0
        ? Array.from({length: 5}).map((_, k) => {
            const t = ((f - 190 + k * 18) % 90) / 90;
            return (
              <ellipse
                key={k}
                cx={xLater}
                cy={y0 + 150}
                rx={120 + t * 520}
                ry={40 + t * 170}
                fill="none"
                stroke={color.warm}
                strokeWidth={3}
                opacity={(1 - t) * 0.45 * crowd}
              />
            );
          })
        : null}
      <defs>
        <linearGradient id="lift" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={color.warm} stopOpacity={0.45} />
          <stop offset="1" stopColor={color.warm} stopOpacity={0} />
        </linearGradient>
        <radialGradient id="halo">
          <stop offset="0" stopColor={color.warm} stopOpacity={0.4} />
          <stop offset="1" stopColor={color.warm} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M${xLater - 330} ${y0 + 200} Q${xLater} ${y0 + 40 - 260 * lift} ${xLater + 330} ${y0 + 200} Z`} fill="url(#lift)" opacity={lift} />
      <circle cx={px} cy={py - 46} r={150} fill="url(#halo)" opacity={lift} />
      <Person x={px} y={py} s={96} c={lift > 0.05 ? color.warmHi : '#C9D2DE'} />
      <path d={`M${px + 4} ${py - 40} l40 -34`} stroke={color.brass} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={px + 6} cy={py - 34} rx={20} ry={14} fill={color.brass} />
      <text x={px} y={py - 116} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={38} fill={color.ink} opacity={prog(f, 20, 20)}>
        刀郎
      </text>
    </svg>
  );
};

export const L2: React.FC = () => {
  const f = useCurrentFrame();
  const S10 = len('09');
  const END = S10 + len('10');
  const scaleO = 1 - prog(f, S10 - 18, 18);
  return (
    <AbsoluteFill>
      {f < S10 ? (
        <AbsoluteFill style={{opacity: scaleO}}>
          <Scale f={f} />
        </AbsoluteFill>
      ) : null}
      <Line text="定义好坏的人，不是掏钱的人。" at={14} out={S10 - 6} y={120} size={62} kind="opinion" opinion />
      <Line text="乐评 · 媒体 · 从业者 · 做内容的人" at={b(3.6)} out={S10 - 6} x={480} y={845} kind="label" color={color.cool} size={36} />
      <Line text="大多在少数城市，习惯用自己的口味投票" at={b(5)} out={S10 - 6} x={480} y={915} kind="opinion" size={40} />
      <Line text="另外那十亿人：花钱，也花时间" at={b(9)} out={S10 - 6} x={1470} y={915} kind="opinion" size={40} />
      {f >= S10 ? (
        <AbsoluteFill style={{opacity: 1 - prog(f, END - 18, 18)}}>
          <Daolang f={f - S10} />
        </AbsoluteFill>
      ) : null}
      <Line text="2004 年，刀郎出道，被乐坛看不上。" at={S10 + 14} out={S10 + 196} y={930} size={58} />
      <Line text="多年后，因为《罗刹海市》，被网友「封神」。" at={S10 + 214} out={END - 14} y={930} size={58} />
    </AbsoluteFill>
  );
};
