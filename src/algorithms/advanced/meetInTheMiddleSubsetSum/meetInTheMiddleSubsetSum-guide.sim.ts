import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `nums = [3, 34, 4, 12, 5, 2]`,
 * `target = 9`. 걸음 열둘이 그 절의 T1~T12 와 한 걸음씩 짝을 이룬다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 맨 위 줄은 입력 `nums` 이고 쥔 구간은 그 걸음이 다루는 무리다.
 * 그 아래 두 줄이 앞 무리의 부분집합 합 목록 `sumsA` 와 뒤 무리의 부분집합 합 목록 `sumsB` 다 — 첫
 * 걸음부터 칸 여덟을 모두 두고 아직 안 쓴 칸은 비운다(SPEC `L48`). 질의 걸음에서 `sumsA` 의 읽음은 묻는
 * 합이고, `sumsB` 의 읽음은 이진 탐색이 가운데 칸으로 읽은 칸, 새로 씀은 찾은 칸이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `meetInTheMiddleSubsetSum-guide.test.ts` 가 잰다.
 */

export const mitmWalk = {
  player: "stage",
  stage: "array",
  arrayName: "nums",
  rangeLabel: "무리",
  title: "meetInTheMiddleSubsetSum([3, 34, 4, 12, 5, 2], 9)",
  result: "true",
  steps: [
    {
      title: "T1 앞 무리 · 뒤 무리",
      text: "원소가 6 개라 ⑥ mid = 6 >> 1 = 3 입니다. 앞 무리는 칸 [0,2] 의 3 · 34 · 4, 뒤 무리는 칸 [3,5] 의 12 · 5 · 2 입니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: [0, 5],
      rangeSide: "원소 6 개",
      pieces: [
        {
          label: "앞 무리",
          from: 0,
          to: 2,
          tone: "left",
          text: "[0,2]",
        },
        {
          label: "뒤 무리",
          from: 3,
          to: 5,
          tone: "right",
          text: "[3,5]",
        },
      ],
      layers: [
        {
          name: "sumsA",
          values: [null, null, null, null, null, null, null, null],
        },
        {
          name: "sumsB",
          values: [null, null, null, null, null, null, null, null],
        },
      ],
      calc: {
        expr: "6 >> 1",
        result: "3",
      },
    },
    {
      title: "T2 앞 무리에 3",
      text: "① sumsA 8 칸을 잡으면 칸 0 에 공집합의 합 0 이 있습니다. ② 칸 0 의 값에 3 을 더해 칸 1 에 적습니다. 채운 칸이 1 칸에서 2 칸이 됩니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: [0, 2],
      rangeSide: "앞 무리 3 개",
      read: [0],
      layers: [
        {
          name: "sumsA",
          values: [0, 3, null, null, null, null, null, null],
          read: [0],
          write: [1],
        },
        {
          name: "sumsB",
          values: [null, null, null, null, null, null, null, null],
        },
      ],
      calc: {
        expr: "0 + 3",
        result: "3",
      },
    },
    {
      title: "T3 앞 무리에 34",
      text: "② 칸 0 · 1 의 값에 34 를 더해 칸 2 · 3 에 적습니다. 채운 칸이 2 칸에서 4 칸이 됩니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: [0, 2],
      rangeSide: "앞 무리 3 개",
      read: [1],
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, null, null, null, null],
          read: [0, 1],
          write: [2, 3],
        },
        {
          name: "sumsB",
          values: [null, null, null, null, null, null, null, null],
        },
      ],
      calc: {
        expr: "0 + 34 · 3 + 34",
        result: "34 · 37",
      },
    },
    {
      title: "T4 앞 무리에 4",
      text: "② 칸 0 · 1 · 2 · 3 의 값에 4 를 더해 칸 4 · 5 · 6 · 7 에 적습니다. 채운 칸이 4 칸에서 8 칸이 됩니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: [0, 2],
      rangeSide: "앞 무리 3 개",
      read: [2],
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [0, 1, 2, 3],
          write: [4, 5, 6, 7],
        },
        {
          name: "sumsB",
          values: [null, null, null, null, null, null, null, null],
        },
      ],
      calc: {
        expr: "0 + 4 · 3 + 4 · 34 + 4 · 37 + 4",
        result: "4 · 7 · 38 · 41",
      },
    },
    {
      title: "T5 sumsB 만들기",
      text: "① sumsB 8 칸을 잡고 ② 같은 방법으로 12 · 5 · 2 를 차례로 더합니다. 덧셈 7 번으로 칸 1 부터 7 까지가 찹니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: [3, 5],
      rangeSide: "뒤 무리 3 개",
      read: [3, 4, 5],
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
        },
        {
          name: "sumsB",
          values: [0, 12, 5, 17, 2, 14, 7, 19],
          write: [1, 2, 3, 4, 5, 6, 7],
        },
      ],
    },
    {
      title: "T6 sumsB 정렬",
      text: "⑦ sumsB 를 오름차순으로 정렬합니다. 값이 바뀐 칸은 1 · 3 · 4 · 6 이고, sumsA 는 그대로 둡니다. 원소는 이제 쓰지 않습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          write: [1, 3, 4, 6],
        },
      ],
    },
    {
      title: "T7 sA = 0 · need = 9",
      text: "⑧ 앞 무리 칸 0 의 합 0 에 모자란 값 need = 9 − 0 = 9 를 묻습니다. 칸 3 의 7 — 7 < 9 가 참 → ④, 칸 5 의 14 — 14 < 9 가 거짓 → ⑤, 칸 4 의 12 — 12 < 9 가 거짓 → ⑤. lo = 4 > hi = 3 이라 후보 구간이 비었습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [0],
          side: "질의 1 / 8",
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          read: [3, 5, 4],
          write: [],
          side: "읽은 칸 3 → 5 → 4",
        },
      ],
      calc: {
        expr: "need = 9 − 0",
        result: "9",
      },
    },
    {
      title: "T8 sA = 3 · need = 6",
      text: "⑧ 앞 무리 칸 1 의 합 3 에 모자란 값 need = 9 − 3 = 6 을 묻습니다. 칸 3 의 7 — 7 < 6 이 거짓 → ⑤, 칸 1 의 2 — 2 < 6 이 참 → ④, 칸 2 의 5 — 5 < 6 이 참 → ④. lo = 3 > hi = 2 라 후보 구간이 비었습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [1],
          side: "질의 2 / 8",
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          read: [3, 1, 2],
          write: [],
          side: "읽은 칸 3 → 1 → 2",
        },
      ],
      calc: {
        expr: "need = 9 − 3",
        result: "6",
      },
    },
    {
      title: "T9 sA = 34 · need = -25",
      text: "⑧ 앞 무리 칸 2 의 합 34 에 모자란 값 need = 9 − 34 = -25 를 묻습니다. 칸 3 의 7 — 7 < -25 가 거짓 → ⑤, 칸 1 의 2 — 2 < -25 가 거짓 → ⑤, 칸 0 의 0 — 0 < -25 가 거짓 → ⑤. lo = 0 > hi = -1 이라 후보 구간이 비었습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [2],
          side: "질의 3 / 8",
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          read: [3, 1, 0],
          write: [],
          side: "읽은 칸 3 → 1 → 0",
        },
      ],
      calc: {
        expr: "need = 9 − 34",
        result: "-25",
      },
    },
    {
      title: "T10 sA = 37 · need = -28",
      text: "⑧ 앞 무리 칸 3 의 합 37 에 모자란 값 need = 9 − 37 = -28 을 묻습니다. 칸 3 의 7 — 7 < -28 이 거짓 → ⑤, 칸 1 의 2 — 2 < -28 이 거짓 → ⑤, 칸 0 의 0 — 0 < -28 이 거짓 → ⑤. lo = 0 > hi = -1 이라 후보 구간이 비었습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [3],
          side: "질의 4 / 8",
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          read: [3, 1, 0],
          write: [],
          side: "읽은 칸 3 → 1 → 0",
        },
      ],
      calc: {
        expr: "need = 9 − 37",
        result: "-28",
      },
    },
    {
      title: "T11 sA = 4 · need = 5",
      text: "⑧ 앞 무리 칸 4 의 합 4 에 모자란 값 need = 9 − 4 = 5 를 묻습니다. 칸 3 의 7 — 7 < 5 가 거짓 → ⑤, 칸 1 의 2 — 2 < 5 가 참 → ④, 칸 2 의 5 — 5 === 5 가 참 → ③. 찾는 값이 있습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [4],
          side: "질의 5 / 8",
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          read: [3, 1],
          write: [2],
          side: "읽은 칸 3 → 1 → 2",
        },
      ],
      calc: {
        expr: "need = 9 − 4",
        result: "5",
      },
    },
    {
      title: "T12 true 반환",
      text: "앞 무리의 합 4 와 뒤 무리의 합 5 가 만나 9 입니다. 반환값은 true 이고, 앞 무리의 합 7 · 38 · 41 은 묻지 않습니다.",
      array: [3, 34, 4, 12, 5, 2],
      range: null,
      rangeSide: "이제 쓰지 않음",
      layers: [
        {
          name: "sumsA",
          values: [0, 3, 34, 37, 4, 7, 38, 41],
          read: [4],
        },
        {
          name: "sumsB",
          values: [0, 2, 5, 7, 12, 14, 17, 19],
          read: [2],
        },
      ],
      calc: {
        expr: "4 + 5",
        result: "9",
      },
    },
  ],
} satisfies ArrayPlayerSpec;
