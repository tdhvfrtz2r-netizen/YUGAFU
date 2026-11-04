import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile, useCurrentFrame} from 'remotion';
import {GLYPHS} from '../glyphs';
import {LAYERS, layerOfFrame, layerStart} from '../timeline';
import {color, ease, font} from '../theme';
import {clamp, prog} from './anim';

const FACES = [
  '600 60px "Noto Serif SC"',
  '900 60px "Noto Serif SC"',
  '400 60px "Noto Sans SC"',
  '500 60px "Noto Sans SC"',
  '700 60px "Noto Sans SC"',
  '500 60px "Inter"',
  '600 60px "Inter"',
  '700 60px "Inter"',
];

/** 渲染前把全片用到的字形分片都加载好，避免某一帧露出系统字体 */
export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FACES.map((s) => document.fonts.load(s, GLYPHS)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
  }, [handle]);
};

export const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 90% at 50% 38%, ${color.bgLift} 0%, ${color.bg} 62%, #06080C 100%)`,
    }}
  />
);

/** 颗粒 + 暗角：每帧随机挪动颗粒贴图，像胶片 */
export const Finish: React.FC = () => {
  // 颗粒固定不动：每帧都变的噪点会让码率暴涨几倍
  const ox = 0;
  const oy = 0;
  return (
    <>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(75% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundPosition: `${ox}px ${oy}px`,
          opacity: 0.035,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

/** 左侧的"深度计"：每往下讲一层，亮点往下沉一格 */
export const DepthGauge: React.FC<{from: number; until: number}> = ({from, until}) => {
  const f = useCurrentFrame();
  if (f < from || f > until + 30) return null;
  const vis = Math.min(prog(f, from, 40), 1 - prog(f, until, 30));
  const layer = layerOfFrame(f);
  const top = 360;
  const gap = 56;
  // 每层开头，亮点用一拍半沉到下一格
  const pos = layer === 0 ? 0 : layer - 1 + prog(f, layerStart(layer), 54, ease.inOut);
  const cur = Math.round(pos);
  const label = LAYERS[layer];
  return (
    <div style={{position: 'absolute', left: 54, top: 0, opacity: 0.75 * vis}}>
      <div style={{position: 'absolute', left: 0, top, width: 2, height: gap * (LAYERS.length - 1), background: color.faint}} />
      {LAYERS.map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: i === cur ? -6 : -3,
            top: top + i * gap - (i === cur ? 7 : 3),
            width: i === cur ? 14 : 8,
            height: i === cur ? 14 : 8,
            borderRadius: 99,
            background: i === cur ? color.warm : i < cur ? color.dim : color.faint,
            boxShadow: i === cur ? `0 0 16px ${color.warm}` : undefined,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 26,
          top: top + pos * gap - 17,
          fontFamily: font.sans,
          fontWeight: 500,
          fontSize: 26,
          letterSpacing: '0.12em',
          color: color.warm,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** 一片暖色光晕（用在灯、钥匙咔哒处） */
export const Glow: React.FC<{x: number; y: number; r: number; c?: string; a?: number}> = ({x, y, r, c = color.warm, a = 0.5}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 70%)`,
      opacity: clamp(a),
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }}
  />
);

export {Img};
