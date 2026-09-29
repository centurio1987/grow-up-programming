/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 간선 옮기기, T2 가 앞자리 놓기, T3 이
 * 위상 순서 채우기, T4 가 시작값이고, T5 부터 위상 순서의 정점 하나가 걸음 하나다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고 — 정점은 위상 순서의 자리대로
 * 왼쪽부터 놓았다 — 걸음마다 정점의 값(T1~T3 은 진입 차수, T4 부터는 차례가 지난 정점의 「거리」와 아직
 * 차례가 안 온 정점의 「후보」)과 상태, 간선의 종류(지금 거리를 낸 간선은 굵은 실선)와 상태, 무대 아래
 * 위상 순서의 띠(`strips`)만 바꾼다(`src/_viz/player/graphStage.ts`). 그렇게 정한 까닭은 그림 사이드카
 * 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `dagShortestPath-guide.test.ts` 가 잰다.
 */
export const dagWalk = {
  player: "stage",
  stage: "graph",
  title:
    "dagShortestPath(6, [[2,3,2],[0,1,3],[1,2,-4],[0,2,5],[1,3,6],[4,0,2],[0,3,7]], 0) — 간선 옆 수는 가중치",
  sub: "T1–T10 · 위상 순서를 만들고, 그 차례대로 정점마다 한 걸음",
  result: "[0,3,-1,1,Infinity,Infinity]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.2,
        y: 2,
      },
      {
        id: 1,
        x: 2.4,
        y: 0.4,
      },
      {
        id: 2,
        x: 2.4,
        y: 1.45,
      },
      {
        id: 3,
        x: 3.6,
        y: 2,
      },
      {
        id: 4,
        x: 0,
        y: 1.2,
      },
      {
        id: 5,
        x: 0,
        y: 0.4,
      },
    ],
    edges: [
      {
        from: 2,
        to: 3,
      },
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 2,
      },
      {
        from: 0,
        to: 2,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 4,
        to: 0,
      },
      {
        from: 0,
        to: 3,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 간선 7 개를 adj 와 indegree 로 옮긴다",
      text: "간선마다 꼬리의 이웃 목록에 한 칸을 넣고 머리의 진입 차수를 하나 올립니다. 진입 차수는 차례로 [1, 1, 2, 3, 0, 0] 입니다.",
      nodes: [
        {
          value: "진입 1",
          state: "focus",
        },
        {
          value: "진입 1",
          state: "focus",
        },
        {
          value: "진입 2",
          state: "focus",
        },
        {
          value: "진입 3",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "read",
          label: "2",
        },
        {
          state: "read",
          label: "3",
        },
        {
          state: "read",
          label: "-4",
        },
        {
          state: "read",
          label: "5",
        },
        {
          state: "read",
          label: "6",
        },
        {
          state: "read",
          label: "2",
        },
        {
          state: "read",
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [],
          states: {},
          slots: 6,
        },
      ],
      calc: {
        expr: "간선 7 개 → 진입 차수의 합",
        result: "7",
      },
      vars: null,
    },
    {
      title: "T2 진입 차수가 0 인 4 · 5 를 앞자리에 놓는다",
      text: "진입 차수가 0 인 정점은 4 · 5 입니다. 번호가 작은 것부터 위상 순서의 앞자리에 놓으면 위상 순서는 [4, 5] 에서 시작합니다.",
      nodes: [
        {
          value: "진입 1",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 2",
        },
        {
          value: "진입 3",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "focus",
        },
      ],
      edges: [
        {
          label: "2",
        },
        {
          label: "3",
        },
        {
          label: "-4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "indegree[v] === 0 →",
        result: "4 · 5",
      },
      vars: null,
    },
    {
      title: "T3 위상 순서를 끝까지 채운다",
      text: "앞에서부터 꺼내며 나가는 간선의 머리마다 진입 차수를 하나씩 내리고, 0 이 된 정점을 뒤에 붙입니다(4 뒤에 0 · 0 뒤에 1 · 1 뒤에 2 · 2 뒤에 3). 위상 순서는 [4, 5, 0, 1, 2, 3] 입니다.",
      nodes: [
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
        },
        {
          value: "진입 0",
        },
      ],
      edges: [
        {
          state: "read",
          label: "2",
        },
        {
          state: "read",
          label: "3",
        },
        {
          state: "read",
          label: "-4",
        },
        {
          state: "read",
          label: "5",
        },
        {
          state: "read",
          label: "6",
        },
        {
          state: "read",
          label: "2",
        },
        {
          state: "read",
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "order.length →",
        result: "6",
      },
      vars: null,
    },
    {
      title: "T4 시작값 — dist[0] = 0",
      text: "dist[0] 에 0 을 적고 나머지는 Infinity 로 둡니다. 이제 위상 순서의 앞자리부터 정점을 하나씩 봅니다.",
      nodes: [
        {
          value: "후보 0",
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
          label: "2",
        },
        {
          label: "3",
        },
        {
          label: "-4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {},
          slots: 6,
        },
      ],
      calc: {
        expr: "dist[0] =",
        result: "0",
      },
      vars: null,
    },
    {
      title: "T5 정점 4 — 갈 길이 없어 건너뛴다",
      text: "dist[4] 가 Infinity 라 정점 4 까지 가는 길이 아직 없습니다. 나가는 간선을 보지 않고 건너뜁니다.",
      nodes: [
        {
          value: "후보 0",
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
          value: "Infinity",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "2",
        },
        {
          label: "3",
        },
        {
          label: "-4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          state: "out",
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "0": "read",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "dist[4] === Infinity →",
        result: "건너뛴다",
      },
      vars: "완화 시도 0 / 6",
    },
    {
      title: "T6 정점 5 — 갈 길이 없어 건너뛴다",
      text: "dist[5] 가 Infinity 라 정점 5 까지 가는 길이 아직 없습니다. 나가는 간선을 보지 않고 건너뜁니다.",
      nodes: [
        {
          value: "후보 0",
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
          value: "Infinity",
          state: "read",
        },
      ],
      edges: [
        {
          label: "2",
        },
        {
          label: "3",
        },
        {
          label: "-4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "1": "read",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "dist[5] === Infinity →",
        result: "건너뛴다",
      },
      vars: "완화 시도 0 / 6",
    },
    {
      title: "T7 정점 0 의 간선 3 개를 완화한다",
      text: "정점 0 의 차례입니다. 들어오는 간선을 이미 다 봤으니 dist[0] = 0 이 이 정점의 거리입니다. 0→1 는 0 + 3 = 3 을 처음 적습니다. 0→2 는 0 + 5 = 5 를 처음 적습니다. 0→3 는 0 + 7 = 7 을 처음 적습니다.",
      nodes: [
        {
          value: "거리 0",
          state: "read",
        },
        {
          value: "후보 3",
          state: "focus",
        },
        {
          value: "후보 5",
          state: "focus",
        },
        {
          value: "후보 7",
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
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "3",
        },
        {
          label: "-4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "2": "read",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "0 + 3 · 0 + 5 · 0 + 7 =",
        result: "3 · 5 · 7",
      },
      vars: "완화 시도 3 / 6",
    },
    {
      title: "T8 정점 1 의 간선 2 개를 완화한다",
      text: "정점 1 의 차례입니다. 들어오는 간선을 이미 다 봤으니 dist[1] = 3 이 이 정점의 거리입니다. 1→2 는 3 + (-4) = -1 이 적혀 있던 5 보다 작아 고칩니다. 1→3 는 3 + 6 = 9 가 적혀 있던 7 보다 작지 않아 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
          state: "read",
        },
        {
          value: "후보 -1",
          state: "focus",
        },
        {
          value: "후보 7",
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
          label: "2",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          state: "focus",
          label: "-4",
        },
        {
          label: "5",
        },
        {
          state: "read",
          label: "6",
        },
        {
          label: "2",
        },
        {
          kind: "tree",
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "3": "read",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "3 + (-4) · 3 + 6 =",
        result: "-1 · 9",
      },
      vars: "완화 시도 5 / 6",
    },
    {
      title: "T9 정점 2 의 간선 1 개를 완화한다",
      text: "정점 2 의 차례입니다. 들어오는 간선을 이미 다 봤으니 dist[2] = -1 이 이 정점의 거리입니다. 2→3 는 -1 + 2 = 1 이 적혀 있던 7 보다 작아 고칩니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
        },
        {
          value: "거리 -1",
          state: "read",
        },
        {
          value: "후보 1",
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
          state: "focus",
          label: "2",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          label: "-4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "4": "read",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "-1 + 2 =",
        result: "1",
      },
      vars: "완화 시도 6 / 6",
    },
    {
      title: "T10 정점 3 — 나가는 간선이 없다",
      text: "정점 3 은 나가는 간선이 없어 할 일이 없습니다. 위상 순서를 다 읽었으니 반환값은 [0, 3, -1, 1, Infinity, Infinity] 입니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
        },
        {
          value: "거리 -1",
        },
        {
          value: "거리 1",
          state: "read",
        },
        {
          value: "Infinity",
          state: "out",
        },
        {
          value: "Infinity",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          label: "-4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "위상 순서",
          values: [4, 5, 0, 1, 2, 3],
          states: {
            "5": "read",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "adj[3] →",
        result: "비어 있다",
      },
      vars: "완화 시도 6 / 6",
    },
  ],
};
