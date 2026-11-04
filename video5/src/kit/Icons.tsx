import React from 'react';

/** 全片统一的线性图标：2.2 单位线宽、圆头，在 100×100 的框里画。只用简单几何，不碰任何品牌。 */
type P = {size?: number; c?: string; w?: number; fill?: string; style?: React.CSSProperties; p?: number};

const Svg: React.FC<P & {children: React.ReactNode}> = ({size = 100, c = 'currentColor', w = 5, style, children}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', ...style}}>
    <g fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </g>
  </svg>
);

export const IconBar: React.FC<P> = (p) => (
  <Svg {...p}>
    <line x1={6} y1={55} x2={94} y2={55} opacity={0.45} />
    <line x1={6} y1={55} x2={38} y2={55} />
    {[18, 30, 42, 54, 66, 78, 90].map((x) => (
      <line key={x} x1={x} y1={47} x2={x} y2={50} opacity={0.6} />
    ))}
    <circle cx={38} cy={55} r={6} fill={p.c} />
  </Svg>
);

export const IconCup: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M26 34 L74 34 L67 90 L33 90 Z" />
    <path d="M22 34 L78 34" />
    <path d="M30 26 Q50 18 70 26" />
    <path d="M56 22 L64 6" />
    <path d="M30 56 L70 56" opacity={0.5} />
  </Svg>
);

export const IconPhone: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={28} y={8} width={44} height={84} rx={8} />
    <path d="M44 40 L60 50 L44 60 Z" fill={p.c} />
  </Svg>
);

export const IconWave: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M4 50 Q14 22 24 50 T44 50 T64 50 T84 50 T96 46" />
  </Svg>
);

export const IconStar: React.FC<P> = ({fill = 'none', ...p}) => (
  <Svg {...p}>
    <path d="M50 8 L61 36 L91 38 L68 57 L76 87 L50 70 L24 87 L32 57 L9 38 L39 36 Z" fill={fill} />
  </Svg>
);

export const IconThumb: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M30 44 L30 88 L14 88 L14 44 Z" />
    <path d="M30 46 L46 14 Q56 12 56 26 L52 42 L80 42 Q90 44 86 56 L78 82 Q74 88 66 88 L30 88" />
  </Svg>
);

export const IconWallet: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x={10} y={26} width={80} height={56} rx={8} />
    <path d="M62 44 L90 44 L90 64 L62 64 Q54 54 62 44 Z" />
    <circle cx={70} cy={54} r={3} fill={p.c} />
  </Svg>
);

export const IconClock: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={50} cy={52} r={38} />
    <path d="M50 30 L50 52 L66 62" />
  </Svg>
);

export const IconStairs: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M8 88 L8 72 L28 72 L28 56 L48 56 L48 40 L68 40 L68 24 L92 24 L92 88 Z" />
  </Svg>
);

export const IconKnot: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M14 56 C24 14 70 18 60 46 C52 70 22 64 36 40 C48 20 84 30 80 58 C76 84 42 86 50 62 C56 44 90 50 88 70" />
  </Svg>
);

export const IconCap: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M18 62 Q50 20 82 62 Z" />
    <path d="M10 62 L90 62" />
    <circle cx={50} cy={46} r={5} />
  </Svg>
);

export const IconBroom: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M62 8 L44 58" />
    <path d="M30 56 L60 66 L52 92 L16 82 Z" />
    <path d="M28 74 L24 86 M38 77 L34 89 M48 80 L44 91" opacity={0.6} />
  </Svg>
);

export const IconBottle: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M40 8 L60 8 L60 18 Q72 26 72 40 L72 86 Q72 92 66 92 L34 92 Q28 92 28 86 L28 40 Q28 26 40 18 Z" />
    <path d="M28 52 L44 52 M28 66 L44 66" opacity={0.6} />
  </Svg>
);

export const IconOrb: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx={50} cy={50} r={20} fill={p.c} />
  </Svg>
);

export const ICONS = {
  bar: IconBar,
  cup: IconCup,
  phone: IconPhone,
  wave: IconWave,
  star: IconStar,
  thumb: IconThumb,
  wallet: IconWallet,
  clock: IconClock,
  stairs: IconStairs,
  knot: IconKnot,
  cap: IconCap,
  broom: IconBroom,
  bottle: IconBottle,
};
export type IconName = keyof typeof ICONS;
