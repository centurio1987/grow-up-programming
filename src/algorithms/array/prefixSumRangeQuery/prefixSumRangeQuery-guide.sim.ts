import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(12)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 선례를 그대로 따른다
 *
 * 다섯 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세운 것이다. 이 편이 그 규약을
 * 처음으로 **파생 배열이 주인공인 문제**에 적용한 자리라, 어긋나기 쉬운 두 자리를 적어 둔다.
 *
 * 1. **`array` 는 입력 배열 `A` 만 담는다.** 이 편의 주인공은 누적합 표 `P` 지만 그것은
 *    파생 배열이라 `array` 에 넣지 않는다 — 넣으면 화면의 배열과 본문의 `A` 를 대조할 수
 *    없다. `P` 의 값은 규약 2 에 따라 **스칼라로 쪼개** `keyValue` 가 적는다. 표 전체를
 *    한 화면에 보이는 것은 md 쪽 ascii 그림이 진다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 더하는 칸 `i` 와 질의 구간의 두 끝
 *    `l`·`r` 은 자리라서 `pointers` 로 배열 위에 얹지 않고 그대로 이름표를 붙인다.
 *    거기서 나온 수(`P[i]`·`P[l]`·구간의 합)는 `keyValue` 가 적는다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`·`l`·`r`.
 * 4. **`highlight` 는 지금 보고 있는 칸, `marked` 는 이미 표에 반영을 마친 칸.**
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 그래서 전처리와
 *    질의를 **export 둘로 갈랐다** — 한 벌로 묶으면 전처리 프레임에서 `P[l]`·`P[r+1]` 이
 *    빈 항목이 되고, 그 순간 규약 5 가 깨진다. 마커도 둘이라 P6 이 1대1로 맞는다.
 */
export const build = {
  view: ["array", "keyValue"] as const,
  title: "누적합 표 채우기 — A = [3, 1, 4, 1, 5, 9]",
  result: "[0, 3, 4, 8, 9, 14, 23]",
  steps: [
    {
      title: "T2 i=0",
      detail: "빈 구간의 합 0 에 A[0]=3 을 더해 표의 두 번째 칸을 채운다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [0],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "P[i]", value: 0 },
        { label: "A[i]", value: 3 },
        { label: "P[i+1]", value: 3 },
        { label: "채운 칸 수", value: 2 },
      ],
    },
    {
      title: "T3 i=1",
      detail: "직전 칸 3 에 A[1]=1 을 더한다. 앞 두 개의 합이다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [1],
      marked: [0],
      pointers: { i: 1 },
      entries: [
        { label: "P[i]", value: 3 },
        { label: "A[i]", value: 1 },
        { label: "P[i+1]", value: 4 },
        { label: "채운 칸 수", value: 3 },
      ],
    },
    {
      title: "T4 i=2",
      detail: "직전 칸 4 에 A[2]=4 를 더한다. 앞 세 개의 합이다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [2],
      marked: [0, 1],
      pointers: { i: 2 },
      entries: [
        { label: "P[i]", value: 4 },
        { label: "A[i]", value: 4 },
        { label: "P[i+1]", value: 8 },
        { label: "채운 칸 수", value: 4 },
      ],
    },
    {
      title: "T5 i=3",
      detail: "직전 칸 8 에 A[3]=1 을 더한다. 덧셈은 언제나 한 번뿐이다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [3],
      marked: [0, 1, 2],
      pointers: { i: 3 },
      entries: [
        { label: "P[i]", value: 8 },
        { label: "A[i]", value: 1 },
        { label: "P[i+1]", value: 9 },
        { label: "채운 칸 수", value: 5 },
      ],
    },
    {
      title: "T6 i=4",
      detail: "직전 칸 9 에 A[4]=5 를 더한다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [4],
      marked: [0, 1, 2, 3],
      pointers: { i: 4 },
      entries: [
        { label: "P[i]", value: 9 },
        { label: "A[i]", value: 5 },
        { label: "P[i+1]", value: 14 },
        { label: "채운 칸 수", value: 6 },
      ],
    },
    {
      title: "T7 i=5",
      detail: "마지막 칸. 직전 칸 14 에 A[5]=9 를 더해 전체 합 23 이 된다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [5],
      marked: [0, 1, 2, 3, 4],
      pointers: { i: 5 },
      entries: [
        { label: "P[i]", value: 14 },
        { label: "A[i]", value: 9 },
        { label: "P[i+1]", value: 23 },
        { label: "채운 칸 수", value: 7 },
      ],
    },
  ] satisfies Frame[],
};

/**
 * 질의 다섯 개를 순서대로 답하는 벌. 표는 이미 다 채워져 있고 여기서는 읽기만 한다.
 *
 * `highlight` 가 질의 구간이고, 그 구간의 합은 표의 두 칸을 뺀 값이다 — 화면에서 강조된
 * 칸의 개수가 몇이든 읽는 칸은 언제나 둘이라는 것이 이 벌이 보이는 것이다.
 */
export const answer = {
  view: ["array", "keyValue"] as const,
  title: "질의 다섯 개 — A = [3, 1, 4, 1, 5, 9]",
  result: "[6, 23, 5, 8, 19]",
  steps: [
    {
      title: "T8 질의 l=1 r=3",
      detail: "P[4] − P[1] = 9 − 3 = 6. 실제로 1 + 4 + 1 이다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [1, 2, 3],
      marked: [],
      pointers: { l: 1, r: 3 },
      entries: [
        { label: "P[l]", value: 3 },
        { label: "P[r+1]", value: 9 },
        { label: "구간의 합", value: 6 },
        { label: "답의 개수", value: 1 },
      ],
    },
    {
      title: "T9 질의 l=0 r=5",
      detail: "배열 전체다. P[6] − P[0] = 23 − 0 = 23.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [0, 1, 2, 3, 4, 5],
      marked: [],
      pointers: { l: 0, r: 5 },
      entries: [
        { label: "P[l]", value: 0 },
        { label: "P[r+1]", value: 23 },
        { label: "구간의 합", value: 23 },
        { label: "답의 개수", value: 2 },
      ],
    },
    {
      title: "T10 질의 l=4 r=4",
      detail: "한 칸짜리 구간. P[5] − P[4] = 14 − 9 = 5 로 A[4] 하나만 남는다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [4],
      marked: [],
      pointers: { l: 4, r: 4 },
      entries: [
        { label: "P[l]", value: 9 },
        { label: "P[r+1]", value: 14 },
        { label: "구간의 합", value: 5 },
        { label: "답의 개수", value: 3 },
      ],
    },
    {
      title: "T11 질의 l=0 r=2",
      detail: "왼쪽 끝이 0 이라 P[0]=0 을 뺀다. 특수한 분기가 없다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [0, 1, 2],
      marked: [],
      pointers: { l: 0, r: 2 },
      entries: [
        { label: "P[l]", value: 0 },
        { label: "P[r+1]", value: 8 },
        { label: "구간의 합", value: 8 },
        { label: "답의 개수", value: 4 },
      ],
    },
    {
      title: "T12 질의 l=2 r=5",
      detail: "오른쪽 끝이 배열의 마지막이라 표의 마지막 칸 P[6] 을 읽는다.",
      array: [3, 1, 4, 1, 5, 9],
      highlight: [2, 3, 4, 5],
      marked: [],
      pointers: { l: 2, r: 5 },
      entries: [
        { label: "P[l]", value: 4 },
        { label: "P[r+1]", value: 23 },
        { label: "구간의 합", value: 19 },
        { label: "답의 개수", value: 5 },
      ],
    },
  ] satisfies Frame[],
};
