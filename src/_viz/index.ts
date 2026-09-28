/** 알고리즘 가이드 도식(KAN-057) — 패턴과 렌더러의 공개 표면. */

export {
  ArrayStrip,
  type ArrayStripProps,
  type CellState,
  type StripRow,
} from "./patterns/ArrayStrip";
export {
  type LevelFocus,
  LevelTable,
  type LevelTableProps,
  levelLabel,
} from "./patterns/LevelTable";
export { ALGO_VIZ_META, type AlgoVizMeta } from "./patterns/meta";
export {
  overlapCells,
  type Range,
  RangeCover,
  type RangeCoverProps,
  type RangeTone,
} from "./patterns/RangeCover";
export { renderToSvg, type VizPreset } from "./render";
