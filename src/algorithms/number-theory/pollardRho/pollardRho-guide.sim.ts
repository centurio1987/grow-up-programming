import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`pollardRho(8051n)`)을 쓴다. 걸음은 짝수 검사(T1) ·
 * 소수 판정(T2) · 수열 시작(T3) · 두 자리를 한 걸음씩 나아가게 하기(T4~T6) · 반환(T7)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 칸 `i` 가 수열의 `i` 번째 값 `x_i`(법 8,051)이고, 괄호 「만든 수열」은 지금까지
 * 만든 칸, ▲ 는 느린 자리 `x`(칸 `k`)와 빠른 자리 `y`(칸 `2k`)다. 그 아래 두 줄은 같은 칸을 두 소인수 97 과
 * 83 으로 나눈 나머지다 — 코드는 이 두 줄을 계산하지 않고, 최대공약수가 그 줄에서 일어난 일을 대신 알아챈다.
 * 상수 `c` 와 나머지 연산 수는 무대에 자리가 없어 남는 변수다.
 *
 * 옛 패널(`view: ["keyValue"]`)은 변수 여덟을 나열했다. 수열이 무대에 없어서 두 자리가 수열의 어디에 있는지,
 * 법 97 에서 같은 값이 되는 자리가 어디인지 보이지 않았다(SPEC `L48`).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본과 같은 절차를 따라가며 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `pollardRho-guide.test.ts` 가 잰다.
 */

export const rhoWalk = {
  player: "stage",
  stage: "array",
  arrayName: "x mod 8,051",
  rangeLabel: "만든 수열",
  title: "pollardRho(8051n)",
  result: "97n",
  steps: [
    {
      title: "T1 짝수인가",
      text: "8,051 을 2 로 나눈 나머지가 1 이라 짝수가 아닙니다. 수열은 아직 한 칸도 만들지 않았습니다.",
      array: [null, null, null, null, null, null, null],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "8,051 mod 2",
        result: "1",
      },
      vars: "c = — · 나머지 연산 1",
      layers: [
        {
          name: "x mod 97",
          values: [null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
        {
          name: "x mod 83",
          values: [null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T2 소수인가",
      text: "밑 열둘의 판정이 합성수라고 답합니다. 이 판정이 나머지 연산 35 번을 씁니다.",
      array: [null, null, null, null, null, null, null],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "소수 판정(8,051)",
        result: "합성수",
      },
      vars: "c = — · 나머지 연산 36",
      layers: [
        {
          name: "x mod 97",
          values: [null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
        {
          name: "x mod 83",
          values: [null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T3 수열을 시작한다",
      text: "상수 c = 1 이 수열 하나를 정합니다. 두 자리를 칸 0 의 2 에 두고, d 는 계산하지 않고 1 로 둡니다.",
      array: ["2", null, null, null, null, null, null],
      range: [0, 0],
      read: [],
      write: [0],
      pointers: {
        x: 0,
        y: 0,
      },
      calc: {
        expr: "f(t) = (t² + 1) mod 8,051",
        result: "x = y = 2 · d = 1",
      },
      vars: "c = 1 · 나머지 연산 36",
      layers: [
        {
          name: "x mod 97",
          values: ["2", null, null, null, null, null, null],
          read: [],
          write: [0],
        },
        {
          name: "x mod 83",
          values: ["2", null, null, null, null, null, null],
          read: [],
          write: [0],
        },
      ],
    },
    {
      title: "T4 1 걸음",
      text: "x 는 칸 1, y 는 칸 2 로 갑니다. 두 칸의 차와 8,051 의 최대공약수가 1 이라 한 걸음 더 갑니다.",
      array: ["2", "5", "26", null, null, null, null],
      range: [0, 2],
      read: [1, 2],
      write: [1, 2],
      pointers: {
        x: 1,
        y: 2,
      },
      calc: {
        expr: "gcd(|5 − 26|, 8,051)",
        result: "1",
      },
      vars: "c = 1 · 나머지 연산 46",
      layers: [
        {
          name: "x mod 97",
          values: ["2", "5", "26", null, null, null, null],
          read: [1, 2],
          write: [1, 2],
        },
        {
          name: "x mod 83",
          values: ["2", "5", "26", null, null, null, null],
          read: [1, 2],
          write: [1, 2],
        },
      ],
    },
    {
      title: "T5 2 걸음",
      text: "x 는 칸 2, y 는 칸 4 로 갑니다. 두 칸의 차와 8,051 의 최대공약수가 1 이라 한 걸음 더 갑니다.",
      array: ["2", "5", "26", "677", "7,474", null, null],
      range: [0, 4],
      read: [2, 4],
      write: [3, 4],
      pointers: {
        x: 2,
        y: 4,
      },
      calc: {
        expr: "gcd(|26 − 7,474|, 8,051)",
        result: "1",
      },
      vars: "c = 1 · 나머지 연산 59",
      layers: [
        {
          name: "x mod 97",
          values: ["2", "5", "26", "95", "5", null, null],
          read: [2, 4],
          write: [3, 4],
        },
        {
          name: "x mod 83",
          values: ["2", "5", "26", "13", "4", null, null],
          read: [2, 4],
          write: [3, 4],
        },
      ],
    },
    {
      title: "T6 3 걸음",
      text: "x 는 칸 3, y 는 칸 6 으로 갑니다. 두 칸이 법 97 에서 같은 값 95 가 되어 최대공약수가 97 을 냅니다.",
      array: ["2", "5", "26", "677", "7,474", "2,839", "871"],
      range: [0, 6],
      read: [3, 6],
      write: [5, 6],
      pointers: {
        x: 3,
        y: 6,
      },
      calc: {
        expr: "gcd(|677 − 871|, 8,051)",
        result: "97",
      },
      vars: "c = 1 · 나머지 연산 65",
      layers: [
        {
          name: "x mod 97",
          values: ["2", "5", "26", "95", "5", "26", "95"],
          read: [3, 6],
          write: [5, 6],
        },
        {
          name: "x mod 83",
          values: ["2", "5", "26", "13", "4", "17", "41"],
          read: [3, 6],
          write: [5, 6],
        },
      ],
    },
    {
      title: "T7 비자명한 약수를 돌려준다",
      text: "d = 97 이 1 도 8,051 도 아니라 그대로 돌려줍니다. 8,051 ÷ 97 = 83 입니다.",
      array: ["2", "5", "26", "677", "7,474", "2,839", "871"],
      range: [0, 6],
      read: [],
      write: [],
      pointers: {
        x: 3,
        y: 6,
      },
      calc: {
        expr: "97 ≠ 8,051",
        result: "97 반환",
      },
      vars: "c = 1 · 나머지 연산 65",
      layers: [
        {
          name: "x mod 97",
          values: ["2", "5", "26", "95", "5", "26", "95"],
          read: [],
          write: [],
        },
        {
          name: "x mod 83",
          values: ["2", "5", "26", "13", "4", "17", "41"],
          read: [],
          write: [],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
