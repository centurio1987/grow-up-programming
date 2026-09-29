/**
 * 알고리즘 도식 패턴의 채택 메타 — 시각화 패키지 type-meta 와 같은 모양(KAN-057).
 *
 * 이 저장소에서 먼저 만들고 검증 뒤 bbangto-ui 로 올린다(유저 결정 2026-09-27). 그때 이 메타가
 * 그대로 `vizTypeRegistry` 항목이 되도록 필드 이름을 맞춘다. id 는 패키지 대역(VT-1xx~7xx)과
 * 겹치지 않게 `ALGO-` 접두를 쓴다.
 */

export interface AlgoVizMeta {
  readonly id: string;
  readonly name: string;
  readonly exportName: string;
  readonly summary: string;
  readonly dataShape: readonly string[];
  readonly structuralTraits: readonly string[];
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
}

export const ALGO_VIZ_META: readonly AlgoVizMeta[] = [
  {
    id: "ALGO-P1",
    name: "Array Strip",
    exportName: "ArrayStrip",
    summary: "인덱스 눈금 + 값 칸 한 줄",
    dataShape: ["sequence"],
    structuralTraits: ["sequential", "quantitative"],
    useWhen: [
      "배열의 값과 자리를 함께 보여야 할 때",
      "칸 몇 개의 상태(강조·겹침·범위 밖)를 가를 때",
    ],
    avoidWhen: ["값의 크기 비교가 요점이면 BarChart", "칸이 32 를 넘으면 표"],
  },
  {
    id: "ALGO-P2",
    name: "Range Cover",
    exportName: "RangeCover",
    summary: "배열 띠 + 구간 괄호, 여러 괄호가 함께 덮는 칸은 겹침",
    dataShape: ["sequence", "part-to-whole"],
    structuralTraits: ["sequential", "paired"],
    useWhen: [
      "질의 구간과 그것을 덮는 조각을 한 장에 보일 때",
      "겹친 칸이 어디인지가 요점일 때",
    ],
    avoidWhen: [
      "구간이 넷을 넘으면 표로 나눈다",
      "구간 사이 순서가 요점이면 StepTrace",
    ],
  },
  {
    id: "ALGO-P3",
    name: "Level Table",
    exportName: "LevelTable",
    summary:
      "층마다 칸 수가 줄어드는 표, 한 칸이 읽은 아래층 두 칸을 잇는 변형",
    dataShape: ["sequence", "hierarchy"],
    structuralTraits: ["nested", "sequential", "quantitative"],
    useWhen: [
      "미리 계산한 층 구조(Sparse Table·이진 올리기)를 한 장에 보일 때",
      "위층 한 칸이 아래층 어느 칸에서 나오는지 보일 때",
    ],
    avoidWhen: [
      "층이 다섯을 넘거나 칸이 32 를 넘으면 표",
      "트리 모양 부모-자식이면 Hierarchy",
    ],
  },
  {
    id: "ALGO-P4",
    name: "Step Trace",
    exportName: "StepTrace",
    summary: "T# 걸음 배지 + 그 걸음이 한 일 한 줄, 지난·현재·남은 걸음 구별",
    dataShape: ["process", "temporal"],
    structuralTraits: ["sequential", "quantitative"],
    useWhen: [
      "코드를 한 걸음씩 실행한 값을 순서대로 보일 때",
      "본문의 T# 와 같은 번호로 걸음을 가리킬 때",
    ],
    avoidWhen: [
      "걸음마다 여러 열의 값을 견줘야 하면 표",
      "분기가 있으면 Flowchart",
    ],
  },
  {
    id: "ALGO-P5",
    name: "Layer Bars",
    exportName: "LayerBars",
    summary: "층의 칸 하나를 한 줄로 — 그 칸이 맡는 자리에만 배열 값을 놓는다",
    dataShape: ["sequence", "part-to-whole"],
    structuralTraits: ["sequential", "nested"],
    useWhen: [
      "한 층의 칸들이 어느 자리를 맡고 어디서 겹치는지 보일 때",
      "칸에 적힌 값보다 칸이 맡는 범위가 요점일 때",
    ],
    avoidWhen: [
      "칸에 적힌 값만 보이면 되면 LevelTable",
      "줄이 열다섯을 넘으면 표",
    ],
  },
  {
    id: "ALGO-P6",
    name: "Approach Ladder",
    exportName: "ApproachLadder",
    summary:
      "시도한 방법을 차례로 — 방법마다 기준별 통과·실패와 수치, 다음 시도로 넘어간 까닭, 버림·남음",
    dataShape: ["sequence", "comparison"],
    structuralTraits: ["sequential", "categorical"],
    useWhen: [
      "아이디어를 떠올리는 과정처럼 시도와 실패가 이어져 하나가 남을 때",
      "방법마다 같은 기준(답·시간·메모리)으로 통과와 실패를 보일 때",
    ],
    avoidWhen: [
      "앞뒤 인과가 없는 나란한 비교면 표",
      "시도가 여섯을 넘으면 그림이 길어진다 — 묶어서 줄인다",
    ],
  },
  {
    id: "ALGO-P7",
    name: "Cell Stage",
    exportName: "CellStage",
    summary:
      "걸음 재생 패널의 무대 — 알고리즘이 쌓는 구조 전체를 줄로 쌓고 걸음마다 칸 상태(끝남·읽음·새로 씀·아직)만 바꾼다",
    dataShape: ["sequence", "hierarchy", "change-over-time"],
    structuralTraits: ["sequential", "nested"],
    useWhen: [
      "걸음마다 구조의 어느 칸을 읽고 어느 칸을 썼는지 보일 때",
      "지금까지 쌓은 것과 앞으로 채울 자리를 한 화면에 둘 때",
    ],
    avoidWhen: [
      "구조가 그래프면 NodeGraph(걸음 재생 패널의 「그래프」 무대)",
      "걸음이 한두 개면 CellStage 한 장이나 RangeCover",
    ],
  },
  {
    id: "ALGO-P8",
    name: "Node Graph",
    exportName: "NodeGraph",
    summary:
      "정점 · 간선 · 정점 묶음 · 무대 아래 배열 띠 — 간선 종류는 선 모양으로, 상태는 칸과 같은 다섯으로 가른다",
    dataShape: ["network", "hierarchy", "change-over-time"],
    structuralTraits: ["relational", "nested", "categorical"],
    useWhen: [
      "정점이 어디와 이어져 있는가가 요점일 때(탐색 · 최단 경로 · 연결 요소 · 위상 정렬)",
      "깊이 우선 탐색 트리처럼 간선을 종류별로 갈라 보일 때(나무 · 되돌아감 · 가로지름 · 앞으로 감)",
      "정점 집합에 이름을 붙일 때(강한 연결 요소 · 연결 요소 · 한 단계의 정점들)",
      "그래프와 함께 알고리즘이 드는 목록(스택 · 대기열)을 한 장에 둘 때",
    ],
    avoidWhen: [
      "정점이 스물을 넘으면 간선이 겹친다 — 부분 그래프로 줄이거나 인접 행렬 표",
      "간선 없이 정점의 값만 비교하면 표",
      "구조가 배열 위에 쌓이는 층이면 LevelTable · CellStage",
    ],
  },
];
