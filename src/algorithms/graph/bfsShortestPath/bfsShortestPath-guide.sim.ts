/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작, 이웃 검사 한 번이 걸음 하나,
 * 마지막 걸음이 큐가 비어 끝나는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 거리와 상태,
 * 간선의 종류(정점을 처음 만나게 한 간선은 굵은 실선)와 상태, 무대 아래 큐 띠(`strips`)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 큐 띠는 큐 배열 전체이고, 이미 꺼낸 칸은 「이번 걸음 밖」이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `bfsShortestPath-guide.test.ts` 가 잰다.
 */
export const bfsWalk = {
  player: "stage",
  stage: "graph",
  title:
    "bfsShortestPath(6, [[0,1],[1,2],[2,3],[3,4],[4,0]], 0) — 정점 안의 수는 거리",
  sub: "T1–T12 · 걸음마다 이웃 검사 하나",
  result: "[0,1,2,2,1,-1]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.5,
        y: 0,
      },
      {
        id: 1,
        x: 3,
        y: 1,
      },
      {
        id: 2,
        x: 2.45,
        y: 2.5,
      },
      {
        id: 3,
        x: 0.55,
        y: 2.5,
      },
      {
        id: 4,
        x: 0,
        y: 1,
      },
      {
        id: 5,
        x: 4.3,
        y: 2.5,
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
        to: 4,
      },
      {
        from: 4,
        to: 0,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 출발 정점 0 을 큐에 넣는다",
      text: "dist[0] 에 0 을 적고 정점 0 을 큐에 넣습니다. 나머지 정점은 아직 거리가 없습니다.",
      nodes: [
        {
          value: "거리 0",
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
      edges: [{}, {}, {}, {}, {}],
      strips: [
        {
          label: "큐",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[0] =",
        result: "0",
      },
      vars: "이웃 검사 0 / 10",
    },
    {
      title: "T2 정점 0 의 이웃 1 — 처음 만난다",
      text: "dist[1] 가 -1 이라 처음 만나는 정점입니다. 꺼낸 정점 0 의 거리 0 에 1 을 더해 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "거리 0",
          state: "read",
        },
        {
          value: "거리 1",
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
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1],
          states: {
            "0": "read",
            "1": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[1] = dist[0] + 1 =",
        result: "1",
      },
      vars: "이웃 검사 1 / 10",
    },
    {
      title: "T3 정점 0 의 이웃 4 — 처음 만난다",
      text: "dist[4] 가 -1 이라 처음 만나는 정점입니다. 꺼낸 정점 0 의 거리 0 에 1 을 더해 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "거리 0",
          state: "read",
        },
        {
          value: "거리 1",
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
          value: "거리 1",
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
        {},
        {},
        {},
        {
          kind: "tree",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1, 4],
          states: {
            "0": "read",
            "2": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[4] = dist[0] + 1 =",
        result: "1",
      },
      vars: "이웃 검사 2 / 10",
    },
    {
      title: "T4 정점 1 의 이웃 0 — 이미 거리가 있다",
      text: "dist[0] 에 이미 0 이 적혀 있습니다. 지금 온 길은 2 이라 더 짧지 않으니 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
          state: "read",
        },
        {
          value: "거리 1",
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
          value: "거리 1",
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
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1, 4],
          states: {
            "0": "out",
            "1": "read",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[0] !== -1 →",
        result: "참",
      },
      vars: "이웃 검사 3 / 10",
    },
    {
      title: "T5 정점 1 의 이웃 2 — 처음 만난다",
      text: "dist[2] 가 -1 이라 처음 만나는 정점입니다. 꺼낸 정점 1 의 거리 1 에 1 을 더해 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
          state: "read",
        },
        {
          value: "거리 2",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "거리 1",
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
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1, 4, 2],
          states: {
            "0": "out",
            "1": "read",
            "3": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[2] = dist[1] + 1 =",
        result: "2",
      },
      vars: "이웃 검사 4 / 10",
    },
    {
      title: "T6 정점 4 의 이웃 3 — 처음 만난다",
      text: "dist[3] 가 -1 이라 처음 만나는 정점입니다. 꺼낸 정점 4 의 거리 1 에 1 을 더해 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 2",
          state: "focus",
        },
        {
          value: "거리 1",
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
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "read",
            "4": "focus",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[3] = dist[4] + 1 =",
        result: "2",
      },
      vars: "이웃 검사 5 / 10",
    },
    {
      title: "T7 정점 4 의 이웃 0 — 이미 거리가 있다",
      text: "dist[0] 에 이미 0 이 적혀 있습니다. 지금 온 길은 2 이라 더 짧지 않으니 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
          state: "read",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 1",
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
        {},
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
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "read",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[0] !== -1 →",
        result: "참",
      },
      vars: "이웃 검사 6 / 10",
    },
    {
      title: "T8 정점 2 의 이웃 1 — 이미 거리가 있다",
      text: "dist[1] 에 이미 1 이 적혀 있습니다. 지금 온 길은 3 이라 더 짧지 않으니 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
          state: "read",
        },
        {
          value: "거리 2",
          state: "read",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 1",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "read",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[1] !== -1 →",
        result: "참",
      },
      vars: "이웃 검사 7 / 10",
    },
    {
      title: "T9 정점 2 의 이웃 3 — 이미 거리가 있다",
      text: "dist[3] 에 이미 2 가 적혀 있습니다. 지금 온 길은 3 이라 더 짧지 않으니 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 2",
          state: "read",
        },
        {
          value: "거리 2",
          state: "read",
        },
        {
          value: "거리 1",
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
          state: "read",
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
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "read",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[3] !== -1 →",
        result: "참",
      },
      vars: "이웃 검사 8 / 10",
    },
    {
      title: "T10 정점 3 의 이웃 2 — 이미 거리가 있다",
      text: "dist[2] 에 이미 2 가 적혀 있습니다. 지금 온 길은 3 이라 더 짧지 않으니 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 2",
          state: "read",
        },
        {
          value: "거리 2",
          state: "read",
        },
        {
          value: "거리 1",
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
          state: "read",
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
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "read",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[2] !== -1 →",
        result: "참",
      },
      vars: "이웃 검사 9 / 10",
    },
    {
      title: "T11 정점 3 의 이웃 4 — 이미 거리가 있다",
      text: "dist[4] 에 이미 1 이 적혀 있습니다. 지금 온 길은 3 이라 더 짧지 않으니 그대로 둡니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 2",
          state: "read",
        },
        {
          value: "거리 1",
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
        {},
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
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "read",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "dist[4] !== -1 →",
        result: "참",
      },
      vars: "이웃 검사 10 / 10",
    },
    {
      title: "T12 큐가 비어 끝난다",
      text: "head 가 큐 길이 5 에 이르러 꺼낼 정점이 없습니다. 큐에 한 번도 안 들어간 정점 5 의 거리는 -1 로 남고, 반환값은 [0, 1, 2, 2, 1, -1] 입니다.",
      nodes: [
        {
          value: "거리 0",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 2",
        },
        {
          value: "거리 1",
        },
        {
          value: "거리 -1",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 1, 4, 2, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
          },
          slots: 5,
        },
      ],
      calc: {
        expr: "head < queue.length →",
        result: "거짓",
      },
      vars: "이웃 검사 10 / 10",
    },
  ],
};
