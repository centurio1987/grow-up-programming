/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 준비, T2 부터 T20 까지가 갈래 하나씩,
 * T21 이 반환이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(`disc / low`)과
 * 상태, 간선의 종류(나무 · 되돌아감)와 상태와 번호, 무대 아래 세 띠(호출 스택 · 내려온 간선 · 다리)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 간선에 방향이 없으므로 `directed: false` 다. 내려온 간선 띠가 있는 것은
 * 이 편이 부모를 정점이 아니라 **간선 번호**로 건너뛰기 때문이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `bridgesInGraph-guide.test.ts` 가 잰다.
 */

export const bridgesWalk = {
  player: "stage",
  stage: "graph",
  title:
    "bridgesInGraph(6, [[0,1],[1,2],[2,3],[3,1],[3,4],[0,5]]) — 정점 안의 두 수는 disc / low",
  sub: "T1–T21 · 걸음마다 이웃 자리 하나 또는 정점 하나",
  result: "[[0, 1], [0, 5], [3, 4]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.2,
        y: 0,
      },
      {
        id: 1,
        x: 2.4,
        y: 0,
      },
      {
        id: 2,
        x: 1.3,
        y: 1.4,
      },
      {
        id: 3,
        x: 3.5,
        y: 1.4,
      },
      {
        id: 4,
        x: 4.8,
        y: 1.4,
      },
      {
        id: 5,
        x: 0,
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
        to: 3,
      },
      {
        from: 3,
        to: 1,
      },
      {
        from: 3,
        to: 4,
      },
      {
        from: 0,
        to: 5,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 준비",
      text: "간선마다 두 끝의 이웃 목록에 서로를 넣고 같은 자리에 간선 번호를 적습니다. disc · low 를 모두 -1 로 둡니다. 아직 들어간 정점이 없어 호출 스택이 비어 있습니다.",
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
      edges: [
        {
          label: "간선 0",
        },
        {
          label: "간선 1",
        },
        {
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
        {
          label: "내려온 간선",
          values: [],
          slots: 6,
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: null,
      vars: "timer = 0 · 읽은 이웃 자리 0 / 12",
    },
    {
      title: "T2 정점 0 에 들어간다",
      text: "바깥 반복이 아직 안 들어간 정점 0 을 찾아 들어갑니다. 발견 순서 0 을 disc 와 low 에 함께 적고, 내려온 간선 칸에는 뿌리 표시 -1 을 넣습니다.",
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
      edges: [
        {
          label: "간선 0",
        },
        {
          label: "간선 1",
        },
        {
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
        {
          label: "내려온 간선",
          values: [-1],
          slots: 6,
          states: {
            "0": "focus",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[0] = low[0] = timer =",
        result: "0",
      },
      vars: "timer = 1 · 읽은 이웃 자리 0 / 12",
    },
    {
      title: "T3 간선 0 로 정점 1 에 내려간다",
      text: "정점 0 의 이웃 1 이 처음 보는 정점이라 간선 0 으로 내려갑니다. disc 와 low 에 1 을 적고, 내려온 간선 칸에 0 을 넣습니다.",
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
          label: "간선 0",
        },
        {
          label: "간선 1",
        },
        {
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[1] = low[1] = timer =",
        result: "1",
      },
      vars: "timer = 2 · 읽은 이웃 자리 1 / 12",
    },
    {
      title: "T4 간선 0 — 내려온 간선이라 건너뛴다",
      text: "읽은 자리의 간선 번호 0 이 내려온 간선 칸의 0 과 같습니다. 방금 타고 내려온 간선을 거꾸로 본 것이라 low[1] 을 건드리지 않습니다.",
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
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "간선 0",
        },
        {
          label: "간선 1",
        },
        {
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "간선 0 = stackE 맨 위 0",
        result: "건너뜀",
      },
      vars: "timer = 2 · 읽은 이웃 자리 2 / 12",
    },
    {
      title: "T5 간선 1 로 정점 2 에 내려간다",
      text: "정점 1 의 이웃 2 가 처음 보는 정점이라 간선 1 로 내려갑니다. disc 와 low 에 2 를 적고, 내려온 간선 칸에 1 을 넣습니다.",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          state: "focus",
          label: "간선 1",
        },
        {
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1],
          slots: 6,
          states: {
            "2": "focus",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[2] = low[2] = timer =",
        result: "2",
      },
      vars: "timer = 3 · 읽은 이웃 자리 3 / 12",
    },
    {
      title: "T6 간선 1 — 내려온 간선이라 건너뛴다",
      text: "읽은 자리의 간선 번호 1 이 내려온 간선 칸의 1 과 같습니다. 방금 타고 내려온 간선을 거꾸로 본 것이라 low[2] 를 건드리지 않습니다.",
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
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          state: "read",
          label: "간선 1",
        },
        {
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1],
          slots: 6,
          states: {
            "2": "read",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "간선 1 = stackE 맨 위 1",
        result: "건너뜀",
      },
      vars: "timer = 3 · 읽은 이웃 자리 4 / 12",
    },
    {
      title: "T7 간선 2 로 정점 3 에 내려간다",
      text: "정점 2 의 이웃 3 이 처음 보는 정점이라 간선 2 로 내려갑니다. disc 와 low 에 3 을 적고, 내려온 간선 칸에 2 를 넣습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 2",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1, 2],
          slots: 6,
          states: {
            "3": "focus",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[3] = low[3] = timer =",
        result: "3",
      },
      vars: "timer = 4 · 읽은 이웃 자리 5 / 12",
    },
    {
      title: "T8 간선 2 — 내려온 간선이라 건너뛴다",
      text: "읽은 자리의 간선 번호 2 가 내려온 간선 칸의 2 와 같습니다. 방금 타고 내려온 간선을 거꾸로 본 것이라 low[3] 을 건드리지 않습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 2",
          state: "read",
        },
        {
          value: "3 / 3",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          state: "read",
          label: "간선 2",
        },
        {
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1, 2],
          slots: 6,
          states: {
            "3": "read",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "간선 2 = stackE 맨 위 2",
        result: "건너뜀",
      },
      vars: "timer = 4 · 읽은 이웃 자리 6 / 12",
    },
    {
      title: "T9 간선 3 — 이미 들어갔던 정점 1",
      text: "이웃 1 은 이미 들어갔던 정점이고 간선 3 은 내려온 간선이 아닙니다. 되돌아가는 간선이라 low[3] 을 disc[1] = 1 까지 줄입니다.",
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
        },
        {
          value: "3 / 1",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          state: "focus",
          label: "간선 3",
        },
        {
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1, 2],
          slots: 6,
          states: {
            "3": "read",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[3] = min(3, disc[1]) =",
        result: "1",
      },
      vars: "timer = 4 · 읽은 이웃 자리 7 / 12",
    },
    {
      title: "T10 간선 4 로 정점 4 에 내려간다",
      text: "정점 3 의 이웃 4 가 처음 보는 정점이라 간선 4 로 내려갑니다. disc 와 low 에 4 를 적고, 내려온 간선 칸에 4 를 넣습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 2",
        },
        {
          value: "3 / 1",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          state: "focus",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1, 2, 4],
          slots: 6,
          states: {
            "4": "focus",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[4] = low[4] = timer =",
        result: "4",
      },
      vars: "timer = 5 · 읽은 이웃 자리 8 / 12",
    },
    {
      title: "T11 간선 4 — 내려온 간선이라 건너뛴다",
      text: "읽은 자리의 간선 번호 4 가 내려온 간선 칸의 4 와 같습니다. 방금 타고 내려온 간선을 거꾸로 본 것이라 low[4] 를 건드리지 않습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 2",
        },
        {
          value: "3 / 1",
          state: "read",
        },
        {
          value: "4 / 4",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          state: "read",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2, 3, 4],
          slots: 6,
          states: {
            "4": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1, 2, 4],
          slots: 6,
          states: {
            "4": "read",
          },
        },
        {
          label: "다리",
          values: [],
          slots: 5,
        },
      ],
      calc: {
        expr: "간선 4 = stackE 맨 위 4",
        result: "건너뜀",
      },
      vars: "timer = 5 · 읽은 이웃 자리 9 / 12",
    },
    {
      title: "T12 정점 4 를 빼며 3−4 를 다리로 적는다",
      text: "정점 4 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[4] = 4 가 disc[3] = 3 보다 커서, 부분트리가 간선 3−4 없이는 부모에도 그 위에도 못 갑니다. 3−4 를 다리로 적습니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 2",
        },
        {
          value: "3 / 1",
          state: "read",
        },
        {
          value: "4 / 4",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          state: "focus",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2, 3],
          slots: 6,
          states: {
            "3": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1, 2],
          slots: 6,
          states: {
            "3": "read",
          },
        },
        {
          label: "다리",
          values: ["3−4"],
          slots: 5,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "low[4] = 4 > disc[3] = 3 →",
        result: "참",
      },
      vars: "timer = 5 · 읽은 이웃 자리 9 / 12",
    },
    {
      title: "T13 정점 3 을 빼며 2−3 을 판정한다",
      text: "정점 3 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[3] = 1 을 부모 2 에게 넘깁니다. 1 이 disc[2] = 2 보다 크지 않아 간선 2−3 은 다리가 아닙니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 1",
          state: "focus",
        },
        {
          value: "3 / 1",
          state: "read",
        },
        {
          value: "4 / 4",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          state: "read",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1, 2],
          slots: 6,
          states: {
            "2": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0, 1],
          slots: 6,
          states: {
            "2": "read",
          },
        },
        {
          label: "다리",
          values: ["3−4"],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[3] = 1 > disc[2] = 2 →",
        result: "거짓",
      },
      vars: "timer = 5 · 읽은 이웃 자리 9 / 12",
    },
    {
      title: "T14 정점 2 를 빼며 1−2 를 판정한다",
      text: "정점 2 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[2] = 1 을 부모 1 에게 넘깁니다. 1 이 disc[1] = 1 보다 크지 않아 간선 1−2 는 다리가 아닙니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
          state: "read",
        },
        {
          value: "2 / 1",
          state: "read",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          state: "read",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "다리",
          values: ["3−4"],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[2] = 1 > disc[1] = 1 →",
        result: "거짓",
      },
      vars: "timer = 5 · 읽은 이웃 자리 9 / 12",
    },
    {
      title: "T15 간선 3 — 이미 들어갔던 정점 3",
      text: "이웃 3 은 이미 들어갔다 나온 자손입니다. disc[3] = 3 이 low[1] = 1 보다 커서 값이 그대로입니다.",
      nodes: [
        {
          value: "0 / 0",
        },
        {
          value: "1 / 1",
          state: "read",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 1",
          state: "read",
        },
        {
          value: "4 / 4",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          state: "read",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 1],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 0],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "다리",
          values: ["3−4"],
          slots: 5,
        },
      ],
      calc: {
        expr: "low[1] = min(1, disc[3]) =",
        result: "1",
      },
      vars: "timer = 5 · 읽은 이웃 자리 10 / 12",
    },
    {
      title: "T16 정점 1 을 빼며 0−1 을 다리로 적는다",
      text: "정점 1 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[1] = 1 이 disc[0] = 0 보다 커서, 부분트리가 간선 0−1 없이는 부모에도 그 위에도 못 갑니다. 0−1 을 다리로 적습니다.",
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
          value: "2 / 1",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
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
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "다리",
          values: ["0−1", "3−4"],
          slots: 5,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "low[1] = 1 > disc[0] = 0 →",
        result: "참",
      },
      vars: "timer = 5 · 읽은 이웃 자리 10 / 12",
    },
    {
      title: "T17 간선 5 로 정점 5 에 내려간다",
      text: "정점 0 의 이웃 5 가 처음 보는 정점이라 간선 5 로 내려갑니다. disc 와 low 에 5 를 적고, 내려온 간선 칸에 5 를 넣습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
        },
        {
          value: "5 / 5",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 5],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 5],
          slots: 6,
          states: {
            "1": "focus",
          },
        },
        {
          label: "다리",
          values: ["0−1", "3−4"],
          slots: 5,
        },
      ],
      calc: {
        expr: "disc[5] = low[5] = timer =",
        result: "5",
      },
      vars: "timer = 6 · 읽은 이웃 자리 11 / 12",
    },
    {
      title: "T18 간선 5 — 내려온 간선이라 건너뛴다",
      text: "읽은 자리의 간선 번호 5 가 내려온 간선 칸의 5 와 같습니다. 방금 타고 내려온 간선을 거꾸로 본 것이라 low[5] 를 건드리지 않습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
        },
        {
          value: "5 / 5",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          kind: "tree",
          state: "read",
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0, 5],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1, 5],
          slots: 6,
          states: {
            "1": "read",
          },
        },
        {
          label: "다리",
          values: ["0−1", "3−4"],
          slots: 5,
        },
      ],
      calc: {
        expr: "간선 5 = stackE 맨 위 5",
        result: "건너뜀",
      },
      vars: "timer = 6 · 읽은 이웃 자리 12 / 12",
    },
    {
      title: "T19 정점 5 를 빼며 0−5 를 다리로 적는다",
      text: "정점 5 의 이웃을 다 봐서 호출 스택에서 뺍니다. low[5] = 5 가 disc[0] = 0 보다 커서, 부분트리가 간선 0−5 없이는 부모에도 그 위에도 못 갑니다. 0−5 를 다리로 적습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
        },
        {
          value: "5 / 5",
          state: "read",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [0],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "내려온 간선",
          values: [-1],
          slots: 6,
          states: {
            "0": "read",
          },
        },
        {
          label: "다리",
          values: ["0−1", "0−5", "3−4"],
          slots: 5,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "low[5] = 5 > disc[0] = 0 →",
        result: "참",
      },
      vars: "timer = 6 · 읽은 이웃 자리 12 / 12",
    },
    {
      title: "T20 뿌리 0 을 뺀다",
      text: "정점 0 의 이웃을 다 봤습니다. 내려온 간선 칸이 -1 인 뿌리라 넘길 곳도 판정할 간선도 없고, 호출 스택이 비었습니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
        },
        {
          value: "5 / 5",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          kind: "tree",
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
        {
          label: "내려온 간선",
          values: [],
          slots: 6,
        },
        {
          label: "다리",
          values: ["0−1", "0−5", "3−4"],
          slots: 5,
        },
      ],
      calc: null,
      vars: "timer = 6 · 읽은 이웃 자리 12 / 12",
    },
    {
      title: "T21 반환",
      text: "모은 다리를 앞 번호로, 같으면 뒤 번호로 세워 0−1 · 0−5 · 3−4 를 돌려줍니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 1",
        },
        {
          value: "4 / 4",
        },
        {
          value: "5 / 5",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "간선 0",
        },
        {
          kind: "tree",
          label: "간선 1",
        },
        {
          kind: "tree",
          label: "간선 2",
        },
        {
          kind: "back",
          label: "간선 3",
        },
        {
          kind: "tree",
          label: "간선 4",
        },
        {
          kind: "tree",
          label: "간선 5",
        },
      ],
      strips: [
        {
          label: "호출 스택",
          values: [],
          slots: 6,
        },
        {
          label: "내려온 간선",
          values: [],
          slots: 6,
        },
        {
          label: "다리",
          values: ["0−1", "0−5", "3−4"],
          slots: 5,
        },
      ],
      calc: null,
      vars: "timer = 6 · 읽은 이웃 자리 12 / 12",
    },
  ],
};
