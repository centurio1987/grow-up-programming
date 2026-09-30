import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [7, 10, 4, 3, 20, 15]`, `k = 4`.
 * `select` 는 네 바퀴의 T1~T23 이다 — 바퀴마다 「기준값을 끝으로」 · 비교 하나씩 · 「기준값을 제자리에」 ·
 * 「갈래」.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 분할은 값의 자리를 바꾸므로 `array` 를 걸음마다 싣는다. `range` 는
 * 쥔 구간 `[lo, hi]`, `pieces` 는 분할 중인 두 구역(작은 쪽 · 크거나 같은 쪽), `pointers` 는 `m` · `i` · `j` ·
 * `p` · `target`, `read` 는 비교했지만 그대로 둔 칸, `write` 는 맞바꾼 칸과 답이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `kthSmallest-guide.test.ts` 가 잰다.
 */

export const select = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "구간",
  title: "kthSmallest([7, 10, 4, 3, 20, 15], 4)",
  result: "10",
  steps: [
    {
      title: "T1 기준값 4 를 끝으로",
      text: "구간 [0,5] 6 칸의 중앙은 m = 0 + ⌊5/2⌋ = 2 이고 값은 4 입니다. 인덱스 2 와 5 를 맞바꿔 기준값을 끝에 둡니다.",
      array: [7, 10, 15, 3, 20, 4],
      range: [0, 5],
      read: [],
      write: [2, 5],
      pointers: {
        m: 2,
        hi: 5,
        target: 3,
      },
      calc: {
        expr: "0 + ⌊(5 − 0) / 2⌋",
        result: "2",
      },
      vars: "비교 0 번",
    },
    {
      title: "T2 7 < 4 ②",
      text: "j = 0 의 7 은 기준값 4 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [7, 10, 15, 3, 20, 4],
      range: [0, 5],
      read: [0],
      write: [],
      pointers: {
        i: 0,
        j: 0,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 0,
          to: 0,
          tone: "right",
        },
      ],
      calc: {
        expr: "7 < 4",
        result: "거짓",
      },
      vars: "비교 1 번",
    },
    {
      title: "T3 10 < 4 ②",
      text: "j = 1 의 10 은 기준값 4 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [7, 10, 15, 3, 20, 4],
      range: [0, 5],
      read: [1],
      write: [],
      pointers: {
        i: 0,
        j: 1,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 0,
          to: 1,
          tone: "right",
        },
      ],
      calc: {
        expr: "10 < 4",
        result: "거짓",
      },
      vars: "비교 2 번",
    },
    {
      title: "T4 15 < 4 ②",
      text: "j = 2 의 15 는 기준값 4 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [7, 10, 15, 3, 20, 4],
      range: [0, 5],
      read: [2],
      write: [],
      pointers: {
        i: 0,
        j: 2,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 0,
          to: 2,
          tone: "right",
        },
      ],
      calc: {
        expr: "15 < 4",
        result: "거짓",
      },
      vars: "비교 3 번",
    },
    {
      title: "T5 3 < 4 ①",
      text: "j = 3 의 3 이 기준값 4 보다 작아 ① 입니다. 인덱스 0 과 3 을 맞바꾸고 i 가 0 에서 1 로 늘어납니다.",
      array: [3, 10, 15, 7, 20, 4],
      range: [0, 5],
      read: [],
      write: [0, 3],
      pointers: {
        i: 1,
        j: 3,
        target: 3,
      },
      pieces: [
        {
          label: "작음",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "이상",
          from: 1,
          to: 3,
          tone: "right",
        },
      ],
      calc: {
        expr: "3 < 4",
        result: "참",
      },
      vars: "비교 4 번",
    },
    {
      title: "T6 20 < 4 ②",
      text: "j = 4 의 20 은 기준값 4 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [3, 10, 15, 7, 20, 4],
      range: [0, 5],
      read: [4],
      write: [],
      pointers: {
        i: 1,
        j: 4,
        target: 3,
      },
      pieces: [
        {
          label: "작음",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "이상",
          from: 1,
          to: 4,
          tone: "right",
        },
      ],
      calc: {
        expr: "20 < 4",
        result: "거짓",
      },
      vars: "비교 5 번",
    },
    {
      title: "T7 기준값 4 의 자리 p = 1",
      text: "기준값보다 작은 값이 1 개라 i = 1 에서 루프가 끝났습니다. 인덱스 1 과 5 를 맞바꾸면 기준값 4 가 인덱스 1 에 자리 잡습니다.",
      array: [3, 4, 15, 7, 20, 10],
      range: [0, 5],
      read: [],
      write: [1, 5],
      pointers: {
        p: 1,
        target: 3,
      },
      pieces: [
        {
          label: "작음",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "이상",
          from: 2,
          to: 5,
          tone: "right",
        },
      ],
      calc: null,
      vars: "비교 5 번",
    },
    {
      title: "T8 1 < 3 ⑤ 다음 구간 [2,5]",
      text: "p = 1 이 target = 3 보다 작아서 ⑤ 로 오른쪽 [2,5] 4 칸만 남깁니다.",
      array: [3, 4, 15, 7, 20, 10],
      range: [2, 5],
      read: [],
      write: [],
      pointers: {
        p: 1,
        target: 3,
      },
      calc: {
        expr: "1 < 3",
        result: "⑤",
      },
      vars: "비교 5 번",
    },
    {
      title: "T9 기준값 7 을 끝으로",
      text: "구간 [2,5] 4 칸의 중앙은 m = 2 + ⌊3/2⌋ = 3 이고 값은 7 입니다. 인덱스 3 과 5 를 맞바꿔 기준값을 끝에 둡니다.",
      array: [3, 4, 15, 10, 20, 7],
      range: [2, 5],
      read: [],
      write: [3, 5],
      pointers: {
        m: 3,
        hi: 5,
        target: 3,
      },
      calc: {
        expr: "2 + ⌊(5 − 2) / 2⌋",
        result: "3",
      },
      vars: "비교 5 번",
    },
    {
      title: "T10 15 < 7 ②",
      text: "j = 2 의 15 는 기준값 7 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [3, 4, 15, 10, 20, 7],
      range: [2, 5],
      read: [2],
      write: [],
      pointers: {
        i: 2,
        j: 2,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 2,
          to: 2,
          tone: "right",
        },
      ],
      calc: {
        expr: "15 < 7",
        result: "거짓",
      },
      vars: "비교 6 번",
    },
    {
      title: "T11 10 < 7 ②",
      text: "j = 3 의 10 은 기준값 7 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [3, 4, 15, 10, 20, 7],
      range: [2, 5],
      read: [3],
      write: [],
      pointers: {
        i: 2,
        j: 3,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 2,
          to: 3,
          tone: "right",
        },
      ],
      calc: {
        expr: "10 < 7",
        result: "거짓",
      },
      vars: "비교 7 번",
    },
    {
      title: "T12 20 < 7 ②",
      text: "j = 4 의 20 은 기준값 7 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [3, 4, 15, 10, 20, 7],
      range: [2, 5],
      read: [4],
      write: [],
      pointers: {
        i: 2,
        j: 4,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 2,
          to: 4,
          tone: "right",
        },
      ],
      calc: {
        expr: "20 < 7",
        result: "거짓",
      },
      vars: "비교 8 번",
    },
    {
      title: "T13 기준값 7 의 자리 p = 2",
      text: "기준값보다 작은 값이 0 개라 i = 2 에서 루프가 끝났습니다. 인덱스 2 와 5 를 맞바꾸면 기준값 7 이 인덱스 2 에 자리 잡습니다.",
      array: [3, 4, 7, 10, 20, 15],
      range: [2, 5],
      read: [],
      write: [2, 5],
      pointers: {
        p: 2,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 3,
          to: 5,
          tone: "right",
        },
      ],
      calc: null,
      vars: "비교 8 번",
    },
    {
      title: "T14 2 < 3 ⑤ 다음 구간 [3,5]",
      text: "p = 2 가 target = 3 보다 작아서 ⑤ 로 오른쪽 [3,5] 3 칸만 남깁니다.",
      array: [3, 4, 7, 10, 20, 15],
      range: [3, 5],
      read: [],
      write: [],
      pointers: {
        p: 2,
        target: 3,
      },
      calc: {
        expr: "2 < 3",
        result: "⑤",
      },
      vars: "비교 8 번",
    },
    {
      title: "T15 기준값 20 을 끝으로",
      text: "구간 [3,5] 3 칸의 중앙은 m = 3 + ⌊2/2⌋ = 4 이고 값은 20 입니다. 인덱스 4 와 5 를 맞바꿔 기준값을 끝에 둡니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 5],
      read: [],
      write: [4, 5],
      pointers: {
        m: 4,
        hi: 5,
        target: 3,
      },
      calc: {
        expr: "3 + ⌊(5 − 3) / 2⌋",
        result: "4",
      },
      vars: "비교 8 번",
    },
    {
      title: "T16 10 < 20 ①",
      text: "j = 3 의 10 이 기준값 20 보다 작아 ① 입니다. i = j = 3 이라 자리는 그대로이고 i 가 3 에서 4 로 늘어납니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 5],
      read: [],
      write: [3],
      pointers: {
        i: 4,
        j: 3,
        target: 3,
      },
      pieces: [
        {
          label: "작음",
          from: 3,
          to: 3,
          tone: "left",
        },
      ],
      calc: {
        expr: "10 < 20",
        result: "참",
      },
      vars: "비교 9 번",
    },
    {
      title: "T17 15 < 20 ①",
      text: "j = 4 의 15 가 기준값 20 보다 작아 ① 입니다. i = j = 4 라 자리는 그대로이고 i 가 4 에서 5 로 늘어납니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 5],
      read: [],
      write: [4],
      pointers: {
        i: 5,
        j: 4,
        target: 3,
      },
      pieces: [
        {
          label: "작음",
          from: 3,
          to: 4,
          tone: "left",
        },
      ],
      calc: {
        expr: "15 < 20",
        result: "참",
      },
      vars: "비교 10 번",
    },
    {
      title: "T18 기준값 20 의 자리 p = 5",
      text: "기준값보다 작은 값이 2 개라 i = 5 에서 루프가 끝났습니다. i 가 이미 끝 칸이라 자리가 그대로이고 기준값 20 이 인덱스 5 에 자리 잡습니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 5],
      read: [],
      write: [5],
      pointers: {
        p: 5,
        target: 3,
      },
      pieces: [
        {
          label: "작음",
          from: 3,
          to: 4,
          tone: "left",
        },
      ],
      calc: null,
      vars: "비교 10 번",
    },
    {
      title: "T19 5 > 3 ④ 다음 구간 [3,4]",
      text: "p = 5 가 target = 3 보다 커서 ④ 로 왼쪽 [3,4] 2 칸만 남깁니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 4],
      read: [],
      write: [],
      pointers: {
        p: 5,
        target: 3,
      },
      calc: {
        expr: "5 > 3",
        result: "④",
      },
      vars: "비교 10 번",
    },
    {
      title: "T20 기준값 10 을 끝으로",
      text: "구간 [3,4] 2 칸의 중앙은 m = 3 + ⌊1/2⌋ = 3 이고 값은 10 입니다. 인덱스 3 과 4 를 맞바꿔 기준값을 끝에 둡니다.",
      array: [3, 4, 7, 15, 10, 20],
      range: [3, 4],
      read: [],
      write: [3, 4],
      pointers: {
        m: 3,
        hi: 4,
        target: 3,
      },
      calc: {
        expr: "3 + ⌊(4 − 3) / 2⌋",
        result: "3",
      },
      vars: "비교 10 번",
    },
    {
      title: "T21 15 < 10 ②",
      text: "j = 3 의 15 는 기준값 10 보다 작지 않아 ② 입니다. 그대로 두고 j 만 나아갑니다.",
      array: [3, 4, 7, 15, 10, 20],
      range: [3, 4],
      read: [3],
      write: [],
      pointers: {
        i: 3,
        j: 3,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 3,
          to: 3,
          tone: "right",
        },
      ],
      calc: {
        expr: "15 < 10",
        result: "거짓",
      },
      vars: "비교 11 번",
    },
    {
      title: "T22 기준값 10 의 자리 p = 3",
      text: "기준값보다 작은 값이 0 개라 i = 3 에서 루프가 끝났습니다. 인덱스 3 과 4 를 맞바꾸면 기준값 10 이 인덱스 3 에 자리 잡습니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 4],
      read: [],
      write: [3, 4],
      pointers: {
        p: 3,
        target: 3,
      },
      pieces: [
        {
          label: "이상",
          from: 4,
          to: 4,
          tone: "right",
        },
      ],
      calc: null,
      vars: "비교 11 번",
    },
    {
      title: "T23 3 = 3 ③ 반환 10",
      text: "p = 3 이 target = 3 과 같아 ③ 입니다. A[3] = 10 을 돌려줍니다.",
      array: [3, 4, 7, 10, 15, 20],
      range: [3, 4],
      read: [],
      write: [3],
      pointers: {
        p: 3,
        target: 3,
      },
      calc: {
        expr: "3 = 3",
        result: "③",
      },
      vars: "비교 11 번",
    },
  ],
} satisfies ArrayPlayerSpec;
