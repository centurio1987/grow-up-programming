/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작, 그 뒤로 시작점 하나 · 이웃 검사
 * 하나가 걸음 하나, 마지막 걸음이 정점 번호 오름차순으로 담는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 성분 번호와
 * 상태, 간선의 종류(정점을 처음 만나게 한 간선은 굵은 실선)와 상태, 번호가 같은 정점의 묶음(`groups`),
 * 무대 아래 큐 띠(`strips`)만 바꾼다(`src/_viz/player/graphStage.ts`). 큐 띠는 지금 성분의 큐 배열
 * 전체이고, 이미 꺼낸 칸은 「이번 걸음 밖」이다. 바깥 반복의 시작점 `s` 와 `count` 는 무대에 자리가
 * 없어 남는 변수로 둔다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `connectedComponents-guide.test.ts` 가 잰다.
 */
export const ccWalk = {
  player: "stage",
  stage: "graph",
  title:
    "connectedComponents(6, [[0,4],[4,2],[2,0],[1,3]]) — 정점 안은 성분 번호",
  sub: "T1–T16 · 걸음마다 시작점 하나 또는 이웃 검사 하나",
  result: "[[0,2,4],[1,3],[5]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1,
        y: 0,
      },
      {
        id: 1,
        x: 3.4,
        y: 0,
      },
      {
        id: 2,
        x: 2,
        y: 1.3,
      },
      {
        id: 3,
        x: 3.4,
        y: 1.3,
      },
      {
        id: 4,
        x: 0,
        y: 1.3,
      },
      {
        id: 5,
        x: 4.8,
        y: 0.65,
      },
    ],
    edges: [
      {
        from: 0,
        to: 4,
      },
      {
        from: 4,
        to: 2,
      },
      {
        from: 2,
        to: 0,
      },
      {
        from: 1,
        to: 3,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 comp 를 -1 로 채운다",
      text: "이웃 목록을 만들고 comp 를 전부 -1 로 둡니다. 아직 어느 정점도 성분에 들지 않았습니다.",
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
      groups: [],
      strips: [
        {
          label: "큐",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[0 … 5] =",
        result: "-1",
      },
      vars: "count = 0",
    },
    {
      title: "T2 시작점 0 — 새 성분 0",
      text: "comp[0] 이 -1 이라 새 성분의 시작점입니다. 번호 0 을 적고 큐에 넣습니다.",
      nodes: [
        {
          value: "comp 0",
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
      groups: [
        {
          members: [0],
          label: "성분 0",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[0] = count =",
        result: "0",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T3 정점 0 의 이웃 4 — 처음 만난다",
      text: "comp[4] 가 -1 이라 처음 만나는 이웃입니다. 같은 번호 0 을 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "comp 0",
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
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
          state: "focus",
        },
        {},
        {},
        {},
      ],
      groups: [
        {
          members: [0, 4],
          label: "성분 0",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 4],
          states: {
            "0": "read",
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[4] = count =",
        result: "0",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T4 정점 0 의 이웃 2 — 처음 만난다",
      text: "comp[2] 가 -1 이라 처음 만나는 이웃입니다. 같은 번호 0 을 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
          state: "focus",
        },
        {},
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 4, 2],
          states: {
            "0": "read",
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[2] = count =",
        result: "0",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T5 정점 4 의 이웃 0 — 이미 번호가 있다",
      text: "comp[0] 에 이미 0 이 적혀 있어 그대로 둡니다.",
      nodes: [
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
          state: "read",
        },
        {},
        {
          kind: "tree",
        },
        {},
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 4, 2],
          states: {
            "0": "out",
            "1": "read",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[0] !== -1 →",
        result: "참",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T6 정점 4 의 이웃 2 — 이미 번호가 있다",
      text: "comp[2] 에 이미 0 이 적혀 있어 그대로 둡니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
          state: "read",
        },
        {
          kind: "tree",
        },
        {},
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 4, 2],
          states: {
            "0": "out",
            "1": "read",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[2] !== -1 →",
        result: "참",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T7 정점 2 의 이웃 4 — 이미 번호가 있다",
      text: "comp[4] 에 이미 0 이 적혀 있어 그대로 둡니다. 큐가 비어 이 성분의 탐색이 끝납니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
          state: "read",
        },
        {
          kind: "tree",
        },
        {},
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 4, 2],
          states: {
            "0": "out",
            "1": "out",
            "2": "read",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[4] !== -1 →",
        result: "참",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T8 정점 2 의 이웃 0 — 이미 번호가 있다",
      text: "comp[0] 에 이미 0 이 적혀 있어 그대로 둡니다. 큐가 비어 이 성분의 탐색이 끝납니다.",
      nodes: [
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
          state: "read",
        },
        {},
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 4, 2],
          states: {
            "0": "out",
            "1": "out",
            "2": "read",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[0] !== -1 →",
        result: "참",
      },
      vars: "s = 0 · count = 0",
    },
    {
      title: "T9 시작점 1 — 새 성분 1",
      text: "comp[1] 이 -1 이라 새 성분의 시작점입니다. 번호 1 을 적고 큐에 넣습니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
          state: "focus",
        },
        {
          value: "comp 0",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
        },
        {},
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1],
          label: "성분 1",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[1] = count =",
        result: "1",
      },
      vars: "s = 1 · count = 1",
    },
    {
      title: "T10 정점 1 의 이웃 3 — 처음 만난다",
      text: "comp[3] 이 -1 이라 처음 만나는 이웃입니다. 같은 번호 1 을 적고 큐 뒤에 넣습니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
          state: "read",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
          state: "focus",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [1, 3],
          states: {
            "0": "read",
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[3] = count =",
        result: "1",
      },
      vars: "s = 1 · count = 1",
    },
    {
      title: "T11 정점 3 의 이웃 1 — 이미 번호가 있다",
      text: "comp[1] 에 이미 1 이 적혀 있어 그대로 둡니다. 큐가 비어 이 성분의 탐색이 끝납니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
          state: "read",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
          state: "read",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [1, 3],
          states: {
            "0": "out",
            "1": "read",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[1] !== -1 →",
        result: "참",
      },
      vars: "s = 1 · count = 1",
    },
    {
      title: "T12 시작점 2 — 이미 성분 0 이라 건너뛴다",
      text: "comp[2] 에 이미 0 이 적혀 있습니다. 앞선 탐색이 이 정점을 담았으니 새 탐색을 시작하지 않습니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
          state: "read",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[2] !== -1 →",
        result: "참",
      },
      vars: "s = 2 · count = 2",
    },
    {
      title: "T13 시작점 3 — 이미 성분 1 이라 건너뛴다",
      text: "comp[3] 에 이미 1 이 적혀 있습니다. 앞선 탐색이 이 정점을 담았으니 새 탐색을 시작하지 않습니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
          state: "read",
        },
        {
          value: "comp 0",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[3] !== -1 →",
        result: "참",
      },
      vars: "s = 3 · count = 2",
    },
    {
      title: "T14 시작점 4 — 이미 성분 0 이라 건너뛴다",
      text: "comp[4] 에 이미 0 이 적혀 있습니다. 앞선 탐색이 이 정점을 담았으니 새 탐색을 시작하지 않습니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[4] !== -1 →",
        result: "참",
      },
      vars: "s = 4 · count = 2",
    },
    {
      title: "T15 시작점 5 — 새 성분 2",
      text: "comp[5] 가 -1 이라 새 성분의 시작점입니다. 번호 2 를 적고 큐에 넣습니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 2",
          state: "focus",
        },
      ],
      edges: [
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
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
        },
        {
          members: [5],
          label: "성분 2",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [5],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "comp[5] = count =",
        result: "2",
      },
      vars: "s = 5 · count = 2",
    },
    {
      title: "T16 정점 번호 오름차순으로 담는다",
      text: "s 가 6 에 이르러 바깥 반복이 끝났습니다. 정점 0 부터 차례로 comp 가 가리키는 칸에 넣으면 반환값은 [[0, 2, 4], [1, 3], [5]] 입니다.",
      nodes: [
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 1",
        },
        {
          value: "comp 0",
        },
        {
          value: "comp 2",
        },
      ],
      edges: [
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
      groups: [
        {
          members: [0, 2, 4],
          label: "성분 0",
        },
        {
          members: [1, 3],
          label: "성분 1",
        },
        {
          members: [5],
          label: "성분 2",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "out =",
        result: "[[0, 2, 4], [1, 3], [5]]",
      },
      vars: "s = 6 · count = 3",
    },
  ],
};
