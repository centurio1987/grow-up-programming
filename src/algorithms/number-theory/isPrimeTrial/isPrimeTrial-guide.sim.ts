import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `isPrimeTrial(187)`. 걸음은 T1~T8 이고,
 * 본문의 걸음 표(증명 블록 `walk-trace`)와 번호가 같다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 무대의 줄은 2 부터 `⌊√187⌋ = 13` 까지의 수이고 칸의 값이 곧 수라
 * `valueAxis` 로 인덱스 줄을 뺀다. 후보가 아닌 수(2 · 3 자신을 뺀 2 · 3 의 배수)는 걸음마다 `out`(이번 걸음
 * 밖)이고, 지금 보는 후보 `d` 는 `read` 다. 아래 줄 「n mod d」 는 나눠 본 수마다 나머지를 적은 것이라 나눈
 * 걸음에 그 칸이 `write` 가 된다 — 정본은 이 값을 모아 두지 않지만, 어느 수를 나눴고 어느 수를 건너뛰었는지를
 * 무대에서 보이려고 걸음 기록에서 만든다. 무대에 자리가 없는 `step` 만 남는 변수로 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본과 같은 절차의 걸음 기록)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `isPrimeTrial-guide.test.ts` 가 잰다.
 */

export const trialWalk = {
  player: "stage",
  stage: "array",
  arrayName: "수 d",
  rangeLabel: "⌊√n⌋ 까지",
  valueAxis: true,
  title: "isPrimeTrial(187)",
  result: "false",
  steps: [
    {
      title: "T1 n < 2 와 n = 2 · 3 을 본다",
      text: "187 은 2 보다 작지 않고 2 도 3 도 아니라서 ①과 ②가 둘 다 거짓입니다. 아직 한 번도 나누지 않았습니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [],
      write: [],
      calc: {
        expr: "187 < 2",
        result: "거짓",
      },
      vars: null,
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [
            null,
            null,
            "—",
            null,
            "—",
            null,
            "—",
            "—",
            "—",
            null,
            "—",
            null,
          ],
          write: [],
          side: "나눗셈 0 번",
        },
      ],
    },
    {
      title: "T2 2 와 3 으로 나눠 본다",
      text: "③이 187 을 2 와 3 으로 나눕니다. 나머지가 1 과 1 이라 둘 다 약수가 아니고, 후보가 아닌 칸은 이 두 나눗셈이 대신 답했습니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [0, 1],
      write: [],
      calc: {
        expr: "187 mod 2 · 187 mod 3",
        result: "1 · 1",
      },
      vars: null,
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", null, "—", null, "—", "—", "—", null, "—", null],
          write: [0, 1],
          side: "나눗셈 2 번",
        },
      ],
    },
    {
      title: "T3 d = 5 · 25 ≤ 187",
      text: "루프 조건 d × d ≤ n 이 25 ≤ 187 로 참이라 후보 5 를 나눠 봅니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [3],
      write: [],
      pointers: {
        d: 5,
      },
      calc: {
        expr: "5 × 5",
        result: "25 ≤ 187",
      },
      vars: "step = 2",
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", null, "—", null, "—", "—", "—", null, "—", null],
          write: [],
          side: "나눗셈 2 번",
        },
      ],
    },
    {
      title: "T4 187 mod 5 = 2 · 다음 후보 7",
      text: "나머지가 2 라 5 는 약수가 아닙니다. d 에 step 2 를 더해 다음 후보는 7 입니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [3],
      write: [],
      pointers: {
        d: 5,
      },
      calc: {
        expr: "187 mod 5",
        result: "2",
      },
      vars: "step = 2",
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", 2, "—", null, "—", "—", "—", null, "—", null],
          write: [3],
          side: "나눗셈 3 번",
        },
      ],
    },
    {
      title: "T5 d = 7 · 49 ≤ 187",
      text: "루프 조건 d × d ≤ n 이 49 ≤ 187 로 참이라 후보 7 을 나눠 봅니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [5],
      write: [],
      pointers: {
        d: 7,
      },
      calc: {
        expr: "7 × 7",
        result: "49 ≤ 187",
      },
      vars: "step = 4",
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", 2, "—", null, "—", "—", "—", null, "—", null],
          write: [],
          side: "나눗셈 3 번",
        },
      ],
    },
    {
      title: "T6 187 mod 7 = 5 · 다음 후보 11",
      text: "나머지가 5 라 7 은 약수가 아닙니다. d 에 step 4 를 더해 다음 후보는 11 입니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [5],
      write: [],
      pointers: {
        d: 7,
      },
      calc: {
        expr: "187 mod 7",
        result: "5",
      },
      vars: "step = 4",
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", 2, "—", 5, "—", "—", "—", null, "—", null],
          write: [5],
          side: "나눗셈 4 번",
        },
      ],
    },
    {
      title: "T7 d = 11 · 121 ≤ 187",
      text: "루프 조건 d × d ≤ n 이 121 ≤ 187 로 참이라 후보 11 을 나눠 봅니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [9],
      write: [],
      pointers: {
        d: 11,
      },
      calc: {
        expr: "11 × 11",
        result: "121 ≤ 187",
      },
      vars: "step = 2",
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", 2, "—", 5, "—", "—", "—", null, "—", null],
          write: [],
          side: "나눗셈 4 번",
        },
      ],
    },
    {
      title: "T8 187 mod 11 = 0 · 약수를 찾았다",
      text: "나머지가 0 이라 11 이 약수입니다. 187 은 소수가 아니고 false 를 돌려줍니다.",
      array: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      range: [0, 11],
      out: [2, 4, 6, 7, 8, 10],
      read: [9],
      write: [],
      pointers: {
        d: 11,
      },
      calc: {
        expr: "187 mod 11",
        result: "0",
      },
      vars: "step = 2",
      rangeSide: "√187 = 13.67",
      layers: [
        {
          name: "n mod d",
          values: [1, 1, "—", 2, "—", 5, "—", "—", "—", 0, "—", null],
          write: [9],
          side: "나눗셈 5 번",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
