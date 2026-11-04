import {BAR} from './theme';

/** 每个镜头的长度（小节）。改这里，全片时间线自动重排。 */
export const SHOTS = [
  {id: '01', bars: 1.5, layer: 0},
  {id: '02', bars: 1.5, layer: 0},
  {id: '03', bars: 2.5, layer: 0},
  {id: '04', bars: 1, layer: 0},
  {id: '05', bars: 2, layer: 0},
  {id: '06', bars: 1.5, layer: 1},
  {id: '07', bars: 4, layer: 1},
  {id: '08', bars: 2, layer: 1},
  {id: '09', bars: 4.5, layer: 2},
  {id: '10', bars: 3, layer: 2},
  {id: '11', bars: 3, layer: 3},
  {id: '12', bars: 4.5, layer: 3},
  {id: '13', bars: 4.5, layer: 3},
  {id: '14', bars: 4.5, layer: 3},
  {id: '15', bars: 3, layer: 3},
  {id: '16', bars: 3, layer: 3},
  {id: '17', bars: 6.5, layer: 4},
  {id: '18', bars: 4, layer: 4},
  {id: '19', bars: 4.5, layer: 5},
  {id: '20', bars: 3.5, layer: 6},
  {id: '21', bars: 4, layer: 6},
  {id: '22', bars: 3.5, layer: 6},
  {id: '23', bars: 2, layer: 6},
] as const;

export const LAYERS = ['开场', '第一层', '第二层', '第三层', '第四层', '反面', '收尾'];

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
export const at = (id: string) => starts[id];
/** 镜头长度（帧） */
export const len = (id: string) => lens[id];
/** 从 a 镜开头到 b 镜结尾的长度 */
export const span = (a: string, z: string) => starts[z] + lens[z] - starts[a];

export const layerOfFrame = (f: number) => {
  let cur = 0;
  for (const s of SHOTS) if (f >= starts[s.id]) cur = s.layer;
  return cur;
};

export const layerStart = (layer: number) => {
  for (const s of SHOTS) if (s.layer === layer) return starts[s.id];
  return 0;
};
