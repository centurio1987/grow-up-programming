import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [5, 2, 4, 1, 2, 6]`.
 * `mergeHeads` 는 마지막 합치기 `merge([2 4 5], [1 2 6])` 를 비교 하나씩 본 T1~T6, `merge6` 은 전체 실행의
 * 가르는 부름과 합치기 T7~T16 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 정렬은 값이 걸음마다 바뀌므로 `array` 를 걸음마다 싣는다.
 * `mergeHeads` 의 무대는 합치는 여섯 칸을 한 줄로 — 왼쪽부터 `out` 에 담긴 값 · `L` 에 남은 값 · `R` 에 남은
 * 값이고, `pieces` 가 두 조각에 남은 자리, `write` 가 이번에 `out` 에 담은 칸, `read` 가 그 값과 비교했지만
 * 남은 쪽 머리다. `merge6` 의 무대는 합친 조각을 제자리에 놓은 배열이고, `range` 가 지금 부른 구간,
 * `pieces` 가 가른 두 조각, `write` 가 합치기가 새로 쓴 구간이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `sortArray-guide.test.ts` 가 잰다.
 */

export const mergeHeads = {
  player: "stage",
  stage: "array",
  arrayName: "칸",
  rangeLabel: "합치는 칸",
  title: "merge([2, 4, 5], [1, 2, 6])",
  result: "[1, 2, 2, 4, 5, 6]",
  steps: [
    {
      title: "T1 2 <= 1 ③",
      text: "L 의 머리 2 와 R 의 머리 1 을 비교합니다. 2 <= 1 이 거짓이라 ③ 으로 오른쪽 1 을 out 에 담습니다.",
      array: [1, 2, 4, 5, 2, 6],
      range: [0, 5],
      read: [1],
      write: [0],
      pieces: [
        {
          label: "L",
          from: 1,
          to: 3,
          tone: "left",
          text: "i = 0",
        },
        {
          label: "R",
          from: 4,
          to: 5,
          tone: "right",
          text: "j = 1",
        },
      ],
      calc: {
        expr: "2 <= 1",
        result: "거짓",
      },
      vars: "비교 1 번",
    },
    {
      title: "T2 2 <= 2 ②",
      text: "L 의 머리 2 와 R 의 머리 2 를 비교합니다. 2 <= 2 가 참이라 ② 로 왼쪽 2 를 out 에 담습니다.",
      array: [1, 2, 4, 5, 2, 6],
      range: [0, 5],
      read: [4],
      write: [1],
      pieces: [
        {
          label: "L",
          from: 2,
          to: 3,
          tone: "left",
          text: "i = 1",
        },
        {
          label: "R",
          from: 4,
          to: 5,
          tone: "right",
          text: "j = 1",
        },
      ],
      calc: {
        expr: "2 <= 2",
        result: "참",
      },
      vars: "비교 2 번",
    },
    {
      title: "T3 4 <= 2 ③",
      text: "L 의 머리 4 와 R 의 머리 2 를 비교합니다. 4 <= 2 가 거짓이라 ③ 으로 오른쪽 2 를 out 에 담습니다.",
      array: [1, 2, 2, 4, 5, 6],
      range: [0, 5],
      read: [3],
      write: [2],
      pieces: [
        {
          label: "L",
          from: 3,
          to: 4,
          tone: "left",
          text: "i = 1",
        },
        {
          label: "R",
          from: 5,
          to: 5,
          tone: "right",
          text: "j = 2",
        },
      ],
      calc: {
        expr: "4 <= 2",
        result: "거짓",
      },
      vars: "비교 3 번",
    },
    {
      title: "T4 4 <= 6 ②",
      text: "L 의 머리 4 와 R 의 머리 6 을 비교합니다. 4 <= 6 이 참이라 ② 로 왼쪽 4 를 out 에 담습니다.",
      array: [1, 2, 2, 4, 5, 6],
      range: [0, 5],
      read: [5],
      write: [3],
      pieces: [
        {
          label: "L",
          from: 4,
          to: 4,
          tone: "left",
          text: "i = 2",
        },
        {
          label: "R",
          from: 5,
          to: 5,
          tone: "right",
          text: "j = 2",
        },
      ],
      calc: {
        expr: "4 <= 6",
        result: "참",
      },
      vars: "비교 4 번",
    },
    {
      title: "T5 5 <= 6 ②",
      text: "L 의 머리 5 와 R 의 머리 6 을 비교합니다. 5 <= 6 이 참이라 ② 로 왼쪽 5 를 out 에 담습니다.",
      array: [1, 2, 2, 4, 5, 6],
      range: [0, 5],
      read: [5],
      write: [4],
      pieces: [
        {
          label: "R",
          from: 5,
          to: 5,
          tone: "right",
          text: "j = 2",
        },
      ],
      calc: {
        expr: "5 <= 6",
        result: "참",
      },
      vars: "비교 5 번",
    },
    {
      title: "T6 ⑤ [6] 잇기",
      text: "L 을 다 써서 반복이 끝납니다. ⑤ 가 R 에 남은 6 을 비교 없이 잇습니다.",
      array: [1, 2, 2, 4, 5, 6],
      range: [0, 5],
      read: [],
      write: [5],
      pieces: [],
      calc: null,
      vars: "비교 5 번",
    },
  ],
} satisfies ArrayPlayerSpec;

export const merge6 = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "부름",
  title: "sortArray([5, 2, 4, 1, 2, 6])",
  result: "[1, 2, 2, 4, 5, 6]",
  steps: [
    {
      title: "T7 [5 2 4 1 2 6] 가르기",
      text: "sortArray([5 2 4 1 2 6]) — 칸이 6 개라 ① 이 아닙니다. mid = 3 이라서 [5 2 4] 와 [1 2 6] 으로 가릅니다.",
      array: [5, 2, 4, 1, 2, 6],
      range: [0, 5],
      read: [],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "오른쪽",
          from: 3,
          to: 5,
          tone: "right",
        },
      ],
      calc: {
        expr: "6 >> 1",
        result: "3",
      },
      vars: "비교 누적 0 번",
    },
    {
      title: "T8 [5 2 4] 가르기",
      text: "sortArray([5 2 4]) — 칸이 3 개라 ① 이 아닙니다. mid = 1 이라서 [5] 와 [2 4] 로 가릅니다. [5] 는 칸이 하나라 ① 로 그대로 돌아옵니다.",
      array: [5, 2, 4, 1, 2, 6],
      range: [0, 2],
      read: [],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "오른쪽",
          from: 1,
          to: 2,
          tone: "right",
        },
      ],
      calc: {
        expr: "3 >> 1",
        result: "1",
      },
      vars: "비교 누적 0 번",
    },
    {
      title: "T9 [2 4] 가르기",
      text: "sortArray([2 4]) — 칸이 2 개라 ① 이 아닙니다. mid = 1 이라서 [2] 와 [4] 로 가릅니다. [2] 와 [4] 는 칸이 하나라 ① 로 그대로 돌아옵니다.",
      array: [5, 2, 4, 1, 2, 6],
      range: [1, 2],
      read: [],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 1,
          to: 1,
          tone: "left",
        },
        {
          label: "오른쪽",
          from: 2,
          to: 2,
          tone: "right",
        },
      ],
      calc: {
        expr: "2 >> 1",
        result: "1",
      },
      vars: "비교 누적 0 번",
    },
    {
      title: "T10 [2] + [4] 합치기",
      text: "2 <= 4 참 → ②. ⑤ 가 4 를 잇습니다. 결과는 [2 4] 입니다.",
      array: [5, 2, 4, 1, 2, 6],
      range: [1, 2],
      read: [],
      write: [1, 2],
      pieces: [],
      calc: {
        expr: "비교 1 번",
        result: "[2 4]",
      },
      vars: "비교 누적 1 번",
    },
    {
      title: "T11 [5] + [2 4] 합치기",
      text: "5 <= 2 거짓 → ③, 5 <= 4 거짓 → ③. ④ 가 5 를 잇습니다. 결과는 [2 4 5] 입니다.",
      array: [2, 4, 5, 1, 2, 6],
      range: [0, 2],
      read: [],
      write: [0, 1, 2],
      pieces: [],
      calc: {
        expr: "비교 2 번",
        result: "[2 4 5]",
      },
      vars: "비교 누적 3 번",
    },
    {
      title: "T12 [1 2 6] 가르기",
      text: "sortArray([1 2 6]) — 칸이 3 개라 ① 이 아닙니다. mid = 1 이라서 [1] 과 [2 6] 으로 가릅니다. [1] 은 칸이 하나라 ① 로 그대로 돌아옵니다.",
      array: [2, 4, 5, 1, 2, 6],
      range: [3, 5],
      read: [],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 3,
          to: 3,
          tone: "left",
        },
        {
          label: "오른쪽",
          from: 4,
          to: 5,
          tone: "right",
        },
      ],
      calc: {
        expr: "3 >> 1",
        result: "1",
      },
      vars: "비교 누적 3 번",
    },
    {
      title: "T13 [2 6] 가르기",
      text: "sortArray([2 6]) — 칸이 2 개라 ① 이 아닙니다. mid = 1 이라서 [2] 와 [6] 으로 가릅니다. [2] 와 [6] 은 칸이 하나라 ① 로 그대로 돌아옵니다.",
      array: [2, 4, 5, 1, 2, 6],
      range: [4, 5],
      read: [],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 4,
          to: 4,
          tone: "left",
        },
        {
          label: "오른쪽",
          from: 5,
          to: 5,
          tone: "right",
        },
      ],
      calc: {
        expr: "2 >> 1",
        result: "1",
      },
      vars: "비교 누적 3 번",
    },
    {
      title: "T14 [2] + [6] 합치기",
      text: "2 <= 6 참 → ②. ⑤ 가 6 을 잇습니다. 결과는 [2 6] 입니다.",
      array: [2, 4, 5, 1, 2, 6],
      range: [4, 5],
      read: [],
      write: [4, 5],
      pieces: [],
      calc: {
        expr: "비교 1 번",
        result: "[2 6]",
      },
      vars: "비교 누적 4 번",
    },
    {
      title: "T15 [1] + [2 6] 합치기",
      text: "1 <= 2 참 → ②. ⑤ 가 2 6 을 잇습니다. 결과는 [1 2 6] 입니다.",
      array: [2, 4, 5, 1, 2, 6],
      range: [3, 5],
      read: [],
      write: [3, 4, 5],
      pieces: [],
      calc: {
        expr: "비교 1 번",
        result: "[1 2 6]",
      },
      vars: "비교 누적 5 번",
    },
    {
      title: "T16 [2 4 5] + [1 2 6] 합치기",
      text: "2 <= 1 거짓 → ③, 2 <= 2 참 → ②, 4 <= 2 거짓 → ③, 4 <= 6 참 → ②, 5 <= 6 참 → ②. ⑤ 가 6 을 잇습니다. 결과는 [1 2 2 4 5 6] 입니다.",
      array: [1, 2, 2, 4, 5, 6],
      range: [0, 5],
      read: [],
      write: [0, 1, 2, 3, 4, 5],
      pieces: [],
      calc: {
        expr: "비교 5 번",
        result: "[1 2 2 4 5 6]",
      },
      vars: "비교 누적 10 번",
    },
  ],
} satisfies ArrayPlayerSpec;
