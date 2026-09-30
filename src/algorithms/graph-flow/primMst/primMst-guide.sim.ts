/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작 항목을 넣는 준비이고, 우선순위 큐에서
 * 항목 하나를 꺼내는 일이 걸음 하나, 마지막 걸음이 정점이 다 차서 반환하는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(「트리 · 키」
 * 또는 「후보 · 키」)과 상태, 간선의 종류와 상태, 트리 안 정점의 테(`groups`), 무대 아래 우선순위 큐의
 * 띠 둘(`strips`)만 바꾼다(`src/_viz/player/graphStage.ts`). 네 자리를 그렇게 쓰는 까닭은 그림 사이드카
 * 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `primMst-guide.test.ts` 가 잰다.
 */
export const primWalk = {
  player: "stage",
  stage: "graph",
  title:
    "primMst(6, [[0,1,1],[0,3,4],[0,5,7],[1,2,3],[2,3,2],[3,4,6],[4,5,5]]) — 간선 옆 수는 가중치, 아래 두 줄은 우선순위 큐를 꺼낼 차례대로",
  sub: "T1–T8 · 우선순위 큐에서 항목 하나를 꺼내는 일이 걸음 하나",
  result: "17",
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
        y: 0,
      },
      {
        id: 2,
        x: 3,
        y: 1.6,
      },
      {
        id: 3,
        x: 1.5,
        y: 1.6,
      },
      {
        id: 4,
        x: 0,
        y: 1.6,
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
        from: 0,
        to: 3,
      },
      {
        from: 0,
        to: 5,
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
        to: 5,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 시작값 — 큐에 0(0)",
      text: "간선 목록을 이웃 목록으로 바꾸고, 정점 0 을 키 0 짜리 항목으로 우선순위 큐에 넣습니다. 트리에 든 정점은 아직 없고 total 은 0 입니다.",
      nodes: [
        {
          value: "후보 · 0",
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
          label: "1",
        },
        {
          label: "4",
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
        {
          label: "5",
        },
      ],
      groups: [],
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
        expr: "pq.push(0, 0) →",
        result: "항목 0(0)",
      },
      vars: "total = 0 · joined = 0 / 6",
    },
    {
      title: "T2 항목 0(0) 을 꺼낸다 — 정점 0 을 트리에 넣는다",
      text: "정점 0 은 트리 밖이라 트리에 넣고 total 에 키 0 을 더해 0 이 됩니다. 트리 밖 이웃을 항목 1(1) · 3(4) · 5(7) 으로 넣습니다.",
      nodes: [
        {
          value: "트리 · 0",
          state: "focus",
        },
        {
          value: "후보 · 1",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "후보 · 4",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "후보 · 7",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "read",
          label: "1",
        },
        {
          state: "read",
          label: "4",
        },
        {
          state: "read",
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
        {
          label: "5",
        },
      ],
      groups: [
        {
          members: [0],
          label: "트리 안 S",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [1, 3, 5],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [1, 4, 7],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "inTree[0] === true →",
        result: "거짓",
      },
      vars: "total = 0 · joined = 1 / 6",
    },
    {
      title: "T3 항목 1(1) 을 꺼낸다 — 정점 1 을 트리에 넣는다",
      text: "정점 1 은 트리 밖이라 트리에 넣고 total 에 키 1 을 더해 1 이 됩니다. 트리 밖 이웃을 항목 2(3) 으로 넣습니다.",
      nodes: [
        {
          value: "트리 · 0",
        },
        {
          value: "트리 · 1",
          state: "focus",
        },
        {
          value: "후보 · 3",
          state: "focus",
        },
        {
          value: "후보 · 4",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "후보 · 7",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
          label: "1",
        },
        {
          label: "4",
        },
        {
          label: "7",
        },
        {
          state: "read",
          label: "3",
        },
        {
          label: "2",
        },
        {
          label: "6",
        },
        {
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1],
          label: "트리 안 S",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [2, 3, 5],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [3, 4, 7],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "inTree[1] === true →",
        result: "거짓",
      },
      vars: "total = 1 · joined = 2 / 6",
    },
    {
      title: "T4 항목 2(3) 을 꺼낸다 — 정점 2 를 트리에 넣는다",
      text: "정점 2 는 트리 밖이라 트리에 넣고 total 에 키 3 을 더해 4 가 됩니다. 트리 밖 이웃을 항목 3(2) 으로 넣습니다.",
      nodes: [
        {
          value: "트리 · 0",
        },
        {
          value: "트리 · 1",
        },
        {
          value: "트리 · 3",
          state: "focus",
        },
        {
          value: "후보 · 2",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "후보 · 7",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "4",
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
          state: "read",
          label: "2",
        },
        {
          label: "6",
        },
        {
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1, 2],
          label: "트리 안 S",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [3, 3, 5],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [2, 4, 7],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "inTree[2] === true →",
        result: "거짓",
      },
      vars: "total = 4 · joined = 3 / 6",
    },
    {
      title: "T5 항목 3(2) 을 꺼낸다 — 정점 3 을 트리에 넣는다",
      text: "정점 3 은 트리 밖이라 트리에 넣고 total 에 키 2 를 더해 6 이 됩니다. 트리 밖 이웃을 항목 4(6) 으로 넣습니다.",
      nodes: [
        {
          value: "트리 · 0",
        },
        {
          value: "트리 · 1",
        },
        {
          value: "트리 · 3",
        },
        {
          value: "트리 · 2",
          state: "focus",
        },
        {
          value: "후보 · 6",
          state: "focus",
        },
        {
          value: "후보 · 7",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "4",
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
          state: "read",
          label: "6",
        },
        {
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "트리 안 S",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [3, 4, 5],
          states: {
            "0": "out",
            "1": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [4, 6, 7],
          states: {
            "0": "out",
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "inTree[3] === true →",
        result: "거짓",
      },
      vars: "total = 6 · joined = 4 / 6",
    },
    {
      title: "T6 항목 3(4) 을 꺼낸다 — 지나간 후보라 버린다",
      text: "정점 3 은 이미 트리 안입니다. 이 항목은 정점 3 이 더 가벼운 간선으로 들어가기 전에 넣어 둔 지나간 후보라, 이웃을 보지 않고 버립니다.",
      nodes: [
        {
          value: "트리 · 0",
        },
        {
          value: "트리 · 1",
        },
        {
          value: "트리 · 3",
        },
        {
          value: "트리 · 2",
          state: "read",
        },
        {
          value: "후보 · 6",
        },
        {
          value: "후보 · 7",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "back",
          state: "read",
          label: "4",
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
          label: "6",
        },
        {
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "트리 안 S",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [4, 5],
          states: {},
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [6, 7],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "inTree[3] === true →",
        result: "참",
      },
      vars: "total = 6 · joined = 4 / 6",
    },
    {
      title: "T7 항목 4(6) 을 꺼낸다 — 정점 4 를 트리에 넣는다",
      text: "정점 4 는 트리 밖이라 트리에 넣고 total 에 키 6 을 더해 12 가 됩니다. 트리 밖 이웃을 항목 5(5) 으로 넣습니다.",
      nodes: [
        {
          value: "트리 · 0",
        },
        {
          value: "트리 · 1",
        },
        {
          value: "트리 · 3",
        },
        {
          value: "트리 · 2",
        },
        {
          value: "트리 · 6",
          state: "focus",
        },
        {
          value: "후보 · 5",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "back",
          label: "4",
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
        {
          state: "read",
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3, 4],
          label: "트리 안 S",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [5, 5],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [5, 7],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "inTree[4] === true →",
        result: "거짓",
      },
      vars: "total = 12 · joined = 5 / 6",
    },
    {
      title: "T8 항목 5(5) 을 꺼낸다 — 정점 5 를 넣어 다 찼다",
      text: "정점 5 는 트리 밖이라 트리에 넣고 total 에 키 5 를 더해 17 이 됩니다. 정점 6 개가 다 차 17 을 돌려주고, 큐에 남은 5(7) 은 꺼내지 않습니다.",
      nodes: [
        {
          value: "트리 · 0",
        },
        {
          value: "트리 · 1",
        },
        {
          value: "트리 · 3",
        },
        {
          value: "트리 · 2",
        },
        {
          value: "트리 · 6",
        },
        {
          value: "트리 · 5",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "back",
          label: "4",
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
        {
          kind: "tree",
          state: "focus",
          label: "5",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3, 4, 5],
          label: "트리 안 S",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐 · 정점",
          values: [5],
          states: {
            "0": "out",
          },
          slots: 3,
        },
        {
          label: "큐 · 키",
          values: [7],
          states: {
            "0": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "joined === 6 →",
        result: "참",
      },
      vars: "total = 17 · joined = 6 / 6",
    },
  ],
};
