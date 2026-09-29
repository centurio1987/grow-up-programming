import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `nums = [1, 2, 1, 0, 1, 1, 0]`, `S = 4`.
 * `slide` 는 루프에 들어가기 전 T1 과 바깥 반복 일곱 바퀴 T2~T8 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 창 `[l, r]`(비면 `null`), `read` 는 이번 바퀴에
 * 뺀 칸과 더한 칸, `pointers` 는 기호표의 `l`·`r` 이다. 무대에 자리가 없는 창의 합은 계산 알약(`calc`)에,
 * 답 후보 `best` 는 남는 변수(`vars`)에 둔다(SPEC §13 배열 줄).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `longestSubarrayAtMostSum-guide.test.ts` 가 잰다.
 */

export const slide = {
  player: "stage",
  stage: "array",
  arrayName: "nums",
  rangeLabel: "창",
  title: "longestSubarrayAtMostSum([1, 2, 1, 0, 1, 1, 0], 4)",
  result: "5",
  steps: [
    {
      title: "T1 창 없음",
      text: "루프에 들어가기 전입니다. 창이 비어 있고 windowSum = 0, best = 0 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: null,
      read: [],
      write: [],
      pointers: { l: 0 },
      calc: null,
      vars: "best = 0",
    },
    {
      title: "T2 r = 0 · ②",
      text: "nums[0] = 1 을 더해 창의 합이 1 입니다. 1 > 4 가 거짓이라 줄이지 않습니다. 창의 길이 1, best = 1 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: { l: 0, r: 0 },
      calc: { expr: "0 + 1", result: "1" },
      vars: "best = 1",
    },
    {
      title: "T3 r = 1 · ②",
      text: "nums[1] = 2 를 더해 창의 합이 3 입니다. 3 > 4 가 거짓이라 줄이지 않습니다. 창의 길이 2, best = 2 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: { l: 0, r: 1 },
      calc: { expr: "1 + 2", result: "3" },
      vars: "best = 2",
    },
    {
      title: "T4 r = 2 · ②",
      text: "nums[2] = 1 을 더해 창의 합이 4 입니다. 4 > 4 가 거짓이라 줄이지 않습니다. 창의 길이 3, best = 3 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: { l: 0, r: 2 },
      calc: { expr: "3 + 1", result: "4" },
      vars: "best = 3",
    },
    {
      title: "T5 r = 3 · ②",
      text: "nums[3] = 0 을 더해 창의 합이 4 입니다. 4 > 4 가 거짓이라 줄이지 않습니다. 창의 길이 4, best = 4 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: { l: 0, r: 3 },
      calc: { expr: "4 + 0", result: "4" },
      vars: "best = 4",
    },
    {
      title: "T6 r = 4 · ① 뒤 ②",
      text: "nums[4] = 1 을 더해 창의 합이 5 입니다. 5 > 4 가 참이라 ① nums[0] = 1 을 빼고 l = 1 로 옮깁니다. 창의 길이 4, best = 4 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [1, 4],
      read: [0, 4],
      write: [],
      pointers: { l: 1, r: 4 },
      calc: { expr: "4 + 1 − 1", result: "4" },
      vars: "best = 4",
    },
    {
      title: "T7 r = 5 · ① 뒤 ②",
      text: "nums[5] = 1 을 더해 창의 합이 5 입니다. 5 > 4 가 참이라 ① nums[1] = 2 를 빼고 l = 2 로 옮깁니다. 창의 길이 4, best = 4 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [2, 5],
      read: [1, 5],
      write: [],
      pointers: { l: 2, r: 5 },
      calc: { expr: "4 + 1 − 2", result: "3" },
      vars: "best = 4",
    },
    {
      title: "T8 r = 6 · ②",
      text: "nums[6] = 0 을 더해 창의 합이 3 입니다. 3 > 4 가 거짓이라 줄이지 않습니다. 창의 길이 5, best = 5 입니다.",
      array: [1, 2, 1, 0, 1, 1, 0],
      range: [2, 6],
      read: [6],
      write: [],
      pointers: { l: 2, r: 6 },
      calc: { expr: "3 + 0", result: "3" },
      vars: "best = 5",
    },
  ],
} satisfies ArrayPlayerSpec;
