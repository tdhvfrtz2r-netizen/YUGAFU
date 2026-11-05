import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {lerp, prog, rng, TAU} from '../kit/anim';
import {Person} from '../kit/Person';
import {Cue} from '../kit/Sound';
import {Glow} from '../kit/Stage';
import {Line} from '../kit/Text';
import {len, rel} from '../timeline';
import {color, ease, font} from '../theme';

/**
 * 06–07 先说「土」这个字：我们说一个东西土，常常是在说它便宜、直白、用力、粗糙、满大街都是。
 * 这些词飞出去，围成一圈光罩：罩里是"我们"，罩外是大多数人。「土」也在说：这不是给我们做的。
 */

const WORDS = [
  {t: '便宜', x: 640, y: 330},
  {t: '直白', x: 1280, y: 330},
  {t: '用力', x: 560, y: 600},
  {t: '粗糙', x: 1360, y: 600},
  {t: '满大街都是', x: 960, y: 800},
];

// 光罩：词语围成的一圈
const BX = 720;
const BY = 520;
const BR = 255;
const ANG = [-135, -45, 180, 0, 90].map((d) => (d * Math.PI) / 180);

const R = rng(606);
const INSIDE = Array.from({length: 12}, (_, i) => ({
  x: BX - 115 + (i % 6) * 46 + (Math.floor(i / 6) ? 23 : 0),
  y: BY + 25 + Math.floor(i / 6) * 68,
}));
const OUTSIDE: {x: number; y: number; s: number; d: number}[] = [];
while (OUTSIDE.length < 120) {
  const x = 70 + R() * 1780;
  const y = 250 + R() * 560;
  if (Math.hypot(x - BX, y - BY) < BR + 60) continue;
  OUTSIDE.push({x, y, s: 36 + R() * 22, d: R()});
}
OUTSIDE.sort((a, b) => a.y - b.y);

export const Define: React.FC = () => {
  const f = useCurrentFrame();
  const W0 = rel('word', 'wall');
  const END = W0 + len('wall');
  const w = f - W0;

  const tuIn = prog(f, 14, 26, ease.out);
  const toWall = prog(w, 0, 60, ease.inOut);
  const ring = prog(w, 40, 50, ease.inOut);
  const crowd = prog(w, 60, 60);
  const zoom = prog(w, len('wall') - 90, 90, ease.in);
  const wordAt = (k: number) => 214 + k * 36;

  return (
    <AbsoluteFill>
      <Cue s="impact" at={14} gain={0.55} />
      {WORDS.map((_, k) => (
        <Cue key={k} s="pop" at={wordAt(k)} gain={0.8} pan={(WORDS[k].x - 960) / 960} />
      ))}
      <Cue s="whoosh" at={W0} dur={1} gain={0.7} />
      <Cue s="glass" at={W0 + 70} />
      <Cue s="swell" at={W0 + 60} dur={2.5} gain={0.6} />
      <Cue s="whoosh" at={END - 90} dur={1.4} gain={0.8} />

      <AbsoluteFill style={{transform: `scale(${1 + zoom * 2.4})`, transformOrigin: `${BX}px ${BY + 60}px`, opacity: 1 - prog(w, len('wall') - 30, 30)}}>
        {/* 罩外的大多数人 */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {OUTSIDE.map((p, i) => (
            <Person key={i} x={p.x} y={p.y} s={p.s} c={color.warm} o={crowd * (0.45 + 0.4 * p.d) * prog(w, 60 + p.d * 50, 30)} />
          ))}
        </svg>

        {/* 光罩 */}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <defs>
            <radialGradient id="defBubble" cx="0.5" cy="0.55" r="0.6">
              <stop offset="0" stopColor={color.cool} stopOpacity={0.16} />
              <stop offset="1" stopColor={color.cool} stopOpacity={0.03} />
            </radialGradient>
          </defs>
          <circle cx={BX} cy={BY} r={BR} fill="url(#defBubble)" opacity={ring} />
          <circle
            cx={BX}
            cy={BY}
            r={BR}
            fill="none"
            stroke="rgba(190,232,255,0.55)"
            strokeWidth={3}
            strokeDasharray={TAU * BR}
            strokeDashoffset={TAU * BR * (1 - ring)}
            transform={`rotate(-150 ${BX} ${BY})`}
          />
          {INSIDE.map((p, i) => (
            <Person key={i} x={p.x} y={p.y} s={58} c="#9AD3F5" o={ring} />
          ))}
        </svg>

        {/* 大「土」字：先占满注意力，词语飞走后退成一个小字 */}
        <div
          style={{
            position: 'absolute',
            left: lerp(960, 1290, toWall),
            top: lerp(500, 300, toWall),
            transform: `translate(-50%, -50%) scale(${lerp(1.25, 1, tuIn) * lerp(1, 0.32, toWall)})`,
            fontFamily: font.serif,
            fontWeight: 900,
            fontSize: 300,
            lineHeight: 1,
            color: color.warm,
            opacity: tuIn * (1 - toWall),
            filter: tuIn < 1 ? `blur(${(1 - tuIn) * 12}px)` : undefined,
            textShadow: '0 0 60px rgba(255,181,71,0.45)',
          }}
        >
          土
        </div>
        <Glow x={960} y={500} r={420} c={color.warmDeep} a={0.12 * tuIn * (1 - toWall)} />

        {/* 五个词：先围着「土」，再飞去围成光罩 */}
        {WORDS.map((d, k) => {
          const p = prog(f, wordAt(k), 22, ease.back);
          if (p <= 0) return null;
          const a = ANG[k];
          const tx = BX + Math.cos(a) * BR;
          const ty = BY + Math.sin(a) * BR;
          const x = lerp(d.x, tx, toWall);
          const y = lerp(d.y, ty, toWall) + Math.sin(f / 30 + k) * 4 * (1 - toWall);
          return (
            <div
              key={d.t}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, p) * lerp(1, 0.82, toWall)})`,
                opacity: Math.min(1, p),
                fontFamily: font.sans,
                fontWeight: 500,
                fontSize: 54,
                color: color.ink,
                padding: '8px 26px',
                borderRadius: 999,
                border: `2px solid ${toWall > 0.5 ? 'rgba(190,232,255,0.6)' : 'rgba(238,231,218,0.22)'}`,
                background: toWall > 0.5 ? 'rgba(20,34,50,0.92)' : 'rgba(255,255,255,0.04)',
                whiteSpace: 'nowrap',
              }}
            >
              {d.t}
            </div>
          );
        })}
      </AbsoluteFill>

      <Line text="先说说「土」这个字。" at={8} out={150} y={150} size={62} />
      <Line text="我们说一个东西土，常常是在说它：" at={164} out={W0 + 30} y={150} size={60} />
      <Line text="「土」说的常常不只是东西，" at={W0 + 70} out={W0 + 470} y={880} size={56} kind="opinion" opinion />
      <Line text="还有一句没说出口的话：这不是给「我们」做的。" at={W0 + 160} out={W0 + 470} y={962} size={56} kind="opinion" />
      <Line text="那，「我们」是谁？" at={W0 + 486} out={END - 16} y={150} size={66} color={color.warmHi} />
    </AbsoluteFill>
  );
};
