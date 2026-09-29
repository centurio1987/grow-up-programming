/**
 * 걸음 재생 패널 두 벌 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임
 * 제목은 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 첫 벌은 정점 0 에서 시작한 탐색(T1~T13),
 * 둘째 벌은 정점 5 에서 시작한 탐색과 반환(T14~T17)이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(`disc / low`)과
 * 상태, 간선의 종류와 상태, 끊어 낸 강한 연결 요소(`groups`), 두 스택(`strips`)만 바꾼다
 * (`src/_viz/player/graphStage.ts`).
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `stronglyConnectedComponents-guide.test.ts` 가 잰다.
 */

export const walkFirst = {
  player: "stage",
  stage: "graph",
  title: "정점 0 에서 시작한 탐색 — 정점 안의 두 수는 disc / low",
  sub: "T1–T13 · 걸음마다 간선 하나 또는 정점 하나",
  result: "[[3, 4], [0, 1, 2]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0,
      },
      {
        id: 1,
        x: 0,
        y: 2,
      },
      {
        id: 2,
        x: 1.3,
        y: 1,
      },
      {
        id: 3,
        x: 2.7,
        y: 1,
      },
      {
        id: 4,
        x: 4.1,
        y: 1,
      },
      {
        id: 5,
        x: 2.7,
        y: -0.6,
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 2,
      },
      {
        from: 2,
        to: 0,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
      {
        from: 4,
        to: 3,
      },
      {
        from: 5,
        to: 3,
      },
    ],
  },
  steps: [
    {
      title: "T1 준비",
      text: "이웃 목록을 만들고 disc · low 를 모두 -1 로 둡니다. 아직 들어간 정점이 없어 두 스택이 비어 있습니다.",
      nodes: [
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
      ],
      calc: null,
      vars: "timer = 0 · 읽은 간선 0 / 7",
    },
    {
      title: "T2 정점 0 에 들어간다",
      text: "바깥 반복이 아직 안 본 정점 0 을 찾아 들어갑니다. 발견 순서 0 을 disc 와 low 에 함께 적고 두 스택에 담습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
        {
          label: "호출 스택",
          values: [0],
          slots: 6,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "disc[0] = low[0] = timer =",
        result: "0",
      },
      vars: "timer = 1 · 읽은 간선 0 / 7",
    },
    {
      title: "T3 간선 0→1 로 내려간다",
      text: "정점 0 의 이웃 1 이 처음 보는 정점이라 내려갑니다. disc 와 low 에 1 을 적고 두 스택에 담습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "disc[1] = low[1] = timer =",
        result: "1",
      },
      vars: "timer = 2 · 읽은 간선 1 / 7",
    },
    {
      title: "T4 간선 1→2 로 내려간다",
      text: "정점 1 의 이웃 2 가 처음 보는 정점이라 내려갑니다. disc 와 low 에 2 를 적고 두 스택에 담습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
          state: "read",
        },
        {
          value: "2 / 2",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "read",
          },
        },
      ],
      calc: {
        expr: "disc[2] = low[2] = timer =",
        result: "2",
      },
      vars: "timer = 3 · 읽은 간선 2 / 7",
    },
    {
      title: "T5 간선 2→0 — 스택 위 정점",
      text: "정점 0 이 아직 스택에 있어 low[2] 를 disc[0] = 0 과 비교해 줄입니다. 정점 2 에서 정점 0 으로 되돌아갈 수 있다는 기록입니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 0",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
          state: "focus",
        },
        {},
        {},
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "read",
          },
        },
      ],
      calc: {
        expr: "low[2] = min(2, disc[0]) =",
        result: "0",
      },
      vars: "timer = 3 · 읽은 간선 3 / 7",
    },
    {
      title: "T6 간선 2→3 으로 내려간다",
      text: "정점 2 의 이웃 3 이 처음 보는 정점이라 내려갑니다. disc 와 low 에 3 을 적고 두 스택에 담습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 0",
          state: "read",
        },
        {
          value: "3 / 3",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
        {
          label: "호출 스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "read",
          },
        },
      ],
      calc: {
        expr: "disc[3] = low[3] = timer =",
        result: "3",
      },
      vars: "timer = 4 · 읽은 간선 4 / 7",
    },
    {
      title: "T7 간선 3→4 로 내려간다",
      text: "정점 3 의 이웃 4 가 처음 보는 정점이라 내려갑니다. disc 와 low 에 4 를 적고 두 스택에 담습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
          state: "read",
        },
        {
          value: "4 / 4",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
        {
          label: "호출 스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
          states: {
            "4": "read",
          },
        },
      ],
      calc: {
        expr: "disc[4] = low[4] = timer =",
        result: "4",
      },
      vars: "timer = 5 · 읽은 간선 5 / 7",
    },
    {
      title: "T8 간선 4→3 — 스택 위 정점",
      text: "정점 3 이 아직 스택에 있어 low[4] 를 disc[3] = 3 과 비교해 줄입니다. 정점 4 에서 정점 3 으로 되돌아갈 수 있다는 기록입니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
          state: "read",
        },
        {
          value: "4 / 3",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
          state: "focus",
        },
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
          states: {
            "4": "read",
          },
        },
      ],
      calc: {
        expr: "low[4] = min(4, disc[3]) =",
        result: "3",
      },
      vars: "timer = 5 · 읽은 간선 6 / 7",
    },
    {
      title: "T9 정점 4 를 끝낸다",
      text: "정점 4 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[4] = 3 을 부모 3 에게 넘기고, low[4] 가 disc[4] 보다 작아 뿌리가 아닙니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
          state: "read",
        },
        {
          value: "4 / 3",
          state: "read",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "back",
        },
        {},
      ],
      groups: [],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "read",
          },
        },
      ],
      calc: {
        expr: "low[3] = min(3, low[4]) =",
        result: "3",
      },
      vars: "timer = 5 · 읽은 간선 6 / 7",
    },
    {
      title: "T10 정점 3 을 끝내고 끊는다",
      text: "low[3] = disc[3] = 3 이라 정점 3 이 뿌리입니다. 스택에서 3 이 나올 때까지 빼서 정점 3 · 4 를 한 강한 연결 요소로 끊습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 0",
          state: "read",
        },
        {
          value: "3 / 3",
          state: "read",
        },
        {
          value: "4 / 3",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
        },
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {},
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "read",
          },
        },
      ],
      calc: {
        expr: "low[3] = disc[3] =",
        result: "3",
      },
      vars: "timer = 5 · 읽은 간선 6 / 7",
    },
    {
      title: "T11 정점 2 를 끝낸다",
      text: "정점 2 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[2] = 0 을 부모 1 에게 넘기고, low[2] 가 disc[2] 보다 작아 뿌리가 아닙니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 0",
          state: "focus",
        },
        {
          value: "2 / 0",
          state: "read",
        },
        {
          value: "3 / 3",
        },
        {
          value: "4 / 3",
        },
        {
          value: "",
          state: "empty",
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
        {
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {},
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "low[1] = min(1, low[2]) =",
        result: "0",
      },
      vars: "timer = 5 · 읽은 간선 6 / 7",
    },
    {
      title: "T12 정점 1 을 끝낸다",
      text: "정점 1 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[1] = 0 을 부모 0 에게 넘기고, low[1] 이 disc[1] 보다 작아 뿌리가 아닙니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 0",
          state: "read",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
        },
        {
          value: "4 / 3",
        },
        {
          value: "",
          state: "empty",
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
        {
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {},
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [0, 1, 2],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [0],
          slots: 6,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "low[0] = min(0, low[1]) =",
        result: "0",
      },
      vars: "timer = 5 · 읽은 간선 6 / 7",
    },
    {
      title: "T13 정점 0 을 끝내고 끊는다",
      text: "low[0] = disc[0] = 0 이라 정점 0 이 뿌리입니다. 스택에서 0 이 나올 때까지 빼서 정점 0 · 1 · 2 를 한 강한 연결 요소로 끊습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
        },
        {
          value: "4 / 3",
        },
        {
          value: "",
          state: "empty",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {},
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
        {
          members: [0, 1, 2],
          label: "[0, 1, 2]",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
      ],
      calc: {
        expr: "low[0] = disc[0] =",
        result: "0",
      },
      vars: "timer = 5 · 읽은 간선 6 / 7",
    },
  ],
};

export const walkSecond = {
  player: "stage",
  stage: "graph",
  title: "정점 5 에서 시작한 탐색과 반환 — 정점 안의 두 수는 disc / low",
  sub: "T14–T17",
  result: "[[0, 1, 2], [3, 4], [5]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0,
      },
      {
        id: 1,
        x: 0,
        y: 2,
      },
      {
        id: 2,
        x: 1.3,
        y: 1,
      },
      {
        id: 3,
        x: 2.7,
        y: 1,
      },
      {
        id: 4,
        x: 4.1,
        y: 1,
      },
      {
        id: 5,
        x: 2.7,
        y: -0.6,
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 2,
      },
      {
        from: 2,
        to: 0,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
      {
        from: 4,
        to: 3,
      },
      {
        from: 5,
        to: 3,
      },
    ],
  },
  steps: [
    {
      title: "T14 정점 5 에 들어간다",
      text: "바깥 반복이 아직 안 본 정점 5 를 찾아 들어갑니다. 발견 순서 5 를 disc 와 low 에 함께 적고 두 스택에 담습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
        },
        {
          value: "4 / 3",
        },
        {
          value: "5 / 5",
          state: "focus",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {},
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
        {
          members: [0, 1, 2],
          label: "[0, 1, 2]",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [5],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
        {
          label: "호출 스택",
          values: [5],
          slots: 6,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "disc[5] = low[5] = timer =",
        result: "5",
      },
      vars: "timer = 6 · 읽은 간선 6 / 7",
    },
    {
      title: "T15 간선 5→3 — 끊겨 나간 정점",
      text: "정점 3 은 이미 강한 연결 요소로 끊겨 나가 스택에 없습니다. 그 정점에서 5 로 돌아오는 길이 없으니 low[5] 를 그대로 둡니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
          state: "read",
        },
        {
          value: "4 / 3",
        },
        {
          value: "5 / 5",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {
          kind: "cross",
          state: "read",
        },
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
        {
          members: [0, 1, 2],
          label: "[0, 1, 2]",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [5],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [5],
          slots: 6,
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "onStack[3] =",
        result: "false",
      },
      vars: "timer = 6 · 읽은 간선 7 / 7",
    },
    {
      title: "T16 정점 5 를 끝내고 끊는다",
      text: "low[5] = disc[5] = 5 라 정점 5 가 뿌리입니다. 스택에서 5 가 나올 때까지 빼서 정점 5 를 한 강한 연결 요소로 끊습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
        },
        {
          value: "4 / 3",
        },
        {
          value: "5 / 5",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {
          kind: "cross",
        },
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
        {
          members: [0, 1, 2],
          label: "[0, 1, 2]",
        },
        {
          members: [5],
          label: "[5]",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
      ],
      calc: {
        expr: "low[5] = disc[5] =",
        result: "5",
      },
      vars: "timer = 6 · 읽은 간선 7 / 7",
    },
    {
      title: "T17 반환",
      text: "끊어 낸 차례는 [3, 4] · [0, 1, 2] · [5] 입니다. 반환하기 직전에 첫 원소 기준으로 정렬합니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 3",
        },
        {
          value: "4 / 3",
        },
        {
          value: "5 / 5",
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
          kind: "back",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {
          kind: "cross",
        },
      ],
      groups: [
        {
          members: [3, 4],
          label: "[3, 4]",
        },
        {
          members: [0, 1, 2],
          label: "[0, 1, 2]",
        },
        {
          members: [5],
          label: "[5]",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          slots: 6,
        },
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
      ],
      calc: null,
      vars: "timer = 6 · 읽은 간선 7 / 7",
    },
  ],
};
