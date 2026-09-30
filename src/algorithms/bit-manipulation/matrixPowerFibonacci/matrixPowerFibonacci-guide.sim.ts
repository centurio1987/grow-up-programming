import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`matrixPowerFibonacci(10n)`)을 쓴다. 걸음은
 * 반복문 앞(T1) · 바퀴마다 하나(T2~T5) · 반복을 끝내는 걸음(T6)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 칸 `i` 가 `n` 의 자리 `i` 의 비트라서 이진 표기와 좌우가 거꾸로다
 * (`fastPower` · bit-manipulation 편과 같은 약속). 자리 하나에 2×2 행렬 하나가 딸리므로 비트 칸 하나가 격자
 * 두 칸을 덮고(`span: 2`), 그 아래에 행렬의 윗줄과 아랫줄을 칸 줄 둘로 쌓는다 — `step` 의 자리 `i` 는 자리
 * `i` 의 거듭제곱 `M^(2^i)`, `acc` 의 자리 `i` 는 바퀴 `i` 를 마친 누적 행렬이다. 행렬 곱 수는 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `matrixPowerFibonacci-guide.test.ts` 가 잰다.
 */

export const powMatrix = {
  player: "stage",
  stage: "array",
  arrayName: "n 의 비트",
  rangeLabel: "남은 e",
  title: "matrixPowerFibonacci(10n)",
  result: "55n",
  steps: [
    {
      title: "T1 반복문 앞",
      text: "acc 를 단위행렬 M^0 으로, step 을 전이 행렬 M^1 로, e 를 10 으로 둡니다. step 이 자리 0 의 거듭제곱입니다.",
      array: [0, 1, 0, 1],
      span: 2,
      range: [0, 3],
      rangeSide: "e = 10",
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "step = TRANSITION",
        result: "M^1",
      },
      vars: "행렬 곱 0",
      layers: [
        {
          name: "step",
          values: ["1", "1", null, null, null, null, null, null, null, null],
          read: [],
          write: [0, 1],
          side: "step = M^1",
          caret: false,
        },
        {
          name: "",
          values: ["1", "0", null, null, null, null, null, null, null, null],
          read: [],
          write: [0, 1],
          side: "행렬 1 / 5",
        },
        {
          name: "acc",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
          side: "acc = M^0",
          caret: false,
        },
        {
          name: "",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
          side: "행렬 0 / 4",
        },
      ],
    },
    {
      title: "T2 자리 0 · 비트 0",
      text: "e = 10 = 1010₂ 의 최하위 비트를 읽습니다. 비트가 0 이라 acc 는 M^0 그대로입니다. 그다음 step 을 제곱해 자리 1 의 거듭제곱 M^2 를 만들고, e 를 한 칸 옮겨 5 로 둡니다.",
      array: [0, 1, 0, 1],
      span: 2,
      range: [0, 3],
      rangeSide: "e = 10",
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "10 & 1 = 0",
        result: "누적 건너뜀",
      },
      vars: "행렬 곱 1",
      layers: [
        {
          name: "step",
          values: ["1", "1", "2", "1", null, null, null, null, null, null],
          read: [0, 1],
          write: [2, 3],
          side: "step = M^2",
          caret: false,
        },
        {
          name: "",
          values: ["1", "0", "1", "1", null, null, null, null, null, null],
          read: [0, 1],
          write: [2, 3],
          side: "행렬 2 / 5",
        },
        {
          name: "acc",
          values: ["1", "0", null, null, null, null, null, null],
          read: [],
          write: [],
          side: "acc = M^0",
          caret: false,
        },
        {
          name: "",
          values: ["0", "1", null, null, null, null, null, null],
          read: [],
          write: [],
          side: "행렬 1 / 4",
        },
      ],
    },
    {
      title: "T3 자리 1 · 비트 1",
      text: "e = 5 = 101₂ 의 최하위 비트를 읽습니다. 비트가 1 이라 acc 에 step = M^2 를 곱해 M^2 로 둡니다. 그다음 step 을 제곱해 자리 2 의 거듭제곱 M^4 를 만들고, e 를 한 칸 옮겨 2 로 둡니다.",
      array: [0, 1, 0, 1],
      span: 2,
      range: [1, 3],
      rangeSide: "e = 5",
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "M^0 · M^2 =",
        result: "M^2",
      },
      vars: "행렬 곱 3",
      layers: [
        {
          name: "step",
          values: ["1", "1", "2", "1", "5", "3", null, null, null, null],
          read: [2, 3],
          write: [4, 5],
          side: "step = M^4",
          caret: false,
        },
        {
          name: "",
          values: ["1", "0", "1", "1", "3", "2", null, null, null, null],
          read: [2, 3],
          write: [4, 5],
          side: "행렬 3 / 5",
        },
        {
          name: "acc",
          values: ["1", "0", "2", "1", null, null, null, null],
          read: [0, 1],
          write: [2, 3],
          side: "acc = M^2",
          caret: false,
        },
        {
          name: "",
          values: ["0", "1", "1", "1", null, null, null, null],
          read: [0, 1],
          write: [2, 3],
          side: "행렬 2 / 4",
        },
      ],
    },
    {
      title: "T4 자리 2 · 비트 0",
      text: "e = 2 = 10₂ 의 최하위 비트를 읽습니다. 비트가 0 이라 acc 는 M^2 그대로입니다. 그다음 step 을 제곱해 자리 3 의 거듭제곱 M^8 을 만들고, e 를 한 칸 옮겨 1 로 둡니다.",
      array: [0, 1, 0, 1],
      span: 2,
      range: [2, 3],
      rangeSide: "e = 2",
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "2 & 1 = 0",
        result: "누적 건너뜀",
      },
      vars: "행렬 곱 4",
      layers: [
        {
          name: "step",
          values: ["1", "1", "2", "1", "5", "3", "34", "21", null, null],
          read: [4, 5],
          write: [6, 7],
          side: "step = M^8",
          caret: false,
        },
        {
          name: "",
          values: ["1", "0", "1", "1", "3", "2", "21", "13", null, null],
          read: [4, 5],
          write: [6, 7],
          side: "행렬 4 / 5",
        },
        {
          name: "acc",
          values: ["1", "0", "2", "1", "2", "1", null, null],
          read: [],
          write: [],
          side: "acc = M^2",
          caret: false,
        },
        {
          name: "",
          values: ["0", "1", "1", "1", "1", "1", null, null],
          read: [],
          write: [],
          side: "행렬 3 / 4",
        },
      ],
    },
    {
      title: "T5 자리 3 · 비트 1",
      text: "e = 1 = 1₂ 의 최하위 비트를 읽습니다. 비트가 1 이라 acc 에 step = M^8 을 곱해 M^10 으로 둡니다. 그다음 step 을 제곱해 자리 4 의 거듭제곱 M^16 을 만들고, e 를 한 칸 옮겨 0 으로 둡니다.",
      array: [0, 1, 0, 1],
      span: 2,
      range: [3, 3],
      rangeSide: "e = 1",
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "M^2 · M^8 =",
        result: "M^10",
      },
      vars: "행렬 곱 6",
      layers: [
        {
          name: "step",
          values: ["1", "1", "2", "1", "5", "3", "34", "21", "1597", "987"],
          read: [6, 7],
          write: [8, 9],
          side: "step = M^16",
          caret: false,
        },
        {
          name: "",
          values: ["1", "0", "1", "1", "3", "2", "21", "13", "987", "610"],
          read: [6, 7],
          write: [8, 9],
          side: "행렬 5 / 5",
        },
        {
          name: "acc",
          values: ["1", "0", "2", "1", "2", "1", "89", "55"],
          read: [4, 5],
          write: [6, 7],
          side: "acc = M^10",
          caret: false,
        },
        {
          name: "",
          values: ["0", "1", "1", "1", "1", "1", "55", "34"],
          read: [4, 5],
          write: [6, 7],
          side: "행렬 4 / 4",
        },
      ],
    },
    {
      title: "T6 e = 0 · 반환",
      text: "e 가 0 이라 e > 0 이 거짓입니다. 반복을 끝내고 acc = M^10 의 오른쪽 위 칸 55 를 돌려줍니다. 마지막 바퀴가 만든 step = M^16 은 쓰이지 않습니다.",
      array: [0, 1, 0, 1],
      span: 2,
      range: null,
      rangeSide: "e = 0",
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "acc[0][1] =",
        result: "55",
      },
      vars: "행렬 곱 6",
      layers: [
        {
          name: "step",
          values: ["1", "1", "2", "1", "5", "3", "34", "21", "1597", "987"],
          read: [],
          write: [],
          side: "step = M^16",
          caret: false,
        },
        {
          name: "",
          values: ["1", "0", "1", "1", "3", "2", "21", "13", "987", "610"],
          read: [],
          write: [],
          side: "행렬 5 / 5",
        },
        {
          name: "acc",
          values: ["1", "0", "2", "1", "2", "1", "89", "55"],
          read: [6, 7],
          write: [],
          side: "acc = M^10",
          caret: false,
        },
        {
          name: "",
          values: ["0", "1", "1", "1", "1", "1", "55", "34"],
          read: [6, 7],
          write: [],
          side: "행렬 4 / 4",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
