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
];
