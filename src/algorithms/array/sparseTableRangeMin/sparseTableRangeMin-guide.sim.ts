import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(15)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 규약을 그대로 따른다
 *
 * 다섯 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세웠고 `prefixSumRangeQuery` 가
 * 파생 배열이 주인공인 문제에 처음 적용했다. 이 편은 파생 배열이 **2 차원**이라 어긋나기
 * 쉬운 자리를 적어 둔다.
 *
 * 1. **`array` 는 입력 배열 `A` 만 담는다.** 이 편의 주인공은 층으로 쌓은 표지만 그것은
 *    파생 배열이라 `array` 에 넣지 않는다 — 넣으면 화면의 배열과 본문의 `A` 를 대조할 수
 *    없다. 표의 값은 규약 2 에 따라 **스칼라로 쪼개** `keyValue` 가 적고, 표 전체를 한
 *    화면에 보이는 것은 md 쪽 ascii 그림이 진다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 채우는 칸 `i` 와 질의 구간의 두 끝
 *    `l`·`r` 은 자리라서 `pointers` 로 두고, 거기서 나온 수는 `keyValue` 가 적는다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`·`l`·`r`.
 * 4. **`highlight` 는 지금 다루는 칸이 덮는 자리, `marked` 는 겹치는 자리.** 표를 쌓는
 *    벌에서는 이미 채운 칸이 덮은 자리가 `marked` 이고, 질의를 답하는 벌에서는 **두 조각이
 *    함께 덮는 자리**가 `marked` 다 — 이 절차의 결정적 관찰이 그 자리라 화면에서 갈라 둔다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 그래서 표를
 *    쌓는 벌과 질의를 답하는 벌을 **export 둘로 갈랐다** — 한 벌로 묶으면 표를 쌓는
 *    프레임에서 조각의 값이 빈 항목이 되고, 그 순간 규약 5 가 깨진다.
 */
export const build = {
  view: ["array", "keyValue"] as const,
  title: "표를 쌓는다 — A = [5, 2, 7, 4, 6, 3]",
  result: "[2, 2, 3]",
  steps: [
    {
      title: "T3 k=1 i=0",
      detail: "1 층의 칸 0 — 아래층의 칸 0 와 칸 1 를 견줘 2 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [0, 1],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "층 k", value: 1 },
        { label: "아래층 왼쪽 값", value: 5 },
        { label: "아래층 오른쪽 값", value: 2 },
        { label: "새 칸의 값", value: 2 },
        { label: "채운 칸 수", value: 1 },
      ],
    },
    {
      title: "T4 k=1 i=1",
      detail: "1 층의 칸 1 — 아래층의 칸 1 와 칸 2 를 견줘 2 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [1, 2],
      marked: [0, 1],
      pointers: { i: 1 },
      entries: [
        { label: "층 k", value: 1 },
        { label: "아래층 왼쪽 값", value: 2 },
        { label: "아래층 오른쪽 값", value: 7 },
        { label: "새 칸의 값", value: 2 },
        { label: "채운 칸 수", value: 2 },
      ],
    },
    {
      title: "T5 k=1 i=2",
      detail: "1 층의 칸 2 — 아래층의 칸 2 와 칸 3 를 견줘 4 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [2, 3],
      marked: [0, 1, 2],
      pointers: { i: 2 },
      entries: [
        { label: "층 k", value: 1 },
        { label: "아래층 왼쪽 값", value: 7 },
        { label: "아래층 오른쪽 값", value: 4 },
        { label: "새 칸의 값", value: 4 },
        { label: "채운 칸 수", value: 3 },
      ],
    },
    {
      title: "T6 k=1 i=3",
      detail: "1 층의 칸 3 — 아래층의 칸 3 와 칸 4 를 견줘 4 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [3, 4],
      marked: [0, 1, 2, 3],
      pointers: { i: 3 },
      entries: [
        { label: "층 k", value: 1 },
        { label: "아래층 왼쪽 값", value: 4 },
        { label: "아래층 오른쪽 값", value: 6 },
        { label: "새 칸의 값", value: 4 },
        { label: "채운 칸 수", value: 4 },
      ],
    },
    {
      title: "T7 k=1 i=4",
      detail: "1 층의 칸 4 — 아래층의 칸 4 와 칸 5 를 견줘 3 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [4, 5],
      marked: [0, 1, 2, 3, 4],
      pointers: { i: 4 },
      entries: [
        { label: "층 k", value: 1 },
        { label: "아래층 왼쪽 값", value: 6 },
        { label: "아래층 오른쪽 값", value: 3 },
        { label: "새 칸의 값", value: 3 },
        { label: "채운 칸 수", value: 5 },
      ],
    },
    {
      title: "T8 k=2 i=0",
      detail: "2 층의 칸 0 — 아래층의 칸 0 와 칸 2 를 견줘 2 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [0, 1, 2, 3],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "층 k", value: 2 },
        { label: "아래층 왼쪽 값", value: 2 },
        { label: "아래층 오른쪽 값", value: 4 },
        { label: "새 칸의 값", value: 2 },
        { label: "채운 칸 수", value: 6 },
      ],
    },
    {
      title: "T9 k=2 i=1",
      detail: "2 층의 칸 1 — 아래층의 칸 1 와 칸 3 를 견줘 2 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [1, 2, 3, 4],
      marked: [0, 1, 2, 3],
      pointers: { i: 1 },
      entries: [
        { label: "층 k", value: 2 },
        { label: "아래층 왼쪽 값", value: 2 },
        { label: "아래층 오른쪽 값", value: 4 },
        { label: "새 칸의 값", value: 2 },
        { label: "채운 칸 수", value: 7 },
      ],
    },
    {
      title: "T10 k=2 i=2",
      detail: "2 층의 칸 2 — 아래층의 칸 2 와 칸 4 를 견줘 3 을 적는다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [2, 3, 4, 5],
      marked: [0, 1, 2, 3, 4],
      pointers: { i: 2 },
      entries: [
        { label: "층 k", value: 2 },
        { label: "아래층 왼쪽 값", value: 4 },
        { label: "아래층 오른쪽 값", value: 3 },
        { label: "새 칸의 값", value: 3 },
        { label: "채운 칸 수", value: 8 },
      ],
    },
  ] satisfies Frame[],
};

/**
 * 질의 다섯 개를 순서대로 답하는 벌. 표는 이미 다 쌓여 있고 여기서는 읽기만 한다.
 *
 * `marked` 가 두 조각이 함께 덮는 자리다 — 다섯 프레임 어디에도 그 자리가 비지 않는 것이
 * 이 벌이 보이는 것이고, 그래도 답이 안 바뀌는 이유를 본문의 「멈춤」이 값으로 짚는다.
 */
export const answer = {
  view: ["array", "keyValue"] as const,
  title: "질의 다섯 개 — A = [5, 2, 7, 4, 6, 3]",
  result: "[2, 2, 4, 2, 3]",
  steps: [
    {
      title: "T11 질의 l=0 r=4",
      detail: "칸 수 5 이라 층 2 를 쓴다. 두 조각의 최솟값이 2 다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [0, 1, 2, 3, 4],
      marked: [1, 2, 3],
      pointers: { l: 0, r: 4 },
      entries: [
        { label: "층 k", value: 2 },
        { label: "왼쪽 조각의 값", value: 2 },
        { label: "오른쪽 조각의 값", value: 2 },
        { label: "구간의 최솟값", value: 2 },
        { label: "답한 개수", value: 1 },
      ],
    },
    {
      title: "T12 질의 l=1 r=2",
      detail: "칸 수 2 이라 층 1 를 쓴다. 두 조각의 최솟값이 2 다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [1, 2],
      marked: [1, 2],
      pointers: { l: 1, r: 2 },
      entries: [
        { label: "층 k", value: 1 },
        { label: "왼쪽 조각의 값", value: 2 },
        { label: "오른쪽 조각의 값", value: 2 },
        { label: "구간의 최솟값", value: 2 },
        { label: "답한 개수", value: 2 },
      ],
    },
    {
      title: "T13 질의 l=3 r=3",
      detail: "칸 수 1 이라 층 0 를 쓴다. 두 조각의 최솟값이 4 다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [3],
      marked: [3],
      pointers: { l: 3, r: 3 },
      entries: [
        { label: "층 k", value: 0 },
        { label: "왼쪽 조각의 값", value: 4 },
        { label: "오른쪽 조각의 값", value: 4 },
        { label: "구간의 최솟값", value: 4 },
        { label: "답한 개수", value: 3 },
      ],
    },
    {
      title: "T14 질의 l=0 r=5",
      detail: "칸 수 6 이라 층 2 를 쓴다. 두 조각의 최솟값이 2 다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [0, 1, 2, 3, 4, 5],
      marked: [2, 3],
      pointers: { l: 0, r: 5 },
      entries: [
        { label: "층 k", value: 2 },
        { label: "왼쪽 조각의 값", value: 2 },
        { label: "오른쪽 조각의 값", value: 3 },
        { label: "구간의 최솟값", value: 2 },
        { label: "답한 개수", value: 4 },
      ],
    },
    {
      title: "T15 질의 l=2 r=5",
      detail: "칸 수 4 이라 층 2 를 쓴다. 두 조각의 최솟값이 3 다.",
      array: [5, 2, 7, 4, 6, 3],
      highlight: [2, 3, 4, 5],
      marked: [2, 3, 4, 5],
      pointers: { l: 2, r: 5 },
      entries: [
        { label: "층 k", value: 2 },
        { label: "왼쪽 조각의 값", value: 3 },
        { label: "오른쪽 조각의 값", value: 3 },
        { label: "구간의 최솟값", value: 3 },
        { label: "답한 개수", value: 5 },
      ],
    },
  ] satisfies Frame[],
};
