/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은 원고의
 * 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 항목 10 개의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(그
 * 라운드의 dist)과 상태, 항목의 종류 · 상태 · 머리말, 증가 경로의 정점(`strips`)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). `maxFlow` 편의 무대 약속에 단위 비용 하나를 더했다 — 정방향 항목의
 * 머리말은 「유량/용량 · 단위 비용」, 역방향 항목은 대시 선이고 머리말이 「잔여 · 단위 비용」이다. 잔여 0 인
 * 항목은 잔여 그래프에 없으므로 흐린 선이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `minCostMaxFlow-guide.test.ts` 가 잰다.
 */

export const mcmfWalk = {
  player: "stage",
  stage: "graph",
  title:
    "정점 넷 네트워크의 최소 비용 최대 유량 — 정점 안의 수는 그 라운드의 dist",
  sub: "T1–T10 · 실선은 정방향 항목(유량/용량 · 단위 비용), 대시 선은 역방향 항목(잔여 · 단위 비용)",
  result: "{ flow: 6, cost: 32 }",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 1.2,
      },
      {
        id: 1,
        x: 2,
        y: 0,
      },
      {
        id: 2,
        x: 2,
        y: 2.4,
      },
      {
        id: 3,
        x: 4,
        y: 1.2,
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
        bend: 0.16,
      },
      {
        from: 0,
        to: 2,
        bend: 0.16,
      },
      {
        from: 1,
        to: 2,
        bend: 0.16,
      },
      {
        from: 1,
        to: 3,
        bend: 0.16,
      },
      {
        from: 2,
        to: 3,
        bend: 0.16,
      },
      {
        from: 1,
        to: 0,
        bend: 0.16,
      },
      {
        from: 2,
        to: 0,
        bend: 0.16,
      },
      {
        from: 2,
        to: 1,
        bend: 0.16,
      },
      {
        from: 3,
        to: 1,
        bend: 0.16,
      },
      {
        from: 3,
        to: 2,
        bend: 0.16,
      },
    ],
  },
  steps: [
    {
      title: "T1 잔여 그래프를 만든다",
      text: "간선 5 개마다 정방향 항목(잔여 = 용량, 단위 비용 a)과 역방향 항목(잔여 0, 단위 비용 −a)을 짝지어 넣습니다. 항목은 10 개이고 누적 유량과 누적 총비용은 0 입니다.",
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
      ],
      edges: [
        {
          label: "0/3 · 1",
        },
        {
          label: "0/3 · 4",
        },
        {
          label: "0/2 · 1",
        },
        {
          label: "0/3 · 6",
        },
        {
          label: "0/4 · 1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [],
          slots: 4,
        },
      ],
      calc: null,
      vars: "누적 유량 0 · 누적 총비용 0",
    },
    {
      title: "T2 라운드 1 — SPFA 로 경로 비용이 가장 작은 증가 경로를 찾는다",
      text: "SPFA 가 잔여가 있는 항목만 지나며 dist = [0, 1, 2, 3] 을 적습니다. 싱크의 값 3 이 이 증가 경로로 한 단위를 보낼 때의 경로 비용입니다.",
      nodes: [
        {
          value: "d 0",
          state: "focus",
        },
        {
          value: "d 1",
          state: "focus",
        },
        {
          value: "d 2",
          state: "focus",
        },
        {
          value: "d 3",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "read",
          label: "0/3 · 1",
        },
        {
          label: "0/3 · 4",
        },
        {
          state: "read",
          label: "0/2 · 1",
        },
        {
          label: "0/3 · 6",
        },
        {
          state: "read",
          label: "0/4 · 1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "out",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 1, 2, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "d(3) =",
        result: "3",
      },
      vars: "라운드 1 · 누적 유량 0 · 누적 총비용 0",
    },
    {
      title: "T3 라운드 1 — 0 → 1 → 2 → 3 에 2 를 보낸다",
      text: "병목은 min(3, 2, 4) = 2 입니다. 지난 항목마다 잔여가 2 줄고 짝의 잔여가 2 늘며, 총비용에 2 × 3 = 6 이 더해집니다.",
      nodes: [
        {
          value: "d 0",
          state: "read",
        },
        {
          value: "d 1",
          state: "read",
        },
        {
          value: "d 2",
          state: "read",
        },
        {
          value: "d 3",
          state: "read",
        },
      ],
      edges: [
        {
          state: "focus",
          label: "2/3 · 1",
        },
        {
          label: "0/3 · 4",
        },
        {
          state: "focus",
          label: "2/2 · 1",
        },
        {
          label: "0/3 · 6",
        },
        {
          state: "focus",
          label: "2/4 · 1",
        },
        {
          kind: "back",
          state: "focus",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "focus",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "focus",
          label: "2 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 1, 2, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "min(3, 2, 4) =",
        result: "2",
      },
      vars: "라운드 1 · 누적 유량 2 · 누적 총비용 6",
    },
    {
      title: "T4 라운드 2 — SPFA 로 경로 비용이 가장 작은 증가 경로를 찾는다",
      text: "SPFA 가 잔여가 있는 항목만 지나며 dist = [0, 1, 4, 5] 를 적습니다. 싱크의 값 5 가 이 증가 경로로 한 단위를 보낼 때의 경로 비용입니다.",
      nodes: [
        {
          value: "d 0",
          state: "focus",
        },
        {
          value: "d 1",
          state: "focus",
        },
        {
          value: "d 4",
          state: "focus",
        },
        {
          value: "d 5",
          state: "focus",
        },
      ],
      edges: [
        {
          label: "2/3 · 1",
        },
        {
          state: "read",
          label: "0/3 · 4",
        },
        {
          state: "out",
          label: "2/2 · 1",
        },
        {
          label: "0/3 · 6",
        },
        {
          state: "read",
          label: "2/4 · 1",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 2, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "d(3) =",
        result: "5",
      },
      vars: "라운드 2 · 누적 유량 2 · 누적 총비용 6",
    },
    {
      title: "T5 라운드 2 — 0 → 2 → 3 에 2 를 보낸다",
      text: "병목은 min(3, 2) = 2 입니다. 지난 항목마다 잔여가 2 줄고 짝의 잔여가 2 늘며, 총비용에 2 × 5 = 10 이 더해집니다.",
      nodes: [
        {
          value: "d 0",
          state: "read",
        },
        {
          value: "d 1",
        },
        {
          value: "d 4",
          state: "read",
        },
        {
          value: "d 5",
          state: "read",
        },
      ],
      edges: [
        {
          label: "2/3 · 1",
        },
        {
          state: "focus",
          label: "2/3 · 4",
        },
        {
          state: "out",
          label: "2/2 · 1",
        },
        {
          label: "0/3 · 6",
        },
        {
          state: "focus",
          label: "4/4 · 1",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "focus",
          label: "2 · -4",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          state: "focus",
          label: "4 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 2, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "min(3, 2) =",
        result: "2",
      },
      vars: "라운드 2 · 누적 유량 4 · 누적 총비용 16",
    },
    {
      title: "T6 라운드 3 — SPFA 로 경로 비용이 가장 작은 증가 경로를 찾는다",
      text: "SPFA 가 잔여가 있는 항목만 지나며 dist = [0, 1, 4, 7] 을 적습니다. 싱크의 값 7 이 이 증가 경로로 한 단위를 보낼 때의 경로 비용입니다.",
      nodes: [
        {
          value: "d 0",
          state: "focus",
        },
        {
          value: "d 1",
          state: "focus",
        },
        {
          value: "d 4",
          state: "focus",
        },
        {
          value: "d 7",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "read",
          label: "2/3 · 1",
        },
        {
          label: "2/3 · 4",
        },
        {
          state: "out",
          label: "2/2 · 1",
        },
        {
          state: "read",
          label: "0/3 · 6",
        },
        {
          state: "out",
          label: "4/4 · 1",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          label: "2 · -4",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "out",
        },
        {
          kind: "back",
          label: "4 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 1, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "d(3) =",
        result: "7",
      },
      vars: "라운드 3 · 누적 유량 4 · 누적 총비용 16",
    },
    {
      title: "T7 라운드 3 — 0 → 1 → 3 에 1 을 보낸다",
      text: "병목은 min(1, 3) = 1 입니다. 지난 항목마다 잔여가 1 줄고 짝의 잔여가 1 늘며, 총비용에 1 × 7 = 7 이 더해집니다.",
      nodes: [
        {
          value: "d 0",
          state: "read",
        },
        {
          value: "d 1",
          state: "read",
        },
        {
          value: "d 4",
        },
        {
          value: "d 7",
          state: "read",
        },
      ],
      edges: [
        {
          state: "focus",
          label: "3/3 · 1",
        },
        {
          label: "2/3 · 4",
        },
        {
          state: "out",
          label: "2/2 · 1",
        },
        {
          state: "focus",
          label: "1/3 · 6",
        },
        {
          state: "out",
          label: "4/4 · 1",
        },
        {
          kind: "back",
          state: "focus",
          label: "3 · -1",
        },
        {
          kind: "back",
          label: "2 · -4",
        },
        {
          kind: "back",
          label: "2 · -1",
        },
        {
          kind: "back",
          state: "focus",
          label: "1 · -6",
        },
        {
          kind: "back",
          label: "4 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 1, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "min(1, 3) =",
        result: "1",
      },
      vars: "라운드 3 · 누적 유량 5 · 누적 총비용 23",
    },
    {
      title: "T8 라운드 4 — SPFA 로 경로 비용이 가장 작은 증가 경로를 찾는다",
      text: "SPFA 가 잔여가 있는 항목만 지나며 dist = [0, 3, 4, 9] 를 적습니다. 싱크의 값 9 가 이 증가 경로로 한 단위를 보낼 때의 경로 비용입니다. 역방향 항목 2→1 의 단위 비용 -1 이 더해져 정점 1 의 값이 3 입니다.",
      nodes: [
        {
          value: "d 0",
          state: "focus",
        },
        {
          value: "d 3",
          state: "focus",
        },
        {
          value: "d 4",
          state: "focus",
        },
        {
          value: "d 9",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "out",
          label: "3/3 · 1",
        },
        {
          state: "read",
          label: "2/3 · 4",
        },
        {
          state: "out",
          label: "2/2 · 1",
        },
        {
          state: "read",
          label: "1/3 · 6",
        },
        {
          state: "out",
          label: "4/4 · 1",
        },
        {
          kind: "back",
          label: "3 · -1",
        },
        {
          kind: "back",
          label: "2 · -4",
        },
        {
          kind: "back",
          state: "read",
          label: "2 · -1",
        },
        {
          kind: "back",
          label: "1 · -6",
        },
        {
          kind: "back",
          label: "4 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 2, 1, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "d(3) =",
        result: "9",
      },
      vars: "라운드 4 · 누적 유량 5 · 누적 총비용 23",
    },
    {
      title: "T9 라운드 4 — 0 → 2 → 1 → 3 에 1 을 보낸다",
      text: "병목은 min(1, 2, 2) = 1 입니다. 지난 항목마다 잔여가 1 줄고 짝의 잔여가 1 늘며, 총비용에 1 × 9 = 9 가 더해집니다.",
      nodes: [
        {
          value: "d 0",
          state: "read",
        },
        {
          value: "d 3",
          state: "read",
        },
        {
          value: "d 4",
          state: "read",
        },
        {
          value: "d 9",
          state: "read",
        },
      ],
      edges: [
        {
          state: "out",
          label: "3/3 · 1",
        },
        {
          state: "focus",
          label: "3/3 · 4",
        },
        {
          state: "focus",
          label: "1/2 · 1",
        },
        {
          state: "focus",
          label: "2/3 · 6",
        },
        {
          state: "out",
          label: "4/4 · 1",
        },
        {
          kind: "back",
          label: "3 · -1",
        },
        {
          kind: "back",
          state: "focus",
          label: "3 · -4",
        },
        {
          kind: "back",
          state: "focus",
          label: "1 · -1",
        },
        {
          kind: "back",
          state: "focus",
          label: "2 · -6",
        },
        {
          kind: "back",
          label: "4 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [0, 2, 1, 3],
          slots: 4,
        },
      ],
      calc: {
        expr: "min(1, 2, 2) =",
        result: "1",
      },
      vars: "라운드 4 · 누적 유량 6 · 누적 총비용 32",
    },
    {
      title: "T10 라운드 5 — 싱크에 이르는 증가 경로가 없다",
      text: "소스에서 나가는 정방향 항목의 잔여가 모두 0 이라 SPFA 가 소스 하나만 꺼내고 끝납니다. d(3) = ∞ 라 반복을 끝내고 { flow: 6, cost: 32 } 를 돌려줍니다.",
      nodes: [
        {
          value: "d 0",
          state: "focus",
        },
        {
          value: "d ∞",
          state: "out",
        },
        {
          value: "d ∞",
          state: "out",
        },
        {
          value: "d ∞",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
          label: "3/3 · 1",
        },
        {
          state: "out",
          label: "3/3 · 4",
        },
        {
          label: "1/2 · 1",
        },
        {
          label: "2/3 · 6",
        },
        {
          state: "out",
          label: "4/4 · 1",
        },
        {
          kind: "back",
          label: "3 · -1",
        },
        {
          kind: "back",
          label: "3 · -4",
        },
        {
          kind: "back",
          label: "1 · -1",
        },
        {
          kind: "back",
          label: "2 · -6",
        },
        {
          kind: "back",
          label: "4 · -1",
        },
      ],
      strips: [
        {
          label: "증가 경로",
          values: [],
          slots: 4,
        },
      ],
      calc: {
        expr: "d(3) =",
        result: "∞",
      },
      vars: "라운드 5 · 누적 유량 6 · 누적 총비용 32",
    },
  ],
};
