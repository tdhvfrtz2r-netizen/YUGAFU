import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../kit/anim';
import {CanvasLayer} from '../kit/Canvas';
import {Lock} from '../kit/Lock';
import {Cue} from '../kit/Sound';
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

let IMG: ImageData | null = null;

/** 6.4 万个光点直接写进像素缓冲，再一次性贴到画布上 */
export const drawStores = (ctx: CanvasRenderingContext2D, f: number, pack = 0) => {
  const W = 1920;
  const H = 1080;
  const split = ease.inOut(clamp((f - 330) / 60));
  const cx = 960;
  const cy = GY + (ROWS * SP) / 2;
  const maxD = Math.hypot((COLS * SP) / 2, (ROWS * SP) / 2);
  if (!IMG) IMG = ctx.createImageData(W, H);
  const d = IMG.data;
  d.fill(0);
  const sp = SP * (1 - 0.18 * pack);
  for (let k = 0; k < N; k++) {
    const col = Math.floor(k / ROWS);
    const row = k % ROWS;
    const x0 = cx + (col - COLS / 2) * sp;
    const y0 = cy + (row - ROWS / 2) * sp;
    const dist = Math.hypot(x0 - cx, y0 - cy) / maxD;
    const p = clamp((f - 150 - dist * 70) / 18);
    if (p <= 0) continue;
    const warm = k < WARM_N;
    const x = Math.round(x0 + (warm ? -36 * split : 36 * split) * (1 - pack));
    const y = Math.round(y0);
    const h = hash(k);
    const a = p * (0.55 + 0.45 * h);
    let r = 214;
    let g = 224;
    let b = 236;
    let al = a * (warm ? 0.8 : lerp(0.8, 0.5, split));
    if (warm && split > 0) {
      g = Math.round(lerp(222, 186, split));
      b = Math.round(lerp(230, 90, split));
      r = 255;
      al = a * lerp(0.8, 1, split);
    }
    const sz = p * (0.6 + 0.4 * h) > 0.75 ? 2 : 1;
    const A = Math.round(255 * Math.min(1, al));
    for (let dy = 0; dy < sz; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= H) continue;
      for (let dx = 0; dx < sz; dx++) {
        const xx = x + dx;
        if (xx < 0 || xx >= W) continue;
        const i = (yy * W + xx) * 4;
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = A;
      }
    }
  }
  ctx.putImageData(IMG, 0, 0);
  if (split > 0) {
    const wb = (WARM_N / ROWS) * sp;
    const gx = cx - (COLS / 2) * sp - 36 * (1 - pack) + wb / 2;
    const g2 = ctx.createRadialGradient(gx, cy, 0, gx, cy, wb * 0.9);
    g2.addColorStop(0, `rgba(255,181,71,${0.22 * split})`);
    g2.addColorStop(1, 'rgba(255,181,71,0)');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
};

export const LockIntroScene: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('lockIntro');
  const introO = 1 - prog(f, END - 16, 16);
  return (
    <AbsoluteFill>
      <Cue s="sparkle" at={10} dur={1.2} gain={0.35} />
      <Cue s="glass" at={b(2.8)} gain={0.5} />
      <Cue s="slide" at={b(3.6)} dur={(b(6) - b(3.6)) / 60} />
      <Cue s="click" at={b(6)} />
      {/* 11：单看钥匙，形状很怪 → 锁浮现 → 咔 */}
      <Lock x={1290} y={500} scale={0.9} bits={[0.85, 0.1, 0.65, 0.25, 0.95]} lockIn={b(2.8)} keyIn={b(3.6)} click={b(6)} opacity={introO} />
      <Line text="单看钥匙，形状很怪。" at={16} out={b(4.2)} y={900} size={62} />
      <Line text="每一种「土」，都对着一个真实的约束。" at={b(6) + 12} out={END - 14} y={900} size={60} kind="opinion" opinion />
    </AbsoluteFill>
  );
};

export const MoneyScene: React.FC = () => {
  const g = useCurrentFrame();
  const END = len('money');
  const lockZoom = prog(g, 100, 44, ease.in);
  const fieldO = prog(g, 124, 30) * (1 - prog(g, END - 16, 16));
  return (
    <AbsoluteFill>
      <Cue s="slide" at={4} dur={0.9} />
      <Cue s="click" at={60} />
      <Cue s="whoosh" at={100} dur={0.9} gain={0.6} />
      <Cue s="sparkle" at={150} dur={2.6} gain={0.75} />
      <Cue s="whoosh" at={330} dur={0.8} gain={0.45} pan={-0.3} />
      <Cue s="tick" at={400} gain={0.7} pan={-0.3} />
      {/* 锁①：钱 */}
      {g < 150 ? (
        <AbsoluteFill style={{transform: `scale(${1 + lockZoom * 2.2})`, transformOrigin: '1060px 500px', opacity: 1 - lockZoom}}>
          <Lock x={1160} y={520} scale={0.72} bits={[0.3, 0.9, 0.5, 0.15, 0.7]} lockIn={-6} keyIn={4} click={60} label="钱" icon="cup" />
        </AbsoluteFill>
      ) : null}
      <LockCount n={1} at={4} out={124} />
      <Line text="几块钱一杯，不是品味低，是预算真实。" at={66} out={258} y={900} size={58} kind="opinion" opinion />
      {g >= 124 ? (
        <AbsoluteFill style={{opacity: fieldO}}>
          <CanvasLayer draw={(ctx) => drawStores(ctx, g + 16)} />
          <div style={{position: 'absolute', left: 960, top: 150, transform: 'translate(-50%, -50%)', fontFamily: font.sans, fontWeight: 500, fontSize: 34, color: color.dim, opacity: prog(g, 226, 24), whiteSpace: 'nowrap'}}>
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
      <Line text="蜜雪集团：全球约 *6.4 万*家门店" at={266} out={END - 14} y={800} kind="data" size={54} hl={color.warmHi} />
      <Line
        text="三线及以下城市约 *3.5 万*家，占中国内地门店的 *58%*"
        at={380}
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
