import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `k = 2`,
 * `prices = [2, 6, 3, 9, 5, 7]`. 프레임 수는 그 절의 T# 단계 수(8)를 넘지 않는다 — P3 이
 * 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 규약
 *
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세웠고, 배열을 읽기만 하는 절차에
 * 적용한 것이 `kadane-guide.sim.ts` 와 `bestTimeToBuyAndSellStock-guide.sim.ts` 다. 이 편도
 * 배열을 고치지 않는다. **앞 편과 갈리는 자리는 상태가 스칼라 둘이 아니라 배열 둘이라는
 * 것**이고, 그래서 `entries` 가 넷이다.
 *
 * 1. **`array` 는 입력 배열 `prices` 를 그대로 담는다.** 절차가 배열을 고치지 않으므로
 *    프레임마다 같은 배열이 실린다. 바뀌는 것은 상태 네 개와 강조 자리다.
 * 2. **위치는 `array`, 상태 값은 `keyValue`.** 지금 읽는 날 번호 `j` 는 자리라서 `pointers`
 *    로 두고, 거기서 나온 수(`hold[t]` · `free[t]`)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `j`.
 * 4. **`highlight` 는 이번 걸음에서 읽은 날 하나, `marked` 는 이미 읽고 지나간 날 전부.**
 *    T1 은 아직 아무 날도 안 읽은 자리라 둘 다 비어 있다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 넷이고, 거래
 *    번호가 작은 것부터 보유·비보유 차례다. 아직 도달할 수 없는 상태는 `-∞` 로 적는다.
 */
export const tradeScan = {
  view: ["array", "keyValue"] as const,
  title: "거래 번호 축을 갖는 표 — k = 2, prices = [2, 6, 3, 9, 5, 7]",
  result: "10",
  steps: [
    {
      title: "T1 초기화",
      detail:
        "hold 를 -∞ 로, free 를 0 으로 둔다. 첫날 전에는 매수를 마친 상태에 도달할 방법이 없고, 거래를 한 번도 안 한 이익은 0 이다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [],
      marked: [],
      pointers: { j: 0 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: "-∞" },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 0 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: "-∞" },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 0 },
      ],
    },
    {
      title: "T2 날 0 · 가격 2",
      detail:
        "첫날이라 두 매수가 다 오늘 처음 가능해진다. hold[1] 은 0 - 2 = -2, hold[2] 도 free[1] = 0 에서 출발해 -2 다. 오늘 사서 오늘 판 이익은 0 이라 free 는 둘 다 그대로다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [0],
      marked: [],
      pointers: { j: 0 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: -2 },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 0 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: -2 },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 0 },
      ],
    },
    {
      title: "T3 날 1 · 가격 6",
      detail:
        "오늘 팔면 -2 + 6 = 4 다. free[1] 이 0 에서 4 로 커지고 free[2] 도 4 가 된다. 매수 쪽 후보는 hold[1] 이 0 - 6 = -6, hold[2] 가 4 - 6 = -2 라 둘 다 -2 그대로다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [1],
      marked: [0],
      pointers: { j: 1 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: -2 },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 4 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: -2 },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 4 },
      ],
    },
    {
      title: "T4 날 2 · 가격 3",
      detail:
        "두 번째 매수가 처음으로 이익을 안고 들어간다 — free[1] = 4 에서 3 을 빼 hold[2] 가 -2 에서 1 로 올라간다. 오늘 팔면 1 + 3 = 4 라 free[2] 는 4 그대로다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [2],
      marked: [0, 1],
      pointers: { j: 2 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: -2 },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 4 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: 1 },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 4 },
      ],
    },
    {
      title: "T5 날 3 · 가격 9",
      detail:
        "오늘 하루에 두 상태가 함께 올라간다. free[1] 은 -2 + 9 = 7 이 되고, free[2] 는 T4 가 만든 hold[2] = 1 에 9 를 더해 10 이 된다. 이 10 이 답이 된다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [3],
      marked: [0, 1, 2],
      pointers: { j: 3 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: -2 },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 7 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: 1 },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 10 },
      ],
    },
    {
      title: "T6 날 4 · 가격 5",
      detail:
        "커진 free[1] = 7 에서 5 를 빼 hold[2] 가 1 에서 2 로 올라간다. 다만 오늘 팔면 2 + 5 = 7 이라 free[2] 는 10 그대로다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [4],
      marked: [0, 1, 2, 3],
      pointers: { j: 4 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: -2 },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 7 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: 2 },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 10 },
      ],
    },
    {
      title: "T7 날 5 · 가격 7",
      detail:
        "마지막 날이다. 오늘 팔면 2 + 7 = 9 라 free[2] 는 10 그대로이고, 네 상태가 하나도 안 바뀐다. 답은 free[2] = 10 이다.",
      array: [2, 6, 3, 9, 5, 7],
      highlight: [5],
      marked: [0, 1, 2, 3, 4],
      pointers: { j: 5 },
      entries: [
        { label: "hold[1] — 1번째 매수를 마친 상태", value: -2 },
        { label: "free[1] — 1번째 매도까지 마친 상태", value: 7 },
        { label: "hold[2] — 2번째 매수를 마친 상태", value: 2 },
        { label: "free[2] — 2번째 매도까지 마친 상태", value: 10 },
      ],
    },
  ] satisfies Frame[],
};
