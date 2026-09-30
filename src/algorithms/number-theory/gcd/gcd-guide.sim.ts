import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`gcd(-273n, 441n)`)을 쓴다. 걸음은 부호를
 * 떼는 걸음(T1) · 바퀴마다 하나(T2~T8) · 반복을 끝내는 걸음(T9)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 무대의 줄은 나머지 수열이다 — 칸 `k` 가 `r_k` 이고, 이웃한 두 칸이 한
 * 바퀴의 `(x, y)` 다. 괄호가 바퀴를 시작할 때의 쌍, ▲ 가 이번에 나눈 두 칸, 새로 쓴 칸이 이번 나머지다.
 * 값 줄 곁말은 쌍의 공약수 집합이고, 나눗셈 횟수가 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `gcd-guide.test.ts` 가 잰다.
 */

export const gcdWalk = {
  player: "stage",
  stage: "array",
  arrayName: "나머지 수열",
  rangeLabel: "(x, y)",
  title: "gcd(-273n, 441n)",
  result: "21n",
  steps: [
    {
      title: "T1 부호를 뗀다",
      text: "a = -273 이 음수라 x 를 절댓값 273 으로 둡니다. b = 441 은 이미 양수라 y 가 441 그대로입니다. 이 두 값이 나머지 수열의 첫 두 칸입니다.",
      array: [273, 441, null, null, null, null, null, null, null],
      range: [0, 1],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [],
      write: [0, 1],
      pointers: {
        x: 0,
        y: 1,
      },
      calc: {
        expr: "|-273| · |441|",
        result: "x = 273 · y = 441",
      },
      vars: "나눗셈 0",
    },
    {
      title: "T2 273 = 0 × 441 + 273",
      text: "273 을 441 로 나눕니다. x 가 y 보다 작아 몫이 0 이고 나머지가 x 자신인 273 입니다. 다음 쌍은 (441, 273) 입니다 — 두 값이 뒤바뀌었습니다.",
      array: [273, 441, 273, null, null, null, null, null, null],
      range: [0, 1],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [0, 1],
      write: [2],
      pointers: {
        x: 0,
        y: 1,
      },
      calc: {
        expr: "273 mod 441",
        result: "273",
      },
      vars: "나눗셈 1",
    },
    {
      title: "T3 441 = 1 × 273 + 168",
      text: "441 을 273 으로 나눕니다. 몫 1, 나머지 168 입니다. 다음 쌍은 (273, 168) 입니다.",
      array: [273, 441, 273, 168, null, null, null, null, null],
      range: [1, 2],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [1, 2],
      write: [3],
      pointers: {
        x: 1,
        y: 2,
      },
      calc: {
        expr: "441 mod 273",
        result: "168",
      },
      vars: "나눗셈 2",
    },
    {
      title: "T4 273 = 1 × 168 + 105",
      text: "273 을 168 로 나눕니다. 몫 1, 나머지 105 입니다. 다음 쌍은 (168, 105) 입니다.",
      array: [273, 441, 273, 168, 105, null, null, null, null],
      range: [2, 3],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [2, 3],
      write: [4],
      pointers: {
        x: 2,
        y: 3,
      },
      calc: {
        expr: "273 mod 168",
        result: "105",
      },
      vars: "나눗셈 3",
    },
    {
      title: "T5 168 = 1 × 105 + 63",
      text: "168 을 105 로 나눕니다. 몫 1, 나머지 63 입니다. 다음 쌍은 (105, 63) 입니다.",
      array: [273, 441, 273, 168, 105, 63, null, null, null],
      range: [3, 4],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [3, 4],
      write: [5],
      pointers: {
        x: 3,
        y: 4,
      },
      calc: {
        expr: "168 mod 105",
        result: "63",
      },
      vars: "나눗셈 4",
    },
    {
      title: "T6 105 = 1 × 63 + 42",
      text: "105 를 63 으로 나눕니다. 몫 1, 나머지 42 입니다. 다음 쌍은 (63, 42) 입니다.",
      array: [273, 441, 273, 168, 105, 63, 42, null, null],
      range: [4, 5],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [4, 5],
      write: [6],
      pointers: {
        x: 4,
        y: 5,
      },
      calc: {
        expr: "105 mod 63",
        result: "42",
      },
      vars: "나눗셈 5",
    },
    {
      title: "T7 63 = 1 × 42 + 21",
      text: "63 을 42 로 나눕니다. 몫 1, 나머지 21 입니다. 다음 쌍은 (42, 21) 입니다.",
      array: [273, 441, 273, 168, 105, 63, 42, 21, null],
      range: [5, 6],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [5, 6],
      write: [7],
      pointers: {
        x: 5,
        y: 6,
      },
      calc: {
        expr: "63 mod 42",
        result: "21",
      },
      vars: "나눗셈 6",
    },
    {
      title: "T8 42 = 2 × 21 + 0",
      text: "42 를 21 로 나눕니다. 몫 2, 나머지 0 입니다. 나머지가 0 이 나왔고, 다음 쌍은 (21, 0) 입니다.",
      array: [273, 441, 273, 168, 105, 63, 42, 21, 0],
      range: [6, 7],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [6, 7],
      write: [8],
      pointers: {
        x: 6,
        y: 7,
      },
      calc: {
        expr: "42 mod 21",
        result: "0",
      },
      vars: "나눗셈 7",
    },
    {
      title: "T9 y = 0 · 반환",
      text: "y 가 0 이라 반복 조건이 거짓입니다. 반복을 끝내고 x = 21 을 돌려줍니다. (21, 0) 의 공약수 집합은 21 의 약수 전체이고, 그중 가장 큰 것이 21 입니다.",
      array: [273, 441, 273, 168, 105, 63, 42, 21, 0],
      range: [7, 8],
      rangeSide: "공약수 {1, 3, 7, 21}",
      read: [7, 8],
      write: [],
      pointers: {
        x: 7,
        y: 8,
      },
      calc: {
        expr: "y = 0",
        result: "반복 끝 → 21 반환",
      },
      vars: "나눗셈 7",
    },
  ],
} satisfies ArrayPlayerSpec;
