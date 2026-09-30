/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 이웃 목록 만들기 · 시작값 적기 · 순서 정하기가
 * 한 걸음씩, 자식 하나를 부모에 더하는 일 하나하나가 걸음 하나, 마지막 걸음이 뿌리의 두 칸에서 답을 읽는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적는다 — 뿌리 0 에서 매단 트리를
 * `treeLayout` 으로 놓은 자리다. 걸음마다 정점 안 아랫줄의 두 칸(`dp0 · dp1`)과 상태, 간선의 모양(순서를
 * 정한 뒤로는 나무 간선의 굵은 실선)과 상태, 무대 아래 `order` 띠만 바꾼다(`src/_viz/player/graphStage.ts`).
 * DP 테이블의 칸을 정점 안에 두는 까닭은 그림 사이드카 머리 주석에 있다. 자식을 아직 다 더하지 않아 두
 * 칸이 덜 된 정점은 점선 테(아직)다. 더하는 걸음에서는 읽은 자식이 읽음, 두 칸이 바뀐 부모가 새로 씀,
 * 둘을 잇는 간선이 새로 씀이고, 띠에서는 읽은 자리 `k` 가 읽음이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `treeMaxIndependentSet-guide.test.ts` 가 잰다.
 */
export const misWalk = {
  player: "stage",
  stage: "graph",
  title:
    "treeMaxIndependentSet(7, [[0,2],[0,1],[1,3],[1,4],[2,5],[5,6]], [9,8,-2,5,1,7,4]) — 정점 안 아랫줄은 두 칸 dp0 · dp1, 무대 아래 띠는 읽는 차례 order",
  sub: "T1–T10 · 걸음마다 준비 하나 또는 자식 하나를 부모에 더한다",
  result: "22",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.05,
        y: 0,
        label: "0 (w=9)",
      },
      {
        id: 1,
        x: 2.1,
        y: 1,
        label: "1 (w=8)",
      },
      {
        id: 2,
        x: 0,
        y: 1,
        label: "2 (w=-2)",
      },
      {
        id: 3,
        x: 1.4,
        y: 2,
        label: "3 (w=5)",
      },
      {
        id: 4,
        x: 2.8,
        y: 2,
        label: "4 (w=1)",
      },
      {
        id: 5,
        x: 0,
        y: 2,
        label: "5 (w=7)",
      },
      {
        id: 6,
        x: 0,
        y: 3,
        label: "6 (w=4)",
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
      text: "간선 6 개를 양쪽 정점의 이웃 목록에 한 번씩 넣었습니다. 아직 DP 테이블의 칸은 없습니다.",
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
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
        {
          state: "focus",
        },
      ],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "adj 목록 길이의 합 =",
        result: "12 = 2 × 6",
      },
      vars: null,
    },
    {
      title: "T2 정점마다 두 칸의 시작값을 적는다 ①",
      text: "정점마다 dp0 에 0 을, dp1 에 자기 가중치를 적었습니다. 잎 3 · 4 · 6 은 더할 자식이 없어 이 값이 끝이고, 나머지 정점은 자식을 더해야 해서 점선 테입니다.",
      nodes: [
        {
          value: "0 · 9",
          state: "focus",
        },
        {
          value: "0 · 8",
          state: "focus",
        },
        {
          value: "0 · -2",
          state: "focus",
        },
        {
          value: "0 · 5",
          state: "focus",
        },
        {
          value: "0 · 1",
          state: "focus",
        },
        {
          value: "0 · 7",
          state: "focus",
        },
        {
          value: "0 · 4",
          state: "focus",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}],
      strips: [
        {
          label: "order",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "DP 테이블 칸 2 × 7 =",
        result: "14",
      },
      vars: null,
    },
    {
      title: "T3 뿌리 0 에서 순서와 부모를 정한다 ② ③",
      text: "뿌리 0 에서 너비 우선으로 방문 순서 order 와 부모를 정했습니다. 부모 쪽 간선은 건너뛰어 간선 6 개가 모두 부모와 자식을 잇는 나무 간선이 됐습니다. 이제 order 를 뒤에서부터 읽습니다.",
      nodes: [
        {
          value: "0 · 9",
          state: "empty",
        },
        {
          value: "0 · 8",
          state: "empty",
        },
        {
          value: "0 · -2",
          state: "empty",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
        },
        {
          value: "0 · 7",
          state: "empty",
        },
        {
          value: "0 · 4",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "order =",
        result: "0 2 1 5 3 4 6",
      },
      vars: null,
    },
    {
      title: "T4 자식 6 을 부모 5 에 더한다 ④ ⑤",
      text: "order[6] = 6 입니다. 부모 5 를 안 고르는 칸 dp0[5] 에는 자식의 두 칸 0 · 4 가운데 큰 4 를, 고르는 칸 dp1[5] 에는 자식의 dp0 0 을 더합니다. 정점 5 의 자식을 모두 더해 두 칸이 끝났습니다.",
      nodes: [
        {
          value: "0 · 9",
          state: "empty",
        },
        {
          value: "0 · 8",
          state: "empty",
        },
        {
          value: "0 · -2",
          state: "empty",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
        },
        {
          value: "4 · 7",
          state: "focus",
        },
        {
          value: "0 · 4",
          state: "read",
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
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "6": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "dp0[5] = 0 + max(0, 4) · dp1[5] = 7 + 0 →",
        result: "4 · 7",
      },
      vars: "더하기 1 / 6",
    },
    {
      title: "T5 자식 4 를 부모 1 에 더한다 ④ ⑤",
      text: "order[5] = 4 입니다. 부모 1 을 안 고르는 칸 dp0[1] 에는 자식의 두 칸 0 · 1 가운데 큰 1 을, 고르는 칸 dp1[1] 에는 자식의 dp0 0 을 더합니다. 정점 1 에는 더할 자식이 아직 남았습니다.",
      nodes: [
        {
          value: "0 · 9",
          state: "empty",
        },
        {
          value: "1 · 8",
          state: "focus",
        },
        {
          value: "0 · -2",
          state: "empty",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
          state: "read",
        },
        {
          value: "4 · 7",
        },
        {
          value: "0 · 4",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "5": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "dp0[1] = 0 + max(0, 1) · dp1[1] = 8 + 0 →",
        result: "1 · 8",
      },
      vars: "더하기 2 / 6",
    },
    {
      title: "T6 자식 3 을 부모 1 에 더한다 ④ ⑤",
      text: "order[4] = 3 입니다. 부모 1 을 안 고르는 칸 dp0[1] 에는 자식의 두 칸 0 · 5 가운데 큰 5 를, 고르는 칸 dp1[1] 에는 자식의 dp0 0 을 더합니다. 정점 1 의 자식을 모두 더해 두 칸이 끝났습니다.",
      nodes: [
        {
          value: "0 · 9",
          state: "empty",
        },
        {
          value: "6 · 8",
          state: "focus",
        },
        {
          value: "0 · -2",
          state: "empty",
        },
        {
          value: "0 · 5",
          state: "read",
        },
        {
          value: "0 · 1",
        },
        {
          value: "4 · 7",
        },
        {
          value: "0 · 4",
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
          state: "focus",
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
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "4": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "dp0[1] = 1 + max(0, 5) · dp1[1] = 8 + 0 →",
        result: "6 · 8",
      },
      vars: "더하기 3 / 6",
    },
    {
      title: "T7 자식 5 를 부모 2 에 더한다 ④ ⑤",
      text: "order[3] = 5 입니다. 부모 2 를 안 고르는 칸 dp0[2] 에는 자식의 두 칸 4 · 7 가운데 큰 7 을, 고르는 칸 dp1[2] 에는 자식의 dp0 4 를 더합니다. 정점 2 의 자식을 모두 더해 두 칸이 끝났습니다.",
      nodes: [
        {
          value: "0 · 9",
          state: "empty",
        },
        {
          value: "6 · 8",
        },
        {
          value: "7 · 2",
          state: "focus",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
        },
        {
          value: "4 · 7",
          state: "read",
        },
        {
          value: "0 · 4",
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
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "3": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "dp0[2] = 0 + max(4, 7) · dp1[2] = -2 + 4 →",
        result: "7 · 2",
      },
      vars: "더하기 4 / 6",
    },
    {
      title: "T8 자식 1 을 부모 0 에 더한다 ④ ⑤",
      text: "order[2] = 1 입니다. 부모 0 을 안 고르는 칸 dp0[0] 에는 자식의 두 칸 6 · 8 가운데 큰 8 을, 고르는 칸 dp1[0] 에는 자식의 dp0 6 을 더합니다. 정점 0 에는 더할 자식이 아직 남았습니다.",
      nodes: [
        {
          value: "8 · 15",
          state: "focus",
        },
        {
          value: "6 · 8",
          state: "read",
        },
        {
          value: "7 · 2",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
        },
        {
          value: "4 · 7",
        },
        {
          value: "0 · 4",
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
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "2": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "dp0[0] = 0 + max(6, 8) · dp1[0] = 9 + 6 →",
        result: "8 · 15",
      },
      vars: "더하기 5 / 6",
    },
    {
      title: "T9 자식 2 를 부모 0 에 더한다 ④ ⑤",
      text: "order[1] = 2 입니다. 부모 0 을 안 고르는 칸 dp0[0] 에는 자식의 두 칸 7 · 2 가운데 큰 7 을, 고르는 칸 dp1[0] 에는 자식의 dp0 7 을 더합니다. 정점 0 의 자식을 모두 더해 두 칸이 끝났습니다.",
      nodes: [
        {
          value: "15 · 22",
          state: "focus",
        },
        {
          value: "6 · 8",
        },
        {
          value: "7 · 2",
          state: "read",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
        },
        {
          value: "4 · 7",
        },
        {
          value: "0 · 4",
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
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {
            "1": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "dp0[0] = 8 + max(7, 2) · dp1[0] = 15 + 7 →",
        result: "15 · 22",
      },
      vars: "더하기 6 / 6",
    },
    {
      title: "T10 뿌리의 두 칸 중 큰 쪽을 돌려준다 ⑥",
      text: "뿌리는 부모가 없어 두 칸 중 아무 쪽이나 고를 수 있습니다. 22 와 15 가운데 큰 22 를 돌려줍니다.",
      nodes: [
        {
          value: "15 · 22",
          state: "read",
        },
        {
          value: "6 · 8",
        },
        {
          value: "7 · 2",
        },
        {
          value: "0 · 5",
        },
        {
          value: "0 · 1",
        },
        {
          value: "4 · 7",
        },
        {
          value: "0 · 4",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "order",
          values: [0, 2, 1, 5, 3, 4, 6],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "max(dp0[0], dp1[0]) = max(15, 22) =",
        result: "22",
      },
      vars: "더하기 6 / 6",
    },
  ],
};
