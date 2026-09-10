import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 두 번째 편 — 선례의 다섯을 이어받는다
 *
 * 다섯은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세웠다. 이 편에서 달라지는 것은 1번
 * 하나이고, 나머지 넷은 그대로다.
 *
 * 1. **`array` 는 카운터 배열 하나만 담는다.** 선례가 「입력 배열 그 자체」라고 적은 자리인데,
 *    이 문제는 입력이 둘이다 — 카운터 배열(길이 `N`)과 연산 배열 `A`(길이 `M`). 자리를
 *    가리키는 것은 카운터 배열 쪽이라 그것이 `array` 로 가고, `A` 는 진행 위치가 수 하나(`k`)
 *    라 `keyValue` 의 `A[k]` 항목이 적는다. 두 배열을 한 패널에 번갈아 담으면 화면의 배열이
 *    무엇인지 프레임마다 다시 읽어야 한다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 인덱스 `i` 는 `array` 가 그리고, `base`·`high`
 *    처럼 자리가 없는 수는 `keyValue` 가 적는다. 한 값을 두 패널에 함께 두지 않는다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같게 쓴다.** 여기서는 `i` 다.
 *    **최대 맞추기 프레임처럼 `i` 가 없는 자리는 그 프레임에서 뺀다** — 없는 값을 `0` 으로
 *    적으면 0번 카운터를 건드린 것으로 보인다.
 * 4. **`highlight` 는 이번 연산이 값을 적은 칸, `marked` 는 저장값이 `base` 보다 작아 아직
 *    옛 값을 들고 있는 칸.** 둘이 겹치면 프리셋이 `highlight` 색으로 그리므로
 *    (`src/_guide-sim/index.tsx` 의 `ArrayView`), `marked` 는 이번에 안 건드린 칸을 보이는
 *    자리로 쓴다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 첫 항목은 분기
 *    조건이 보는 값(`A[k]`), 마지막 항목은 **답을 결정하는 값**(`base`) 으로 고정한다.
 *    값이 없는 자리는 `—` 로 적는다.
 */
export const counters = {
  view: ["array", "keyValue"] as const,
  title: "maxCounters(5, [3, 4, 4, 6, 1, 4, 4])",
  result: "[3, 2, 2, 4, 2]",
  steps: [
    {
      title: "T1 시작",
      detail: "연산을 하나도 처리하지 않은 상태. 모든 칸이 0 이고 바닥값도 0 이다.",
      array: [0, 0, 0, 0, 0],
      highlight: [],
      marked: [],
      entries: [
        { label: "A[k]", value: "—" },
        { label: "counter[i]", value: "—" },
        { label: "high", value: 0 },
        { label: "base", value: 0 },
      ],
    },
    {
      title: "T2 k=0 · A[k]=3 — ①",
      detail: "3 번 카운터를 증가시킨다. 저장값 0 이 바닥값 0 보다 작지 않아 그대로 출발한다.",
      array: [0, 0, 1, 0, 0],
      highlight: [2],
      marked: [],
      pointers: { i: 2 },
      entries: [
        { label: "A[k]", value: 3 },
        { label: "counter[i]", value: 1 },
        { label: "high", value: 1 },
        { label: "base", value: 0 },
      ],
    },
    {
      title: "T3 k=1 · A[k]=4 — ①",
      detail: "4 번 카운터를 증가시킨다. 최댓값은 1 그대로다.",
      array: [0, 0, 1, 1, 0],
      highlight: [3],
      marked: [],
      pointers: { i: 3 },
      entries: [
        { label: "A[k]", value: 4 },
        { label: "counter[i]", value: 1 },
        { label: "high", value: 1 },
        { label: "base", value: 0 },
      ],
    },
    {
      title: "T4 k=2 · A[k]=4 — ①",
      detail: "같은 칸을 한 번 더 증가시켜 2 가 된다. 최댓값이 2 로 올라간다.",
      array: [0, 0, 1, 2, 0],
      highlight: [3],
      marked: [],
      pointers: { i: 3 },
      entries: [
        { label: "A[k]", value: 4 },
        { label: "counter[i]", value: 2 },
        { label: "high", value: 2 },
        { label: "base", value: 0 },
      ],
    },
    {
      title: "T5 k=3 · A[k]=6 — ②",
      detail:
        "최대 맞추기. 배열에 아무것도 적지 않고 바닥값만 2 로 옮긴다. 네 칸이 옛 값이 된다.",
      array: [0, 0, 1, 2, 0],
      highlight: [],
      marked: [0, 1, 2, 4],
      entries: [
        { label: "A[k]", value: 6 },
        { label: "counter[i]", value: "—" },
        { label: "high", value: 2 },
        { label: "base", value: 2 },
      ],
    },
    {
      title: "T6 k=4 · A[k]=1 — ①",
      detail:
        "1 번 카운터의 저장값 0 이 바닥값 2 보다 작다. 2 에서 출발해 3 을 적는다.",
      array: [3, 0, 1, 2, 0],
      highlight: [0],
      marked: [1, 2, 4],
      pointers: { i: 0 },
      entries: [
        { label: "A[k]", value: 1 },
        { label: "counter[i]", value: 3 },
        { label: "high", value: 3 },
        { label: "base", value: 2 },
      ],
    },
    {
      title: "T7 k=5 · A[k]=4 — ①",
      detail: "4 번 카운터의 저장값 2 는 바닥값과 같다. 그대로 출발해 3 을 적는다.",
      array: [3, 0, 1, 3, 0],
      highlight: [3],
      marked: [1, 2, 4],
      pointers: { i: 3 },
      entries: [
        { label: "A[k]", value: 4 },
        { label: "counter[i]", value: 3 },
        { label: "high", value: 3 },
        { label: "base", value: 2 },
      ],
    },
    {
      title: "T8 k=6 · A[k]=4 — ①",
      detail: "같은 칸이 4 가 된다. 최댓값이 4 로 올라가지만 바닥값은 2 그대로다.",
      array: [3, 0, 1, 4, 0],
      highlight: [3],
      marked: [1, 2, 4],
      pointers: { i: 3 },
      entries: [
        { label: "A[k]", value: 4 },
        { label: "counter[i]", value: 4 },
        { label: "high", value: 4 },
        { label: "base", value: 2 },
      ],
    },
    {
      title: "T9 마지막 채우기 — ③",
      detail:
        "바닥값 2 에 못 미치는 세 칸에만 2 를 적는다. 최댓값 4 는 여기서 쓰지 않는다.",
      array: [3, 2, 2, 4, 2],
      highlight: [1, 2, 4],
      marked: [],
      entries: [
        { label: "A[k]", value: "—" },
        { label: "counter[i]", value: "—" },
        { label: "high", value: 4 },
        { label: "base", value: 2 },
      ],
    },
  ] satisfies Frame[],
};
