import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {prog, rng} from '../kit/anim';
import {CanvasLayer, drawGlow} from '../kit/Canvas';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';
import {drawStores} from './L3a';

/** 反面 19：店越开越密，利润第一次掉头；我们看见的，多是活下来的 */

const R = rng(99);
const PRODUCTS = Array.from({length: 420}, (_, i) => ({
  x: 140 + R() * 1640,
  y: 150 + R() * 600,
  die: 330 + R() * 200,
  keep: i % 37 === 0,
}));

const Survivors: React.FC<{f: number}> = ({f}) => (
  <CanvasLayer
    draw={(ctx) => {
      const vis = prog(f, 300, 30);
      if (vis <= 0) return;
      const spot = prog(f, 470, 50);
      for (const p of PRODUCTS) {
        const dead = p.keep ? 0 : prog(f, p.die, 20);
        const a = vis * (1 - dead * 0.92);
        if (a <= 0.01) continue;
        if (p.keep && spot > 0) drawGlow(ctx, p.x, p.y, 70, '255,181,71', 0.45 * spot);
        ctx.fillStyle = p.keep ? `rgba(255,224,163,${a})` : `rgba(170,182,198,${a * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.keep ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (spot > 0) {
        // 聚光灯：只照着火起来的那几个
        for (const p of PRODUCTS) {
          if (!p.keep) continue;
          const g = ctx.createLinearGradient(0, 0, 0, p.y);
          g.addColorStop(0, 'rgba(255,224,163,0)');
          g.addColorStop(1, `rgba(255,224,163,${0.16 * spot})`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(p.x - 14, 0);
          ctx.lineTo(p.x + 14, 0);
          ctx.lineTo(p.x + 40, p.y);
          ctx.lineTo(p.x - 40, p.y);
          ctx.closePath();
          ctx.fill();
        }
      }
    }}
  />
);

const Profit: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 84, 24) * (1 - prog(f, 290, 24));
  if (vis <= 0) return null;
  const grow = prog(f, 90, 44, ease.out);
  const drop = prog(f, 136, 40, ease.inOut);
  const base = 600;
  const H = 300;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <rect x={1180} y={base - H * grow} width={150} height={H * grow} rx={6} fill="#5B6A80" />
      <rect x={1400} y={base - H * grow * (1 - 0.147 * drop)} width={150} height={H * grow * (1 - 0.147 * drop)} rx={6} fill={color.red} opacity={0.9} />
      <line x1={1170} y1={base - H * grow} x2={1560} y2={base - H * grow} stroke={color.ink} strokeDasharray="10 8" strokeWidth={2} opacity={0.6 * drop} />
      <line x1={1140} y1={base} x2={1590} y2={base} stroke={color.line} strokeWidth={3} />
      <text x={1255} y={base + 46} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={30} fill={color.dim}>2025 上半年</text>
      <text x={1475} y={base + 46} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={30} fill={color.dim}>2026 上半年</text>
      <text x={1576} y={base - H * (1 - 0.147) + 22} fontFamily={font.sans} fontWeight={700} fontSize={64} fill={color.red} opacity={drop}>
        −14.7%
      </text>
      <text x={1365} y={232} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={30} fill={color.dim} opacity={grow}>
        净利润（同比，示意比例）
      </text>
    </svg>
  );
};

export const L6: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('19');
  const fieldO = (1 - prog(f, 280, 30)) * prog(f, 0, 20);
  const pack = prog(f, 0, 120, ease.inOut);
  const shift = prog(f, 40, 50, ease.inOut);
  return (
    <AbsoluteFill>
      {fieldO > 0 ? (
        <AbsoluteFill style={{opacity: fieldO, transform: `translateX(${-330 * shift}px) scale(${1 - 0.4 * shift})`, transformOrigin: '960px 450px'}}>
          <CanvasLayer draw={(ctx) => drawStores(ctx, 1000, pack)} />
        </AbsoluteFill>
      ) : null}
      <Profit f={f} />
      <Survivors f={f} />
      <Line text="蜜雪集团 2026 年上半年净利润同比下降 *14.7%*" at={70} out={292} y={830} kind="data" size={52} hl={color.red} />
      <Line text="上市后首次半年度利润下滑" at={120} out={292} y={905} kind="data" size={44} color={color.ink} source="蜜雪集团 2026 年中期报告" />
      <Line text="下沉市场很大，但不是无限大；" at={316} out={END - 14} y={850} size={58} kind="opinion" opinion />
      <Line text="火起来的被看见了，失败的更多。" at={440} out={END - 14} y={935} size={58} kind="opinion" />
    </AbsoluteFill>
  );
};
