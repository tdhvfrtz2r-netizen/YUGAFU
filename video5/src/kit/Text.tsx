import React, {createContext, useContext} from 'react';
import {getInputProps, useCurrentFrame} from 'remotion';
import {color, ease, font, motion, textStyle, TextKind} from '../theme';
import {clamp, prog} from './anim';

type Align = 'center' | 'left' | 'right';

/** 所在 Sequence 的起始帧（Main.tsx 里提供），只给阅读时长自检用 */
export const SeqBase = createContext(0);
let auditFlag: boolean | null = null;
const audit = (kind: string, base: number, text: string, at: number, out: number | undefined, extra: Record<string, unknown> = {}) => {
  if (auditFlag === null) auditFlag = Boolean((getInputProps() as {audit?: boolean}).audit);
  if (!auditFlag) return;
  console.log('AUDIT ' + JSON.stringify({kind, base, text, at, out: out ?? null, ...extra}));
};

export type LineProps = {
  text: string;
  at: number;
  out?: number;
  kind?: TextKind;
  x?: number;
  y?: number;
  align?: Align;
  size?: number;
  color?: string;
  /** *包起来的部分* 用这个颜色 */
  hl?: string;
  opinion?: boolean;
  source?: string;
  stagger?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
  scrim?: boolean;
};

const anchor = (align: Align) =>
  align === 'center' ? 'translate(-50%, -50%)' : align === 'left' ? 'translate(0, -50%)' : 'translate(-100%, -50%)';

/** 退场：0.3 秒淡出 + 虚化 */
export const outFactor = (f: number, out?: number) =>
  out === undefined ? 1 : 1 - ease.in(clamp((f - out) / motion.outDur));

/** 逐字显影：每个字从虚到实、从下往上 18px */
export const Chars: React.FC<{text: string; start: number; stagger?: number; hl?: string; hlStyle?: React.CSSProperties}> = ({
  text,
  start,
  stagger = motion.charStagger,
  hl,
  hlStyle,
}) => {
  const f = useCurrentFrame();
  let on = false;
  let i = 0;
  const out: React.ReactNode[] = [];
  for (const ch of Array.from(text)) {
    if (ch === '*') {
      on = !on;
      continue;
    }
    const p = ease.out(clamp((f - start - i * stagger) / motion.inDur));
    const settled = p >= 0.999;
    out.push(
      <span
        key={i}
        style={{
          display: 'inline-block',
          whiteSpace: 'pre',
          opacity: p,
          transform: settled ? undefined : `translateY(${(1 - p) * motion.rise}px)`,
          filter: settled || p <= 0 ? undefined : `blur(${(1 - p) * motion.blur}px)`,
          color: on && hl ? hl : undefined,
          ...(on ? hlStyle : null),
        }}
      >
        {ch}
      </span>,
    );
    i++;
  }
  return <>{out}</>;
};

export const OpinionChip: React.FC<{at: number; size?: number}> = ({at, size = 26}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 24);
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: font.sans,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '0.12em',
        color: color.opinion,
        border: `2px solid ${color.opinion}`,
        borderRadius: 999,
        padding: `${size * 0.32}px ${size * 0.55}px ${size * 0.32}px ${size * 0.67}px`,
        marginRight: size * 0.8,
        verticalAlign: 'middle',
        position: 'relative',
        top: -size * 0.12,
        opacity: p * 0.95,
        transform: `scale(${0.85 + 0.15 * p})`,
      }}
    >
      观点
    </span>
  );
};

export const SourceTag: React.FC<{text: string; at: number; align?: Align; size?: number}> = ({text, at, align = 'center', size}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 30);
  return (
    <div
      style={{
        ...textStyle.tag,
        fontSize: size ?? textStyle.tag.fontSize,
        marginTop: 14,
        opacity: p,
        transform: `translateY(${(1 - p) * 8}px)`,
        textAlign: align,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{display: 'inline-block', width: 26, height: 2, background: color.dim, verticalAlign: 'middle', marginRight: 12, opacity: 0.8}} />
      来源：{text}
    </div>
  );
};

/** 一行字：入场逐字显影，可带「观点」标记、来源角标 */
export const Line: React.FC<LineProps> = ({
  text,
  at,
  out,
  kind = 'voice',
  x = 960,
  y = 540,
  align = 'center',
  size,
  color: c,
  hl,
  opinion,
  source,
  stagger,
  maxWidth,
  style,
  scrim = true,
}) => {
  const f = useCurrentFrame();
  audit('line', useContext(SeqBase), text, at, out, {opinion: Boolean(opinion), stagger: stagger ?? motion.charStagger, source: source ?? null});
  if (f < at - 1) return null;
  const o = outFactor(f, out);
  if (o <= 0) return null;
  const st = textStyle[kind];
  const sc = scrim && (kind === 'voice' || kind === 'opinion' || kind === 'data') ? prog(f, at - 4, 24) : 0;
  const chipSize = Math.max(30, Math.round((size ?? (st.fontSize as number)) * 0.5));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: anchor(align),
        textAlign: align,
        opacity: o,
        filter: o < 1 ? `blur(${(1 - o) * 10}px)` : undefined,
        maxWidth,
        ...style,
      }}
    >
      {sc > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: '-12%',
            right: '-12%',
            top: '-30%',
            bottom: '-30%',
            background: 'radial-gradient(closest-side, rgba(6,8,12,0.62), rgba(6,8,12,0))',
            opacity: sc,
            zIndex: -1,
          }}
        />
      ) : null}
      <div style={{...st, fontSize: size ?? st.fontSize, color: c ?? st.color, whiteSpace: maxWidth ? 'normal' : 'nowrap', lineHeight: 1.35}}>
        {opinion ? <OpinionChip at={at} size={chipSize} /> : null}
        <Chars text={text} start={at + (opinion ? 6 : 0)} stagger={stagger} hl={hl} />
      </div>
      {source ? (
        <div style={{position: 'absolute', top: '100%', left: align === 'left' ? 0 : align === 'right' ? undefined : '50%', right: align === 'right' ? 0 : undefined, transform: align === 'center' ? 'translateX(-50%)' : undefined}}>
          <SourceTag text={source} at={at + 18} align={align} />
        </div>
      ) : null}
    </div>
  );
};

/** 结论样式：圈号 + 最粗宋体 + 从中间画开的下划线 + 暖光。全片只用三次。 */
export const KeySentence: React.FC<{n: 1 | 2 | 3; text: string; at: number; out?: number; y?: number; opinion?: boolean}> = ({
  n,
  text,
  at,
  out,
  y = 540,
  opinion,
}) => {
  const f = useCurrentFrame();
  audit('key', useContext(SeqBase), text, at, out, {opinion: Boolean(opinion), stagger: 2.2});
  if (f < at - 1) return null;
  const o = outFactor(f, out);
  if (o <= 0) return null;
  const ring = prog(f, at, 36);
  const under = prog(f, at + 18, 40, ease.inOut);
  const glow = prog(f, at + 24, 50);
  const R = 46;
  const circ = 2 * Math.PI * R;
  return (
    <div style={{position: 'absolute', left: 960, top: y, transform: 'translate(-50%, -50%)', opacity: o, textAlign: 'center'}}>
      {opinion ? (
        <div style={{marginBottom: 26}}>
          <OpinionChip at={at} size={32} />
        </div>
      ) : null}
      <div style={{display: 'flex', alignItems: 'center', gap: 34, justifyContent: 'center'}}>
        <svg width={R * 2 + 8} height={R * 2 + 8} style={{flex: 'none'}}>
          <circle
            cx={R + 4}
            cy={R + 4}
            r={R}
            fill="none"
            stroke={color.warm}
            strokeWidth={3}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ring)}
            transform={`rotate(-90 ${R + 4} ${R + 4})`}
          />
          <text
            x={R + 4}
            y={R + 4}
            dy="0.36em"
            textAnchor="middle"
            fontFamily={font.sans}
            fontWeight={700}
            fontSize={46}
            fill={color.warm}
            opacity={ring}
          >
            {n}
          </text>
        </svg>
        <div
          style={{
            ...textStyle.key,
            whiteSpace: 'nowrap',
            textShadow: `0 0 ${40 * glow}px rgba(255,181,71,${0.35 * glow})`,
          }}
        >
          <Chars text={text} start={at + 8} stagger={2.2} />
        </div>
      </div>
      <div
        style={{
          height: 3,
          margin: '30px auto 0',
          width: `${under * 100}%`,
          background: `linear-gradient(90deg, transparent, ${color.warm}, transparent)`,
          opacity: 0.9,
        }}
      />
    </div>
  );
};
