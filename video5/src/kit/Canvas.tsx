import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {H, W} from '../theme';
import {TAU} from './anim';

/** 每帧重画的画布层。draw 必须是确定性的（同一帧画出同样的东西）。 */
export const CanvasLayer: React.FC<{draw: (ctx: CanvasRenderingContext2D, f: number) => void; style?: React.CSSProperties}> = ({
  draw,
  style,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const f = useCurrentFrame();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    draw(ctx, f);
  });
  return <canvas ref={ref} width={W} height={H} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, ...style}} />;
};

/** 小人：圆头 + 圆角身体。(x, y) 是脚底，s 是身高（像素） */
export const drawPerson = (ctx: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string, alpha = 1) => {
  if (alpha <= 0.003 || s < 0.5) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  const r = s * 0.15;
  ctx.beginPath();
  ctx.arc(x, y - s + r, r, 0, TAU);
  ctx.fill();
  const bw = s * 0.4;
  const top = y - s + r * 2 + s * 0.06;
  const h = y - top;
  const rr = Math.min(bw / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x - bw / 2, y);
  ctx.lineTo(x - bw / 2, top + rr);
  ctx.arc(x, top + rr, bw / 2, Math.PI, 0);
  ctx.lineTo(x + bw / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
};

/** 柔光点：预先画好一张径向渐变贴图，之后每次只是缩放贴上去（比每帧新建渐变快得多） */
const SPRITES = new Map<string, HTMLCanvasElement>();
const glowSprite = (rgb: string) => {
  let c = SPRITES.get(rgb);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d')!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.35, `rgba(${rgb},0.35)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    SPRITES.set(rgb, c);
  }
  return c;
};

export const drawGlow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, alpha = 1) => {
  if (alpha <= 0.003 || r < 0.5) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * Math.min(1, alpha);
  ctx.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = prev;
};

export const hexToRgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

/** 简单透视相机：世界坐标 y 朝上、z 朝前；pitch > 0 表示低头往下看 */
export type Cam = {x: number; y: number; z: number; pitch: number; fov: number};

export const project = (px: number, py: number, pz: number, cam: Cam) => {
  const x = px - cam.x;
  const y = py - cam.y;
  const z = pz - cam.z;
  const c = Math.cos(cam.pitch);
  const s = Math.sin(cam.pitch);
  const y2 = y * c + z * s;
  const z2 = -y * s + z * c;
  if (z2 <= 0.05) return null;
  const F = H / 2 / Math.tan(cam.fov / 2);
  return {x: W / 2 + (x * F) / z2, y: H / 2 - (y2 * F) / z2, k: F / z2, z: z2};
};
