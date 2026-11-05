import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lerp, prog, rng} from '../kit/anim';
import {Person} from '../kit/Person';
import {Cue} from '../kit/Sound';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/**
 * 11 「下沉」这个词，是从上往下看的：少数人在上面，箭头往下指着大多数人。
 * 按人数重新排一次：人多的一组升到上面——可要是按人数算，他们才是主流。（观点）
 * 两组正好是方阵里的 18 和 82 个人，不另标数字。
 */

const TOP_Y = 330;
const BOT_Y = 735;

const R = rng(1111);
const FEW = Array.from({length: 18}, (_, i) => ({dx: (i % 6) * 36 - 90 + (Math.floor(i / 6) % 2) * 18, dy: Math.floor(i / 6) * 40 - 40}));
const MANY = Array.from({length: 82}, (_, i) => ({dx: (i % 28) * 46 - 621 + (Math.floor(i / 28) % 2) * 23 + (R() - 0.5) * 8, dy: Math.floor(i / 28) * 46 - 46}));

export const Flip: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('flip');
  const vis = prog(f, 0, 24) * (1 - prog(f, END - 20, 20));
  const arrow = prog(f, 30, 40, ease.inOut);
  const swap = prog(f, 252, 70, ease.inOut);
  const fewY = lerp(TOP_Y, BOT_Y, swap);
  const manyY = lerp(BOT_Y, TOP_Y, swap);
  const arrowO = arrow * (1 - prog(f, 240, 20));
  const lit = prog(f, 300, 40);
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Cue s="whoosh" at={30} dur={0.8} gain={0.55} />
      <Cue s="rise" at={252} dur={1.3} gain={0.8} />
      <Cue s="swell" at={300} dur={2.2} gain={0.55} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="flipDome" cx="0.5" cy="1" r="0.9">
            <stop offset="0" stopColor={color.cool} stopOpacity={0.2} />
            <stop offset="1" stopColor={color.cool} stopOpacity={0.03} />
          </radialGradient>
          <linearGradient id="flipArrow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color.cool} stopOpacity={0.9} />
            <stop offset="1" stopColor={color.cool} stopOpacity={0.25} />
          </linearGradient>
        </defs>
        {/* 少数人：光罩里 */}
        <g transform={`translate(960 ${fewY})`}>
          <path d="M-170 40 A170 150 0 0 1 170 40 Z" fill="url(#flipDome)" stroke="rgba(190,232,255,0.5)" strokeWidth={2} />
          {FEW.map((p, i) => (
            <Person key={i} x={p.dx} y={p.dy + 40} s={34} c="#9AD3F5" />
          ))}
        </g>
        {/* 大多数人 */}
        <g transform={`translate(960 ${manyY})`}>
          {MANY.map((p, i) => (
            <Person key={i} x={p.dx} y={p.dy + 40} s={34} c={color.warm} o={0.75 + 0.25 * lit} />
          ))}
        </g>
        {/* 往下看的箭头 */}
        <g opacity={arrowO}>
          <line x1={960} y1={TOP_Y + 70} x2={960} y2={TOP_Y + 70 + 230 * arrow} stroke="url(#flipArrow)" strokeWidth={10} strokeLinecap="round" />
          <path d={`M930 ${TOP_Y + 60 + 230 * arrow} L960 ${TOP_Y + 100 + 230 * arrow} L990 ${TOP_Y + 60 + 230 * arrow}`} fill="none" stroke={color.cool} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.9 ? 1 : 0} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 1010,
          top: TOP_Y + 190,
          transform: 'translate(0, -50%)',
          fontFamily: font.serif,
          fontWeight: 900,
          fontSize: 72,
          color: color.cool,
          opacity: arrowO,
          letterSpacing: '0.1em',
        }}
      >
        下沉
      </div>
      {/* 两组的说明，跟着各自移动 */}
      <div style={{position: 'absolute', left: 960 + 210, top: fewY + 10, transform: 'translate(0, -50%)', fontFamily: font.sans, fontWeight: 500, fontSize: 32, color: color.cool, opacity: 0.85, whiteSpace: 'nowrap'}}>
        一二线城市
      </div>
      <div style={{position: 'absolute', left: 960, top: manyY + 120, transform: 'translate(-50%, -50%)', fontFamily: font.sans, fontWeight: 500, fontSize: 32, color: color.warmHi, opacity: 0.85, whiteSpace: 'nowrap'}}>
        三线及以下城市和农村
      </div>
      <Line text="「下沉」这个词，是从上往下看的。" at={16} out={240} y={960} size={58} />
      <Line text="可要是按人数算，他们才是主流。" at={306} out={END - 16} y={960} size={58} kind="opinion" opinion />
    </AbsoluteFill>
  );
};
