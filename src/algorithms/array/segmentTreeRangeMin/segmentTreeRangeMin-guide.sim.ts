/**
 * 걸음 재생 패널 둘 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. `build` 가 트리를 채우는 걸음(노드 하나를 채우는
 * 일이 걸음 하나), `ops` 가 연산 다섯을 처리하는 걸음(질의가 노드 하나에 들어가는 일 · 두 답을 합치는 일 ·
 * 갱신이 노드 하나를 쓰는 일이 각각 걸음 하나)이다. 번호는 `build` 에서 `ops` 로 이어진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 노드 자리(`layout`)는 패널에 한 번만 적는다 — 뿌리 1 에서 매단 트리를 `treeLayout`
 * 으로 놓은 자리이고, 리프의 가로 자리가 배열 인덱스와 같다. 걸음마다 노드 안의 값(「담당 구간 = 값」,
 * 아직 안 채운 노드는 담당 구간만)과 상태, 간선의 상태, 판정을 적은 묶음, 무대 아래 띠만 바꾼다.
 * 채우는 패널의 띠는 입력 배열 `A`, 연산 패널의 띠는 답 목록이다. 아직 안 채운 노드는 점선 테(아직),
 * 질의와 한 칸도 안 겹치는 노드는 대시 테(이번 걸음 밖), 이번 걸음에 쓴 노드는 굵은 강조 테(새로 씀),
 * 읽은 노드는 굵은 잉크 테(읽음)다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `segmentTreeRangeMin-guide.test.ts` 가 잰다.
 */
export const build = {
  player: "stage",
  stage: "graph",
  title:
    "세그먼트 트리 채우기 — A = [5, 2, 4, 1, 3], 노드 안은 담당 구간과 그 최솟값",
  sub: "T1–T9 · 걸음마다 노드 하나를 채운다",
  result: "[1, 2, 1, 2, 4, 1, 3, 5, 2]",
  layout: {
    nodes: [
      {
        id: 1,
        x: 2.375,
        y: 0,
        label: "노드1",
      },
      {
        id: 2,
        x: 1.25,
        y: 1,
        label: "노드2",
      },
      {
        id: 3,
        x: 3.5,
        y: 1,
        label: "노드3",
      },
      {
        id: 4,
        x: 0.5,
        y: 2,
        label: "노드4",
      },
      {
        id: 5,
        x: 2,
        y: 2,
        label: "노드5",
      },
      {
        id: 6,
        x: 3,
        y: 2,
        label: "노드6",
      },
      {
        id: 7,
        x: 4,
        y: 2,
        label: "노드7",
      },
      {
        id: 8,
        x: 0,
        y: 3,
        label: "노드8",
      },
      {
        id: 9,
        x: 1,
        y: 3,
        label: "노드9",
      },
    ],
    edges: [
      {
        from: 1,
        to: 2,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 2,
        to: 4,
      },
      {
        from: 2,
        to: 5,
      },
      {
        from: 3,
        to: 6,
      },
      {
        from: 3,
        to: 7,
      },
      {
        from: 4,
        to: 8,
      },
      {
        from: 4,
        to: 9,
      },
    ],
    directed: false,
    unit: {
      x: 92,
      y: 74,
    },
  },
  steps: [
    {
      title: "T1 노드8 [0,0] 채우기",
      text: "담당 구간이 한 칸이라 리프입니다. A[0] = 5 를 그대로 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]",
          state: "empty",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]",
          state: "empty",
        },
        {
          value: "[2,2]",
          state: "empty",
        },
        {
          value: "[3,3]",
          state: "empty",
        },
        {
          value: "[4,4]",
          state: "empty",
        },
        {
          value: "[0,0]=5",
          state: "focus",
        },
        {
          value: "[1,1]",
          state: "empty",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {
            "0": "read",
          },
        },
      ],
      calc: {
        expr: "tree[8] = A[0] =",
        result: "5",
      },
      vars: "채운 노드 1 / 9",
    },
    {
      title: "T2 노드9 [1,1] 채우기",
      text: "담당 구간이 한 칸이라 리프입니다. A[1] = 2 를 그대로 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]",
          state: "empty",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]",
          state: "empty",
        },
        {
          value: "[2,2]",
          state: "empty",
        },
        {
          value: "[3,3]",
          state: "empty",
        },
        {
          value: "[4,4]",
          state: "empty",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
          state: "focus",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {
            "1": "read",
          },
        },
      ],
      calc: {
        expr: "tree[9] = A[1] =",
        result: "2",
      },
      vars: "채운 노드 2 / 9",
    },
    {
      title: "T3 노드4 [0,1] 채우기",
      text: "자식 노드8 과 노드9 가 먼저 채워졌습니다. 두 값 5 · 2 가운데 작은 2 를 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]",
          state: "empty",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]=2",
          state: "focus",
        },
        {
          value: "[2,2]",
          state: "empty",
        },
        {
          value: "[3,3]",
          state: "empty",
        },
        {
          value: "[4,4]",
          state: "empty",
        },
        {
          value: "[0,0]=5",
          state: "read",
        },
        {
          value: "[1,1]=2",
          state: "read",
        },
      ],
      edges: [
        {},
        {},
        {},
        {},
        {},
        {},
        {
          state: "read",
        },
        {
          state: "read",
        },
      ],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {},
        },
      ],
      calc: {
        expr: "min(tree[8], tree[9]) = min(5, 2) =",
        result: "2",
      },
      vars: "채운 노드 3 / 9",
    },
    {
      title: "T4 노드5 [2,2] 채우기",
      text: "담당 구간이 한 칸이라 리프입니다. A[2] = 4 를 그대로 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]",
          state: "empty",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
          state: "focus",
        },
        {
          value: "[3,3]",
          state: "empty",
        },
        {
          value: "[4,4]",
          state: "empty",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {
            "2": "read",
          },
        },
      ],
      calc: {
        expr: "tree[5] = A[2] =",
        result: "4",
      },
      vars: "채운 노드 4 / 9",
    },
    {
      title: "T5 노드2 [0,2] 채우기",
      text: "자식 노드4 와 노드5 가 먼저 채워졌습니다. 두 값 2 · 4 가운데 작은 2 를 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]=2",
          state: "focus",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]=2",
          state: "read",
        },
        {
          value: "[2,2]=4",
          state: "read",
        },
        {
          value: "[3,3]",
          state: "empty",
        },
        {
          value: "[4,4]",
          state: "empty",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
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
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {},
        },
      ],
      calc: {
        expr: "min(tree[4], tree[5]) = min(2, 4) =",
        result: "2",
      },
      vars: "채운 노드 5 / 9",
    },
    {
      title: "T6 노드6 [3,3] 채우기",
      text: "담당 구간이 한 칸이라 리프입니다. A[3] = 1 을 그대로 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
          state: "focus",
        },
        {
          value: "[4,4]",
          state: "empty",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {
            "3": "read",
          },
        },
      ],
      calc: {
        expr: "tree[6] = A[3] =",
        result: "1",
      },
      vars: "채운 노드 6 / 9",
    },
    {
      title: "T7 노드7 [4,4] 채우기",
      text: "담당 구간이 한 칸이라 리프입니다. A[4] = 3 을 그대로 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]",
          state: "empty",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
        },
        {
          value: "[4,4]=3",
          state: "focus",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {
            "4": "read",
          },
        },
      ],
      calc: {
        expr: "tree[7] = A[4] =",
        result: "3",
      },
      vars: "채운 노드 7 / 9",
    },
    {
      title: "T8 노드3 [3,4] 채우기",
      text: "자식 노드6 과 노드7 이 먼저 채워졌습니다. 두 값 1 · 3 가운데 작은 1 을 씁니다.",
      nodes: [
        {
          value: "[0,4]",
          state: "empty",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=1",
          state: "focus",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
          state: "read",
        },
        {
          value: "[4,4]=3",
          state: "read",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [
        {},
        {},
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
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {},
        },
      ],
      calc: {
        expr: "min(tree[6], tree[7]) = min(1, 3) =",
        result: "1",
      },
      vars: "채운 노드 8 / 9",
    },
    {
      title: "T9 노드1 [0,4] 채우기",
      text: "자식 노드2 와 노드3 이 먼저 채워졌습니다. 두 값 2 · 1 가운데 작은 1 을 씁니다.",
      nodes: [
        {
          value: "[0,4]=1",
          state: "focus",
        },
        {
          value: "[0,2]=2",
          state: "read",
        },
        {
          value: "[3,4]=1",
          state: "read",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "A",
          values: [5, 2, 4, 1, 3],
          states: {},
        },
      ],
      calc: {
        expr: "min(tree[2], tree[3]) = min(2, 1) =",
        result: "1",
      },
      vars: "채운 노드 9 / 9",
    },
  ],
};

export const ops = {
  player: "stage",
  stage: "graph",
  title:
    "연산 다섯 — 질의는 노드마다 세 갈래로 판정하고, 갱신은 리프에서 뿌리까지 다시 계산한다",
  sub: "T10–T22 · 걸음마다 노드 하나",
  result: "[1, 2, 2, 3]",
  layout: {
    nodes: [
      {
        id: 1,
        x: 2.375,
        y: 0,
        label: "노드1",
      },
      {
        id: 2,
        x: 1.25,
        y: 1,
        label: "노드2",
      },
      {
        id: 3,
        x: 3.5,
        y: 1,
        label: "노드3",
      },
      {
        id: 4,
        x: 0.5,
        y: 2,
        label: "노드4",
      },
      {
        id: 5,
        x: 2,
        y: 2,
        label: "노드5",
      },
      {
        id: 6,
        x: 3,
        y: 2,
        label: "노드6",
      },
      {
        id: 7,
        x: 4,
        y: 2,
        label: "노드7",
      },
      {
        id: 8,
        x: 0,
        y: 3,
        label: "노드8",
      },
      {
        id: 9,
        x: 1,
        y: 3,
        label: "노드9",
      },
    ],
    edges: [
      {
        from: 1,
        to: 2,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 2,
        to: 4,
      },
      {
        from: 2,
        to: 5,
      },
      {
        from: 3,
        to: 6,
      },
      {
        from: 3,
        to: 7,
      },
      {
        from: 4,
        to: 8,
      },
      {
        from: 4,
        to: 9,
      },
    ],
    directed: false,
    unit: {
      x: 92,
      y: 74,
    },
  },
  steps: [
    {
      title: "T10 질의 [0,4] — 노드1 [0,4] 통째로 들어간다 ②",
      text: "담당 구간 [0,4] 가 질의 [0,4] 안에 통째로 들어갑니다. 적어 둔 값 1 을 그대로 돌려줍니다. 뿌리에서 끝났으니 1 이 이 질의의 답입니다.",
      nodes: [
        {
          value: "[0,4]=1",
          state: "read",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=1",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [1],
          label: "통째로 들어간다 ②",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "tree[1] =",
        result: "1",
      },
      vars: "질의 [0,4]",
    },
    {
      title: "T11 질의 [0,2] — 노드1 [0,4] 걸쳐 있다 ③",
      text: "담당 구간 [0,4] 가 질의 [0,2] 와 겹치지만 통째로 들어가지는 않습니다. 자식 둘에게 나눠 묻습니다.",
      nodes: [
        {
          value: "[0,4]=1",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=1",
          state: "out",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
          state: "out",
        },
        {
          value: "[4,4]=3",
          state: "out",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [1],
          label: "걸쳐 있다 ③",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "[0,4] 가 [0,2] 에 걸친다 →",
        result: "자식 둘에게",
      },
      vars: "질의 [0,2]",
    },
    {
      title: "T12 질의 [0,2] — 노드2 [0,2] 통째로 들어간다 ②",
      text: "담당 구간 [0,2] 가 질의 [0,2] 안에 통째로 들어갑니다. 적어 둔 값 2 를 그대로 돌려줍니다.",
      nodes: [
        {
          value: "[0,4]=1",
        },
        {
          value: "[0,2]=2",
          state: "read",
        },
        {
          value: "[3,4]=1",
          state: "out",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
          state: "out",
        },
        {
          value: "[4,4]=3",
          state: "out",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [2],
          label: "통째로 들어간다 ②",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "tree[2] =",
        result: "2",
      },
      vars: "질의 [0,2]",
    },
    {
      title: "T13 질의 [0,2] — 노드3 [3,4] 겹치지 않는다 ①",
      text: "담당 구간 [3,4] 가 질의 [0,2] 와 한 칸도 안 겹칩니다. 답에 아무것도 보태지 않도록 INF 를 돌려줍니다.",
      nodes: [
        {
          value: "[0,4]=1",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=1",
          state: "out",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
          state: "out",
        },
        {
          value: "[4,4]=3",
          state: "out",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [3],
          label: "겹치지 않는다 ①",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "2 < 3 또는 4 < 0 →",
        result: "INF",
      },
      vars: "질의 [0,2]",
    },
    {
      title: "T14 질의 [0,2] — 노드1 [0,4] 두 답을 합친다 ③",
      text: "왼쪽 자식이 2, 오른쪽 자식이 INF 를 돌려줬습니다. 작은 2 가 이 질의의 답입니다.",
      nodes: [
        {
          value: "[0,4]=1",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=1",
          state: "out",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=1",
          state: "out",
        },
        {
          value: "[4,4]=3",
          state: "out",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [
        {
          members: [1],
          label: "두 답을 합친다 ③",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1, 2],
          states: {
            "1": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "min(2, INF) =",
        result: "2",
      },
      vars: "질의 [0,2]",
    },
    {
      title: "T15 갱신 i=3 v=10 — 노드6 [3,3] 리프에 쓴다 ④",
      text: "A[3] 의 리프에 닿았습니다. 옛 값 1 대신 새 값 10 을 씁니다. 조상 노드는 아직 옛 값입니다.",
      nodes: [
        {
          value: "[0,4]=1",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=1",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=10",
          state: "focus",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [],
      strips: [
        {
          label: "답",
          values: [1, 2],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "tree[6] =",
        result: "10",
      },
      vars: "갱신 i=3 v=10",
    },
    {
      title: "T16 갱신 i=3 v=10 — 노드3 [3,4] 다시 계산한다 ⑤",
      text: "자식 노드6 과 노드7 을 다시 읽어 min(10, 3) = 3 을 씁니다. 옛 값은 1 였습니다.",
      nodes: [
        {
          value: "[0,4]=1",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=3",
          state: "focus",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=10",
          state: "read",
        },
        {
          value: "[4,4]=3",
          state: "read",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [
        {},
        {},
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
      groups: [],
      strips: [
        {
          label: "답",
          values: [1, 2],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "min(tree[6], tree[7]) = min(10, 3) =",
        result: "3",
      },
      vars: "갱신 i=3 v=10",
    },
    {
      title: "T17 갱신 i=3 v=10 — 노드1 [0,4] 다시 계산한다 ⑤",
      text: "자식 노드2 와 노드3 을 다시 읽어 min(2, 3) = 2 를 씁니다. 옛 값은 1 였습니다.",
      nodes: [
        {
          value: "[0,4]=2",
          state: "focus",
        },
        {
          value: "[0,2]=2",
          state: "read",
        },
        {
          value: "[3,4]=3",
          state: "read",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=10",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [],
      strips: [
        {
          label: "답",
          values: [1, 2],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "min(tree[2], tree[3]) = min(2, 3) =",
        result: "2",
      },
      vars: "갱신 i=3 v=10",
    },
    {
      title: "T18 질의 [0,4] — 노드1 [0,4] 통째로 들어간다 ②",
      text: "담당 구간 [0,4] 가 질의 [0,4] 안에 통째로 들어갑니다. 적어 둔 값 2 를 그대로 돌려줍니다. 뿌리에서 끝났으니 2 가 이 질의의 답입니다.",
      nodes: [
        {
          value: "[0,4]=2",
          state: "read",
        },
        {
          value: "[0,2]=2",
        },
        {
          value: "[3,4]=3",
        },
        {
          value: "[0,1]=2",
        },
        {
          value: "[2,2]=4",
        },
        {
          value: "[3,3]=10",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
        },
        {
          value: "[1,1]=2",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [1],
          label: "통째로 들어간다 ②",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1, 2, 2],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "tree[1] =",
        result: "2",
      },
      vars: "질의 [0,4]",
    },
    {
      title: "T19 질의 [3,4] — 노드1 [0,4] 걸쳐 있다 ③",
      text: "담당 구간 [0,4] 가 질의 [3,4] 와 겹치지만 통째로 들어가지는 않습니다. 자식 둘에게 나눠 묻습니다.",
      nodes: [
        {
          value: "[0,4]=2",
        },
        {
          value: "[0,2]=2",
          state: "out",
        },
        {
          value: "[3,4]=3",
        },
        {
          value: "[0,1]=2",
          state: "out",
        },
        {
          value: "[2,2]=4",
          state: "out",
        },
        {
          value: "[3,3]=10",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
          state: "out",
        },
        {
          value: "[1,1]=2",
          state: "out",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [1],
          label: "걸쳐 있다 ③",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1, 2, 2],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "[0,4] 가 [3,4] 에 걸친다 →",
        result: "자식 둘에게",
      },
      vars: "질의 [3,4]",
    },
    {
      title: "T20 질의 [3,4] — 노드2 [0,2] 겹치지 않는다 ①",
      text: "담당 구간 [0,2] 가 질의 [3,4] 와 한 칸도 안 겹칩니다. 답에 아무것도 보태지 않도록 INF 를 돌려줍니다.",
      nodes: [
        {
          value: "[0,4]=2",
        },
        {
          value: "[0,2]=2",
          state: "out",
        },
        {
          value: "[3,4]=3",
        },
        {
          value: "[0,1]=2",
          state: "out",
        },
        {
          value: "[2,2]=4",
          state: "out",
        },
        {
          value: "[3,3]=10",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
          state: "out",
        },
        {
          value: "[1,1]=2",
          state: "out",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [2],
          label: "겹치지 않는다 ①",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1, 2, 2],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "4 < 0 또는 2 < 3 →",
        result: "INF",
      },
      vars: "질의 [3,4]",
    },
    {
      title: "T21 질의 [3,4] — 노드3 [3,4] 통째로 들어간다 ②",
      text: "담당 구간 [3,4] 가 질의 [3,4] 안에 통째로 들어갑니다. 적어 둔 값 3 을 그대로 돌려줍니다.",
      nodes: [
        {
          value: "[0,4]=2",
        },
        {
          value: "[0,2]=2",
          state: "out",
        },
        {
          value: "[3,4]=3",
          state: "read",
        },
        {
          value: "[0,1]=2",
          state: "out",
        },
        {
          value: "[2,2]=4",
          state: "out",
        },
        {
          value: "[3,3]=10",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
          state: "out",
        },
        {
          value: "[1,1]=2",
          state: "out",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      groups: [
        {
          members: [3],
          label: "통째로 들어간다 ②",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1, 2, 2],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "tree[3] =",
        result: "3",
      },
      vars: "질의 [3,4]",
    },
    {
      title: "T22 질의 [3,4] — 노드1 [0,4] 두 답을 합친다 ③",
      text: "왼쪽 자식이 INF, 오른쪽 자식이 3 을 돌려줬습니다. 작은 3 이 이 질의의 답입니다.",
      nodes: [
        {
          value: "[0,4]=2",
        },
        {
          value: "[0,2]=2",
          state: "out",
        },
        {
          value: "[3,4]=3",
        },
        {
          value: "[0,1]=2",
          state: "out",
        },
        {
          value: "[2,2]=4",
          state: "out",
        },
        {
          value: "[3,3]=10",
        },
        {
          value: "[4,4]=3",
        },
        {
          value: "[0,0]=5",
          state: "out",
        },
        {
          value: "[1,1]=2",
          state: "out",
        },
      ],
      edges: [
        {
          state: "read",
        },
        {
          state: "read",
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      groups: [
        {
          members: [1],
          label: "두 답을 합친다 ③",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "답",
          values: [1, 2, 2, 3],
          states: {
            "3": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "min(INF, 3) =",
        result: "3",
      },
      vars: "질의 [3,4]",
    },
  ],
};
