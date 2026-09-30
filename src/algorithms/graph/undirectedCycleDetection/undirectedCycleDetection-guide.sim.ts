/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 바깥 반복이 정점을 잡는 일과, 꺼낸 정점의
 * 이웃 항목 하나를 확인하는 일이 각각 걸음 하나다. 마지막 걸음이 표시된 이웃을 만나 반환하는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점 안의 값(부모)과
 * 상태, 간선의 모양과 상태, 무대 아래 두 띠(stack 과 from — 같은 자리끼리 짝)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 간선에 방향이 없으므로 `directed: false` 다. 표시 없는 정점은 점선
 * 테(아직), 아직 나무 간선이 아닌 간선은 흐린 선이다. 나무 간선은 굵은 실선, 사이클을 닫은 간선은
 * 대시다. 띠의 칸 수는 스택이 가장 깊었을 때에 맞춰 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `undirectedCycleDetection-guide.test.ts` 가 잰다.
 */
export const undirectedWalk = {
  player: "stage",
  stage: "graph",
  title:
    "undirectedCycleDetection(6, [[0,1],[1,2],[3,4],[4,5],[5,3]]) — 정점 안은 부모, 무대 아래는 stack 과 from",
  sub: "T1–T9 · 걸음마다 시작 하나 또는 이웃 항목 하나",
  result: "true",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0.6,
      },
      {
        id: 1,
        x: 1,
        y: 0.6,
      },
      {
        id: 2,
        x: 2,
        y: 0.6,
      },
      {
        id: 3,
        x: 3.6,
        y: 0,
      },
      {
        id: 4,
        x: 3.1,
        y: 1.2,
      },
      {
        id: 5,
        x: 4.1,
        y: 1.2,
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
        from: 3,
        to: 4,
      },
      {
        from: 4,
        to: 5,
      },
      {
        from: 5,
        to: 3,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 정점 0 을 표시하고 스택에 넣는다",
      text: "바깥 반복이 표시 없는 정점 0 을 잡았습니다. 표시하고 스택에 넣고, 짝지은 from 에는 부모가 없다는 뜻으로 -1 을 넣습니다.",
      nodes: [
        {
          value: "부모 없음",
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
          label: "stack",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
        {
          label: "from",
          values: [-1],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[0] →",
        result: "거짓 · 시작한다",
      },
      vars: "확인한 이웃 항목 0 / 10",
    },
    {
      title: "T2 0 의 이웃 1 — 표시가 없어 표시하고 넣는다 ③",
      text: "0 을 꺼내 이웃 1 을 봤습니다. 부모가 아니고 표시도 없으니 표시하고 스택에 넣고, from 에는 0 을 넣습니다. 이제 1 의 부모는 0 입니다.",
      nodes: [
        {
          value: "부모 없음",
          state: "read",
        },
        {
          value: "부모 0",
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
          label: "stack",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
        {
          label: "from",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[1] →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 1 / 10",
    },
    {
      title: "T3 1 의 이웃 0 — 부모라 건너뛴다 ①",
      text: "1 의 이웃 0 은 1 을 표시하게 한 부모입니다. 방금 지나온 나무 간선을 반대쪽에서 읽은 것이라 건너뜁니다.",
      nodes: [
        {
          value: "부모 없음",
          state: "read",
        },
        {
          value: "부모 0",
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
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          kind: "tree",
          state: "read",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "from",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "0 === parent(0) →",
        result: "참",
      },
      vars: "확인한 이웃 항목 2 / 10",
    },
    {
      title: "T4 1 의 이웃 2 — 표시가 없어 표시하고 넣는다 ③",
      text: "1 을 꺼내 이웃 2 를 봤습니다. 부모가 아니고 표시도 없으니 표시하고 스택에 넣고, from 에는 1 을 넣습니다. 이제 2 의 부모는 1 입니다.",
      nodes: [
        {
          value: "부모 없음",
        },
        {
          value: "부모 0",
          state: "read",
        },
        {
          value: "부모 1",
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
        },
        {
          kind: "tree",
          state: "focus",
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
          label: "stack",
          values: [2],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
        {
          label: "from",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[2] →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 3 / 10",
    },
    {
      title: "T5 2 의 이웃 1 — 부모라 건너뛴다 ①",
      text: "2 의 이웃 1 은 2 를 표시하게 한 부모입니다. 방금 지나온 나무 간선을 반대쪽에서 읽은 것이라 건너뜁니다.",
      nodes: [
        {
          value: "부모 없음",
        },
        {
          value: "부모 0",
          state: "read",
        },
        {
          value: "부모 1",
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
      ],
      edges: [
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "from",
          values: [],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "1 === parent(1) →",
        result: "참",
      },
      vars: "확인한 이웃 항목 4 / 10",
    },
    {
      title: "T6 정점 3 을 표시하고 스택에 넣는다",
      text: "바깥 반복이 표시 없는 정점 3 을 잡았습니다. 표시하고 스택에 넣고, 짝지은 from 에는 부모가 없다는 뜻으로 -1 을 넣습니다.",
      nodes: [
        {
          value: "부모 없음",
        },
        {
          value: "부모 0",
        },
        {
          value: "부모 1",
        },
        {
          value: "부모 없음",
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
          kind: "tree",
        },
        {
          kind: "tree",
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
          label: "stack",
          values: [3],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
        {
          label: "from",
          values: [-1],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[3] →",
        result: "거짓 · 시작한다",
      },
      vars: "확인한 이웃 항목 4 / 10",
    },
    {
      title: "T7 3 의 이웃 4 — 표시가 없어 표시하고 넣는다 ③",
      text: "3 을 꺼내 이웃 4 를 봤습니다. 부모가 아니고 표시도 없으니 표시하고 스택에 넣고, from 에는 3 을 넣습니다. 이제 4 의 부모는 3 입니다.",
      nodes: [
        {
          value: "부모 없음",
        },
        {
          value: "부모 0",
        },
        {
          value: "부모 1",
        },
        {
          value: "부모 없음",
          state: "read",
        },
        {
          value: "부모 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
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
          label: "stack",
          values: [4],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
        {
          label: "from",
          values: [3],
          states: {
            "0": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[4] →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 5 / 10",
    },
    {
      title: "T8 3 의 이웃 5 — 표시가 없어 표시하고 넣는다 ③",
      text: "3 을 꺼내 이웃 5 를 봤습니다. 부모가 아니고 표시도 없으니 표시하고 스택에 넣고, from 에는 3 을 넣습니다. 이제 5 의 부모는 3 입니다.",
      nodes: [
        {
          value: "부모 없음",
        },
        {
          value: "부모 0",
        },
        {
          value: "부모 1",
        },
        {
          value: "부모 없음",
          state: "read",
        },
        {
          value: "부모 3",
        },
        {
          value: "부모 3",
          state: "focus",
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
          state: "out",
        },
        {
          kind: "tree",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [4, 5],
          states: {
            "1": "focus",
          },
          slots: 2,
        },
        {
          label: "from",
          values: [3, 3],
          states: {
            "1": "focus",
          },
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[5] →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 6 / 10",
    },
    {
      title: "T9 5 의 이웃 4 — 이미 표시돼 있어 사이클이다 ②",
      text: "5 의 이웃 4 는 부모 3 가 아닌데 이미 표시돼 있습니다. 나무 간선을 따라 4 까지 가는 길이 따로 있으니 사이클입니다. true 를 반환합니다.",
      nodes: [
        {
          value: "부모 없음",
        },
        {
          value: "부모 0",
        },
        {
          value: "부모 1",
        },
        {
          value: "부모 없음",
        },
        {
          value: "부모 3",
          state: "read",
        },
        {
          value: "부모 3",
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
          kind: "back",
          state: "focus",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [4],
          states: {},
          slots: 2,
        },
        {
          label: "from",
          values: [3],
          states: {},
          slots: 2,
        },
      ],
      calc: {
        expr: "visited[4] →",
        result: "참",
      },
      vars: "확인한 이웃 항목 7 / 10",
    },
  ],
};
