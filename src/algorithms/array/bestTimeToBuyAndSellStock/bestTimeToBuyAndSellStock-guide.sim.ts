import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `P = [7, 2, 5, 1, 6, 3]`.
 * `profitScan` 은 두 상태를 첫날 값으로 두는 T1, 날 1 부터 날 5 까지 오늘 파는 이익으로 최대 이익을
 * 갱신하고 오늘 가격으로 최저가를 갱신하는 T2~T6, 반복 조건이 거짓이 되어 답을 돌려주는 T7 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가
 * 배열 무대(`arrayStage.ts`)를 고른다. 쥔 구간 `range` 는 이번 걸음이 재는 거래 — 어제까지의 최저가인 날에
 * 사서 오늘 파는 거래 — 이고, 값 줄 곁말(`rangeSide`)이 그 이익이다. 입력 배열 `P` 아래에 배열에서 만드는 줄
 * 둘 — 날마다의 접두사 최솟값 `m` 과 그때까지의 최대 이익 `best` — 을 `layers` 로 쌓는다. 코드가 드는 것은
 * 두 줄의 마지막 칸뿐이고, 줄은 지나온 값을 보이려고 그린다. `best` 줄의 곁말(`side`)은 그 값을 만든 거래다.
 * 계산 한 줄은 알약(`calc`)에 두고, 무대 밖에 남는 값은 없다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `bestTimeToBuyAndSellStock-guide.test.ts` 가 잰다.
 */

export const profitScan = {
  player: "stage",
  stage: "array",
  arrayName: "P",
  rangeLabel: "거래",
  title: "bestTimeToBuyAndSellStock([7, 2, 5, 1, 6, 3])",
  result: "5",
  steps: [
    {
      title: "T1 i = 0 · ①",
      text: "minP 를 P[0] = 7 로, best 를 0 으로 둡니다. 날 0 에 사서 날 0 에 팔면 이익이 0 입니다.",
      array: [7, 2, 5, 1, 6, 3],
      range: [0, 0],
      rangeSide: "이익 0",
      read: [0],
      write: [],
      pointers: {
        i: 0,
      },
      calc: {
        expr: "minP = P[0]",
        result: "7",
      },
      vars: null,
      layers: [
        {
          name: "m",
          values: [7, null, null, null, null, null],
          read: [],
          write: [0],
        },
        {
          name: "best",
          values: [0, null, null, null, null, null],
          read: [],
          write: [0],
          side: "거래 없음",
        },
      ],
    },
    {
      title: "T2 i = 1 · minP 가 내려감",
      text: "오늘 팔면 2 − 7 = -5 입니다. best 는 0 그대로입니다(③). 오늘 가격 2 가 최저가보다 낮아 minP 가 7 에서 2 로 내려갑니다(④).",
      array: [7, 2, 5, 1, 6, 3],
      range: [0, 1],
      rangeSide: "이익 -5",
      read: [1],
      write: [],
      pointers: {
        i: 1,
      },
      calc: {
        expr: "max(0, 2 − 7)",
        result: "0",
      },
      vars: null,
      layers: [
        {
          name: "m",
          values: [7, 2, null, null, null, null],
          read: [0],
          write: [1],
        },
        {
          name: "best",
          values: [0, 0, null, null, null, null],
          read: [0],
          write: [],
          side: "거래 없음",
        },
      ],
    },
    {
      title: "T3 i = 2 · best 가 커짐",
      text: "오늘 팔면 5 − 2 = 3 입니다. best 는 0 에서 3 으로 커집니다(③). minP 는 2 그대로입니다(④).",
      array: [7, 2, 5, 1, 6, 3],
      range: [1, 2],
      rangeSide: "이익 3",
      read: [2],
      write: [],
      pointers: {
        i: 2,
      },
      calc: {
        expr: "max(0, 5 − 2)",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "m",
          values: [7, 2, 2, null, null, null],
          read: [1],
          write: [2],
        },
        {
          name: "best",
          values: [0, 0, 3, null, null, null],
          read: [1],
          write: [2],
          side: "거래 [1,2]",
        },
      ],
    },
    {
      title: "T4 i = 3 · minP 가 내려감",
      text: "오늘 팔면 1 − 2 = -1 입니다. best 는 3 그대로입니다(③). 오늘 가격 1 이 최저가보다 낮아 minP 가 2 에서 1 로 내려갑니다(④).",
      array: [7, 2, 5, 1, 6, 3],
      range: [1, 3],
      rangeSide: "이익 -1",
      read: [3],
      write: [],
      pointers: {
        i: 3,
      },
      calc: {
        expr: "max(3, 1 − 2)",
        result: "3",
      },
      vars: null,
      layers: [
        {
          name: "m",
          values: [7, 2, 2, 1, null, null],
          read: [2],
          write: [3],
        },
        {
          name: "best",
          values: [0, 0, 3, 3, null, null],
          read: [2],
          write: [],
          side: "거래 [1,2]",
        },
      ],
    },
    {
      title: "T5 i = 4 · best 가 커짐",
      text: "오늘 팔면 6 − 1 = 5 입니다. best 는 3 에서 5 로 커집니다(③). minP 는 1 그대로입니다(④).",
      array: [7, 2, 5, 1, 6, 3],
      range: [3, 4],
      rangeSide: "이익 5",
      read: [4],
      write: [],
      pointers: {
        i: 4,
      },
      calc: {
        expr: "max(3, 6 − 1)",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "m",
          values: [7, 2, 2, 1, 1, null],
          read: [3],
          write: [4],
        },
        {
          name: "best",
          values: [0, 0, 3, 3, 5, null],
          read: [3],
          write: [4],
          side: "거래 [3,4]",
        },
      ],
    },
    {
      title: "T6 i = 5 · 둘 다 그대로",
      text: "오늘 팔면 3 − 1 = 2 입니다. best 는 5 그대로입니다(③). minP 는 1 그대로입니다(④).",
      array: [7, 2, 5, 1, 6, 3],
      range: [3, 5],
      rangeSide: "이익 2",
      read: [5],
      write: [],
      pointers: {
        i: 5,
      },
      calc: {
        expr: "max(5, 3 − 1)",
        result: "5",
      },
      vars: null,
      layers: [
        {
          name: "m",
          values: [7, 2, 2, 1, 1, 1],
          read: [4],
          write: [5],
        },
        {
          name: "best",
          values: [0, 0, 3, 3, 5, 5],
          read: [4],
          write: [],
          side: "거래 [3,4]",
        },
      ],
    },
    {
      title: "T7 i = 6 · 반복 끝",
      text: "i = 6 이라 ② 의 조건 i < 6 이 거짓입니다. 반복을 마치고 best = 5 를 돌려줍니다. 날 3 에 사서 날 4 에 판 이익입니다.",
      array: [7, 2, 5, 1, 6, 3],
      range: [3, 4],
      rangeSide: "이익 5",
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
          name: "m",
          values: [7, 2, 2, 1, 1, 1],
          read: [],
          write: [],
        },
        {
          name: "best",
          values: [0, 0, 3, 3, 5, 5],
          read: [5],
          write: [],
          side: "거래 [3,4]",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
