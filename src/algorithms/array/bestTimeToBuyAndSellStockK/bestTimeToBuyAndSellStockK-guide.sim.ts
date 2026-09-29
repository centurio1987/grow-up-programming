import type { ArrayPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — `k = 2` · `P = [2, 6, 3, 9, 5, 7]`.
 * `tradeScan` 은 거래 상태를 시작값으로 두는 T1, 날 0 부터 날 5 까지 하루를 읽으며 거래 번호 1 · 2 의 매수와
 * 매도를 갱신하는 T2~T7, 읽을 날이 남지 않아 `free[2]` 를 돌려주는 T8 이다.
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "array"` 가 배열
 * 무대(`arrayStage.ts`)를 고른다. 입력 배열 `P` 아래에 거래 상태 다섯(`free[0]` · `hold[1]` · `free[1]` ·
 * `hold[2]` · `free[2]`)을 `layers` 로 쌓는다. 칸 `j` 는 날 `j` 를 읽은 뒤의 값이다 — 코드가 드는 것은 줄마다
 * 마지막 칸뿐이고, 줄은 지나온 값을 보이려고 그린다. 쥔 구간 `range` 는 지금까지 읽은 날이다. 줄 곁말(`side`)이
 * 그 걸음에서 값이 어떻게 바뀌었는지를 적고, 계산 한 줄은 답의 자리 `free[2]` 의 갱신을 알약(`calc`)에 싣는다.
 * 무대 밖에 남는 값은 없다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다. 리터럴은 그림 사이드카의
 * `simStepsFromRef()`(정본 실행에서 만든 걸음)를 글자 그대로 옮긴 것이고, 둘이 같은지는
 * `bestTimeToBuyAndSellStockK-guide.test.ts` 가 잰다.
 */

export const tradeScan = {
  player: "stage",
  stage: "array",
  arrayName: "P",
  rangeLabel: "읽은 날",
  title: "bestTimeToBuyAndSellStockK(2, [2, 6, 3, 9, 5, 7])",
  result: "10",
  steps: [
    {
      title: "T1 시작 · ①",
      text: "거래 상태를 시작값으로 둡니다. hold 는 칸마다 -∞, free 는 칸마다 0 입니다. 아직 읽은 날이 없습니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: null,
      read: [],
      write: [],
      calc: {
        expr: "hold[t] = -∞ · free[t] =",
        result: "0",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [null, null, null, null, null, null],
          read: [],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [null, null, null, null, null, null],
          read: [],
          write: [],
          side: "시작값 -∞",
        },
        {
          name: "free[1]",
          values: [null, null, null, null, null, null],
          read: [],
          write: [],
          side: "시작값 0",
        },
        {
          name: "hold[2]",
          values: [null, null, null, null, null, null],
          read: [],
          write: [],
          side: "시작값 -∞",
        },
        {
          name: "free[2]",
          values: [null, null, null, null, null, null],
          read: [],
          write: [],
          side: "시작값 0",
        },
      ],
    },
    {
      title: "T2 j = 0 · P[j] = 2 · hold[1] · hold[2] 바뀜",
      text: "hold[1] 은 오늘 사는 쪽 0 − 2 = -2 가 시작값 -∞ 보다 커서 -2 로 올라갑니다(④). hold[2] 는 오늘 사는 쪽 0 − 2 = -2 가 시작값 -∞ 보다 커서 -2 로 올라갑니다(④). 나머지 상태는 어제 값 그대로입니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 0],
      read: [0],
      write: [],
      pointers: {
        j: 0,
      },
      calc: {
        expr: "free[2] = max(0, -2 + 2) =",
        result: "0",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, null, null, null, null, null],
          read: [0],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [-2, null, null, null, null, null],
          read: [],
          write: [0],
          side: "-∞ → -2",
        },
        {
          name: "free[1]",
          values: [0, null, null, null, null, null],
          read: [],
          write: [0],
          side: "0 그대로",
        },
        {
          name: "hold[2]",
          values: [-2, null, null, null, null, null],
          read: [],
          write: [0],
          side: "-∞ → -2",
        },
        {
          name: "free[2]",
          values: [0, null, null, null, null, null],
          read: [],
          write: [0],
          side: "0 그대로",
        },
      ],
    },
    {
      title: "T3 j = 1 · P[j] = 6 · free[1] · free[2] 바뀜",
      text: "free[1] 은 오늘 파는 쪽 -2 + 6 = 4 가 어제 값 0 보다 커서 4 로 올라갑니다(⑤). free[2] 는 오늘 파는 쪽 -2 + 6 = 4 가 어제 값 0 보다 커서 4 로 올라갑니다(⑤). 나머지 상태는 어제 값 그대로입니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 1],
      read: [1],
      write: [],
      pointers: {
        j: 1,
      },
      calc: {
        expr: "free[2] = max(0, -2 + 6) =",
        result: "4",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, 0, null, null, null, null],
          read: [1],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [-2, -2, null, null, null, null],
          read: [0],
          write: [1],
          side: "-2 그대로",
        },
        {
          name: "free[1]",
          values: [0, 4, null, null, null, null],
          read: [0],
          write: [1],
          side: "0 → 4",
        },
        {
          name: "hold[2]",
          values: [-2, -2, null, null, null, null],
          read: [0],
          write: [1],
          side: "-2 그대로",
        },
        {
          name: "free[2]",
          values: [0, 4, null, null, null, null],
          read: [0],
          write: [1],
          side: "0 → 4",
        },
      ],
    },
    {
      title: "T4 j = 2 · P[j] = 3 · hold[2] 바뀜",
      text: "hold[2] 는 오늘 사는 쪽 4 − 3 = 1 이 어제 값 -2 보다 커서 1 로 올라갑니다(④). 나머지 상태는 어제 값 그대로입니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 2],
      read: [2],
      write: [],
      pointers: {
        j: 2,
      },
      calc: {
        expr: "free[2] = max(4, 1 + 3) =",
        result: "4",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, 0, 0, null, null, null],
          read: [2],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [-2, -2, -2, null, null, null],
          read: [1],
          write: [2],
          side: "-2 그대로",
        },
        {
          name: "free[1]",
          values: [0, 4, 4, null, null, null],
          read: [1],
          write: [2],
          side: "4 그대로",
        },
        {
          name: "hold[2]",
          values: [-2, -2, 1, null, null, null],
          read: [1],
          write: [2],
          side: "-2 → 1",
        },
        {
          name: "free[2]",
          values: [0, 4, 4, null, null, null],
          read: [1],
          write: [2],
          side: "4 그대로",
        },
      ],
    },
    {
      title: "T5 j = 3 · P[j] = 9 · free[1] · free[2] 바뀜",
      text: "free[1] 은 오늘 파는 쪽 -2 + 9 = 7 이 어제 값 4 보다 커서 7 로 올라갑니다(⑤). free[2] 는 오늘 파는 쪽 1 + 9 = 10 이 어제 값 4 보다 커서 10 으로 올라갑니다(⑤). 나머지 상태는 어제 값 그대로입니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 3],
      read: [3],
      write: [],
      pointers: {
        j: 3,
      },
      calc: {
        expr: "free[2] = max(4, 1 + 9) =",
        result: "10",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, 0, 0, 0, null, null],
          read: [3],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [-2, -2, -2, -2, null, null],
          read: [2],
          write: [3],
          side: "-2 그대로",
        },
        {
          name: "free[1]",
          values: [0, 4, 4, 7, null, null],
          read: [2],
          write: [3],
          side: "4 → 7",
        },
        {
          name: "hold[2]",
          values: [-2, -2, 1, 1, null, null],
          read: [2],
          write: [3],
          side: "1 그대로",
        },
        {
          name: "free[2]",
          values: [0, 4, 4, 10, null, null],
          read: [2],
          write: [3],
          side: "4 → 10",
        },
      ],
    },
    {
      title: "T6 j = 4 · P[j] = 5 · hold[2] 바뀜",
      text: "hold[2] 는 오늘 사는 쪽 7 − 5 = 2 가 어제 값 1 보다 커서 2 로 올라갑니다(④). 나머지 상태는 어제 값 그대로입니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 4],
      read: [4],
      write: [],
      pointers: {
        j: 4,
      },
      calc: {
        expr: "free[2] = max(10, 2 + 5) =",
        result: "10",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, 0, 0, 0, 0, null],
          read: [4],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [-2, -2, -2, -2, -2, null],
          read: [3],
          write: [4],
          side: "-2 그대로",
        },
        {
          name: "free[1]",
          values: [0, 4, 4, 7, 7, null],
          read: [3],
          write: [4],
          side: "7 그대로",
        },
        {
          name: "hold[2]",
          values: [-2, -2, 1, 1, 2, null],
          read: [3],
          write: [4],
          side: "1 → 2",
        },
        {
          name: "free[2]",
          values: [0, 4, 4, 10, 10, null],
          read: [3],
          write: [4],
          side: "10 그대로",
        },
      ],
    },
    {
      title: "T7 j = 5 · P[j] = 7 · 바뀐 상태 없음",
      text: "오늘 사는 쪽도 파는 쪽도 어제 값보다 크지 않아 거래 상태가 하나도 안 바뀝니다. free[2] 는 10 그대로입니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 5],
      read: [5],
      write: [],
      pointers: {
        j: 5,
      },
      calc: {
        expr: "free[2] = max(10, 2 + 7) =",
        result: "10",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, 0, 0, 0, 0, 0],
          read: [5],
          write: [],
          side: "늘 0",
        },
        {
          name: "hold[1]",
          values: [-2, -2, -2, -2, -2, -2],
          read: [4],
          write: [5],
          side: "-2 그대로",
        },
        {
          name: "free[1]",
          values: [0, 4, 4, 7, 7, 7],
          read: [4],
          write: [5],
          side: "7 그대로",
        },
        {
          name: "hold[2]",
          values: [-2, -2, 1, 1, 2, 2],
          read: [4],
          write: [5],
          side: "2 그대로",
        },
        {
          name: "free[2]",
          values: [0, 4, 4, 10, 10, 10],
          read: [4],
          write: [5],
          side: "10 그대로",
        },
      ],
    },
    {
      title: "T8 j = 6 · 반복 끝",
      text: "j = 6 이라 읽을 날이 남지 않아 ② 가 거짓입니다. 마지막 칸 free[2] = 10 을 돌려줍니다.",
      array: [2, 6, 3, 9, 5, 7],
      range: [0, 5],
      read: [],
      write: [],
      pointers: {
        j: 6,
      },
      calc: {
        expr: "free[2] =",
        result: "10",
      },
      vars: null,
      layers: [
        {
          name: "free[0]",
          values: [0, 0, 0, 0, 0, 0],
          read: [],
          write: [],
        },
        {
          name: "hold[1]",
          values: [-2, -2, -2, -2, -2, -2],
          read: [],
          write: [],
        },
        {
          name: "free[1]",
          values: [0, 4, 4, 7, 7, 7],
          read: [],
          write: [],
        },
        {
          name: "hold[2]",
          values: [-2, -2, 1, 1, 2, 2],
          read: [],
          write: [],
        },
        {
          name: "free[2]",
          values: [0, 4, 4, 10, 10, 10],
          read: [5],
          write: [],
          side: "답 10",
        },
      ],
    },
  ],
} satisfies ArrayPlayerSpec;
