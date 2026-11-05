import {BAR} from './theme';

/**
 * 每个镜头的长度（小节，100 BPM，1 小节 = 2.4 秒）。改这里，全片时间线自动重排。
 * 镜头用名字而不是编号，插镜头时各场景里的引用不会错位；分镜.md 里的编号按这里的顺序数。
 */
export const SHOTS = [
  // 开场：一个小测试
  {id: 'quiz', bars: 2, layer: 0},
  {id: 'stamp', bars: 2, layer: 0},
  {id: 'reveal', bars: 4.5, layer: 0},
  {id: 'wrong', bars: 1.5, layer: 0},
  {id: 'title', bars: 2.5, layer: 0},
  // 先说「土」这个字
  {id: 'word', bars: 4, layer: 1},
  {id: 'wall', bars: 4.5, layer: 1},
  // 第一层：大多数人不是你
  {id: 'phone', bars: 1.5, layer: 2},
  {id: 'grid', bars: 4, layer: 2},
  {id: 'key1', bars: 2, layer: 2},
  {id: 'flip', bars: 3.5, layer: 2},
  // 第二层：定义好坏的人，不是掏钱的人
  {id: 'scale', bars: 5, layer: 3},
  {id: 'tickets', bars: 4, layer: 3},
  {id: 'sorter', bars: 5, layer: 3},
  {id: 'daolang', bars: 4.5, layer: 3},
  // 第三层：土，是约束下的最优解
  {id: 'lockIntro', bars: 3, layer: 4},
  {id: 'scarcity', bars: 5, layer: 4},
  {id: 'money', bars: 4.5, layer: 4},
  {id: 'time', bars: 5, layer: 4},
  {id: 'know', bars: 8, layer: 4},
  {id: 'express', bars: 3, layer: 4},
  {id: 'allOpen', bars: 3.5, layer: 4},
  // 第四层：土的东西会往上走
  {id: 'climb', bars: 8.5, layer: 5},
  {id: 'disrupt', bars: 4, layer: 5},
  {id: 'relabel', bars: 3.5, layer: 5},
  // 反面：下沉也不是神话
  {id: 'profit', bars: 4.5, layer: 6},
  {id: 'survive', bars: 5.5, layer: 6},
  // 收尾：每个人都是某个领域的下沉用户
  {id: 'rings', bars: 4, layer: 7},
  {id: 'many', bars: 3.5, layer: 7},
  {id: 'lock', bars: 3.5, layer: 7},
  {id: 'sea', bars: 3, layer: 7},
] as const;

export type ShotId = (typeof SHOTS)[number]['id'];

export const LAYERS = ['开场', '先说「土」', '第一层', '第二层', '第三层', '第四层', '反面', '收尾'];

const starts: Record<string, number> = {};
const lens: Record<string, number> = {};
let acc = 0;
for (const s of SHOTS) {
  starts[s.id] = acc;
  lens[s.id] = Math.round(s.bars * BAR);
  acc += lens[s.id];
}
export const TOTAL = acc;

/** 镜头起点（全片帧） */
export const at = (id: ShotId) => starts[id];
/** 镜头长度（帧） */
export const len = (id: ShotId) => lens[id];
/** 从 a 镜开头到 z 镜结尾的长度 */
export const span = (a: ShotId, z: ShotId) => starts[z] + lens[z] - starts[a];
/** z 镜相对于 a 镜开头的起点（同一个场景里跨镜头时用） */
export const rel = (a: ShotId, z: ShotId) => starts[z] - starts[a];
/** 分镜表里的编号（01、02……） */
export const shotNo = (id: ShotId) => String(SHOTS.findIndex((s) => s.id === id) + 1).padStart(2, '0');

export const layerOfFrame = (f: number) => {
  let cur = 0;
  for (const s of SHOTS) if (f >= starts[s.id]) cur = s.layer;
  return cur;
};

export const layerStart = (layer: number) => {
  for (const s of SHOTS) if (s.layer === layer) return starts[s.id];
  return 0;
};
