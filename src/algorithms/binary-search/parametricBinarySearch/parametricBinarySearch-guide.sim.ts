import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [7, 2, 5, 10, 8]`.
 * `probe` 는 `K = 2` 의 T1~T12, `upper` 는 `K = 1`(답이 후보 구간의 위 끝)의 T13~T18 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 무대의 줄은 입력 배열이 아니라 **답 후보값 줄**(10 부터 32
 * 까지)이고, 칸의 값이 곧 좌표라서 `valueAxis: true` 로 인덱스 줄을 빼고 괄호를 값으로 적는다.
 * 쥔 구간 `range` 는 후보 구간(비면 `null`), `read` 는 이번에 판정한 후보값, `write` 는 돌려준 답이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `parametricBinarySearch-guide.test.ts` 가 잰다.
 */

export const probe = {
  player: "stage",
  stage: "array",
  arrayName: "후보값 m",
  rangeLabel: "후보",
  valueAxis: true,
  title: "parametricBinarySearch([7, 2, 5, 10, 8], 2)",
  result: "18",
  steps: [
    {
      title: "T1 후보 [10,32]",
      text: "후보 구간을 답이 놓일 수 있는 값 전체로 잡습니다. lo = max(A) = 10, hi = ΣA = 32, 후보값 23 개입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [0, 22],
      read: [],
      write: [],
      pointers: {
        lo: 10,
        hi: 32,
      },
      calc: null,
      vars: "판정 0 번",
    },
    {
      title: "T2 mid = 21",
      text: "10 <= 32 가 참이라 반복에 들어갑니다. mid = 10 + ⌊22/2⌋ = 21 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [0, 22],
      read: [11],
      write: [],
      pointers: {
        lo: 10,
        mid: 21,
        hi: 32,
      },
      calc: {
        expr: "10 + ⌊22/2⌋",
        result: "21",
      },
      vars: "판정 0 번",
    },
    {
      title: "T3 판정 21 ①",
      text: "탐욕 순회가 7 2 5 │ 10 8 로 묶음 2 개를 만듭니다. 2 <= 2 가 참이라 ① hi = 20 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [0, 10],
      read: [11],
      write: [],
      pointers: {
        lo: 10,
        mid: 21,
        hi: 20,
      },
      calc: {
        expr: "g(21)",
        result: "2",
      },
      vars: "판정 1 번",
    },
    {
      title: "T4 mid = 15",
      text: "10 <= 20 이 참이라 반복에 들어갑니다. mid = 10 + ⌊10/2⌋ = 15 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [0, 10],
      read: [5],
      write: [],
      pointers: {
        lo: 10,
        mid: 15,
        hi: 20,
      },
      calc: {
        expr: "10 + ⌊10/2⌋",
        result: "15",
      },
      vars: "판정 1 번",
    },
    {
      title: "T5 판정 15 ②",
      text: "탐욕 순회가 7 2 5 │ 10 │ 8 로 묶음 3 개를 만듭니다. 3 <= 2 가 거짓이라 ② lo = 16 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [6, 10],
      read: [5],
      write: [],
      pointers: {
        lo: 16,
        mid: 15,
        hi: 20,
      },
      calc: {
        expr: "g(15)",
        result: "3",
      },
      vars: "판정 2 번",
    },
    {
      title: "T6 mid = 18",
      text: "16 <= 20 이 참이라 반복에 들어갑니다. mid = 16 + ⌊4/2⌋ = 18 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [6, 10],
      read: [8],
      write: [],
      pointers: {
        lo: 16,
        mid: 18,
        hi: 20,
      },
      calc: {
        expr: "16 + ⌊4/2⌋",
        result: "18",
      },
      vars: "판정 2 번",
    },
    {
      title: "T7 판정 18 ①",
      text: "탐욕 순회가 7 2 5 │ 10 8 로 묶음 2 개를 만듭니다. 2 <= 2 가 참이라 ① hi = 17 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [6, 7],
      read: [8],
      write: [],
      pointers: {
        lo: 16,
        mid: 18,
        hi: 17,
      },
      calc: {
        expr: "g(18)",
        result: "2",
      },
      vars: "판정 3 번",
    },
    {
      title: "T8 mid = 16",
      text: "16 <= 17 이 참이라 반복에 들어갑니다. mid = 16 + ⌊1/2⌋ = 16 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [6, 7],
      read: [6],
      write: [],
      pointers: {
        lo: 16,
        mid: 16,
        hi: 17,
      },
      calc: {
        expr: "16 + ⌊1/2⌋",
        result: "16",
      },
      vars: "판정 3 번",
    },
    {
      title: "T9 판정 16 ②",
      text: "탐욕 순회가 7 2 5 │ 10 │ 8 로 묶음 3 개를 만듭니다. 3 <= 2 가 거짓이라 ② lo = 17 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [7, 7],
      read: [6],
      write: [],
      pointers: {
        lo: 17,
        mid: 16,
        hi: 17,
      },
      calc: {
        expr: "g(16)",
        result: "3",
      },
      vars: "판정 4 번",
    },
    {
      title: "T10 mid = 17",
      text: "17 <= 17 이 참이라 반복에 들어갑니다. mid = 17 + ⌊0/2⌋ = 17 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [7, 7],
      read: [7],
      write: [],
      pointers: {
        lo: 17,
        mid: 17,
        hi: 17,
      },
      calc: {
        expr: "17 + ⌊0/2⌋",
        result: "17",
      },
      vars: "판정 4 번",
    },
    {
      title: "T11 판정 17 ②",
      text: "탐욕 순회가 7 2 5 │ 10 │ 8 로 묶음 3 개를 만듭니다. 3 <= 2 가 거짓이라 ② lo = 18 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: null,
      read: [7],
      write: [],
      pointers: {
        lo: 18,
        mid: 17,
        hi: 17,
      },
      calc: {
        expr: "g(17)",
        result: "3",
      },
      vars: "판정 5 번",
    },
    {
      title: "T12 lo = 18 > hi = 17",
      text: "lo <= hi 가 거짓이라 반복이 끝나고 lo = 18 을 돌려줍니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: null,
      read: [],
      write: [8],
      pointers: {
        lo: 18,
        hi: 17,
      },
      calc: null,
      vars: "판정 5 번",
    },
  ],
} satisfies ArrayPlayerSpec;

export const upper = {
  player: "stage",
  stage: "array",
  arrayName: "후보값 m",
  rangeLabel: "후보",
  valueAxis: true,
  title: "parametricBinarySearch([7, 2, 5, 10, 8], 1)",
  result: "32",
  steps: [
    {
      title: "T13 후보 [10,32] · 판정 21 ②",
      text: "mid = 21 입니다. 탐욕 순회가 묶음 2 개를 만듭니다. 2 <= 1 이 거짓이라 ② lo = 22 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [12, 22],
      read: [11],
      write: [],
      pointers: {
        lo: 22,
        mid: 21,
        hi: 32,
      },
      calc: {
        expr: "g(21)",
        result: "2",
      },
      vars: "판정 1 번",
    },
    {
      title: "T14 후보 [22,32] · 판정 27 ②",
      text: "mid = 27 입니다. 탐욕 순회가 묶음 2 개를 만듭니다. 2 <= 1 이 거짓이라 ② lo = 28 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [18, 22],
      read: [17],
      write: [],
      pointers: {
        lo: 28,
        mid: 27,
        hi: 32,
      },
      calc: {
        expr: "g(27)",
        result: "2",
      },
      vars: "판정 2 번",
    },
    {
      title: "T15 후보 [28,32] · 판정 30 ②",
      text: "mid = 30 입니다. 탐욕 순회가 묶음 2 개를 만듭니다. 2 <= 1 이 거짓이라 ② lo = 31 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [21, 22],
      read: [20],
      write: [],
      pointers: {
        lo: 31,
        mid: 30,
        hi: 32,
      },
      calc: {
        expr: "g(30)",
        result: "2",
      },
      vars: "판정 3 번",
    },
    {
      title: "T16 후보 [31,32] · 판정 31 ②",
      text: "mid = 31 입니다. 탐욕 순회가 묶음 2 개를 만듭니다. 2 <= 1 이 거짓이라 ② lo = 32 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: [22, 22],
      read: [21],
      write: [],
      pointers: {
        lo: 32,
        mid: 31,
        hi: 32,
      },
      calc: {
        expr: "g(31)",
        result: "2",
      },
      vars: "판정 4 번",
    },
    {
      title: "T17 후보 [32,32] · 판정 32 ①",
      text: "mid = 32 입니다. 탐욕 순회가 묶음 1 개를 만듭니다. 1 <= 1 이 참이라 ① hi = 31 입니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: null,
      read: [22],
      write: [],
      pointers: {
        lo: 32,
        mid: 32,
        hi: 31,
      },
      calc: {
        expr: "g(32)",
        result: "1",
      },
      vars: "판정 5 번",
    },
    {
      title: "T18 lo = 32 > hi = 31",
      text: "lo <= hi 가 거짓이라 반복이 끝나고 lo = 32 를 돌려줍니다.",
      array: [
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32,
      ],
      range: null,
      read: [],
      write: [22],
      pointers: {
        lo: 32,
        hi: 31,
      },
      calc: null,
      vars: "판정 5 번",
    },
  ],
} satisfies ArrayPlayerSpec;
