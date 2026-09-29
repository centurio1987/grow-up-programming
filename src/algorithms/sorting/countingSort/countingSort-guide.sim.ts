import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [3, 1, 3, 0, 5, 1, 3]`. 걸음은
 * T1~T16 전부다 — ① 칸 만들기 · ② 일곱 번 세기 · ③④ 칸 0 … 5 읽어 이어 쓰기 · 칸 6 … 1000 · 반환.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 무대의 값 줄은 입력 `A` 이고, `layers` 가 결과 `out` 줄,
 * `map` 이 `count` 다 — `count` 는 1,001 칸이라 입력의 최댓값까지(칸 0 … 5)만 싣고, 나머지 칸이 0 이라는
 * 것은 곁말에 적는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행과 대조한 기록에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `countingSort-guide.test.ts` 가 잰다.
 */

export const walk7 = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "입력",
  title: "countingSort([3, 1, 3, 0, 5, 1, 3])",
  result: "[0, 1, 1, 3, 3, 3, 5]",
  steps: [
    {
      title: "T1 ① count 1,001 칸을 0 으로",
      text: "값의 종류가 1,001 가지라 count 를 1,001 칸으로 만들고 전부 0 으로 채웁니다. 입력은 아직 한 칸도 읽지 않았습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 0 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
          [4, 0],
          [5, 0],
        ],
        slots: 6,
        write: [0, 1, 2, 3, 4, 5],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "new Array(1001).fill(0)",
        result: "합 0",
      },
      vars: null,
    },
    {
      title: "T2 ② i=0 — 값 3 을 센다",
      text: "A[0] = 3 이므로 칸 3 의 개수를 0 에서 1 로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 1 / 7",
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 1],
          [4, 0],
          [5, 0],
        ],
        slots: 6,
        write: [3],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[3] + 1",
        result: "1",
      },
      vars: "합 1",
    },
    {
      title: "T3 ② i=1 — 값 1 을 센다",
      text: "A[1] = 1 이므로 칸 1 의 개수를 0 에서 1 로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 2 / 7",
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 0],
          [1, 1],
          [2, 0],
          [3, 1],
          [4, 0],
          [5, 0],
        ],
        slots: 6,
        write: [1],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[1] + 1",
        result: "1",
      },
      vars: "합 2",
    },
    {
      title: "T4 ② i=2 — 값 3 을 센다",
      text: "A[2] = 3 이므로 칸 3 의 개수를 1 에서 2 로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 3 / 7",
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 0],
          [1, 1],
          [2, 0],
          [3, 2],
          [4, 0],
          [5, 0],
        ],
        slots: 6,
        write: [3],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[3] + 1",
        result: "2",
      },
      vars: "합 3",
    },
    {
      title: "T5 ② i=3 — 값 0 을 센다",
      text: "A[3] = 0 이므로 칸 0 의 개수를 0 에서 1 로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 4 / 7",
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 1],
          [2, 0],
          [3, 2],
          [4, 0],
          [5, 0],
        ],
        slots: 6,
        write: [0],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[0] + 1",
        result: "1",
      },
      vars: "합 4",
    },
    {
      title: "T6 ② i=4 — 값 5 를 센다",
      text: "A[4] = 5 이므로 칸 5 의 개수를 0 에서 1 로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 5 / 7",
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 1],
          [2, 0],
          [3, 2],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        write: [5],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[5] + 1",
        result: "1",
      },
      vars: "합 5",
    },
    {
      title: "T7 ② i=5 — 값 1 을 센다",
      text: "A[5] = 1 이므로 칸 1 의 개수를 1 에서 2 로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 6 / 7",
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 2],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        write: [1],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[1] + 1",
        result: "2",
      },
      vars: "합 6",
    },
    {
      title: "T8 ② i=6 — 값 3 을 센다",
      text: "A[6] = 3 이므로 칸 3 의 개수를 2 에서 3 으로 올립니다. 다른 값과 비교하지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [6],
      write: [],
      pointers: {
        i: 6,
      },
      layers: [
        {
          name: "out",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        write: [3],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[3] + 1",
        result: "3",
      },
      vars: "합 7",
    },
    {
      title: "T9 ③ v=0 — ④ 1 번",
      text: "count[0] = 1 이라 ④ 가 1 번 실행되어 out 에 0 을 1 번 이어 씁니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, null, null, null, null, null, null],
          write: [0],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        read: [0],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[0]",
        result: "1 번",
      },
      vars: "out 1 칸",
    },
    {
      title: "T10 ③ v=1 — ④ 2 번",
      text: "count[1] = 2 라 ④ 가 2 번 실행되어 out 에 1 을 2 번 이어 씁니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, null, null, null, null],
          write: [1, 2],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        read: [1],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[1]",
        result: "2 번",
      },
      vars: "out 3 칸",
    },
    {
      title: "T11 ③ v=2 — ④ 없음",
      text: "count[2] = 0 이라 t > 0 이 처음부터 거짓입니다. out 에 아무것도 쓰지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, null, null, null, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        read: [2],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[2]",
        result: "0 번",
      },
      vars: "out 3 칸",
    },
    {
      title: "T12 ③ v=3 — ④ 3 번",
      text: "count[3] = 3 이라 ④ 가 3 번 실행되어 out 에 3 을 3 번 이어 씁니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, 3, 3, 3, null],
          write: [3, 4, 5],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        read: [3],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[3]",
        result: "3 번",
      },
      vars: "out 6 칸",
    },
    {
      title: "T13 ③ v=4 — ④ 없음",
      text: "count[4] = 0 이라 t > 0 이 처음부터 거짓입니다. out 에 아무것도 쓰지 않습니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, 3, 3, 3, null],
          write: [],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        read: [4],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[4]",
        result: "0 번",
      },
      vars: "out 6 칸",
    },
    {
      title: "T14 ③ v=5 — ④ 1 번",
      text: "count[5] = 1 이라 ④ 가 1 번 실행되어 out 에 5 를 1 번 이어 씁니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, 3, 3, 3, 5],
          write: [6],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        read: [5],
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "count[5]",
        result: "1 번",
      },
      vars: "out 7 칸",
    },
    {
      title: "T15 ③ v=6 … 1000 — ④ 없음",
      text: "남은 칸 995 개는 모두 0 이라 ③ 은 실행되지만 ④ 는 한 번도 실행되지 않습니다. v = 1001 에서 v < K 가 거짓이 되어 반복이 끝납니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, 3, 3, 3, 5],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        note: "칸 6 … 1000 은 0 — ④ 0 번",
      },
      calc: {
        expr: "count[6..1000]",
        result: "모두 0",
      },
      vars: "out 7 칸",
    },
    {
      title: "T16 반환",
      text: "out = [0 1 1 3 3 3 5] 을 돌려줍니다. 입력 A 는 [3 1 3 0 5 1 3] 그대로입니다.",
      array: [3, 1, 3, 0, 5, 1, 3],
      range: [0, 6],
      rangeSide: "읽음 7 / 7",
      read: [],
      write: [],
      layers: [
        {
          name: "out",
          values: [0, 1, 1, 3, 3, 3, 5],
        },
      ],
      map: {
        keyLabel: "칸 v",
        valueLabel: "count[v]",
        entries: [
          [0, 1],
          [1, 2],
          [2, 0],
          [3, 3],
          [4, 0],
          [5, 1],
        ],
        slots: 6,
        note: "칸 6 … 1000 은 0",
      },
      calc: {
        expr: "return out",
        result: "[0 1 1 3 3 3 5]",
      },
      vars: "out 7 칸",
    },
  ],
} satisfies ArrayPlayerSpec;
