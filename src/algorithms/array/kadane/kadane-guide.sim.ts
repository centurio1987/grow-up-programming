import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [-2, 1, -3, 4, -1, 2, 1, -5, 4]`.
 * `carry` 는 두 상태를 첫 칸의 값으로 두는 T1, 칸 1 부터 칸 8 까지 두 갈래 중 큰 쪽을 고르는 T2~T9,
 * 반복 조건이 거짓이 되어 답을 돌려주는 T10 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 `prev` 를 만든 구간이고, 입력 배열 `A`
 * 아래에 배열에서 만드는 줄 둘 — 칸마다 끝나는 최대합 `dp` 와 그때까지의 최댓값 `best` — 을
 * `layers` 로 쌓는다. 코드가 드는 것은 두 줄의 마지막 칸뿐이고, 줄은 지나온 값을 보이려고 그린다.
 * `best` 줄의 곁말(`side`)은 그 값을 만든 구간이다. 계산 한 줄은 알약(`calc`)에 두고, 무대 밖에
 * 남는 값은 없다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `kadane-guide.test.ts` 가 잰다.
 */

export const carry = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "prev",
  title: "kadane([-2, 1, -3, 4, -1, 2, 1, -5, 4])",
  result: "6",
  steps: [
    {
      title: "T1 i = 0 · ①",
      text: "prev 와 best 를 둘 다 A[0] = -2 로 둡니다. 칸 0 에서 끝나는 부분 배열은 [0,0] 하나뿐입니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "prev = best = A[0]",
        result: "-2",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, null, null, null, null, null, null, null, null],
          read: [],
          write: [0],
        },
        {
          name: "best",
          values: [-2, null, null, null, null, null, null, null, null],
          read: [],
          write: [0],
          side: "구간 [0,0]",
        },
      ],
    },
    {
      title: "T2 i = 1 · 새로 시작",
      text: "새로 시작하면 1, 이어 붙이면 (-2) + 1 = -1 입니다. 큰 쪽 1 이 칸 1 에서 끝나는 최대합이고(③ 새로 시작), best 는 -2 에서 1 로 커집니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [1, 1],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "max(1, (-2) + 1)",
        result: "1",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, null, null, null, null, null, null, null],
          read: [0],
          write: [1],
        },
        {
          name: "best",
          values: [-2, 1, null, null, null, null, null, null, null],
          read: [0],
          write: [1],
          side: "구간 [1,1]",
        },
      ],
    },
    {
      title: "T3 i = 2 · 이어 붙이기",
      text: "새로 시작하면 -3, 이어 붙이면 1 + (-3) = -2 입니다. 큰 쪽 -2 가 칸 2 에서 끝나는 최대합이고(③ 이어 붙이기), best 는 1 그대로입니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [1, 2],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "max(-3, 1 + (-3))",
        result: "-2",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, null, null, null, null, null, null],
          read: [1],
          write: [2],
        },
        {
          name: "best",
          values: [-2, 1, 1, null, null, null, null, null, null],
          read: [1],
          write: [],
          side: "구간 [1,1]",
        },
      ],
    },
    {
      title: "T4 i = 3 · 새로 시작",
      text: "새로 시작하면 4, 이어 붙이면 (-2) + 4 = 2 입니다. 큰 쪽 4 가 칸 3 에서 끝나는 최대합이고(③ 새로 시작), best 는 1 에서 4 로 커집니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 3],
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "max(4, (-2) + 4)",
        result: "4",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, null, null, null, null, null],
          read: [2],
          write: [3],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, null, null, null, null, null],
          read: [2],
          write: [3],
          side: "구간 [3,3]",
        },
      ],
    },
    {
      title: "T5 i = 4 · 이어 붙이기",
      text: "새로 시작하면 -1, 이어 붙이면 4 + (-1) = 3 입니다. 큰 쪽 3 이 칸 4 에서 끝나는 최대합이고(③ 이어 붙이기), best 는 4 그대로입니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 4],
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "max(-1, 4 + (-1))",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, 3, null, null, null, null],
          read: [3],
          write: [4],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, 4, null, null, null, null],
          read: [3],
          write: [],
          side: "구간 [3,3]",
        },
      ],
    },
    {
      title: "T6 i = 5 · 이어 붙이기",
      text: "새로 시작하면 2, 이어 붙이면 3 + 2 = 5 입니다. 큰 쪽 5 가 칸 5 에서 끝나는 최대합이고(③ 이어 붙이기), best 는 4 에서 5 로 커집니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 5],
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      calc: {
        expr: "max(2, 3 + 2)",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, 3, 5, null, null, null],
          read: [4],
          write: [5],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, 4, 5, null, null, null],
          read: [4],
          write: [5],
          side: "구간 [3,5]",
        },
      ],
    },
    {
      title: "T7 i = 6 · 이어 붙이기",
      text: "새로 시작하면 1, 이어 붙이면 5 + 1 = 6 입니다. 큰 쪽 6 이 칸 6 에서 끝나는 최대합이고(③ 이어 붙이기), best 는 5 에서 6 으로 커집니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 6],
      read: [6],
      write: [],
      pointers: {
        i: 6,
      },
      calc: {
        expr: "max(1, 5 + 1)",
        result: "6",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, 3, 5, 6, null, null],
          read: [5],
          write: [6],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, 4, 5, 6, null, null],
          read: [5],
          write: [6],
          side: "구간 [3,6]",
        },
      ],
    },
    {
      title: "T8 i = 7 · 이어 붙이기",
      text: "새로 시작하면 -5, 이어 붙이면 6 + (-5) = 1 입니다. 큰 쪽 1 이 칸 7 에서 끝나는 최대합이고(③ 이어 붙이기), best 는 6 그대로입니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 7],
      read: [7],
      write: [],
      pointers: {
        i: 7,
      },
      calc: {
        expr: "max(-5, 6 + (-5))",
        result: "1",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, 3, 5, 6, 1, null],
          read: [6],
          write: [7],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, 4, 5, 6, 6, null],
          read: [6],
          write: [],
          side: "구간 [3,6]",
        },
      ],
    },
    {
      title: "T9 i = 8 · 이어 붙이기",
      text: "새로 시작하면 4, 이어 붙이면 1 + 4 = 5 입니다. 큰 쪽 5 가 칸 8 에서 끝나는 최대합이고(③ 이어 붙이기), best 는 6 그대로입니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 8],
      read: [8],
      write: [],
      pointers: {
        i: 8,
      },
      calc: {
        expr: "max(4, 1 + 4)",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, 3, 5, 6, 1, 5],
          read: [7],
          write: [8],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, 4, 5, 6, 6, 6],
          read: [7],
          write: [],
          side: "구간 [3,6]",
        },
      ],
    },
    {
      title: "T10 i = 9 · 반복 끝",
      text: "i = 9 라 ② 의 조건 i < 9 가 거짓입니다. 반복을 마치고 best = 6 을 돌려줍니다. 이 값을 만든 구간은 [3,6] 입니다.",
      array: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      range: [3, 8],
      read: [],
      write: [],
      pointers: {
        i: 9,
      },
      calc: {
        expr: "9 < 9",
        result: "거짓",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [-2, 1, -2, 4, 3, 5, 6, 1, 5],
          read: [],
          write: [],
        },
        {
          name: "best",
          values: [-2, 1, 1, 4, 4, 5, 6, 6, 6],
          read: [8],
          write: [],
          side: "구간 [3,6]",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
