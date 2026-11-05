import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../kit/anim';
import {IconCup, IconPhone, IconStairs, IconWave} from '../kit/Icons';
import {Cue} from '../kit/Sound';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/**
 * 25 爬上来以后：同一样东西，人们换了个词——不说「土」，说「接地气」。（观点）
 * 四个代表"土"的东西挂着冷色的"土"字牌，升进上方的光罩；一穿过光罩，牌子翻成暖色的"接地气"。
 * 呼应"先说「土」"那一段：变的不是东西，是我们和它的距离。
 */

const DOME = {x: 960, y: 490, w: 980, h: 310};
const ITEMS = [
  {Icon: IconCup, x: 600},
  {Icon: IconPhone, x: 840},
  {Icon: IconWave, x: 1080},
  {Icon: IconStairs, x: 1320},
];
const riseAt = (i: number) => 40 + i * 22;
const RISE = 90;
const Y0 = 760;
const Y1 = 345;

export const Relabel: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('relabel');
  const vis = prog(f, 0, 24) * (1 - prog(f, END - 20, 20));
  const dome = prog(f, 8, 40, ease.out);
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Cue s="glass" at={12} gain={0.4} />
      <Cue s="rise" at={40} dur={2.2} gain={0.55} />
      {ITEMS.map((_, i) => (
        <Cue key={i} s="peel" at={riseAt(i) + Math.round(RISE * 0.62)} gain={0.6} pan={(ITEMS[i].x - 960) / 960} />
      ))}
      <Cue s="chime" at={176} gain={0.4} />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="relDome" cx="0.5" cy="1" r="0.9">
            <stop offset="0" stopColor={color.warm} stopOpacity={0.12} />
            <stop offset="1" stopColor={color.warm} stopOpacity={0.02} />
          </radialGradient>
        </defs>
        <path
          d={`M${DOME.x - DOME.w / 2} ${DOME.y} A${DOME.w / 2} ${DOME.h} 0 0 1 ${DOME.x + DOME.w / 2} ${DOME.y} Z`}
          fill="url(#relDome)"
          stroke="rgba(255,224,163,0.45)"
          strokeWidth={3}
          opacity={dome}
        />
      </svg>
      {ITEMS.map((it, i) => {
        const t = prog(f, riseAt(i), RISE, ease.inOut);
        const y = lerp(Y0, Y1, t);
        const inside = y < DOME.y - 20;
        const fl = prog(f, riseAt(i) + Math.round(RISE * 0.62) - 8, 16, ease.inOut);
        const sx = Math.abs(Math.cos(fl * Math.PI));
        const back = fl > 0.5;
        const sway = Math.sin(f / 14 + i) * 4 * (1 - t);
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: it.x,
                top: y,
                width: 124,
                height: 124,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: inside ? 'rgba(48,36,16,0.95)' : 'rgba(26,32,44,0.95)',
                border: `3px solid ${inside ? 'rgba(255,181,71,0.75)' : 'rgba(238,231,218,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: prog(f, 4 + i * 6, 16),
              }}
            >
              <it.Icon size={76} c={inside ? color.warm : '#B8C2CF'} w={6} />
            </div>
            <div style={{position: 'absolute', left: it.x + sway, top: y + 62, width: 2, height: 36, background: 'rgba(238,231,218,0.35)', opacity: prog(f, 4 + i * 6, 16)}} />
            <div
              style={{
                position: 'absolute',
                left: it.x + sway,
                top: y + 98,
                transform: `translate(-50%, 0) scaleX(${Math.max(0.03, sx)})`,
                fontFamily: back ? font.sans : font.serif,
                fontWeight: back ? 700 : 900,
                fontSize: back ? 30 : 36,
                color: back ? '#1A1206' : color.ink,
                background: back ? color.warmHi : '#3A4558',
                padding: back ? '8px 16px' : '4px 22px',
                borderRadius: 8,
                whiteSpace: 'nowrap',
                opacity: prog(f, 4 + i * 6, 16),
              }}
            >
              {back ? '接地气' : '土'}
            </div>
          </React.Fragment>
        );
      })}
      <Line text="等它爬上来，人们会换个词：" at={10} out={470} y={110} size={58} kind="opinion" opinion />
      <Line text="不说「土」，说「接地气」。" at={176} out={470} y={640} size={72} color={color.warmHi} />
      <Line text="东西没怎么变，变的是我们离它的距离。" at={290} out={END - 14} y={930} size={58} kind="opinion" />
    </AbsoluteFill>
  );
};
