/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. `areaWalk` 는 L 자 여섯 변을 앞으로 읽는
 * T1~T7, `areaReverse` 는 꼭짓점 차례를 뒤집은 L 자를 읽는 T8~T14 다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 꼭짓점은 정점이고 그 자리(`layout`)는 점의 좌표 그대로다(화면 아래로 갈수록 커지는
 * `y` 만 뒤집었다 — `convexHull` · `segmentsIntersect` · `pointInPolygon` 편과 같은 약속). 다각형의 변
 * 여섯은 굵은 실선 간선이고 화살촉이 변의 방향이다. 원점에서 꼭짓점으로 가는 대시 간선은 이번 걸음의
 * 삼각형의 옆변이고, 삼각형이 납작한 걸음에서는 뺀다. 무대 아래 띠 둘은 변마다의 항과 그 변까지의 누적
 * `twice` 다.
 *
 * **옛 패널에서 옮겼다.** 옛 패널은 `keyValue` 뷰 하나에 이름 붙은 값 넷(`a` · `b` · `t` · `twice`)을
 * 늘어놓았고, 다각형이 평면 어디에 놓였는지는 본문의 글자 격자가 졌다. 지금은 무대가 다각형과 이번 걸음의
 * 삼각형을 그리고, `a` · `b` 는 읽은 정점이, `t` 는 계산 알약과 띠가, `twice` 는 띠와 남는 변수가 싣는다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 반복을
 * 기록한 것에서 낸 결과를 옮긴 것이고, 둘이 같은지는 `polygonArea-guide.test.ts` 가 잰다.
 */

export const areaWalk = {
  player: "stage",
  stage: "graph",
  title:
    "L 자 여섯 변을 차례로 읽어 2 배 넓이를 쌓는다 — 대시는 이번 삼각형의 옆변",
  sub: "T1–T7",
  result: "12",
  layout: {
    nodes: [
      {
        id: "p0_0",
        x: 0,
        y: 4,
        label: "(0,0) 원점",
      },
      {
        id: "p4_0",
        x: 4,
        y: 4,
        label: "(4,0)",
      },
      {
        id: "p4_2",
        x: 4,
        y: 2,
        label: "(4,2)",
      },
      {
        id: "p2_2",
        x: 2,
        y: 2,
        label: "(2,2)",
      },
      {
        id: "p2_4",
        x: 2,
        y: 0,
        label: "(2,4)",
      },
      {
        id: "p0_4",
        x: 0,
        y: 0,
        label: "(0,4)",
      },
    ],
    edges: [
      {
        from: "p0_0",
        to: "p4_0",
      },
      {
        from: "p4_0",
        to: "p4_2",
      },
      {
        from: "p4_2",
        to: "p2_2",
      },
      {
        from: "p2_2",
        to: "p2_4",
      },
      {
        from: "p2_4",
        to: "p0_4",
      },
      {
        from: "p0_4",
        to: "p0_0",
      },
      {
        from: "p0_0",
        to: "p4_2",
      },
      {
        from: "p0_0",
        to: "p2_2",
      },
      {
        from: "p0_0",
        to: "p2_4",
      },
    ],
    directed: true,
    unit: {
      x: 72,
      y: 56,
    },
  },
  steps: [
    {
      title: "T1 e1 (0,0)-(4,0) — 항 0",
      text: "e1 은 (0,0)-(4,0) 입니다. 원점과 두 끝점이 한 직선 위라 삼각형이 납작해서 항이 0 이고, twice 는 그대로 0 입니다.",
      nodes: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "e1 t = 0",
        },
        {
          kind: "tree",
          state: "out",
          label: "e2",
        },
        {
          kind: "tree",
          state: "out",
          label: "e3",
        },
        {
          kind: "tree",
          state: "out",
          label: "e4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
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
          label: "항 t",
          values: ["0", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
        {
          label: "twice",
          values: ["0", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "0·0 − 4·0 =",
        result: "0",
      },
      vars: "twice 0 → 0",
    },
    {
      title: "T2 e2 (4,0)-(4,2) — 항 8",
      text: "e2 는 (4,0)-(4,2) 입니다. 원점에서 두 끝점을 반시계 방향으로 읽는 삼각형이라 항이 8 이 되고, twice 가 0 에서 8 로 바뀝니다.",
      nodes: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 0",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e2 t = 8",
        },
        {
          kind: "tree",
          state: "out",
          label: "e3",
        },
        {
          kind: "tree",
          state: "out",
          label: "e4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          kind: "back",
          state: "read",
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
          label: "항 t",
          values: ["0", "8", "", "", "", ""],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "twice",
          values: ["0", "8", "", "", "", ""],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "4·2 − 4·0 =",
        result: "8",
      },
      vars: "twice 0 → 8",
    },
    {
      title: "T3 e3 (4,2)-(2,2) — 항 4",
      text: "e3 은 (4,2)-(2,2) 입니다. 원점에서 두 끝점을 반시계 방향으로 읽는 삼각형이라 항이 4 가 되고, twice 가 8 에서 12 로 바뀝니다.",
      nodes: [
        {
          state: "read",
        },
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 0",
        },
        {
          kind: "tree",
          label: "e2 8",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e3 t = 4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "항 t",
          values: ["0", "8", "4", "", "", ""],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
        {
          label: "twice",
          values: ["0", "8", "12", "", "", ""],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "4·2 − 2·2 =",
        result: "4",
      },
      vars: "twice 8 → 12",
    },
    {
      title: "T4 e4 (2,2)-(2,4) — 항 4",
      text: "e4 는 (2,2)-(2,4) 입니다. 원점에서 두 끝점을 반시계 방향으로 읽는 삼각형이라 항이 4 가 되고, twice 가 12 에서 16 으로 바뀝니다.",
      nodes: [
        {
          state: "read",
        },
        {},
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 0",
        },
        {
          kind: "tree",
          label: "e2 8",
        },
        {
          kind: "tree",
          label: "e3 4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e4 t = 4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "항 t",
          values: ["0", "8", "4", "4", "", ""],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
        {
          label: "twice",
          values: ["0", "8", "12", "16", "", ""],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
      ],
      calc: {
        expr: "2·4 − 2·2 =",
        result: "4",
      },
      vars: "twice 12 → 16",
    },
    {
      title: "T5 e5 (2,4)-(0,4) — 항 8",
      text: "e5 는 (2,4)-(0,4) 입니다. 원점에서 두 끝점을 반시계 방향으로 읽는 삼각형이라 항이 8 이 되고, twice 가 16 에서 24 로 바뀝니다.",
      nodes: [
        {
          state: "read",
        },
        {},
        {},
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 0",
        },
        {
          kind: "tree",
          label: "e2 8",
        },
        {
          kind: "tree",
          label: "e3 4",
        },
        {
          kind: "tree",
          label: "e4 4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e5 t = 8",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "항 t",
          values: ["0", "8", "4", "4", "8", ""],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
        {
          label: "twice",
          values: ["0", "8", "12", "16", "24", ""],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
      ],
      calc: {
        expr: "2·4 − 0·4 =",
        result: "8",
      },
      vars: "twice 16 → 24",
    },
    {
      title: "T6 e6 (0,4)-(0,0) — 항 0",
      text: "e6 은 (0,4)-(0,0) 입니다. 원점과 두 끝점이 한 직선 위라 삼각형이 납작해서 항이 0 이고, twice 는 그대로 24 입니다.",
      nodes: [
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 0",
        },
        {
          kind: "tree",
          label: "e2 8",
        },
        {
          kind: "tree",
          label: "e3 4",
        },
        {
          kind: "tree",
          label: "e4 4",
        },
        {
          kind: "tree",
          label: "e5 8",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e6 t = 0",
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
          label: "항 t",
          values: ["0", "8", "4", "4", "8", "0"],
          slots: 6,
          states: {
            "5": "focus",
          },
        },
        {
          label: "twice",
          values: ["0", "8", "12", "16", "24", "24"],
          slots: 6,
          states: {
            "5": "focus",
          },
        },
      ],
      calc: {
        expr: "0·0 − 0·4 =",
        result: "0",
      },
      vars: "twice 24 → 24",
    },
    {
      title: "T7 반복문이 끝났다 — 답 12",
      text: "twice < 0n 이 거짓이라 그대로 두어 size 가 24 가 되고, 배정밀도로 옮겨 2 로 나눈 12 가 답입니다.",
      nodes: [{}, {}, {}, {}, {}, {}],
      edges: [
        {
          kind: "tree",
          label: "e1 0",
        },
        {
          kind: "tree",
          label: "e2 8",
        },
        {
          kind: "tree",
          label: "e3 4",
        },
        {
          kind: "tree",
          label: "e4 4",
        },
        {
          kind: "tree",
          label: "e5 8",
        },
        {
          kind: "tree",
          label: "e6 0",
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
          label: "항 t",
          values: ["0", "8", "4", "4", "8", "0"],
          slots: 6,
          states: {},
        },
        {
          label: "twice",
          values: ["0", "8", "12", "16", "24", "24"],
          slots: 6,
          states: {
            "5": "focus",
          },
        },
      ],
      calc: {
        expr: "|24| / 2 =",
        result: "12",
      },
      vars: "size 24",
    },
  ],
};

export const areaReverse = {
  player: "stage",
  stage: "graph",
  title: "꼭짓점 차례를 뒤집은 L 자 — 항의 부호가 모두 뒤집힌다",
  sub: "T8–T14",
  result: "12",
  layout: {
    nodes: [
      {
        id: "p0_4",
        x: 0,
        y: 0,
        label: "(0,4)",
      },
      {
        id: "p2_4",
        x: 2,
        y: 0,
        label: "(2,4)",
      },
      {
        id: "p2_2",
        x: 2,
        y: 2,
        label: "(2,2)",
      },
      {
        id: "p4_2",
        x: 4,
        y: 2,
        label: "(4,2)",
      },
      {
        id: "p4_0",
        x: 4,
        y: 4,
        label: "(4,0)",
      },
      {
        id: "p0_0",
        x: 0,
        y: 4,
        label: "(0,0) 원점",
      },
    ],
    edges: [
      {
        from: "p0_4",
        to: "p2_4",
      },
      {
        from: "p2_4",
        to: "p2_2",
      },
      {
        from: "p2_2",
        to: "p4_2",
      },
      {
        from: "p4_2",
        to: "p4_0",
      },
      {
        from: "p4_0",
        to: "p0_0",
      },
      {
        from: "p0_0",
        to: "p0_4",
      },
      {
        from: "p0_0",
        to: "p2_4",
      },
      {
        from: "p0_0",
        to: "p2_2",
      },
      {
        from: "p0_0",
        to: "p4_2",
      },
    ],
    directed: true,
    unit: {
      x: 72,
      y: 56,
    },
  },
  steps: [
    {
      title: "T8 e1 (0,4)-(2,4) — 항 -8",
      text: "e1 은 (0,4)-(2,4) 입니다. 원점에서 두 끝점을 시계 방향으로 읽는 삼각형이라 항이 -8 이 되고, twice 가 0 에서 -8 로 바뀝니다.",
      nodes: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "e1 t = -8",
        },
        {
          kind: "tree",
          state: "out",
          label: "e2",
        },
        {
          kind: "tree",
          state: "out",
          label: "e3",
        },
        {
          kind: "tree",
          state: "out",
          label: "e4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          kind: "back",
          state: "read",
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
          label: "항 t",
          values: ["-8", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
        {
          label: "twice",
          values: ["-8", "", "", "", "", ""],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "0·4 − 2·4 =",
        result: "-8",
      },
      vars: "twice 0 → -8",
    },
    {
      title: "T9 e2 (2,4)-(2,2) — 항 -4",
      text: "e2 는 (2,4)-(2,2) 입니다. 원점에서 두 끝점을 시계 방향으로 읽는 삼각형이라 항이 -4 가 되고, twice 가 -8 에서 -12 로 바뀝니다.",
      nodes: [
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 -8",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e2 t = -4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e3",
        },
        {
          kind: "tree",
          state: "out",
          label: "e4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          hidden: true,
        },
      ],
      strips: [
        {
          label: "항 t",
          values: ["-8", "-4", "", "", "", ""],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "twice",
          values: ["-8", "-12", "", "", "", ""],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "2·2 − 2·4 =",
        result: "-4",
      },
      vars: "twice -8 → -12",
    },
    {
      title: "T10 e3 (2,2)-(4,2) — 항 -4",
      text: "e3 은 (2,2)-(4,2) 입니다. 원점에서 두 끝점을 시계 방향으로 읽는 삼각형이라 항이 -4 가 되고, twice 가 -12 에서 -16 으로 바뀝니다.",
      nodes: [
        {},
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 -8",
        },
        {
          kind: "tree",
          label: "e2 -4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e3 t = -4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e4",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "항 t",
          values: ["-8", "-4", "-4", "", "", ""],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
        {
          label: "twice",
          values: ["-8", "-12", "-16", "", "", ""],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "2·2 − 4·2 =",
        result: "-4",
      },
      vars: "twice -12 → -16",
    },
    {
      title: "T11 e4 (4,2)-(4,0) — 항 -8",
      text: "e4 는 (4,2)-(4,0) 입니다. 원점에서 두 끝점을 시계 방향으로 읽는 삼각형이라 항이 -8 이 되고, twice 가 -16 에서 -24 로 바뀝니다.",
      nodes: [
        {},
        {},
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 -8",
        },
        {
          kind: "tree",
          label: "e2 -4",
        },
        {
          kind: "tree",
          label: "e3 -4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e4 t = -8",
        },
        {
          kind: "tree",
          state: "out",
          label: "e5",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
        },
        {
          hidden: true,
        },
        {
          hidden: true,
        },
        {
          kind: "back",
          state: "read",
        },
      ],
      strips: [
        {
          label: "항 t",
          values: ["-8", "-4", "-4", "-8", "", ""],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
        {
          label: "twice",
          values: ["-8", "-12", "-16", "-24", "", ""],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
      ],
      calc: {
        expr: "4·0 − 4·2 =",
        result: "-8",
      },
      vars: "twice -16 → -24",
    },
    {
      title: "T12 e5 (4,0)-(0,0) — 항 0",
      text: "e5 는 (4,0)-(0,0) 입니다. 원점과 두 끝점이 한 직선 위라 삼각형이 납작해서 항이 0 이고, twice 는 그대로 -24 입니다.",
      nodes: [
        {},
        {},
        {},
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 -8",
        },
        {
          kind: "tree",
          label: "e2 -4",
        },
        {
          kind: "tree",
          label: "e3 -4",
        },
        {
          kind: "tree",
          label: "e4 -8",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e5 t = 0",
        },
        {
          kind: "tree",
          state: "out",
          label: "e6",
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
          label: "항 t",
          values: ["-8", "-4", "-4", "-8", "0", ""],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
        {
          label: "twice",
          values: ["-8", "-12", "-16", "-24", "-24", ""],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
      ],
      calc: {
        expr: "4·0 − 0·0 =",
        result: "0",
      },
      vars: "twice -24 → -24",
    },
    {
      title: "T13 e6 (0,0)-(0,4) — 항 0",
      text: "e6 은 (0,0)-(0,4) 입니다. 원점과 두 끝점이 한 직선 위라 삼각형이 납작해서 항이 0 이고, twice 는 그대로 -24 입니다.",
      nodes: [
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "e1 -8",
        },
        {
          kind: "tree",
          label: "e2 -4",
        },
        {
          kind: "tree",
          label: "e3 -4",
        },
        {
          kind: "tree",
          label: "e4 -8",
        },
        {
          kind: "tree",
          label: "e5 0",
        },
        {
          kind: "tree",
          state: "focus",
          label: "e6 t = 0",
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
          label: "항 t",
          values: ["-8", "-4", "-4", "-8", "0", "0"],
          slots: 6,
          states: {
            "5": "focus",
          },
        },
        {
          label: "twice",
          values: ["-8", "-12", "-16", "-24", "-24", "-24"],
          slots: 6,
          states: {
            "5": "focus",
          },
        },
      ],
      calc: {
        expr: "0·4 − 0·0 =",
        result: "0",
      },
      vars: "twice -24 → -24",
    },
    {
      title: "T14 반복문이 끝났다 — 답 12",
      text: "twice < 0n 이 참이라 부호를 뒤집어 size 가 24 가 되고, 배정밀도로 옮겨 2 로 나눈 12 가 답입니다.",
      nodes: [{}, {}, {}, {}, {}, {}],
      edges: [
        {
          kind: "tree",
          label: "e1 -8",
        },
        {
          kind: "tree",
          label: "e2 -4",
        },
        {
          kind: "tree",
          label: "e3 -4",
        },
        {
          kind: "tree",
          label: "e4 -8",
        },
        {
          kind: "tree",
          label: "e5 0",
        },
        {
          kind: "tree",
          label: "e6 0",
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
          label: "항 t",
          values: ["-8", "-4", "-4", "-8", "0", "0"],
          slots: 6,
          states: {},
        },
        {
          label: "twice",
          values: ["-8", "-12", "-16", "-24", "-24", "-24"],
          slots: 6,
          states: {
            "5": "focus",
          },
        },
      ],
      calc: {
        expr: "|-24| / 2 =",
        result: "12",
      },
      vars: "size 24",
    },
  ],
};
