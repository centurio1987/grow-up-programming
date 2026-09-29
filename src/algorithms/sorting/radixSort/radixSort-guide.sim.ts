import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [513, 45, 258, 2, 66, 90, 301]`. 걸음은
 * T1~T22 전부다 — 최댓값 · (바퀴마다) 세기 · 누적합 · 놓기 일곱 번 · 맞바꾸기 · 반환.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 무대의 값 줄은 그 바퀴가 읽는 `src` 이고, 바퀴가 바뀌면 통째로
 * 바뀌므로 `array` 를 걸음마다 싣는다. `layers` 가 `src` 칸마다의 자리 값 줄과 이번 바퀴가 채우는
 * `dst` 줄이고, `map` 이 `count` 다 — `count` 는 256 칸이라 그 바퀴에 나온 자리 값의 칸만 키로 싣고,
 * 나머지 칸이 0 이라는 것은 곁말에 적는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `radixSort-guide.test.ts` 가 잰다.
 */

export const walk7 = {
  player: "stage",
  stage: "array",
  arrayName: "src",
  rangeLabel: "읽는 쪽",
  title: "radixSort([513, 45, 258, 2, 66, 90, 301])",
  result: "[2, 45, 66, 90, 258, 301, 513]",
  steps: [
    {
      title: "T1 최댓값 513 — 바퀴 2 번",
      text: "src 의 7 칸을 한 번씩 읽어 최댓값 513 을 찾습니다. 513 이 256 진법으로 2 자리라 바퀴가 2 번입니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 수 2",
      read: [0, 1, 2, 3, 4, 5, 6],
      write: [],
      layers: [
        {
          name: "자리 값",
          values: [null, null, null, null, null, null, null],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [],
        slots: 5,
        note: "아직 없음",
      },
      calc: {
        expr: "max",
        result: "513",
      },
      vars: null,
    },
    {
      title: "T2 바퀴 1 — 자리 0 의 값을 센다",
      text: "⌊513 / 1⌋ > 0 이 참이라 바퀴를 시작합니다. 자리 값은 ⌊x / 1⌋ mod 256 이고, 값 7 개의 자리 0 이 1 45 2 2 66 90 45 입니다. 자리 값마다 개수를 count 에 적습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [0, 1, 2, 3, 4, 5, 6],
      write: [],
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          write: [0, 1, 2, 3, 4, 5, 6],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 2],
          [45, 2],
          [66, 1],
          [90, 1],
        ],
        slots: 5,
        write: [1, 2, 45, 66, 90],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "개수",
        result: "1 2 2 1 1",
      },
      vars: null,
    },
    {
      title: "T3 바퀴 1 — 누적합으로 통의 끝을 정한다",
      text: "count 를 왼쪽부터 누적합으로 덮습니다. count[d] 가 자리 값이 d 이하인 원소의 개수가 되고, 자리 값 d 의 통은 dst 의 칸 count[d] − 1 에서 끝납니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [],
      write: [],
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 3],
          [45, 5],
          [66, 6],
          [90, 7],
        ],
        slots: 5,
        write: [2, 45, 66, 90],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "누적합",
        result: "1 3 5 6 7",
      },
      vars: null,
    },
    {
      title: "T4 바퀴 1 — i=6 값 301 을 칸 4 에",
      text: "src[6] = 301 의 자리 0 이 45 입니다. count[45] 를 5 에서 4 로 줄이고 dst 의 칸 4 에 301 을 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [6],
      write: [],
      pointers: {
        i: 6,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [6],
        },
        {
          name: "dst",
          values: [null, null, null, null, 301, null, null],
          write: [4],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 3],
          [45, 4],
          [66, 6],
          [90, 7],
        ],
        slots: 5,
        read: [45],
        write: [45],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[45] − 1",
        result: "4",
      },
      vars: null,
    },
    {
      title: "T5 바퀴 1 — i=5 값 90 을 칸 6 에",
      text: "src[5] = 90 의 자리 0 이 90 입니다. count[90] 을 7 에서 6 으로 줄이고 dst 의 칸 6 에 90 을 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [5],
        },
        {
          name: "dst",
          values: [null, null, null, null, 301, null, 90],
          write: [6],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 3],
          [45, 4],
          [66, 6],
          [90, 6],
        ],
        slots: 5,
        read: [90],
        write: [90],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[90] − 1",
        result: "6",
      },
      vars: null,
    },
    {
      title: "T6 바퀴 1 — i=4 값 66 을 칸 5 에",
      text: "src[4] = 66 의 자리 0 이 66 입니다. count[66] 을 6 에서 5 로 줄이고 dst 의 칸 5 에 66 을 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [4],
        },
        {
          name: "dst",
          values: [null, null, null, null, 301, 66, 90],
          write: [5],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 3],
          [45, 4],
          [66, 5],
          [90, 6],
        ],
        slots: 5,
        read: [66],
        write: [66],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[66] − 1",
        result: "5",
      },
      vars: null,
    },
    {
      title: "T7 바퀴 1 — i=3 값 2 를 칸 2 에",
      text: "src[3] = 2 의 자리 0 이 2 입니다. count[2] 를 3 에서 2 로 줄이고 dst 의 칸 2 에 2 를 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [3],
        },
        {
          name: "dst",
          values: [null, null, 2, null, 301, 66, 90],
          write: [2],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 2],
          [45, 4],
          [66, 5],
          [90, 6],
        ],
        slots: 5,
        read: [2],
        write: [2],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[2] − 1",
        result: "2",
      },
      vars: null,
    },
    {
      title: "T8 바퀴 1 — i=2 값 258 을 칸 1 에",
      text: "src[2] = 258 의 자리 0 이 2 입니다. count[2] 를 2 에서 1 로 줄이고 dst 의 칸 1 에 258 을 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [2],
        },
        {
          name: "dst",
          values: [null, 258, 2, null, 301, 66, 90],
          write: [1],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 1],
          [45, 4],
          [66, 5],
          [90, 6],
        ],
        slots: 5,
        read: [2],
        write: [2],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[2] − 1",
        result: "1",
      },
      vars: null,
    },
    {
      title: "T9 바퀴 1 — i=1 값 45 를 칸 3 에",
      text: "src[1] = 45 의 자리 0 이 45 입니다. count[45] 를 4 에서 3 으로 줄이고 dst 의 칸 3 에 45 를 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [1],
        },
        {
          name: "dst",
          values: [null, 258, 2, 45, 301, 66, 90],
          write: [3],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 1],
          [2, 1],
          [45, 3],
          [66, 5],
          [90, 6],
        ],
        slots: 5,
        read: [45],
        write: [45],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[45] − 1",
        result: "3",
      },
      vars: null,
    },
    {
      title: "T10 바퀴 1 — i=0 값 513 을 칸 0 에",
      text: "src[0] = 513 의 자리 0 이 1 입니다. count[1] 을 1 에서 0 으로 줄이고 dst 의 칸 0 에 513 을 놓습니다.",
      array: [513, 45, 258, 2, 66, 90, 301],
      range: [0, 6],
      rangeSide: "바퀴 1 · place = 1",
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      layers: [
        {
          name: "자리 0",
          values: [1, 45, 2, 2, 66, 90, 45],
          read: [0],
        },
        {
          name: "dst",
          values: [513, 258, 2, 45, 301, 66, 90],
          write: [0],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 0],
          [2, 1],
          [45, 3],
          [66, 5],
          [90, 6],
        ],
        slots: 5,
        read: [1],
        write: [1],
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "count[1] − 1",
        result: "0",
      },
      vars: null,
    },
    {
      title: "T11 바퀴 1 끝 — src 와 dst 를 맞바꾼다",
      text: "dst 가 [513 258 2 45 301 66 90] 으로 찼고, 자리 0 기준 오름차순입니다. 두 배열의 역할을 맞바꿔 다음 바퀴가 이 배열을 읽습니다. place 는 256 이 됩니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 1 끝",
      read: [],
      write: [0, 1, 2, 3, 4, 5, 6],
      layers: [
        {
          name: "자리 0",
          values: [1, 2, 2, 45, 45, 66, 90],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [1, 0],
          [2, 1],
          [45, 3],
          [66, 5],
          [90, 6],
        ],
        slots: 5,
        note: "나머지 251 칸은 0",
      },
      calc: {
        expr: "[src, dst] = [dst, src]",
        result: "맞바꿈",
      },
      vars: null,
    },
    {
      title: "T12 바퀴 2 — 자리 1 의 값을 센다",
      text: "⌊513 / 256⌋ > 0 이 참이라 바퀴를 시작합니다. 자리 값은 ⌊x / 256⌋ mod 256 이고, 값 7 개의 자리 1 이 2 1 0 0 1 0 0 입니다. 자리 값마다 개수를 count 에 적습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [0, 1, 2, 3, 4, 5, 6],
      write: [],
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          write: [0, 1, 2, 3, 4, 5, 6],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 4],
          [1, 2],
          [2, 1],
        ],
        slots: 5,
        write: [0, 1, 2],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "개수",
        result: "4 2 1",
      },
      vars: null,
    },
    {
      title: "T13 바퀴 2 — 누적합으로 통의 끝을 정한다",
      text: "count 를 왼쪽부터 누적합으로 덮습니다. count[d] 가 자리 값이 d 이하인 원소의 개수가 되고, 자리 값 d 의 통은 dst 의 칸 count[d] − 1 에서 끝납니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [],
      write: [],
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 4],
          [1, 6],
          [2, 7],
        ],
        slots: 5,
        write: [1, 2],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "누적합",
        result: "4 6 7",
      },
      vars: null,
    },
    {
      title: "T14 바퀴 2 — i=6 값 90 을 칸 3 에",
      text: "src[6] = 90 의 자리 1 이 0 입니다. count[0] 을 4 에서 3 으로 줄이고 dst 의 칸 3 에 90 을 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [6],
      write: [],
      pointers: {
        i: 6,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [6],
        },
        {
          name: "dst",
          values: [null, null, null, 90, null, null, null],
          write: [3],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 3],
          [1, 6],
          [2, 7],
        ],
        slots: 5,
        read: [0],
        write: [0],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[0] − 1",
        result: "3",
      },
      vars: null,
    },
    {
      title: "T15 바퀴 2 — i=5 값 66 을 칸 2 에",
      text: "src[5] = 66 의 자리 1 이 0 입니다. count[0] 을 3 에서 2 로 줄이고 dst 의 칸 2 에 66 을 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [5],
        },
        {
          name: "dst",
          values: [null, null, 66, 90, null, null, null],
          write: [2],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 2],
          [1, 6],
          [2, 7],
        ],
        slots: 5,
        read: [0],
        write: [0],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[0] − 1",
        result: "2",
      },
      vars: null,
    },
    {
      title: "T16 바퀴 2 — i=4 값 301 을 칸 5 에",
      text: "src[4] = 301 의 자리 1 이 1 입니다. count[1] 을 6 에서 5 로 줄이고 dst 의 칸 5 에 301 을 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [4],
        },
        {
          name: "dst",
          values: [null, null, 66, 90, null, 301, null],
          write: [5],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 2],
          [1, 5],
          [2, 7],
        ],
        slots: 5,
        read: [1],
        write: [1],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[1] − 1",
        result: "5",
      },
      vars: null,
    },
    {
      title: "T17 바퀴 2 — i=3 값 45 를 칸 1 에",
      text: "src[3] = 45 의 자리 1 이 0 입니다. count[0] 을 2 에서 1 로 줄이고 dst 의 칸 1 에 45 를 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [3],
        },
        {
          name: "dst",
          values: [null, 45, 66, 90, null, 301, null],
          write: [1],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 1],
          [1, 5],
          [2, 7],
        ],
        slots: 5,
        read: [0],
        write: [0],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[0] − 1",
        result: "1",
      },
      vars: null,
    },
    {
      title: "T18 바퀴 2 — i=2 값 2 를 칸 0 에",
      text: "src[2] = 2 의 자리 1 이 0 입니다. count[0] 을 1 에서 0 으로 줄이고 dst 의 칸 0 에 2 를 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [2],
        },
        {
          name: "dst",
          values: [2, 45, 66, 90, null, 301, null],
          write: [0],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 0],
          [1, 5],
          [2, 7],
        ],
        slots: 5,
        read: [0],
        write: [0],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[0] − 1",
        result: "0",
      },
      vars: null,
    },
    {
      title: "T19 바퀴 2 — i=1 값 258 을 칸 4 에",
      text: "src[1] = 258 의 자리 1 이 1 입니다. count[1] 을 5 에서 4 로 줄이고 dst 의 칸 4 에 258 을 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [1],
        },
        {
          name: "dst",
          values: [2, 45, 66, 90, 258, 301, null],
          write: [4],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 0],
          [1, 4],
          [2, 7],
        ],
        slots: 5,
        read: [1],
        write: [1],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[1] − 1",
        result: "4",
      },
      vars: null,
    },
    {
      title: "T20 바퀴 2 — i=0 값 513 을 칸 6 에",
      text: "src[0] = 513 의 자리 1 이 2 입니다. count[2] 를 7 에서 6 으로 줄이고 dst 의 칸 6 에 513 을 놓습니다.",
      array: [513, 258, 2, 45, 301, 66, 90],
      range: [0, 6],
      rangeSide: "바퀴 2 · place = 256",
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      layers: [
        {
          name: "자리 1",
          values: [2, 1, 0, 0, 1, 0, 0],
          read: [0],
        },
        {
          name: "dst",
          values: [2, 45, 66, 90, 258, 301, 513],
          write: [6],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 0],
          [1, 4],
          [2, 6],
        ],
        slots: 5,
        read: [2],
        write: [2],
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "count[2] − 1",
        result: "6",
      },
      vars: null,
    },
    {
      title: "T21 바퀴 2 끝 — src 와 dst 를 맞바꾼다",
      text: "dst 가 [2 45 66 90 258 301 513] 으로 찼고, 자리 1 기준 오름차순입니다. 두 배열의 역할을 맞바꿔 방금 쓴 배열이 반환할 쪽이 됩니다. place 는 65,536 이 됩니다.",
      array: [2, 45, 66, 90, 258, 301, 513],
      range: [0, 6],
      rangeSide: "바퀴 2 끝",
      read: [],
      write: [0, 1, 2, 3, 4, 5, 6],
      layers: [
        {
          name: "자리 1",
          values: [0, 0, 0, 0, 1, 1, 2],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [
          [0, 0],
          [1, 4],
          [2, 6],
        ],
        slots: 5,
        note: "나머지 253 칸은 0",
      },
      calc: {
        expr: "[src, dst] = [dst, src]",
        result: "맞바꿈",
      },
      vars: null,
    },
    {
      title: "T22 반환 — 바퀴가 끝났다",
      text: "place = 65,536 에서 ⌊513 / 65,536⌋ = 0 이라 반복이 끝납니다. src 가 [2 45 66 90 258 301 513] 이고, 입력 A 는 [513 45 258 2 66 90 301] 그대로입니다.",
      array: [2, 45, 66, 90, 258, 301, 513],
      range: [0, 6],
      rangeSide: "반환",
      read: [],
      write: [],
      layers: [
        {
          name: "자리 값",
          values: [null, null, null, null, null, null, null],
        },
        {
          name: "dst",
          values: [null, null, null, null, null, null, null],
        },
      ],
      map: {
        keyLabel: "자리 값",
        valueLabel: "count",
        entries: [],
        slots: 5,
        note: "없음",
      },
      calc: {
        expr: "⌊513 / 65,536⌋ > 0",
        result: "거짓",
      },
      vars: null,
    },
  ],
} satisfies ArrayPlayerSpec;
