import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../kit/anim';
import {CanvasLayer} from '../kit/Canvas';
import {Lock} from '../kit/Lock';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {b, color, ease, font} from '../theme';

/** 第三层 11–12：主比喻登场（钥匙和锁）；锁①：钱 → 6.4 万个光点 */

export const LockCount: React.FC<{n: number; at: number; out: number; y?: number}> = ({n, at, out, y = 190}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 20) * (1 - prog(f, out, 16));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 960, top: y, transform: 'translate(-50%, -50%)', opacity: o, display: 'flex', gap: 18, alignItems: 'center'}}>
      {[1, 2, 3, 4].map((k) => (
        <div
          key={k}
          style={{
            width: k === n ? 46 : 14,
            height: 14,
            borderRadius: 7,
            background: k < n ? color.dim : k === n ? color.warm : color.faint,
          }}
        />
      ))}
      <div style={{fontFamily: font.sans, fontWeight: 500, fontSize: 30, color: color.dim, marginLeft: 10, letterSpacing: '0.1em'}}>第 {n} 把锁</div>
    </div>
  );
};

const COLS = 400;
const ROWS = 160;
const N = COLS * ROWS; // 64,000：一点一店
const WARM_N = 35000;
const GX = 280;
const GY = 214;
const SP = 3.4;

const hash = (k: number) => {
  let h = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export const drawStores = (ctx: CanvasRenderingContext2D, f: number, pack = 0) => {
  // 从中心往外一圈圈"开灯"
  const split = ease.inOut(clamp((f - 330) / 60));
  const cx = GX + (COLS * SP) / 2;
  const cy = GY + (ROWS * SP) / 2;
  const maxD = Math.hypot((COLS * SP) / 2, (ROWS * SP) / 2);
  const wb = (WARM_N / ROWS) * SP;
  if (split > 0) {
    const g = ctx.createRadialGradient(GX - 36 + wb / 2, cy, 0, GX - 36 + wb / 2, cy, wb * 0.9);
    g.addColorStop(0, `rgba(255,181,71,${0.22 * split})`);
    g.addColorStop(1, 'rgba(255,181,71,0)');
    ctx.fillStyle = g;
    ctx.fillRect(GX - 400, GY - 300, wb + 800, ROWS * SP + 600);
  }
  for (let k = 0; k < N; k++) {
    const col = Math.floor(k / ROWS);
    const row = k % ROWS;
    const sp = SP * (1 - 0.18 * pack);
    const x0 = 960 + (col - COLS / 2) * sp * (1 + 0.0 * pack);
    const y = GY + (ROWS * SP) / 2 + (row - ROWS / 2) * sp;
    const d = Math.hypot(x0 - cx, y - cy) / maxD;
    const p = clamp((f - 150 - d * 70) / 18);
    if (p <= 0) continue;
    const warm = k < WARM_N;
    const x = x0 + (warm ? -36 * split : 36 * split) * (1 - pack);
    const h = hash(k);
    const tw = 0.55 + 0.45 * h;
    const a = p * tw;
    if (warm && split > 0) {
      ctx.fillStyle = `rgba(255,${Math.round(lerp(222, 186, split))},${Math.round(lerp(230, 90, split))},${a * lerp(0.8, 1, split)})`;
    } else {
      ctx.fillStyle = `rgba(214,224,236,${a * (warm ? 0.8 : lerp(0.8, 0.5, split))})`;
    }
    const sz = 1.4 + 1.2 * p * (0.6 + 0.4 * h);
    ctx.fillRect(x, y, sz, sz);
  }
};

export const L3a: React.FC = () => {
  const f = useCurrentFrame();
  const S12 = len('11');
  const END = S12 + len('12');
  const g = f - S12;
  const introO = 1 - prog(f, S12 - 16, 16);
  const lockZoom = prog(g, 116, 44, ease.in);
  const fieldO = prog(g, 140, 30) * (1 - prog(g, len('12') - 16, 16));
  return (
    <AbsoluteFill>
      {/* 11：单看钥匙，形状很怪 → 锁浮现 → 咔 */}
      {f < S12 ? (
        <Lock x={1290} y={500} scale={0.9} bits={[0.85, 0.1, 0.65, 0.25, 0.95]} lockIn={b(3.2)} keyIn={b(4.3)} click={b(7)} opacity={introO} />
      ) : null}
      <Line text="单看钥匙，形状很怪。" at={16} out={b(4.2)} y={900} size={62} />
      <Line text="每一种「土」，都对着一个真实的约束。" at={b(7.6)} out={S12 - 14} y={900} size={60} kind="opinion" opinion />

      {/* 12：锁①：钱 */}
      {g >= 0 && g < 170 ? (
        <AbsoluteFill style={{transform: `scale(${1 + lockZoom * 2.2})`, transformOrigin: '1060px 500px', opacity: 1 - lockZoom}}>
          <Lock x={1160} y={520} scale={0.72} bits={[0.3, 0.9, 0.5, 0.15, 0.7]} lockIn={S12 - 6} keyIn={S12 + 4} click={S12 + b(2.5)} label="钱" icon="cup" />
        </AbsoluteFill>
      ) : null}
      {g >= 0 ? <LockCount n={1} at={S12 + 4} out={S12 + 140} /> : null}
      <Line text="几块钱一杯，不是品味低，是预算真实。" at={S12 + 96} out={S12 + 236} y={900} size={58} kind="opinion" opinion />
      {g >= 140 ? (
        <AbsoluteFill style={{opacity: fieldO}}>
          <CanvasLayer draw={(ctx) => drawStores(ctx, g)} />
          <div style={{position: 'absolute', left: 960, top: 150, transform: 'translate(-50%, -50%)', fontFamily: font.sans, fontWeight: 500, fontSize: 34, color: color.dim, opacity: prog(g, 210, 24), whiteSpace: 'nowrap'}}>
            <span style={{display: 'inline-block', width: 12, height: 12, background: '#D6DEE8', marginRight: 14, verticalAlign: 'middle'}} />1 个光点 = 1 家店
          </div>
          <div
            style={{
              position: 'absolute',
              left: GX - 36 + (WARM_N / ROWS) * SP * 0.5,
              top: GY + (ROWS * SP) / 2,
              transform: 'translate(-50%, -50%)',
              fontFamily: font.sans,
              fontWeight: 700,
              fontSize: 64,
              color: '#1A1206',
              background: 'rgba(255,214,150,0.92)',
              padding: '6px 22px',
              borderRadius: 10,
              opacity: prog(g, 400, 24),
              whiteSpace: 'nowrap',
            }}
          >
            约 3.5 万家
          </div>
        </AbsoluteFill>
      ) : null}
      <Line text="蜜雪集团：全球约 *6.4 万*家门店" at={S12 + 240} out={END - 14} y={800} kind="data" size={54} hl={color.warmHi} />
      <Line
        text="三线及以下城市约 *3.5 万*家，占中国内地门店的 *58%*"
        at={S12 + 380}
        out={END - 14}
        y={880}
        kind="data"
        size={50}
        hl={color.warm}
        source="蜜雪集团 2026 年中期报告（截至 2026 年 6 月 30 日）"
      />
    </AbsoluteFill>
  );
};
