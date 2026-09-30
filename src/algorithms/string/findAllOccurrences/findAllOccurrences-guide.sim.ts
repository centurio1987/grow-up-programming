import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — T = "abacabababab", P = "abab".
 * 걸음 하나가 텍스트 자리 하나다(T1~T12).
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 칸 줄은 텍스트 T, 쥔 구간 `range` 는 그 걸음의 마지막 비교에서
 * 패턴이 놓인 자리, 조각 `pieces` 는 맞은 부분과(다 맞았으면) 이어 갈 부분이다. 아래로 쌓는 줄은
 * 패턴 P(▲ 는 비교한 자리) · 실패 함수 fail(▲ 는 줄일 때 읽은 칸) · 답(새로 적은 칸)이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 리터럴은 그림
 * 사이드카의 `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `findAllOccurrences-guide.test.ts` 가 잰다.
 */

export const kmpWalk = {
  player: "stage",
  stage: "array",
  arrayName: "T",
  rangeLabel: "P 자리",
  title: 'findAllOccurrences("abacabababab", "abab")',
  result: "[4, 6, 8]",
  steps: [
    {
      title: "T1 i = 0 · j 0 → 1",
      text: "T[0] = a 와 P[0] = a 가 같아 j 가 1 이 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [0, 3],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 0,
          to: 0,
          tone: "left",
          text: "1 글자",
        },
      ],
      calc: null,
      vars: "j = 1 · 비교 1 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [0],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T2 i = 1 · j 1 → 2",
      text: "T[1] = b 와 P[1] = b 가 같아 j 가 2 가 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [0, 3],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 0,
          to: 1,
          tone: "left",
          text: "2 글자",
        },
      ],
      calc: null,
      vars: "j = 2 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [1],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T3 i = 2 · j 2 → 3",
      text: "T[2] = a 와 P[2] = a 가 같아 j 가 3 이 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [0, 3],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 0,
          to: 2,
          tone: "left",
          text: "3 글자",
        },
      ],
      calc: null,
      vars: "j = 3 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [2],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T4 i = 3 · j 3 → 0",
      text: "T[3] = c 와 P[3] = b 가 달라 j 를 fail[2] = 1 로, P[1] = b 와도 달라 fail[0] = 0 으로 줄입니다. P[0] = a 와도 달라 j 는 0 입니다. i 는 3 그대로입니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [3, 6],
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      pieces: [],
      calc: {
        expr: "fail[2] = 1 → fail[0] = 0",
        result: "j = 0",
      },
      vars: "j = 0 · 비교 3 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [3, 1, 0],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [2, 0],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T5 i = 4 · j 0 → 1",
      text: "T[4] = a 와 P[0] = a 가 같아 j 가 1 이 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [4, 7],
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 4,
          to: 4,
          tone: "left",
          text: "1 글자",
        },
      ],
      calc: null,
      vars: "j = 1 · 비교 1 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [0],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T6 i = 5 · j 1 → 2",
      text: "T[5] = b 와 P[1] = b 가 같아 j 가 2 가 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [4, 7],
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 4,
          to: 5,
          tone: "left",
          text: "2 글자",
        },
      ],
      calc: null,
      vars: "j = 2 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [1],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T7 i = 6 · j 2 → 3",
      text: "T[6] = a 와 P[2] = a 가 같아 j 가 3 이 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [4, 7],
      read: [6],
      write: [],
      pointers: {
        i: 6,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 4,
          to: 6,
          tone: "left",
          text: "3 글자",
        },
      ],
      calc: null,
      vars: "j = 3 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [2],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T8 i = 7 · 자리 4 적음",
      text: "T[7] = b 와 P[3] = b 가 같아 j 가 4 가 됩니다. j = m 이라 시작 자리 7 − 4 + 1 = 4 를 적고 j 를 fail[3] = 2 로 줄입니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [4, 7],
      read: [7],
      write: [],
      pointers: {
        i: 7,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 4,
          to: 7,
          tone: "left",
          text: "4 글자",
        },
        {
          label: "이어 갈 부분",
          from: 6,
          to: 7,
          tone: "right",
          text: "2 글자",
        },
      ],
      calc: {
        expr: "7 − 4 + 1",
        result: "4",
      },
      vars: "j = 2 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [3],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [3],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [4, null, null],
          write: [0],
        },
      ],
    },
    {
      title: "T9 i = 8 · j 2 → 3",
      text: "T[8] = a 와 P[2] = a 가 같아 j 가 3 이 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [6, 9],
      read: [8],
      write: [],
      pointers: {
        i: 8,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 6,
          to: 8,
          tone: "left",
          text: "3 글자",
        },
      ],
      calc: null,
      vars: "j = 3 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [2],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [4, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T10 i = 9 · 자리 6 적음",
      text: "T[9] = b 와 P[3] = b 가 같아 j 가 4 가 됩니다. j = m 이라 시작 자리 9 − 4 + 1 = 6 을 적고 j 를 fail[3] = 2 로 줄입니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [6, 9],
      read: [9],
      write: [],
      pointers: {
        i: 9,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 6,
          to: 9,
          tone: "left",
          text: "4 글자",
        },
        {
          label: "이어 갈 부분",
          from: 8,
          to: 9,
          tone: "right",
          text: "2 글자",
        },
      ],
      calc: {
        expr: "9 − 4 + 1",
        result: "6",
      },
      vars: "j = 2 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [3],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [3],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [4, 6, null],
          write: [1],
        },
      ],
    },
    {
      title: "T11 i = 10 · j 2 → 3",
      text: "T[10] = a 와 P[2] = a 가 같아 j 가 3 이 됩니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [8, 11],
      read: [10],
      write: [],
      pointers: {
        i: 10,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 8,
          to: 10,
          tone: "left",
          text: "3 글자",
        },
      ],
      calc: null,
      vars: "j = 3 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [2],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [4, 6, null],
          write: [],
        },
      ],
    },
    {
      title: "T12 i = 11 · 자리 8 적음",
      text: "T[11] = b 와 P[3] = b 가 같아 j 가 4 가 됩니다. j = m 이라 시작 자리 11 − 4 + 1 = 8 을 적고 j 를 fail[3] = 2 로 줄입니다.",
      array: ["a", "b", "a", "c", "a", "b", "a", "b", "a", "b", "a", "b"],
      range: [8, 11],
      read: [11],
      write: [],
      pointers: {
        i: 11,
      },
      pieces: [
        {
          label: "맞은 부분",
          from: 8,
          to: 11,
          tone: "left",
          text: "4 글자",
        },
        {
          label: "이어 갈 부분",
          from: 10,
          to: 11,
          tone: "right",
          text: "2 글자",
        },
      ],
      calc: {
        expr: "11 − 4 + 1",
        result: "8",
      },
      vars: "j = 2 · 비교 2 번",
      layers: [
        {
          name: "P",
          values: ["a", "b", "a", "b"],
          read: [3],
        },
        {
          name: "fail",
          values: [0, 0, 1, 2],
          read: [3],
          side: "실패 함수",
        },
        {
          name: "답",
          values: [4, 6, 8],
          write: [2],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
