import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [3, 1, 4, 1, 5, 9]`, 질의 다섯
 * `[1,3] · [0,5] · [4,4] · [0,2] · [2,5]`. `walk` 는 첫 칸을 넣는 T1, 누적합 배열을 채우는 T2~T7, 질의를
 * 답하는 T8~T12 다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 입력 배열 `A` 아래에 배열에서 만드는 구조 둘 — 누적합 배열 `P`
 * (`n + 1` 칸)와 답 목록 — 을 `layers` 로 쌓고, 첫 걸음부터 모든 칸을 두어 아직 안 쓴 칸은 `null` 이다
 * (SPEC §13 배열 줄). 쥔 구간 `range` 는 채우기 걸음에서 새 칸이 덮는 앞부분, 답하기 걸음에서 질의다.
 * 계산 한 줄은 알약(`calc`)에 두고, 무대 밖에 남는 값은 없다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `prefixSumRangeQuery-guide.test.ts` 가 잰다.
 */

export const walk = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "구간",
  title:
    "prefixSumRangeQuery([3, 1, 4, 1, 5, 9], [[1, 3], [0, 5], [4, 4], [0, 2], [2, 5]])",
  result: "[6, 23, 5, 8, 19]",
  steps: [
    {
      title: "T1 P[0] = 0",
      text: "누적합 배열을 7 칸으로 잡고 첫 칸에 빈 구간의 합 0 을 넣습니다. 나머지 칸은 아직 비어 있습니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "P[0] = 0",
        result: "0",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, null, null, null, null, null, null],
          read: [],
          write: [0],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T2 i = 0 · ①",
      text: "P[0] = 0 에 A[0] = 3 을 더해 P[1] = 3 을 씁니다. 앞 1 칸 [0,0] 의 합입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 0],
      read: [0],
      write: [],
      calc: {
        expr: "P[0] + A[0] = 0 + 3",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, null, null, null, null, null],
          read: [0],
          write: [1],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T3 i = 1 · ①",
      text: "P[1] = 3 에 A[1] = 1 을 더해 P[2] = 4 를 씁니다. 앞 2 칸 [0,1] 의 합입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 1],
      read: [1],
      write: [],
      calc: {
        expr: "P[1] + A[1] = 3 + 1",
        result: "4",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, null, null, null, null],
          read: [1],
          write: [2],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T4 i = 2 · ①",
      text: "P[2] = 4 에 A[2] = 4 를 더해 P[3] = 8 을 씁니다. 앞 3 칸 [0,2] 의 합입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 2],
      read: [2],
      write: [],
      calc: {
        expr: "P[2] + A[2] = 4 + 4",
        result: "8",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, null, null, null],
          read: [2],
          write: [3],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T5 i = 3 · ①",
      text: "P[3] = 8 에 A[3] = 1 을 더해 P[4] = 9 를 씁니다. 앞 4 칸 [0,3] 의 합입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 3],
      read: [3],
      write: [],
      calc: {
        expr: "P[3] + A[3] = 8 + 1",
        result: "9",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, null, null],
          read: [3],
          write: [4],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T6 i = 4 · ①",
      text: "P[4] = 9 에 A[4] = 5 를 더해 P[5] = 14 를 씁니다. 앞 5 칸 [0,4] 의 합입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 4],
      read: [4],
      write: [],
      calc: {
        expr: "P[4] + A[4] = 9 + 5",
        result: "14",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, null],
          read: [4],
          write: [5],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T7 i = 5 · ①",
      text: "P[5] = 14 에 A[5] = 9 를 더해 P[6] = 23 을 씁니다. 앞 6 칸 [0,5] 의 합입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 5],
      read: [5],
      write: [],
      calc: {
        expr: "P[5] + A[5] = 14 + 9",
        result: "23",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, 23],
          read: [5],
          write: [6],
        },
        {
          name: "답",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T8 [1,3] · ②",
      text: "질의 [1,3] 입니다. P[4] = 9 에서 P[1] = 3 을 빼서 6 을 답 목록 칸 0 에 씁니다. 구간은 3 칸이고 읽은 칸은 둘입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [1, 3],
      read: [],
      write: [],
      calc: {
        expr: "P[4] − P[1] = 9 − 3",
        result: "6",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, 23],
          read: [1, 4],
          write: [],
        },
        {
          name: "답",
          values: [6, null, null, null, null],
          write: [0],
        },
      ],
    },
    {
      title: "T9 [0,5] · ②",
      text: "질의 [0,5] 입니다. P[6] = 23 에서 P[0] = 0 을 빼서 23 을 답 목록 칸 1 에 씁니다. 구간은 6 칸이고 읽은 칸은 둘입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 5],
      read: [],
      write: [],
      calc: {
        expr: "P[6] − P[0] = 23 − 0",
        result: "23",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, 23],
          read: [0, 6],
          write: [],
        },
        {
          name: "답",
          values: [6, 23, null, null, null],
          write: [1],
        },
      ],
    },
    {
      title: "T10 [4,4] · ②",
      text: "질의 [4,4] 입니다. P[5] = 14 에서 P[4] = 9 를 빼서 5 를 답 목록 칸 2 에 씁니다. 구간은 1 칸이고 읽은 칸은 둘입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [4, 4],
      read: [],
      write: [],
      calc: {
        expr: "P[5] − P[4] = 14 − 9",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, 23],
          read: [4, 5],
          write: [],
        },
        {
          name: "답",
          values: [6, 23, 5, null, null],
          write: [2],
        },
      ],
    },
    {
      title: "T11 [0,2] · ②",
      text: "질의 [0,2] 입니다. P[3] = 8 에서 P[0] = 0 을 빼서 8 을 답 목록 칸 3 에 씁니다. 구간은 3 칸이고 읽은 칸은 둘입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [0, 2],
      read: [],
      write: [],
      calc: {
        expr: "P[3] − P[0] = 8 − 0",
        result: "8",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, 23],
          read: [0, 3],
          write: [],
        },
        {
          name: "답",
          values: [6, 23, 5, 8, null],
          write: [3],
        },
      ],
    },
    {
      title: "T12 [2,5] · ②",
      text: "질의 [2,5] 입니다. P[6] = 23 에서 P[2] = 4 를 빼서 19 를 답 목록 칸 4 에 씁니다. 구간은 4 칸이고 읽은 칸은 둘입니다.",
      array: [3, 1, 4, 1, 5, 9],
      range: [2, 5],
      read: [],
      write: [],
      calc: {
        expr: "P[6] − P[2] = 23 − 4",
        result: "19",
      },
      vars: null,
      layers: [
        {
          name: "P",
          values: [0, 3, 4, 8, 9, 14, 23],
          read: [2, 6],
          write: [],
        },
        {
          name: "답",
          values: [6, 23, 5, 8, 19],
          write: [4],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
