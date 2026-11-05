import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../kit/anim';
import {IconCup, IconPhone, IconWave} from '../kit/Icons';
import {Cue} from '../kit/Sound';
import {Line} from '../kit/Text';
import {len, rel} from '../timeline';
import {b, color, ease, font} from '../theme';

/**
 * 开场 01–04：一个小测试。三样东西 → 盖上"土" → 翻过来看另一面（数据）→ 我的第一反应，错在哪？
 * 三样东西都是谁都见过的日常，不需要懂任何背景。
 */

const CW = 440;
const CH = 470;
const CY = 560;

type Card = {x: number; Icon: React.FC<{size?: number; c?: string; w?: number}>; front: string; label: string; big: string; num?: number; unit?: string; sub: string; source: string | null};

const CARDS: Card[] = [
  {x: 450, Icon: IconCup, front: '几块钱一杯的奶茶', label: '蜜雪集团', big: '6.4', num: 6.4, unit: '万', sub: '全球门店（约）', source: '蜜雪集团 2026 年中期报告'},
  {x: 960, Icon: IconPhone, front: '一两分钟一集的短剧', label: '微短剧', big: '6.96', num: 6.96, unit: '亿', sub: '用户（截至 2025 年 6 月）', source: 'DataEye 研究院'},
  {x: 1470, Icon: IconWave, front: '被乐坛看不上的歌', label: '刀郎', big: '被网友「封神」', sub: '多年后，因为《罗刹海市》', source: null},
];

const faceBase: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 22,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

export const Quiz: React.FC = () => {
  const f = useCurrentFrame();
  const S_STAMP = rel('quiz', 'stamp');
  const S_REVEAL = rel('quiz', 'reveal');
  const S_WRONG = rel('quiz', 'wrong');
  const END = S_WRONG + len('wrong');
  const appearAt = (i: number) => b(1 + i);
  const stampAt = (i: number) => S_STAMP + b(i);
  const flipAt = (i: number) => S_REVEAL + 40 + i * 150;
  const leave = prog(f, S_WRONG, 30, ease.inOut);

  // 盖章时整排卡片轻轻一震
  let shake = 0;
  for (let i = 0; i < 3; i++) {
    const t = f - (stampAt(i) + 8);
    if (t >= 0 && t < 14) shake += Math.sin(t * 2.4) * 5 * (1 - t / 14);
  }

  return (
    <AbsoluteFill>
      <Cue s="tick" at={6} gain={0.6} />
      {CARDS.map((_, i) => (
        <React.Fragment key={i}>
          <Cue s="pop" at={appearAt(i)} pan={(i - 1) * 0.5} />
          <Cue s="stamp" at={stampAt(i) + 8} pan={(i - 1) * 0.5} />
          <Cue s="flip" at={flipAt(i)} pan={(i - 1) * 0.5} />
          <Cue s="chime" at={flipAt(i) + 12} gain={0.7} pan={(i - 1) * 0.4} />
          {i < 2 ? <Cue s="roll" at={flipAt(i) + 12} dur={0.5} gain={0.6} pan={(i - 1) * 0.4} /> : null}
        </React.Fragment>
      ))}
      <Cue s="whoosh" at={S_WRONG} dur={0.6} gain={0.7} />
      <Cue s="riser" at={S_WRONG + 70} dur={2.4} gain={0.7} />

      <AbsoluteFill style={{transform: `translateY(${shake}px)`}}>
        {CARDS.map((c, i) => {
          const ap = prog(f, appearAt(i), 22, ease.back);
          if (ap <= 0) return null;
          const fl = prog(f, flipAt(i), 24, ease.inOut);
          const sx = Math.abs(Math.cos(fl * Math.PI));
          const back = fl > 0.5;
          const st = prog(f, stampAt(i), 8, ease.in);
          const stScale = lerp(2.4, 1, st) * (1 + 0.06 * Math.sin(clamp((f - stampAt(i) - 8) / 10) * Math.PI));
          const roll = prog(f, flipAt(i) + 12, 30, ease.out);
          const x = lerp(c.x, 960 + (c.x - 960) * 0.35, leave);
          const y = lerp(CY + (1 - ap) * 60, CY - 40, leave);
          const sc = lerp(1, 0.55, leave);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - CW / 2,
                top: y - CH / 2,
                width: CW,
                height: CH,
                opacity: Math.min(1, ap * 1.4) * (1 - leave),
                transform: `scale(${sc * (0.9 + 0.1 * ap)}) scaleX(${Math.max(0.02, sx)})`,
              }}
            >
              {!back ? (
                <div style={{...faceBase, background: 'linear-gradient(180deg, #1A2333 0%, #10151F 100%)', border: '2px solid rgba(238,231,218,0.14)'}}>
                  <div style={{marginTop: -40}}>
                    <c.Icon size={170} c={color.warm} w={5} />
                  </div>
                  <div style={{fontFamily: font.sans, fontWeight: 500, fontSize: 38, color: color.ink, marginTop: 44, whiteSpace: 'nowrap'}}>{c.front}</div>
                  {/* 盖章："土"。冷蓝色 = "我们"下的判断 */}
                  {st > 0 ? (
                    <div
                      style={{
                        position: 'absolute',
                        right: 26,
                        top: 26,
                        width: 128,
                        height: 128,
                        border: `7px solid ${color.cool}`,
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: font.serif,
                        fontWeight: 900,
                        fontSize: 92,
                        lineHeight: 1,
                        color: color.cool,
                        background: 'rgba(10,13,19,0.55)',
                        opacity: 0.95 * st,
                        transform: `rotate(-12deg) scale(${stScale})`,
                        boxShadow: `0 0 ${24 * st}px rgba(142,210,255,0.35)`,
                      }}
                    >
                      土
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{...faceBase, background: 'linear-gradient(180deg, #2C2314 0%, #16110A 100%)', border: '2px solid rgba(255,181,71,0.4)', boxShadow: '0 0 60px rgba(255,181,71,0.18)'}}>
                  <div style={{fontFamily: font.sans, fontWeight: 600, fontSize: 32, color: color.warmHi, opacity: 0.85, marginBottom: 18}}>{c.label}</div>
                  {c.num !== undefined ? (
                    <div style={{fontFamily: font.sans, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: color.warmHi, whiteSpace: 'nowrap'}}>
                      <span style={{fontVariantNumeric: 'tabular-nums'}}>{(c.num * roll).toFixed(c.big.split('.')[1]?.length ?? 0)}</span>
                      <span style={{fontSize: 56, marginLeft: 10, color: color.ink}}>{c.unit}</span>
                    </div>
                  ) : (
                    <div style={{fontFamily: font.serif, fontWeight: 900, fontSize: 60, lineHeight: 1.2, color: color.warmHi, whiteSpace: 'nowrap', opacity: roll}}>{c.big}</div>
                  )}
                  <div style={{fontFamily: font.sans, fontWeight: 500, fontSize: 31, color: color.ink, opacity: 0.88, marginTop: 16, whiteSpace: 'nowrap'}}>{c.sub}</div>
                  {c.source ? (
                    <div style={{position: 'absolute', bottom: 30, left: 10, right: 10, fontFamily: font.sans, fontWeight: 500, fontSize: 22, color: color.dim, whiteSpace: 'nowrap', opacity: prog(f, flipAt(i) + 30, 24)}}>
                      来源：{c.source}
                    </div>
                  ) : (
                    <div style={{position: 'absolute', bottom: 30, left: 10, right: 10, fontFamily: font.sans, fontWeight: 500, fontSize: 24, color: color.dim, whiteSpace: 'nowrap', opacity: prog(f, flipAt(i) + 30, 24)}}>
                      2004 年出道时，被乐坛看不上
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </AbsoluteFill>

      <Line text="第一反应：土，还是不土？" at={6} out={S_REVEAL - 14} y={150} size={66} />
      <Line text="说实话，我的第一反应也是。" at={S_STAMP + b(3.4)} out={S_REVEAL - 10} y={930} size={56} />
      <Line text="再看看它们的另一面：" at={S_REVEAL + 6} out={S_WRONG - 12} y={150} size={60} />
      <Line text="我的第一反应，错在哪？" at={S_WRONG + 12} out={END - 14} y={540} size={84} color={color.warmHi} />
    </AbsoluteFill>
  );
};
