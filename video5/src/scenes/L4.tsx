import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, keys, lerp, prog} from '../kit/anim';
import {IconBottle, IconBroom, IconCap} from '../kit/Icons';
import {Person} from '../kit/Person';
import {Line} from '../kit/Text';
import {len} from '../timeline';
import {color, ease, font} from '../theme';

/** 第四层 17–18："土"的东西沿台阶往上爬（三站数据）→ 管理学里的"低端颠覆" */

const STEP_W = 120;
const STEP_H = 60;
const NS = 24;
const WH = NS * STEP_H;
const stepTop = (i: number) => ({x: i * STEP_W, y: WH - (i + 1) * STEP_H});
const ST = [2, 8, 14].map((i) => ({x: stepTop(i).x + STEP_W * 0.5, y: stepTop(i).y}));

const Climb: React.FC<{f: number}> = ({f}) => {
  const camX = keys(f, [
    [0, ST[0].x],
    [278, ST[0].x],
    [338, ST[1].x],
    [568, ST[1].x],
    [628, ST[2].x],
    [936, ST[2].x + 40],
  ]);
  const camY = keys(f, [
    [0, ST[0].y],
    [278, ST[0].y],
    [338, ST[1].y],
    [568, ST[1].y],
    [628, ST[2].y],
    [936, ST[2].y - 20],
  ]);
  const tx = 960 - camX;
  const ty = 560 - camY;
  const pinkTo = keys(f, [
    [0, 2],
    [278, 2],
    [338, 8],
  ]);
  const amberTo = keys(f, [
    [0, 0],
    [540, 0],
    [650, 14],
  ]);
  const nose = (to: number, dy: number) => {
    let d = `M0 ${WH - STEP_H + dy}`;
    for (let i = 0; i < Math.floor(to); i++) {
      const s = stepTop(i);
      d += ` L${s.x + STEP_W} ${s.y + dy} L${s.x + STEP_W} ${s.y - STEP_H + dy}`;
    }
    const fr = to - Math.floor(to);
    const s = stepTop(Math.floor(to));
    d += ` L${s.x + STEP_W * fr} ${s.y + dy}`;
    return d;
  };
  const vis = prog(f, 0, 24);
  // 站 2：光罩里的手机一部部亮起
  const s2 = ST[1];
  const s4 = ST[2];
  const grow = prog(f, 644, 70, ease.out);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <defs>
        <radialGradient id="dome4" cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor={color.cool} stopOpacity={0.18} />
          <stop offset="1" stopColor={color.cool} stopOpacity={0.03} />
        </radialGradient>
      </defs>
      <g transform={`translate(${tx} ${ty})`}>
        {Array.from({length: NS}).map((_, i) => {
          const s = stepTop(i);
          return <rect key={i} x={s.x} y={s.y} width={STEP_W + 0.5} height={WH - s.y} fill={i % 2 ? '#1B2230' : '#1E2634'} />;
        })}
        <path d={nose(NS, 0)} fill="none" stroke={color.line} strokeWidth={2} />
        <path d={nose(pinkTo, -6)} fill="none" stroke={color.pink} strokeWidth={6} strokeLinejoin="round" />
        {amberTo > 0 ? <path d={nose(amberTo, 6)} fill="none" stroke={color.warm} strokeWidth={6} strokeLinejoin="round" /> : null}

        {/* 站 1：2023，最先亮起来的手机（镜头离开后压暗，留作走过的台阶） */}
        <g opacity={lerp(1, 0.3, prog(f, 300, 40))}>
        {[-80, 0, 80].map((dx, i) => {
          const Icon = [IconCap, IconBroom, IconBottle][i];
          const x = ST[0].x + dx - 60;
          const lit = prog(f, 30 + i * 12, 20);
          return (
            <g key={i}>
              <Person x={x} y={ST[0].y} s={110} c="#C7CFDA" />
              <rect x={x + 14} y={ST[0].y - 70} width={14} height={24} rx={3} fill={color.pink} opacity={lit} />
              <circle cx={x + 21} cy={ST[0].y - 58} r={26} fill={color.pink} opacity={0.22 * lit} />
              <g transform={`translate(${x - 22} ${ST[0].y - 168})`} opacity={prog(f, 40 + i * 12, 20)}>
                <Icon size={44} c={color.ink} w={7} />
              </g>
            </g>
          );
        })}
        </g>

        {/* 站 2：爬进光罩 */}
        <g opacity={lerp(1, 0.3, prog(f, 590, 40))}>
        <path d={`M${s2.x - 230} ${s2.y} A230 190 0 0 1 ${s2.x + 230} ${s2.y} Z`} fill="url(#dome4)" stroke="rgba(190,232,255,0.5)" strokeWidth={2} />
        {[-150, -90, -30, 30, 90, 150].map((dx, i) => {
          const lit = prog(f, 322 + i * 9, 16);
          return (
            <g key={i}>
              <Person x={s2.x + dx} y={s2.y} s={96} c="#8CCBEF" />
              <rect x={s2.x + dx + 12} y={s2.y - 62} width={12} height={21} rx={3} fill={color.pink} opacity={lit} />
              <circle cx={s2.x + dx + 18} cy={s2.y - 51} r={22} fill={color.pink} opacity={0.22 * lit} />
            </g>
          );
        })}
        </g>
        <g transform={`translate(${s2.x - 230} ${s2.y - 260})`} opacity={prog(f, 348, 24) * (1 - prog(f, 580, 30))}>
          <rect x={0} y={0} width={460} height={18} rx={9} fill="#273141" />
          <rect x={0} y={0} width={460 * 0.2173 * prog(f, 356, 50, ease.out)} height={18} rx={9} fill={color.pink} />
          <text x={460} y={-16} textAnchor="end" fontFamily={font.sans} fontWeight={700} fontSize={34} fill={color.pink}>
            21.73%
          </text>
        </g>

        {/* 站 3：一个光点长成一间大店，旁边一个小人作比例尺 */}
        <g transform={`translate(${s4.x + 40} ${s4.y})`} opacity={prog(f, 620, 20)}>
          <ellipse cx={0} cy={-70 * grow} rx={300 * grow + 20} ry={150 * grow + 10} fill={color.warm} opacity={0.1 * grow} />
          <rect x={-220 * grow} y={-128 * grow} width={440 * grow} height={128 * grow} rx={4} fill="#3B2E1C" stroke={color.warm} strokeWidth={3} />
          <rect x={-236 * grow} y={-140 * grow} width={472 * grow} height={18 * grow} rx={4} fill={color.warm} />
          {grow > 0.6
            ? Array.from({length: 10}).map((_, i) => (
                <rect key={i} x={-200 + i * 40} y={-104} width={26} height={44} rx={2} fill={color.warmHi} opacity={(grow - 0.6) * 2.2 * (i === 5 ? 0 : 0.85)} />
              ))
            : null}
          {grow > 0.6 ? <rect x={-6} y={-70} width={34} height={70} rx={2} fill={color.warmHi} opacity={(grow - 0.6) * 2.4} /> : null}
          <circle cx={0} cy={-6} r={7} fill={color.warmHi} opacity={1 - grow} />
          <Person x={262} y={0} s={16} c={color.ink} o={prog(f, 710, 20)} />
        </g>
      </g>
    </svg>
  );
};

const Disrupt: React.FC<{f: number}> = ({f}) => {
  const vis = prog(f, 0, 30) * (1 - prog(f, len('18') - 18, 18));
  const draw = prog(f, 40, 220, ease.inOut);
  const oldDraw = prog(f, 20, 120, ease.inOut);
  const X0 = 260;
  const X1 = 1660;
  const pts: [number, number][] = [
    [X0, 820],
    [700, 820],
    [760, 820],
    [760, 770],
    [930, 770],
    [930, 715],
    [1100, 715],
    [1100, 655],
    [1270, 655],
    [1270, 600],
    [1440, 600],
    [1440, 560],
    [X1, 560],
  ];
  // 按长度截取画到 draw 的部分
  let total = 0;
  const seg = pts.slice(1).map((p, i) => {
    const l = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]);
    total += l;
    return l;
  });
  let left = total * draw;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < seg.length && left > 0; i++) {
    const t = Math.min(1, left / seg[i]);
    d += ` L${lerp(pts[i][0], pts[i + 1][0], t)} ${lerp(pts[i][1], pts[i + 1][1], t)}`;
    left -= seg[i];
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: vis}}>
      <line x1={X0} y1={880} x2={X1 + 40} y2={880} stroke={color.dim} strokeWidth={2} />
      <line x1={X0} y1={880} x2={X0} y2={270} stroke={color.dim} strokeWidth={2} />
      <text x={X1 + 40} y={920} textAnchor="end" fontFamily={font.sans} fontSize={28} fill={color.dim}>时间 →</text>
      <text x={X0 - 16} y={290} textAnchor="end" fontFamily={font.sans} fontSize={28} fill={color.dim}>更好</text>
      <text x={X0 - 16} y={326} textAnchor="end" fontFamily={font.sans} fontSize={28} fill={color.dim}>更贵</text>
      <rect x={X0} y={520} width={X1 - X0} height={110} fill={color.ink} opacity={0.07} />
      <text x={X0 + 16} y={508} fontFamily={font.sans} fontWeight={500} fontSize={30} fill={color.ink} opacity={0.75}>
        大多数人需要的
      </text>
      <path d={`M${X0} 560 Q${(X0 + X1) / 2} 470 ${lerp(X0, X1, oldDraw)} ${lerp(560, 300, oldDraw)}`} fill="none" stroke="#7C8BA3" strokeWidth={5} strokeDasharray="1 0" opacity={0.9} />
      <text x={lerp(X0, X1, oldDraw) - 10} y={lerp(560, 300, oldDraw) - 22} textAnchor="end" fontFamily={font.sans} fontWeight={500} fontSize={30} fill="#9AA8BE" opacity={prog(f, 100, 30)}>
        老玩家：越做越精，越卖越贵
      </text>
      <path d={d} fill="none" stroke={color.warm} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
      <text x={X0} y={930} fontFamily={font.sans} fontSize={26} fill={color.dim} opacity={0.8}>
        示意图
      </text>
    </svg>
  );
};

export const L4: React.FC = () => {
  const f = useCurrentFrame();
  const S18 = len('17');
  const END = S18 + len('18');
  const climbO = 1 - prog(f, S18 - 20, 20);
  return (
    <AbsoluteFill>
      {f < S18 ? (
        <AbsoluteFill style={{opacity: climbO}}>
          <Climb f={f} />
        </AbsoluteFill>
      ) : null}
      <Line text="2023 年：微短剧用户以保安、保洁、保姆为主" at={30} out={290} y={900} kind="data" size={50} source="WETRUE《2025年微短剧行业洞察报告》" />
      <Line text="2025 年：一线城市观众占比 *21.73%*" at={348} out={580} y={900} kind="data" size={50} hl={color.pink} source="WETRUE《2025年微短剧行业洞察报告》" />
      <Line text="蜜雪集团南京旗舰店：约 *2000 平方米*" at={650} out={S18 - 16} y={900} kind="data" size={50} hl={color.warm} source="蜜雪集团 2026 年中期报告" />
      {f >= S18 ? <Disrupt f={f - S18} /> : null}
      <Line text="管理学里有个概念：「低端颠覆」（克里斯坦森）" at={S18 + 16} out={END - 16} y={150} size={56} />
      <Line text="① 先服务被忽视的大多数" at={S18 + 96} out={END - 16} x={286} y={772} kind="label" color={color.warmHi} size={34} align="left" />
      <Line text="② 把成本和门槛压到最低" at={S18 + 170} out={END - 16} x={286} y={850} kind="label" color={color.warmHi} size={30} align="left" />
      <Line text="③ 再一路往上走" at={S18 + 250} out={END - 16} x={1290} y={742} kind="label" color={color.warmHi} size={38} align="left" />
    </AbsoluteFill>
  );
};
