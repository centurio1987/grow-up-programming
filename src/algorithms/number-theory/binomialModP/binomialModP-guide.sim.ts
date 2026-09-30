import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`binomialModP(34n, 20n, 7n)`)을 쓴다. 걸음은
 * 자리를 떼는 걸음(T1) · 낮은 자리가 경계로 끝나는 걸음(T2) · 높은 자리에서 j 를 정하는 걸음(T3) · 반복
 * 두 번(T4~T5) · 역원을 곱하는 걸음(T6) · 두 자리의 답을 곱하는 걸음(T7)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 칸 `i` 가 `n` 의 7 진 자릿수의 자리 `i` 라서 7 진 표기와 좌우가
 * 거꾸로다(number-theory 편 `fastPower` 와 같은 약속). 괄호 「푸는 자리」는 지금 호출이 맡은 자리들이고,
 * 그 아래 다섯 줄이 알고리즘이 자리마다 쌓는 값이다 — `k` 의 자릿수, 반복이 모은 `num` · `den`, 역원
 * `inv`, 그 자리의 답. 경계로 끝난 자리의 `num` · `den` · `inv` 는 「—」다. 모듈러 곱셈 수는 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `binomialModP-guide.test.ts` 가 잰다.
 */

export const lucasWalk = {
  player: "stage",
  stage: "array",
  arrayName: "n 의 자리",
  rangeLabel: "푸는 자리",
  title: "binomialModP(34n, 20n, 7n)",
  result: "6n",
  steps: [
    {
      title: "T1 자리 0 을 떼어 낸다",
      text: "n = 34 가 p = 7 이상이라 자리를 가릅니다. 34 = 4 · 7 + 6, 20 = 2 · 7 + 6 이라, 가장 낮은 자리는 (6, 6) 이고 남은 자리는 (4, 2) 입니다.",
      array: [6, 4],
      range: [0, 1],
      read: [0],
      pointers: {},
      calc: {
        expr: "34 % 7 · 20 % 7",
        result: "(6, 6)",
      },
      vars: "모듈러 곱셈 0",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
          read: [0],
        },
        {
          name: "num",
          values: [null, null],
        },
        {
          name: "den",
          values: [null, null],
        },
        {
          name: "inv",
          values: [null, null],
        },
        {
          name: "자리의 답",
          values: [null, null],
        },
      ],
    },
    {
      title: "T2 자리 0 · 경계",
      text: "이 자리는 (6, 6) 입니다. k === n 이 참이라(6 = 6) 반복에 들어가지 않고 1 을 돌려줍니다.",
      array: [6, 4],
      range: [0, 0],
      read: [0],
      pointers: {},
      calc: {
        expr: "6 === 6",
        result: "1 반환",
      },
      vars: "모듈러 곱셈 0",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
          read: [0],
        },
        {
          name: "num",
          values: ["—", null],
          write: [0],
        },
        {
          name: "den",
          values: ["—", null],
          write: [0],
        },
        {
          name: "inv",
          values: ["—", null],
          write: [0],
        },
        {
          name: "자리의 답",
          values: ["1", null],
          write: [0],
        },
      ],
    },
    {
      title: "T3 자리 1 · j 를 정한다",
      text: "이 자리는 (4, 2) 입니다. n = 4 가 p = 7 보다 작아 반복으로 갑니다. n − k = 2 와 k = 2 중 작은 쪽이 2 라 반복을 2 번 합니다. num 과 den 을 1 에서 시작합니다.",
      array: [6, 4],
      range: [1, 1],
      read: [1],
      pointers: {},
      calc: {
        expr: "min(4 − 2, 2)",
        result: "j = 2",
      },
      vars: "모듈러 곱셈 0",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
          read: [1],
        },
        {
          name: "num",
          values: ["—", "1"],
          write: [1],
        },
        {
          name: "den",
          values: ["—", "1"],
          write: [1],
        },
        {
          name: "inv",
          values: ["—", null],
        },
        {
          name: "자리의 답",
          values: ["1", null],
        },
      ],
    },
    {
      title: "T4 자리 1 · 반복 i = 0",
      text: "num 에 n − i = 4 를 곱해 법으로 줄이면 4 이고, den 에 i + 1 = 1 을 곱해 줄이면 1 입니다.",
      array: [6, 4],
      range: [1, 1],
      read: [1],
      pointers: {},
      calc: {
        expr: "1 · 4 mod 7 · 1 · 1 mod 7",
        result: "num = 4 · den = 1",
      },
      vars: "모듈러 곱셈 2",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
        },
        {
          name: "num",
          values: ["—", "4"],
          write: [1],
        },
        {
          name: "den",
          values: ["—", "1"],
          write: [1],
        },
        {
          name: "inv",
          values: ["—", null],
        },
        {
          name: "자리의 답",
          values: ["1", null],
        },
      ],
    },
    {
      title: "T5 자리 1 · 반복 i = 1",
      text: "num 에 n − i = 3 을 곱해 법으로 줄이면 5 이고, den 에 i + 1 = 2 를 곱해 줄이면 2 입니다.",
      array: [6, 4],
      range: [1, 1],
      read: [1],
      pointers: {},
      calc: {
        expr: "4 · 3 mod 7 · 1 · 2 mod 7",
        result: "num = 5 · den = 2",
      },
      vars: "모듈러 곱셈 4",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
        },
        {
          name: "num",
          values: ["—", "5"],
          write: [1],
        },
        {
          name: "den",
          values: ["—", "2"],
          write: [1],
        },
        {
          name: "inv",
          values: ["—", null],
        },
        {
          name: "자리의 답",
          values: ["1", null],
        },
      ],
    },
    {
      title: "T6 자리 1 · 역원을 곱한다",
      text: "den = 2 의 역원을 이진 거듭제곱으로 2^5 mod 7 로 구하면 4 입니다. 2 · 4 mod 7 = 1 이고, 이 자리의 답은 5 · 4 mod 7 = 6 입니다.",
      array: [6, 4],
      range: [1, 1],
      read: [1],
      pointers: {},
      calc: {
        expr: "2^5 mod 7 = 4 · 5 · 4 mod 7",
        result: "6",
      },
      vars: "모듈러 곱셈 10",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
        },
        {
          name: "num",
          values: ["—", "5"],
          read: [1],
        },
        {
          name: "den",
          values: ["—", "2"],
          read: [1],
        },
        {
          name: "inv",
          values: ["—", "4"],
          write: [1],
        },
        {
          name: "자리의 답",
          values: ["1", "6"],
          write: [1],
        },
      ],
    },
    {
      title: "T7 두 자리의 답을 곱한다",
      text: "낮은 자리의 답 1 과 남은 자리의 답 6 을 곱해 법 7 로 줄입니다. 6 이 C(34, 20) 를 7 로 나눈 나머지입니다.",
      array: [6, 4],
      range: [0, 1],
      read: [],
      pointers: {},
      calc: {
        expr: "1 · 6 mod 7",
        result: "6",
      },
      vars: "모듈러 곱셈 11",
      layers: [
        {
          name: "k 의 자리",
          values: ["6", "2"],
        },
        {
          name: "num",
          values: ["—", "5"],
        },
        {
          name: "den",
          values: ["—", "2"],
        },
        {
          name: "inv",
          values: ["—", "4"],
        },
        {
          name: "자리의 답",
          values: ["1", "6"],
          read: [0, 1],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
