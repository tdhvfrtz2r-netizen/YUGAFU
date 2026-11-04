import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../kit/anim';
import {IconStar} from '../kit/Icons';
import {Lock} from '../kit/Lock';
import {Person} from '../kit/Person';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';
import {LockCount} from './L3a';

/** 第三层 13–14：锁②时间和情绪（一天只剩几道窄缝）；锁③知识门槛（一步 = 十步；进度条变楼梯） */

const LockIntro: React.FC<{f: number; label: string; icon: 'phone' | 'stairs'; bits: number[]; n: number}> = ({f, label, icon, bits, n}) => {
  const zoom = prog(f, 98, 44, ease.in);
  return (
    <>
      {f < 150 ? (
        <AbsoluteFill style={{transform: `scale(${1 + zoom * 2.2})`, transformOrigin: '1060px 500px', opacity: 1 - zoom}}>
          <Lock x={1160} y={520} scale={0.72} bits={bits} lockIn={-8} keyIn={2} click={80} label={label} icon={icon} />
        </AbsoluteFill>
      ) : null}
      <LockCount n={n} at={2} out={130} />
    </>
  );
};

// ---------- 锁②：一天的时间带 ----------
const H0 = 7;
const H1 = 24;
const RX0 = 200;
const RX1 = 1720;
const RY = 470;
const hx = (h: number) => RX0 + ((h - H0) / (H1 - H0)) * (RX1 - RX0);
const GAPS: [number, number, string][] = [
  [8 + 20 / 60, 8 + 50 / 60, '通勤'],
  [12 + 10 / 60, 12 + 40 / 60, '午休'],
  [18 + 20 / 60, 18 + 50 / 60, '通勤'],
  [22 + 40 / 60, 23 + 20 / 60, '睡前'],
];

const Day: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 118, 30) * (1 - prog(f, 410, 24));
  if (vis <= 0) return null;
  const zoom = prog(f, 238, 54, ease.inOut);
  const g0 = GAPS[2];
  const gc = hx((g0[0] + g0[1]) / 2);
  const k = lerp(1, 1000 / (hx(g0[1]) - hx(g0[0])), zoom);
  const tx = lerp(0, 960 - gc, zoom);
  // 电影长条想塞进午休的缝
  const mv = prog(f, 150, 30, ease.out);
  const dropT = clamp((f - 184) / 24);
  const bounce = Math.sin(clamp((f - 196) / 30) * Math.PI) * 60;
  const movieO = prog(f, 150, 20) * (1 - prog(f, 226, 16));
  const lunch = GAPS[1];
  const mx = (hx(lunch[0]) + hx(lunch[1])) / 2;
  const blocks: [number, number][] = [];
  let cur = H0;
  for (const [a, z] of GAPS) {
    blocks.push([cur, a]);
    cur = z;
  }
  blocks.push([cur, H1]);
  // 缝里一块块落下的短剧（每块约 2 分钟）
  const tiles = Array.from({length: 15}, (_, i) => i);
  const gapW = hx(g0[1]) - hx(g0[0]);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <g transform={`translate(${tx} 0) translate(${gc} ${RY}) scale(${k} 1) translate(${-gc} ${-RY})`}>
        {blocks.map(([a, z], i) => (
          <rect key={i} x={hx(a)} y={RY - 40} width={hx(z) - hx(a)} height={80} fill="#2B3342" />
        ))}
        {GAPS.map(([a, z], i) => (
          <rect key={'g' + i} x={hx(a)} y={RY - 40} width={hx(z) - hx(a)} height={80} fill="rgba(255,181,71,0.42)" />
        ))}
        {tiles.map((i) => {
          const p = prog(f, 296 + i * 4.5, 14, ease.out);
          if (p <= 0) return null;
          const x0 = hx(g0[0]) + (gapW / 15) * i;
          return <rect key={'t' + i} x={x0 + gapW / 150} y={RY - 36 - (1 - p) * 120} width={(gapW / 15) * 0.86} height={72} rx={0.6} fill={color.pink} opacity={p} />;
        })}
      </g>
      {/* 缝里每块短剧上的情绪尖峰：放大以后才画 */}
      {zoom > 0.98
        ? tiles.map((i) => {
            const p = prog(f, 302 + i * 4.5, 14);
            if (p <= 0) return null;
            const x0 = 460 + (1000 / 15) * i + 6;
            const w = (1000 / 15) * 0.86 - 4;
            return (
              <path
                key={'s' + i}
                d={`M${x0} ${RY + 24} L${x0 + w * 0.22} ${RY + 20} L${x0 + w * 0.32} ${RY - 26} L${x0 + w * 0.44} ${RY + 14} L${x0 + w} ${RY + 18}`}
                stroke="#FFE3EE"
                strokeWidth={3}
                fill="none"
                opacity={p}
              />
            );
          })
        : null}
      {zoom < 0.05
        ? GAPS.map(([a, z, t], i) => (
            <text key={'l' + i} x={(hx(a) + hx(z)) / 2} y={RY + 86} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={30} fill={color.warm}>
              {t}
            </text>
          ))
        : null}
      {zoom < 0.05 ? (
        <>
          <text x={RX0} y={RY - 64} fontFamily={font.sans} fontSize={28} fill={color.dim}>7:00</text>
          <text x={RX1} y={RY - 64} textAnchor="end" fontFamily={font.sans} fontSize={28} fill={color.dim}>24:00</text>
          <text x={hx(13.5)} y={RY + 10} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={30} fill={color.dim} opacity={0.8}>上班</text>
        </>
      ) : (
        <text x={960} y={RY + 100} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={32} fill={color.warm} opacity={zoom}>
          通勤路上的 30 分钟
        </text>
      )}
      {movieO > 0 ? (
        <g transform={`translate(${mx} ${lerp(RY - 220, RY - 110, mv) + dropT * 30 - bounce})`} opacity={movieO}>
          <rect x={-(hx(9) - hx(7)) / 2} y={-34} width={hx(9) - hx(7)} height={68} rx={6} fill="rgba(255,181,71,0.12)" stroke={color.warm} strokeWidth={3} />
          <text x={0} y={12} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={30} fill={color.warm}>
            电影 · 2 小时
          </text>
        </g>
      ) : null}
    </svg>
  );
};

const Chart: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 418, 24);
  if (vis <= 0) return null;
  const grow = prog(f, 430, 60, ease.out);
  const base = 720;
  const hBar = 400;
  const line = base - hBar * 0.84;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <line x1={560} y1={base} x2={1360} y2={base} stroke={color.line} strokeWidth={3} />
      <rect x={880} y={base - hBar * grow} width={160} height={hBar * grow} rx={6} fill={color.pink} />
      <line x1={600} y1={line} x2={1320} y2={line} stroke={color.ink} strokeWidth={3} strokeDasharray="12 10" opacity={prog(f, 438, 20)} />
      <text x={860} y={line - 18} textAnchor="end" fontFamily={font.sans} fontWeight={500} fontSize={32} fill={color.ink} opacity={prog(f, 438, 20)}>
        2024 年全年电影票房（示意）
      </text>
      <text x={960} y={base - hBar * grow - 24} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={48} fill={color.data} opacity={grow}>
        505 亿元
      </text>
    </svg>
  );
};

// ---------- 锁③：一步 = 十步；进度条变成不缺台阶的楼梯 ----------
const Steps: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 128, 30) * (1 - prog(f, 280, 22));
  if (vis <= 0) return null;
  const reveal = (i: number) => prog(f, 176 + i * 5, 16, ease.out);
  const topY = 400;
  const botY = 720;
  const wallX = 900;
  const stepW = 34;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <rect x={420} y={topY} width={wallX - 420} height={botY - topY} fill="#232B39" />
      <line x1={420} y1={topY} x2={wallX} y2={topY} stroke={color.cool} strokeWidth={3} opacity={0.6} />
      <line x1={wallX} y1={botY} x2={1560} y2={botY} stroke={color.line} strokeWidth={3} />
      {Array.from({length: 10}).map((_, i) => {
        const p = reveal(i);
        const y = topY + ((botY - topY) / 10) * i;
        return <rect key={i} x={wallX} y={y} width={stepW * (10 - i) * p} height={(botY - topY) / 10 + 1} fill="#3A4558" opacity={p} />;
      })}
      <Person x={720} y={topY} s={130} c={color.cool} />
      <Person x={1380} y={botY} s={130} c={color.warm} />
      <text x={720} y={topY - 160} textAnchor="middle" fontFamily={font.serif} fontWeight={600} fontSize={46} fill={color.cool}>
        懂的人：一步
      </text>
      <text x={1380} y={botY - 160} textAnchor="middle" fontFamily={font.serif} fontWeight={600} fontSize={46} fill={color.warm} opacity={prog(f, 220, 20)}>
        不会的人：十步
      </text>
    </svg>
  );
};

const Stairs: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 280, 24) * (1 - prog(f, 698, 20));
  if (vis <= 0) return null;
  const rise = (i: number) => prog(f, 318 + i * 6, 22, ease.out);
  const x0 = 260;
  const w = 64;
  const baseY = 780;
  const h = 44;
  const climb = prog(f, 398, 150, ease.inOut);
  const stepAt = Math.min(9, Math.floor(climb * 10));
  const gx0 = 1080;
  const gaps = [3, 4, 7];
  const stuck = Math.min(2, Math.floor(prog(f, 398, 60) * 3));
  const booksIn = prog(f, 488, 30, ease.out);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      {/* 开场那根 50 分钟的进度条，刻度一格格升起 */}
      <line x1={x0} y1={baseY} x2={x0 + w * 10} y2={baseY} stroke={color.cool} strokeWidth={4} />
      {Array.from({length: 10}).map((_, i) => {
        const p = rise(i);
        const top = baseY - (i + 1) * h * p;
        return <rect key={i} x={x0 + i * w} y={top} width={w + 0.5} height={baseY - top} fill="#2E4258" stroke={color.cool} strokeOpacity={0.35 * p} />;
      })}
      {Array.from({length: 11}).map((_, i) => (
        <line key={'t' + i} x1={x0 + i * w} y1={baseY + 6} x2={x0 + i * w} y2={baseY + 18} stroke={color.dim} strokeWidth={2} />
      ))}
      <text x={x0 + w * 5} y={baseY + 64} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={36} fill={color.cool}>
        50 分钟 · 一步不跳
      </text>
      <Person x={x0 + stepAt * w + w / 2} y={baseY - (stepAt + 1) * h * rise(stepAt)} s={80} c={color.warm} o={prog(f, 378, 20)} />
      {/* 精华版：缺了好几级 */}
      {Array.from({length: 10}).map((_, i) =>
        gaps.includes(i) ? null : (
          <rect key={'g' + i} x={gx0 + i * w} y={baseY - (i + 1) * h * rise(i)} width={w + 0.5} height={(i + 1) * h * rise(i)} fill="#2A2F3A" stroke={color.dim} strokeOpacity={0.3} />
        ),
      )}
      <text x={gx0 + w * 5} y={baseY + 64} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={36} fill={color.dim}>
        精华版
      </text>
      <Person x={gx0 + stuck * w + w / 2} y={baseY - (stuck + 1) * h * rise(stuck)} s={80} c={color.warm} o={prog(f, 378, 20) * 0.9} />
      <text x={gx0 + 3 * w + w / 2} y={baseY - 4 * h - 30} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={44} fill={color.dim} opacity={prog(f, 458, 16)}>
        ?
      </text>
      {/* 开场那排"收藏"的书，立在楼梯脚下 */}
      <g opacity={booksIn} transform={`translate(${x0 - 150} ${baseY - 100 - (1 - booksIn) * 160})`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 20} y={(i % 2) * 8} width={16} height={100 - (i % 2) * 8} rx={2} fill={[color.warm, '#E9C98F', color.warmDeep, '#F0B967', '#B9A27A'][i]} />
        ))}
        <g transform="translate(18 -64)">
          <IconStar size={56} c={color.warm} w={7} fill="rgba(255,181,71,0.3)" />
        </g>
      </g>
    </svg>
  );
};

export const L3b: React.FC = () => {
  const f = useCurrentFrame();
  const S14 = len('13');
  const END = S14 + len('14');
  const g = f - S14;
  return (
    <AbsoluteFill>
      {f < S14 ? (
        <>
          <LockIntro f={f} label="时间和情绪" icon="phone" bits={[0.6, 0.2, 0.95, 0.4, 0.1]} n={2} />
          <Day f={f} />
          <Chart f={f} />
        </>
      ) : null}
      <Line text="累了一天，只剩碎片时间。" at={84} out={232} y={850} size={58} kind="opinion" opinion />
      <Line text="短剧把爽点压进一两分钟。" at={270} out={420} y={850} size={58} kind="opinion" />
      <Line
        text="2024 年微短剧市场规模 *505 亿元*，首次超过全年电影票房"
        at={430}
        out={S14 - 14}
        y={860}
        kind="data"
        size={50}
        hl={color.pink}
        source="《2024年中国微短剧产业研究报告》"
      />
      {g >= 0 ? (
        <>
          <LockIntro f={g} label="知识门槛" icon="stairs" bits={[0.15, 0.75, 0.35, 0.9, 0.5]} n={3} />
          <Steps f={g} />
          <Stairs f={g} />
        </>
      ) : null}
      <Line text="你眼里的一步，是别人眼里的十步。" at={S14 + 84} out={S14 + 270} y={900} size={58} kind="opinion" opinion />
      <Line text="不会的人要的不是精华，是不跳步。" at={S14 + 290} out={S14 + 476} y={930} size={58} kind="opinion" />
      <Line text="长教程、「全几百集」的课，卖的是确定性。" at={S14 + 488} out={END - 14} y={930} size={58} kind="opinion" />
    </AbsoluteFill>
  );
};
