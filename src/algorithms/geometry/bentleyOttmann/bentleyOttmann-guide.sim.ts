import type { GraphPlayerSpec } from "../../../_viz/player/StepPlayer";

/**
 * 걸음 재생 패널 두 벌 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임
 * 제목은 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 첫 벌은 x = 0 의 세 선분부터 첫 교차점
 * 사건까지(T1–T6), 둘째 벌은 둘째 교차점부터 끝까지(T7–T12)다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 끝점과 교차점의 자리(`layout`)는 패널에 한 번만 적고 — 좌표 그대로, `y` 만
 * 뒤집는다 — 걸음마다 정점과 선분 토막의 상태, 스위프 선(`rules`), 띠 넷(`status` · `upright` ·
 * 꺼낼 차례대로의 사건 큐 x · y)만 바꾼다(`src/_viz/player/graphStage.ts`).
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `bentleyOttmann-guide.test.ts` 가 잰다.
 */

export const sweepFirst = {
  player: "stage",
  stage: "graph",
  title: "선분 다섯 개 — 세 선분이 들어오고 첫 교차점까지",
  sub: "T1–T6 · 끝점 사건과 세로 선분, 첫 교차점",
  result: "4",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 8,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 8,
        y: 0,
        label: "(8,8)",
      },
      {
        id: 2,
        x: 0,
        y: 2,
        label: "(0,6)",
      },
      {
        id: 3,
        x: 6,
        y: 8,
        label: "(6,0)",
      },
      {
        id: 4,
        x: 2,
        y: 7,
        label: "(2,1)",
      },
      {
        id: 5,
        x: 2,
        y: 3,
        label: "(2,5)",
      },
      {
        id: 6,
        x: 0,
        y: 0,
        label: "(0,8)",
      },
      {
        id: 7,
        x: 8,
        y: 4,
        label: "(8,4)",
      },
      {
        id: 8,
        x: 9,
        y: 8,
        label: "(9,0)",
      },
      {
        id: 9,
        x: 11,
        y: 6,
        label: "(11,2)",
      },
      {
        id: 10,
        x: 2,
        y: 6,
        label: "(2,2)",
      },
      {
        id: 11,
        x: 2,
        y: 4,
        label: "(2,4)",
      },
      {
        id: 12,
        x: 3,
        y: 5,
        label: "(3,3)",
      },
      {
        id: 13,
        x: 5.333333333333333,
        y: 2.666666666666667,
        label: "(16/3,16/3)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 10,
      },
      {
        from: 10,
        to: 12,
      },
      {
        from: 12,
        to: 13,
      },
      {
        from: 13,
        to: 1,
      },
      {
        from: 2,
        to: 11,
      },
      {
        from: 11,
        to: 12,
      },
      {
        from: 12,
        to: 3,
      },
      {
        from: 4,
        to: 10,
      },
      {
        from: 10,
        to: 11,
      },
      {
        from: 11,
        to: 5,
      },
      {
        from: 6,
        to: 13,
      },
      {
        from: 13,
        to: 7,
      },
      {
        from: 8,
        to: 9,
      },
    ],
    directed: false,
    unit: {
      x: 100,
      y: 64,
    },
  },
  steps: [
    {
      title: "T1 (0,0) — 시작 s0",
      text: "s0 이 시작해 상태 배열이 s0 이 됩니다.",
      nodes: [
        {
          value: "now",
          state: "read",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "s0",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          state: "out",
          label: "s1",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
          label: "s2",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
          label: "s3",
        },
        {
          state: "out",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s0"],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["0", "0", "2", "2", "6", "8", "8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["6", "8", "1", "5", "0", "4", "8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 0,
          label: "스위프 선 x = 0",
        },
      ],
      calc: null,
      vars: "pairs 0",
    },
    {
      title: "T2 (0,6) — 시작 s1",
      text: "s1 이 시작해 상태 배열이 s0 s1 이 됩니다. 새 이웃 s0–s1 의 교차점 (3,3) 을 사건 큐에 넣습니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {
          value: "now",
          state: "read",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "focus",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "s0",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "focus",
          label: "s1",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          state: "out",
          label: "s2",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
          label: "s3",
        },
        {
          state: "out",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s0", "s1"],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["0", "2", "2", "3", "6", "8", "8", "9", "11"],
          states: {
            "3": "focus",
          },
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["8", "1", "5", "3", "0", "4", "8", "0", "2"],
          states: {
            "3": "focus",
          },
          slots: 9,
        },
      ],
      rules: [
        {
          x: 0,
          label: "스위프 선 x = 0",
        },
      ],
      calc: {
        expr: "s0–s1 의 교차점 =",
        result: "(3,3)",
      },
      vars: "pairs 0",
    },
    {
      title: "T3 (0,8) — 시작 s3",
      text: "s3 이 시작해 상태 배열이 s0 s1 s3 이 됩니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          value: "now",
          state: "read",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "empty",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "s0",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "s1",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          state: "out",
          label: "s2",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          kind: "tree",
          state: "focus",
          label: "s3",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s0", "s1", "s3"],
          states: {
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["2", "2", "3", "6", "8", "8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["1", "5", "3", "0", "4", "8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 0,
          label: "스위프 선 x = 0",
        },
      ],
      calc: null,
      vars: "pairs 0",
    },
    {
      title: "T4 (2,1) — 세로 열기 s2",
      text: "세로 선분 s2 를 열고, x = 2 에서 y 범위에 드는 s0 s1 과 짝을 셉니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {
          state: "empty",
        },
        {
          value: "now",
          state: "read",
        },
        {
          state: "empty",
        },
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "empty",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "s0",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
          label: "s1",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "focus",
          label: "s2",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          label: "s3",
        },
        {
          kind: "tree",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s0", "s1", "s3"],
          states: {},
          slots: 3,
        },
        {
          label: "upright",
          values: ["s2"],
          states: {
            "0": "focus",
          },
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["2", "3", "6", "8", "8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["5", "3", "0", "4", "8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 2,
          label: "스위프 선 x = 2",
        },
      ],
      calc: {
        expr: "센 짝 s0–s2, s1–s2 →",
        result: "pairs 2",
      },
      vars: "pairs 2",
    },
    {
      title: "T5 (2,5) — 세로 닫기 s2",
      text: "세로 선분 s2 를 닫습니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {
          state: "empty",
        },
        {},
        {
          value: "now",
          state: "read",
        },
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {},
        {},
        {
          state: "empty",
        },
        {
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "s0",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
          label: "s1",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          state: "focus",
          label: "s2",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          kind: "tree",
          state: "read",
          label: "s3",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s0", "s1", "s3"],
          states: {},
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["3", "6", "8", "8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["3", "0", "4", "8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 2,
          label: "스위프 선 x = 2",
        },
      ],
      calc: null,
      vars: "pairs 2",
    },
    {
      title: "T6 (3,3) — 교차",
      text: "이 점을 지나는 토막 s0 s1 을 기울기 순 s1 s0 으로 다시 놓습니다. 새 이웃 s0–s3 의 교차점 (16/3,16/3) 을 사건 큐에 넣습니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {
          state: "empty",
        },
        {},
        {},
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {},
        {},
        {
          value: "now",
          state: "read",
        },
        {
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "s0",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
          label: "s1",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          label: "s2",
        },
        {},
        {},
        {
          kind: "tree",
          state: "read",
          label: "s3",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s1", "s0", "s3"],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["16/3", "6", "8", "8", "9", "11"],
          states: {
            "0": "focus",
          },
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["16/3", "0", "4", "8", "0", "2"],
          states: {
            "0": "focus",
          },
          slots: 9,
        },
      ],
      rules: [
        {
          x: 3,
          label: "스위프 선 x = 3",
        },
      ],
      calc: {
        expr: "센 짝 s0–s1 →",
        result: "pairs 3",
      },
      vars: "pairs 3",
    },
  ],
} as const satisfies GraphPlayerSpec;

export const sweepSecond = {
  player: "stage",
  stage: "graph",
  title: "선분 다섯 개 — 둘째 교차점부터 사건 큐가 빌 때까지",
  sub: "T7–T12 · 둘째 교차점과 끝점 사건",
  result: "4",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 8,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 8,
        y: 0,
        label: "(8,8)",
      },
      {
        id: 2,
        x: 0,
        y: 2,
        label: "(0,6)",
      },
      {
        id: 3,
        x: 6,
        y: 8,
        label: "(6,0)",
      },
      {
        id: 4,
        x: 2,
        y: 7,
        label: "(2,1)",
      },
      {
        id: 5,
        x: 2,
        y: 3,
        label: "(2,5)",
      },
      {
        id: 6,
        x: 0,
        y: 0,
        label: "(0,8)",
      },
      {
        id: 7,
        x: 8,
        y: 4,
        label: "(8,4)",
      },
      {
        id: 8,
        x: 9,
        y: 8,
        label: "(9,0)",
      },
      {
        id: 9,
        x: 11,
        y: 6,
        label: "(11,2)",
      },
      {
        id: 10,
        x: 2,
        y: 6,
        label: "(2,2)",
      },
      {
        id: 11,
        x: 2,
        y: 4,
        label: "(2,4)",
      },
      {
        id: 12,
        x: 3,
        y: 5,
        label: "(3,3)",
      },
      {
        id: 13,
        x: 5.333333333333333,
        y: 2.666666666666667,
        label: "(16/3,16/3)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 10,
      },
      {
        from: 10,
        to: 12,
      },
      {
        from: 12,
        to: 13,
      },
      {
        from: 13,
        to: 1,
      },
      {
        from: 2,
        to: 11,
      },
      {
        from: 11,
        to: 12,
      },
      {
        from: 12,
        to: 3,
      },
      {
        from: 4,
        to: 10,
      },
      {
        from: 10,
        to: 11,
      },
      {
        from: 11,
        to: 5,
      },
      {
        from: 6,
        to: 13,
      },
      {
        from: 13,
        to: 7,
      },
      {
        from: 8,
        to: 9,
      },
    ],
    directed: false,
    unit: {
      x: 100,
      y: 64,
    },
  },
  steps: [
    {
      title: "T7 (16/3,16/3) — 교차",
      text: "이 점을 지나는 토막 s0 s3 을 기울기 순 s3 s0 으로 다시 놓습니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {
          state: "empty",
        },
        {},
        {},
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {},
        {},
        {},
        {
          value: "now",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "s0",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "read",
          label: "s1",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          label: "s2",
        },
        {},
        {},
        {
          kind: "tree",
          state: "focus",
          label: "s3",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s1", "s3", "s0"],
          states: {
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["6", "8", "8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["0", "4", "8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 5.333333333333333,
          label: "스위프 선 x = 16/3",
        },
      ],
      calc: {
        expr: "센 짝 s0–s3 →",
        result: "pairs 4",
      },
      vars: "pairs 4",
    },
    {
      title: "T8 (6,0) — 끝 s1",
      text: "s1 이 끝나 상태 배열에서 빠집니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {
          value: "now",
          state: "read",
        },
        {},
        {},
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {},
        {},
        {},
        {},
      ],
      edges: [
        {
          kind: "tree",
          label: "s0",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          state: "focus",
          label: "s1",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          label: "s2",
        },
        {},
        {},
        {
          kind: "tree",
          label: "s3",
        },
        {
          kind: "tree",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s3", "s0"],
          states: {},
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["8", "8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["4", "8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 6,
          label: "스위프 선 x = 6",
        },
      ],
      calc: null,
      vars: "pairs 4",
    },
    {
      title: "T9 (8,4) — 끝 s3",
      text: "s3 이 끝나 상태 배열에서 빠집니다.",
      nodes: [
        {},
        {
          state: "empty",
        },
        {},
        {},
        {},
        {},
        {},
        {
          value: "now",
          state: "read",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {},
        {},
        {},
        {},
      ],
      edges: [
        {
          kind: "tree",
          label: "s0",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          label: "s1",
        },
        {},
        {},
        {
          label: "s2",
        },
        {},
        {},
        {
          state: "focus",
          label: "s3",
        },
        {
          state: "focus",
        },
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s0"],
          states: {},
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["8", "9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["8", "0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 8,
          label: "스위프 선 x = 8",
        },
      ],
      calc: null,
      vars: "pairs 4",
    },
    {
      title: "T10 (8,8) — 끝 s0",
      text: "s0 이 끝나 상태 배열에서 빠집니다.",
      nodes: [
        {},
        {
          value: "now",
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {},
        {},
        {},
        {},
      ],
      edges: [
        {
          state: "focus",
          label: "s0",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          label: "s1",
        },
        {},
        {},
        {
          label: "s2",
        },
        {},
        {},
        {
          label: "s3",
        },
        {},
        {
          state: "out",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["9", "11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["0", "2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 8,
          label: "스위프 선 x = 8",
        },
      ],
      calc: null,
      vars: "pairs 4",
    },
    {
      title: "T11 (9,0) — 시작 s4",
      text: "s4 가 시작해 상태 배열이 s4 가 됩니다.",
      nodes: [
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          value: "now",
          state: "read",
        },
        {
          state: "empty",
        },
        {},
        {},
        {},
        {},
      ],
      edges: [
        {
          label: "s0",
        },
        {},
        {},
        {},
        {
          label: "s1",
        },
        {},
        {},
        {
          label: "s2",
        },
        {},
        {},
        {
          label: "s3",
        },
        {},
        {
          kind: "tree",
          state: "focus",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: ["s4"],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: ["11"],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: ["2"],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 9,
          label: "스위프 선 x = 9",
        },
      ],
      calc: null,
      vars: "pairs 4",
    },
    {
      title: "T12 (11,2) — 끝 s4",
      text: "s4 가 끝나 상태 배열에서 빠집니다.",
      nodes: [
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {
          value: "now",
          state: "read",
        },
        {},
        {},
        {},
        {},
      ],
      edges: [
        {
          label: "s0",
        },
        {},
        {},
        {},
        {
          label: "s1",
        },
        {},
        {},
        {
          label: "s2",
        },
        {},
        {},
        {
          label: "s3",
        },
        {},
        {
          state: "focus",
          label: "s4",
        },
      ],
      groups: [],
      strips: [
        {
          label: "status",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "upright",
          values: [],
          states: {},
          slots: 1,
        },
        {
          label: "큐 · x",
          values: [],
          states: {},
          slots: 9,
        },
        {
          label: "큐 · y",
          values: [],
          states: {},
          slots: 9,
        },
      ],
      rules: [
        {
          x: 11,
          label: "스위프 선 x = 11",
        },
      ],
      calc: null,
      vars: "pairs 4",
    },
  ],
} as const satisfies GraphPlayerSpec;
