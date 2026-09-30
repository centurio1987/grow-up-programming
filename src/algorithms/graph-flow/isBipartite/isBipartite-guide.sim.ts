/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 시작 정점에 쪽을 적는 일 하나, 이웃 항목 확인
 * 하나가 걸음 하나다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점에 적힌 쪽과
 * 상태, 간선의 종류(쪽을 적어 준 간선은 굵은 실선)와 상태, 무대 아래 스택 띠(`strips`)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 무향 그래프라 `directed: false` 다. 확인한 이웃 항목 수는 무대에
 * 자리가 없어 남는 변수로 둔다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `isBipartite-guide.test.ts` 가 잰다.
 */
export const bipartiteWalk = {
  player: "stage",
  stage: "graph",
  title:
    "isBipartite(7, [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,4]]) — 정점 안은 적힌 쪽",
  sub: "T1–T13 · 걸음마다 시작 정점 하나 또는 이웃 항목 확인 하나",
  result: "false",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0,
      },
      {
        id: 1,
        x: 1.3,
        y: 0,
      },
      {
        id: 2,
        x: 1.3,
        y: 1.3,
      },
      {
        id: 3,
        x: 0,
        y: 1.3,
      },
      {
        id: 4,
        x: 3.3,
        y: 0,
      },
      {
        id: 5,
        x: 4,
        y: 1.3,
      },
      {
        id: 6,
        x: 2.6,
        y: 1.3,
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
        from: 2,
        to: 3,
      },
      {
        from: 3,
        to: 0,
      },
      {
        from: 4,
        to: 5,
      },
      {
        from: 5,
        to: 6,
      },
      {
        from: 6,
        to: 4,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 시작 정점 0 에 쪽 0",
      text: "바깥 반복이 쪽이 없는 정점 0 을 찾았습니다. 연결 성분의 첫 정점이라 쪽 0 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
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
      edges: [{}, {}, {}, {}, {}, {}, {}],
      strips: [
        {
          label: "stack",
          values: [0],
          slots: 2,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "side[0] = FIRST_SIDE =",
        result: "0",
      },
      vars: "확인한 이웃 항목 0 / 14",
    },
    {
      title: "T2 정점 0 의 이웃 1 — 쪽이 없다",
      text: "정점 0 을 스택에서 꺼냈습니다. 자기 쪽이 0 이라 이웃에 적을 쪽은 1 입니다. 이웃 1 이 아직 쪽이 없어 1 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
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
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [1],
          slots: 2,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "side[1] = 1 - side[0] = 1 - 0 =",
        result: "1",
      },
      vars: "확인한 이웃 항목 1 / 14",
    },
    {
      title: "T3 정점 0 의 이웃 3 — 쪽이 없다",
      text: "이웃 3 이 아직 쪽이 없어 1 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "쪽 1",
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
        {},
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [1, 3],
          slots: 2,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "side[3] = 1 - side[0] = 1 - 0 =",
        result: "1",
      },
      vars: "확인한 이웃 항목 2 / 14",
    },
    {
      title: "T4 정점 3 의 이웃 2 — 쪽이 없다",
      text: "정점 3 을 스택에서 꺼냈습니다. 자기 쪽이 1 이라 이웃에 적을 쪽은 0 입니다. 이웃 2 가 아직 쪽이 없어 0 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
          state: "focus",
        },
        {
          value: "쪽 1",
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
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [1, 2],
          slots: 2,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "side[2] = 1 - side[3] = 1 - 1 =",
        result: "0",
      },
      vars: "확인한 이웃 항목 3 / 14",
    },
    {
      title: "T5 정점 3 의 이웃 0 — 이미 반대쪽",
      text: "이웃 0 의 쪽 0 이 자기 쪽 1 과 달라 넘어갑니다.",
      nodes: [
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "read",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [1, 2],
          slots: 2,
        },
      ],
      calc: {
        expr: "side[0] === side[3] → 0 === 1 →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 4 / 14",
    },
    {
      title: "T6 정점 2 의 이웃 1 — 이미 반대쪽",
      text: "정점 2 를 스택에서 꺼냈습니다. 자기 쪽이 0 이라 이웃에 적을 쪽은 1 입니다. 이웃 1 의 쪽 1 이 자기 쪽 0 과 달라 넘어갑니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
          state: "read",
        },
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
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
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [1],
          slots: 2,
        },
      ],
      calc: {
        expr: "side[1] === side[2] → 1 === 0 →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 5 / 14",
    },
    {
      title: "T7 정점 2 의 이웃 3 — 이미 반대쪽",
      text: "이웃 3 의 쪽 1 이 자기 쪽 0 과 달라 넘어갑니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
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
        {},
        {
          kind: "tree",
          state: "read",
        },
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [1],
          slots: 2,
        },
      ],
      calc: {
        expr: "side[3] === side[2] → 1 === 0 →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 6 / 14",
    },
    {
      title: "T8 정점 1 의 이웃 0 — 이미 반대쪽",
      text: "정점 1 을 스택에서 꺼냈습니다. 자기 쪽이 1 이라 이웃에 적을 쪽은 0 입니다. 이웃 0 의 쪽 0 이 자기 쪽 1 과 달라 넘어갑니다.",
      nodes: [
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
          state: "read",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [],
          slots: 2,
        },
      ],
      calc: {
        expr: "side[0] === side[1] → 0 === 1 →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 7 / 14",
    },
    {
      title: "T9 정점 1 의 이웃 2 — 이미 반대쪽",
      text: "이웃 2 의 쪽 0 이 자기 쪽 1 과 달라 넘어갑니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
          state: "read",
        },
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
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
          state: "read",
        },
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [],
          slots: 2,
        },
      ],
      calc: {
        expr: "side[2] === side[1] → 0 === 1 →",
        result: "거짓",
      },
      vars: "확인한 이웃 항목 8 / 14",
    },
    {
      title: "T10 시작 정점 4 에 쪽 0",
      text: "바깥 반복이 쪽이 없는 정점 4 를 찾았습니다. 연결 성분의 첫 정점이라 쪽 0 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [4],
          slots: 2,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "side[4] = FIRST_SIDE =",
        result: "0",
      },
      vars: "확인한 이웃 항목 8 / 14",
    },
    {
      title: "T11 정점 4 의 이웃 5 — 쪽이 없다",
      text: "정점 4 를 스택에서 꺼냈습니다. 자기 쪽이 0 이라 이웃에 적을 쪽은 1 입니다. 이웃 5 가 아직 쪽이 없어 1 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
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
        {},
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
        {},
        {},
      ],
      strips: [
        {
          label: "stack",
          values: [5],
          slots: 2,
          states: {
            "0": "focus",
          },
        },
      ],
      calc: {
        expr: "side[5] = 1 - side[4] = 1 - 0 =",
        result: "1",
      },
      vars: "확인한 이웃 항목 9 / 14",
    },
    {
      title: "T12 정점 4 의 이웃 6 — 쪽이 없다",
      text: "이웃 6 이 아직 쪽이 없어 1 을 적고 스택에 넣습니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
          state: "read",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 1",
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
        {
          kind: "tree",
        },
        {},
        {
          kind: "tree",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [5, 6],
          slots: 2,
          states: {
            "1": "focus",
          },
        },
      ],
      calc: {
        expr: "side[6] = 1 - side[4] = 1 - 0 =",
        result: "1",
      },
      vars: "확인한 이웃 항목 10 / 14",
    },
    {
      title: "T13 정점 6 의 이웃 5 — 쪽이 같다",
      text: "정점 6 을 스택에서 꺼냈습니다. 자기 쪽이 1 이라 이웃에 적을 쪽은 0 입니다. 이웃 5 의 쪽 1 이 자기 쪽 1 과 같습니다. 간선 [6,5] 의 두 끝이 한 쪽에 들어가므로 false 를 반환합니다.",
      nodes: [
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
        },
        {
          value: "쪽 0",
        },
        {
          value: "쪽 1",
          state: "read",
        },
        {
          value: "쪽 1",
          state: "read",
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
        {
          kind: "tree",
        },
        {
          state: "read",
          label: "두 끝이 같은 쪽",
        },
        {
          kind: "tree",
        },
      ],
      strips: [
        {
          label: "stack",
          values: [5],
          slots: 2,
        },
      ],
      calc: {
        expr: "side[5] === side[6] → 1 === 1 →",
        result: "참",
      },
      vars: "확인한 이웃 항목 11 / 14",
    },
  ],
};
