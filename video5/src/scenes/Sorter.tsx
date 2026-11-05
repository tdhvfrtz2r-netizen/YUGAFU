import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog, rng} from '../kit/anim';
import {IconBar, IconCamera, IconCup, IconFrame, IconGlass, IconPhone, IconVinyl, IconWave} from '../kit/Icons';
import {Person} from '../kit/Person';
import {Cue} from '../kit/Sound';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/**
 * 14 布尔迪厄：品味会给东西分类，也会给做分类的人分类。
 * 一条分拣线：一个人把东西拨进"高级"和"土"两个筐。镜头往后一拉——这个人自己，也站在一个筐里。
 */

const BELT_X0 = 270;
const BELT_X1 = 1000;
const BELT_Y = 560;
const V = 7;
const UP = {x: 1450, y: 265};
const DOWN = {x: 1450, y: 690};

type Item = {Icon: React.FC<{size?: number; c?: string; w?: number}>; fancy: boolean};
const ITEMS: Item[] = [
  {Icon: IconCup, fancy: false},
  {Icon: IconGlass, fancy: true},
  {Icon: IconPhone, fancy: false},
  {Icon: IconVinyl, fancy: true},
  {Icon: IconWave, fancy: false},
  {Icon: IconFrame, fancy: true},
  {Icon: IconBar, fancy: false},
  {Icon: IconCamera, fancy: true},
];
const spawn = (k: number) => 10 + k * 30;
const arrive = (k: number) => spawn(k) + Math.round((BELT_X1 - BELT_X0 + 60) / V);
const FLICK = 24;

const R = rng(1414);
const THEM = Array.from({length: 40}, (_, i) => ({x: 1230 + (i % 10) * 54 + (R() - 0.5) * 10, y: 470 + Math.floor(i / 10) * 62 + (R() - 0.5) * 8}));

const Bin: React.FC<{x: number; y: number; w: number; h: number; label: string; c: string; o?: number}> = ({x, y, w, h, label, c, o = 1}) => (
  <g opacity={o}>
    <path d={`M${x - w / 2} ${y - h / 2} L${x - w / 2 + 18} ${y + h / 2} L${x + w / 2 - 18} ${y + h / 2} L${x + w / 2} ${y - h / 2}`} fill="rgba(255,255,255,0.03)" stroke={c} strokeWidth={4} strokeLinejoin="round" />
    <text x={x} y={y + h / 2 + 52} textAnchor="middle" fontFamily={font.serif} fontWeight={900} fontSize={46} fill={c}>
      {label}
    </text>
  </g>
);

export const Sorter: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('sorter');
  const vis = prog(f, 0, 20) * (1 - prog(f, END - 20, 20));
  const pull = prog(f, 380, 90, ease.inOut);
  const big = prog(f, 430, 50, ease.out);
  // 手臂：每次分拣时往上或往下拨一下
  let arm = 0;
  ITEMS.forEach((it, k) => {
    const t = (f - arrive(k)) / FLICK;
    if (t >= 0 && t <= 1) arm = Math.sin(t * Math.PI) * (it.fancy ? -1 : 1);
  });
  const SX = 1150;
  const SY = 690;
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Cue s="conveyor" at={0} dur={6.4} gain={0.35} />
      {ITEMS.map((it, k) => (
        <Cue key={k} s="sort" at={arrive(k)} gain={0.6} pan={0.3} />
      ))}
      {ITEMS.map((it, k) => (
        <Cue key={'l' + k} s={it.fancy ? 'tick' : 'thud'} at={arrive(k) + FLICK} gain={0.45} pan={0.5} />
      ))}
      <Cue s="whoosh" at={380} dur={1.4} gain={0.7} />
      <Cue s="glass" at={436} gain={0.55} />
      <Cue s="swell" at={450} dur={2.2} gain={0.4} />

      <AbsoluteFill style={{transform: `translate(${-260 * pull}px, ${-40 * pull}px) scale(${lerp(1, 0.5, pull)})`, transformOrigin: '960px 540px'}}>
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {/* 传送带 */}
          <rect x={BELT_X0 - 30} y={BELT_Y + 8} width={BELT_X1 - BELT_X0 + 60} height={30} rx={15} fill="#1C2433" stroke="rgba(238,231,218,0.18)" strokeWidth={2} />
          {Array.from({length: 22}).map((_, i) => {
            const x = BELT_X0 - 20 + ((i * 42 + f * V) % (BELT_X1 - BELT_X0 + 40));
            return <line key={i} x1={x} y1={BELT_Y + 16} x2={x + 16} y2={BELT_Y + 16} stroke="rgba(238,231,218,0.25)" strokeWidth={3} strokeLinecap="round" />;
          })}
          {Array.from({length: 9}).map((_, i) => (
            <circle key={i} cx={BELT_X0 + i * ((BELT_X1 - BELT_X0) / 8)} cy={BELT_Y + 23} r={10} fill="#273141" stroke="rgba(238,231,218,0.25)" strokeWidth={2} />
          ))}
          <Bin x={UP.x} y={UP.y} w={260} h={150} label="高级" c={color.cool} />
          <Bin x={DOWN.x} y={DOWN.y} w={260} h={150} label="土" c={color.warm} />
          {/* 分拣的人：冷蓝色，和"我们"同一个颜色 */}
          <Person x={SX} y={SY} s={190} c="#9AD3F5" />
          <line x1={SX - 20} y1={SY - 120} x2={SX - 130} y2={SY - 135 + arm * 60} stroke="#9AD3F5" strokeWidth={16} strokeLinecap="round" />
        </svg>
        {ITEMS.map((it, k) => {
          const s0 = spawn(k);
          if (f < s0) return null;
          const a0 = arrive(k);
          let x: number;
          let y: number;
          let sc = 1;
          const tgt = it.fancy ? UP : DOWN;
          const slot = Math.floor(k / 2);
          if (f < a0) {
            x = BELT_X0 - 60 + (f - s0) * V;
            y = BELT_Y - 46;
          } else {
            const t = clamp((f - a0) / FLICK);
            const e = ease.inOut(t);
            x = lerp(BELT_X1, tgt.x - 75 + slot * 50, e);
            y = lerp(BELT_Y - 46, tgt.y - 10, e) - Math.sin(t * Math.PI) * (it.fancy ? 90 : 40);
            sc = lerp(1, 0.62, e);
          }
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 104,
                height: 104,
                transform: `translate(-50%, -50%) scale(${sc})`,
                borderRadius: '50%',
                background: it.fancy ? 'rgba(20,34,50,0.95)' : 'rgba(42,32,16,0.95)',
                border: `3px solid ${it.fancy ? 'rgba(142,210,255,0.7)' : 'rgba(255,181,71,0.7)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: prog(f, s0, 12),
              }}
            >
              <it.Icon size={62} c={it.fancy ? color.cool : color.warm} w={6} />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* 拉远之后：分拣的人自己也在一个筐里 */}
      {big > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <rect x={200} y={300} width={930} height={420} rx={28} fill="none" stroke={color.cool} strokeWidth={4} strokeDasharray={2 * (930 + 420)} strokeDashoffset={2 * (930 + 420) * (1 - big)} opacity={0.9} />
          <rect x={1170} y={300} width={600} height={420} rx={28} fill="rgba(255,181,71,0.04)" stroke={color.warm} strokeWidth={4} strokeDasharray={2 * (600 + 420)} strokeDashoffset={2 * (600 + 420) * (1 - big)} opacity={0.9} />
          {THEM.map((p, i) => (
            <Person key={i} x={p.x} y={p.y - 20} s={46} c={color.warm} o={big * 0.85} />
          ))}
          <text x={240} y={282} fontFamily={font.serif} fontWeight={900} fontSize={50} fill={color.cool} opacity={big}>
            「我们」
          </text>
          <text x={1210} y={282} fontFamily={font.serif} fontWeight={900} fontSize={50} fill={color.warm} opacity={big}>
            「他们」
          </text>
        </svg>
      ) : null}

      <Line text="社会学家布尔迪厄说过：" at={10} out={400} y={120} size={58} />
      <Line text="品味会给东西分类，也会给做分类的人分类。" at={60} out={400} y={930} size={58} chip="引述" source="皮埃尔·布尔迪厄《区分》，1979" />
      <Line text="说一个东西「土」，也是在说：我和他们不一样。" at={430} out={END - 14} y={930} size={58} kind="opinion" opinion />
    </AbsoluteFill>
  );
};
