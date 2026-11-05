import React, {useContext} from 'react';
import {getInputProps} from 'remotion';
import {SeqBase} from './Text';

/**
 * 音效表。名字和 scripts/sound.py 里的合成函数一一对应；全部用程序合成，不用任何现成素材。
 */
export type SfxName =
  | 'tick' // 标签、小字出现
  | 'pop' // 卡片、词语弹出
  | 'stamp' // 盖章
  | 'flip' // 卡片翻面
  | 'chime' // 亮出答案
  | 'whoosh' // 转场、镜头移动（dur 控制长短）
  | 'rise' // 往上的气流
  | 'riser' // 蓄力（dur）
  | 'impact' // 片名、重点句的低频落点
  | 'bell' // 重点句的钟声
  | 'slide' // 钥匙插进锁
  | 'click' // 锁"咔"
  | 'coin' // 一枚硬币
  | 'coins' // 一串硬币（dur）
  | 'sparkle' // 一片光点亮起（dur）
  | 'swell' // 人群的暖色涌动（dur）
  | 'roll' // 数字滚动（dur）
  | 'thud' // 方块落定
  | 'bounce' // 塞不进去被弹开
  | 'ping' // 声呐一样的圆环
  | 'scribble' // 画线（dur）
  | 'peel' // 标签翻过去
  | 'drop' // 往下掉的音
  | 'fizzle' // 光点一个个熄灭（dur）
  | 'notify' // 手机提示
  | 'glass' // 光罩成形
  | 'step' // 台阶
  | 'punch' // 票根打孔
  | 'conveyor' // 传送带（dur）
  | 'sort' // 分拣
  | 'star'; // 点收藏

let cueFlag: boolean | null = null;

/** 音效标记：不画任何东西；收集模式下把"第几帧响什么"打到控制台，由 scripts/cues.js 收集、scripts/sound.py 合成混音 */
export const Cue: React.FC<{s: SfxName; at: number; gain?: number; pan?: number; dur?: number}> = ({s, at, gain = 1, pan = 0, dur}) => {
  const base = useContext(SeqBase);
  if (cueFlag === null) cueFlag = Boolean((getInputProps() as {cues?: boolean}).cues);
  if (cueFlag) console.log('CUE ' + JSON.stringify({s, f: Math.round(base + at), gain, pan, dur: dur ?? null}));
  return null;
};
