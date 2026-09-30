/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 준비, T2 부터 T18 까지가 갈래 하나씩,
 * T19 가 반환이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(`disc / low`)과
 * 상태, 간선의 종류(나무 · 되돌아감)와 상태, 무대 아래 두 띠(호출 스택 · 단절점)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 간선에 방향이 없으므로 `directed: false` 다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `articulationPoints-guide.test.ts` 가 잰다.
 */

export const apWalk = {
  player: "stage",
  stage: "graph",
  title:
    "articulationPoints(5, [[0,1],[1,2],[2,0],[0,3],[3,4]]) — 정점 안의 두 수는 disc / low",
  sub: "T1–T19 · 걸음마다 이웃 자리 하나 또는 정점 하나",
  result: "[0, 3]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1,
        y: 0,
      },
      {
        id: 1,
        x: 0,
        y: 1.2,
      },
      {
        id: 2,
        x: 2,
        y: 1.2,
      },
      {
        id: 3,
        x: 3,
        y: 0,
      },
      {
        id: 4,
        x: 4.2,
        y: 0,
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
        from: 0,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 준비",
      text: "간선마다 두 끝의 이웃 목록에 서로를 넣고, disc · low 를 모두 -1 로, cut 을 모두 거짓으로 둡니다. 아직 들어간 정점이 없어 호출 스택이 비어 있습니다.",
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
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 5,
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: null,
      vars: "timer = 0 · 읽은 이웃 자리 0 / 10",
    },
    {
      title: "T2 정점 0 에 들어간다",
      text: "바깥 반복이 아직 안 들어간 정점 0 을 찾아 들어갑니다. 발견 순서 0 을 disc 와 low 에 함께 적고, 부모 칸에는 뿌리 표시 -1 을 넣습니다.",
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
      ],
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 5,
          states: {
            "0": "focus",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[0] = low[0] = timer =",
        result: "0",
      },
      vars: "timer = 1 · 읽은 이웃 자리 0 / 10",
    },
    {
      title: "T3 간선 0−1 로 내려간다",
      text: "정점 0 의 이웃 1 이 처음 보는 정점이라 내려갑니다. disc 와 low 에 1 을 적고, 부모 칸에 0 을 넣습니다.",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 5,
          states: {
            "1": "focus",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[1] = low[1] = timer =",
        result: "1",
      },
      vars: "timer = 2 · 읽은 이웃 자리 1 / 10",
    },
    {
      title: "T4 이웃 0 — 부모라 건너뛴다",
      text: "이웃 0 은 정점 1 의 부모입니다. 방금 내려온 나무 간선을 거꾸로 본 것이라 low[1] 을 건드리지 않습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
          state: "read",
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
          state: "read",
        },
        {},
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 5,
          states: {
            "1": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "callP 맨 위 = 0 = 이웃",
        result: "건너뜀",
      },
      vars: "timer = 2 · 읽은 이웃 자리 2 / 10",
    },
    {
      title: "T5 간선 1−2 로 내려간다",
      text: "정점 1 의 이웃 2 가 처음 보는 정점이라 내려갑니다. disc 와 low 에 2 를 적고, 부모 칸에 1 을 넣습니다.",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 5,
          states: {
            "2": "focus",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[2] = low[2] = timer =",
        result: "2",
      },
      vars: "timer = 3 · 읽은 이웃 자리 3 / 10",
    },
    {
      title: "T6 이웃 1 — 부모라 건너뛴다",
      text: "이웃 1 은 정점 2 의 부모입니다. 방금 내려온 나무 간선을 거꾸로 본 것이라 low[2] 를 건드리지 않습니다.",
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
          state: "read",
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
          state: "read",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 5,
          states: {
            "2": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "callP 맨 위 = 1 = 이웃",
        result: "건너뜀",
      },
      vars: "timer = 3 · 읽은 이웃 자리 4 / 10",
    },
    {
      title: "T7 이웃 0 — 이미 들어갔던 정점",
      text: "이웃 0 은 이미 들어갔던 정점이고 부모가 아닙니다. 되돌아가는 간선이라 low[2] 를 disc[0] = 0 까지 줄입니다.",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 5,
          states: {
            "2": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[2] = min(2, disc[0]) =",
        result: "0",
      },
      vars: "timer = 3 · 읽은 이웃 자리 5 / 10",
    },
    {
      title: "T8 정점 2 를 뺀다",
      text: "정점 2 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[2] = 0 을 부모 1 에게 넘깁니다. 0 이 disc[1] = 1 보다 작아 부모를 적지 않습니다.",
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
          state: "read",
        },
        {
          kind: "back",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 5,
          states: {
            "1": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[1] = min(1, low[2]) =",
        result: "0",
      },
      vars: "timer = 3 · 읽은 이웃 자리 5 / 10",
    },
    {
      title: "T9 정점 1 을 뺀다",
      text: "정점 1 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[1] = 0 을 부모 0 에게 넘기고, 부모가 뿌리라 판정하지 않습니다.",
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
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "back",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 5,
          states: {
            "0": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[0] = min(0, low[1]) =",
        result: "0",
      },
      vars: "timer = 3 · 읽은 이웃 자리 5 / 10",
    },
    {
      title: "T10 이웃 2 — 이미 들어갔던 정점",
      text: "이웃 2 는 이미 들어갔다 나온 자손입니다. disc[2] = 2 가 low[0] = 0 보다 커서 값이 그대로입니다.",
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
          state: "read",
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
          state: "read",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 5,
          states: {
            "0": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[0] = min(0, disc[2]) =",
        result: "0",
      },
      vars: "timer = 3 · 읽은 이웃 자리 6 / 10",
    },
    {
      title: "T11 간선 0−3 으로 내려간다",
      text: "정점 0 의 이웃 3 이 처음 보는 정점이라 내려갑니다. disc 와 low 에 3 을 적고, 부모 칸에 0 을 넣습니다.",
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
          state: "focus",
        },
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 3],
          slots: 5,
          states: {
            "1": "focus",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[3] = low[3] = timer =",
        result: "3",
      },
      vars: "timer = 4 · 읽은 이웃 자리 7 / 10",
    },
    {
      title: "T12 이웃 0 — 부모라 건너뛴다",
      text: "이웃 0 은 정점 3 의 부모입니다. 방금 내려온 나무 간선을 거꾸로 본 것이라 low[3] 을 건드리지 않습니다.",
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
          state: "read",
        },
        {},
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 3],
          slots: 5,
          states: {
            "1": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "callP 맨 위 = 0 = 이웃",
        result: "건너뜀",
      },
      vars: "timer = 4 · 읽은 이웃 자리 8 / 10",
    },
    {
      title: "T13 간선 3−4 로 내려간다",
      text: "정점 3 의 이웃 4 가 처음 보는 정점이라 내려갑니다. disc 와 low 에 4 를 적고, 부모 칸에 3 을 넣습니다.",
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
          value: "4 / 4",
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
          state: "focus",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 3, 4],
          slots: 5,
          states: {
            "2": "focus",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[4] = low[4] = timer =",
        result: "4",
      },
      vars: "timer = 5 · 읽은 이웃 자리 9 / 10",
    },
    {
      title: "T14 이웃 3 — 부모라 건너뛴다",
      text: "이웃 3 은 정점 4 의 부모입니다. 방금 내려온 나무 간선을 거꾸로 본 것이라 low[4] 를 건드리지 않습니다.",
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
          value: "4 / 4",
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
          state: "read",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 3, 4],
          slots: 5,
          states: {
            "2": "read",
          },
        },
        {
          label: "단절점",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "callP 맨 위 = 3 = 이웃",
        result: "건너뜀",
      },
      vars: "timer = 5 · 읽은 이웃 자리 10 / 10",
    },
    {
      title: "T15 정점 4 를 빼며 3 을 단절점으로 적는다",
      text: "정점 4 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[4] = 4 가 disc[3] = 3 이상이라, 서브트리가 정점 3 위로 못 갑니다. 정점 3 을 단절점으로 적습니다.",
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
          state: "focus",
        },
        {
          value: "4 / 4",
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
          state: "read",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 3],
          slots: 5,
          states: {
            "1": "read",
          },
        },
        {
          label: "단절점",
          values: [3],
          slots: 5,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "low[4] = 4 ≥ disc[3] = 3 →",
        result: "참",
      },
      vars: "timer = 5 · 읽은 이웃 자리 10 / 10",
    },
    {
      title: "T16 정점 3 을 뺀다",
      text: "정점 3 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[3] = 3 을 부모 0 에게 넘기고, 부모가 뿌리라 판정하지 않습니다.",
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
          state: "read",
        },
        {
          value: "4 / 4",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 5,
          states: {
            "0": "read",
          },
        },
        {
          label: "단절점",
          values: [3],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[0] = min(0, low[3]) =",
        result: "0",
      },
      vars: "timer = 5 · 읽은 이웃 자리 10 / 10",
    },
    {
      title: "T17 정점 0 을 뺀다",
      text: "정점 0 의 이웃을 다 봤습니다. 부모가 없는 뿌리라 넘길 곳이 없고, 호출 스택이 비었습니다.",
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
          value: "4 / 4",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 5,
        },
        {
          label: "단절점",
          values: [3],
          slots: 5,
        },
      ],
      calc: null,
      vars: "timer = 5 · 읽은 이웃 자리 10 / 10",
    },
    {
      title: "T18 뿌리 0 을 판정한다",
      text: "뿌리 0 의 탐색이 끝났습니다. 나무 자식이 2 개라 뿌리 0 을 단절점으로 적습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "focus",
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
          value: "4 / 4",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 5,
        },
        {
          label: "단절점",
          values: [0, 3],
          slots: 5,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "rootKids ≥ 2 →",
        result: "참",
      },
      vars: "timer = 5 · 읽은 이웃 자리 10 / 10",
    },
    {
      title: "T19 반환",
      text: "cut 이 참인 정점을 번호 순서로 모아 [0, 3] 을 돌려줍니다.",
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
          value: "4 / 4",
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
      ],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 5,
        },
        {
          label: "단절점",
          values: [0, 3],
          slots: 5,
        },
      ],
      calc: null,
      vars: "timer = 5 · 읽은 이웃 자리 10 / 10",
    },
  ],
};
