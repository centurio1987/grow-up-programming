/** 알고리즘 가이드 도식(KAN-057) — 패턴과 렌더러의 공개 표면. */

export {
  type LogBar,
  LogBarChart,
  type LogBarChartProps,
} from "./components/LogBarChart";
export {
  type Approach,
  type ApproachCheck,
  ApproachLadder,
  type ApproachLadderProps,
  approachLadderWidth,
} from "./patterns/ApproachLadder";
export {
  ArrayStrip,
  type ArrayStripProps,
  type CellState,
  type StripRow,
} from "./patterns/ArrayStrip";
export {
  type LayerBar,
  LayerBars,
  type LayerBarsProps,
} from "./patterns/LayerBars";
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
export {
  StepTrace,
  type StepTraceProps,
  type TraceStep,
} from "./patterns/StepTrace";
export { renderToSvg, type VizPreset } from "./render";
