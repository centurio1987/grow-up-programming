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
];
