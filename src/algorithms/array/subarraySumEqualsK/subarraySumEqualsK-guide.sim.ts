import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 다섯 규약을 그대로 따른다
 *
 * 규약은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세우고 `prefixSumRangeQuery-guide.sim.ts`
 * 가 파생 배열에 적용한 것이다. 이 편에서 새로 생기는 자리는 **표가 배열이 아니라는 것**
 * 하나라, 그 처리를 적어 둔다.
 *
 * 1. **`array` 는 입력 배열 `nums` 만 담는다.** 이 편의 상태는 접두 합의 개수 표인데 그것은
 *    배열이 아니라 키-값 묶음이라 `array` 에 들어가지 않는다. 표의 크기와 조회 결과는
 *    규약 2 에 따라 **스칼라로 쪼개** `keyValue` 가 적고, 표 전체를 한 화면에 보이는 것은
 *    md 쪽 ascii 그림이 진다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 지금 보고 있는 오른쪽 끝 `r` 은 자리라서
 *    `pointers` 로 두고, 거기서 나온 수(접두 합 · 찾는 값 · 조회 결과 · 답)는 `keyValue` 다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같다** — `r`.
 * 4. **`highlight` 는 지금 더한 칸, `marked` 는 이미 지나온 칸.**
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 이 편은 걸음의
 *    종류가 하나뿐이라 export 도 하나다.
 */
export const scan = {
  view: ["array", "keyValue"] as const,
  title: "접두 합의 짝 세기 — nums = [3, 4, 7, 2, -3, 1, 4, 2], k = 7",
  result: "4",
  steps: [
    {
      title: "T2 r=0",
      detail:
        "접두 합이 3 이 됐다. 3 − 7 = −4 는 표에 없으므로 여기서 끝나는 답은 없다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [0],
      marked: [],
      pointers: { r: 0 },
      entries: [
        { label: "접두 합", value: 3 },
        { label: "찾는 값", value: -4 },
        { label: "표에서 찾은 개수", value: 0 },
        { label: "지금까지의 답", value: 0 },
      ],
    },
    {
      title: "T3 r=1",
      detail:
        "접두 합이 7 이 됐다. 7 − 7 = 0 이 표에 한 번 있다 — 빈 접두다. 답 하나가 나온다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [1],
      marked: [0],
      pointers: { r: 1 },
      entries: [
        { label: "접두 합", value: 7 },
        { label: "찾는 값", value: 0 },
        { label: "표에서 찾은 개수", value: 1 },
        { label: "지금까지의 답", value: 1 },
      ],
    },
    {
      title: "T4 r=2",
      detail: "접두 합 14 에서 7 을 찾는다. 표에 한 번 있어 답이 둘이 된다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [2],
      marked: [0, 1],
      pointers: { r: 2 },
      entries: [
        { label: "접두 합", value: 14 },
        { label: "찾는 값", value: 7 },
        { label: "표에서 찾은 개수", value: 1 },
        { label: "지금까지의 답", value: 2 },
      ],
    },
    {
      title: "T5 r=3",
      detail: "접두 합 16 에서 9 를 찾는다. 표에 없어 답이 늘지 않는다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [3],
      marked: [0, 1, 2],
      pointers: { r: 3 },
      entries: [
        { label: "접두 합", value: 16 },
        { label: "찾는 값", value: 9 },
        { label: "표에서 찾은 개수", value: 0 },
        { label: "지금까지의 답", value: 2 },
      ],
    },
    {
      title: "T6 r=4",
      detail:
        "음수 −3 을 더해 접두 합이 16 에서 13 으로 줄었다. 6 은 표에 없다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [4],
      marked: [0, 1, 2, 3],
      pointers: { r: 4 },
      entries: [
        { label: "접두 합", value: 13 },
        { label: "찾는 값", value: 6 },
        { label: "표에서 찾은 개수", value: 0 },
        { label: "지금까지의 답", value: 2 },
      ],
    },
    {
      title: "T7 r=5",
      detail:
        "접두 합이 다시 14 다. 앞서 나온 7 을 또 찾아 답이 셋이 된다. 표의 14 는 두 번이 됐다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [5],
      marked: [0, 1, 2, 3, 4],
      pointers: { r: 5 },
      entries: [
        { label: "접두 합", value: 14 },
        { label: "찾는 값", value: 7 },
        { label: "표에서 찾은 개수", value: 1 },
        { label: "지금까지의 답", value: 3 },
      ],
    },
    {
      title: "T8 r=6",
      detail: "접두 합 18 에서 11 을 찾는다. 표에 없다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [6],
      marked: [0, 1, 2, 3, 4, 5],
      pointers: { r: 6 },
      entries: [
        { label: "접두 합", value: 18 },
        { label: "찾는 값", value: 11 },
        { label: "표에서 찾은 개수", value: 0 },
        { label: "지금까지의 답", value: 3 },
      ],
    },
    {
      title: "T9 r=7",
      detail:
        "마지막 칸. 접두 합 20 에서 13 을 찾아 한 번 나오고, 답이 넷으로 끝난다.",
      array: [3, 4, 7, 2, -3, 1, 4, 2],
      highlight: [7],
      marked: [0, 1, 2, 3, 4, 5, 6],
      pointers: { r: 7 },
      entries: [
        { label: "접두 합", value: 20 },
        { label: "찾는 값", value: 13 },
        { label: "표에서 찾은 개수", value: 1 },
        { label: "지금까지의 답", value: 4 },
      ],
    },
  ] satisfies Frame[],
};
