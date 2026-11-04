import {Easing} from 'remotion';

/**
 * 视觉语言：「灯火」
 * 每个人是一盏灯。暖色的灯 = 大多数人的日常；冷色的屏幕光 = "你"的取景框和光罩。
 * 深墨底色 + 暖金点光 + 细颗粒，像夜里从高处看一座城。
 * 规则：
 *  1. 同一时刻只有一个视觉焦点：文字出现时，画面里的动作停在背景节奏上。
 *  2. 字体分工：宋体 = 叙述和观点（作者的声音）；黑体 + Inter 数字 = 数据和标签；结论句用宋体最粗一档。
 *  3. 观点句颜色偏暖（米金），数据句偏冷白，数据句下方必有来源角标。
 *  4. 所有入场用 ease.out（快进慢停），镜头运动用 ease.inOut，退场一律 0.3 秒淡出加虚化。
 *  5. 切点落在整小节或半小节，关键动作卡重拍（100 BPM，1 拍 = 36 帧）。
 */

export const W = 1920;
export const H = 1080;
export const FPS = 60;
export const BPM = 100;
export const BEAT = Math.round((FPS * 60) / BPM); // 36 帧
export const BAR = BEAT * 4; // 144 帧 = 2.4 秒

/** 拍数 → 帧数 */
export const b = (beats: number) => Math.round(beats * BEAT);

export const color = {
  bg: '#0A0D13',
  bgLift: '#121926',
  ink: '#EEE7DA', // 叙述
  opinion: '#F3D7A6', // 观点句
  data: '#F5F7FA', // 数据句
  dim: '#8C96A5',
  faint: '#3A4352',
  line: 'rgba(238,231,218,0.18)',
  warm: '#FFB547', // 大多数人的灯、"土"的东西
  warmHi: '#FFE0A3',
  warmDeep: '#D9772B',
  cool: '#8ED2FF', // 你的屏幕光、光罩
  coolDeep: '#2F6E9E',
  slate: '#5B6A80', // 未点亮的人
  red: '#FF6B57', // 下滑、负面
  pink: '#FF7AA2', // 短剧
  brass: '#C9A46A', // 锁和钥匙
  brassHi: '#F2D59C',
  brassDeep: '#7A5A2E',
};

export const font = {
  serif: '"Noto Serif SC", "Songti SC", serif',
  sans: '"Inter", "Noto Sans SC", sans-serif',
};

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export type TextKind = 'title' | 'key' | 'voice' | 'opinion' | 'data' | 'label' | 'tag' | 'small';

/** 字号都按手机竖屏也能看清来定：正文不小于 52px，标签不小于 34px，角标不小于 26px */
export const textStyle: Record<TextKind, React.CSSProperties> = {
  title: {fontFamily: font.serif, fontWeight: 900, fontSize: 92, color: color.ink, letterSpacing: '0.02em'},
  key: {fontFamily: font.serif, fontWeight: 900, fontSize: 96, color: color.ink, letterSpacing: '0.04em'},
  voice: {fontFamily: font.serif, fontWeight: 600, fontSize: 60, color: color.ink, letterSpacing: '0.03em'},
  opinion: {fontFamily: font.serif, fontWeight: 600, fontSize: 60, color: color.opinion, letterSpacing: '0.03em'},
  data: {fontFamily: font.sans, fontWeight: 700, fontSize: 56, color: color.data, letterSpacing: '0.01em'},
  label: {fontFamily: font.sans, fontWeight: 500, fontSize: 38, color: color.ink, letterSpacing: '0.02em'},
  tag: {fontFamily: font.sans, fontWeight: 400, fontSize: 27, color: color.dim, letterSpacing: '0.03em'},
  small: {fontFamily: font.sans, fontWeight: 500, fontSize: 30, color: color.dim, letterSpacing: '0.04em'},
};

export const motion = {
  inDur: 30, // 文字入场 0.5 秒
  charStagger: 1.6, // 逐字显影间隔（帧）
  outDur: 18, // 退场 0.3 秒
  rise: 18,
  blur: 12,
};

export const safe = {x: 120, y: 96};
