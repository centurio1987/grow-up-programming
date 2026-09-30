/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 이웃 목록 만들기가 한 걸음, 스택에서 정점 하나를
 * 꺼내는 일 · 부분트리 크기 하나를 부모에 올리는 일 · 답 하나를 자식에게 내리는 일이 각각 한 걸음이고,
 * 그 사이에 기준 뿌리의 답을 내는 걸음이 하나 있다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적는다 — 기준 뿌리 0 에서 매단 트리를
 * `treeLayout` 으로 놓은 자리이고, 정점이 놓인 줄이 곧 깊이다. 걸음마다 정점 안 아랫줄의 두 수(올림 값
 * `size` · 내림 값 `answer`, 아직 안 적은 답은 `—`)와 상태, 간선의 모양(부모가 정해진 간선은 나무 간선의
 * 굵은 실선)과 상태, 무대 아래 띠 둘(`stack` · `order`)만 바꾼다(`src/_viz/player/graphStage.ts`).
 * 두 수를 정점 안에 두는 까닭은 그림 사이드카 머리 주석에 있다.
 *
 * 점선 테(아직)는 그 걸음의 갈래에서 아직 끝나지 않은 정점이다 — 첫 순회에서는 스택에 담긴 적이 없는
 * 정점, 크기를 올리는 동안에는 올려 받을 자식이 남은 정점, 답을 내리는 동안에는 답이 아직 안 적힌 정점.
 * 꺼내는 걸음에서는 꺼낸 정점이 읽음, 새로 담은 정점과 그 간선이 새로 씀이다. 올리고 내리는 걸음에서는
 * 값을 준 정점이 읽음, 값을 받은 정점과 둘을 잇는 간선이 새로 씀이고, `order` 띠에서는 읽은 자리 `i` 가
 * 읽음이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `treeRerooting-guide.test.ts` 가 잰다.
 */
export const rerootWalk = {
  player: "stage",
  stage: "graph",
  title:
    "treeRerooting(7, [[0,1],[0,2],[1,3],[1,4],[2,5],[5,6]]) — 정점 안 아랫줄은 올림 값 size · 내림 값 answer, 무대 아래 띠는 stack 과 order",
  sub: "T1–T21 · 걸음마다 정점 하나를 꺼내거나, 크기 하나를 올리거나, 답 하나를 내린다",
  result: "[11, 12, 12, 17, 17, 15, 20]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.75,
        y: 0,
        label: "0",
      },
      {
        id: 1,
        x: 0.7,
        y: 1,
        label: "1",
      },
      {
        id: 2,
        x: 2.8,
        y: 1,
        label: "2",
      },
      {
        id: 3,
        x: 0,
        y: 2,
        label: "3",
      },
      {
        id: 4,
        x: 1.4,
        y: 2,
        label: "4",
      },
      {
        id: 5,
        x: 2.8,
        y: 2,
        label: "5",
      },
      {
        id: 6,
        x: 2.8,
        y: 3,
        label: "6",
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
      title: "T1 간선 목록을 이웃 목록으로 옮긴다 ①",
      text: "간선 6 개를 양쪽 정점의 이웃 목록에 한 번씩 넣었습니다. 아직 어느 정점도 스택에서 꺼내지 않아 모든 정점이 점선 테입니다.",
      nodes: [
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
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
          label: "stack",
          values: [0],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "near 항목 수의 합 =",
        result: "12 = 2 × 6",
      },
      vars: null,
    },
    {
      title: "T2 스택에서 정점 0 을 꺼낸다 ②",
      text: "정점 0 을 꺼내 order 뒤에 붙였습니다. 건너뛴 이웃은 없습니다. 이웃 1 · 2 에 부모 0 과 깊이를 적고 스택에 담았습니다.",
      nodes: [
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
          state: "focus",
        },
        {
          value: "1 · —",
          state: "focus",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
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
        {},
        {},
        {},
        {},
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
        {
          label: "order",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 0 · 새로 담은 정점 =",
        result: "1 · 2",
      },
      vars: "꺼냄 1 / 7",
    },
    {
      title: "T3 스택에서 정점 2 를 꺼낸다 ②",
      text: "정점 2 를 꺼내 order 뒤에 붙였습니다. 이웃 0 은 이미 지나온 정점이라 건너뛰었습니다. 이웃 5 에 부모 2 와 깊이를 적고 스택에 담았습니다.",
      nodes: [
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          value: "1 · —",
          state: "focus",
        },
        {
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
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {},
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
        {
          label: "order",
          values: [0, 2],
          states: {
            "1": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 2 · 새로 담은 정점 =",
        result: "5",
      },
      vars: "꺼냄 2 / 7",
    },
    {
      title: "T4 스택에서 정점 5 를 꺼낸다 ②",
      text: "정점 5 를 꺼내 order 뒤에 붙였습니다. 이웃 2 는 이미 지나온 정점이라 건너뛰었습니다. 이웃 6 에 부모 5 와 깊이를 적고 스택에 담았습니다.",
      nodes: [
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
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
        {},
        {},
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
          label: "stack",
          values: [1, 6],
          states: {
            "1": "focus",
          },
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5],
          states: {
            "2": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 5 · 새로 담은 정점 =",
        result: "6",
      },
      vars: "꺼냄 3 / 7",
    },
    {
      title: "T5 스택에서 정점 6 을 꺼낸다 ②",
      text: "정점 6 을 꺼내 order 뒤에 붙였습니다. 이웃 5 는 이미 지나온 정점이라 건너뛰었습니다. 새로 담은 정점은 없습니다.",
      nodes: [
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          state: "empty",
        },
        {
          state: "empty",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
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
        {},
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
          label: "stack",
          values: [1],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6],
          states: {
            "3": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 6 · 새로 담은 정점 =",
        result: "없음",
      },
      vars: "꺼냄 4 / 7",
    },
    {
      title: "T6 스택에서 정점 1 을 꺼낸다 ②",
      text: "정점 1 을 꺼내 order 뒤에 붙였습니다. 이웃 0 은 이미 지나온 정점이라 건너뛰었습니다. 이웃 3 · 4 에 부모 1 과 깊이를 적고 스택에 담았습니다.",
      nodes: [
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "focus",
        },
        {
          value: "1 · —",
          state: "focus",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [3, 4],
          states: {
            "0": "focus",
            "1": "focus",
          },
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1],
          states: {
            "4": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 1 · 새로 담은 정점 =",
        result: "3 · 4",
      },
      vars: "꺼냄 5 / 7",
    },
    {
      title: "T7 스택에서 정점 4 를 꺼낸다 ②",
      text: "정점 4 를 꺼내 order 뒤에 붙였습니다. 이웃 1 은 이미 지나온 정점이라 건너뛰었습니다. 새로 담은 정점은 없습니다.",
      nodes: [
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [3],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4],
          states: {
            "5": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 4 · 새로 담은 정점 =",
        result: "없음",
      },
      vars: "꺼냄 6 / 7",
    },
    {
      title: "T8 스택에서 정점 3 을 꺼낸다 ②",
      text: "정점 3 을 꺼내 order 뒤에 붙였습니다. 이웃 1 은 이미 지나온 정점이라 건너뛰었습니다. 새로 담은 정점은 없습니다.",
      nodes: [
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "6": "focus",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "stack.pop() = 3 · 새로 담은 정점 =",
        result: "없음",
      },
      vars: "꺼냄 7 / 7",
    },
    {
      title: "T9 자식 3 의 크기를 부모 1 에 올린다 ③",
      text: "order[6] = 3 입니다. 자식 3 의 크기 1 을 부모 1 의 크기에 더했습니다. 정점 1 에는 올려 받을 자식이 아직 남았습니다.",
      nodes: [
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "2 · —",
          state: "focus",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "6": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "size[1] = 1 + size[3] = 1 + 1 =",
        result: "2",
      },
      vars: "올림 1 / 6",
    },
    {
      title: "T10 자식 4 의 크기를 부모 1 에 올린다 ③",
      text: "order[5] = 4 입니다. 자식 4 의 크기 1 을 부모 1 의 크기에 더했습니다. 정점 1 의 자식을 모두 올려 받아 크기가 끝값이 됐습니다.",
      nodes: [
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "3 · —",
          state: "focus",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "5": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "size[1] = 2 + size[4] = 2 + 1 =",
        result: "3",
      },
      vars: "올림 2 / 6",
    },
    {
      title: "T11 자식 1 의 크기를 부모 0 에 올린다 ③",
      text: "order[4] = 1 입니다. 자식 1 의 크기 3 을 부모 0 의 크기에 더했습니다. 정점 0 에는 올려 받을 자식이 아직 남았습니다.",
      nodes: [
        {
          value: "4 · —",
          state: "focus",
        },
        {
          value: "3 · —",
          state: "read",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "4": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "size[0] = 1 + size[1] = 1 + 3 =",
        result: "4",
      },
      vars: "올림 3 / 6",
    },
    {
      title: "T12 자식 6 의 크기를 부모 5 에 올린다 ③",
      text: "order[3] = 6 입니다. 자식 6 의 크기 1 을 부모 5 의 크기에 더했습니다. 정점 5 의 자식을 모두 올려 받아 크기가 끝값이 됐습니다.",
      nodes: [
        {
          value: "4 · —",
          state: "empty",
        },
        {
          value: "3 · —",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "2 · —",
          state: "focus",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "3": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "size[5] = 1 + size[6] = 1 + 1 =",
        result: "2",
      },
      vars: "올림 4 / 6",
    },
    {
      title: "T13 자식 5 의 크기를 부모 2 에 올린다 ③",
      text: "order[2] = 5 입니다. 자식 5 의 크기 2 를 부모 2 의 크기에 더했습니다. 정점 2 의 자식을 모두 올려 받아 크기가 끝값이 됐습니다.",
      nodes: [
        {
          value: "4 · —",
          state: "empty",
        },
        {
          value: "3 · —",
        },
        {
          value: "3 · —",
          state: "focus",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "2 · —",
          state: "read",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "2": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "size[2] = 1 + size[5] = 1 + 2 =",
        result: "3",
      },
      vars: "올림 5 / 6",
    },
    {
      title: "T14 자식 2 의 크기를 부모 0 에 올린다 ③",
      text: "order[1] = 2 입니다. 자식 2 의 크기 3 을 부모 0 의 크기에 더했습니다. 정점 0 의 자식을 모두 올려 받아 크기가 끝값이 됐습니다.",
      nodes: [
        {
          value: "7 · —",
          state: "focus",
        },
        {
          value: "3 · —",
        },
        {
          value: "3 · —",
          state: "read",
        },
        {
          value: "1 · —",
        },
        {
          value: "1 · —",
        },
        {
          value: "2 · —",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "1": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "size[0] = 4 + size[2] = 4 + 3 =",
        result: "7",
      },
      vars: "올림 6 / 6",
    },
    {
      title: "T15 깊이를 더해 기준 뿌리의 답을 낸다 ④",
      text: "기준 뿌리 0 에서 정점까지의 거리가 곧 깊이라, 깊이를 모두 더한 11 이 뿌리의 답입니다. 이제 order 를 앞에서부터 읽으며 답을 내립니다.",
      nodes: [
        {
          value: "7 · 11",
          state: "focus",
        },
        {
          value: "3 · —",
          state: "read",
        },
        {
          value: "3 · —",
          state: "read",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "1 · —",
          state: "read",
        },
        {
          value: "2 · —",
          state: "read",
        },
        {
          value: "1 · —",
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
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {},
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[0] = 0 + 1 + 1 + 2 + 2 + 2 + 3 =",
        result: "11",
      },
      vars: null,
    },
    {
      title: "T16 부모 0 의 답에서 자식 2 의 답을 내린다 ⑤",
      text: "order[1] = 2 입니다. 뿌리를 부모 0 에서 자식 2 로 옮기면 자식 쪽 3 개가 한 칸 가까워지고 나머지 4 개가 한 칸 멀어져, 답이 7 − 2 × 3 만큼 달라집니다.",
      nodes: [
        {
          value: "7 · 11",
          state: "read",
        },
        {
          value: "3 · —",
          state: "empty",
        },
        {
          value: "3 · 12",
          state: "focus",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "2 · —",
          state: "empty",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "1": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[2] = 11 + 7 − 2 × 3 =",
        result: "12",
      },
      vars: "내림 1 / 6",
    },
    {
      title: "T17 부모 2 의 답에서 자식 5 의 답을 내린다 ⑤",
      text: "order[2] = 5 입니다. 뿌리를 부모 2 에서 자식 5 로 옮기면 자식 쪽 2 개가 한 칸 가까워지고 나머지 5 개가 한 칸 멀어져, 답이 7 − 2 × 2 만큼 달라집니다.",
      nodes: [
        {
          value: "7 · 11",
        },
        {
          value: "3 · —",
          state: "empty",
        },
        {
          value: "3 · 12",
          state: "read",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "2 · 15",
          state: "focus",
        },
        {
          value: "1 · —",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "2": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[5] = 12 + 7 − 2 × 2 =",
        result: "15",
      },
      vars: "내림 2 / 6",
    },
    {
      title: "T18 부모 5 의 답에서 자식 6 의 답을 내린다 ⑤",
      text: "order[3] = 6 입니다. 뿌리를 부모 5 에서 자식 6 으로 옮기면 자식 쪽 1 개가 한 칸 가까워지고 나머지 6 개가 한 칸 멀어져, 답이 7 − 2 × 1 만큼 달라집니다.",
      nodes: [
        {
          value: "7 · 11",
        },
        {
          value: "3 · —",
          state: "empty",
        },
        {
          value: "3 · 12",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "2 · 15",
          state: "read",
        },
        {
          value: "1 · 20",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "3": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[6] = 15 + 7 − 2 × 1 =",
        result: "20",
      },
      vars: "내림 3 / 6",
    },
    {
      title: "T19 부모 0 의 답에서 자식 1 의 답을 내린다 ⑤",
      text: "order[4] = 1 입니다. 뿌리를 부모 0 에서 자식 1 로 옮기면 자식 쪽 3 개가 한 칸 가까워지고 나머지 4 개가 한 칸 멀어져, 답이 7 − 2 × 3 만큼 달라집니다.",
      nodes: [
        {
          value: "7 · 11",
          state: "read",
        },
        {
          value: "3 · 12",
          state: "focus",
        },
        {
          value: "3 · 12",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "2 · 15",
        },
        {
          value: "1 · 20",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "4": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[1] = 11 + 7 − 2 × 3 =",
        result: "12",
      },
      vars: "내림 4 / 6",
    },
    {
      title: "T20 부모 1 의 답에서 자식 4 의 답을 내린다 ⑤",
      text: "order[5] = 4 입니다. 뿌리를 부모 1 에서 자식 4 로 옮기면 자식 쪽 1 개가 한 칸 가까워지고 나머지 6 개가 한 칸 멀어져, 답이 7 − 2 × 1 만큼 달라집니다.",
      nodes: [
        {
          value: "7 · 11",
        },
        {
          value: "3 · 12",
          state: "read",
        },
        {
          value: "3 · 12",
        },
        {
          value: "1 · —",
          state: "empty",
        },
        {
          value: "1 · 17",
          state: "focus",
        },
        {
          value: "2 · 15",
        },
        {
          value: "1 · 20",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "5": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[4] = 12 + 7 − 2 × 1 =",
        result: "17",
      },
      vars: "내림 5 / 6",
    },
    {
      title: "T21 부모 1 의 답에서 자식 3 의 답을 내린다 ⑤",
      text: "order[6] = 3 입니다. 뿌리를 부모 1 에서 자식 3 으로 옮기면 자식 쪽 1 개가 한 칸 가까워지고 나머지 6 개가 한 칸 멀어져, 답이 7 − 2 × 1 만큼 달라집니다.",
      nodes: [
        {
          value: "7 · 11",
        },
        {
          value: "3 · 12",
          state: "read",
        },
        {
          value: "3 · 12",
        },
        {
          value: "1 · 17",
          state: "focus",
        },
        {
          value: "1 · 17",
        },
        {
          value: "2 · 15",
        },
        {
          value: "1 · 20",
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
          label: "stack",
          values: [],
          states: {},
          slots: 2,
        },
        {
          label: "order",
          values: [0, 2, 5, 6, 1, 4, 3],
          states: {
            "6": "read",
          },
          slots: 7,
        },
      ],
      calc: {
        expr: "answer[3] = 12 + 7 − 2 × 1 =",
        result: "17",
      },
      vars: "내림 6 / 6",
    },
  ],
};
