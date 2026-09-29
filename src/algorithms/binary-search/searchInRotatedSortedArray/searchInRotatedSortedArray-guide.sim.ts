import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 —
 * `A = [17, 18, 19, 20, 0, 1, …, 16]`. `descent` 는 있는 값 2 를 찾는 T1~T11, `miss` 는 없는 값 21 을
 * 찾는 T12~T17 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 후보 구간(비면 `null`), `read` 는 이번에 읽은
 * 배열 칸, `write` 는 찾은 답, `pieces` 는 그 바퀴가 가린 정렬된 반쪽이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `searchInRotatedSortedArray-guide.test.ts` 가 잰다.
 */

export const descent = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "후보",
  title: "searchInRotatedSortedArray([17, 18, 19, 20, 0, 1, …, 16], 2)",
  result: "6",
  steps: [
    {
      title: "T1 후보 [0,20]",
      text: "후보 구간을 배열 전체로 잡습니다. lo = 0, hi = 20, 후보 21 칸입니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [0, 20],
      read: [],
      write: [],
      pointers: {
        lo: 0,
        hi: 20,
      },
    },
    {
      title: "T2 mid = 10 · 오른쪽 반쪽 정렬",
      text: "0 <= 20 이 참이라 반복에 들어갑니다. mid = 0 + ⌊20/2⌋ = 10 입니다. A[10] = 6 은 2 가 아니라 A[0] = 17 을 함께 읽습니다. 17 <= 6 이 거짓이라 오른쪽 반쪽 [10,20] 이 정렬돼 있습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [0, 20],
      read: [0, 10],
      write: [],
      pointers: {
        lo: 0,
        mid: 10,
        hi: 20,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 10,
          to: 20,
          tone: "right",
          text: "[10,20]",
        },
      ],
    },
    {
      title: "T3 A[20] = 16 · ⑤ hi = 9",
      text: "A[20] = 16 을 읽습니다. 정렬된 반쪽에서 target 이 있을 수 있는 값은 6 초과 16 이하입니다. 6 < 2 가 거짓, 2 <= 16 이 참이라 ⑤ hi = 9 입니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [0, 9],
      read: [20],
      write: [],
      pointers: {
        lo: 0,
        mid: 10,
        hi: 9,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 10,
          to: 20,
          tone: "right",
          text: "[10,20] · 값 6~16",
        },
      ],
    },
    {
      title: "T4 mid = 4 · 오른쪽 반쪽 정렬",
      text: "0 <= 9 가 참이라 반복에 들어갑니다. mid = 0 + ⌊9/2⌋ = 4 입니다. A[4] = 0 은 2 가 아니라 A[0] = 17 을 함께 읽습니다. 17 <= 0 이 거짓이라 오른쪽 반쪽 [4,9] 가 정렬돼 있습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [0, 9],
      read: [0, 4],
      write: [],
      pointers: {
        lo: 0,
        mid: 4,
        hi: 9,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 4,
          to: 9,
          tone: "right",
          text: "[4,9]",
        },
      ],
    },
    {
      title: "T5 A[9] = 5 · ④ lo = 5",
      text: "A[9] = 5 를 읽습니다. 정렬된 반쪽에서 target 이 있을 수 있는 값은 0 초과 5 이하입니다. 0 < 2 가 참, 2 <= 5 가 참이라 ④ lo = 5 입니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [5, 9],
      read: [9],
      write: [],
      pointers: {
        lo: 5,
        mid: 4,
        hi: 9,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 4,
          to: 9,
          tone: "right",
          text: "[4,9] · 값 0~5",
        },
      ],
    },
    {
      title: "T6 mid = 7 · 왼쪽 반쪽 정렬",
      text: "5 <= 9 가 참이라 반복에 들어갑니다. mid = 5 + ⌊4/2⌋ = 7 입니다. A[7] = 3 은 2 가 아니라 A[5] = 1 을 함께 읽습니다. 1 <= 3 이 참이라 왼쪽 반쪽 [5,7] 이 정렬돼 있습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [5, 9],
      read: [5, 7],
      write: [],
      pointers: {
        lo: 5,
        mid: 7,
        hi: 9,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 5,
          to: 7,
          tone: "left",
          text: "[5,7] · 값 1~3",
        },
      ],
    },
    {
      title: "T7 ② hi = 6",
      text: "정렬된 반쪽에서 target 이 있을 수 있는 값은 1 이상 3 미만입니다. 1 <= 2 가 참, 2 < 3 이 참이라 ② hi = 6 입니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [5, 6],
      read: [],
      write: [],
      pointers: {
        lo: 5,
        mid: 7,
        hi: 6,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 5,
          to: 7,
          tone: "left",
          text: "[5,7] · 값 1~3",
        },
      ],
    },
    {
      title: "T8 mid = 5 · 왼쪽 반쪽 정렬",
      text: "5 <= 6 이 참이라 반복에 들어갑니다. mid = 5 + ⌊1/2⌋ = 5 입니다. A[5] = 1 은 2 가 아니라 A[lo] 를 읽는데, lo 도 5 라 같은 칸입니다. 1 <= 1 이 참이라 왼쪽 반쪽 [5,5] 가 정렬돼 있습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [5, 6],
      read: [5],
      write: [],
      pointers: {
        lo: 5,
        mid: 5,
        hi: 6,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 5,
          to: 5,
          tone: "left",
          text: "[5,5] · 값 1~1",
        },
      ],
    },
    {
      title: "T9 ③ lo = 6",
      text: "정렬된 반쪽에서 target 이 있을 수 있는 값은 1 이상 1 미만입니다. 1 <= 2 가 참, 2 < 1 이 거짓이라 ③ lo = 6 입니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [6, 6],
      read: [],
      write: [],
      pointers: {
        lo: 6,
        mid: 5,
        hi: 6,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 5,
          to: 5,
          tone: "left",
          text: "[5,5] · 값 1~1",
        },
      ],
    },
    {
      title: "T10 mid = 6",
      text: "6 <= 6 이 참이라 반복에 들어갑니다. mid = 6 + ⌊0/2⌋ = 6 입니다. A[6] = 2 를 읽습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [6, 6],
      read: [6],
      write: [],
      pointers: {
        lo: 6,
        mid: 6,
        hi: 6,
      },
    },
    {
      title: "T11 A[6] = 2 ①",
      text: "2 === 2 가 참이라 ① 6 을 돌려줍니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [6, 6],
      read: [],
      write: [6],
      pointers: {
        mid: 6,
      },
    },
  ],
} satisfies ArrayPlayerSpec;

export const miss = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "후보",
  title: "searchInRotatedSortedArray([17, 18, 19, 20, 0, 1, …, 16], 21)",
  result: "-1",
  steps: [
    {
      title: "T12 후보 [0,20] · ⑤ hi = 9",
      text: "mid = 10 이고 A[10] = 6 · A[0] = 17 · A[20] = 16 을 읽습니다. 17 <= 6 이 거짓이라 오른쪽 반쪽 [10,20] 이 정렬돼 있고, 6 < 21 이 참, 21 <= 16 이 거짓이라 ⑤ hi = 9 입니다. 후보가 10 칸 남습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [0, 9],
      read: [0, 10, 20],
      write: [],
      pointers: {
        lo: 0,
        mid: 10,
        hi: 9,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 10,
          to: 20,
          tone: "right",
          text: "[10,20] · 값 6~16",
        },
      ],
    },
    {
      title: "T13 후보 [0,9] · ⑤ hi = 3",
      text: "mid = 4 이고 A[4] = 0 · A[0] = 17 · A[9] = 5 를 읽습니다. 17 <= 0 이 거짓이라 오른쪽 반쪽 [4,9] 가 정렬돼 있고, 0 < 21 이 참, 21 <= 5 가 거짓이라 ⑤ hi = 3 입니다. 후보가 4 칸 남습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [0, 3],
      read: [0, 4, 9],
      write: [],
      pointers: {
        lo: 0,
        mid: 4,
        hi: 3,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 4,
          to: 9,
          tone: "right",
          text: "[4,9] · 값 0~5",
        },
      ],
    },
    {
      title: "T14 후보 [0,3] · ③ lo = 2",
      text: "mid = 1 이고 A[1] = 18 · A[0] = 17 을 읽습니다. 17 <= 18 이 참이라 왼쪽 반쪽 [0,1] 이 정렬돼 있고, 17 <= 21 이 참, 21 < 18 이 거짓이라 ③ lo = 2 입니다. 후보가 2 칸 남습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [2, 3],
      read: [0, 1],
      write: [],
      pointers: {
        lo: 2,
        mid: 1,
        hi: 3,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 0,
          to: 1,
          tone: "left",
          text: "[0,1] · 값 17~18",
        },
      ],
    },
    {
      title: "T15 후보 [2,3] · ③ lo = 3",
      text: "mid = 2 이고 A[2] = 19 를 읽습니다. 19 <= 19 가 참이라 왼쪽 반쪽 [2,2] 가 정렬돼 있고, 19 <= 21 이 참, 21 < 19 가 거짓이라 ③ lo = 3 입니다. 후보가 1 칸 남습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: [3, 3],
      read: [2],
      write: [],
      pointers: {
        lo: 3,
        mid: 2,
        hi: 3,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 2,
          to: 2,
          tone: "left",
          text: "[2,2] · 값 19~19",
        },
      ],
    },
    {
      title: "T16 후보 [3,3] · ③ lo = 4",
      text: "mid = 3 이고 A[3] = 20 을 읽습니다. 20 <= 20 이 참이라 왼쪽 반쪽 [3,3] 이 정렬돼 있고, 20 <= 21 이 참, 21 < 20 이 거짓이라 ③ lo = 4 입니다. 후보가 0 칸 남습니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: null,
      read: [3],
      write: [],
      pointers: {
        lo: 4,
        mid: 3,
        hi: 3,
      },
      pieces: [
        {
          label: "정렬된 반쪽",
          from: 3,
          to: 3,
          tone: "left",
          text: "[3,3] · 값 20~20",
        },
      ],
    },
    {
      title: "T17 lo = 4 > hi = 3",
      text: "lo <= hi 가 거짓이라 반복이 끝나고 -1 을 돌려줍니다.",
      array: [
        17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16,
      ],
      range: null,
      read: [],
      write: [],
      pointers: {
        lo: 4,
        hi: 3,
      },
    },
  ],
} satisfies ArrayPlayerSpec;
