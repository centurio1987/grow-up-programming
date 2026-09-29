import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `N = 7`, 갱신 셋
 * `(1,3,2) · (0,2,-1) · (5,6,3)`. `walk` 는 차분 배열을 잡는 T1, 갱신을 경계 두 칸에 적는 T2~T4,
 * 앞에서부터 누적해 결과 배열을 채우는 T5~T11 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 맨 위 줄은 결과 배열 `A`(`N` 칸)이고 아직 안 쓴 칸은 `null` 이다.
 * 그 아래에 배열에서 만드는 구조 — 차분 배열 `D`(`N + 1` 칸) — 를 `layers` 로 쌓는다(SPEC §13 배열 줄).
 * 쥔 구간 `range` 는 기록 걸음에서 갱신이 덮는 구간, 복원 걸음에서 누적한 앞부분 `[0,i]` 다. 계산 한
 * 줄은 알약(`calc`)에 두고, 무대 밖에 남는 값은 없다 — 누적값 `running` 은 방금 쓴 `A[i]` 칸에 있다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `diffArrayRangeUpdate-guide.test.ts` 가 잰다.
 */

export const walk = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "구간",
  title: "diffArrayRangeUpdate(7, [[1, 3, 2], [0, 2, -1], [5, 6, 3]])",
  result: "[-1, 1, 1, 2, 0, 3, 3]",
  steps: [
    {
      title: "T1 D 를 0 으로",
      text: "차분 배열 D 를 8 칸의 0 으로 잡습니다. 결과 배열 A 는 아직 없습니다.",
      array: [null, null, null, null, null, null, null],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "N + 1 = 7 + 1",
        result: "8 칸",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [0, 0, 0, 0, 0, 0, 0, 0],
          read: [],
          write: [0, 1, 2, 3, 4, 5, 6, 7],
        },
      ],
    },
    {
      title: "T2 (1,3,2) · ①②③",
      text: "갱신 (1,3,2) 는 구간 [1,3] 의 3 칸을 덮습니다. D[1] 에 2 를 더하고 D[4] 에서 2 를 뺍니다. A 는 건드리지 않습니다.",
      array: [null, null, null, null, null, null, null],
      range: [1, 3],
      read: [],
      write: [],
      calc: {
        expr: "D[1] += 2 · D[4] −= 2",
        result: "D[1] = 2 · D[4] = -2",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [0, 2, 0, 0, -2, 0, 0, 0],
          read: [],
          write: [1, 4],
        },
      ],
    },
    {
      title: "T3 (0,2,-1) · ①②③",
      text: "갱신 (0,2,-1) 는 구간 [0,2] 의 3 칸을 덮습니다. D[0] 에 -1 을 더하고 D[3] 에서 -1 을 뺍니다. A 는 건드리지 않습니다.",
      array: [null, null, null, null, null, null, null],
      range: [0, 2],
      read: [],
      write: [],
      calc: {
        expr: "D[0] += -1 · D[3] −= -1",
        result: "D[0] = -1 · D[3] = 1",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 0, 0, 0],
          read: [],
          write: [0, 3],
        },
      ],
    },
    {
      title: "T4 (5,6,3) · ①②③",
      text: "갱신 (5,6,3) 는 구간 [5,6] 의 2 칸을 덮습니다. D[5] 에 3 을 더하고 D[7] 에서 3 을 뺍니다. A 는 건드리지 않습니다.",
      array: [null, null, null, null, null, null, null],
      range: [5, 6],
      read: [],
      write: [],
      calc: {
        expr: "D[5] += 3 · D[7] −= 3",
        result: "D[5] = 3 · D[7] = -3",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [],
          write: [5, 7],
        },
      ],
    },
    {
      title: "T5 i = 0 · ④",
      text: "running = 0 에 D[0] = -1 을 더해 -1 이 되고, 그 값을 A[0] 에 씁니다. D 의 앞 1 칸 [0,0] 을 더한 값입니다.",
      array: [-1, null, null, null, null, null, null],
      range: [0, 0],
      read: [],
      write: [0],
      calc: {
        expr: "running + D[0] = 0 + (-1)",
        result: "-1",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [0],
          write: [],
        },
      ],
    },
    {
      title: "T6 i = 1 · ④",
      text: "running = -1 에 D[1] = 2 를 더해 1 이 되고, 그 값을 A[1] 에 씁니다. D 의 앞 2 칸 [0,1] 을 더한 값입니다.",
      array: [-1, 1, null, null, null, null, null],
      range: [0, 1],
      read: [],
      write: [1],
      calc: {
        expr: "running + D[1] = -1 + 2",
        result: "1",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [1],
          write: [],
        },
      ],
    },
    {
      title: "T7 i = 2 · ④",
      text: "running = 1 에 D[2] = 0 을 더해 1 이 되고, 그 값을 A[2] 에 씁니다. D 의 앞 3 칸 [0,2] 을 더한 값입니다.",
      array: [-1, 1, 1, null, null, null, null],
      range: [0, 2],
      read: [],
      write: [2],
      calc: {
        expr: "running + D[2] = 1 + 0",
        result: "1",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [2],
          write: [],
        },
      ],
    },
    {
      title: "T8 i = 3 · ④",
      text: "running = 1 에 D[3] = 1 을 더해 2 가 되고, 그 값을 A[3] 에 씁니다. D 의 앞 4 칸 [0,3] 을 더한 값입니다.",
      array: [-1, 1, 1, 2, null, null, null],
      range: [0, 3],
      read: [],
      write: [3],
      calc: {
        expr: "running + D[3] = 1 + 1",
        result: "2",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [3],
          write: [],
        },
      ],
    },
    {
      title: "T9 i = 4 · ④",
      text: "running = 2 에 D[4] = -2 를 더해 0 이 되고, 그 값을 A[4] 에 씁니다. D 의 앞 5 칸 [0,4] 을 더한 값입니다.",
      array: [-1, 1, 1, 2, 0, null, null],
      range: [0, 4],
      read: [],
      write: [4],
      calc: {
        expr: "running + D[4] = 2 + (-2)",
        result: "0",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [4],
          write: [],
        },
      ],
    },
    {
      title: "T10 i = 5 · ④",
      text: "running = 0 에 D[5] = 3 을 더해 3 이 되고, 그 값을 A[5] 에 씁니다. D 의 앞 6 칸 [0,5] 을 더한 값입니다.",
      array: [-1, 1, 1, 2, 0, 3, null],
      range: [0, 5],
      read: [],
      write: [5],
      calc: {
        expr: "running + D[5] = 0 + 3",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [5],
          write: [],
        },
      ],
    },
    {
      title: "T11 i = 6 · ④",
      text: "running = 3 에 D[6] = 0 을 더해 3 이 되고, 그 값을 A[6] 에 씁니다. D 의 앞 7 칸 [0,6] 을 더한 값입니다.",
      array: [-1, 1, 1, 2, 0, 3, 3],
      range: [0, 6],
      read: [],
      write: [6],
      calc: {
        expr: "running + D[6] = 3 + 0",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "D",
          values: [-1, 2, 0, 1, -2, 3, 0, -3],
          read: [6],
          write: [],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
