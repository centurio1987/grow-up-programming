/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작, 큐에서 항목 하나를 꺼내는 일이
 * 걸음 하나이고, 마지막 걸음이 목표를 꺼내 답을 돌려주는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(지금까지
 * 찾은 비용 `g`)과 상태, 간선의 종류(지금 비용을 낸 간선은 굵은 실선)와 상태, 무대 아래 우선순위 큐의
 * 띠 둘(`strips`)만 바꾼다(`src/_viz/player/graphStage.ts`). 정점 이름 옆의 `h` 는 정점마다 고정인
 * 추정이다.
 *
 * 우선순위 큐의 띠는 큐에 든 항목을 **꺼낼 차례대로** 늘어놓는다 — 윗줄이 정점, 아랫줄이 키(비용 +
 * 추정)이고 같은 칸 번호가 한 항목이다. 이번 걸음에 넣은 항목은 새로 씀, 뒤처진 기록은 이번 걸음 밖이다.
 * `dijkstra` 편과 같은 규약이고, 그렇게 정한 까닭은 그 편 그림 사이드카 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `aStarSearch-guide.test.ts` 가 잰다.
 */
export const aStarWalk = {
  player: "stage",
  stage: "graph",
  title:
    "aStarSearch(8, [[0,1,3],[0,2,4],[0,7,5],[1,4,2],[2,3,7],[4,3,3],[3,5,2],[5,6,6]], 0, 6, h) — 간선 옆 수는 가중치, h 는 목표까지의 맨해튼 거리",
  sub: "T1–T9 · 걸음마다 큐에서 항목 하나",
  result: "16",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 5,
        label: "0 · h 8",
      },
      {
        id: 1,
        x: 2,
        y: 4,
        label: "1 · h 7",
      },
      {
        id: 2,
        x: 3,
        y: 5,
        label: "2 · h 5",
      },
      {
        id: 3,
        x: 5,
        y: 5,
        label: "3 · h 3",
      },
      {
        id: 4,
        x: 4,
        y: 4,
        label: "4 · h 5",
      },
      {
        id: 5,
        x: 6,
        y: 5,
        label: "5 · h 2",
      },
      {
        id: 6,
        x: 8,
        y: 5,
        label: "6 · h 0",
      },
      {
        id: 7,
        x: 0,
        y: 0,
        label: "7 · h 13",
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
        from: 0,
        to: 7,
      },
      {
        from: 1,
        to: 4,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 4,
        to: 3,
      },
      {
        from: 3,
        to: 5,
      },
      {
        from: 5,
        to: 6,
      },
    ],
    directed: true,
    unit: {
      x: 104,
      y: 64,
    },
  },
  steps: [
    {
      title: "T1 시작값 — 큐에 (0, 0, 8)",
      text: "g[0] 에 0 을 적고 나머지는 Infinity 로 둡니다. 시작 정점의 키는 비용 0 에 추정 8 을 더한 8 이고, 우선순위 큐에는 항목 (0, 0, 8) 하나가 들어갑니다.",
      nodes: [
        {
          value: "g 0",
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
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "3",
        },
        {
          label: "4",
        },
        {
          label: "5",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
        {
          label: "3",
        },
        {
          label: "2",
        },
        {
          label: "6",
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
          values: [8],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "키 = 0 + h(0) =",
        result: "8",
      },
      vars: "확장한 정점 0 / 6",
    },
    {
      title: "T2 정점 0 을 꺼낸다 — 키 8",
      text: "키 8 로 나온 항목의 비용 0 이 지금 적힌 g[0] 의 값과 같아 정점 0 을 확장합니다. 간선 0→1 은 0 + 3 = 3 이 처음 적히고, 키 3 + 7 = 10 으로 (1, 3, 10) 을 넣습니다. 간선 0→2 는 0 + 4 = 4 가 처음 적히고, 키 4 + 5 = 9 로 (2, 4, 9) 를 넣습니다. 간선 0→7 은 0 + 5 = 5 가 처음 적히고, 키 5 + 13 = 18 로 (7, 5, 18) 을 넣습니다.",
      nodes: [
        {
          value: "g 0",
          state: "read",
        },
        {
          value: "g 3",
          state: "focus",
        },
        {
          value: "g 4",
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
          value: "g 5",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
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
          label: "5",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
        {
          label: "3",
        },
        {
          label: "2",
        },
        {
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [2, 1, 7],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [9, 10, 18],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 = g[0] →",
        result: "확장",
      },
      vars: "확장한 정점 1 / 6",
    },
    {
      title: "T3 정점 2 를 꺼낸다 — 키 9",
      text: "키 9 로 나온 항목의 비용 4 가 지금 적힌 g[2] 의 값과 같아 정점 2 를 확장합니다. 간선 2→3 은 4 + 7 = 11 이 처음 적히고, 키 11 + 3 = 14 로 (3, 11, 14) 를 넣습니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
        },
        {
          value: "g 4",
          state: "read",
        },
        {
          value: "g 11",
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
          value: "g 5",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "7",
        },
        {
          label: "3",
        },
        {
          label: "2",
        },
        {
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [1, 3, 7],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [10, 14, 18],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "4 = g[2] →",
        result: "확장",
      },
      vars: "확장한 정점 2 / 6",
    },
    {
      title: "T4 정점 1 을 꺼낸다 — 키 10",
      text: "키 10 으로 나온 항목의 비용 3 이 지금 적힌 g[1] 의 값과 같아 정점 1 을 확장합니다. 간선 1→4 는 3 + 2 = 5 가 처음 적히고, 키 5 + 5 = 10 으로 (4, 5, 10) 을 넣습니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
          state: "read",
        },
        {
          value: "g 4",
        },
        {
          value: "g 11",
        },
        {
          value: "g 5",
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
          value: "g 5",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          kind: "tree",
          label: "7",
        },
        {
          label: "3",
        },
        {
          label: "2",
        },
        {
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [4, 3, 7],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [10, 14, 18],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "3 = g[1] →",
        result: "확장",
      },
      vars: "확장한 정점 3 / 6",
    },
    {
      title: "T5 정점 4 를 꺼낸다 — 키 10",
      text: "키 10 으로 나온 항목의 비용 5 가 지금 적힌 g[4] 의 값과 같아 정점 4 를 확장합니다. 간선 4→3 은 5 + 3 = 8 이 적혀 있던 11 보다 작아 고치고, 키 8 + 3 = 11 로 (3, 8, 11) 을 넣습니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
        },
        {
          value: "g 4",
        },
        {
          value: "g 8",
          state: "focus",
        },
        {
          value: "g 5",
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
          value: "g 5",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "7",
        },
        {
          kind: "tree",
          state: "focus",
          label: "3",
        },
        {
          label: "2",
        },
        {
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [3, 3, 7],
          states: {
            "0": "focus",
            "1": "out",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [11, 14, 18],
          states: {
            "0": "focus",
            "1": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "5 = g[4] →",
        result: "확장",
      },
      vars: "확장한 정점 4 / 6",
    },
    {
      title: "T6 정점 3 을 꺼낸다 — 키 11",
      text: "키 11 로 나온 항목의 비용 8 이 지금 적힌 g[3] 의 값과 같아 정점 3 을 확장합니다. 간선 3→5 는 8 + 2 = 10 이 처음 적히고, 키 10 + 2 = 12 로 (5, 10, 12) 를 넣습니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
        },
        {
          value: "g 4",
        },
        {
          value: "g 8",
          state: "read",
        },
        {
          value: "g 5",
        },
        {
          value: "g 10",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "g 5",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "7",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [5, 3, 7],
          states: {
            "0": "focus",
            "1": "out",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [12, 14, 18],
          states: {
            "0": "focus",
            "1": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "8 = g[3] →",
        result: "확장",
      },
      vars: "확장한 정점 5 / 6",
    },
    {
      title: "T7 정점 5 를 꺼낸다 — 키 12",
      text: "키 12 로 나온 항목의 비용 10 이 지금 적힌 g[5] 의 값과 같아 정점 5 를 확장합니다. 간선 5→6 은 10 + 6 = 16 이 처음 적히고, 키 16 + 0 = 16 으로 (6, 16, 16) 을 넣습니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
        },
        {
          value: "g 4",
        },
        {
          value: "g 8",
        },
        {
          value: "g 5",
        },
        {
          value: "g 10",
          state: "read",
        },
        {
          value: "g 16",
          state: "focus",
        },
        {
          value: "g 5",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "7",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [3, 6, 7],
          states: {
            "0": "out",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [14, 16, 18],
          states: {
            "0": "out",
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "10 = g[5] →",
        result: "확장",
      },
      vars: "확장한 정점 6 / 6",
    },
    {
      title: "T8 정점 3 을 다시 꺼낸다 — 키 14",
      text: "항목의 비용 11 이 지금 적힌 g[3] = 8 보다 큽니다. 더 작은 값으로 고치기 전에 넣어 둔 뒤처진 기록이라, 이웃을 하나도 보지 않고 버립니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
        },
        {
          value: "g 4",
        },
        {
          value: "g 8",
          state: "read",
        },
        {
          value: "g 5",
        },
        {
          value: "g 10",
        },
        {
          value: "g 16",
        },
        {
          value: "g 5",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "7",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [6, 7],
          states: {},
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [16, 18],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "11 > g[3] = 8 →",
        result: "버린다",
      },
      vars: "확장한 정점 6 / 6",
    },
    {
      title: "T9 목표 정점 6 을 꺼낸다 — 키 16",
      text: "꺼낸 정점 6 이 목표라 그 항목의 비용 16 을 돌려줍니다. 큐에 남은 항목은 (7, 5, 18) 이고, 정점 7 은 한 번도 확장하지 않았습니다.",
      nodes: [
        {
          value: "g 0",
        },
        {
          value: "g 3",
        },
        {
          value: "g 4",
        },
        {
          value: "g 8",
        },
        {
          value: "g 5",
        },
        {
          value: "g 10",
        },
        {
          value: "g 16",
          state: "read",
        },
        {
          value: "g 5",
          state: "out",
        },
      ],
      edges: [
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
          label: "5",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "7",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "6",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [7],
          states: {},
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [18],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "6 === goal →",
        result: "16 반환",
      },
      vars: "확장한 정점 6 / 6",
    },
  ],
};
