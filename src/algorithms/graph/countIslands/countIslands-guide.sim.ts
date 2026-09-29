/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 걸음은 셋이다 — 바깥 반복이 새 섬을 시작한다 ·
 * 스택에서 칸 하나를 꺼내 이웃 넷을 본다 · 바깥 반복이 이어서 건너뛴 칸들(한 걸음으로 묶는다).
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 격자의 칸 열둘을 격자 자리 그대로 정점으로 놓고(`x` 는 열, `y` 는 행), 변을
 * 공유하는 두 땅 칸 사이에만 간선을 긋는다(`layout`). 걸음마다 바뀌는 것은 정점의 값(섬 번호 · 땅 ·
 * 물)과 상태, 간선의 종류(처음 보는 땅을 담을 때 쓴 간선은 굵은 실선)와 상태, 무대 아래 스택 띠뿐이다
 * (`src/_viz/player/graphStage.ts`). 물 칸은 「이번 걸음 밖」, 표시가 아직 없는 땅은 「아직」이다.
 * `islands` 는 무대에 자리가 없어 남는 변수로 둔다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `countIslands-guide.test.ts` 가 잰다.
 */
export const islandScan = {
  player: "stage",
  stage: "graph",
  title: "countIslands([[1,1,0,1],[1,0,0,1],[0,0,1,0]]) — 정점 안은 섬 번호",
  sub: "T1–T12 · 걸음마다 새 섬 시작 · 꺼내기 하나 · 건너뛰기 묶음 하나",
  result: "3",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0,
        label: "(0,0)",
      },
      {
        id: 1,
        x: 1,
        y: 0,
        label: "(0,1)",
      },
      {
        id: 2,
        x: 2,
        y: 0,
        label: "(0,2)",
      },
      {
        id: 3,
        x: 3,
        y: 0,
        label: "(0,3)",
      },
      {
        id: 4,
        x: 0,
        y: 1,
        label: "(1,0)",
      },
      {
        id: 5,
        x: 1,
        y: 1,
        label: "(1,1)",
      },
      {
        id: 6,
        x: 2,
        y: 1,
        label: "(1,2)",
      },
      {
        id: 7,
        x: 3,
        y: 1,
        label: "(1,3)",
      },
      {
        id: 8,
        x: 0,
        y: 2,
        label: "(2,0)",
      },
      {
        id: 9,
        x: 1,
        y: 2,
        label: "(2,1)",
      },
      {
        id: 10,
        x: 2,
        y: 2,
        label: "(2,2)",
      },
      {
        id: 11,
        x: 3,
        y: 2,
        label: "(2,3)",
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 0,
        to: 4,
      },
      {
        from: 3,
        to: 7,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 (0,0) — 새 섬 1 시작",
      text: "땅이고 표시가 없는 칸이라 ② 로 갑니다. islands 를 1 로 올리고, 이 칸에 표시를 켠 뒤 스택에 담습니다.",
      nodes: [
        {
          value: "섬 1",
          state: "focus",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [{}, {}, {}],
      strips: [
        {
          label: "스택",
          values: ["(0,0)"],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "islands =",
        result: "1",
      },
      vars: "islands = 1",
    },
    {
      title: "T2 (0,0) 꺼내기 — 이웃 넷 확인",
      text: "이웃 넷 가운데 격자 밖이 2 개, 물이 0 개, 이미 표시된 칸이 0 개, 처음 보는 땅이 2 개입니다. 처음 보는 땅 (1,0) (0,1) 에 표시를 켜고 스택에 담습니다.",
      nodes: [
        {
          value: "섬 1",
          state: "read",
        },
        {
          value: "섬 1",
          state: "focus",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "섬 1",
          state: "focus",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
      ],
      strips: [
        {
          label: "스택",
          values: ["(1,0)", "(0,1)"],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "stack.pop() =",
        result: "(0,0)",
      },
      vars: "islands = 1",
    },
    {
      title: "T3 (0,1) 꺼내기 — 이웃 넷 확인",
      text: "이웃 넷 가운데 격자 밖이 1 개, 물이 2 개, 이미 표시된 칸이 1 개, 처음 보는 땅이 0 개입니다. 담는 칸이 없습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
          state: "read",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
        },
        {},
      ],
      strips: [
        {
          label: "스택",
          values: ["(1,0)"],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "stack.pop() =",
        result: "(0,1)",
      },
      vars: "islands = 1",
    },
    {
      title: "T4 (1,0) 꺼내기 — 이웃 넷 확인",
      text: "이웃 넷 가운데 격자 밖이 1 개, 물이 2 개, 이미 표시된 칸이 1 개, 처음 보는 땅이 0 개입니다. 담는 칸이 없습니다. 스택이 비어 섬 1 의 표시가 끝납니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "섬 1",
          state: "read",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
        {},
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "stack.pop() =",
        result: "(1,0)",
      },
      vars: "islands = 1",
    },
    {
      title: "T5 바깥 반복 — (0,1) (0,2) 건너뛰기",
      text: "물 칸 1 개와 이미 표시된 땅 칸 1 개라 ① 로 건너뜁니다. 새 섬을 시작하지 않습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
          state: "read",
        },
        {
          value: "물",
          state: "read",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "건너뛴 칸 =",
        result: "2 개",
      },
      vars: "islands = 1",
    },
    {
      title: "T6 (0,3) — 새 섬 2 시작",
      text: "땅이고 표시가 없는 칸이라 ② 로 갑니다. islands 를 2 로 올리고, 이 칸에 표시를 켠 뒤 스택에 담습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
          state: "focus",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
      ],
      strips: [
        {
          label: "스택",
          values: ["(0,3)"],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "islands =",
        result: "2",
      },
      vars: "islands = 2",
    },
    {
      title: "T7 (0,3) 꺼내기 — 이웃 넷 확인",
      text: "이웃 넷 가운데 격자 밖이 2 개, 물이 1 개, 이미 표시된 칸이 0 개, 처음 보는 땅이 1 개입니다. 처음 보는 땅 (1,3) 에 표시를 켜고 스택에 담습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
          state: "read",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
          state: "focus",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
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
          label: "스택",
          values: ["(1,3)"],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "stack.pop() =",
        result: "(0,3)",
      },
      vars: "islands = 2",
    },
    {
      title: "T8 (1,3) 꺼내기 — 이웃 넷 확인",
      text: "이웃 넷 가운데 격자 밖이 1 개, 물이 2 개, 이미 표시된 칸이 1 개, 처음 보는 땅이 0 개입니다. 담는 칸이 없습니다. 스택이 비어 섬 2 의 표시가 끝납니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
          state: "read",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "stack.pop() =",
        result: "(1,3)",
      },
      vars: "islands = 2",
    },
    {
      title: "T9 바깥 반복 — (1,0) (1,1) (1,2) (1,3) (2,0) (2,1) 건너뛰기",
      text: "물 칸 4 개와 이미 표시된 땅 칸 2 개라 ① 로 건너뜁니다. 새 섬을 시작하지 않습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "섬 1",
          state: "read",
        },
        {
          value: "물",
          state: "read",
        },
        {
          value: "물",
          state: "read",
        },
        {
          value: "섬 2",
          state: "read",
        },
        {
          value: "물",
          state: "read",
        },
        {
          value: "물",
          state: "read",
        },
        {
          value: "땅",
          state: "empty",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "건너뛴 칸 =",
        result: "6 개",
      },
      vars: "islands = 2",
    },
    {
      title: "T10 (2,2) — 새 섬 3 시작",
      text: "땅이고 표시가 없는 칸이라 ② 로 갑니다. islands 를 3 으로 올리고, 이 칸에 표시를 켠 뒤 스택에 담습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 3",
          state: "focus",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "스택",
          values: ["(2,2)"],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "islands =",
        result: "3",
      },
      vars: "islands = 3",
    },
    {
      title: "T11 (2,2) 꺼내기 — 이웃 넷 확인",
      text: "이웃 넷 가운데 격자 밖이 1 개, 물이 3 개, 이미 표시된 칸이 0 개, 처음 보는 땅이 0 개입니다. 담는 칸이 없습니다. 스택이 비어 섬 3 의 표시가 끝납니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 3",
          state: "read",
        },
        {
          value: "물",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "stack.pop() =",
        result: "(2,2)",
      },
      vars: "islands = 3",
    },
    {
      title: "T12 바깥 반복 — (2,3) 건너뛰기",
      text: "물 칸 1 개라 ① 로 건너뜁니다. 새 섬을 시작하지 않습니다.",
      nodes: [
        {
          value: "섬 1",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "섬 1",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 2",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "물",
          state: "out",
        },
        {
          value: "섬 3",
        },
        {
          value: "물",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "건너뛴 칸 =",
        result: "1 개",
      },
      vars: "islands = 3",
    },
  ],
};
