/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 이웃 목록 만들기 하나, 탐색마다 시작 하나와
 * 정점을 꺼내는 일 하나하나가 각각 걸음 하나다. 마지막 걸음이 둘째 탐색을 끝내고 지름을 반환하는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적는다 — 정점 0 에서 매단 탐색 트리를
 * `treeLayout` 으로 놓은 자리이고, 둘째 탐색이 정점 6 에서 다시 시작해도 자리는 그대로다. 걸음마다
 * 정점 안의 값(시작 정점에서의 거리)과 상태, 간선의 모양(나무 간선은 굵은 실선)과 상태, 가장 먼 정점을
 * 두른 「best」 묶음, 무대 아래 스택 띠만 바꾼다(`src/_viz/player/graphStage.ts`). 간선 머리말은 가중치다.
 * 간선에 방향이 없으므로 `directed: false` 다. 거리를 아직 안 정한 정점은 점선 테(아직), 나무 간선이 아닌
 * 간선은 흐린 선이다. 띠의 칸 수는 스택이 가장 깊었을 때에 맞춰 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `treeDiameter-guide.test.ts` 가 잰다.
 */
export const diameterWalk = {
  player: "stage",
  stage: "graph",
  title:
    "treeDiameter(7, [[0,1,2],[0,2,3],[1,3,4],[1,4,1],[2,5,5],[5,6,2]]) — 정점 안은 시작 정점에서의 거리, 간선 머리말은 가중치",
  sub: "T1–T17 · 걸음마다 준비 하나 또는 정점 하나를 꺼낸다",
  result: "16",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.5625,
        y: 0,
      },
      {
        id: 1,
        x: 0.625,
        y: 1,
      },
      {
        id: 2,
        x: 2.5,
        y: 1,
      },
      {
        id: 3,
        x: 0,
        y: 2,
      },
      {
        id: 4,
        x: 1.25,
        y: 2,
      },
      {
        id: 5,
        x: 2.5,
        y: 2,
      },
      {
        id: 6,
        x: 2.5,
        y: 3,
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
        from: 1,
        to: 3,
      },
      {
        from: 1,
        to: 4,
      },
      {
        from: 2,
        to: 5,
      },
      {
        from: 5,
        to: 6,
      },
    ],
    directed: false,
    unit: {
      x: 104,
      y: 84,
    },
  },
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      text: "간선 6 개를 양쪽 정점의 목록에 한 번씩 넣었습니다. 아직 어느 정점의 거리도 정하지 않았습니다.",
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
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "5",
        },
        {
          state: "out",
          label: "2",
        },
      ],
      groups: [],
      strips: [
        {
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "near 목록 길이의 합 =",
        result: "12 = 2E",
      },
      vars: "탐색 전",
    },
    {
      title: "T2 첫 탐색 — 정점 0 의 거리를 0 으로 두고 스택에 넣는다",
      text: "dist 를 전부 -1 로 만들고 dist[0] = 0 으로 둔 뒤 정점 0 을 스택에 넣습니다. 지금까지 가장 먼 정점은 0 자신입니다.",
      nodes: [
        {
          value: "dist 0",
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
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "5",
        },
        {
          state: "out",
          label: "2",
        },
      ],
      groups: [
        {
          members: [0],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[0] = 0 · best =",
        result: "0",
      },
      vars: "첫 탐색 · 꺼낸 정점 0 / 7",
    },
    {
      title: "T3 첫 탐색 — 0 을 꺼낸다 ②",
      text: "0 을 꺼냈습니다. 이웃 1 에 0 + 2 = 2 를 적고 스택에 넣습니다. dist[best] 0 보다 커서 best 를 1 로 옮깁니다. 이웃 2 에 0 + 3 = 3 을 적고 스택에 넣습니다. dist[best] 2 보다 커서 best 를 2 로 옮깁니다.",
      nodes: [
        {
          value: "dist 0",
          state: "read",
        },
        {
          value: "dist 2",
          state: "focus",
        },
        {
          value: "dist 3",
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
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "5",
        },
        {
          state: "out",
          label: "2",
        },
      ],
      groups: [
        {
          members: [2],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [1, 2],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[1] = 0 + 2 · dist[2] = 0 + 3",
        result: "2 · 3",
      },
      vars: "첫 탐색 · 꺼낸 정점 1 / 7",
    },
    {
      title: "T4 첫 탐색 — 2 를 꺼낸다 ① ②",
      text: "2 를 꺼냈습니다. 이웃 0 은 이미 거리 0 이 적힌 부모라 건너뜁니다. 이웃 5 에 3 + 5 = 8 을 적고 스택에 넣습니다. dist[best] 3 보다 커서 best 를 5 로 옮깁니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 3",
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
          value: "dist 8",
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
          label: "2",
        },
        {
          kind: "tree",
          state: "read",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "5",
        },
        {
          state: "out",
          label: "2",
        },
      ],
      groups: [
        {
          members: [5],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [1, 5],
          states: {
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[5] = 3 + 5",
        result: "8",
      },
      vars: "첫 탐색 · 꺼낸 정점 2 / 7",
    },
    {
      title: "T5 첫 탐색 — 5 를 꺼낸다 ① ②",
      text: "5 를 꺼냈습니다. 이웃 2 는 이미 거리 3 이 적힌 부모라 건너뜁니다. 이웃 6 에 8 + 2 = 10 을 적고 스택에 넣습니다. dist[best] 8 보다 커서 best 를 6 으로 옮깁니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 3",
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
          value: "dist 8",
          state: "read",
        },
        {
          value: "dist 10",
          state: "focus",
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
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          state: "read",
          label: "5",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
      ],
      groups: [
        {
          members: [6],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [1, 6],
          states: {
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[6] = 8 + 2",
        result: "10",
      },
      vars: "첫 탐색 · 꺼낸 정점 3 / 7",
    },
    {
      title: "T6 첫 탐색 — 6 을 꺼낸다 ①",
      text: "6 을 꺼냈습니다. 이웃 5 는 이미 거리 8 이 적힌 부모라 건너뜁니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 3",
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
          value: "dist 8",
        },
        {
          value: "dist 10",
          state: "read",
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
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          state: "read",
          label: "2",
        },
      ],
      groups: [
        {
          members: [6],
          label: "best",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [1],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[5] = 8 ≥ 0 →",
        result: "건너뜀",
      },
      vars: "첫 탐색 · 꺼낸 정점 4 / 7",
    },
    {
      title: "T7 첫 탐색 — 1 을 꺼낸다 ①",
      text: "1 을 꺼냈습니다. 이웃 0 은 이미 거리 0 이 적힌 부모라 건너뜁니다. 이웃 3 에 2 + 4 = 6 을 적고 스택에 넣습니다. dist[best] 10 보다 크지 않아 best 는 6 그대로입니다. 이웃 4 에 2 + 1 = 3 을 적고 스택에 넣습니다. dist[best] 10 보다 크지 않아 best 는 6 그대로입니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 2",
          state: "read",
        },
        {
          value: "dist 3",
        },
        {
          value: "dist 6",
          state: "focus",
        },
        {
          value: "dist 3",
          state: "focus",
        },
        {
          value: "dist 8",
        },
        {
          value: "dist 10",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "2",
        },
        {
          kind: "tree",
          label: "3",
        },
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
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [6],
          label: "best",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3, 4],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[3] = 2 + 4 · dist[4] = 2 + 1",
        result: "6 · 3",
      },
      vars: "첫 탐색 · 꺼낸 정점 5 / 7",
    },
    {
      title: "T8 첫 탐색 — 4 를 꺼낸다 ①",
      text: "4 를 꺼냈습니다. 이웃 1 은 이미 거리 2 가 적힌 부모라 건너뜁니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 3",
        },
        {
          value: "dist 6",
        },
        {
          value: "dist 3",
          state: "read",
        },
        {
          value: "dist 8",
        },
        {
          value: "dist 10",
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
          label: "4",
        },
        {
          kind: "tree",
          state: "read",
          label: "1",
        },
        {
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [6],
          label: "best",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[1] = 2 ≥ 0 →",
        result: "건너뜀",
      },
      vars: "첫 탐색 · 꺼낸 정점 6 / 7",
    },
    {
      title: "T9 첫 탐색 — 3 을 꺼낸다 ①",
      text: "3 을 꺼냈습니다. 이웃 1 은 이미 거리 2 가 적힌 부모라 건너뜁니다. 스택이 비어 첫 탐색이 끝납니다. 가장 먼 정점은 6 이고 거리는 10 입니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 3",
        },
        {
          value: "dist 6",
          state: "read",
        },
        {
          value: "dist 3",
        },
        {
          value: "dist 8",
        },
        {
          value: "dist 10",
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
          state: "read",
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [6],
          label: "best",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[1] = 2 ≥ 0 →",
        result: "건너뜀",
      },
      vars: "첫 탐색 · 꺼낸 정점 7 / 7",
    },
    {
      title: "T10 둘째 탐색 — 첫 탐색의 best 6 에서 다시 시작한다 ③",
      text: "첫 탐색이 찾은 가장 먼 정점 6 을 새 시작 정점으로 잡습니다. dist 를 새로 만들어 전부 -1 로 두고 dist[6] = 0 입니다. 첫 탐색의 거리는 쓰지 않습니다.",
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
        {
          value: "dist 0",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "5",
        },
        {
          state: "out",
          label: "2",
        },
      ],
      groups: [
        {
          members: [6],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [6],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "a = 첫 탐색의 best =",
        result: "6",
      },
      vars: "둘째 탐색 · 꺼낸 정점 0 / 7",
    },
    {
      title: "T11 둘째 탐색 — 6 을 꺼낸다 ②",
      text: "6 을 꺼냈습니다. 이웃 5 에 0 + 2 = 2 를 적고 스택에 넣습니다. dist[best] 0 보다 커서 best 를 5 로 옮깁니다.",
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
          value: "dist 2",
          state: "focus",
        },
        {
          value: "dist 0",
          state: "read",
        },
      ],
      edges: [
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "5",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
      ],
      groups: [
        {
          members: [5],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [5],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[5] = 0 + 2",
        result: "2",
      },
      vars: "둘째 탐색 · 꺼낸 정점 1 / 7",
    },
    {
      title: "T12 둘째 탐색 — 5 를 꺼낸다 ② ①",
      text: "5 를 꺼냈습니다. 이웃 2 에 2 + 5 = 7 을 적고 스택에 넣습니다. dist[best] 2 보다 커서 best 를 2 로 옮깁니다. 이웃 6 은 이미 거리 0 이 적힌 부모라 건너뜁니다.",
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
          value: "dist 7",
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
          value: "dist 2",
          state: "read",
        },
        {
          value: "dist 0",
        },
      ],
      edges: [
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "5",
        },
        {
          kind: "tree",
          state: "read",
          label: "2",
        },
      ],
      groups: [
        {
          members: [2],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [2],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[2] = 2 + 5",
        result: "7",
      },
      vars: "둘째 탐색 · 꺼낸 정점 2 / 7",
    },
    {
      title: "T13 둘째 탐색 — 2 를 꺼낸다 ② ①",
      text: "2 를 꺼냈습니다. 이웃 0 에 7 + 3 = 10 을 적고 스택에 넣습니다. dist[best] 7 보다 커서 best 를 0 으로 옮깁니다. 이웃 5 는 이미 거리 2 가 적힌 부모라 건너뜁니다.",
      nodes: [
        {
          value: "dist 10",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "dist 7",
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
          value: "dist 2",
        },
        {
          value: "dist 0",
        },
      ],
      edges: [
        {
          state: "out",
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          state: "read",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [0],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[0] = 7 + 3",
        result: "10",
      },
      vars: "둘째 탐색 · 꺼낸 정점 3 / 7",
    },
    {
      title: "T14 둘째 탐색 — 0 을 꺼낸다 ② ①",
      text: "0 을 꺼냈습니다. 이웃 1 에 10 + 2 = 12 를 적고 스택에 넣습니다. dist[best] 10 보다 커서 best 를 1 로 옮깁니다. 이웃 2 는 이미 거리 7 이 적힌 부모라 건너뜁니다.",
      nodes: [
        {
          value: "dist 10",
          state: "read",
        },
        {
          value: "dist 12",
          state: "focus",
        },
        {
          value: "dist 7",
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
          value: "dist 2",
        },
        {
          value: "dist 0",
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
          state: "read",
          label: "3",
        },
        {
          state: "out",
          label: "4",
        },
        {
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [1],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[1] = 10 + 2",
        result: "12",
      },
      vars: "둘째 탐색 · 꺼낸 정점 4 / 7",
    },
    {
      title: "T15 둘째 탐색 — 1 을 꺼낸다 ① ②",
      text: "1 을 꺼냈습니다. 이웃 0 은 이미 거리 10 이 적힌 부모라 건너뜁니다. 이웃 3 에 12 + 4 = 16 을 적고 스택에 넣습니다. dist[best] 12 보다 커서 best 를 3 으로 옮깁니다. 이웃 4 에 12 + 1 = 13 을 적고 스택에 넣습니다. dist[best] 16 보다 크지 않아 best 는 3 그대로입니다.",
      nodes: [
        {
          value: "dist 10",
        },
        {
          value: "dist 12",
          state: "read",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 16",
          state: "focus",
        },
        {
          value: "dist 13",
          state: "focus",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 0",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
          label: "2",
        },
        {
          kind: "tree",
          label: "3",
        },
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
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [3],
          label: "best",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3, 4],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[3] = 12 + 4 · dist[4] = 12 + 1",
        result: "16 · 13",
      },
      vars: "둘째 탐색 · 꺼낸 정점 5 / 7",
    },
    {
      title: "T16 둘째 탐색 — 4 를 꺼낸다 ①",
      text: "4 를 꺼냈습니다. 이웃 1 은 이미 거리 12 가 적힌 부모라 건너뜁니다.",
      nodes: [
        {
          value: "dist 10",
        },
        {
          value: "dist 12",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 16",
        },
        {
          value: "dist 13",
          state: "read",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 0",
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
          label: "4",
        },
        {
          kind: "tree",
          state: "read",
          label: "1",
        },
        {
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [3],
          label: "best",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [3],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "dist[1] = 12 ≥ 0 →",
        result: "건너뜀",
      },
      vars: "둘째 탐색 · 꺼낸 정점 6 / 7",
    },
    {
      title: "T17 둘째 탐색 — 3 을 꺼낸다 ① ④",
      text: "3 을 꺼냈습니다. 이웃 1 은 이미 거리 12 가 적힌 부모라 건너뜁니다. 스택이 비어 둘째 탐색이 끝납니다. dist[3] = 16 을 반환합니다.",
      nodes: [
        {
          value: "dist 10",
        },
        {
          value: "dist 12",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 16",
          state: "read",
        },
        {
          value: "dist 13",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 0",
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
          state: "read",
          label: "4",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
      ],
      groups: [
        {
          members: [3],
          label: "best",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "반환 dist[3] =",
        result: "16",
      },
      vars: "둘째 탐색 · 꺼낸 정점 7 / 7",
    },
  ],
};
