import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`crt([2n, 3n, 2n], [3n, 5n, 7n])`)을 쓴다. 걸음은 첫
 * 합동식을 누적 합동식으로 받는 걸음(T1) · 합치기마다 셋(모순 판정 · t 풀기 · 누적 합동식 늘리기, T2~T7) · 답을
 * 내는 걸음(T8)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 무대의 줄은 입력 합동식의 법이고, 그 아래 `layers` 로 나머지 줄과 누적
 * 합동식의 두 줄(`curR` · `curM`)을 쌓는다 — 누적 합동식 줄의 칸 `i` 는 합동식 `0 … i` 를 합친 결과다. 괄호가
 * 지금까지 합친 합동식, ▲ 가 이번에 읽은 칸, 새로 쓴 칸이 이번 합치기의 결과다. 확장 유클리드가 낸 `g` · `u` 와
 * 나눗셈 횟수가 남는 변수다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `crt-guide.test.ts` 가 잰다.
 */

export const crtWalk = {
  player: "stage",
  stage: "array",
  arrayName: "법 m",
  rangeLabel: "합친 합동식",
  title: "crt([2n, 3n, 2n], [3n, 5n, 7n])",
  result: "x=23, M=105",
  steps: [
    {
      title: "T1 첫 합동식을 누적 합동식으로 받는다",
      text: "첫 합동식은 x ≡ 2 (mod 3) 입니다. 나머지 2 를 [0, 3) 안으로 맞춘 값이 2 라 누적 합동식을 (curR, curM) = (2, 3) 으로 둡니다.",
      array: [3, 5, 7],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "mod(2, 3)",
        result: "2",
      },
      vars: "나눗셈 1",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [0],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, null, null],
          read: [],
          write: [0],
        },
        {
          name: "curM",
          values: [3, null, null],
          read: [],
          write: [0],
        },
      ],
    },
    {
      title: "T2 diff = 1 · g = 1",
      text: "새 합동식은 x ≡ 3 (mod 5) 입니다. 나머지 차는 diff = 3 - 2 = 1 이고, 확장 유클리드 호제법이 g = gcd(3, 5) = 1 과 계수 u = 2 를 냅니다. 1 을 1 로 나눈 나머지가 0 이라 모순이 아닙니다.",
      array: [3, 5, 7],
      range: [0, 0],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "diff % g = 1 % 1",
        result: "0",
      },
      vars: "g = 1 · u = 2 · 나눗셈 7",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [1],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, null, null],
          read: [0],
          write: [],
        },
        {
          name: "curM",
          values: [3, null, null],
          read: [0],
          write: [],
        },
      ],
    },
    {
      title: "T3 t = 2",
      text: "unit = 5 / 1 = 5 이고 diff / g = 1 입니다. t = mod(1 × 2, 5) = 2 라 curR 을 curM = 3 씩 2 번 옮기면 새 합동식까지 맞습니다.",
      array: [3, 5, 7],
      range: [0, 0],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "t = mod(1 × 2, 5)",
        result: "2",
      },
      vars: "unit = 5 · 나눗셈 10",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [1],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, null, null],
          read: [0],
          write: [],
        },
        {
          name: "curM",
          values: [3, null, null],
          read: [0],
          write: [],
        },
      ],
    },
    {
      title: "T4 x ≡ 8 (mod 15)",
      text: "curR = 2 + 3 × 2 = 8 이고 curM = 3 × 5 = 15 입니다. 합동식 2 개가 x ≡ 8 (mod 15) 하나가 됐습니다.",
      array: [3, 5, 7],
      range: [0, 1],
      read: [],
      write: [1],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "curR = 2 + 3 × 2",
        result: "8",
      },
      vars: "나눗셈 10",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, 8, null],
          read: [0],
          write: [1],
        },
        {
          name: "curM",
          values: [3, 15, null],
          read: [0],
          write: [1],
        },
      ],
    },
    {
      title: "T5 diff = -6 · g = 1",
      text: "새 합동식은 x ≡ 2 (mod 7) 입니다. 나머지 차는 diff = 2 - 8 = -6 이고, 확장 유클리드 호제법이 g = gcd(15, 7) = 1 과 계수 u = 1 을 냅니다. -6 을 1 로 나눈 나머지가 0 이라 모순이 아닙니다.",
      array: [3, 5, 7],
      range: [0, 1],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "diff % g = (-6) % 1",
        result: "0",
      },
      vars: "g = 1 · u = 1 · 나눗셈 14",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [2],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, 8, null],
          read: [1],
          write: [],
        },
        {
          name: "curM",
          values: [3, 15, null],
          read: [1],
          write: [],
        },
      ],
    },
    {
      title: "T6 t = 1",
      text: "unit = 7 / 1 = 7 이고 diff / g = -6 입니다. t = mod((-6) × 1, 7) = 1 이라 curR 을 curM = 15 씩 1 번 옮기면 새 합동식까지 맞습니다.",
      array: [3, 5, 7],
      range: [0, 1],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "t = mod((-6) × 1, 7)",
        result: "1",
      },
      vars: "unit = 7 · 나눗셈 17",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [2],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, 8, null],
          read: [1],
          write: [],
        },
        {
          name: "curM",
          values: [3, 15, null],
          read: [1],
          write: [],
        },
      ],
    },
    {
      title: "T7 x ≡ 23 (mod 105)",
      text: "curR = 8 + 15 × 1 = 23 이고 curM = 15 × 7 = 105 입니다. 합동식 3 개가 x ≡ 23 (mod 105) 하나가 됐습니다.",
      array: [3, 5, 7],
      range: [0, 2],
      read: [],
      write: [2],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "curR = 8 + 15 × 1",
        result: "23",
      },
      vars: "나눗셈 17",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, 8, 23],
          read: [1],
          write: [2],
        },
        {
          name: "curM",
          values: [3, 15, 105],
          read: [1],
          write: [2],
        },
      ],
    },
    {
      title: "T8 { x: 23, M: 105 } 반환",
      text: "읽을 합동식이 없어 반복이 끝납니다. 누적 합동식 x ≡ 23 (mod 105) 의 두 값을 { x, M } 으로 그대로 냅니다. 나눗셈은 모두 17 번입니다.",
      array: [3, 5, 7],
      range: [0, 2],
      read: [],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "{ x: curR, M: curM }",
        result: "{ 23, 105 }",
      },
      vars: "나눗셈 17",
      layers: [
        {
          name: "나머지 r",
          values: [2, 3, 2],
          read: [],
          side: "입력",
        },
        {
          name: "curR",
          values: [2, 8, 23],
          read: [2],
          write: [],
        },
        {
          name: "curM",
          values: [3, 15, 105],
          read: [2],
          write: [],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
