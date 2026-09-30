import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `arr = [1, 1, 2, 1, 3]`, 질의 다섯
 * `[[0, 4], [0, 2], [2, 4], [1, 3], [2, 3]]`(이름은 `Q0` 부터). `window` 는 창이 한 칸 옮기는 걸음과 답을 적는
 * 걸음 T1~T16 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 창 `[curL, curR]`(비면 `null`), `read` 는 이번 걸음에
 * 넣거나 뺀 칸, `pieces` 는 창이 맞추려는 질의, `layers` 의 `out` 은 원래 자리에 적은 답, `map` 은
 * `count` 맵이다. `distinct` 는 무대에 자리가 없어 남는 변수(`vars`)에 둔다(SPEC §13 배열 줄).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `mosAlgorithm-guide.test.ts` 가 잰다.
 */

export const window = {
  player: "stage",
  stage: "array",
  arrayName: "arr",
  rangeLabel: "창",
  title:
    "mosAlgorithm([1, 1, 2, 1, 3], [[0, 4], [0, 2], [2, 4], [1, 3], [2, 3]])",
  result: "[3,2,3,2,2]",
  steps: [
    {
      title: "T1 R+ add(1)",
      text: "Q1[0,2] 에 맞추려고 창을 오른쪽으로 넓힙니다. arr[0] = 1 을 넣고, count[1] 이 0 → 1 이라 distinct 가 1 이 됩니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        curL: 0,
        curR: 0,
      },
      pieces: [
        {
          label: "Q1",
          from: 0,
          to: 2,
          tone: "right",
          text: "[0,2]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [[1, 1]],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 0 → 1",
        result: "distinct 1",
      },
      vars: "distinct = 1",
    },
    {
      title: "T2 R+ add(1)",
      text: "Q1[0,2] 에 맞추려고 창을 오른쪽으로 넓힙니다. arr[1] = 1 을 넣고, count[1] 이 1 → 2 라 distinct 는 1 그대로입니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {
        curL: 0,
        curR: 1,
      },
      pieces: [
        {
          label: "Q1",
          from: 0,
          to: 2,
          tone: "right",
          text: "[0,2]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [[1, 2]],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 1 → 2",
        result: "distinct 1",
      },
      vars: "distinct = 1",
    },
    {
      title: "T3 R+ add(2)",
      text: "Q1[0,2] 에 맞추려고 창을 오른쪽으로 넓힙니다. arr[2] = 2 를 넣고, count[2] 가 0 → 1 이라 distinct 가 2 가 됩니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        curL: 0,
        curR: 2,
      },
      pieces: [
        {
          label: "Q1",
          from: 0,
          to: 2,
          tone: "right",
          text: "[0,2]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 2],
          [2, 1],
        ],
        slots: 3,
        read: [],
        write: [2],
      },
      calc: {
        expr: "count[2] 0 → 1",
        result: "distinct 2",
      },
      vars: "distinct = 2",
    },
    {
      title: "T4 Q1[0,2] 답 기록",
      text: "창이 Q1 의 구간 [0,2] 와 같아졌습니다. out[1] = 2 를 적습니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 2],
      read: [],
      write: [],
      pointers: {
        curL: 0,
        curR: 2,
      },
      pieces: [
        {
          label: "Q1",
          from: 0,
          to: 2,
          tone: "right",
          text: "[0,2]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, 2, null, null, null],
          write: [1],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 2],
          [2, 1],
        ],
        slots: 3,
        read: [],
        write: [],
      },
      calc: null,
      vars: "distinct = 2",
    },
    {
      title: "T5 R+ add(1)",
      text: "Q3[1,3] 에 맞추려고 창을 오른쪽으로 넓힙니다. arr[3] = 1 을 넣고, count[1] 이 2 → 3 이라 distinct 는 2 그대로입니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        curL: 0,
        curR: 3,
      },
      pieces: [
        {
          label: "Q3",
          from: 1,
          to: 3,
          tone: "right",
          text: "[1,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, 2, null, null, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 3],
          [2, 1],
        ],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 2 → 3",
        result: "distinct 2",
      },
      vars: "distinct = 2",
    },
    {
      title: "T6 L− remove(1)",
      text: "Q3[1,3] 에 맞추려고 창을 왼쪽에서 좁힙니다. arr[0] = 1 을 빼고, count[1] 이 3 → 2 라 distinct 는 2 그대로입니다.",
      array: [1, 1, 2, 1, 3],
      range: [1, 3],
      read: [0],
      write: [],
      pointers: {
        curL: 1,
        curR: 3,
      },
      pieces: [
        {
          label: "Q3",
          from: 1,
          to: 3,
          tone: "right",
          text: "[1,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, 2, null, null, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 2],
          [2, 1],
        ],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 3 → 2",
        result: "distinct 2",
      },
      vars: "distinct = 2",
    },
    {
      title: "T7 Q3[1,3] 답 기록",
      text: "창이 Q3 의 구간 [1,3] 과 같아졌습니다. out[3] = 2 를 적습니다.",
      array: [1, 1, 2, 1, 3],
      range: [1, 3],
      read: [],
      write: [],
      pointers: {
        curL: 1,
        curR: 3,
      },
      pieces: [
        {
          label: "Q3",
          from: 1,
          to: 3,
          tone: "right",
          text: "[1,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, 2, null, 2, null],
          write: [3],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 2],
          [2, 1],
        ],
        slots: 3,
        read: [],
        write: [],
      },
      calc: null,
      vars: "distinct = 2",
    },
    {
      title: "T8 L+ add(1)",
      text: "Q0[0,4] 에 맞추려고 창을 왼쪽으로 넓힙니다. arr[0] = 1 을 넣고, count[1] 이 2 → 3 이라 distinct 는 2 그대로입니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 3],
      read: [0],
      write: [],
      pointers: {
        curL: 0,
        curR: 3,
      },
      pieces: [
        {
          label: "Q0",
          from: 0,
          to: 4,
          tone: "right",
          text: "[0,4]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, 2, null, 2, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 3],
          [2, 1],
        ],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 2 → 3",
        result: "distinct 2",
      },
      vars: "distinct = 2",
    },
    {
      title: "T9 R+ add(3)",
      text: "Q0[0,4] 에 맞추려고 창을 오른쪽으로 넓힙니다. arr[4] = 3 을 넣고, count[3] 이 0 → 1 이라 distinct 가 3 이 됩니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        curL: 0,
        curR: 4,
      },
      pieces: [
        {
          label: "Q0",
          from: 0,
          to: 4,
          tone: "right",
          text: "[0,4]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [null, 2, null, 2, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 3],
          [2, 1],
          [3, 1],
        ],
        slots: 3,
        read: [],
        write: [3],
      },
      calc: {
        expr: "count[3] 0 → 1",
        result: "distinct 3",
      },
      vars: "distinct = 3",
    },
    {
      title: "T10 Q0[0,4] 답 기록",
      text: "창이 Q0 의 구간 [0,4] 와 같아졌습니다. out[0] = 3 을 적습니다.",
      array: [1, 1, 2, 1, 3],
      range: [0, 4],
      read: [],
      write: [],
      pointers: {
        curL: 0,
        curR: 4,
      },
      pieces: [
        {
          label: "Q0",
          from: 0,
          to: 4,
          tone: "right",
          text: "[0,4]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, null, 2, null],
          write: [0],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 3],
          [2, 1],
          [3, 1],
        ],
        slots: 3,
        read: [],
        write: [],
      },
      calc: null,
      vars: "distinct = 3",
    },
    {
      title: "T11 L− remove(1)",
      text: "Q4[2,3] 에 맞추려고 창을 왼쪽에서 좁힙니다. arr[0] = 1 을 빼고, count[1] 이 3 → 2 라 distinct 는 3 그대로입니다.",
      array: [1, 1, 2, 1, 3],
      range: [1, 4],
      read: [0],
      write: [],
      pointers: {
        curL: 1,
        curR: 4,
      },
      pieces: [
        {
          label: "Q4",
          from: 2,
          to: 3,
          tone: "right",
          text: "[2,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, null, 2, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 2],
          [2, 1],
          [3, 1],
        ],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 3 → 2",
        result: "distinct 3",
      },
      vars: "distinct = 3",
    },
    {
      title: "T12 L− remove(1)",
      text: "Q4[2,3] 에 맞추려고 창을 왼쪽에서 좁힙니다. arr[1] = 1 을 빼고, count[1] 이 2 → 1 이라 distinct 는 3 그대로입니다.",
      array: [1, 1, 2, 1, 3],
      range: [2, 4],
      read: [1],
      write: [],
      pointers: {
        curL: 2,
        curR: 4,
      },
      pieces: [
        {
          label: "Q4",
          from: 2,
          to: 3,
          tone: "right",
          text: "[2,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, null, 2, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 1],
          [2, 1],
          [3, 1],
        ],
        slots: 3,
        read: [],
        write: [1],
      },
      calc: {
        expr: "count[1] 2 → 1",
        result: "distinct 3",
      },
      vars: "distinct = 3",
    },
    {
      title: "T13 R− remove(3)",
      text: "Q4[2,3] 에 맞추려고 창을 오른쪽에서 좁힙니다. arr[4] = 3 을 빼고, count[3] 이 1 → 0 이라 distinct 가 2 가 됩니다.",
      array: [1, 1, 2, 1, 3],
      range: [2, 3],
      read: [4],
      write: [],
      pointers: {
        curL: 2,
        curR: 3,
      },
      pieces: [
        {
          label: "Q4",
          from: 2,
          to: 3,
          tone: "right",
          text: "[2,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, null, 2, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 1],
          [2, 1],
          [3, 0],
        ],
        slots: 3,
        read: [],
        write: [3],
      },
      calc: {
        expr: "count[3] 1 → 0",
        result: "distinct 2",
      },
      vars: "distinct = 2",
    },
    {
      title: "T14 Q4[2,3] 답 기록",
      text: "창이 Q4 의 구간 [2,3] 과 같아졌습니다. out[4] = 2 를 적습니다.",
      array: [1, 1, 2, 1, 3],
      range: [2, 3],
      read: [],
      write: [],
      pointers: {
        curL: 2,
        curR: 3,
      },
      pieces: [
        {
          label: "Q4",
          from: 2,
          to: 3,
          tone: "right",
          text: "[2,3]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, null, 2, 2],
          write: [4],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 1],
          [2, 1],
          [3, 0],
        ],
        slots: 3,
        read: [],
        write: [],
      },
      calc: null,
      vars: "distinct = 2",
    },
    {
      title: "T15 R+ add(3)",
      text: "Q2[2,4] 에 맞추려고 창을 오른쪽으로 넓힙니다. arr[4] = 3 을 넣고, count[3] 이 0 → 1 이라 distinct 가 3 이 됩니다.",
      array: [1, 1, 2, 1, 3],
      range: [2, 4],
      read: [4],
      write: [],
      pointers: {
        curL: 2,
        curR: 4,
      },
      pieces: [
        {
          label: "Q2",
          from: 2,
          to: 4,
          tone: "right",
          text: "[2,4]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, null, 2, 2],
          write: [],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 1],
          [2, 1],
          [3, 1],
        ],
        slots: 3,
        read: [],
        write: [3],
      },
      calc: {
        expr: "count[3] 0 → 1",
        result: "distinct 3",
      },
      vars: "distinct = 3",
    },
    {
      title: "T16 Q2[2,4] 답 기록",
      text: "창이 Q2 의 구간 [2,4] 와 같아졌습니다. out[2] = 3 을 적습니다.",
      array: [1, 1, 2, 1, 3],
      range: [2, 4],
      read: [],
      write: [],
      pointers: {
        curL: 2,
        curR: 4,
      },
      pieces: [
        {
          label: "Q2",
          from: 2,
          to: 4,
          tone: "right",
          text: "[2,4]",
        },
      ],
      layers: [
        {
          name: "out",
          values: [3, 2, 3, 2, 2],
          write: [2],
        },
      ],
      map: {
        keyLabel: "값 v",
        valueLabel: "count[v]",
        entries: [
          [1, 1],
          [2, 1],
          [3, 1],
        ],
        slots: 3,
        read: [],
        write: [],
      },
      calc: null,
      vars: "distinct = 3",
    },
  ],
} satisfies ArrayPlayerSpec;
