import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `f(x) = (x - 2)²`,
 * 구간 `[0, 9]`, `ε = 1`. 프레임은 그 절의 `T2` 부터 `T8` 까지 일곱이고, T# 단계 수(8)를
 * 넘지 않는다(P3 이 그 관계를 잰다).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `array` + `keyValue` 조합의 세 번째 편 — 선례의 다섯 중 1번만 갈린다
 *
 * 다섯은 `longestSubarrayAtMostSum-guide.sim.ts` 가 세웠고 `maxCounters-guide.sim.ts` 가
 * 이어받았다. 이 편에서 달라지는 것은 1번 하나다.
 *
 * 1. **`array` 는 입력 배열이 아니라 후보 구간의 네 자리를 담는다.** 선례가 「입력 배열 그
 *    자체」라고 적은 자리인데, 이 문제의 입력은 배열이 아니라 **함수와 실수 구간**이라 담을
 *    배열이 없다. 자리를 가리키는 것은 `lo`·`m1`·`m2`·`hi` 네 수이고 칸 하나가 그중 한 자리다.
 *    반복이 끝난 마지막 프레임은 두 내부점이 없으므로 `lo`·반환값·`hi` 세 칸이다 —
 *    없는 점을 그리면 화면이 본문과 다른 말을 한다.
 * 2. **위치는 `array`, 스칼라는 `keyValue`.** `lo`·`m1`·`m2`·`hi` 는 `array` 가 그리고,
 *    함숫값과 구간 길이처럼 축 위에 자리가 없는 수는 `keyValue` 가 적는다. 한 값을 두 패널에
 *    함께 두지 않는다.
 * 3. **`pointers` 의 키는 본문 기호표의 이름과 글자 그대로 같게 쓴다.** 여기서는
 *    `lo`·`m1`·`m2`·`hi` 다. **값이 없는 포인터는 그 프레임에서 뺀다.**
 * 4. **`highlight` 는 이번 바퀴에 함숫값을 재는 두 점, `marked` 는 이번 바퀴에 후보에서
 *    빠지는 끝점.** 둘이 겹치면 프리셋이 `highlight` 색으로 그리므로
 *    (`src/_guide-sim/index.tsx` 의 `ArrayView`), `marked` 는 빠지는 쪽을 보이는 자리로 쓴다.
 * 5. **`entries` 는 프레임마다 같은 항목을 같은 순서로 두고 값만 바꾼다.** 첫 두 항목은 분기
 *    조건이 보는 값(`f(m1)`·`f(m2)`), 마지막 항목은 **지금 답으로 내밀 값**(`(lo + hi) / 2`)
 *    으로 고정한다. 값이 없는 자리는 `—` 로 적는다.
 */
export const narrow = {
  view: ["array", "keyValue"] as const,
  title: "ternarySearch((x) => (x - 2) ** 2, 0, 9, 1)",
  result: "1.8765",
  steps: [
    {
      title: "T2 첫 바퀴 — ①",
      detail:
        "구간 길이 9 를 셋으로 나눈다. f(m1) = 1 이 f(m2) = 16 보다 작아 오른쪽 3분의 1 을 뺀다.",
      array: [0, 3, 6, 9],
      highlight: [1, 2],
      marked: [3],
      pointers: { lo: 0, m1: 1, m2: 2, hi: 3 },
      entries: [
        { label: "f(m1)", value: 1 },
        { label: "f(m2)", value: 16 },
        { label: "hi - lo", value: 9 },
        { label: "(lo + hi) / 2", value: 4.5 },
      ],
    },
    {
      title: "T3 두 번째 바퀴 — ①",
      detail:
        "구간이 [0, 6] 으로 줄었다. f(m1) = 0 으로 최솟점을 정확히 맞혔지만 코드는 그것을 모르고 계속 좁힌다.",
      array: [0, 2, 4, 6],
      highlight: [1, 2],
      marked: [3],
      pointers: { lo: 0, m1: 1, m2: 2, hi: 3 },
      entries: [
        { label: "f(m1)", value: 0 },
        { label: "f(m2)", value: 4 },
        { label: "hi - lo", value: 6 },
        { label: "(lo + hi) / 2", value: 3 },
      ],
    },
    {
      title: "T4 세 번째 바퀴 — ①",
      detail:
        "두 함숫값이 소수 넷째 자리까지 같다. 마지막 자리에서 f(m1) 이 조금 작아 ① 로 간다.",
      array: [0, 1.3333, 2.6667, 4],
      highlight: [1, 2],
      marked: [3],
      pointers: { lo: 0, m1: 1, m2: 2, hi: 3 },
      entries: [
        { label: "f(m1)", value: 0.4444 },
        { label: "f(m2)", value: 0.4444 },
        { label: "hi - lo", value: 4 },
        { label: "(lo + hi) / 2", value: 2 },
      ],
    },
    {
      title: "T5 네 번째 바퀴 — ②",
      detail:
        "처음으로 오른쪽 점이 더 낮다. f(m1) = 1.2346 이 f(m2) = 0.0494 보다 커서 왼쪽 3분의 1 을 뺀다.",
      array: [0, 0.8889, 1.7778, 2.6667],
      highlight: [1, 2],
      marked: [0],
      pointers: { lo: 0, m1: 1, m2: 2, hi: 3 },
      entries: [
        { label: "f(m1)", value: 1.2346 },
        { label: "f(m2)", value: 0.0494 },
        { label: "hi - lo", value: 2.6667 },
        { label: "(lo + hi) / 2", value: 1.3333 },
      ],
    },
    {
      title: "T6 다섯 번째 바퀴 — ②",
      detail: "왼쪽 끝이 0.8889 로 올라왔다. 이번에도 오른쪽 점이 더 낮다.",
      array: [0.8889, 1.4815, 2.0741, 2.6667],
      highlight: [1, 2],
      marked: [0],
      pointers: { lo: 0, m1: 1, m2: 2, hi: 3 },
      entries: [
        { label: "f(m1)", value: 0.2689 },
        { label: "f(m2)", value: 0.0055 },
        { label: "hi - lo", value: 1.7778 },
        { label: "(lo + hi) / 2", value: 1.7778 },
      ],
    },
    {
      title: "T7 여섯 번째 바퀴 — ①",
      detail:
        "최솟점 2 를 두 점이 양쪽에서 감쌌다. f(m1) 이 더 작아 오른쪽 3분의 1 을 뺀다.",
      array: [1.4815, 1.8765, 2.2716, 2.6667],
      highlight: [1, 2],
      marked: [3],
      pointers: { lo: 0, m1: 1, m2: 2, hi: 3 },
      entries: [
        { label: "f(m1)", value: 0.0152 },
        { label: "f(m2)", value: 0.0738 },
        { label: "hi - lo", value: 1.1852 },
        { label: "(lo + hi) / 2", value: 2.0741 },
      ],
    },
    {
      title: "T8 반복이 끝난다",
      detail:
        "구간 길이가 0.7901 로 ε = 1 이하다. 두 내부점은 더 정하지 않고 중점 1.8765 를 돌려준다.",
      array: [1.4815, 1.8765, 2.2716],
      highlight: [],
      marked: [1],
      pointers: { lo: 0, hi: 2 },
      entries: [
        { label: "f(m1)", value: "—" },
        { label: "f(m2)", value: "—" },
        { label: "hi - lo", value: 0.7901 },
        { label: "(lo + hi) / 2", value: 1.8765 },
      ],
    },
  ] satisfies Frame[],
};
