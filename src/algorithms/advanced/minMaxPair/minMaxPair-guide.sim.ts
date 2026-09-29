import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [3, 1, 4, 1, 5, 9, 2, 6]`.
 * 비교 한 번이 걸음 하나다 — 시작 비교 T1, 쌍마다 쌍 안 비교 · min 과의 비교 · max 와의 비교 세 걸음,
 * 반복이 끝나는 T11. 이 편이 세는 비용이 비교 횟수라, 걸음을 쌍 단위로 묶으면 비교가 몇 번 일어났는지가
 * 화면에서 사라진다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 지금까지 읽은 칸이고(그 밖은 아직 안 읽은
 * 칸), `read` 는 이번 비교의 두 원소, `pieces` 는 쌍 안 비교가 가른 `lo` · `hi` 의 자리다. 입력 배열
 * 아래에 알고리즘이 쌓는 구조 — 원소마다 아직 최솟값·최댓값일 수 있는가를 적은 두 후보 줄 — 을
 * `layers` 로 쌓고, 이번 비교로 후보에서 빠진 칸이 「새로 씀」이다. 계산 한 줄은 알약(`calc`),
 * 무대에 자리가 없는 min · max · 누적 비교는 `vars` 다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `minMaxPair-guide.test.ts` 가 잰다.
 */

export const pairwalk = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "읽은 칸",
  title: "minMaxPair([3, 1, 4, 1, 5, 9, 2, 6])",
  result: "{ min: 1, max: 9 }",
  steps: [
    {
      title: "T1 시작 · A[0] 과 A[1] ②",
      text: "길이 8 이 짝수라 첫 두 원소를 한 번 비교합니다. A[0] = 3 < A[1] = 1 은 거짓이라 min = 1, max = 3 입니다. A[0] = 3 이 최솟값 후보에서, A[1] = 1 이 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 1],
      read: [0, 1],
      write: [],
      pointers: {},
      calc: {
        expr: "A[0] = 3 < A[1] = 1",
        result: "거짓",
      },
      vars: "min = 1 · max = 3 · 비교 1 번",
      pieces: [],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, 4, 1, 5, 9, 2, 6],
          read: [],
          write: [0],
          side: "남은 후보 7 칸",
        },
        {
          name: "최댓값 후보",
          values: [3, "빠짐", 4, 1, 5, 9, 2, 6],
          read: [],
          write: [1],
          side: "남은 후보 7 칸",
        },
      ],
    },
    {
      title: "T2 쌍 (4, 1) ③",
      text: "A[2] = 4 < A[3] = 1 은 거짓이라 작은 쪽 lo = 1, 큰 쪽 hi = 4 입니다. A[2] = 4 가 최솟값 후보에서, A[3] = 1 이 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 3],
      read: [2, 3],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "A[2] = 4 < A[3] = 1",
        result: "거짓",
      },
      vars: "min = 1 · max = 3 · 비교 2 번",
      pieces: [
        {
          label: "lo",
          from: 3,
          to: 3,
          tone: "left",
          text: "A[3]",
        },
        {
          label: "hi",
          from: 2,
          to: 2,
          tone: "right",
          text: "A[2]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", 1, 5, 9, 2, 6],
          read: [],
          write: [2],
          side: "남은 후보 6 칸",
        },
        {
          name: "최댓값 후보",
          values: [3, "빠짐", 4, "빠짐", 5, 9, 2, 6],
          read: [],
          write: [3],
          side: "남은 후보 6 칸",
        },
      ],
    },
    {
      title: "T3 lo = 1 과 min = 1 ④",
      text: "lo = 1 < min = 1 은 거짓이라 min = 1 그대로입니다. A[3] = 1 이 최솟값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 3],
      read: [1, 3],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "lo = 1 < min = 1",
        result: "거짓",
      },
      vars: "min = 1 · max = 3 · 비교 3 번",
      pieces: [
        {
          label: "lo",
          from: 3,
          to: 3,
          tone: "left",
          text: "A[3]",
        },
        {
          label: "hi",
          from: 2,
          to: 2,
          tone: "right",
          text: "A[2]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", 5, 9, 2, 6],
          read: [],
          write: [3],
          side: "남은 후보 5 칸",
        },
        {
          name: "최댓값 후보",
          values: [3, "빠짐", 4, "빠짐", 5, 9, 2, 6],
          read: [],
          write: [],
          side: "남은 후보 6 칸",
        },
      ],
    },
    {
      title: "T4 hi = 4 와 max = 3 ④",
      text: "hi = 4 > max = 3 은 참이라 max 가 4 로 바뀝니다. A[0] = 3 이 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 3],
      read: [0, 2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "hi = 4 > max = 3",
        result: "참",
      },
      vars: "min = 1 · max = 4 · 비교 4 번",
      pieces: [
        {
          label: "lo",
          from: 3,
          to: 3,
          tone: "left",
          text: "A[3]",
        },
        {
          label: "hi",
          from: 2,
          to: 2,
          tone: "right",
          text: "A[2]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", 5, 9, 2, 6],
          read: [],
          write: [],
          side: "남은 후보 5 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", 4, "빠짐", 5, 9, 2, 6],
          read: [],
          write: [0],
          side: "남은 후보 5 칸",
        },
      ],
    },
    {
      title: "T5 쌍 (5, 9) ③",
      text: "A[4] = 5 < A[5] = 9 는 참이라 작은 쪽 lo = 5, 큰 쪽 hi = 9 입니다. A[5] = 9 가 최솟값 후보에서, A[4] = 5 가 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 5],
      read: [4, 5],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "A[4] = 5 < A[5] = 9",
        result: "참",
      },
      vars: "min = 1 · max = 4 · 비교 5 번",
      pieces: [
        {
          label: "lo",
          from: 4,
          to: 4,
          tone: "left",
          text: "A[4]",
        },
        {
          label: "hi",
          from: 5,
          to: 5,
          tone: "right",
          text: "A[5]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", 5, "빠짐", 2, 6],
          read: [],
          write: [5],
          side: "남은 후보 4 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", 4, "빠짐", "빠짐", 9, 2, 6],
          read: [],
          write: [4],
          side: "남은 후보 4 칸",
        },
      ],
    },
    {
      title: "T6 lo = 5 와 min = 1 ④",
      text: "lo = 5 < min = 1 은 거짓이라 min = 1 그대로입니다. A[4] = 5 가 최솟값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 5],
      read: [1, 4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "lo = 5 < min = 1",
        result: "거짓",
      },
      vars: "min = 1 · max = 4 · 비교 6 번",
      pieces: [
        {
          label: "lo",
          from: 4,
          to: 4,
          tone: "left",
          text: "A[4]",
        },
        {
          label: "hi",
          from: 5,
          to: 5,
          tone: "right",
          text: "A[5]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", "빠짐", "빠짐", 2, 6],
          read: [],
          write: [4],
          side: "남은 후보 3 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", 4, "빠짐", "빠짐", 9, 2, 6],
          read: [],
          write: [],
          side: "남은 후보 4 칸",
        },
      ],
    },
    {
      title: "T7 hi = 9 와 max = 4 ④",
      text: "hi = 9 > max = 4 는 참이라 max 가 9 로 바뀝니다. A[2] = 4 가 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 5],
      read: [2, 5],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "hi = 9 > max = 4",
        result: "참",
      },
      vars: "min = 1 · max = 9 · 비교 7 번",
      pieces: [
        {
          label: "lo",
          from: 4,
          to: 4,
          tone: "left",
          text: "A[4]",
        },
        {
          label: "hi",
          from: 5,
          to: 5,
          tone: "right",
          text: "A[5]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", "빠짐", "빠짐", 2, 6],
          read: [],
          write: [],
          side: "남은 후보 3 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", "빠짐", "빠짐", "빠짐", 9, 2, 6],
          read: [],
          write: [2],
          side: "남은 후보 3 칸",
        },
      ],
    },
    {
      title: "T8 쌍 (2, 6) ③",
      text: "A[6] = 2 < A[7] = 6 은 참이라 작은 쪽 lo = 2, 큰 쪽 hi = 6 입니다. A[7] = 6 이 최솟값 후보에서, A[6] = 2 가 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 7],
      read: [6, 7],
      write: [],
      pointers: {
        i: 6,
      },
      calc: {
        expr: "A[6] = 2 < A[7] = 6",
        result: "참",
      },
      vars: "min = 1 · max = 9 · 비교 8 번",
      pieces: [
        {
          label: "lo",
          from: 6,
          to: 6,
          tone: "left",
          text: "A[6]",
        },
        {
          label: "hi",
          from: 7,
          to: 7,
          tone: "right",
          text: "A[7]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", "빠짐", "빠짐", 2, "빠짐"],
          read: [],
          write: [7],
          side: "남은 후보 2 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", "빠짐", "빠짐", "빠짐", 9, "빠짐", 6],
          read: [],
          write: [6],
          side: "남은 후보 2 칸",
        },
      ],
    },
    {
      title: "T9 lo = 2 와 min = 1 ④",
      text: "lo = 2 < min = 1 은 거짓이라 min = 1 그대로입니다. A[6] = 2 가 최솟값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 7],
      read: [1, 6],
      write: [],
      pointers: {
        i: 6,
      },
      calc: {
        expr: "lo = 2 < min = 1",
        result: "거짓",
      },
      vars: "min = 1 · max = 9 · 비교 9 번",
      pieces: [
        {
          label: "lo",
          from: 6,
          to: 6,
          tone: "left",
          text: "A[6]",
        },
        {
          label: "hi",
          from: 7,
          to: 7,
          tone: "right",
          text: "A[7]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", "빠짐", "빠짐", "빠짐", "빠짐"],
          read: [],
          write: [6],
          side: "남은 후보 1 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", "빠짐", "빠짐", "빠짐", 9, "빠짐", 6],
          read: [],
          write: [],
          side: "남은 후보 2 칸",
        },
      ],
    },
    {
      title: "T10 hi = 6 과 max = 9 ④",
      text: "hi = 6 > max = 9 는 거짓이라 max = 9 그대로입니다. A[7] = 6 이 최댓값 후보에서 빠집니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 7],
      read: [5, 7],
      write: [],
      pointers: {
        i: 6,
      },
      calc: {
        expr: "hi = 6 > max = 9",
        result: "거짓",
      },
      vars: "min = 1 · max = 9 · 비교 10 번",
      pieces: [
        {
          label: "lo",
          from: 6,
          to: 6,
          tone: "left",
          text: "A[6]",
        },
        {
          label: "hi",
          from: 7,
          to: 7,
          tone: "right",
          text: "A[7]",
        },
      ],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", "빠짐", "빠짐", "빠짐", "빠짐"],
          read: [],
          write: [],
          side: "남은 후보 1 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", "빠짐", "빠짐", "빠짐", 9, "빠짐", "빠짐"],
          read: [],
          write: [7],
          side: "남은 후보 1 칸",
        },
      ],
    },
    {
      title: "T11 i = 8 · 종료",
      text: "i = 8 이 n = 8 과 같아 반복이 끝납니다. 두 후보 줄에 한 칸씩 남았고, { min: 1, max: 9 } 를 돌려줍니다.",
      array: [3, 1, 4, 1, 5, 9, 2, 6],
      range: [0, 7],
      read: [],
      write: [],
      pointers: {
        i: 8,
      },
      calc: null,
      vars: "min = 1 · max = 9 · 비교 10 번",
      pieces: [],
      layers: [
        {
          name: "최솟값 후보",
          values: ["빠짐", 1, "빠짐", "빠짐", "빠짐", "빠짐", "빠짐", "빠짐"],
          read: [],
          write: [],
          side: "남은 후보 1 칸",
        },
        {
          name: "최댓값 후보",
          values: ["빠짐", "빠짐", "빠짐", "빠짐", "빠짐", 9, "빠짐", "빠짐"],
          read: [],
          write: [],
          side: "남은 후보 1 칸",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
