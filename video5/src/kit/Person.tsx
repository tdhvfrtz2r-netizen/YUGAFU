import React from 'react';

/** SVG 版小人，和画布上的 drawPerson 同一个造型。(x, y) 是脚底，s 是身高 */
export const personPath = (x: number, y: number, s: number) => {
  const r = s * 0.15;
  const bw = s * 0.4;
  const top = y - s + r * 2 + s * 0.06;
  return {
    head: {cx: x, cy: y - s + r, r},
    body: `M${x - bw / 2} ${y} L${x - bw / 2} ${top + bw / 2} A${bw / 2} ${bw / 2} 0 0 1 ${x + bw / 2} ${top + bw / 2} L${x + bw / 2} ${y} Z`,
  };
};

export const Person: React.FC<{x: number; y: number; s: number; c: string; o?: number; glow?: string}> = ({x, y, s, c, o = 1, glow}) => {
  const p = personPath(x, y, s);
  return (
    <g opacity={o}>
      {glow ? <ellipse cx={x} cy={y - s * 0.5} rx={s * 0.9} ry={s * 0.9} fill={glow} opacity={0.18} /> : null}
      <circle {...p.head} fill={c} />
      <path d={p.body} fill={c} />
    </g>
  );
};
