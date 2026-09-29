import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `nums = [5, 2, 3, 1]`. 걸음은 T1~T13
 * 전부다 — 부름의 시작 · 기준값 옮기기 · 비교 · 기준값 놓기 · 즉시 반환.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 정렬은 값이 걸음마다 바뀌므로 `array` 를 걸음마다 싣는다. `range` 가
 * 지금 부른 구간(빈 구간이면 `null`), `read` 가 이번에 비교한 두 칸(읽는 칸과 기준값 칸), `write` 가 맞바꾼 칸,
 * `pieces` 가 쥔 구간 안의 조각(분할 도중에는 작음 · 큼 두 구역, 기준값을 놓은 뒤에는 왼쪽 · 오른쪽 구간)이다.
 * 무대 아래 `layers` 한 줄 「확정」은 최종 자리가 정해진 칸이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `quicksort-guide.test.ts` 가 잰다.
 */

export const partition = {
  player: "stage",
  stage: "array",
  arrayName: "arr",
  rangeLabel: "부름",
  title: "quickSort([5, 2, 3, 1])",
  result: "[1, 2, 3, 5]",
  steps: [
    {
      title: "T1 sort(0,3) 시작",
      text: "hi - lo = 3 이라 계속합니다. 가운데 칸은 pivotIdx = 0 + ⌊3/2⌋ = 1 이고 그 값은 2 입니다.",
      array: [5, 2, 3, 1],
      range: [0, 3],
      read: [1],
      write: [],
      calc: {
        expr: "0 + ⌊3/2⌋",
        result: "1",
      },
      vars: "비교 누적 0 번",
      layers: [
        {
          name: "확정",
          values: [null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T2 기준값 2 를 끝으로",
      text: "인덱스 1 과 3 을 맞바꿔 기준값 2 를 hi = 3 에 둡니다. i 는 lo = 0 에서 시작합니다.",
      array: [5, 1, 3, 2],
      range: [0, 3],
      read: [],
      write: [1, 3],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "pivot",
        result: "2",
      },
      vars: "비교 누적 0 번",
      layers: [
        {
          name: "확정",
          values: [null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T3 j=0 5 < 2 ②",
      text: "arr[0] = 5 와 기준값 2 를 비교합니다. 5 < 2 가 거짓이라 ② 로 그대로 둡니다. i 는 0 그대로입니다.",
      array: [5, 1, 3, 2],
      range: [0, 3],
      read: [0, 3],
      write: [],
      pieces: [
        {
          label: "큼",
          from: 0,
          to: 0,
          tone: "right",
        },
      ],
      pointers: {
        i: 0,
        j: 0,
      },
      calc: {
        expr: "5 < 2",
        result: "거짓",
      },
      vars: "비교 누적 1 번",
      layers: [
        {
          name: "확정",
          values: [null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T4 j=1 1 < 2 ①",
      text: "arr[1] = 1 과 기준값 2 를 비교합니다. 1 < 2 가 참이라 ① 로 arr[0] 과 arr[1] 을 맞바꾸고 i 를 0 에서 1 로 늘립니다.",
      array: [1, 5, 3, 2],
      range: [0, 3],
      read: [1, 3],
      write: [0, 1],
      pieces: [
        {
          label: "작음",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "큼",
          from: 1,
          to: 1,
          tone: "right",
        },
      ],
      pointers: {
        i: 1,
        j: 1,
      },
      calc: {
        expr: "1 < 2",
        result: "참",
      },
      vars: "비교 누적 2 번",
      layers: [
        {
          name: "확정",
          values: [null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T5 j=2 3 < 2 ②",
      text: "arr[2] = 3 과 기준값 2 를 비교합니다. 3 < 2 가 거짓이라 ② 로 그대로 둡니다. i 는 1 그대로입니다.",
      array: [1, 5, 3, 2],
      range: [0, 3],
      read: [2, 3],
      write: [],
      pieces: [
        {
          label: "작음",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "큼",
          from: 1,
          to: 2,
          tone: "right",
        },
      ],
      pointers: {
        i: 1,
        j: 2,
      },
      calc: {
        expr: "3 < 2",
        result: "거짓",
      },
      vars: "비교 누적 3 번",
      layers: [
        {
          name: "확정",
          values: [null, null, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T6 기준값 2 를 i=1 에",
      text: "루프가 끝났고 i = 1 입니다. arr[1] 과 arr[3] 을 맞바꿔 기준값 2 를 인덱스 1 에 놓습니다. 이 자리가 2 의 최종 자리이고, 남은 일은 sort(0,0) 과 sort(2,3) 입니다.",
      array: [1, 2, 3, 5],
      range: [0, 3],
      read: [],
      write: [1, 3],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "오른쪽",
          from: 2,
          to: 3,
          tone: "right",
        },
      ],
      pointers: {
        i: 1,
      },
      calc: null,
      vars: "비교 누적 3 번",
      layers: [
        {
          name: "확정",
          values: [null, 2, null, null],
          write: [1],
        },
      ],
    },
    {
      title: "T7 sort(0,0) 즉시 반환",
      text: "hi - lo = 0 이 1 보다 작아 즉시 반환합니다. 칸 0 의 값 1 이 그대로 제자리입니다.",
      array: [1, 2, 3, 5],
      range: [0, 0],
      read: [],
      write: [],
      calc: {
        expr: "0 - 0",
        result: "0",
      },
      vars: "비교 누적 3 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, null, null],
          write: [0],
        },
      ],
    },
    {
      title: "T8 sort(2,3) 시작",
      text: "hi - lo = 1 이라 계속합니다. 가운데 칸은 pivotIdx = 2 + ⌊1/2⌋ = 2 이고 그 값은 3 입니다.",
      array: [1, 2, 3, 5],
      range: [2, 3],
      read: [2],
      write: [],
      calc: {
        expr: "2 + ⌊1/2⌋",
        result: "2",
      },
      vars: "비교 누적 3 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T9 기준값 3 을 끝으로",
      text: "인덱스 2 와 3 을 맞바꿔 기준값 3 을 hi = 3 에 둡니다. i 는 lo = 2 에서 시작합니다.",
      array: [1, 2, 5, 3],
      range: [2, 3],
      read: [],
      write: [2, 3],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "pivot",
        result: "3",
      },
      vars: "비교 누적 3 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T10 j=2 5 < 3 ②",
      text: "arr[2] = 5 와 기준값 3 을 비교합니다. 5 < 3 이 거짓이라 ② 로 그대로 둡니다. i 는 2 그대로입니다.",
      array: [1, 2, 5, 3],
      range: [2, 3],
      read: [2, 3],
      write: [],
      pieces: [
        {
          label: "큼",
          from: 2,
          to: 2,
          tone: "right",
        },
      ],
      pointers: {
        i: 2,
        j: 2,
      },
      calc: {
        expr: "5 < 3",
        result: "거짓",
      },
      vars: "비교 누적 4 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, null, null],
          write: [],
        },
      ],
    },
    {
      title: "T11 기준값 3 을 i=2 에",
      text: "루프가 끝났고 i = 2 입니다. arr[2] 와 arr[3] 을 맞바꿔 기준값 3 을 인덱스 2 에 놓습니다. 이 자리가 3 의 최종 자리이고, 남은 일은 sort(2,1) 과 sort(3,3) 입니다.",
      array: [1, 2, 3, 5],
      range: [2, 3],
      read: [],
      write: [2, 3],
      pieces: [
        {
          label: "오른쪽",
          from: 3,
          to: 3,
          tone: "right",
        },
      ],
      pointers: {
        i: 2,
      },
      calc: null,
      vars: "비교 누적 4 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, 3, null],
          write: [2],
        },
      ],
    },
    {
      title: "T12 sort(2,1) 즉시 반환",
      text: "hi - lo = -1 이 1 보다 작아 즉시 반환합니다. 구간이 비어 있습니다.",
      array: [1, 2, 3, 5],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "1 - 2",
        result: "-1",
      },
      vars: "비교 누적 4 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, 3, null],
          write: [],
        },
      ],
    },
    {
      title: "T13 sort(3,3) 즉시 반환",
      text: "hi - lo = 0 이 1 보다 작아 즉시 반환합니다. 칸 3 의 값 5 가 그대로 제자리입니다.",
      array: [1, 2, 3, 5],
      range: [3, 3],
      read: [],
      write: [],
      calc: {
        expr: "3 - 3",
        result: "0",
      },
      vars: "비교 누적 4 번",
      layers: [
        {
          name: "확정",
          values: [1, 2, 3, 5],
          write: [3],
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
