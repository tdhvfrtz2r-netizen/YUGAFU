import {ease} from '../theme';

export const TAU = Math.PI * 2;
export const clamp = (x: number, a = 0, z = 1) => Math.min(z, Math.max(a, x));
export const lerp = (a: number, z: number, t: number) => a + (z - a) * t;

/** 从 start 开始、持续 dur 帧的 0→1 进度（带缓动） */
export const prog = (f: number, start: number, dur: number, e: (t: number) => number = ease.out) =>
  e(clamp((f - start) / Math.max(1, dur)));

/** 出现窗口：a 起淡入，z 起淡出 */
export const win = (f: number, a: number, z = Infinity, inD = 24, outD = 18) =>
  Math.min(prog(f, a, inD, ease.out), 1 - prog(f, z, outD, ease.in));

/** 多段关键帧插值：keys = [[帧, 值], ...]，段间用 e 缓动 */
export const keys = (f: number, ks: [number, number][], e: (t: number) => number = ease.inOut) => {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [f1, v1] = ks[i];
    const [f0, v0] = ks[i - 1];
    if (f <= f1) return lerp(v0, v1, e(clamp((f - f0) / Math.max(1, f1 - f0))));
  }
  return ks[ks.length - 1][1];
};

/** 确定性随机数（每次渲染同一帧结果一致） */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** 一个数字从 a 滚到 z，按 digits 位小数显示 */
export const rollNumber = (p: number, a: number, z: number, digits = 1) => (a + (z - a) * p).toFixed(digits);

export const mixColor = (c1: string, c2: string, t: number) => {
  const p = (c: string) =>
    c.startsWith('#') ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : (c.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  const a = p(c1);
  const z = p(c2);
  const m = a.map((v, i) => Math.round(lerp(v, z[i], clamp(t))));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
};

export const rgba = (hex: string, alpha: number) => {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${v[0]},${v[1]},${v[2]},${clamp(alpha)})`;
};
