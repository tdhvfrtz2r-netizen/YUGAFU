import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {prog} from '../kit/anim';
import {IconBar, IconCup, IconPhone, IconWave} from '../kit/Icons';
import {Glow} from '../kit/Stage';
import {Chars, outFactor} from '../kit/Text';
import {b, color, ease, textStyle} from '../theme';

/** 05 片名：「土」字的位置先是取景框，四拍闪过四把"钥匙"：长教程、奶茶、短剧、旋律 */
const SLOT_ICONS = [IconBar, IconCup, IconPhone, IconWave];

export const Title: React.FC<{dur: number}> = ({dur}) => {
  const f = useCurrentFrame();
  const out = dur - 22;
  const o = outFactor(f, out);
  const beat = Math.floor(f / b(1));
  const tu = prog(f, b(4), 26, ease.out);
  const size = 92;
  const slotIcon = beat < 4 ? SLOT_ICONS[beat] : null;
  const flash = 1 - prog(f, beat * b(1), 14);
  const Icon = slotIcon;
  return (
    <AbsoluteFill style={{opacity: o, filter: o < 1 ? `blur(${(1 - o) * 10}px)` : undefined}}>
      <Glow x={960} y={560} r={720} c={color.warmDeep} a={0.1 + 0.08 * tu} />
      <div style={{position: 'absolute', left: 960, top: 470, transform: 'translate(-50%, -50%)', ...textStyle.title, fontSize: size, whiteSpace: 'nowrap'}}>
        <Chars text="为什么我们觉得「" start={4} stagger={2} />
        <span
          style={{
            display: 'inline-block',
            width: size * 1.02,
            height: size * 1.1,
            verticalAlign: 'middle',
            position: 'relative',
            top: -size * 0.06,
            margin: '0 2px',
            border: tu < 1 ? `3px solid rgba(255,181,71,${0.75 * (1 - tu)})` : undefined,
            borderRadius: 10,
            opacity: prog(f, 10, 20),
          }}
        >
          {Icon ? (
            <span style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${1 + 0.18 * flash})`}}>
              <Icon size={size * 0.74} c={color.warm} w={6} />
            </span>
          ) : null}
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              transform: `translateY(-50%) scale(${1.25 - 0.25 * tu})`,
              textAlign: 'center',
              color: color.warm,
              opacity: tu,
              textShadow: `0 0 ${30 * tu}px rgba(255,181,71,0.55)`,
            }}
          >
            土
          </span>
        </span>
        <Chars text="」的东西，" start={22} stagger={2} />
      </div>
      <div style={{position: 'absolute', left: 960, top: 610, transform: 'translate(-50%, -50%)', ...textStyle.title, fontSize: size, whiteSpace: 'nowrap'}}>
        <Chars text="偏偏最火？" start={b(4) + 10} stagger={4} />
      </div>
    </AbsoluteFill>
  );
};
