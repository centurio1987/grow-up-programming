import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(7)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 다섯 규약을 그대로 따른다
 *
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세우고 `kadane-guide.sim.ts` 가 「배열이
 * 한 번도 바뀌지 않는 절차」에 적용한 것이다. 이 편에서 새로 생기는 자리는 **한 프레임이
 * 스칼라 둘을 함께 바꾼다**는 것 하나라, 그 처리를 적어 둔다.
 *
 * 1. **`array` 는 입력 배열 `A` 를 그대로 담는다.** 이 절차는 배열을 고치지 않고 읽기만
 *    하므로 프레임마다 같은 배열이 실린다. 바뀌는 것은 세 스칼라와 강조 자리다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 보는 칸 번호 `i` 는 자리라서 `pointers`
 *    로 두고, 거기서 나온 수(`curMax` · `curMin` · `best`)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 이번 걸음에서 읽은 칸, `marked` 는 지금 `best` 를 만든 구간의 칸.**
 *    `marked` 가 걸음마다 늘어나는 것이 이 절차의 핵심 장면이다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 넷이다.
 *    `curMin` 을 `curMax` 바로 아래 두는 것이 이 편의 요점이라, 순서를 바꾸지 않는다.
 */
export const pair = {
  view: ["array", "keyValue"] as const,
  title: "최댓값과 최솟값을 함께 이어받기 — A = [2, -3, -2, 4, 0, -1]",
  result: "48",
  steps: [
    {
      title: "T1 초기화 i=0",
      detail:
        "curMax · curMin · best 를 모두 A[0] = 2 로 시작한다. 빈 부분 배열이 후보가 아니라서 1 이나 0 에서 출발하지 않는다.",
      array: [2, -3, -2, 4, 0, -1],
      highlight: [0],
      marked: [0],
      pointers: { i: 0 },
      entries: [
        { label: "curMax — 칸 i 에서 끝나는 곱의 최댓값", value: 2 },
        { label: "curMin — 칸 i 에서 끝나는 곱의 최솟값", value: 2 },
        { label: "best — 지금까지의 최댓값", value: 2 },
        { label: "best 를 만든 구간", value: "[0,0]" },
      ],
    },
    {
      title: "T2 i=1",
      detail:
        "후보는 -3, 2 × (-3) = -6, 2 × (-3) = -6 이다. curMax 는 -3 으로 내려가고 curMin 은 -6 이 된다. best 는 2 그대로다.",
      array: [2, -3, -2, 4, 0, -1],
      highlight: [1],
      marked: [0],
      pointers: { i: 1 },
      entries: [
        { label: "curMax — 칸 i 에서 끝나는 곱의 최댓값", value: -3 },
        { label: "curMin — 칸 i 에서 끝나는 곱의 최솟값", value: -6 },
        { label: "best — 지금까지의 최댓값", value: 2 },
        { label: "best 를 만든 구간", value: "[0,0]" },
      ],
    },
    {
      title: "T3 i=2",
      detail:
        "후보는 -2, (-3) × (-2) = 6, (-6) × (-2) = 12 다. 직전 최솟값 -6 이 부호가 뒤집혀 12 로 최댓값이 된다. best 가 12 로 커진다.",
      array: [2, -3, -2, 4, 0, -1],
      highlight: [2],
      marked: [0, 1, 2],
      pointers: { i: 2 },
      entries: [
        { label: "curMax — 칸 i 에서 끝나는 곱의 최댓값", value: 12 },
        { label: "curMin — 칸 i 에서 끝나는 곱의 최솟값", value: -2 },
        { label: "best — 지금까지의 최댓값", value: 12 },
        { label: "best 를 만든 구간", value: "[0,2]" },
      ],
    },
    {
      title: "T4 i=3",
      detail:
        "후보는 4, 12 × 4 = 48, (-2) × 4 = -8 이다. 이번에는 최댓값에 이어 붙인 쪽이 커서 48 이 되고 best 도 48 이 된다.",
      array: [2, -3, -2, 4, 0, -1],
      highlight: [3],
      marked: [0, 1, 2, 3],
      pointers: { i: 3 },
      entries: [
        { label: "curMax — 칸 i 에서 끝나는 곱의 최댓값", value: 48 },
        { label: "curMin — 칸 i 에서 끝나는 곱의 최솟값", value: -8 },
        { label: "best — 지금까지의 최댓값", value: 48 },
        { label: "best 를 만든 구간", value: "[0,3]" },
      ],
    },
    {
      title: "T5 i=4",
      detail:
        "A[4] = 0 이라 후보 셋이 모두 0 이다. curMax 와 curMin 이 함께 0 으로 내려가고, best 는 48 을 그대로 들고 있다.",
      array: [2, -3, -2, 4, 0, -1],
      highlight: [4],
      marked: [0, 1, 2, 3],
      pointers: { i: 4 },
      entries: [
        { label: "curMax — 칸 i 에서 끝나는 곱의 최댓값", value: 0 },
        { label: "curMin — 칸 i 에서 끝나는 곱의 최솟값", value: 0 },
        { label: "best — 지금까지의 최댓값", value: 48 },
        { label: "best 를 만든 구간", value: "[0,3]" },
      ],
    },
    {
      title: "T6 i=5",
      detail:
        "마지막 칸이다. 후보는 -1, 0, 0 이라 curMax 가 0, curMin 이 -1 이 된다. best 는 끝까지 48 이고 그것이 답이다.",
      array: [2, -3, -2, 4, 0, -1],
      highlight: [5],
      marked: [0, 1, 2, 3],
      pointers: { i: 5 },
      entries: [
        { label: "curMax — 칸 i 에서 끝나는 곱의 최댓값", value: 0 },
        { label: "curMin — 칸 i 에서 끝나는 곱의 최솟값", value: -1 },
        { label: "best — 지금까지의 최댓값", value: 48 },
        { label: "best 를 만든 구간", value: "[0,3]" },
      ],
    },
  ] satisfies Frame[],
};
