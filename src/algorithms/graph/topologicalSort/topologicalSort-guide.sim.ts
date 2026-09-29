/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 준비, 큐에서 꺼내기 한 번이 걸음 하나,
 * 마지막 걸음이 큐가 비어 끝나는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 진입 차수와
 * 상태, 간선의 상태, 무대 아래 띠 둘(`strips` — 큐 배열 전체와 order)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 결과에 넣은 정점과 그 정점에서 나가는 간선은 「이번 걸음 밖」으로
 * 흐리게 그린다 — 지운 셈 친 자리다. 큐 띠에서 이미 꺼낸 칸도 「이번 걸음 밖」이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `topologicalSort-guide.test.ts` 가 잰다.
 */
export const topoWalk = {
  player: "stage",
  stage: "graph",
  title:
    "topologicalSort(6, [[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]]) — 정점 안의 수는 진입 차수",
  sub: "T1–T8 · 걸음마다 꺼내기 하나",
  result: "[4,5,2,0,3,1]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.2,
        y: 1.3,
      },
      {
        id: 1,
        x: 2.4,
        y: 2.6,
      },
      {
        id: 2,
        x: 0,
        y: 1.3,
      },
      {
        id: 3,
        x: 0,
        y: 2.6,
      },
      {
        id: 4,
        x: 2.4,
        y: 0,
      },
      {
        id: 5,
        x: 0,
        y: 0,
      },
    ],
    edges: [
      {
        from: 5,
        to: 2,
      },
      {
        from: 5,
        to: 0,
      },
      {
        from: 4,
        to: 0,
      },
      {
        from: 4,
        to: 1,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 3,
        to: 1,
      },
    ],
  },
  steps: [
    {
      title: "T1 진입 차수를 세고 0 인 정점을 담는다",
      text: "간선 6 개를 한 번씩 읽어 정점마다 진입 차수를 셉니다. 진입 차수가 0 인 정점 4 · 5 를 번호 순서로 큐에 담습니다.",
      nodes: [
        {
          value: "진입 2",
        },
        {
          value: "진입 2",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 1",
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
      edges: [{}, {}, {}, {}, {}, {}],
      strips: [
        {
          label: "큐",
          values: [4, 5],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [],
          states: {},
          slots: 6,
        },
      ],
      calc: {
        expr: "진입 차수가 0 인 정점 →",
        result: "4 · 5",
      },
      vars: "head = 0 · 줄인 간선 0 / 6",
    },
    {
      title: "T2 정점 4 를 꺼낸다",
      text: "정점 4 를 order 뒤에 붙이고, 나가는 간선의 머리 0 · 1 의 진입 차수를 하나씩 줄입니다. 0 · 1 의 진입 차수는 아직 0 이 아니라 담지 않습니다.",
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
          value: "진입 1",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 0",
          state: "read",
        },
        {
          value: "진입 0",
        },
      ],
      edges: [
        {},
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
      strips: [
        {
          label: "큐",
          values: [4, 5],
          states: {
            "0": "read",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4],
          states: {
            "0": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "indegree[0] = 2 − 1 = 1 · indegree[1] = 2 − 1 =",
        result: "1",
      },
      vars: "head = 1 · 줄인 간선 2 / 6",
    },
    {
      title: "T3 정점 5 를 꺼낸다",
      text: "정점 5 를 order 뒤에 붙이고, 나가는 간선의 머리 2 · 0 의 진입 차수를 하나씩 줄입니다. 2 · 0 의 진입 차수가 0 이 되어 그 자리에서 큐 뒤에 담습니다.",
      nodes: [
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "read",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "큐",
          values: [4, 5, 2, 0],
          states: {
            "0": "out",
            "1": "read",
            "2": "focus",
            "3": "focus",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4, 5],
          states: {
            "1": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "indegree[2] = 1 − 1 = 0 · indegree[0] = 1 − 1 =",
        result: "0",
      },
      vars: "head = 2 · 줄인 간선 4 / 6",
    },
    {
      title: "T4 정점 2 를 꺼낸다",
      text: "정점 2 를 order 뒤에 붙이고, 나가는 간선의 머리 3 의 진입 차수를 하나씩 줄입니다. 3 의 진입 차수가 0 이 되어 그 자리에서 큐 뒤에 담습니다.",
      nodes: [
        {
          value: "진입 0",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 0",
          state: "read",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "read",
        },
        {},
      ],
      strips: [
        {
          label: "큐",
          values: [4, 5, 2, 0, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "read",
            "4": "focus",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4, 5, 2],
          states: {
            "2": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "indegree[3] = 1 − 1 =",
        result: "0",
      },
      vars: "head = 3 · 줄인 간선 5 / 6",
    },
    {
      title: "T5 정점 0 을 꺼낸다",
      text: "정점 0 을 order 뒤에 붙입니다. 나가는 간선이 없어 줄일 진입 차수가 없습니다.",
      nodes: [
        {
          value: "진입 0",
          state: "read",
        },
        {
          value: "진입 1",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {},
      ],
      strips: [
        {
          label: "큐",
          values: [4, 5, 2, 0, 3],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "read",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4, 5, 2, 0],
          states: {
            "3": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "next[0] =",
        result: "[]",
      },
      vars: "head = 4 · 줄인 간선 5 / 6",
    },
    {
      title: "T6 정점 3 을 꺼낸다",
      text: "정점 3 을 order 뒤에 붙이고, 나가는 간선의 머리 1 의 진입 차수를 하나씩 줄입니다. 1 의 진입 차수가 0 이 되어 그 자리에서 큐 뒤에 담습니다.",
      nodes: [
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "focus",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "read",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "read",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [4, 5, 2, 0, 3, 1],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "read",
            "5": "focus",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4, 5, 2, 0, 3],
          states: {
            "4": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "indegree[1] = 1 − 1 =",
        result: "0",
      },
      vars: "head = 5 · 줄인 간선 6 / 6",
    },
    {
      title: "T7 정점 1 을 꺼낸다",
      text: "정점 1 을 order 뒤에 붙입니다. 나가는 간선이 없어 줄일 진입 차수가 없습니다.",
      nodes: [
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "read",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [4, 5, 2, 0, 3, 1],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "read",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4, 5, 2, 0, 3, 1],
          states: {
            "5": "focus",
          },
          slots: 6,
        },
      ],
      calc: {
        expr: "next[1] =",
        result: "[]",
      },
      vars: "head = 6 · 줄인 간선 6 / 6",
    },
    {
      title: "T8 큐가 비어 끝난다",
      text: "head 가 큐 길이 6 에 이르러 꺼낼 정점이 없습니다. order 에 정점 6 개가 다 들어갔으니 [4, 5, 2, 0, 3, 1] 을 돌려줍니다.",
      nodes: [
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
        {
          value: "진입 0",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
        {
          state: "out",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [4, 5, 2, 0, 3, 1],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
          },
          slots: 6,
        },
        {
          label: "order",
          values: [4, 5, 2, 0, 3, 1],
          states: {},
          slots: 6,
        },
      ],
      calc: {
        expr: "order.length === n → 6 === 6 →",
        result: "참",
      },
      vars: "head = 6 · 줄인 간선 6 / 6",
    },
  ],
};
