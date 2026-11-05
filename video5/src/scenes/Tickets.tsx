import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lerp, prog} from '../kit/anim';
import {Cue} from '../kit/Sound';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/**
 * 13 掏钱的人在哪：2026 年春节档，三四线城市票房占比 53.4%（灯塔专业版）。
 * 一张大票根，暖色按真实比例填到 53.4%；之后票根上方冒出几句冷色的"评价"——
 * 票是他们买的，口碑常常是别人定的。（观点）
 */

const TX = 960;
const TY = 400;
const TW = 1320;
const TH = 330;
const STUB = 250;
const BAR_X0 = TX - TW / 2 + 60;
const BAR_X1 = TX + TW / 2 - STUB - 50;
const BAR_Y = TY + 30;
const BAR_H = 96;
const SHARE = 0.534;

const REVIEWS = [
  {t: '一般', x: 1060, y: 170, d: 0},
  {t: '看不下去', x: 1310, y: 135, d: 14},
  {t: '有点土', x: 1555, y: 178, d: 28},
];

export const Tickets: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('tickets');
  const vis = prog(f, 0, 24, ease.out) * (1 - prog(f, END - 20, 20));
  const fill = prog(f, 50, 80, ease.inOut);
  const punch = prog(f, 30, 10);
  const later = prog(f, 330, 30);
  const w = (BAR_X1 - BAR_X0) * SHARE * fill;
  // 票根轮廓：两侧半圆缺口
  const L = TX - TW / 2;
  const T = TY - TH / 2;
  const r = 34;
  const outline = `M${L + 20} ${T} H${L + TW - 20} Q${L + TW} ${T} ${L + TW} ${T + 20} V${TY - r} A${r} ${r} 0 0 0 ${L + TW} ${TY + r} V${T + TH - 20} Q${L + TW} ${T + TH} ${L + TW - 20} ${T + TH} H${L + 20} Q${L} ${T + TH} ${L} ${T + TH - 20} V${TY + r} A${r} ${r} 0 0 0 ${L} ${TY - r} V${T + 20} Q${L} ${T} ${L + 20} ${T} Z`;
  return (
    <AbsoluteFill>
      <Cue s="whoosh" at={0} dur={0.5} gain={0.5} />
      <Cue s="punch" at={34} />
      <Cue s="rise" at={50} dur={1.4} gain={0.6} />
      <Cue s="tick" at={130} gain={0.7} />
      {REVIEWS.map((v, i) => (
        <Cue key={i} s="pop" at={346 + v.d} gain={0.45} pan={0.5} />
      ))}
      <AbsoluteFill style={{opacity: vis, transform: `translateY(${(1 - vis) * 40}px)`}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <linearGradient id="tkFill" x1="0" x2="1">
              <stop offset="0" stopColor={color.warmDeep} />
              <stop offset="1" stopColor={color.warm} />
            </linearGradient>
          </defs>
          <path d={outline} fill="#151C28" stroke="rgba(242,213,156,0.35)" strokeWidth={3} opacity={lerp(1, 0.7, later)} />
          {/* 撕线 */}
          <line x1={TX + TW / 2 - STUB} y1={T + 24} x2={TX + TW / 2 - STUB} y2={T + TH - 24} stroke="rgba(242,213,156,0.35)" strokeWidth={3} strokeDasharray="4 12" strokeLinecap="round" />
          <circle cx={TX + TW / 2 - STUB / 2} cy={TY} r={26 * punch} fill="#0A0D13" stroke="rgba(242,213,156,0.35)" strokeWidth={2} />
          {/* 比例条 */}
          <rect x={BAR_X0} y={BAR_Y} width={BAR_X1 - BAR_X0} height={BAR_H} rx={14} fill="#2A3242" />
          <rect x={BAR_X0} y={BAR_Y} width={w} height={BAR_H} rx={14} fill="url(#tkFill)" />
          <line x1={BAR_X0 + (BAR_X1 - BAR_X0) * 0.5} y1={BAR_Y - 12} x2={BAR_X0 + (BAR_X1 - BAR_X0) * 0.5} y2={BAR_Y + BAR_H + 12} stroke={color.ink} strokeOpacity={0.5 * fill} strokeWidth={2} strokeDasharray="6 6" />
        </svg>
        <div style={{position: 'absolute', left: BAR_X0, top: T + 40, fontFamily: font.sans, fontWeight: 500, fontSize: 32, color: color.dim}}>2026 年春节档 · 全国票房</div>
        <div style={{position: 'absolute', left: BAR_X0 + (BAR_X1 - BAR_X0) * 0.5 + 10, top: BAR_Y + BAR_H + 16, fontFamily: font.sans, fontWeight: 500, fontSize: 24, color: color.dim, opacity: fill}}>一半</div>
        <div
          style={{
            position: 'absolute',
            left: BAR_X0 + 28,
            top: BAR_Y + BAR_H / 2,
            transform: 'translate(0, -50%)',
            fontFamily: font.sans,
            fontWeight: 700,
            fontSize: 40,
            color: '#1A1206',
            opacity: prog(f, 90, 24),
            whiteSpace: 'nowrap',
          }}
        >
          三四线城市
        </div>
        <div
          style={{
            position: 'absolute',
            left: BAR_X0 + w + 22,
            top: BAR_Y + BAR_H / 2,
            transform: 'translate(0, -50%)',
            fontFamily: font.sans,
            fontWeight: 700,
            fontSize: 64,
            color: color.warmHi,
            fontVariantNumeric: 'tabular-nums',
            opacity: prog(f, 56, 20),
            whiteSpace: 'nowrap',
          }}
        >
          {(53.4 * fill).toFixed(1)}%
        </div>
        <div style={{position: 'absolute', left: TX + TW / 2 - STUB / 2, top: T + TH - 60, transform: 'translate(-50%, 0)', fontFamily: font.sans, fontWeight: 500, fontSize: 26, color: color.dim, whiteSpace: 'nowrap'}}>
          掏钱的人
        </div>
        {/* 冷色的"评价"：口碑常常是另一群人定的 */}
        {REVIEWS.map((v, i) => {
          const p = prog(f, 346 + v.d, 20, ease.back);
          if (p <= 0) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: v.x,
                top: v.y,
                transform: `translate(-50%, -50%) scale(${p})`,
                fontFamily: font.sans,
                fontWeight: 500,
                fontSize: 32,
                color: color.cool,
                padding: '10px 22px',
                borderRadius: 18,
                border: `2px solid rgba(142,210,255,0.55)`,
                background: 'rgba(16,26,40,0.95)',
                whiteSpace: 'nowrap',
                opacity: 0.95,
              }}
            >
              {v.t}
            </div>
          );
        })}
      </AbsoluteFill>
      <Line text="2026 年春节档，三四线城市票房占比 *53.4%*，创历年春节档新高" at={26} out={330} y={800} kind="data" size={50} hl={color.warmHi} source="灯塔专业版，2026" />
      <Line text="票是他们买的，口碑常常是别人定的。" at={346} out={END - 14} y={800} size={58} kind="opinion" />
    </AbsoluteFill>
  );
};
