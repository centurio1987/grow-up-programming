import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 다섯 규약을 그대로 따른다
 *
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세우고 `prefixSumRangeQuery-guide.sim.ts`
 * 가 파생 배열에, `diffArrayRangeUpdate-guide.sim.ts` 가 두 종류의 걸음에 적용한 것이다.
 * 이 편에서 새로 생기는 자리는 **배열이 한 번도 바뀌지 않는다**는 것 하나라, 그 처리를
 * 적어 둔다.
 *
 * 1. **`array` 는 입력 배열 `A` 를 그대로 담는다.** 이 절차는 배열을 고치지 않고 읽기만
 *    하므로 프레임마다 같은 배열이 실린다. 바뀌는 것은 두 스칼라와 강조 자리다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 보는 칸 번호 `i` 는 자리라서 `pointers`
 *    로 두고, 거기서 나온 수(`prev` · `best`)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 이번 걸음에서 읽은 칸, `marked` 는 지금 `best` 를 만든 구간의 칸.**
 *    `marked` 가 걸음마다 늘거나 줄어드는 것이 이 절차의 핵심 장면이다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 셋이다.
 */
export const carry = {
  view: ["array", "keyValue"] as const,
  title: "칸마다 이어받기 — A = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
  result: "6",
  steps: [
    {
      title: "T1 초기화 i=0",
      detail:
        "prev 와 best 를 둘 다 A[0] = -2 로 시작한다. 빈 부분 배열이 후보가 아니라서 0 에서 출발하지 않는다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [0],
      marked: [0],
      pointers: { i: 0 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: -2 },
        { label: "best — 지금까지의 최대합", value: -2 },
        { label: "best 를 만든 구간", value: "[0,0]" },
      ],
    },
    {
      title: "T2 i=1",
      detail:
        "새로 시작하면 1, 이어 붙이면 -2 + 1 = -1 이다. 큰 쪽이 1 이라 칸 1 에서 새로 시작한다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [1],
      marked: [1],
      pointers: { i: 1 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 1 },
        { label: "best — 지금까지의 최대합", value: 1 },
        { label: "best 를 만든 구간", value: "[1,1]" },
      ],
    },
    {
      title: "T3 i=2",
      detail:
        "새로 시작하면 -3, 이어 붙이면 1 + (-3) = -2 다. 큰 쪽이 -2 라 이어 붙인다. best 는 1 그대로다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [2],
      marked: [1],
      pointers: { i: 2 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: -2 },
        { label: "best — 지금까지의 최대합", value: 1 },
        { label: "best 를 만든 구간", value: "[1,1]" },
      ],
    },
    {
      title: "T4 i=3",
      detail:
        "직전 최대합이 -2 로 음수라 이어 붙이면 2 이고, 새로 시작하면 4 다. 큰 쪽이 4 라 여기서 다시 시작한다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [3],
      marked: [3],
      pointers: { i: 3 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 4 },
        { label: "best — 지금까지의 최대합", value: 4 },
        { label: "best 를 만든 구간", value: "[3,3]" },
      ],
    },
    {
      title: "T5 i=4",
      detail:
        "값이 음수인데도 이어 붙인다. 4 + (-1) = 3 이 새로 시작하는 -1 보다 크기 때문이다. best 는 4 그대로다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [4],
      marked: [3],
      pointers: { i: 4 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 3 },
        { label: "best — 지금까지의 최대합", value: 4 },
        { label: "best 를 만든 구간", value: "[3,3]" },
      ],
    },
    {
      title: "T6 i=5",
      detail:
        "3 + 2 = 5 로 이어 붙인다. prev 가 best 를 넘어서 best 도 5 가 되고, 표시된 구간이 세 칸으로 늘어난다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [5],
      marked: [3, 4, 5],
      pointers: { i: 5 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 5 },
        { label: "best — 지금까지의 최대합", value: 5 },
        { label: "best 를 만든 구간", value: "[3,5]" },
      ],
    },
    {
      title: "T7 i=6",
      detail:
        "5 + 1 = 6 으로 이어 붙인다. 이 걸음이 답을 만든다 — 뒤로는 best 가 더 커지지 않는다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [6],
      marked: [3, 4, 5, 6],
      pointers: { i: 6 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 6 },
        { label: "best — 지금까지의 최대합", value: 6 },
        { label: "best 를 만든 구간", value: "[3,6]" },
      ],
    },
    {
      title: "T8 i=7",
      detail:
        "6 + (-5) = 1 이라 prev 가 1 로 줄어든다. best 는 6 을 그대로 들고 있어서 답이 사라지지 않는다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [7],
      marked: [3, 4, 5, 6],
      pointers: { i: 7 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 1 },
        { label: "best — 지금까지의 최대합", value: 6 },
        { label: "best 를 만든 구간", value: "[3,6]" },
      ],
    },
    {
      title: "T9 i=8",
      detail:
        "마지막 칸이다. 1 + 4 = 5 로 이어 붙이지만 6 보다 작아 best 가 바뀌지 않는다. 답은 6 이다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      highlight: [8],
      marked: [3, 4, 5, 6],
      pointers: { i: 8 },
      entries: [
        { label: "prev — 칸 i 에서 끝나는 최대합", value: 5 },
        { label: "best — 지금까지의 최대합", value: 6 },
        { label: "best 를 만든 구간", value: "[3,6]" },
      ],
    },
  ] satisfies Frame[],
};
