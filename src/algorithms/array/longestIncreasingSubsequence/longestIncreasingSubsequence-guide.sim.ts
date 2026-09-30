import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [10, 9, 2, 5, 3, 7, 101, 18]`.
 * 원소 하나가 걸음 하나다(T1~T8). 걸음마다 이진 탐색으로 자리를 찾고, 끝이면 붙이고(②)
 * 아니면 갈아 끼운다(③). 마지막 걸음이 꼬리 배열의 길이를 돌려준다(④).
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 지금까지 읽은 원소 `[0,i]` 이고, 조각 괄호
 * `pieces` 는 이 원소가 들어갈 수 있는 꼬리 배열의 자리 `[0,길이]`(끝 바로 뒤 칸까지)다. 입력 배열 아래에
 * 꼬리 배열을 `layers` 로 쌓는다 — 칸 수는 끝난 뒤의 길이로 첫 걸음부터 잡고, 읽은 칸은 탐색이 읽은
 * `mid`, 새로 쓴 칸은 찾은 자리다. 탐색 한 번의 결과는 알약(`calc`), 누적 비교 수는 남는 변수(`vars`)다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `longestIncreasingSubsequence-guide.test.ts` 가 잰다.
 */

export const lisWalk = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "읽은 원소",
  title: "longestIncreasingSubsequence([10, 9, 2, 5, 3, 7, 101, 18])",
  result: "4",
  steps: [
    {
      title: "T1 x = 10 · ② 끝에 붙인다",
      text: "꼬리 배열이 비어 lo = hi = 0 이고, 반복 조건 0 < 0 이 거짓이라 탐색을 한 번도 안 합니다. 자리 0 이 끝(길이 0)이라 ② 10 을 끝에 붙입니다. 길이가 1 이 됩니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 0,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([], 10)",
        result: "0",
      },
      vars: "비교 누적 0 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [10, null, null, null],
          read: [],
          write: [0],
        },
      ],
    },
    {
      title: "T2 x = 9 · ③ 자리 0 을 갈아 끼운다",
      text: "mid = 0 에서 10 < 9 가 거짓이라 hi = 0 입니다. 자리 0 이 끝(길이 1)이 아니라 ③ tails[0] 을 10 에서 9 로 바꿉니다. 길이는 1 그대로입니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 1,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([10], 9)",
        result: "0",
      },
      vars: "비교 누적 1 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [9, null, null, null],
          read: [],
          write: [0],
        },
      ],
    },
    {
      title: "T3 x = 2 · ③ 자리 0 을 갈아 끼운다",
      text: "mid = 0 에서 9 < 2 가 거짓이라 hi = 0 입니다. 자리 0 이 끝(길이 1)이 아니라 ③ tails[0] 을 9 에서 2 로 바꿉니다. 길이는 1 그대로입니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 1,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([9], 2)",
        result: "0",
      },
      vars: "비교 누적 2 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [2, null, null, null],
          read: [],
          write: [0],
        },
      ],
    },
    {
      title: "T4 x = 5 · ② 끝에 붙인다",
      text: "mid = 0 에서 2 < 5 가 참이라 lo = 1 입니다. 자리 1 이 끝(길이 1)이라 ② 5 를 끝에 붙입니다. 길이가 2 가 됩니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 1,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([2], 5)",
        result: "1",
      },
      vars: "비교 누적 3 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [2, 5, null, null],
          read: [0],
          write: [1],
        },
      ],
    },
    {
      title: "T5 x = 3 · ③ 자리 1 을 갈아 끼운다",
      text: "mid = 1 에서 5 < 3 이 거짓이라 hi = 1, mid = 0 에서 2 < 3 이 참이라 lo = 1 입니다. 자리 1 이 끝(길이 2)이 아니라 ③ tails[1] 을 5 에서 3 으로 바꿉니다. 길이는 2 그대로입니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 2,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([2 5], 3)",
        result: "1",
      },
      vars: "비교 누적 5 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [2, 3, null, null],
          read: [0],
          write: [1],
        },
      ],
    },
    {
      title: "T6 x = 7 · ② 끝에 붙인다",
      text: "mid = 1 에서 3 < 7 이 참이라 lo = 2 입니다. 자리 2 가 끝(길이 2)이라 ② 7 을 끝에 붙입니다. 길이가 3 이 됩니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 5],
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 2,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([2 3], 7)",
        result: "2",
      },
      vars: "비교 누적 6 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [2, 3, 7, null],
          read: [1],
          write: [2],
        },
      ],
    },
    {
      title: "T7 x = 101 · ② 끝에 붙인다",
      text: "mid = 1 에서 3 < 101 이 참이라 lo = 2, mid = 2 에서 7 < 101 이 참이라 lo = 3 입니다. 자리 3 이 끝(길이 3)이라 ② 101 을 끝에 붙입니다. 길이가 4 가 됩니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 6],
      read: [6],
      write: [],
      pointers: {
        i: 6,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 3,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([2 3 7], 101)",
        result: "3",
      },
      vars: "비교 누적 8 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [2, 3, 7, 101],
          read: [1, 2],
          write: [3],
        },
      ],
    },
    {
      title: "T8 x = 18 · ③ 자리 3 을 갈아 끼운다",
      text: "mid = 2 에서 7 < 18 이 참이라 lo = 3, mid = 3 에서 101 < 18 이 거짓이라 hi = 3 입니다. 자리 3 이 끝(길이 4)이 아니라 ③ tails[3] 을 101 에서 18 로 바꿉니다. 길이는 4 그대로입니다. 원소를 다 읽었으니 ④ 꼬리 배열의 길이 4 를 돌려줍니다.",
      array: [10, 9, 2, 5, 3, 7, 101, 18],
      range: [0, 7],
      read: [7],
      write: [],
      pointers: {
        i: 7,
      },
      pieces: [
        {
          label: "자리 후보",
          from: 0,
          to: 4,
          tone: "left",
        },
      ],
      calc: {
        expr: "lowerBound([2 3 7 101], 18)",
        result: "3",
      },
      vars: "비교 누적 10 번",
      layers: [
        {
          name: "꼬리 배열",
          values: [2, 3, 7, 18],
          read: [2],
          write: [3],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
