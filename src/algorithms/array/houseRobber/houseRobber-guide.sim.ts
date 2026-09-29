import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `A = [2, 7, 9, 3, 1, 5]`.
 * `rob` 은 빈 입력을 막고 두 값을 시작하는 T1, 칸 1 부터 칸 5 까지 두 갈래 중 큰 쪽을 고르는 T2~T6,
 * 반복 조건이 거짓이 되어 답을 돌려주는 T7 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 지금까지 놓고 본 칸 `[0,i]` 이고, 입력 배열
 * `A` 아래에 배열에서 만드는 줄 둘 — 칸마다의 최대 합 `dp` 와 지금 `cur` 를 만든 선택 「고른 칸」 — 을
 * `layers` 로 쌓는다. 코드가 드는 것은 `dp` 줄의 마지막 두 칸뿐이고, 줄은 지나온 값을 보이려고 그린다.
 * 「고른 칸」 줄의 곁말(`side`)은 그 선택과 합이다. 계산 한 줄은 알약(`calc`)에 두고, 무대에 자리가 없는
 * `prev = dp[−1]` 만 T1 의 남는 변수에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `houseRobber-guide.test.ts` 가 잰다.
 */

export const rob = {
  player: "stage",
  stage: "array",
  arrayName: "A",
  rangeLabel: "놓고 본 칸",
  title: "houseRobber([2, 7, 9, 3, 1, 5])",
  result: "16",
  steps: [
    {
      title: "T1 i = 0 · ① ②",
      text: "칸이 6 개라 ① 의 조건 nums.length === 0 이 거짓입니다. prev 를 0 으로, cur 를 A[0] = 2 로 둡니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "cur = A[0]",
        result: "2",
      },
      vars: "prev = 0",
      layers: [
        {
          name: "dp",
          values: [2, null, null, null, null, null],
          read: [],
          write: [0],
        },
        {
          name: "고른 칸",
          values: [2, null, null, null, null, null],
          read: [],
          write: [0],
          side: "{0} · 합 2",
        },
      ],
    },
    {
      title: "T2 i = 1 · 칸 1 을 고른다",
      text: "건너뛴 답은 cur = 2 이고, 고른 답은 prev 0 에 A[1] = 7 을 더한 7 입니다. 고른 쪽이 커서 cur 가 7 이 되고, prev 는 옛 cur 2 를 받습니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "max(2, 0 + 7)",
        result: "7",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [2, 7, null, null, null, null],
          read: [0],
          write: [1],
        },
        {
          name: "고른 칸",
          values: ["·", 7, null, null, null, null],
          read: [],
          write: [1],
          side: "{1} · 합 7",
        },
      ],
    },
    {
      title: "T3 i = 2 · 칸 2 를 고른다",
      text: "건너뛴 답은 cur = 7 이고, 고른 답은 prev 2 에 A[2] = 9 를 더한 11 입니다. 고른 쪽이 커서 cur 가 11 이 되고, prev 는 옛 cur 7 을 받습니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "max(7, 2 + 9)",
        result: "11",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [2, 7, 11, null, null, null],
          read: [0, 1],
          write: [2],
        },
        {
          name: "고른 칸",
          values: [2, "·", 9, null, null, null],
          read: [],
          write: [2],
          side: "{0, 2} · 합 11",
        },
      ],
    },
    {
      title: "T4 i = 3 · 칸 3 을 건너뛴다",
      text: "건너뛴 답은 cur = 11 이고, 고른 답은 prev 7 에 A[3] = 3 을 더한 10 입니다. 건너뛴 쪽이 커서 cur 는 11 그대로이고, prev 는 옛 cur 11 을 받습니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "max(11, 7 + 3)",
        result: "11",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [2, 7, 11, 11, null, null],
          read: [1, 2],
          write: [3],
        },
        {
          name: "고른 칸",
          values: [2, "·", 9, "·", null, null],
          read: [],
          write: [],
          side: "{0, 2} · 합 11",
        },
      ],
    },
    {
      title: "T5 i = 4 · 칸 4 를 고른다",
      text: "건너뛴 답은 cur = 11 이고, 고른 답은 prev 11 에 A[4] = 1 을 더한 12 입니다. 고른 쪽이 커서 cur 가 12 가 되고, prev 는 옛 cur 11 을 받습니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "max(11, 11 + 1)",
        result: "12",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [2, 7, 11, 11, 12, null],
          read: [2, 3],
          write: [4],
        },
        {
          name: "고른 칸",
          values: [2, "·", 9, "·", 1, null],
          read: [],
          write: [4],
          side: "{0, 2, 4} · 합 12",
        },
      ],
    },
    {
      title: "T6 i = 5 · 칸 5 를 고른다",
      text: "건너뛴 답은 cur = 12 이고, 고른 답은 prev 11 에 A[5] = 5 를 더한 16 입니다. 고른 쪽이 커서 cur 가 16 이 되고, prev 는 옛 cur 12 를 받습니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 5],
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      calc: {
        expr: "max(12, 11 + 5)",
        result: "16",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [2, 7, 11, 11, 12, 16],
          read: [3, 4],
          write: [5],
        },
        {
          name: "고른 칸",
          values: [2, "·", 9, "·", "·", 5],
          read: [],
          write: [5],
          side: "{0, 2, 5} · 합 16",
        },
      ],
    },
    {
      title: "T7 i = 6 · 반복 끝",
      text: "i = 6 이라 ③ 의 조건 i < 6 이 거짓입니다. 반복을 마치고 cur = 16 을 돌려줍니다. 이 값을 만든 선택은 {0, 2, 5} 입니다.",
      array: [2, 7, 9, 3, 1, 5],
      range: [0, 5],
      read: [],
      write: [],
      pointers: {
        i: 6,
      },
      calc: {
        expr: "6 < 6",
        result: "거짓",
      },
      vars: null,
      layers: [
        {
          name: "dp",
          values: [2, 7, 11, 11, 12, 16],
          read: [5],
          write: [],
        },
        {
          name: "고른 칸",
          values: [2, "·", 9, "·", "·", 5],
          read: [],
          write: [],
          side: "{0, 2, 5} · 합 16",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
