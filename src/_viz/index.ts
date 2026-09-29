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
  CellStage,
  CellStageFilm,
  type CellStageFilmProps,
  type CellStageProps,
  cellStageSize,
  filmCells,
  type StageFrame,
  type StageRow,
  type StageTone,
} from "./patterns/CellStage";
export {
  type KeyValueData,
  KeyValueTable,
  type KeyValueTableProps,
  keyValueColumns,
  keyValueRows,
  type MapKey,
} from "./patterns/KeyValueTable";
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
  type EdgeKind,
  type EdgeState,
  type GraphEdge,
  type GraphFrame,
  type GraphGroup,
  type GraphNode,
  type GraphStrip,
  NodeGraph,
  NodeGraphFilm,
  type NodeGraphFilmProps,
  type NodeGraphProps,
  type NodeGraphScene,
  type NodeId,
  nodeGraphSize,
  treeLayout,
} from "./patterns/NodeGraph";
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
export {
  type GraphPlayerSpec,
  isPlayerSpec,
  type LevelsPlayerSpec,
  type PlayerFrame,
  type PlayerSpec,
  playerFrames,
  StepPlayer,
} from "./player/StepPlayer";
export { renderToSvg, type VizPreset } from "./render";
