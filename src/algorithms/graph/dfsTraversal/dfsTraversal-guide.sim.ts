/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작, 꺼내기 한 번이 걸음 하나,
 * 마지막 걸음이 스택이 비어 끝나는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 방문 차례와
 * 상태, 간선의 종류(정점을 처음 꺼내게 한 간선은 굵은 실선)와 상태, 무대 아래 띠 둘(스택 · order)만
 * 바꾼다(`src/_viz/player/graphStage.ts`). 스택 띠는 아래에서 위로 왼쪽에서 오른쪽이고, 이번 걸음에
 * 넣은 칸이 새로 씀이다. 칸 수는 스택이 가장 컸을 때에 맞춰 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `dfsTraversal-guide.test.ts` 가 잰다.
 */
export const dfsWalk = {
  player: "stage",
  stage: "graph",
  title:
    "dfsTraversal(6, [[0,2],[0,1],[1,3],[2,4]], 0) — 정점 안의 수는 방문 차례",
  sub: "T1–T11 · 걸음마다 꺼내기 하나",
  result: "[0,1,3,2,4]",
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
        y: 1,
      },
      {
        id: 2,
        x: 2,
        y: 1,
      },
      {
        id: 3,
        x: 0,
        y: 2,
      },
      {
        id: 4,
        x: 2,
        y: 2,
      },
      {
        id: 5,
        x: 3.3,
        y: 1,
      },
    ],
    edges: [
      {
        from: 0,
        to: 2,
      },
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 2,
        to: 4,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 시작 정점 0 을 스택에 넣는다",
      text: "스택에 시작 정점 0 하나만 넣습니다. 결과 배열은 비어 있고, 방문 표시는 꺼낼 때 합니다.",
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
      edges: [{}, {}, {}, {}],
      strips: [
        {
          label: "스택",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "order",
          values: [],
          states: {},
          slots: 5,
        },
      ],
      calc: {
        expr: "stack =",
        result: "[0]",
      },
      vars: "꺼내기 0 / 9",
    },
    {
      title: "T2 정점 0 을 꺼낸다 — 처음 꺼낸다",
      text: "시작 정점 0 을 처음 꺼냈습니다. 결과에 넣고, 이웃 목록 [1, 2] 를 큰 번호부터 스택에 넣습니다.",
      nodes: [
        {
          value: "차례 1",
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
      edges: [{}, {}, {}, {}],
      strips: [
        {
          label: "스택",
          values: [2, 1],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "order",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[0] →",
        result: "거짓",
      },
      vars: "꺼내기 1 / 9",
    },
    {
      title: "T3 정점 1 을 꺼낸다 — 처음 꺼낸다",
      text: "정점 0 이 넣은 정점 1 을 처음 꺼냈습니다. 결과에 넣고, 이웃 목록 [0, 3] 을 큰 번호부터 스택에 넣습니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
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
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "스택",
          values: [2, 3, 0],
          states: {
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1],
          states: {
            "1": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[1] →",
        result: "거짓",
      },
      vars: "꺼내기 2 / 9",
    },
    {
      title: "T4 정점 0 을 꺼낸다 — 이미 결과에 있다",
      text: "정점 1 이 넣은 정점 0 은 이미 결과에 있습니다. 아무것도 넣지 않고 버립니다.",
      nodes: [
        {
          value: "차례 1",
          state: "read",
        },
        {
          value: "차례 2",
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
        {},
        {
          kind: "tree",
          state: "read",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "스택",
          values: [2, 3],
          states: {},
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1],
          states: {},
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[0] →",
        result: "참",
      },
      vars: "꺼내기 3 / 9",
    },
    {
      title: "T5 정점 3 을 꺼낸다 — 처음 꺼낸다",
      text: "정점 1 이 넣은 정점 3 을 처음 꺼냈습니다. 결과에 넣고, 이웃 목록 [1] 을 큰 번호부터 스택에 넣습니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "차례 3",
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
        {},
        {
          kind: "tree",
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
          values: [2, 1],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3],
          states: {
            "2": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[3] →",
        result: "거짓",
      },
      vars: "꺼내기 4 / 9",
    },
    {
      title: "T6 정점 1 을 꺼낸다 — 이미 결과에 있다",
      text: "정점 3 이 넣은 정점 1 은 이미 결과에 있습니다. 아무것도 넣지 않고 버립니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "차례 3",
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
        {},
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
          values: [2],
          states: {},
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3],
          states: {},
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[1] →",
        result: "참",
      },
      vars: "꺼내기 5 / 9",
    },
    {
      title: "T7 정점 2 를 꺼낸다 — 처음 꺼낸다",
      text: "정점 0 이 넣은 정점 2 를 처음 꺼냈습니다. 결과에 넣고, 이웃 목록 [0, 4] 를 큰 번호부터 스택에 넣습니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
        },
        {
          value: "차례 4",
          state: "focus",
        },
        {
          value: "차례 3",
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
          values: [4, 0],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3, 2],
          states: {
            "3": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[2] →",
        result: "거짓",
      },
      vars: "꺼내기 6 / 9",
    },
    {
      title: "T8 정점 0 을 꺼낸다 — 이미 결과에 있다",
      text: "정점 2 가 넣은 정점 0 은 이미 결과에 있습니다. 아무것도 넣지 않고 버립니다.",
      nodes: [
        {
          value: "차례 1",
          state: "read",
        },
        {
          value: "차례 2",
        },
        {
          value: "차례 4",
        },
        {
          value: "차례 3",
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
          kind: "tree",
        },
        {},
      ],
      strips: [
        {
          label: "스택",
          values: [4],
          states: {},
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3, 2],
          states: {},
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[0] →",
        result: "참",
      },
      vars: "꺼내기 7 / 9",
    },
    {
      title: "T9 정점 4 를 꺼낸다 — 처음 꺼낸다",
      text: "정점 2 가 넣은 정점 4 를 처음 꺼냈습니다. 결과에 넣고, 이웃 목록 [2] 를 큰 번호부터 스택에 넣습니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
        },
        {
          value: "차례 4",
        },
        {
          value: "차례 3",
        },
        {
          value: "차례 5",
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
          values: [2],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3, 2, 4],
          states: {
            "4": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[4] →",
        result: "거짓",
      },
      vars: "꺼내기 8 / 9",
    },
    {
      title: "T10 정점 2 를 꺼낸다 — 이미 결과에 있다",
      text: "정점 4 가 넣은 정점 2 는 이미 결과에 있습니다. 아무것도 넣지 않고 버립니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
        },
        {
          value: "차례 4",
          state: "read",
        },
        {
          value: "차례 3",
        },
        {
          value: "차례 5",
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
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3, 2, 4],
          states: {},
          slots: 5,
        },
      ],
      calc: {
        expr: "visited[2] →",
        result: "참",
      },
      vars: "꺼내기 9 / 9",
    },
    {
      title: "T11 스택이 비어 끝난다",
      text: "스택이 비어 반복이 끝납니다. 스택에 한 번도 안 들어간 정점 5 는 결과에 없고, 반환값은 [0, 1, 3, 2, 4] 입니다.",
      nodes: [
        {
          value: "차례 1",
        },
        {
          value: "차례 2",
        },
        {
          value: "차례 4",
        },
        {
          value: "차례 3",
        },
        {
          value: "차례 5",
        },
        {
          value: "",
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
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "스택",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "order",
          values: [0, 1, 3, 2, 4],
          states: {},
          slots: 5,
        },
      ],
      calc: {
        expr: "stack.length > 0 →",
        result: "거짓",
      },
      vars: "꺼내기 9 / 9",
    },
  ],
};
