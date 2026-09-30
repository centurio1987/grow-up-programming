/**
 * 걸음 재생 패널 두 벌 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 첫 벌은 정렬과 아래 사슬(T1~T8), 둘째 벌은 위
 * 사슬과 두 사슬 잇기(T9~T16)다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 평면 위의 점은 정점이고 그 자리(`layout`)는 점의 좌표 그대로다(화면 아래로 갈수록
 * 커지는 `y` 만 뒤집었다). 두 사슬이 한 번이라도 이은 점 쌍이 간선 자리이고, 걸음마다 그 걸음의 사슬에
 * 있는 이음만 그린다(나머지는 `hidden`). 사슬(스택)은 무대 아래 띠다 — 바닥이 왼쪽이고 칸 수는 사슬이
 * 가장 길었을 때로 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차의
 * 기록에서 낸 결과를 옮긴 것이고, 둘이 같은지는 `convexHull-guide.test.ts` 가 잰다.
 */

export const walkLower = {
  player: "stage",
  stage: "graph",
  title: "정렬 순서대로 아래 사슬을 쌓는다 — 정점 아래 수는 정렬 순서",
  sub: "T1–T8 · 걸음마다 점 하나를 담는다",
  result: "[[0, 0], [6, 0], [6, 3]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 4,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 0,
        y: 1,
        label: "(0,3)",
      },
      {
        id: 2,
        x: 3,
        y: 4,
        label: "(3,0)",
      },
      {
        id: 3,
        x: 3,
        y: 2,
        label: "(3,2)",
      },
      {
        id: 4,
        x: 3,
        y: 0,
        label: "(3,4)",
      },
      {
        id: 5,
        x: 6,
        y: 4,
        label: "(6,0)",
      },
      {
        id: 6,
        x: 6,
        y: 1,
        label: "(6,3)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 0,
        to: 2,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 2,
        to: 4,
      },
      {
        from: 0,
        to: 5,
      },
      {
        from: 5,
        to: 6,
      },
      {
        from: 6,
        to: 5,
      },
      {
        from: 6,
        to: 4,
      },
      {
        from: 4,
        to: 3,
      },
      {
        from: 4,
        to: 2,
      },
      {
        from: 4,
        to: 1,
      },
      {
        from: 1,
        to: 0,
      },
    ],
    directed: true,
    unit: {
      x: 64,
      y: 52,
    },
  },
  steps: [
    {
      title: "T1 좌표 순서로 정렬하고 같은 좌표를 합친다",
      text: "입력 8 개를 x 를 먼저, 같으면 y 로 정렬하고 이웃한 같은 좌표를 하나로 합칩니다. 서로 다른 점 7 개가 정렬 순서로 번호를 받습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "focus",
        },
        {
          value: "순서 1",
          state: "focus",
        },
        {
          value: "순서 2",
          state: "focus",
        },
        {
          value: "순서 3",
          state: "focus",
        },
        {
          value: "순서 4",
          state: "focus",
        },
        {
          value: "순서 5",
          state: "focus",
        },
        {
          value: "순서 6",
          state: "focus",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: [],
          slots: 4,
        },
      ],
      calc: null,
      vars: "방향 판정 0 / 14 · 걷어낸 점 0",
    },
    {
      title: "T2 아래 사슬 · 점 (0,0)",
      text: "사슬이 비어 있어 방향 판정 없이 (0,0) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "focus",
        },
        {
          value: "순서 1",
          state: "empty",
        },
        {
          value: "순서 2",
          state: "empty",
        },
        {
          value: "순서 3",
          state: "empty",
        },
        {
          value: "순서 4",
          state: "empty",
        },
        {
          value: "순서 5",
          state: "empty",
        },
        {
          value: "순서 6",
          state: "empty",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)"],
          slots: 4,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: null,
      vars: "방향 판정 0 / 14 · 걷어낸 점 0",
    },
    {
      title: "T3 아래 사슬 · 점 (0,3)",
      text: "사슬에 점이 1 개뿐이라 방향 판정 없이 (0,3) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
        },
        {
          value: "순서 1",
          state: "focus",
        },
        {
          value: "순서 2",
          state: "empty",
        },
        {
          value: "순서 3",
          state: "empty",
        },
        {
          value: "순서 4",
          state: "empty",
        },
        {
          value: "순서 5",
          state: "empty",
        },
        {
          value: "순서 6",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)", "(0,3)"],
          slots: 4,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: null,
      vars: "방향 판정 0 / 14 · 걷어낸 점 0",
    },
    {
      title: "T4 아래 사슬 · 점 (3,0)",
      text: "(0,0) → (0,3) → (3,0) 이 오른쪽으로 꺾여 (0,3) 을 걷어냅니다. 사슬에 점이 하나만 남아 판정 없이 (3,0) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 2",
          state: "focus",
        },
        {
          value: "순서 3",
          state: "empty",
        },
        {
          value: "순서 4",
          state: "empty",
        },
        {
          value: "순서 5",
          state: "empty",
        },
        {
          value: "순서 6",
          state: "empty",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)", "(3,0)"],
          slots: 4,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((0,0), (0,3), (3,0)) =",
        result: "-1",
      },
      vars: "방향 판정 1 / 14 · 걷어낸 점 1",
    },
    {
      title: "T5 아래 사슬 · 점 (3,2)",
      text: "(0,0) → (3,0) → (3,2) 가 왼쪽으로 꺾여 멈추고 (3,2) 를 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "read",
        },
        {
          value: "순서 1",
          state: "out",
        },
        {
          value: "순서 2",
          state: "read",
        },
        {
          value: "순서 3",
          state: "focus",
        },
        {
          value: "순서 4",
          state: "empty",
        },
        {
          value: "순서 5",
          state: "empty",
        },
        {
          value: "순서 6",
          state: "empty",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)", "(3,0)", "(3,2)"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((0,0), (3,0), (3,2)) =",
        result: "1",
      },
      vars: "방향 판정 2 / 14 · 걷어낸 점 1",
    },
    {
      title: "T6 아래 사슬 · 점 (3,4)",
      text: "(3,0) → (3,2) → (3,4) 가 한 직선 위라 (3,2) 를 걷어냅니다. (0,0) → (3,0) → (3,4) 가 왼쪽으로 꺾여 멈추고 (3,4) 를 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "read",
        },
        {
          value: "순서 1",
          state: "out",
        },
        {
          value: "순서 2",
          state: "read",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 4",
          state: "focus",
        },
        {
          value: "순서 5",
          state: "empty",
        },
        {
          value: "순서 6",
          state: "empty",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)", "(3,0)", "(3,4)"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((0,0), (3,0), (3,4)) =",
        result: "1",
      },
      vars: "방향 판정 4 / 14 · 걷어낸 점 2",
    },
    {
      title: "T7 아래 사슬 · 점 (6,0)",
      text: "(3,0) → (3,4) → (6,0) 이 오른쪽으로 꺾여 (3,4) 를 걷어냅니다. (0,0) → (3,0) → (6,0) 이 한 직선 위라 (3,0) 을 걷어냅니다. 사슬에 점이 하나만 남아 판정 없이 (6,0) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
        },
        {
          value: "순서 1",
          state: "out",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 3",
          state: "out",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 5",
          state: "focus",
        },
        {
          value: "순서 6",
          state: "empty",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)", "(6,0)"],
          slots: 4,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((0,0), (3,0), (6,0)) =",
        result: "0",
      },
      vars: "방향 판정 6 / 14 · 걷어낸 점 4",
    },
    {
      title: "T8 아래 사슬 · 점 (6,3)",
      text: "(0,0) → (6,0) → (6,3) 이 왼쪽으로 꺾여 멈추고 (6,3) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "read",
        },
        {
          value: "순서 1",
          state: "out",
        },
        {
          value: "순서 2",
          state: "out",
        },
        {
          value: "순서 3",
          state: "out",
        },
        {
          value: "순서 4",
          state: "out",
        },
        {
          value: "순서 5",
          state: "read",
        },
        {
          value: "순서 6",
          state: "focus",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "아래 사슬",
          values: ["(0,0)", "(6,0)", "(6,3)"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((0,0), (6,0), (6,3)) =",
        result: "1",
      },
      vars: "방향 판정 7 / 14 · 걷어낸 점 4",
    },
  ],
};

export const walkUpper = {
  player: "stage",
  stage: "graph",
  title: "거꾸로 읽어 위 사슬을 쌓고 두 사슬을 잇는다",
  sub: "T9–T16 · 마지막 걸음이 답을 낸다",
  result: "[[0, 0], [6, 0], [6, 3], [3, 4], [0, 3]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 4,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 0,
        y: 1,
        label: "(0,3)",
      },
      {
        id: 2,
        x: 3,
        y: 4,
        label: "(3,0)",
      },
      {
        id: 3,
        x: 3,
        y: 2,
        label: "(3,2)",
      },
      {
        id: 4,
        x: 3,
        y: 0,
        label: "(3,4)",
      },
      {
        id: 5,
        x: 6,
        y: 4,
        label: "(6,0)",
      },
      {
        id: 6,
        x: 6,
        y: 1,
        label: "(6,3)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 0,
        to: 2,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 2,
        to: 4,
      },
      {
        from: 0,
        to: 5,
      },
      {
        from: 5,
        to: 6,
      },
      {
        from: 6,
        to: 5,
      },
      {
        from: 6,
        to: 4,
      },
      {
        from: 4,
        to: 3,
      },
      {
        from: 4,
        to: 2,
      },
      {
        from: 4,
        to: 1,
      },
      {
        from: 1,
        to: 0,
      },
    ],
    directed: true,
    unit: {
      x: 64,
      y: 52,
    },
  },
  steps: [
    {
      title: "T9 위 사슬 · 점 (6,3)",
      text: "정렬 순서를 거꾸로 읽어 위 사슬을 쌓습니다. 사슬이 비어 있어 방향 판정 없이 (6,3) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "empty",
        },
        {
          value: "순서 1",
          state: "empty",
        },
        {
          value: "순서 2",
          state: "empty",
        },
        {
          value: "순서 3",
          state: "empty",
        },
        {
          value: "순서 4",
          state: "empty",
        },
        {
          value: "순서 5",
          state: "empty",
        },
        {
          value: "순서 6",
          state: "focus",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)"],
          slots: 4,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: null,
      vars: "방향 판정 7 / 14 · 걷어낸 점 4",
    },
    {
      title: "T10 위 사슬 · 점 (6,0)",
      text: "사슬에 점이 1 개뿐이라 방향 판정 없이 (6,0) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "empty",
        },
        {
          value: "순서 1",
          state: "empty",
        },
        {
          value: "순서 2",
          state: "empty",
        },
        {
          value: "순서 3",
          state: "empty",
        },
        {
          value: "순서 4",
          state: "empty",
        },
        {
          value: "순서 5",
          state: "focus",
        },
        {
          value: "순서 6",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)", "(6,0)"],
          slots: 4,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: null,
      vars: "방향 판정 7 / 14 · 걷어낸 점 4",
    },
    {
      title: "T11 위 사슬 · 점 (3,4)",
      text: "(6,3) → (6,0) → (3,4) 가 오른쪽으로 꺾여 (6,0) 을 걷어냅니다. 사슬에 점이 하나만 남아 판정 없이 (3,4) 를 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "empty",
        },
        {
          value: "순서 1",
          state: "empty",
        },
        {
          value: "순서 2",
          state: "empty",
        },
        {
          value: "순서 3",
          state: "empty",
        },
        {
          value: "순서 4",
          state: "focus",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 6",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)", "(3,4)"],
          slots: 4,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((6,3), (6,0), (3,4)) =",
        result: "-1",
      },
      vars: "방향 판정 8 / 14 · 걷어낸 점 5",
    },
    {
      title: "T12 위 사슬 · 점 (3,2)",
      text: "(6,3) → (3,4) → (3,2) 가 왼쪽으로 꺾여 멈추고 (3,2) 를 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "empty",
        },
        {
          value: "순서 1",
          state: "empty",
        },
        {
          value: "순서 2",
          state: "empty",
        },
        {
          value: "순서 3",
          state: "focus",
        },
        {
          value: "순서 4",
          state: "read",
        },
        {
          value: "순서 5",
          state: "out",
        },
        {
          value: "순서 6",
          state: "read",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)", "(3,4)", "(3,2)"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((6,3), (3,4), (3,2)) =",
        result: "1",
      },
      vars: "방향 판정 9 / 14 · 걷어낸 점 5",
    },
    {
      title: "T13 위 사슬 · 점 (3,0)",
      text: "(3,4) → (3,2) → (3,0) 이 한 직선 위라 (3,2) 를 걷어냅니다. (6,3) → (3,4) → (3,0) 이 왼쪽으로 꺾여 멈추고 (3,0) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "empty",
        },
        {
          value: "순서 1",
          state: "empty",
        },
        {
          value: "순서 2",
          state: "focus",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 4",
          state: "read",
        },
        {
          value: "순서 5",
          state: "out",
        },
        {
          value: "순서 6",
          state: "read",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)", "(3,4)", "(3,0)"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((6,3), (3,4), (3,0)) =",
        result: "1",
      },
      vars: "방향 판정 11 / 14 · 걷어낸 점 6",
    },
    {
      title: "T14 위 사슬 · 점 (0,3)",
      text: "(3,4) → (3,0) → (0,3) 이 오른쪽으로 꺾여 (3,0) 을 걷어냅니다. (6,3) → (3,4) → (0,3) 이 왼쪽으로 꺾여 멈추고 (0,3) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "empty",
        },
        {
          value: "순서 1",
          state: "focus",
        },
        {
          value: "걷어냄",
          state: "read",
        },
        {
          value: "순서 3",
          state: "out",
        },
        {
          value: "순서 4",
          state: "read",
        },
        {
          value: "순서 5",
          state: "out",
        },
        {
          value: "순서 6",
          state: "read",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)", "(3,4)", "(0,3)"],
          slots: 4,
          states: {
            "0": "read",
            "1": "read",
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((6,3), (3,4), (0,3)) =",
        result: "1",
      },
      vars: "방향 판정 13 / 14 · 걷어낸 점 7",
    },
    {
      title: "T15 위 사슬 · 점 (0,0)",
      text: "(3,4) → (0,3) → (0,0) 이 왼쪽으로 꺾여 멈추고 (0,0) 을 담습니다.",
      nodes: [
        {
          value: "순서 0",
          state: "focus",
        },
        {
          value: "순서 1",
          state: "read",
        },
        {
          value: "순서 2",
          state: "out",
        },
        {
          value: "순서 3",
          state: "out",
        },
        {
          value: "순서 4",
          state: "read",
        },
        {
          value: "순서 5",
          state: "out",
        },
        {
          value: "순서 6",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {},
        {},
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "위 사슬",
          values: ["(6,3)", "(3,4)", "(0,3)", "(0,0)"],
          slots: 4,
          states: {
            "1": "read",
            "2": "read",
            "3": "focus",
          },
        },
      ],
      calc: {
        expr: "sideOf((3,4), (0,3), (0,0)) =",
        result: "1",
      },
      vars: "방향 판정 14 / 14 · 걷어낸 점 7",
    },
    {
      title: "T16 두 사슬의 마지막 점을 떼고 잇는다",
      text: "아래 사슬의 마지막 점 (6,3) 은 위 사슬의 첫 점과 같고, 위 사슬의 마지막 점 (0,0) 은 아래 사슬의 첫 점과 같습니다. 두 점을 하나씩 떼고 이으면 꼭짓점 5 개가 반시계 방향으로 남습니다.",
      nodes: [
        {
          value: "꼭짓점",
          state: "focus",
        },
        {
          value: "꼭짓점",
          state: "focus",
        },
        {
          value: "변 위",
          state: "out",
        },
        {
          value: "안쪽",
          state: "out",
        },
        {
          value: "꼭짓점",
          state: "focus",
        },
        {
          value: "꼭짓점",
          state: "focus",
        },
        {
          value: "꼭짓점",
          state: "focus",
        },
      ],
      edges: [
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          hidden: true,
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
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: ["(0,0)", "(6,0)", "(6,3)", "(3,4)", "(0,3)"],
          slots: 4,
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
          },
        },
      ],
      calc: null,
      vars: "방향 판정 14 / 14 · 걷어낸 점 7",
    },
  ],
};
