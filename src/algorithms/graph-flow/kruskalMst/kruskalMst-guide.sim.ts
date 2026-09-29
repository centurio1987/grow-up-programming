/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 정렬, 간선 하나를 보는 일이 걸음 하나,
 * 마지막 걸음이 고른 간선이 `n − 1` 개가 되어 반환하는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(`parent`
 * 칸과 `rank` 칸)과 상태, 간선의 종류(고른 간선은 굵은 실선, 건너뛴 간선은 대시)와 상태, 덩어리의 테
 * (`groups`), 무대 아래 정렬한 간선 목록의 띠 둘(`strips`)만 바꾼다(`src/_viz/player/graphStage.ts`).
 * 네 자리를 그렇게 쓰는 까닭은 그림 사이드카 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `kruskalMst-guide.test.ts` 가 잰다.
 */
export const kruskalWalk = {
  player: "stage",
  stage: "graph",
  title:
    "kruskalMst(6, [[3,4,6],[0,1,1],[0,3,4],[4,5,5],[2,3,2],[0,5,7],[1,2,3]]) — 간선 옆 수는 가중치, 정점 안은 parent 와 rank",
  sub: "T1–T8 · 정렬 한 번 뒤 간선 하나에 걸음 하나",
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
        from: 2,
        to: 3,
      },
      {
        from: 1,
        to: 2,
      },
      {
        from: 0,
        to: 3,
      },
      {
        from: 4,
        to: 5,
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
      title: "T1 간선을 가중치 오름차순으로 놓는다",
      text: "간선 7 개를 가중치 오름차순으로 정렬했습니다. 아직 아무 간선도 고르지 않아 정점 6 개가 저마다 자기 자신을 가리킵니다.",
      nodes: [
        {
          value: "0 · 0",
        },
        {
          value: "1 · 0",
        },
        {
          value: "2 · 0",
        },
        {
          value: "3 · 0",
        },
        {
          value: "4 · 0",
        },
        {
          value: "5 · 0",
        },
      ],
      edges: [
        {
          label: "1",
        },
        {
          label: "2",
        },
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
          label: "6",
        },
        {
          label: "7",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {},
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {},
        },
      ],
      calc: null,
      vars: "total = 0 · picked = 0 / 5",
    },
    {
      title: "T2 (0,1) 가중치 1 — 대표가 달라 고른다",
      text: "정점 0 의 대표는 0, 정점 1 의 대표는 1 입니다. rank 가 둘 다 0 이라 대표 0 을 1 밑에 붙이고 rank[1] 을 1 로 올립니다. total 에 1 을 더합니다.",
      nodes: [
        {
          value: "1 · 0",
          state: "focus",
        },
        {
          value: "1 · 1",
          state: "read",
        },
        {
          value: "2 · 0",
        },
        {
          value: "3 · 0",
        },
        {
          value: "4 · 0",
        },
        {
          value: "5 · 0",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
          state: "focus",
        },
        {
          label: "2",
        },
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
          label: "6",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1],
          label: "대표 1",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "0": "focus",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "find(0), find(1) =",
        result: "0, 1",
      },
      vars: "total = 1 · picked = 1 / 5",
    },
    {
      title: "T3 (2,3) 가중치 2 — 대표가 달라 고른다",
      text: "정점 2 의 대표는 2, 정점 3 의 대표는 3 입니다. rank 가 둘 다 0 이라 대표 2 를 3 밑에 붙이고 rank[3] 을 1 로 올립니다. total 에 2 를 더합니다.",
      nodes: [
        {
          value: "1 · 0",
        },
        {
          value: "1 · 1",
        },
        {
          value: "3 · 0",
          state: "focus",
        },
        {
          value: "3 · 1",
          state: "read",
        },
        {
          value: "4 · 0",
        },
        {
          value: "5 · 0",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
        },
        {
          label: "2",
          kind: "tree",
          state: "focus",
        },
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
          label: "6",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1],
          label: "대표 1",
        },
        {
          members: [2, 3],
          label: "대표 3",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "1": "focus",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "find(2), find(3) =",
        result: "2, 3",
      },
      vars: "total = 3 · picked = 2 / 5",
    },
    {
      title: "T4 (1,2) 가중치 3 — 대표가 달라 고른다",
      text: "정점 1 의 대표는 1, 정점 2 의 대표는 3 입니다. rank 가 둘 다 1 이라 대표 1 을 3 밑에 붙이고 rank[3] 을 2 로 올립니다. total 에 3 을 더합니다.",
      nodes: [
        {
          value: "1 · 0",
        },
        {
          value: "3 · 1",
          state: "focus",
        },
        {
          value: "3 · 0",
          state: "read",
        },
        {
          value: "3 · 2",
        },
        {
          value: "4 · 0",
        },
        {
          value: "5 · 0",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
        },
        {
          label: "2",
          kind: "tree",
        },
        {
          label: "3",
          kind: "tree",
          state: "focus",
        },
        {
          label: "4",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "대표 3",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "2": "focus",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "2": "focus",
          },
        },
      ],
      calc: {
        expr: "find(1), find(2) =",
        result: "1, 3",
      },
      vars: "total = 6 · picked = 3 / 5",
    },
    {
      title: "T5 (0,3) 가중치 4 — 대표가 같아 건너뛴다",
      text: "정점 0 의 대표는 3, 정점 3 의 대표는 3 입니다. 이미 같은 덩어리라 이 간선을 넣으면 사이클이 생기므로 건너뜁니다. 대표를 찾는 동안 parent[0] 을 1 에서 3 으로 고쳐 썼습니다.",
      nodes: [
        {
          value: "3 · 0",
          state: "focus",
        },
        {
          value: "3 · 1",
        },
        {
          value: "3 · 0",
        },
        {
          value: "3 · 2",
          state: "read",
        },
        {
          value: "4 · 0",
        },
        {
          value: "5 · 0",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
        },
        {
          label: "2",
          kind: "tree",
        },
        {
          label: "3",
          kind: "tree",
        },
        {
          label: "4",
          kind: "back",
          state: "read",
        },
        {
          label: "5",
        },
        {
          label: "6",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "대표 3",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "3": "read",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "3": "read",
          },
        },
      ],
      calc: {
        expr: "find(0), find(3) =",
        result: "3, 3",
      },
      vars: "total = 6 · picked = 3 / 5",
    },
    {
      title: "T6 (4,5) 가중치 5 — 대표가 달라 고른다",
      text: "정점 4 의 대표는 4, 정점 5 의 대표는 5 입니다. rank 가 둘 다 0 이라 대표 4 를 5 밑에 붙이고 rank[5] 를 1 로 올립니다. total 에 5 를 더합니다.",
      nodes: [
        {
          value: "3 · 0",
        },
        {
          value: "3 · 1",
        },
        {
          value: "3 · 0",
        },
        {
          value: "3 · 2",
        },
        {
          value: "5 · 0",
          state: "focus",
        },
        {
          value: "5 · 1",
          state: "read",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
        },
        {
          label: "2",
          kind: "tree",
        },
        {
          label: "3",
          kind: "tree",
        },
        {
          label: "4",
          kind: "back",
        },
        {
          label: "5",
          kind: "tree",
          state: "focus",
        },
        {
          label: "6",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3],
          label: "대표 3",
        },
        {
          members: [4, 5],
          label: "대표 5",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "3": "out",
            "4": "focus",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "3": "out",
            "4": "focus",
          },
        },
      ],
      calc: {
        expr: "find(4), find(5) =",
        result: "4, 5",
      },
      vars: "total = 11 · picked = 4 / 5",
    },
    {
      title: "T7 (3,4) 가중치 6 — 대표가 달라 고른다",
      text: "정점 3 의 대표는 3, 정점 4 의 대표는 5 입니다. rank 가 2 대 1 이라 낮은 쪽 대표 5 를 3 밑에 붙이고 rank 는 그대로 둡니다. total 에 6 을 더합니다.",
      nodes: [
        {
          value: "3 · 0",
        },
        {
          value: "3 · 1",
        },
        {
          value: "3 · 0",
        },
        {
          value: "3 · 2",
          state: "read",
        },
        {
          value: "5 · 0",
          state: "read",
        },
        {
          value: "3 · 1",
          state: "focus",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
        },
        {
          label: "2",
          kind: "tree",
        },
        {
          label: "3",
          kind: "tree",
        },
        {
          label: "4",
          kind: "back",
        },
        {
          label: "5",
          kind: "tree",
        },
        {
          label: "6",
          kind: "tree",
          state: "focus",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3, 4, 5],
          label: "대표 3",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "3": "out",
            "5": "focus",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "3": "out",
            "5": "focus",
          },
        },
      ],
      calc: {
        expr: "find(3), find(4) =",
        result: "3, 5",
      },
      vars: "total = 17 · picked = 5 / 5",
    },
    {
      title: "T8 고른 간선이 5 개 — 17 을 돌려준다",
      text: "picked 가 n − 1 = 5 가 되어 반복을 끝냅니다. 남은 간선 (0,5) 는 보지 않습니다.",
      nodes: [
        {
          value: "3 · 0",
        },
        {
          value: "3 · 1",
        },
        {
          value: "3 · 0",
        },
        {
          value: "3 · 2",
        },
        {
          value: "5 · 0",
        },
        {
          value: "3 · 1",
        },
      ],
      edges: [
        {
          label: "1",
          kind: "tree",
        },
        {
          label: "2",
          kind: "tree",
        },
        {
          label: "3",
          kind: "tree",
        },
        {
          label: "4",
          kind: "back",
        },
        {
          label: "5",
          kind: "tree",
        },
        {
          label: "6",
          kind: "tree",
        },
        {
          label: "7",
        },
      ],
      groups: [
        {
          members: [0, 1, 2, 3, 4, 5],
          label: "대표 3",
        },
      ],
      strips: [
        {
          label: "정렬한 간선",
          values: [
            "(0,1)",
            "(2,3)",
            "(1,2)",
            "(0,3)",
            "(4,5)",
            "(3,4)",
            "(0,5)",
          ],
          states: {
            "3": "out",
          },
        },
        {
          label: "가중치",
          values: [1, 2, 3, 4, 5, 6, 7],
          states: {
            "3": "out",
          },
        },
      ],
      calc: {
        expr: "picked = n − 1 =",
        result: "5",
      },
      vars: "total = 17 · picked = 5 / 5",
    },
  ],
};
