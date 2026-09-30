import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`extendedEuclidean(-510n, 183n)`)을 쓴다. 걸음은
 * 부호를 떼고 첫 두 칸을 정하는 걸음(T1) · 바퀴마다 하나(T2~T7) · 반복을 끝내고 부호를 붙이는 걸음(T8)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 무대의 줄은 앞 편 `gcd` 와 같은 나머지 수열이고, 그 아래 `layers` 로 계수
 * 두 줄(`s` 줄 · `t` 줄)을 쌓는다 — 칸 `k` 의 세 값이 `r_k = A·s_k + B·t_k` 다. 괄호가 바퀴를 시작할 때의
 * 이웃 두 칸, ▲ 가 이번에 읽은 두 칸, 새로 쓴 칸이 이번 나머지와 그 두 계수다. 값 줄 곁말은 채운 칸 가운데
 * `A·s + B·t = r` 이 맞는 칸의 수이고, 나눗셈 횟수가 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `extendedEuclidean-guide.test.ts` 가 잰다.
 */

export const eeaWalk = {
  player: "stage",
  stage: "array",
  arrayName: "나머지 수열",
  rangeLabel: "(r0, r1)",
  title: "extendedEuclidean(-510n, 183n)",
  result: "{ g: 3n, x: -14n, y: -39n }",
  steps: [
    {
      title: "T1 부호를 떼고 첫 두 칸을 정한다",
      text: "a = -510 이 음수라 부호 -1 을 따로 적어 두고 r0 를 절댓값 510 으로 둡니다. b = 183 이 양수라 r1 은 183 그대로입니다. 510 = 510 × 1 + 183 × 0 이고 183 = 510 × 0 + 183 × 1 이라, 첫 두 칸의 계수가 (1, 0) 과 (0, 1) 입니다.",
      array: [510, 183, null, null, null, null, null, null],
      range: [0, 1],
      rangeSide: "510·s + 183·t = r 인 칸 2 / 2",
      read: [],
      write: [0, 1],
      pointers: {
        r0: 0,
        r1: 1,
      },
      calc: {
        expr: "|-510| · |183|",
        result: "r0 = 510 · r1 = 183",
      },
      vars: "나눗셈 0",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, null, null, null, null, null, null],
          read: [],
          write: [0, 1],
        },
        {
          name: "t 줄",
          values: [0, 1, null, null, null, null, null, null],
          read: [],
          write: [0, 1],
        },
      ],
    },
    {
      title: "T2 510 = 2 × 183 + 144",
      text: "510 을 183 으로 나눈 몫이 2, 나머지가 144 입니다. 같은 몫으로 s 는 1 - 2 × 0 = 1, t 는 0 - 2 × 1 = -2 가 되어 새 칸이 510 × 1 + 183 × (-2) = 144 입니다.",
      array: [510, 183, 144, null, null, null, null, null],
      range: [0, 1],
      rangeSide: "510·s + 183·t = r 인 칸 3 / 3",
      read: [0, 1],
      write: [2],
      pointers: {
        r0: 0,
        r1: 1,
      },
      calc: {
        expr: "q = 510 / 183",
        result: "2",
      },
      vars: "나눗셈 1",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, null, null, null, null, null],
          read: [0, 1],
          write: [2],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, null, null, null, null, null],
          read: [0, 1],
          write: [2],
        },
      ],
    },
    {
      title: "T3 183 = 1 × 144 + 39",
      text: "183 을 144 로 나눈 몫이 1, 나머지가 39 입니다. 같은 몫으로 s 는 0 - 1 × 1 = -1, t 는 1 - 1 × (-2) = 3 이 되어 새 칸이 510 × (-1) + 183 × 3 = 39 입니다.",
      array: [510, 183, 144, 39, null, null, null, null],
      range: [1, 2],
      rangeSide: "510·s + 183·t = r 인 칸 4 / 4",
      read: [1, 2],
      write: [3],
      pointers: {
        r0: 1,
        r1: 2,
      },
      calc: {
        expr: "q = 183 / 144",
        result: "1",
      },
      vars: "나눗셈 2",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, -1, null, null, null, null],
          read: [1, 2],
          write: [3],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, 3, null, null, null, null],
          read: [1, 2],
          write: [3],
        },
      ],
    },
    {
      title: "T4 144 = 3 × 39 + 27",
      text: "144 를 39 로 나눈 몫이 3, 나머지가 27 입니다. 같은 몫으로 s 는 1 - 3 × (-1) = 4, t 는 -2 - 3 × 3 = -11 이 되어 새 칸이 510 × 4 + 183 × (-11) = 27 입니다.",
      array: [510, 183, 144, 39, 27, null, null, null],
      range: [2, 3],
      rangeSide: "510·s + 183·t = r 인 칸 5 / 5",
      read: [2, 3],
      write: [4],
      pointers: {
        r0: 2,
        r1: 3,
      },
      calc: {
        expr: "q = 144 / 39",
        result: "3",
      },
      vars: "나눗셈 3",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, -1, 4, null, null, null],
          read: [2, 3],
          write: [4],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, 3, -11, null, null, null],
          read: [2, 3],
          write: [4],
        },
      ],
    },
    {
      title: "T5 39 = 1 × 27 + 12",
      text: "39 를 27 로 나눈 몫이 1, 나머지가 12 입니다. 같은 몫으로 s 는 -1 - 1 × 4 = -5, t 는 3 - 1 × (-11) = 14 가 되어 새 칸이 510 × (-5) + 183 × 14 = 12 입니다.",
      array: [510, 183, 144, 39, 27, 12, null, null],
      range: [3, 4],
      rangeSide: "510·s + 183·t = r 인 칸 6 / 6",
      read: [3, 4],
      write: [5],
      pointers: {
        r0: 3,
        r1: 4,
      },
      calc: {
        expr: "q = 39 / 27",
        result: "1",
      },
      vars: "나눗셈 4",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, -1, 4, -5, null, null],
          read: [3, 4],
          write: [5],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, 3, -11, 14, null, null],
          read: [3, 4],
          write: [5],
        },
      ],
    },
    {
      title: "T6 27 = 2 × 12 + 3",
      text: "27 을 12 로 나눈 몫이 2, 나머지가 3 입니다. 같은 몫으로 s 는 4 - 2 × (-5) = 14, t 는 -11 - 2 × 14 = -39 가 되어 새 칸이 510 × 14 + 183 × (-39) = 3 입니다.",
      array: [510, 183, 144, 39, 27, 12, 3, null],
      range: [4, 5],
      rangeSide: "510·s + 183·t = r 인 칸 7 / 7",
      read: [4, 5],
      write: [6],
      pointers: {
        r0: 4,
        r1: 5,
      },
      calc: {
        expr: "q = 27 / 12",
        result: "2",
      },
      vars: "나눗셈 5",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, -1, 4, -5, 14, null],
          read: [4, 5],
          write: [6],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, 3, -11, 14, -39, null],
          read: [4, 5],
          write: [6],
        },
      ],
    },
    {
      title: "T7 12 = 4 × 3 + 0",
      text: "12 를 3 으로 나눈 몫이 4, 나머지가 0 입니다. 같은 몫으로 s 는 -5 - 4 × 14 = -61, t 는 14 - 4 × (-39) = 170 이 되어 새 칸이 510 × (-61) + 183 × 170 = 0 입니다. 나머지가 0 이 나왔으니 이 바퀴가 마지막입니다.",
      array: [510, 183, 144, 39, 27, 12, 3, 0],
      range: [5, 6],
      rangeSide: "510·s + 183·t = r 인 칸 8 / 8",
      read: [5, 6],
      write: [7],
      pointers: {
        r0: 5,
        r1: 6,
      },
      calc: {
        expr: "q = 12 / 3",
        result: "4",
      },
      vars: "나눗셈 6",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, -1, 4, -5, 14, -61],
          read: [5, 6],
          write: [7],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, 3, -11, 14, -39, 170],
          read: [5, 6],
          write: [7],
        },
      ],
    },
    {
      title: "T8 r1 = 0 · 부호를 붙여 반환",
      text: "r1 이 0 이라 반복 조건이 거짓입니다. r0 = 3 이 g 이고, 그 칸의 계수 s = 14, t = -39 에 입력의 부호를 붙여 x = -1 × 14 = -14, y = 1 × (-39) = -39 를 돌려줍니다.",
      array: [510, 183, 144, 39, 27, 12, 3, 0],
      range: [6, 7],
      rangeSide: "510·s + 183·t = r 인 칸 8 / 8",
      read: [6, 7],
      write: [],
      pointers: {
        r0: 6,
        r1: 7,
      },
      calc: {
        expr: "r1 = 0",
        result: "g = 3 · x = -14 · y = -39",
      },
      vars: "나눗셈 6",
      layers: [
        {
          name: "s 줄",
          values: [1, 0, 1, -1, 4, -5, 14, -61],
          read: [6],
          write: [],
        },
        {
          name: "t 줄",
          values: [0, 1, -2, 3, -11, 14, -39, 170],
          read: [6],
          write: [],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
