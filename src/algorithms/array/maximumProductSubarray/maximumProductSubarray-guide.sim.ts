import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [2, -3, -2, 4, 0, -1]`.
 * `pair` 는 세 상태를 첫 칸의 값으로 두는 T1, 칸 1 부터 칸 5 까지 후보 셋에서 최댓값과 최솟값을
 * 함께 고르는 T2~T6, 반복 조건이 거짓이 되어 답을 돌려주는 T7 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 `curMax` 를 만든 구간이고, 입력 배열 `A`
 * 아래에 배열에서 만드는 줄 셋 — 칸마다 끝나는 최대곱 `mx` · 최소곱 `mn` 과 그때까지의 최댓값
 * `best` — 을 `layers` 로 쌓는다. 코드가 드는 것은 세 줄의 마지막 칸뿐이고, 줄은 지나온 값을 보이려고
 * 그린다. 줄마다 곁말(`side`)은 그 값을 만든 구간이다 — 음수를 곱한 걸음에서 `mx` 의 구간이 직전
 * `mn` 의 구간에서 이어지는 것이 이 편의 요점이다. 후보 셋과 고른 두 값은 알약(`calc`)에 두고, 무대
 * 밖에 남는 값은 없다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `maximumProductSubarray-guide.test.ts` 가 잰다.
 */

export const pair = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "curMax",
  title: "maximumProductSubarray([2, -3, -2, 4, 0, -1])",
  result: "48",
  steps: [
    {
      title: "T1 i = 0 · ①",
      text: "curMax · curMin · best 를 모두 A[0] = 2 로 둡니다. 칸 0 에서 끝나는 부분 배열은 [0,0] 하나뿐입니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "curMax = curMin = best = A[0]",
        result: "2",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, null, null, null, null, null],
          read: [],
          write: [0],
          side: "구간 [0,0]",
        },
        {
          name: "mn",
          values: [2, null, null, null, null, null],
          read: [],
          write: [0],
          side: "구간 [0,0]",
        },
        {
          name: "best",
          values: [2, null, null, null, null, null],
          read: [],
          write: [0],
          side: "구간 [0,0]",
        },
      ],
    },
    {
      title: "T2 i = 1 · A[i] = -3",
      text: "후보는 새로 시작 -3, 최댓값에 잇기 2 × (-3) = -6, 최솟값에 잇기 2 × (-3) = -6 입니다. 가장 큰 -3 이 curMax(새로 시작), 가장 작은 -6 이 curMin(잇기 둘이 같음)이고, best 는 2 그대로입니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [1, 1],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "후보 -3 · -6 · -6",
        result: "최대 -3 · 최소 -6",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, -3, null, null, null, null],
          read: [0],
          write: [1],
          side: "구간 [1,1]",
        },
        {
          name: "mn",
          values: [2, -6, null, null, null, null],
          read: [0],
          write: [1],
          side: "구간 [0,1]",
        },
        {
          name: "best",
          values: [2, 2, null, null, null, null],
          read: [0],
          write: [],
          side: "구간 [0,0]",
        },
      ],
    },
    {
      title: "T3 i = 2 · A[i] = -2",
      text: "후보는 새로 시작 -2, 최댓값에 잇기 (-3) × (-2) = 6, 최솟값에 잇기 (-6) × (-2) = 12 입니다. 가장 큰 12 가 curMax(최솟값에 잇기), 가장 작은 -2 가 curMin(새로 시작)이고, best 는 2 에서 12 로 커집니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "후보 -2 · 6 · 12",
        result: "최대 12 · 최소 -2",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, -3, 12, null, null, null],
          read: [1],
          write: [2],
          side: "구간 [0,2]",
        },
        {
          name: "mn",
          values: [2, -6, -2, null, null, null],
          read: [1],
          write: [2],
          side: "구간 [2,2]",
        },
        {
          name: "best",
          values: [2, 2, 12, null, null, null],
          read: [1],
          write: [2],
          side: "구간 [0,2]",
        },
      ],
    },
    {
      title: "T4 i = 3 · A[i] = 4",
      text: "후보는 새로 시작 4, 최댓값에 잇기 12 × 4 = 48, 최솟값에 잇기 (-2) × 4 = -8 입니다. 가장 큰 48 이 curMax(최댓값에 잇기), 가장 작은 -8 이 curMin(최솟값에 잇기)이고, best 는 12 에서 48 로 커집니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "후보 4 · 48 · -8",
        result: "최대 48 · 최소 -8",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, -3, 12, 48, null, null],
          read: [2],
          write: [3],
          side: "구간 [0,3]",
        },
        {
          name: "mn",
          values: [2, -6, -2, -8, null, null],
          read: [2],
          write: [3],
          side: "구간 [2,3]",
        },
        {
          name: "best",
          values: [2, 2, 12, 48, null, null],
          read: [2],
          write: [3],
          side: "구간 [0,3]",
        },
      ],
    },
    {
      title: "T5 i = 4 · A[i] = 0",
      text: "후보는 새로 시작 0, 최댓값에 잇기 48 × 0 = 0, 최솟값에 잇기 (-8) × 0 = 0 입니다. 가장 큰 0 이 curMax(셋이 같음), 가장 작은 0 이 curMin(셋이 같음)이고, best 는 48 그대로입니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [4, 4],
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "후보 0 · 0 · 0",
        result: "최대 0 · 최소 0",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, -3, 12, 48, 0, null],
          read: [3],
          write: [4],
          side: "구간 [4,4]",
        },
        {
          name: "mn",
          values: [2, -6, -2, -8, 0, null],
          read: [3],
          write: [4],
          side: "구간 [4,4]",
        },
        {
          name: "best",
          values: [2, 2, 12, 48, 48, null],
          read: [3],
          write: [],
          side: "구간 [0,3]",
        },
      ],
    },
    {
      title: "T6 i = 5 · A[i] = -1",
      text: "후보는 새로 시작 -1, 최댓값에 잇기 0 × (-1) = 0, 최솟값에 잇기 0 × (-1) = 0 입니다. 가장 큰 0 이 curMax(잇기 둘이 같음), 가장 작은 -1 이 curMin(새로 시작)이고, best 는 48 그대로입니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [4, 5],
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      calc: {
        expr: "후보 -1 · 0 · 0",
        result: "최대 0 · 최소 -1",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, -3, 12, 48, 0, 0],
          read: [4],
          write: [5],
          side: "구간 [4,5]",
        },
        {
          name: "mn",
          values: [2, -6, -2, -8, 0, -1],
          read: [4],
          write: [5],
          side: "구간 [5,5]",
        },
        {
          name: "best",
          values: [2, 2, 12, 48, 48, 48],
          read: [4],
          write: [],
          side: "구간 [0,3]",
        },
      ],
    },
    {
      title: "T7 i = 6 · 반복 끝",
      text: "i = 6 이라 ② 의 조건 i < 6 이 거짓입니다. 반복을 마치고 best = 48 을 돌려줍니다. 이 값을 만든 구간은 [0,3] 입니다.",
      array: [2, -3, -2, 4, 0, -1],
      range: [4, 5],
      read: [],
      write: [],
      pointers: {
        i: 6,
      },
      calc: {
        expr: "6 < 6",
        result: "거짓",
      },
      vars: null,
      layers: [
        {
          name: "mx",
          values: [2, -3, 12, 48, 0, 0],
          read: [],
          write: [],
          side: "구간 [4,5]",
        },
        {
          name: "mn",
          values: [2, -6, -2, -8, 0, -1],
          read: [],
          write: [],
          side: "구간 [5,5]",
        },
        {
          name: "best",
          values: [2, 2, 12, 48, 48, 48],
          read: [5],
          write: [],
          side: "구간 [0,3]",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
