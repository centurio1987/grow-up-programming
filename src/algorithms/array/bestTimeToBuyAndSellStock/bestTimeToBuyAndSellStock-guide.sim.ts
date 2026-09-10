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
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세웠고 `kadane-guide.sim.ts` 가
 * 「배열이 한 번도 바뀌지 않는 절차」에 적용했다. 이 편도 배열을 읽기만 한다.
 *
 * 1. **`array` 는 입력 배열 `prices` 를 그대로 담는다.** 절차가 배열을 고치지 않으므로
 *    프레임마다 같은 배열이 실린다. 바뀌는 것은 두 스칼라와 강조 자리다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 보는 날 번호 `i` 는 자리라서 `pointers`
 *    로 두고, 거기서 나온 수(`minP` · `best`)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `i`.
 * 4. **`highlight` 는 이번 걸음에서 읽은 날, `marked` 는 지금 `best` 를 만든 매수일과
 *    매도일 두 칸.** 아직 이익이 0 이면 `marked` 가 비어 있고, 그 자리가 「거래를 안 하는
 *    선택」이 답으로 남아 있는 상태다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다** — 셋이다.
 */
export const profitScan = {
  view: ["array", "keyValue"] as const,
  title: "날마다 이어받기 — prices = [7, 2, 5, 1, 6, 3]",
  result: "5",
  steps: [
    {
      title: "T1 초기화 i=0",
      detail:
        "minP 를 prices[0] = 7 로, best 를 0 으로 시작한다. 거래를 안 하는 선택이 언제나 가능해서 이익의 출발값이 0 이다.",
      array: [7, 2, 5, 1, 6, 3],
      highlight: [0],
      marked: [],
      pointers: { i: 0 },
      entries: [
        { label: "minP — 지금까지의 최저가", value: 7 },
        { label: "best — 지금까지의 최대 이익", value: 0 },
        { label: "best 를 만든 매수일·매도일", value: "거래 없음" },
      ],
    },
    {
      title: "T2 i=1",
      detail:
        "오늘 팔면 2 - 7 = -5 라 이익이 안 난다. best 는 0 그대로이고, 최저가가 7 에서 2 로 갱신된다.",
      array: [7, 2, 5, 1, 6, 3],
      highlight: [1],
      marked: [],
      pointers: { i: 1 },
      entries: [
        { label: "minP — 지금까지의 최저가", value: 2 },
        { label: "best — 지금까지의 최대 이익", value: 0 },
        { label: "best 를 만든 매수일·매도일", value: "거래 없음" },
      ],
    },
    {
      title: "T3 i=2",
      detail:
        "오늘 팔면 5 - 2 = 3 이다. best 가 0 에서 3 으로 커지고, 오늘 값 5 는 최저가 2 보다 커서 minP 는 그대로다.",
      array: [7, 2, 5, 1, 6, 3],
      highlight: [2],
      marked: [1, 2],
      pointers: { i: 2 },
      entries: [
        { label: "minP — 지금까지의 최저가", value: 2 },
        { label: "best — 지금까지의 최대 이익", value: 3 },
        { label: "best 를 만든 매수일·매도일", value: "1일 매수 · 2일 매도" },
      ],
    },
    {
      title: "T4 i=3",
      detail:
        "오늘 팔면 1 - 2 = -1 이라 best 는 3 그대로다. 대신 최저가가 2 에서 1 로 갱신된다 — 이미 얻은 이익 3 은 사라지지 않는다.",
      array: [7, 2, 5, 1, 6, 3],
      highlight: [3],
      marked: [1, 2],
      pointers: { i: 3 },
      entries: [
        { label: "minP — 지금까지의 최저가", value: 1 },
        { label: "best — 지금까지의 최대 이익", value: 3 },
        { label: "best 를 만든 매수일·매도일", value: "1일 매수 · 2일 매도" },
      ],
    },
    {
      title: "T5 i=4",
      detail:
        "오늘 팔면 6 - 1 = 5 다. 갱신된 최저가 1 이 여기서 값을 낸다 — best 가 3 에서 5 로 커지고 이것이 답이 된다.",
      array: [7, 2, 5, 1, 6, 3],
      highlight: [4],
      marked: [3, 4],
      pointers: { i: 4 },
      entries: [
        { label: "minP — 지금까지의 최저가", value: 1 },
        { label: "best — 지금까지의 최대 이익", value: 5 },
        { label: "best 를 만든 매수일·매도일", value: "3일 매수 · 4일 매도" },
      ],
    },
    {
      title: "T6 i=5",
      detail:
        "마지막 날이다. 오늘 팔면 3 - 1 = 2 라 best 는 5 그대로이고, 최저가도 1 그대로다. 답은 5 다.",
      array: [7, 2, 5, 1, 6, 3],
      highlight: [5],
      marked: [3, 4],
      pointers: { i: 5 },
      entries: [
        { label: "minP — 지금까지의 최저가", value: 1 },
        { label: "best — 지금까지의 최대 이익", value: 5 },
        { label: "best 를 만든 매수일·매도일", value: "3일 매수 · 4일 매도" },
      ],
    },
  ] satisfies Frame[],
};
