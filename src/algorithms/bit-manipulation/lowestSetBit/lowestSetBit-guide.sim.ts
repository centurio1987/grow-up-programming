/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `x = 40`(`00101000₂`). `lowbitWalk` 는
 * 입력 T1 · 뒤집기 T2 · 자리올림이 멈출 때까지 자리마다 더하기 T3~T6 · 나머지 자리 T7 · AND T8 · 반환 T9 다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 맨 윗줄이 x 의 아래 여덟 자리이고 칸 `j` 가 자리 `j` 라 이진 표기와
 * 좌우가 거꾸로다. 그 아래 `layers` 세 줄이 `~x` · `-x` · `x & -x` 이고, 아직 정해지지 않은 자리는 비운다.
 * 괄호 「보는 자리」는 그 걸음이 다루는 자리이고, 자리올림을 더하는 걸음에서는 자리올림이 닿은 자리다.
 * 계산 한 줄은 알약, 자리올림은 무대에 자리가 없어 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `lowestSetBit-guide.test.ts` 가 잰다.
 */

export const lowbitWalk = {
  player: "stage",
  stage: "array",
  arrayName: "x",
  rangeLabel: "보는 자리",
  title: "lowestSetBit(40)",
  result: "8",
  steps: [
    {
      title: "T1 x = 40 을 받는다",
      text: "x 의 아래 여덟 자리를 칸에 놓습니다. 칸 j 가 자리 j 라 이진 표기(00101000₂)와 좌우가 거꾸로입니다. 1 인 자리는 자리 3 · 5 이고, 최하위 1 비트는 자리 3 입니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 7],
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "x",
        result: "40 = 00101000₂",
      },
      vars: null,
      layers: [
        {
          name: "~x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
        {
          name: "-x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T2 ① 모든 자리를 뒤집는다",
      text: "x 의 모든 자리를 뒤집어 ~x = -41 을 만듭니다. 자리 3 아래가 전부 1 이 되고 자리 3 이 0 이 됩니다. 그리지 않은 위 24 자리는 전부 1 입니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 7],
      read: [0, 1, 2, 3, 4, 5, 6, 7],
      write: [],
      pointers: {},
      calc: {
        expr: "~40",
        result: "-41",
      },
      vars: null,
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [],
          write: [0, 1, 2, 3, 4, 5, 6, 7],
        },
        {
          name: "-x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T3 ② 자리 0 에 1 을 더한다",
      text: "자리 0 의 ~x 비트 1 에 자리올림 1 을 더하면 2 라 그 자리는 0 이 되고 자리올림 1 을 위로 넘깁니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 0],
      rangeSide: "자리올림이 닿은 자리 1 칸",
      read: [],
      write: [],
      pointers: {
        j: 0,
      },
      calc: {
        expr: "1 + 1",
        result: "0, 자리올림 1",
      },
      vars: "자리올림 1",
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [0],
          write: [],
        },
        {
          name: "-x",
          values: [0, null, null, null, null, null, null, null],
          read: [],
          write: [0],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T4 ② 자리 1 에 1 을 더한다",
      text: "자리 1 의 ~x 비트 1 에 자리올림 1 을 더하면 2 라 그 자리는 0 이 되고 자리올림 1 을 위로 넘깁니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 1],
      rangeSide: "자리올림이 닿은 자리 2 칸",
      read: [],
      write: [],
      pointers: {
        j: 1,
      },
      calc: {
        expr: "1 + 1",
        result: "0, 자리올림 1",
      },
      vars: "자리올림 1",
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [1],
          write: [],
        },
        {
          name: "-x",
          values: [0, 0, null, null, null, null, null, null],
          read: [],
          write: [1],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T5 ② 자리 2 에 1 을 더한다",
      text: "자리 2 의 ~x 비트 1 에 자리올림 1 을 더하면 2 라 그 자리는 0 이 되고 자리올림 1 을 위로 넘깁니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 2],
      rangeSide: "자리올림이 닿은 자리 3 칸",
      read: [],
      write: [],
      pointers: {
        j: 2,
      },
      calc: {
        expr: "1 + 1",
        result: "0, 자리올림 1",
      },
      vars: "자리올림 1",
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [2],
          write: [],
        },
        {
          name: "-x",
          values: [0, 0, 0, null, null, null, null, null],
          read: [],
          write: [2],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T6 ② 자리 3 에 1 을 더한다",
      text: "자리 3 의 ~x 비트 0 에 자리올림 1 을 더하면 1 이라 그 자리가 1 이 되고, 넘길 자리올림이 없어 여기서 멈춥니다. 자리 3 은 x 의 최하위 1 비트 자리입니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 3],
      rangeSide: "자리올림이 닿은 자리 4 칸",
      read: [],
      write: [],
      pointers: {
        j: 3,
      },
      calc: {
        expr: "0 + 1",
        result: "1, 자리올림 0",
      },
      vars: "자리올림 0",
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [3],
          write: [],
        },
        {
          name: "-x",
          values: [0, 0, 0, 1, null, null, null, null],
          read: [],
          write: [3],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T7 ② 자리 4 부터 위는 그대로 둔다",
      text: "자리올림이 0 이라 자리 4 부터 위는 더할 것이 없어 ~x 의 비트가 그대로 -x 로 내려옵니다. 모은 값은 -x = -40 입니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [4, 7],
      rangeSide: "자리올림이 없는 자리 4 칸",
      read: [],
      write: [],
      pointers: {},
      calc: {
        expr: "자리올림 0",
        result: "자리 4 ~ 31 은 ~x 그대로",
      },
      vars: "자리올림 0",
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [4, 5, 6, 7],
          write: [],
        },
        {
          name: "-x",
          values: [0, 0, 0, 1, 1, 0, 1, 1],
          read: [],
          write: [4, 5, 6, 7],
        },
        {
          name: "x & -x",
          values: [null, null, null, null, null, null, null, null],
          read: [],
          write: [],
        },
      ],
    },
    {
      title: "T8 ③ x 와 -x 를 AND 한다",
      text: "x 와 -x 를 자리마다 AND 합니다. 함께 1 인 자리는 자리 3 하나이고, 나머지 자리는 0 입니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 7],
      read: [0, 1, 2, 3, 4, 5, 6, 7],
      write: [],
      pointers: {},
      calc: {
        expr: "40 & -40",
        result: "8",
      },
      vars: null,
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [],
          write: [],
        },
        {
          name: "-x",
          values: [0, 0, 0, 1, 1, 0, 1, 1],
          read: [0, 1, 2, 3, 4, 5, 6, 7],
          write: [],
        },
        {
          name: "x & -x",
          values: [0, 0, 0, 1, 0, 0, 0, 0],
          read: [],
          write: [0, 1, 2, 3, 4, 5, 6, 7],
        },
      ],
    },
    {
      title: "T9 ③ 값을 돌려준다",
      text: "자리 3 하나만 남은 값 8 을 돌려줍니다.",
      array: [0, 0, 0, 1, 0, 1, 0, 0],
      range: [0, 7],
      read: [],
      write: [],
      pointers: {
        p: 3,
      },
      calc: {
        expr: "반환",
        result: "8 = 2^3",
      },
      vars: null,
      layers: [
        {
          name: "~x",
          values: [1, 1, 1, 0, 1, 0, 1, 1],
          read: [],
          write: [],
        },
        {
          name: "-x",
          values: [0, 0, 0, 1, 1, 0, 1, 1],
          read: [],
          write: [],
        },
        {
          name: "x & -x",
          values: [0, 0, 0, 1, 0, 0, 0, 0],
          read: [3],
          write: [],
        },
      ],
    },
  ],
};
