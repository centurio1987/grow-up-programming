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
 * 한 번도 바뀌지 않는 절차」에 적용한 것이다. 이 편에서 새로 생기는 자리는 **`marked` 가
 * 늘기만 하지 않고 갈아 끼워진다**는 것 하나라, 그 처리를 적어 둔다.
 *
 * 1. **`array` 는 입력 배열을 그대로 담는다.** 이 절차는 배열을 고치지 않고 읽기만 하므로
 *    프레임마다 같은 배열이 실린다. 바뀌는 것은 두 스칼라와 강조 자리다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 보는 집 번호 `i` 는 자리라서 `pointers`
 *    로 두고, 거기서 나온 수(`prev` · `cur`)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 이번 걸음에서 읽은 집, `marked` 는 지금 `cur` 를 만든 집들.**
 *    건너뛰는 걸음에서는 `marked` 가 그대로 남고, 고르는 걸음에서는 두 칸 앞의 집합에 이번
 *    집이 더해진 것으로 **갈아 끼워진다** — 그 교체가 이 절차의 핵심 장면이다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 넷이다.
 *    `prev` 를 `cur` 바로 위에 두는 것이 이 편의 요점이라, 순서를 바꾸지 않는다.
 */
export const rob = {
  view: ["array", "keyValue"] as const,
  title: "두 칸 앞의 답을 이어받기 — A = [2, 7, 9, 3, 1, 5]",
  result: "16",
  steps: [
    {
      title: "T1 초기화 i=0",
      detail:
        "prev 는 집 0 을 넣기 전까지의 답이라 0 이고, cur 는 집 0 까지의 답이라 A[0] = 2 다.",
      array: [2, 7, 9, 3, 1, 5],
      highlight: [0],
      marked: [0],
      pointers: { i: 0 },
      entries: [
        { label: "prev — 집 i−1 까지의 답", value: 0 },
        { label: "cur — 집 i 까지의 답", value: 2 },
        { label: "이번 걸음이 고른 갈래", value: "—" },
        { label: "cur 를 만든 집", value: "0" },
      ],
    },
    {
      title: "T2 i=1",
      detail:
        "건너뛴 답은 2 이고 고른 답은 0 + 7 = 7 이다. 고른 쪽이 커서 cur 가 7 이 되고, prev 는 옛 cur 인 2 를 받는다.",
      array: [2, 7, 9, 3, 1, 5],
      highlight: [1],
      marked: [1],
      pointers: { i: 1 },
      entries: [
        { label: "prev — 집 i−1 까지의 답", value: 2 },
        { label: "cur — 집 i 까지의 답", value: 7 },
        { label: "이번 걸음이 고른 갈래", value: "집 1 을 고른다" },
        { label: "cur 를 만든 집", value: "1" },
      ],
    },
    {
      title: "T3 i=2",
      detail:
        "건너뛴 답은 7 이고 고른 답은 prev 2 에 9 를 더한 11 이다. 두 칸 앞의 답을 이어받아서 집 0 과 집 2 를 함께 고를 수 있다.",
      array: [2, 7, 9, 3, 1, 5],
      highlight: [2],
      marked: [0, 2],
      pointers: { i: 2 },
      entries: [
        { label: "prev — 집 i−1 까지의 답", value: 7 },
        { label: "cur — 집 i 까지의 답", value: 11 },
        { label: "이번 걸음이 고른 갈래", value: "집 2 를 고른다" },
        { label: "cur 를 만든 집", value: "0 2" },
      ],
    },
    {
      title: "T4 i=3",
      detail:
        "건너뛴 답은 11 이고 고른 답은 prev 7 에 3 을 더한 10 이다. 이번에는 건너뛴 쪽이 커서 cur 가 11 그대로 남는다.",
      array: [2, 7, 9, 3, 1, 5],
      highlight: [3],
      marked: [0, 2],
      pointers: { i: 3 },
      entries: [
        { label: "prev — 집 i−1 까지의 답", value: 11 },
        { label: "cur — 집 i 까지의 답", value: 11 },
        { label: "이번 걸음이 고른 갈래", value: "집 3 을 건너뛴다" },
        { label: "cur 를 만든 집", value: "0 2" },
      ],
    },
    {
      title: "T5 i=4",
      detail:
        "건너뛴 답은 11 이고 고른 답은 prev 11 에 1 을 더한 12 다. 집 3 을 건너뛴 덕분에 prev 가 이미 11 이라 값이 작은 집도 더해진다.",
      array: [2, 7, 9, 3, 1, 5],
      highlight: [4],
      marked: [0, 2, 4],
      pointers: { i: 4 },
      entries: [
        { label: "prev — 집 i−1 까지의 답", value: 11 },
        { label: "cur — 집 i 까지의 답", value: 12 },
        { label: "이번 걸음이 고른 갈래", value: "집 4 를 고른다" },
        { label: "cur 를 만든 집", value: "0 2 4" },
      ],
    },
    {
      title: "T6 i=5",
      detail:
        "마지막 집이다. 건너뛴 답은 12 이고 고른 답은 prev 11 에 5 를 더한 16 이다. cur 가 16 이 되고 그것이 답이다.",
      array: [2, 7, 9, 3, 1, 5],
      highlight: [5],
      marked: [0, 2, 5],
      pointers: { i: 5 },
      entries: [
        { label: "prev — 집 i−1 까지의 답", value: 12 },
        { label: "cur — 집 i 까지의 답", value: 16 },
        { label: "이번 걸음이 고른 갈래", value: "집 5 를 고른다" },
        { label: "cur 를 만든 집", value: "0 2 5" },
      ],
    },
  ] satisfies Frame[],
};
