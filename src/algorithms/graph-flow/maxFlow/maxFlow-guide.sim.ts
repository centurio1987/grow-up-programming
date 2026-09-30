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
 * 무대 갈래를 고른다. 정점과 항목 14 개의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값
 * (`level / iter`)과 상태, 항목의 종류 · 상태 · 머리말, 큐와 DFS 가 지난 정점(`strips`)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 정방향 항목의 머리말은 「유량/용량」, 역방향 항목은 대시 선이고
 * 머리말이 잔여 용량이다. 잔여 0 인 항목은 잔여 그래프에 없으므로 흐린 선이다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `maxFlow-guide.test.ts` 가 잰다.
 */

export const maxFlowWalk = {
  player: "stage",
  stage: "graph",
  title: "정점 여섯 네트워크의 디닉 — 정점 안의 두 수는 level / iter",
  sub: "T1–T9 · 실선은 정방향 항목(유량/용량), 대시 선은 역방향 항목(잔여)",
  result: "{ flow: 5 }",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 1,
      },
      {
        id: 1,
        x: 1.5,
        y: 0,
      },
      {
        id: 2,
        x: 3,
        y: 2,
      },
      {
        id: 3,
        x: 1.5,
        y: 2,
      },
      {
        id: 4,
        x: 3,
        y: 0,
      },
      {
        id: 5,
        x: 4.5,
        y: 1,
      },
    ],
    edges: [
      {
        from: 0,
        to: 1,
        bend: 0.16,
      },
      {
        from: 1,
        to: 2,
        bend: 0.16,
      },
      {
        from: 2,
        to: 5,
        bend: 0.16,
      },
      {
        from: 0,
        to: 3,
        bend: 0.16,
      },
      {
        from: 3,
        to: 2,
        bend: 0.16,
      },
      {
        from: 1,
        to: 4,
        bend: 0.16,
      },
      {
        from: 4,
        to: 5,
        bend: 0.16,
      },
      {
        from: 1,
        to: 0,
        bend: 0.16,
      },
      {
        from: 2,
        to: 1,
        bend: 0.16,
      },
      {
        from: 5,
        to: 2,
        bend: 0.16,
      },
      {
        from: 3,
        to: 0,
        bend: 0.16,
      },
      {
        from: 2,
        to: 3,
        bend: 0.16,
      },
      {
        from: 4,
        to: 1,
        bend: 0.16,
      },
      {
        from: 5,
        to: 4,
        bend: 0.16,
      },
    ],
  },
  steps: [
    {
      title: "T1 잔여 그래프를 만든다",
      text: "간선 7 개마다 정방향 항목(잔여 = 용량)과 역방향 항목(잔여 0)을 짝지어 넣습니다. 항목은 14 개이고 누적 유량은 0 입니다.",
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
      edges: [
        {
          label: "0/4",
        },
        {
          label: "0/2",
        },
        {
          label: "0/2",
        },
        {
          label: "0/3",
        },
        {
          label: "0/4",
        },
        {
          label: "0/5",
        },
        {
          label: "0/3",
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
          label: "큐",
          values: [],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [],
          slots: 6,
        },
      ],
      calc: null,
      vars: "누적 유량 0",
    },
    {
      title: "T2 라운드 1 — BFS 로 레벨을 매긴다",
      text: "잔여가 있는 항목만 지나며 소스에서의 최단 간선 수를 적습니다. 싱크의 레벨은 3 입니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "focus",
        },
        {
          value: "1 / 0",
          state: "focus",
        },
        {
          value: "2 / 0",
          state: "focus",
        },
        {
          value: "1 / 0",
          state: "focus",
        },
        {
          value: "2 / 0",
          state: "focus",
        },
        {
          value: "3 / 0",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "read",
          label: "0/4",
        },
        {
          state: "read",
          label: "0/2",
        },
        {
          state: "read",
          label: "0/2",
        },
        {
          state: "read",
          label: "0/3",
        },
        {
          label: "0/4",
        },
        {
          state: "read",
          label: "0/5",
        },
        {
          label: "0/3",
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
          label: "큐",
          values: [0, 1, 3, 2, 4, 5],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [],
          slots: 6,
        },
      ],
      calc: {
        expr: "level[5] =",
        result: "3",
      },
      vars: "라운드 1 · 누적 유량 0",
    },
    {
      title: "T3 경로 0 → 1 → 2 → 5 에 2 를 보낸다",
      text: "레벨이 한 칸씩 오르는 항목만 따라 싱크까지 갔습니다. 병목은 min(4, 2, 2) = 2 이고, 지난 항목마다 잔여가 2 줄고 짝의 잔여가 2 늡니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
          state: "read",
        },
        {
          value: "2 / 1",
          state: "read",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 0",
        },
        {
          value: "3 / 0",
          state: "read",
        },
      ],
      edges: [
        {
          state: "focus",
          label: "2/4",
        },
        {
          state: "focus",
          label: "2/2",
        },
        {
          state: "focus",
          label: "2/2",
        },
        {
          label: "0/3",
        },
        {
          label: "0/4",
        },
        {
          label: "0/5",
        },
        {
          label: "0/3",
        },
        {
          kind: "back",
          state: "focus",
          label: "2",
        },
        {
          kind: "back",
          state: "focus",
          label: "2",
        },
        {
          kind: "back",
          state: "focus",
          label: "2",
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
          label: "큐",
          values: [],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [0, 1, 2, 5],
          slots: 6,
        },
      ],
      calc: {
        expr: "min(4, 2, 2) =",
        result: "2",
      },
      vars: "라운드 1 · 누적 유량 2",
    },
    {
      title: "T4 경로 0 → 1 → 4 → 5 에 2 를 보낸다",
      text: "레벨이 한 칸씩 오르는 항목만 따라 싱크까지 갔습니다. 병목은 min(2, 5, 3) = 2 이고, 지난 항목마다 잔여가 2 줄고 짝의 잔여가 2 늡니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "read",
        },
        {
          value: "1 / 2",
          state: "read",
        },
        {
          value: "2 / 1",
        },
        {
          value: "1 / 0",
        },
        {
          value: "2 / 1",
          state: "read",
        },
        {
          value: "3 / 0",
          state: "read",
        },
      ],
      edges: [
        {
          state: "focus",
          label: "4/4",
        },
        {
          state: "read",
          label: "2/2",
        },
        {
          state: "out",
          label: "2/2",
        },
        {
          label: "0/3",
        },
        {
          label: "0/4",
        },
        {
          state: "focus",
          label: "2/5",
        },
        {
          state: "focus",
          label: "2/3",
        },
        {
          kind: "back",
          state: "focus",
          label: "4",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          label: "2",
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
          state: "focus",
          label: "2",
        },
        {
          kind: "back",
          state: "focus",
          label: "2",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [0, 1, 4, 5],
          slots: 6,
        },
      ],
      calc: {
        expr: "min(2, 5, 3) =",
        result: "2",
      },
      vars: "라운드 1 · 누적 유량 4",
    },
    {
      title: "T5 라운드 1 — 더 보낼 경로가 없다",
      text: "DFS 가 0 → 3 → 2 까지 들어갔다가 더 내려갈 항목이 없어 0 을 올려보냅니다. 라운드 1 의 차단 유량이 됐고, 누적 유량은 4 입니다.",
      nodes: [
        {
          value: "0 / 2",
          state: "read",
        },
        {
          value: "1 / 2",
        },
        {
          value: "2 / 3",
          state: "read",
        },
        {
          value: "1 / 2",
          state: "read",
        },
        {
          value: "2 / 1",
        },
        {
          value: "3 / 0",
        },
      ],
      edges: [
        {
          state: "read",
          label: "4/4",
        },
        {
          state: "out",
          label: "2/2",
        },
        {
          state: "read",
          label: "2/2",
        },
        {
          state: "read",
          label: "0/3",
        },
        {
          state: "read",
          label: "0/4",
        },
        {
          label: "2/5",
        },
        {
          label: "2/3",
        },
        {
          kind: "back",
          label: "4",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          state: "read",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          label: "2",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [0, 3, 2],
          slots: 6,
        },
      ],
      calc: {
        expr: "dfs(0, ∞) =",
        result: "0",
      },
      vars: "라운드 1 · 누적 유량 4",
    },
    {
      title: "T6 라운드 2 — BFS 로 레벨을 매긴다",
      text: "잔여가 있는 항목만 지나며 레벨을 다시 적습니다. 역방향 항목 2→1 을 지나 정점 1 에 레벨이 붙고, 싱크의 레벨은 5 입니다.",
      nodes: [
        {
          value: "0 / 0",
          state: "focus",
        },
        {
          value: "3 / 0",
          state: "focus",
        },
        {
          value: "2 / 0",
          state: "focus",
        },
        {
          value: "1 / 0",
          state: "focus",
        },
        {
          value: "4 / 0",
          state: "focus",
        },
        {
          value: "5 / 0",
          state: "focus",
        },
      ],
      edges: [
        {
          state: "out",
          label: "4/4",
        },
        {
          state: "out",
          label: "2/2",
        },
        {
          state: "out",
          label: "2/2",
        },
        {
          state: "read",
          label: "0/3",
        },
        {
          state: "read",
          label: "0/4",
        },
        {
          state: "read",
          label: "2/5",
        },
        {
          state: "read",
          label: "2/3",
        },
        {
          kind: "back",
          label: "4",
        },
        {
          kind: "back",
          state: "read",
          label: "2",
        },
        {
          kind: "back",
          label: "2",
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
          label: "2",
        },
        {
          kind: "back",
          label: "2",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 3, 2, 1, 4, 5],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [],
          slots: 6,
        },
      ],
      calc: {
        expr: "level[5] =",
        result: "5",
      },
      vars: "라운드 2 · 누적 유량 4",
    },
    {
      title: "T7 경로 0 → 3 → 2 → 1 → 4 → 5 에 1 을 보낸다",
      text: "레벨이 한 칸씩 오르는 항목만 따라 싱크까지 갔습니다. 병목은 min(3, 4, 2, 3, 1) = 1 이고, 지난 항목마다 잔여가 1 줄고 짝의 잔여가 1 늡니다. 2→1 는 역방향 항목이라, 앞서 1→2 로 보낸 것 가운데 1 을 되돌린 것입니다.",
      nodes: [
        {
          value: "0 / 1",
          state: "read",
        },
        {
          value: "3 / 2",
          state: "read",
        },
        {
          value: "2 / 0",
          state: "read",
        },
        {
          value: "1 / 1",
          state: "read",
        },
        {
          value: "4 / 1",
          state: "read",
        },
        {
          value: "5 / 0",
          state: "read",
        },
      ],
      edges: [
        {
          state: "read",
          label: "4/4",
        },
        {
          state: "focus",
          label: "1/2",
        },
        {
          state: "out",
          label: "2/2",
        },
        {
          state: "focus",
          label: "1/3",
        },
        {
          state: "focus",
          label: "1/4",
        },
        {
          state: "focus",
          label: "3/5",
        },
        {
          state: "focus",
          label: "3/3",
        },
        {
          kind: "back",
          state: "read",
          label: "4",
        },
        {
          kind: "back",
          state: "focus",
          label: "1",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          state: "focus",
          label: "1",
        },
        {
          kind: "back",
          state: "focus",
          label: "1",
        },
        {
          kind: "back",
          state: "focus",
          label: "3",
        },
        {
          kind: "back",
          state: "focus",
          label: "3",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [0, 3, 2, 1, 4, 5],
          slots: 6,
        },
      ],
      calc: {
        expr: "min(3, 4, 2, 3, 1) =",
        result: "1",
      },
      vars: "라운드 2 · 누적 유량 5",
    },
    {
      title: "T8 라운드 2 — 더 보낼 경로가 없다",
      text: "DFS 가 0 → 3 → 2 → 1 → 4 까지 들어갔다가 더 내려갈 항목이 없어 0 을 올려보냅니다. 라운드 2 의 차단 유량이 됐고, 누적 유량은 5 입니다.",
      nodes: [
        {
          value: "0 / 2",
          state: "read",
        },
        {
          value: "3 / 3",
          state: "read",
        },
        {
          value: "2 / 3",
          state: "read",
        },
        {
          value: "1 / 2",
          state: "read",
        },
        {
          value: "4 / 2",
          state: "read",
        },
        {
          value: "5 / 0",
        },
      ],
      edges: [
        {
          state: "out",
          label: "4/4",
        },
        {
          label: "1/2",
        },
        {
          state: "read",
          label: "2/2",
        },
        {
          state: "read",
          label: "1/3",
        },
        {
          state: "read",
          label: "1/4",
        },
        {
          state: "read",
          label: "3/5",
        },
        {
          state: "read",
          label: "3/3",
        },
        {
          kind: "back",
          label: "4",
        },
        {
          kind: "back",
          state: "read",
          label: "1",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          label: "1",
        },
        {
          kind: "back",
          state: "read",
          label: "1",
        },
        {
          kind: "back",
          label: "3",
        },
        {
          kind: "back",
          label: "3",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [0, 3, 2, 1, 4],
          slots: 6,
        },
      ],
      calc: {
        expr: "dfs(0, ∞) =",
        result: "0",
      },
      vars: "라운드 2 · 누적 유량 5",
    },
    {
      title: "T9 라운드 3 — 싱크에 레벨이 안 붙는다",
      text: "싱크로 들어가는 항목의 잔여가 모두 0 이라 BFS 가 정점 0 · 1 · 2 · 3 · 4 까지만 레벨을 적습니다. level[5] = -1 이라 반복을 끝내고 { flow: 5 } 를 돌려줍니다.",
      nodes: [
        {
          value: "0 / 2",
          state: "focus",
        },
        {
          value: "3 / 3",
          state: "focus",
        },
        {
          value: "2 / 3",
          state: "focus",
        },
        {
          value: "1 / 2",
          state: "focus",
        },
        {
          value: "4 / 2",
          state: "focus",
        },
        {
          value: "- / 0",
          state: "out",
        },
      ],
      edges: [
        {
          state: "out",
          label: "4/4",
        },
        {
          label: "1/2",
        },
        {
          state: "out",
          label: "2/2",
        },
        {
          state: "read",
          label: "1/3",
        },
        {
          state: "read",
          label: "1/4",
        },
        {
          state: "read",
          label: "3/5",
        },
        {
          state: "out",
          label: "3/3",
        },
        {
          kind: "back",
          label: "4",
        },
        {
          kind: "back",
          state: "read",
          label: "1",
        },
        {
          kind: "back",
          label: "2",
        },
        {
          kind: "back",
          label: "1",
        },
        {
          kind: "back",
          label: "1",
        },
        {
          kind: "back",
          label: "3",
        },
        {
          kind: "back",
          label: "3",
        },
      ],
      strips: [
        {
          label: "큐",
          values: [0, 3, 2, 1, 4],
          slots: 6,
        },
        {
          label: "DFS 가 지난 정점",
          values: [],
          slots: 6,
        },
      ],
      calc: {
        expr: "level[5] =",
        result: "-1",
      },
      vars: "라운드 3 · 누적 유량 5",
    },
  ],
};
