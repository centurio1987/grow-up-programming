import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`fastPower(3n, 26n, 1000n)`)을 쓴다. 걸음은
 * 반복문 앞(T1) · 바퀴마다 하나(T2~T6) · 반복을 끝내는 걸음(T7)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 칸 `i` 가 지수의 자리 `i` 의 비트라서 이진 표기와 좌우가 거꾸로다
 * (bit-manipulation 편과 같은 약속). 괄호 「남은 e」는 바퀴를 시작할 때 `e` 에 남은 자리, ▲ 는 이번에 읽은
 * 비트다. 그 아래 두 줄이 알고리즘이 쌓는 값이다 — `b` 줄의 칸 `i` 는 자리 `i` 의 거듭제곱, `result` 줄의
 * 칸 `i` 는 바퀴 `i` 를 마친 누적값이다. 모듈러 곱셈 수는 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `fastPower-guide.test.ts` 가 잰다.
 */

export const powBits = {
  player: "stage",
  stage: "array",
  arrayName: "exp 의 비트",
  rangeLabel: "남은 e",
  title: "fastPower(3n, 26n, 1000n)",
  result: "329n",
  steps: [
    {
      title: "T1 반복문 앞",
      text: "result 를 1 % 1000 = 1 로, b 를 3 을 법 안으로 옮긴 3 으로, e 를 26 으로 둡니다. b 가 자리 0 의 거듭제곱입니다.",
      array: [0, 1, 0, 1, 1],
      range: [0, 4],
      rangeSide: "e = 26",
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "((3 % 1000) + 1000) % 1000",
        result: "b = 3",
      },
      vars: "모듈러 곱셈 0",
      layers: [
        {
          name: "b",
          values: ["3", null, null, null, null, null],
          write: [0],
        },
        {
          name: "result",
          values: [null, null, null, null, null],
          side: "result = 1",
        },
      ],
    },
    {
      title: "T2 자리 0 · 비트 0",
      text: "e = 26 = 11010₂ 의 최하위 비트를 읽습니다. 비트가 0 이라 result 는 1 그대로입니다. 그다음 b 를 제곱해 자리 1 의 거듭제곱 9 를 만들고, e 를 한 칸 옮겨 13 으로 둡니다.",
      array: [0, 1, 0, 1, 1],
      range: [0, 4],
      rangeSide: "e = 26",
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "26 & 1 = 0",
        result: "누적 건너뜀",
      },
      vars: "모듈러 곱셈 1",
      layers: [
        {
          name: "b",
          values: ["3", "9", null, null, null, null],
          read: [0],
          write: [1],
        },
        {
          name: "result",
          values: ["1", null, null, null, null],
          write: [],
          side: "result = 1",
        },
      ],
    },
    {
      title: "T3 자리 1 · 비트 1",
      text: "e = 13 = 1101₂ 의 최하위 비트를 읽습니다. 비트가 1 이라 result 에 b = 9 를 곱해 9 로 둡니다. 그다음 b 를 제곱해 자리 2 의 거듭제곱 81 을 만들고, e 를 한 칸 옮겨 6 으로 둡니다.",
      array: [0, 1, 0, 1, 1],
      range: [1, 4],
      rangeSide: "e = 13",
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "1 · 9 mod 1000",
        result: "9",
      },
      vars: "모듈러 곱셈 3",
      layers: [
        {
          name: "b",
          values: ["3", "9", "81", null, null, null],
          read: [1],
          write: [2],
        },
        {
          name: "result",
          values: ["1", "9", null, null, null],
          write: [1],
          side: "result = 9",
        },
      ],
    },
    {
      title: "T4 자리 2 · 비트 0",
      text: "e = 6 = 110₂ 의 최하위 비트를 읽습니다. 비트가 0 이라 result 는 9 그대로입니다. 그다음 b 를 제곱해 자리 3 의 거듭제곱 561 을 만들고, e 를 한 칸 옮겨 3 으로 둡니다.",
      array: [0, 1, 0, 1, 1],
      range: [2, 4],
      rangeSide: "e = 6",
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "6 & 1 = 0",
        result: "누적 건너뜀",
      },
      vars: "모듈러 곱셈 4",
      layers: [
        {
          name: "b",
          values: ["3", "9", "81", "561", null, null],
          read: [2],
          write: [3],
        },
        {
          name: "result",
          values: ["1", "9", "9", null, null],
          write: [],
          side: "result = 9",
        },
      ],
    },
    {
      title: "T5 자리 3 · 비트 1",
      text: "e = 3 = 11₂ 의 최하위 비트를 읽습니다. 비트가 1 이라 result 에 b = 561 을 곱해 49 로 둡니다. 그다음 b 를 제곱해 자리 4 의 거듭제곱 721 을 만들고, e 를 한 칸 옮겨 1 로 둡니다.",
      array: [0, 1, 0, 1, 1],
      range: [3, 4],
      rangeSide: "e = 3",
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "9 · 561 mod 1000",
        result: "49",
      },
      vars: "모듈러 곱셈 6",
      layers: [
        {
          name: "b",
          values: ["3", "9", "81", "561", "721", null],
          read: [3],
          write: [4],
        },
        {
          name: "result",
          values: ["1", "9", "9", "49", null],
          write: [3],
          side: "result = 49",
        },
      ],
    },
    {
      title: "T6 자리 4 · 비트 1",
      text: "e = 1 = 1₂ 의 최하위 비트를 읽습니다. 비트가 1 이라 result 에 b = 721 을 곱해 329 로 둡니다. 그다음 b 를 제곱해 자리 5 의 거듭제곱 841 을 만들고, e 를 한 칸 옮겨 0 으로 둡니다.",
      array: [0, 1, 0, 1, 1],
      range: [4, 4],
      rangeSide: "e = 1",
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "49 · 721 mod 1000",
        result: "329",
      },
      vars: "모듈러 곱셈 8",
      layers: [
        {
          name: "b",
          values: ["3", "9", "81", "561", "721", "841"],
          read: [4],
          write: [5],
        },
        {
          name: "result",
          values: ["1", "9", "9", "49", "329"],
          write: [4],
          side: "result = 329",
        },
      ],
    },
    {
      title: "T7 e = 0 · 반환",
      text: "e 가 0 이라 e > 0 이 거짓입니다. 반복을 끝내고 result 329 를 돌려줍니다. 마지막 바퀴가 만든 b = 841 은 쓰이지 않습니다.",
      array: [0, 1, 0, 1, 1],
      range: null,
      rangeSide: "e = 0",
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "0 > 0",
        result: "거짓 → 329 반환",
      },
      vars: "모듈러 곱셈 8",
      layers: [
        {
          name: "b",
          values: ["3", "9", "81", "561", "721", "841"],
        },
        {
          name: "result",
          values: ["1", "9", "9", "49", "329"],
          read: [4],
          side: "result = 329",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
