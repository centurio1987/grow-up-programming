import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 선례 — 뒤에 오는 편이 이 다섯을 물려받는다
 *
 * `SURVEY.md` 가 센 111편 중 24편이 이 조합이고, 그 24편은 전부 구 명세로 쓰였다. 새 명세에서
 * 두 패널이 각각 무엇을 지는지를 여기서 정한다.
 *
 * 1. **`array` 는 입력 배열 그 자체만 담는다.** 누적합·정렬본 같은 **파생 배열을 담지
 *    않는다** — 담으면 독자가 화면의 배열과 본문의 `nums` 를 대조할 수 없다. 파생 배열을
 *    꼭 보여야 하면 `view` 에 `matrix` 를 더한다(`mosAlgorithm` 이 그 경로다).
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** 인덱스·구간·포인터처럼 **자리를 가리키는 것**은
 *    `array` 가 그리고, 그 자리에서 파생된 **수 하나**(합·길이·답)는 `keyValue` 가 적는다.
 *    한 값을 두 패널에 함께 두지 않는다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같게 쓴다.** 여기서는 `l`·`r` 이다.
 *    화면에서 `i`·`j` 로 줄여 적으면 독자가 본문과 대조할 때마다 이름을 옮겨야 한다.
 *    **아직 값이 없는 포인터는 그 프레임에서 뺀다** — 없는 값을 `0` 으로 적으면 화면이
 *    본문과 다른 말을 한다(아래 T1 이 그 자리다).
 * 4. **`highlight` 는 지금 보고 있는 구간, `marked` 는 지금까지 확정한 답의 구간.** 둘이
 *    겹치면 프리셋이 `highlight` 색으로 그리므로(`src/_guide-sim/index.tsx` 의 `ArrayView`),
 *    `marked` 는 **창 밖에 남는 답**을 보이는 자리로 쓴다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 순서가 흔들리면
 *    패널을 프레임마다 다시 읽게 된다. 첫 항목은 **분기 조건이 보는 값**(`windowSum`),
 *    마지막 항목은 **답**(`best`) 으로 고정한다.
 */
export const slide = {
  view: ["array", "keyValue"] as const,
  title: "longestSubarrayAtMostSum([1,2,1,0,1,1,0], 4)",
  result: "5",
  steps: [
    {
      title: "T1 시작",
      detail: "루프에 들어가기 전. 창이 비어 있고 r 은 아직 값이 없다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [],
      marked: [],
      pointers: { l: 0 },
      entries: [
        { label: "windowSum", value: 0 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 0 },
        { label: "best", value: 0 },
      ],
    },
    {
      title: "T2 r=0 — ②",
      detail: "1 을 더해 windowSum=1. 4 를 넘지 않아 줄이지 않는다. 길이 1.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [0],
      marked: [0],
      pointers: { l: 0, r: 0 },
      entries: [
        { label: "windowSum", value: 1 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 1 },
        { label: "best", value: 1 },
      ],
    },
    {
      title: "T3 r=1 — ②",
      detail: "2 를 더해 windowSum=3. 그대로 둔다. 길이 2.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [0, 1],
      marked: [0, 1],
      pointers: { l: 0, r: 1 },
      entries: [
        { label: "windowSum", value: 3 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 2 },
        { label: "best", value: 2 },
      ],
    },
    {
      title: "T4 r=2 — ②",
      detail: "1 을 더해 windowSum=4. 4 > 4 가 거짓이라 줄이지 않는다. 길이 3.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [0, 1, 2],
      marked: [0, 1, 2],
      pointers: { l: 0, r: 2 },
      entries: [
        { label: "windowSum", value: 4 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 3 },
        { label: "best", value: 3 },
      ],
    },
    {
      title: "T5 r=3 — ②",
      detail:
        "0 을 더해 windowSum=4 그대로. 합은 그대로인데 길이가 4 로 늘었다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [0, 1, 2, 3],
      marked: [0, 1, 2, 3],
      pointers: { l: 0, r: 3 },
      entries: [
        { label: "windowSum", value: 4 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 4 },
        { label: "best", value: 4 },
      ],
    },
    {
      title: "T6 r=4 — ① 다음 ②",
      detail:
        "windowSum=5 라 1 을 빼고 l 을 1 로 옮긴다. 다시 4 가 되어 멈춘다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [1, 2, 3, 4],
      marked: [0, 1, 2, 3],
      pointers: { l: 1, r: 4 },
      entries: [
        { label: "windowSum", value: 4 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 4 },
        { label: "best", value: 4 },
      ],
    },
    {
      title: "T7 r=5 — ① 다음 ②",
      detail: "windowSum=5 라 2 를 빼고 l 을 2 로 옮긴다. windowSum=3.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [2, 3, 4, 5],
      marked: [0, 1, 2, 3],
      pointers: { l: 2, r: 5 },
      entries: [
        { label: "windowSum", value: 3 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 4 },
        { label: "best", value: 4 },
      ],
    },
    {
      title: "T8 r=6 — ②",
      detail: "0 을 더해 windowSum=3. 길이가 5 가 되어 best 를 갱신한다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      highlight: [2, 3, 4, 5, 6],
      marked: [2, 3, 4, 5, 6],
      pointers: { l: 2, r: 6 },
      entries: [
        { label: "windowSum", value: 3 },
        { label: "S", value: 4 },
        { label: "r - l + 1", value: 5 },
        { label: "best", value: 5 },
      ],
    },
  ] satisfies Frame[],
};
