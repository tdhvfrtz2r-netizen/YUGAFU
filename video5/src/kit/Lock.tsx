import React from 'react';
import {useCurrentFrame} from 'remotion';
import {color, ease, font} from '../theme';
import {clamp, lerp, prog} from './anim';
import {ICONS, IconName} from './Icons';

/**
 * 弹子锁剖面：钥匙齿形把每颗弹子顶到剪切线上，才转得动。
 * 这就是主比喻——钥匙看着怪，是因为它照着锁里的弹子长。
 */
const PINS = [-200, -100, 0, 100, 200];
const SHEAR = -20;
const BLADE_BOTTOM = 96;
const DRIVER = 62;
const REST = 92; // 没钥匙时弹子落到的位置（底端）

/** 钥匙齿的顶边：在每颗弹子处凹到 30 + 46*c，中间是尖齿 */
const bladeTop = (x: number, bits: number[]) => {
  if (x < -270 || x > 262) return null;
  if (x > 250) return lerp(30, 70, (x - 250) / 12);
  const pts: [number, number][] = [[-270, 18]];
  PINS.forEach((px, i) => {
    pts.push([px - 34, 14]);
    pts.push([px - 10, 30 + 46 * bits[i]]);
    pts.push([px + 10, 30 + 46 * bits[i]]);
    pts.push([px + 34, 14]);
  });
  pts.push([250, 18]);
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return lerp(y0, y1, (x - x0) / Math.max(1e-6, x1 - x0));
    }
  }
  return 18;
};

const bladePath = (bits: number[]) => {
  let d = `M-270 ${BLADE_BOTTOM} L-270 18`;
  for (let x = -268; x <= 262; x += 2) d += ` L${x} ${bladeTop(x, bits)!.toFixed(1)}`;
  d += ` L262 ${BLADE_BOTTOM} Z`;
  return d;
};

export type LockProps = {
  x: number;
  y: number;
  scale?: number;
  bits: number[];
  keyIn: number; // 钥匙开始插入的帧
  click: number; // 咔
  label?: string;
  icon?: IconName;
  lockIn?: number; // 锁从暗处浮现的帧
  keyOnlyFrom?: number;
  opacity?: number;
};

export const Lock: React.FC<LockProps> = ({x, y, scale = 1, bits, keyIn, click, label, icon, lockIn = -100, opacity = 1}) => {
  const f = useCurrentFrame();
  const lockO = prog(f, lockIn, 40);
  const insert = prog(f, keyIn, click - keyIn - 6, ease.inOut);
  const off = lerp(-640, 0, insert);
  const turned = prog(f, click, 10, ease.out);
  const glow = prog(f, click, 16) * (1 - 0.45 * prog(f, click + 20, 50));
  const bump = 1 + 0.025 * Math.sin(clamp((f - click) / 12) * Math.PI);
  const Icon = icon ? ICONS[icon] : null;
  const keyFloat = Math.sin(f / 22) * 6 * (1 - insert);
  const keyTilt = (1 - insert) * -8 * Math.sin(f / 40);

  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity, overflow: 'visible'}}>
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color.brassHi} />
          <stop offset="0.5" stopColor={color.brass} />
          <stop offset="1" stopColor={color.brassDeep} />
        </linearGradient>
        <linearGradient id="housing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A3140" />
          <stop offset="1" stopColor="#151A24" />
        </linearGradient>
        <radialGradient id="leak">
          <stop offset="0" stopColor={color.warmHi} stopOpacity={0.9} />
          <stop offset="0.4" stopColor={color.warm} stopOpacity={0.35} />
          <stop offset="1" stopColor={color.warm} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${scale * bump})`}>
        {/* 锁体 */}
        <g opacity={lockO}>
          <rect x={-320} y={-230} width={640} height={370} rx={36} fill="url(#housing)" stroke="rgba(242,213,156,0.35)" strokeWidth={3} />
          <rect x={-290} y={SHEAR} width={590} height={118} rx={12} fill="#0F131B" stroke="rgba(242,213,156,0.25)" strokeWidth={2} />
          {label ? (
            <text x={0} y={-168} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={label.length > 3 ? 50 : 62} fill={color.brassHi} letterSpacing="0.08em">
              {label}
            </text>
          ) : null}
          {PINS.map((px, i) => {
            const bt = bladeTop(px - off, bits);
            const keyPinLen = 48 + 46 * bits[i]; // 插对钥匙时，顶端正好停在剪切线
            const bottom = bt === null ? REST : Math.min(REST, bt - 2);
            const kTop = bottom - keyPinLen;
            const dTop = kTop - DRIVER;
            return (
              <g key={i}>
                <rect x={px - 17} y={-150} width={34} height={150 + 74} fill="#0B0E14" opacity={0.9} />
                {/* 弹簧 */}
                <path
                  d={Array.from({length: 7}, (_, k) => {
                    const yy = lerp(-146, dTop - 2, k / 6);
                    return `${k === 0 ? 'M' : 'L'}${px + (k % 2 ? 12 : -12)} ${yy.toFixed(1)}`;
                  }).join(' ')}
                  stroke={color.dim}
                  strokeWidth={3}
                  fill="none"
                />
                <rect x={px - 14} y={dTop} width={28} height={DRIVER - 2} rx={5} fill="#8D97A6" />
                <path d={`M${px - 14} ${kTop + 2} L${px + 14} ${kTop + 2} L${px + 14} ${bottom - 10} L${px} ${bottom} L${px - 14} ${bottom - 10} Z`} fill="url(#brass)" />
              </g>
            );
          })}
          <line x1={-300} y1={SHEAR} x2={300} y2={SHEAR} stroke={color.warmHi} strokeWidth={3} strokeDasharray="10 8" opacity={0.25 + 0.75 * glow} />
          <ellipse cx={0} cy={SHEAR} rx={420} ry={90} fill="url(#leak)" opacity={glow} />
        </g>
        {/* 钥匙 */}
        <g transform={`translate(${off} ${keyFloat}) rotate(${keyTilt} -300 60)`}>
          <path d={bladePath(bits)} fill="url(#brass)" stroke={color.brassHi} strokeWidth={2} />
          <rect x={-330} y={14} width={64} height={86} rx={8} fill="url(#brass)" />
          <circle cx={-420} cy={57} r={92} fill="url(#brass)" stroke={color.brassHi} strokeWidth={3} />
          <circle cx={-420} cy={57} r={64} fill="#1A1F29" opacity={0.85} />
          {Icon ? (
            <g transform={`translate(${-420 - 46} ${57 - 46})`}>
              <Icon size={92} c={color.warmHi} w={6} />
            </g>
          ) : (
            <circle cx={-420} cy={57} r={20} fill="none" stroke={color.brassHi} strokeWidth={4} />
          )}
        </g>
        <rect x={-300} y={SHEAR - 2} width={600 * turned} height={4} fill={color.warmHi} opacity={turned * (1 - prog(f, click + 30, 30))} />
      </g>
    </svg>
  );
};
