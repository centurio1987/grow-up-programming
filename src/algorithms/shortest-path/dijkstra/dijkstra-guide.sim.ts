/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작, 큐에서 항목 하나를 꺼내는 일이
 * 걸음 하나, 마지막 걸음이 큐가 비어 끝나는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(확정한
 * 정점은 「거리」, 아직 줄어들 수 있는 정점은 「후보」)과 상태, 간선의 종류(지금 거리를 낸 간선은 굵은
 * 실선)와 상태, 무대 아래 우선순위 큐의 띠 둘(`strips`)만 바꾼다(`src/_viz/player/graphStage.ts`).
 *
 * 우선순위 큐의 띠는 큐에 든 항목을 **꺼낼 차례대로** 늘어놓는다 — 윗줄이 정점, 아랫줄이 키이고 같은
 * 칸 번호가 한 항목이다. 이번 걸음에 넣은 항목은 새로 씀, 뒤처진 기록은 이번 걸음 밖이다. 그렇게
 * 정한 까닭은 그림 사이드카 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `dijkstra-guide.test.ts` 가 잰다.
 */
export const dijkstraWalk = {
  player: "stage",
  stage: "graph",
  title:
    "dijkstra(6, [[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3],[4,1,7]], 0) — 간선 옆 수는 가중치",
  sub: "T1–T9 · 걸음마다 큐에서 항목 하나",
  result: "[0,3,1,4,7,Infinity]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 1,
      },
      {
        id: 1,
        x: 1.3,
        y: 0,
      },
      {
        id: 2,
        x: 1.3,
        y: 2,
      },
      {
        id: 3,
        x: 2.6,
        y: 1,
      },
      {
        id: 4,
        x: 3.9,
        y: 0,
      },
      {
        id: 5,
        x: 3.9,
        y: 2,
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
        to: 1,
      },
      {
        from: 1,
        to: 3,
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
        to: 1,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 시작값 — 큐에 (0, 0)",
      text: "dist[0] 에 0 을 적고 나머지는 Infinity 로 둡니다. 우선순위 큐에는 항목 (0, 0) 하나가 들어갑니다.",
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
          label: "4",
        },
        {
          label: "1",
        },
        {
          label: "2",
        },
        {
          label: "1",
        },
        {
          label: "5",
        },
        {
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "dist[0] =",
        result: "0",
      },
      vars: "완화 시도 0 / 7",
    },
    {
      title: "T2 정점 0 을 꺼낸다 — 키 0",
      text: "키 0 이 dist[0] 와 같아 정점 0 을 확정합니다. 0→1 는 0 + 4 = 4 가 처음 적히고 큐에 (1, 4) 을 넣습니다. 0→2 는 0 + 1 = 1 이 처음 적히고 큐에 (2, 1) 을 넣습니다.",
      nodes: [
        {
          value: "거리 0",
          state: "read",
        },
        {
          value: "후보 4",
          state: "focus",
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
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "1",
        },
        {
          label: "2",
        },
        {
          label: "1",
        },
        {
          label: "5",
        },
        {
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [2, 1],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [1, 4],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 = dist[0] →",
        result: "확정",
      },
      vars: "완화 시도 2 / 7",
    },
    {
      title: "T3 정점 2 를 꺼낸다 — 키 1",
      text: "키 1 이 dist[2] 와 같아 정점 2 를 확정합니다. 2→1 는 1 + 2 = 3 이 적혀 있던 4 보다 작아 고치고 큐에 (1, 3) 을 넣습니다. 2→3 는 1 + 5 = 6 이 처음 적히고 큐에 (3, 6) 을 넣습니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "후보 3",
          state: "focus",
        },
        {
          value: "거리 1",
          state: "read",
        },
        {
          value: "후보 6",
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
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "5",
        },
        {
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [1, 1, 3],
          states: {
            "0": "focus",
            "1": "out",
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [3, 4, 6],
          states: {
            "0": "focus",
            "1": "out",
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "1 = dist[2] →",
        result: "확정",
      },
      vars: "완화 시도 4 / 7",
    },
    {
      title: "T4 정점 1 을 꺼낸다 — 키 3",
      text: "키 3 이 dist[1] 와 같아 정점 1 을 확정합니다. 1→3 는 3 + 1 = 4 가 적혀 있던 6 보다 작아 고치고 큐에 (3, 4) 을 넣습니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
          state: "read",
        },
        {
          value: "거리 1",
        },
        {
          value: "후보 4",
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
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "1",
        },
        {
          label: "5",
        },
        {
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [1, 3, 3],
          states: {
            "0": "out",
            "1": "focus",
            "2": "out",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [4, 4, 6],
          states: {
            "0": "out",
            "1": "focus",
            "2": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "3 = dist[1] →",
        result: "확정",
      },
      vars: "완화 시도 5 / 7",
    },
    {
      title: "T5 정점 1 을 다시 꺼낸다 — 키 4",
      text: "키 4 가 지금 적힌 dist[1] = 3 보다 큽니다. 더 작은 값으로 고치기 전에 넣어 둔 뒤처진 기록이라, 이웃을 하나도 보지 않고 버립니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
          state: "read",
        },
        {
          value: "거리 1",
        },
        {
          value: "후보 4",
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
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "5",
        },
        {
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [3, 3],
          states: {
            "1": "out",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [4, 6],
          states: {
            "1": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "4 > dist[1] = 3 →",
        result: "버린다",
      },
      vars: "완화 시도 5 / 7",
    },
    {
      title: "T6 정점 3 을 꺼낸다 — 키 4",
      text: "키 4 가 dist[3] 와 같아 정점 3 을 확정합니다. 3→4 는 4 + 3 = 7 이 처음 적히고 큐에 (4, 7) 을 넣습니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 4",
          state: "read",
        },
        {
          value: "후보 7",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "5",
        },
        {
          kind: "tree",
          state: "focus",
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [3, 4],
          states: {
            "0": "out",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [6, 7],
          states: {
            "0": "out",
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "4 = dist[3] →",
        result: "확정",
      },
      vars: "완화 시도 6 / 7",
    },
    {
      title: "T7 정점 3 을 다시 꺼낸다 — 키 6",
      text: "키 6 이 지금 적힌 dist[3] = 4 보다 큽니다. 더 작은 값으로 고치기 전에 넣어 둔 뒤처진 기록이라, 이웃을 하나도 보지 않고 버립니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 4",
          state: "read",
        },
        {
          value: "후보 7",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "5",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [4],
          states: {},
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [7],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "6 > dist[3] = 4 →",
        result: "버린다",
      },
      vars: "완화 시도 6 / 7",
    },
    {
      title: "T8 정점 4 를 꺼낸다 — 키 7",
      text: "키 7 이 dist[4] 와 같아 정점 4 를 확정합니다. 4→1 는 7 + 7 = 14 가 적혀 있던 3 보다 작지 않아 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 4",
        },
        {
          value: "거리 7",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "5",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          state: "read",
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "7 = dist[4] →",
        result: "확정",
      },
      vars: "완화 시도 7 / 7",
    },
    {
      title: "T9 큐가 비어 끝난다",
      text: "큐가 비어 반복이 끝납니다. 한 번도 큐에 안 들어간 정점 5 의 거리는 Infinity 로 남고, 반환값은 [0, 3, 1, 4, 7, Infinity] 입니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 3",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 4",
        },
        {
          value: "거리 7",
        },
        {
          value: "Infinity",
          state: "out",
        },
      ],
      edges: [
        {
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "5",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "pq.size() > 0 →",
        result: "거짓",
      },
      vars: "완화 시도 7 / 7",
    },
  ],
};
