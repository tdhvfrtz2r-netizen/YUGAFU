import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, lerp, prog} from '../kit/anim';
import {Cue} from '../kit/Sound';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/**
 * 17 《稀缺》：钱和时间都紧的时候，注意力会被眼前的事占满。
 * 一个圆 = 一个人的注意力。日常的事一块块落进去，几乎占满；"要琢磨半天的东西"塞不进去，
 * "几块钱""一两分钟""一看就懂"正好卡进剩下的缝——这就是后面三把锁。（方块上的字是举例，不是数据）
 */

const CX = 720;
const CY = 548;
const CR = 280;

type Block = {t: string; x: number; y: number; w: number};
const FILL: Block[] = [
  {t: '房租', x: 720, y: 762, w: 320},
  {t: '加班', x: 605, y: 684, w: 220},
  {t: '通勤', x: 835, y: 684, w: 220},
  {t: '孩子', x: 590, y: 606, w: 250},
  {t: '老人', x: 850, y: 606, w: 250},
  {t: '账单', x: 720, y: 528, w: 380},
  {t: '看病', x: 720, y: 450, w: 210},
];
const FITS: Block[] = [
  {t: '几块钱', x: 540, y: 450, w: 140},
  {t: '一两分钟', x: 895, y: 450, w: 140},
  {t: '一看就懂', x: 720, y: 374, w: 190},
];
const BH = 70;
const fallAt = (k: number) => 80 + k * 22;
const fitAt = (k: number) => 322 + k * 24;

export const Scarcity: React.FC = () => {
  const f = useCurrentFrame();
  const END = len('scarcity');
  const vis = prog(f, 0, 24) * (1 - prog(f, END - 18, 18));
  // 塞不进去的长方块：滑过来，撞到圆，弹回去
  const inT = prog(f, 236, 44, ease.in);
  const backT = prog(f, 280, 40, ease.out);
  const longX = lerp(1560, 1190, inT) + 140 * backT;
  const longO = 1 - prog(f, 300, 30) * 0.65;
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <Cue s="glass" at={4} gain={0.4} />
      {FILL.map((_, k) => (
        <Cue key={k} s="thud" at={fallAt(k) + 14} gain={0.45} pan={(FILL[k].x - 960) / 1200} />
      ))}
      <Cue s="whoosh" at={236} dur={0.7} gain={0.45} pan={0.5} />
      <Cue s="bounce" at={280} pan={0.3} />
      {FITS.map((_, k) => (
        <Cue key={'f' + k} s="pop" at={fitAt(k) + 16} gain={0.7} pan={(FITS[k].x - 960) / 1200} />
      ))}
      <Cue s="chime" at={fitAt(2) + 20} gain={0.5} />

      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="scarGrad" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#1B2638" />
            <stop offset="1" stopColor="#0E131C" />
          </radialGradient>
          <clipPath id="scarClip">
            <circle cx={CX} cy={CY} r={CR - 4} />
          </clipPath>
        </defs>
        <circle cx={CX} cy={CY} r={CR} fill="url(#scarGrad)" stroke="rgba(190,232,255,0.5)" strokeWidth={3} />
        <text x={CX} y={CY - CR - 26} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={32} fill={color.dim}>
          一个人的注意力
        </text>
        <g clipPath="url(#scarClip)">
          {FILL.map((bk, k) => {
            const p = prog(f, fallAt(k), 16, ease.in);
            if (p <= 0) return null;
            const y = lerp(CY - CR - 120, bk.y, p);
            return (
              <g key={bk.t}>
                <rect x={bk.x - bk.w / 2} y={y - BH / 2} width={bk.w} height={BH - 6} rx={12} fill="#2A3242" stroke="rgba(238,231,218,0.2)" strokeWidth={2} />
                <text x={bk.x} y={y + 9} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={34} fill="#AEB8C6">
                  {bk.t}
                </text>
              </g>
            );
          })}
        </g>
        {FITS.map((bk, k) => {
          const p = prog(f, fitAt(k), 18, ease.out);
          if (p <= 0) return null;
          const x = lerp(1250, bk.x, p);
          const y = lerp(300 + k * 120, bk.y, p);
          const glow = prog(f, fitAt(k) + 16, 20);
          return (
            <g key={bk.t}>
              <rect x={x - bk.w / 2 - 6} y={y - BH / 2 - 6} width={bk.w + 12} height={BH + 6} rx={16} fill={color.warm} opacity={0.18 * glow} />
              <rect x={x - bk.w / 2} y={y - BH / 2} width={bk.w} height={BH - 6} rx={12} fill={color.warm} />
              <text x={x} y={y + 9} textAnchor="middle" fontFamily={font.sans} fontWeight={700} fontSize={bk.t.length > 3 ? 30 : 34} fill="#1A1206">
                {bk.t}
              </text>
            </g>
          );
        })}
        {f >= 236 ? (
          <g opacity={longO * prog(f, 236, 12)}>
            <rect x={longX - 210} y={CY - 210} width={420} height={80} rx={14} fill="#3A4558" stroke="rgba(238,231,218,0.25)" strokeWidth={2} />
            <text x={longX} y={CY - 160} textAnchor="middle" fontFamily={font.sans} fontWeight={500} fontSize={34} fill={color.ink}>
              要琢磨半天的东西
            </text>
          </g>
        ) : null}
      </svg>
      <Line text="行为经济学有本书叫《稀缺》：" at={10} out={380} y={120} size={58} />
      <Line text="钱和时间都紧的时候，注意力会被眼前的事占满。" at={60} out={380} y={930} size={56} source="穆来纳森、沙菲尔《稀缺》，2013" />
      <Line text="所以省钱、省时间、省脑子，本身就是需求。" at={400} out={END - 14} y={930} size={58} kind="opinion" opinion />
    </AbsoluteFill>
  );
};
