import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [5, 2, 4, 6, 1, 3]`. 걸음은
 * T1~T24 전부다 — 복사 · 키 뽑기 · 비교(참이면 옮기기) · 넣기 · 반환.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 정렬은 값이 걸음마다 바뀌므로 `array` 를 걸음마다 싣는다. `range` 가
 * 이번 바퀴가 다루는 구역 `[0, i]`, `read` 가 이번에 읽은 칸(비교한 칸 · 키를 뽑은 칸), `write` 가 옮겨
 * 적거나 키를 넣은 칸, `pieces` 가 바퀴 도중의 조각(빈 칸 왼쪽의 값 · 키가 들어갈 빈 칸 · 빈 칸 오른쪽으로
 * 옮긴 값)이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `insertionSort-guide.test.ts` 가 잰다.
 */

export const walk6 = {
  player: "stage",
  stage: "array",
  arrayName: "B",
  rangeLabel: "구역",
  title: "insertionSort([5, 2, 4, 6, 1, 3])",
  result: "[1, 2, 3, 4, 5, 6]",
  steps: [
    {
      title: "T1 복사하고 한 칸짜리 구역을 둔다",
      text: "B 는 A 와 값이 같은 새 배열입니다. 칸이 하나뿐인 B[0..0] 은 값 5 하나라 이미 오름차순이고, 이것이 첫 정렬된 구역입니다.",
      array: [5, 2, 4, 6, 1, 3],
      range: [0, 0],
      read: [],
      write: [],
      calc: null,
      vars: "비교 누적 0 번 · 이동 누적 0 번",
    },
    {
      title: "T2 i=1 key = 2 를 뽑는다",
      text: "i = 1 < 6 이라 한 바퀴를 실행합니다. B[1] 의 값 2 를 key 에 담아 두면 그 칸은 덮어써도 되는 빈 칸이 됩니다. j 는 0 에서 시작합니다.",
      array: [5, 2, 4, 6, 1, 3],
      range: [0, 1],
      read: [1],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 1,
          to: 1,
          tone: "right",
          text: "key 2",
        },
      ],
      pointers: {
        i: 1,
        j: 0,
      },
      calc: {
        expr: "key ← B[1]",
        result: "2",
      },
      vars: "비교 누적 0 번 · 이동 누적 0 번",
    },
    {
      title: "T3 j=0 5 > 2 참 ③",
      text: "B[0] = 5 가 key 2 보다 커서 ③ 으로 B[1] 에 옮겨 적습니다. 빈 칸이 인덱스 0 으로 옵니다.",
      array: [5, 5, 4, 6, 1, 3],
      range: [0, 1],
      read: [0],
      write: [1],
      pieces: [
        {
          label: "빈 칸",
          from: 0,
          to: 0,
          tone: "right",
          text: "key 2",
        },
        {
          label: "옮긴 값",
          from: 1,
          to: 1,
          tone: "left",
        },
      ],
      pointers: {
        i: 1,
        j: 0,
      },
      calc: {
        expr: "5 > 2",
        result: "참",
      },
      vars: "비교 누적 1 번 · 이동 누적 1 번",
    },
    {
      title: "T4 B[0] ← 2 ④",
      text: "j = -1 이라 j >= 0 이 거짓이고 반복이 끝났습니다. ④ 로 빈 칸 B[0] 에 key 2 를 넣어 구역이 2 칸이 됩니다.",
      array: [2, 5, 4, 6, 1, 3],
      range: [0, 1],
      read: [],
      write: [0],
      pointers: {
        i: 1,
        j: -1,
      },
      calc: {
        expr: "-1 >= 0",
        result: "거짓",
      },
      vars: "비교 누적 1 번 · 이동 누적 1 번",
    },
    {
      title: "T5 i=2 key = 4 를 뽑는다",
      text: "i = 2 < 6 이라 한 바퀴를 실행합니다. B[2] 의 값 4 를 key 에 담아 두면 그 칸은 덮어써도 되는 빈 칸이 됩니다. j 는 1 에서 시작합니다.",
      array: [2, 5, 4, 6, 1, 3],
      range: [0, 2],
      read: [2],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 1,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 2,
          to: 2,
          tone: "right",
          text: "key 4",
        },
      ],
      pointers: {
        i: 2,
        j: 1,
      },
      calc: {
        expr: "key ← B[2]",
        result: "4",
      },
      vars: "비교 누적 1 번 · 이동 누적 1 번",
    },
    {
      title: "T6 j=1 5 > 4 참 ③",
      text: "B[1] = 5 가 key 4 보다 커서 ③ 으로 B[2] 에 옮겨 적습니다. 빈 칸이 인덱스 1 로 옵니다.",
      array: [2, 5, 5, 6, 1, 3],
      range: [0, 2],
      read: [1],
      write: [2],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 1,
          to: 1,
          tone: "right",
          text: "key 4",
        },
        {
          label: "옮긴 값",
          from: 2,
          to: 2,
          tone: "left",
        },
      ],
      pointers: {
        i: 2,
        j: 1,
      },
      calc: {
        expr: "5 > 4",
        result: "참",
      },
      vars: "비교 누적 2 번 · 이동 누적 2 번",
    },
    {
      title: "T7 j=0 2 > 4 거짓",
      text: "B[0] = 2 가 key 4 보다 크지 않아 반복을 멈춥니다. 빈 칸은 인덱스 1 에 있습니다.",
      array: [2, 5, 5, 6, 1, 3],
      range: [0, 2],
      read: [0],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 1,
          to: 1,
          tone: "right",
          text: "key 4",
        },
        {
          label: "옮긴 값",
          from: 2,
          to: 2,
          tone: "left",
        },
      ],
      pointers: {
        i: 2,
        j: 0,
      },
      calc: {
        expr: "2 > 4",
        result: "거짓",
      },
      vars: "비교 누적 3 번 · 이동 누적 2 번",
    },
    {
      title: "T8 B[1] ← 4 ④",
      text: "④ 로 빈 칸 B[1] 에 key 4 를 넣어 구역이 3 칸이 됩니다.",
      array: [2, 4, 5, 6, 1, 3],
      range: [0, 2],
      read: [],
      write: [1],
      pointers: {
        i: 2,
        j: 0,
      },
      calc: {
        expr: "B[1] ← key",
        result: "4",
      },
      vars: "비교 누적 3 번 · 이동 누적 2 번",
    },
    {
      title: "T9 i=3 key = 6 을 뽑는다",
      text: "i = 3 < 6 이라 한 바퀴를 실행합니다. B[3] 의 값 6 을 key 에 담아 두면 그 칸은 덮어써도 되는 빈 칸이 됩니다. j 는 2 에서 시작합니다.",
      array: [2, 4, 5, 6, 1, 3],
      range: [0, 3],
      read: [3],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 3,
          to: 3,
          tone: "right",
          text: "key 6",
        },
      ],
      pointers: {
        i: 3,
        j: 2,
      },
      calc: {
        expr: "key ← B[3]",
        result: "6",
      },
      vars: "비교 누적 3 번 · 이동 누적 2 번",
    },
    {
      title: "T10 j=2 5 > 6 거짓",
      text: "B[2] = 5 가 key 6 보다 크지 않아 반복을 멈춥니다. 빈 칸은 인덱스 3 에 있습니다.",
      array: [2, 4, 5, 6, 1, 3],
      range: [0, 3],
      read: [2],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 3,
          to: 3,
          tone: "right",
          text: "key 6",
        },
      ],
      pointers: {
        i: 3,
        j: 2,
      },
      calc: {
        expr: "5 > 6",
        result: "거짓",
      },
      vars: "비교 누적 4 번 · 이동 누적 2 번",
    },
    {
      title: "T11 B[3] ← 6 ④",
      text: "④ 로 빈 칸 B[3] 에 key 6 을 넣어 구역이 4 칸이 됩니다.",
      array: [2, 4, 5, 6, 1, 3],
      range: [0, 3],
      read: [],
      write: [3],
      pointers: {
        i: 3,
        j: 2,
      },
      calc: {
        expr: "B[3] ← key",
        result: "6",
      },
      vars: "비교 누적 4 번 · 이동 누적 2 번",
    },
    {
      title: "T12 i=4 key = 1 을 뽑는다",
      text: "i = 4 < 6 이라 한 바퀴를 실행합니다. B[4] 의 값 1 을 key 에 담아 두면 그 칸은 덮어써도 되는 빈 칸이 됩니다. j 는 3 에서 시작합니다.",
      array: [2, 4, 5, 6, 1, 3],
      range: [0, 4],
      read: [4],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 3,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 4,
          to: 4,
          tone: "right",
          text: "key 1",
        },
      ],
      pointers: {
        i: 4,
        j: 3,
      },
      calc: {
        expr: "key ← B[4]",
        result: "1",
      },
      vars: "비교 누적 4 번 · 이동 누적 2 번",
    },
    {
      title: "T13 j=3 6 > 1 참 ③",
      text: "B[3] = 6 이 key 1 보다 커서 ③ 으로 B[4] 에 옮겨 적습니다. 빈 칸이 인덱스 3 으로 옵니다.",
      array: [2, 4, 5, 6, 6, 3],
      range: [0, 4],
      read: [3],
      write: [4],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 3,
          to: 3,
          tone: "right",
          text: "key 1",
        },
        {
          label: "옮긴 값",
          from: 4,
          to: 4,
          tone: "left",
        },
      ],
      pointers: {
        i: 4,
        j: 3,
      },
      calc: {
        expr: "6 > 1",
        result: "참",
      },
      vars: "비교 누적 5 번 · 이동 누적 3 번",
    },
    {
      title: "T14 j=2 5 > 1 참 ③",
      text: "B[2] = 5 가 key 1 보다 커서 ③ 으로 B[3] 에 옮겨 적습니다. 빈 칸이 인덱스 2 로 옵니다.",
      array: [2, 4, 5, 5, 6, 3],
      range: [0, 4],
      read: [2],
      write: [3],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 1,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 2,
          to: 2,
          tone: "right",
          text: "key 1",
        },
        {
          label: "옮긴 값",
          from: 3,
          to: 4,
          tone: "left",
        },
      ],
      pointers: {
        i: 4,
        j: 2,
      },
      calc: {
        expr: "5 > 1",
        result: "참",
      },
      vars: "비교 누적 6 번 · 이동 누적 4 번",
    },
    {
      title: "T15 j=1 4 > 1 참 ③",
      text: "B[1] = 4 가 key 1 보다 커서 ③ 으로 B[2] 에 옮겨 적습니다. 빈 칸이 인덱스 1 로 옵니다.",
      array: [2, 4, 4, 5, 6, 3],
      range: [0, 4],
      read: [1],
      write: [2],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 0,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 1,
          to: 1,
          tone: "right",
          text: "key 1",
        },
        {
          label: "옮긴 값",
          from: 2,
          to: 4,
          tone: "left",
        },
      ],
      pointers: {
        i: 4,
        j: 1,
      },
      calc: {
        expr: "4 > 1",
        result: "참",
      },
      vars: "비교 누적 7 번 · 이동 누적 5 번",
    },
    {
      title: "T16 j=0 2 > 1 참 ③",
      text: "B[0] = 2 가 key 1 보다 커서 ③ 으로 B[1] 에 옮겨 적습니다. 빈 칸이 인덱스 0 으로 옵니다.",
      array: [2, 2, 4, 5, 6, 3],
      range: [0, 4],
      read: [0],
      write: [1],
      pieces: [
        {
          label: "빈 칸",
          from: 0,
          to: 0,
          tone: "right",
          text: "key 1",
        },
        {
          label: "옮긴 값",
          from: 1,
          to: 4,
          tone: "left",
        },
      ],
      pointers: {
        i: 4,
        j: 0,
      },
      calc: {
        expr: "2 > 1",
        result: "참",
      },
      vars: "비교 누적 8 번 · 이동 누적 6 번",
    },
    {
      title: "T17 B[0] ← 1 ④",
      text: "j = -1 이라 j >= 0 이 거짓이고 반복이 끝났습니다. ④ 로 빈 칸 B[0] 에 key 1 을 넣어 구역이 5 칸이 됩니다.",
      array: [1, 2, 4, 5, 6, 3],
      range: [0, 4],
      read: [],
      write: [0],
      pointers: {
        i: 4,
        j: -1,
      },
      calc: {
        expr: "-1 >= 0",
        result: "거짓",
      },
      vars: "비교 누적 8 번 · 이동 누적 6 번",
    },
    {
      title: "T18 i=5 key = 3 을 뽑는다",
      text: "i = 5 < 6 이라 한 바퀴를 실행합니다. B[5] 의 값 3 을 key 에 담아 두면 그 칸은 덮어써도 되는 빈 칸이 됩니다. j 는 4 에서 시작합니다.",
      array: [1, 2, 4, 5, 6, 3],
      range: [0, 5],
      read: [5],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 4,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 5,
          to: 5,
          tone: "right",
          text: "key 3",
        },
      ],
      pointers: {
        i: 5,
        j: 4,
      },
      calc: {
        expr: "key ← B[5]",
        result: "3",
      },
      vars: "비교 누적 8 번 · 이동 누적 6 번",
    },
    {
      title: "T19 j=4 6 > 3 참 ③",
      text: "B[4] = 6 이 key 3 보다 커서 ③ 으로 B[5] 에 옮겨 적습니다. 빈 칸이 인덱스 4 로 옵니다.",
      array: [1, 2, 4, 5, 6, 6],
      range: [0, 5],
      read: [4],
      write: [5],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 3,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 4,
          to: 4,
          tone: "right",
          text: "key 3",
        },
        {
          label: "옮긴 값",
          from: 5,
          to: 5,
          tone: "left",
        },
      ],
      pointers: {
        i: 5,
        j: 4,
      },
      calc: {
        expr: "6 > 3",
        result: "참",
      },
      vars: "비교 누적 9 번 · 이동 누적 7 번",
    },
    {
      title: "T20 j=3 5 > 3 참 ③",
      text: "B[3] = 5 가 key 3 보다 커서 ③ 으로 B[4] 에 옮겨 적습니다. 빈 칸이 인덱스 3 으로 옵니다.",
      array: [1, 2, 4, 5, 5, 6],
      range: [0, 5],
      read: [3],
      write: [4],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 2,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 3,
          to: 3,
          tone: "right",
          text: "key 3",
        },
        {
          label: "옮긴 값",
          from: 4,
          to: 5,
          tone: "left",
        },
      ],
      pointers: {
        i: 5,
        j: 3,
      },
      calc: {
        expr: "5 > 3",
        result: "참",
      },
      vars: "비교 누적 10 번 · 이동 누적 8 번",
    },
    {
      title: "T21 j=2 4 > 3 참 ③",
      text: "B[2] = 4 가 key 3 보다 커서 ③ 으로 B[3] 에 옮겨 적습니다. 빈 칸이 인덱스 2 로 옵니다.",
      array: [1, 2, 4, 4, 5, 6],
      range: [0, 5],
      read: [2],
      write: [3],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 1,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 2,
          to: 2,
          tone: "right",
          text: "key 3",
        },
        {
          label: "옮긴 값",
          from: 3,
          to: 5,
          tone: "left",
        },
      ],
      pointers: {
        i: 5,
        j: 2,
      },
      calc: {
        expr: "4 > 3",
        result: "참",
      },
      vars: "비교 누적 11 번 · 이동 누적 9 번",
    },
    {
      title: "T22 j=1 2 > 3 거짓",
      text: "B[1] = 2 가 key 3 보다 크지 않아 반복을 멈춥니다. 빈 칸은 인덱스 2 에 있습니다.",
      array: [1, 2, 4, 4, 5, 6],
      range: [0, 5],
      read: [1],
      write: [],
      pieces: [
        {
          label: "왼쪽",
          from: 0,
          to: 1,
          tone: "left",
        },
        {
          label: "빈 칸",
          from: 2,
          to: 2,
          tone: "right",
          text: "key 3",
        },
        {
          label: "옮긴 값",
          from: 3,
          to: 5,
          tone: "left",
        },
      ],
      pointers: {
        i: 5,
        j: 1,
      },
      calc: {
        expr: "2 > 3",
        result: "거짓",
      },
      vars: "비교 누적 12 번 · 이동 누적 9 번",
    },
    {
      title: "T23 B[2] ← 3 ④",
      text: "④ 로 빈 칸 B[2] 에 key 3 을 넣어 구역이 6 칸이 됩니다.",
      array: [1, 2, 3, 4, 5, 6],
      range: [0, 5],
      read: [],
      write: [2],
      pointers: {
        i: 5,
        j: 1,
      },
      calc: {
        expr: "B[2] ← key",
        result: "3",
      },
      vars: "비교 누적 12 번 · 이동 누적 9 번",
    },
    {
      title: "T24 B 를 돌려준다",
      text: "i = 6 < 6 이 거짓이라 바깥 반복이 끝났습니다. 구역이 배열 전체이고, 입력 A 는 [5 2 4 6 1 3] 그대로입니다.",
      array: [1, 2, 3, 4, 5, 6],
      range: [0, 5],
      read: [],
      write: [],
      calc: {
        expr: "6 < 6",
        result: "거짓",
      },
      vars: "비교 누적 12 번 · 이동 누적 9 번",
    },
  ],
} satisfies ArrayPlayerSpec;
