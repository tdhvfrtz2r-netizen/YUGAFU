import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {keys, lerp, prog, win} from '../kit/anim';
import {IconStar, IconThumb} from '../kit/Icons';
import {Line, SourceTag} from '../kit/Text';
import {len} from '../timeline';
import {b, color, ease, font} from '../theme';

/** 开场 01–04：嫌磨叽 → 133.6 万播放 → 收藏是点赞的两倍（说明书）→ 我错了 */

const BX0 = 260;
const BX1 = 1660;
const BY = 650;
const MIN = 50;

// 播放头每一拍被拖一下（分钟）
const JUMPS: [number, number][] = [
  [0, 0],
  [b(1.6), 4.5],
  [b(2.6), 11],
  [b(3.6), 19],
];

const mmss = (m: number) => {
  const mm = Math.floor(m);
  const ss = Math.round((m - mm) * 60);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const ProgressTrack: React.FC<{f: number; draw: number; minutes: number; streakFrom: number; streakT: number}> = ({
  f,
  draw,
  minutes,
  streakFrom,
  streakT,
}) => {
  const xOf = (m: number) => BX0 + ((BX1 - BX0) * m) / MIN;
  const x = xOf(minutes);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="streak" x1="0" x2="1">
          <stop offset="0" stopColor={color.cool} stopOpacity={0} />
          <stop offset="1" stopColor={color.cool} stopOpacity={0.9} />
        </linearGradient>
        <filter id="mb" x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="10 0.6" />
        </filter>
      </defs>
      <line x1={BX0} y1={BY} x2={lerp(BX0, BX1, draw)} y2={BY} stroke={color.line} strokeWidth={4} strokeLinecap="round" />
      {Array.from({length: MIN + 1}).map((_, i) => {
        const tx = xOf(i);
        if (tx > lerp(BX0, BX1, draw)) return null;
        const big = i % 10 === 0;
        return <line key={i} x1={tx} y1={BY - (big ? 20 : 11)} x2={tx} y2={BY - 6} stroke={color.dim} strokeOpacity={big ? 0.7 : 0.35} strokeWidth={2} />;
      })}
      <line x1={BX0} y1={BY} x2={x} y2={BY} stroke={color.cool} strokeWidth={4} strokeLinecap="round" opacity={draw > 0.98 ? 1 : 0} />
      {streakT > 0 ? (
        <rect x={xOf(streakFrom)} y={BY - 9} width={Math.max(0, x - xOf(streakFrom))} height={18} rx={9} fill="url(#streak)" opacity={streakT} filter="url(#mb)" />
      ) : null}
      <circle cx={x} cy={BY} r={13} fill={color.cool} opacity={draw > 0.98 ? 1 : 0} />
      <circle cx={x} cy={BY} r={30} fill={color.cool} opacity={draw > 0.98 ? 0.18 : 0} />
    </svg>
  );
};

const Coin: React.FC<{x: number; y: number; w: number; h: number; r: number; c: string; o: number}> = ({x, y, w, h, r, c, o}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: r,
      background: `linear-gradient(180deg, ${c} 0%, rgba(0,0,0,0.25) 140%)`,
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.45)',
      opacity: o,
    }}
  />
);

const BOOK_COLORS = [color.warm, '#E9C98F', color.warmDeep, '#B9A27A', '#F0B967', '#8C7650'];

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const S2 = len('01');
  const S3 = S2 + len('02');
  const S4 = S3 + len('03');

  // ---------- 进度条（01–02）----------
  const draw = prog(f, 4, 34);
  let minutes = 0;
  let streakFrom = 0;
  let streakT = 0;
  for (let i = 1; i < JUMPS.length; i++) {
    const [jf, m] = JUMPS[i];
    const [, pm] = JUMPS[i - 1];
    if (f >= jf) {
      const p = prog(f, jf, 9, ease.out);
      minutes = lerp(pm, m, p);
      streakFrom = pm;
      streakT = 1 - prog(f, jf + 2, 14, ease.soft);
    }
  }
  const barScale = keys(f, [
    [S2, 1],
    [S2 + 30, 0.7],
  ], ease.out);
  const barY = keys(f, [
    [S2, 0],
    [S2 + 30, 190],
  ], ease.out);
  const barO = Math.min(1 - prog(f, S2 + 10, 40) * 0.55, 1 - prog(f, S3, 24));

  // ---------- 计数器（02–03）----------
  const roll = prog(f, S2 + 4, b(2) - 4, ease.out);
  const counterIn = prog(f, S2, 20);
  const toTop = prog(f, S3, 40, ease.inOut);
  const counterOut = 1 - prog(f, S4, 18);
  const land = prog(f, S2 + b(2), 30, ease.out);

  // ---------- 两摞代币（03）----------
  const L_N = 13;
  const R_N = 26;
  const THICK = 15.5;
  const baseY = 735;
  const lx = 700;
  const rx = 1120;
  const morph = (i: number) => prog(f, S3 + 128 + i * 1.6, 44, ease.inOut);
  const stacksO = 1 - prog(f, S4, 18);
  const leftDim = 1 - 0.6 * prog(f, S3 + 128, 40);

  const coins: React.ReactNode[] = [];
  for (let i = 0; i < L_N; i++) {
    const p = prog(f, S3 + 22 + i * 2.2, 16, ease.out);
    if (p <= 0) continue;
    coins.push(<Coin key={'l' + i} x={lx} y={baseY - i * THICK - (1 - p) * 70} w={150} h={42} r={21} c="#7E8DA3" o={p * leftDim * stacksO} />);
  }
  for (let i = 0; i < R_N; i++) {
    const p = prog(f, S3 + 34 + i * 2.2, 16, ease.out);
    if (p <= 0) continue;
    const m = morph(i);
    const bw = 17 + ((i * 7) % 5) * 2;
    const bh = 120 + ((i * 37) % 6) * 11;
    const shelfX0 = rx - 300;
    let sx = shelfX0;
    for (let k = 0; k < i; k++) sx += 17 + ((k * 7) % 5) * 2 + 4;
    const x = lerp(rx, sx + bw / 2, m);
    const y = lerp(baseY - i * THICK - (1 - p) * 70, baseY - bh / 2 + 21, m);
    const c = m > 0.5 ? BOOK_COLORS[(i * 5) % BOOK_COLORS.length] : color.warm;
    coins.push(
      <Coin key={'r' + i} x={x} y={y} w={lerp(150, bw, m)} h={lerp(42, bh, m)} r={lerp(21, 3, m)} c={c} o={p * stacksO} />,
    );
  }
  const refLine = win(f, S3 + 96, S3 + 128, 20, 20);
  const shelf = prog(f, S3 + 160, 40, ease.inOut);
  const labelsO = Math.min(prog(f, S3 + 70, 24), stacksO);

  return (
    <AbsoluteFill>
      {/* 01 进度条 + 倍速 + 时间码 */}
      {f < S3 + 30 ? (
        <AbsoluteFill style={{opacity: barO, transform: `translateY(${barY}px) scale(${barScale})`, transformOrigin: '960px 650px'}}>
          <ProgressTrack f={f} draw={draw} minutes={minutes} streakFrom={streakFrom} streakT={streakT} />
          <div
            style={{
              position: 'absolute',
              right: 1920 - BX1,
              top: BY - 78,
              fontFamily: font.sans,
              fontWeight: 600,
              fontSize: 34,
              color: color.dim,
              fontVariantNumeric: 'tabular-nums',
              opacity: draw,
            }}
          >
            <span style={{color: color.cool, marginRight: 22, opacity: prog(f, b(1.2), 14), display: 'inline-block', transform: `scale(${lerp(1.4, 1, prog(f, b(1.2), 14))})`}}>
              2.0×
            </span>
            {mmss(minutes)} / 50:00
          </div>
        </AbsoluteFill>
      ) : null}
      <Line text="一个 50 分钟的 AI 教程" at={10} out={S2 - 14} y={390} size={66} />
      <Line text="我嫌它磨叽。" at={b(2.4)} out={S2 - 14} y={486} size={66} />

      {/* 02 计数器：133.6 万播放 */}
      {f >= S2 && f < S4 + 20 ? (
        <div
          style={{
            position: 'absolute',
            left: 960,
            top: lerp(470, 150, toTop),
            transform: `translate(-50%, -50%) scale(${lerp(1, 0.42, toTop)})`,
            opacity: counterIn * counterOut,
            textAlign: 'center',
          }}
        >
          <div style={{fontFamily: font.sans, fontWeight: 700, fontSize: 190, color: color.data, lineHeight: 1, whiteSpace: 'nowrap', textShadow: `0 0 ${50 * (1 - land) + 10}px rgba(142,210,255,${0.35 * (1 - land) + 0.08})`}}>
            <span style={{fontVariantNumeric: 'tabular-nums', filter: roll < 0.97 ? `blur(${(1 - roll) * 5}px)` : undefined}}>
              {(133.6 * roll).toFixed(1)}
            </span>
            <span style={{fontSize: 88, marginLeft: 18, color: color.ink}}>万播放</span>
          </div>
          <div style={{opacity: 1 - toTop * 0.2}}>
            <SourceTag text="B站《DeepSeek Harness 教程》页面，截图于 2026 年 11 月" at={S2 + b(2)} size={27 / lerp(1, 0.42, toTop)} />
          </div>
        </div>
      ) : null}

      {/* 03 两摞代币 → 一排说明书 */}
      {f >= S3 && f < S4 + 20 ? (
        <AbsoluteFill>
          {coins}
          <div
            style={{
              position: 'absolute',
              left: lx + 80,
              top: baseY - (L_N - 1) * THICK - 21,
              width: (rx - lx - 160) * refLine,
              borderTop: `2px dashed ${color.dim}`,
              opacity: refLine * 0.8,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: rx - 310,
              top: baseY + 22,
              width: 640 * shelf,
              height: 4,
              background: color.brass,
              opacity: 0.8 * stacksO,
              borderRadius: 2,
            }}
          />
          {[
            {x: lx, label: '点赞', num: '6.4 万', Icon: IconThumb, c: '#9FB0C8'},
            {x: rx, label: '收藏', num: '12.9 万', Icon: IconStar, c: color.warm},
          ].map((d) => (
            <div
              key={d.label}
              style={{
                position: 'absolute',
                left: d.x,
                top: baseY + 92,
                transform: 'translateX(-50%)',
                opacity: labelsO,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                whiteSpace: 'nowrap',
                fontFamily: font.sans,
                fontWeight: 700,
                fontSize: 46,
                color: color.data,
              }}
            >
              <d.Icon size={46} c={d.c} w={7} fill={d.label === '收藏' ? 'rgba(255,181,71,0.25)' : undefined} />
              <span style={{color: color.dim, fontWeight: 500}}>{d.label}</span>
              <span>{d.num}</span>
            </div>
          ))}
        </AbsoluteFill>
      ) : null}
      <Line text="很多人，像是把它当说明书存了起来。" at={S3 + 150} out={S4 - 6} y={955} size={56} kind="opinion" opinion />

      {/* 04 我错了。错在哪？ */}
      <Line text="我错了。" at={S4 + 10} out={S4 + len('04') - 14} y={470} size={84} />
      <Line text="错在哪？" at={S4 + 46} out={S4 + len('04') - 14} y={600} size={84} kind="voice" color={color.warmHi} />
    </AbsoluteFill>
  );
};
