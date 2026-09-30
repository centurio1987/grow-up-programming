import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [4, 1, 5, 2, 6, 3]` 이고 답이 6 이다.
 * 준비 한 걸음(T1), 앞 합치기 넷(T2~T5 — 합치기 하나가 한 걸음), 마지막 합치기의 비교 다섯(T6~T10 — 비교
 * 하나가 한 걸음), 남은 값을 옮겨 제자리에 적는 걸음(T11)이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 무대의 값 줄은 정본의 사본 `a` 이고, 합치는 도중인 걸음(T6~T10)에서는 정본이
 * `buffer` 에만 적으므로 `a` 가 그대로다. `range` 가 합치는 조각, `pieces` 가 왼쪽 조각 `[lo,mid]` 와 오른쪽 조각
 * `[mid+1,hi]`(합치는 도중에는 괄호 안에 `i` · `j`), `read` 가 비교한 두 칸이다. `layers` 의 `buffer` 줄은 **지금
 * 합치기가 적은 칸만** 싣는다 — 앞 합치기가 남긴 값은 다음 합치기가 덮어쓰므로 그리면 읽는 사람이 헷갈린다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다 적게 세면
 * 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의 `simStepsFromRef()`(정본과 대조한 기록에서 만든 걸음)를
 * 글자 그대로 옮긴 것이고, 둘이 같은지는 `countInversions-guide.test.ts` 가 잰다.
 */

export const invWalk = {
  player: "stage",
  stage: "array",
  arrayName: "a",
  rangeLabel: "합치는 조각",
  title: "countInversions([4, 1, 5, 2, 6, 3])",
  result: "6",
  steps: [
    {
      title: "T1 사본과 버퍼 잡기",
      text: "칸이 6 개라 N <= 1 이 거짓입니다. 입력의 사본 a 와 칸 6 개짜리 buffer 를 한 번 잡습니다. 누적 개수는 0 입니다.",
      array: [4, 1, 5, 2, 6, 3],
      range: [0, 5],
      read: [],
      write: [0, 1, 2, 3, 4, 5],
      pieces: [],
      layers: [
        {
          name: "buffer",
          values: [null, null, null, null, null, null],
          write: [],
        },
      ],
      calc: {
        expr: "6 <= 1",
        result: "거짓",
      },
      vars: "누적 0",
    },
    {
      title: "T2 조각 [0,1] 합치기",
      text: "[4] 와 [1] 을 합칩니다. 4 <= 1 거짓 → 오른쪽 1, mid − i + 1 = 0 − 0 + 1 = 1. 왼쪽에 남은 4 를 그대로 옮기고 제자리에 적으면 [1 4] 입니다. 이 합치기가 센 개수는 1 이고 누적은 1 입니다.",
      array: [1, 4, 5, 2, 6, 3],
      range: [0, 1],
      read: [],
      write: [0, 1],
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
          to: 1,
          tone: "right",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [1, 4, null, null, null, null],
          write: [],
        },
      ],
      calc: {
        expr: "0 − 0 + 1",
        result: "+1",
      },
      vars: "누적 1",
    },
    {
      title: "T3 조각 [0,2] 합치기",
      text: "[1 4] 와 [5] 를 합칩니다. 1 <= 5 참 → 왼쪽 1, 4 <= 5 참 → 왼쪽 4. 오른쪽에 남은 5 를 그대로 옮기고 제자리에 적으면 [1 4 5] 입니다. 이 합치기가 센 개수는 0 이고 누적은 1 입니다.",
      array: [1, 4, 5, 2, 6, 3],
      range: [0, 2],
      read: [],
      write: [0, 1, 2],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
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
      layers: [
        {
          name: "buffer",
          values: [1, 4, 5, null, null, null],
          write: [],
        },
      ],
      calc: {
        expr: "오른쪽을 꺼낸 적 없음",
        result: "+0",
      },
      vars: "누적 1",
    },
    {
      title: "T4 조각 [3,4] 합치기",
      text: "[2] 와 [6] 을 합칩니다. 2 <= 6 참 → 왼쪽 2. 오른쪽에 남은 6 을 그대로 옮기고 제자리에 적으면 [2 6] 입니다. 이 합치기가 센 개수는 0 이고 누적은 1 입니다.",
      array: [1, 4, 5, 2, 6, 3],
      range: [3, 4],
      read: [],
      write: [3, 4],
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
          to: 4,
          tone: "right",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [null, null, null, 2, 6, null],
          write: [],
        },
      ],
      calc: {
        expr: "오른쪽을 꺼낸 적 없음",
        result: "+0",
      },
      vars: "누적 1",
    },
    {
      title: "T5 조각 [3,5] 합치기",
      text: "[2 6] 과 [3] 을 합칩니다. 2 <= 3 참 → 왼쪽 2, 6 <= 3 거짓 → 오른쪽 3, mid − i + 1 = 4 − 4 + 1 = 1. 왼쪽에 남은 6 을 그대로 옮기고 제자리에 적으면 [2 3 6] 입니다. 이 합치기가 센 개수는 1 이고 누적은 2 입니다.",
      array: [1, 4, 5, 2, 3, 6],
      range: [3, 5],
      read: [],
      write: [3, 4, 5],
      pieces: [
        {
          label: "왼쪽",
          from: 3,
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
      layers: [
        {
          name: "buffer",
          values: [null, null, null, 2, 3, 6],
          write: [],
        },
      ],
      calc: {
        expr: "4 − 4 + 1",
        result: "+1",
      },
      vars: "누적 2",
    },
    {
      title: "T6 1 <= 2 왼쪽",
      text: "a[0] = 1 과 a[3] = 2 를 비교합니다. 1 <= 2 가 참이라 왼쪽 1 을 buffer[0] 에 적습니다. 더하는 개수는 없고 누적은 2 입니다.",
      array: [1, 4, 5, 2, 3, 6],
      range: [0, 5],
      read: [0, 3],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
          text: "i = 0",
        },
        {
          label: "오른쪽",
          from: 3,
          to: 5,
          tone: "right",
          text: "j = 3",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [1, null, null, null, null, null],
          write: [0],
        },
      ],
      calc: {
        expr: "1 <= 2",
        result: "참",
      },
      vars: "누적 2",
    },
    {
      title: "T7 4 <= 2 오른쪽 +2",
      text: "a[1] = 4 와 a[3] = 2 를 비교합니다. 4 <= 2 가 거짓이라 오른쪽 2 를 buffer[1] 에 적고, 왼쪽에 남은 mid − i + 1 = 2 − 1 + 1 = 2 개를 한 번에 더합니다. 누적은 4 입니다.",
      array: [1, 4, 5, 2, 3, 6],
      range: [0, 5],
      read: [1, 3],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
          text: "i = 1",
        },
        {
          label: "오른쪽",
          from: 3,
          to: 5,
          tone: "right",
          text: "j = 3",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [1, 2, null, null, null, null],
          write: [1],
        },
      ],
      calc: {
        expr: "4 <= 2 거짓 · 2 − 1 + 1",
        result: "+2",
      },
      vars: "누적 4",
    },
    {
      title: "T8 4 <= 3 오른쪽 +2",
      text: "a[1] = 4 와 a[4] = 3 을 비교합니다. 4 <= 3 이 거짓이라 오른쪽 3 을 buffer[2] 에 적고, 왼쪽에 남은 mid − i + 1 = 2 − 1 + 1 = 2 개를 한 번에 더합니다. 누적은 6 입니다.",
      array: [1, 4, 5, 2, 3, 6],
      range: [0, 5],
      read: [1, 4],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
          text: "i = 1",
        },
        {
          label: "오른쪽",
          from: 3,
          to: 5,
          tone: "right",
          text: "j = 4",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [1, 2, 3, null, null, null],
          write: [2],
        },
      ],
      calc: {
        expr: "4 <= 3 거짓 · 2 − 1 + 1",
        result: "+2",
      },
      vars: "누적 6",
    },
    {
      title: "T9 4 <= 6 왼쪽",
      text: "a[1] = 4 와 a[5] = 6 을 비교합니다. 4 <= 6 이 참이라 왼쪽 4 를 buffer[3] 에 적습니다. 더하는 개수는 없고 누적은 6 입니다.",
      array: [1, 4, 5, 2, 3, 6],
      range: [0, 5],
      read: [1, 5],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
          text: "i = 1",
        },
        {
          label: "오른쪽",
          from: 3,
          to: 5,
          tone: "right",
          text: "j = 5",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [1, 2, 3, 4, null, null],
          write: [3],
        },
      ],
      calc: {
        expr: "4 <= 6",
        result: "참",
      },
      vars: "누적 6",
    },
    {
      title: "T10 5 <= 6 왼쪽",
      text: "a[2] = 5 와 a[5] = 6 을 비교합니다. 5 <= 6 이 참이라 왼쪽 5 를 buffer[4] 에 적습니다. 더하는 개수는 없고 누적은 6 입니다.",
      array: [1, 4, 5, 2, 3, 6],
      range: [0, 5],
      read: [2, 5],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
          text: "i = 2",
        },
        {
          label: "오른쪽",
          from: 3,
          to: 5,
          tone: "right",
          text: "j = 5",
        },
      ],
      layers: [
        {
          name: "buffer",
          values: [1, 2, 3, 4, 5, null],
          write: [4],
        },
      ],
      calc: {
        expr: "5 <= 6",
        result: "참",
      },
      vars: "누적 6",
    },
    {
      title: "T11 남은 값 옮기고 제자리에 적기",
      text: "왼쪽 조각이 비어 반복이 끝납니다. 오른쪽에 남은 6 을 비교 없이 buffer 에 옮기고, buffer 의 칸 [0,5] 를 a 에 옮겨 적으면 [1 2 3 4 5 6] 입니다. 더 셀 것이 없어 누적 6 이 반환값입니다.",
      array: [1, 2, 3, 4, 5, 6],
      range: [0, 5],
      read: [],
      write: [0, 1, 2, 3, 4, 5],
      pieces: [],
      layers: [
        {
          name: "buffer",
          values: [1, 2, 3, 4, 5, 6],
          write: [5],
        },
      ],
      calc: {
        expr: "더하는 개수",
        result: "+0",
      },
      vars: "누적 6",
    },
  ],
} satisfies ArrayPlayerSpec;
