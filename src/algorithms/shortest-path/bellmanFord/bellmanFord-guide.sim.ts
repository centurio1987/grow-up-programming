/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작값, 라운드 하나가 걸음 하나,
 * 마지막 걸음이 dist 와 판정을 돌려주는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(라운드가
 * 끝난 뒤의 dist)과 상태, 간선의 종류(지금 그 정점의 값을 낸 간선은 굵은 실선)와 상태, 무대 아래 띠
 * 둘(`strips` — 적힌 차례대로의 간선 목록과 그 라운드의 후보 dist[u] + w)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 그렇게 정한 까닭은 그림 사이드카 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `bellmanFord-guide.test.ts` 가 잰다.
 */
export const bellmanFordWalk = {
  player: "stage",
  stage: "graph",
  title:
    "bellmanFord(7, [[4,5,1],[3,4,2],[2,3,-3],[1,2,3],[0,1,4],[0,2,9],[6,5,2],[5,1,7]], 0) — 간선 옆 수는 가중치",
  sub: "T1–T8 · 걸음마다 라운드 하나",
  result: "{ dist: [0, 4, 7, 4, 6, 7, Infinity], hasNegativeCycle: false }",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 2,
      },
      {
        id: 1,
        x: 1,
        y: 1,
      },
      {
        id: 2,
        x: 2,
        y: 2,
      },
      {
        id: 3,
        x: 3,
        y: 1,
      },
      {
        id: 4,
        x: 4,
        y: 2,
      },
      {
        id: 5,
        x: 5,
        y: 1,
      },
      {
        id: 6,
        x: 5.6,
        y: 2.4,
      },
    ],
    edges: [
      {
        from: 4,
        to: 5,
      },
      {
        from: 3,
        to: 4,
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
        to: 1,
      },
      {
        from: 0,
        to: 2,
      },
      {
        from: 6,
        to: 5,
      },
      {
        from: 5,
        to: 1,
        bend: -0.22,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 시작값",
      text: "dist[0] 에 0 을 적고 나머지 6 칸은 Infinity 로 둡니다. 아직 간선을 하나도 읽지 않았습니다.",
      nodes: [
        {
          value: "dist 0",
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
      edges: [
        {
          label: "1",
        },
        {
          label: "2",
        },
        {
          label: "-3",
        },
        {
          label: "3",
        },
        {
          label: "4",
        },
        {
          label: "9",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {},
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "", ""],
          states: {},
          slots: 8,
        },
      ],
      calc: {
        expr: "dist[0] =",
        result: "0",
      },
      vars: "간선 읽기 0 / 48",
    },
    {
      title: "T2 라운드 1 — dist[1] · dist[2] 를 고친다",
      text: "간선 8 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 6 개는 ③ 으로 넘어갑니다. 0→1 이 0 + 4 = 4 를 처음 적습니다. 0→2 가 0 + 9 = 9 를 처음 적습니다. 고친 칸이 있어 다음 라운드로 갑니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
          state: "focus",
        },
        {
          value: "dist 9",
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
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "-3",
        },
        {
          state: "out",
          label: "3",
        },
        {
          kind: "tree",
          state: "focus",
          label: "4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "9",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "focus",
            "5": "focus",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["—", "—", "—", "—", "4", "9", "—", "—"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "focus",
            "5": "focus",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
      ],
      calc: {
        expr: "고친 칸 2 개 → !changed =",
        result: "거짓",
      },
      vars: "간선 읽기 8 / 48",
    },
    {
      title: "T3 라운드 2 — dist[3] · dist[2] 를 고친다",
      text: "간선 8 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 4 개는 ③ 으로 넘어갑니다. 2→3 이 9 + (-3) = 6 을 처음 적습니다. 1→2 가 4 + 3 = 7 로 9 를 고칩니다. 고친 칸이 있어 다음 라운드로 갑니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 7",
          state: "focus",
        },
        {
          value: "dist 6",
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
          state: "out",
          label: "1",
        },
        {
          state: "out",
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "-3",
        },
        {
          kind: "tree",
          state: "focus",
          label: "3",
        },
        {
          kind: "tree",
          state: "read",
          label: "4",
        },
        {
          state: "read",
          label: "9",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {
            "0": "out",
            "1": "out",
            "2": "focus",
            "3": "focus",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["—", "—", "6", "7", "4", "9", "—", "—"],
          states: {
            "0": "out",
            "1": "out",
            "2": "focus",
            "3": "focus",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
      ],
      calc: {
        expr: "고친 칸 2 개 → !changed =",
        result: "거짓",
      },
      vars: "간선 읽기 16 / 48",
    },
    {
      title: "T4 라운드 3 — dist[4] · dist[3] 을 고친다",
      text: "간선 8 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 3 개는 ③ 으로 넘어갑니다. 3→4 가 6 + 2 = 8 을 처음 적습니다. 2→3 이 7 + (-3) = 4 로 6 을 고칩니다. 고친 칸이 있어 다음 라운드로 갑니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 4",
          state: "focus",
        },
        {
          value: "dist 8",
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
          state: "out",
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          kind: "tree",
          state: "focus",
          label: "-3",
        },
        {
          kind: "tree",
          state: "read",
          label: "3",
        },
        {
          kind: "tree",
          state: "read",
          label: "4",
        },
        {
          state: "read",
          label: "9",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "out",
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {
            "0": "out",
            "1": "focus",
            "2": "focus",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["—", "8", "4", "7", "4", "9", "—", "—"],
          states: {
            "0": "out",
            "1": "focus",
            "2": "focus",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
      ],
      calc: {
        expr: "고친 칸 2 개 → !changed =",
        result: "거짓",
      },
      vars: "간선 읽기 24 / 48",
    },
    {
      title: "T5 라운드 4 — dist[5] · dist[4] 를 고친다",
      text: "간선 8 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 1 개는 ③ 으로 넘어갑니다. 4→5 가 8 + 1 = 9 를 처음 적습니다. 3→4 가 4 + 2 = 6 으로 8 을 고칩니다. 고친 칸이 있어 다음 라운드로 갑니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 6",
          state: "focus",
        },
        {
          value: "dist 9",
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
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          kind: "tree",
          state: "read",
          label: "-3",
        },
        {
          kind: "tree",
          state: "read",
          label: "3",
        },
        {
          kind: "tree",
          state: "read",
          label: "4",
        },
        {
          state: "read",
          label: "9",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "read",
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "read",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["9", "6", "4", "7", "4", "9", "—", "16"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "read",
          },
          slots: 8,
        },
      ],
      calc: {
        expr: "고친 칸 2 개 → !changed =",
        result: "거짓",
      },
      vars: "간선 읽기 32 / 48",
    },
    {
      title: "T6 라운드 5 — dist[5] 를 고친다",
      text: "간선 8 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 1 개는 ③ 으로 넘어갑니다. 4→5 가 6 + 1 = 7 로 9 를 고칩니다. 고친 칸이 있어 다음 라운드로 갑니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 6",
        },
        {
          value: "dist 7",
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
          label: "1",
        },
        {
          kind: "tree",
          state: "read",
          label: "2",
        },
        {
          kind: "tree",
          state: "read",
          label: "-3",
        },
        {
          kind: "tree",
          state: "read",
          label: "3",
        },
        {
          kind: "tree",
          state: "read",
          label: "4",
        },
        {
          state: "read",
          label: "9",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "read",
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {
            "0": "focus",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "read",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["7", "6", "4", "7", "4", "9", "—", "14"],
          states: {
            "0": "focus",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "read",
          },
          slots: 8,
        },
      ],
      calc: {
        expr: "고친 칸 1 개 → !changed =",
        result: "거짓",
      },
      vars: "간선 읽기 40 / 48",
    },
    {
      title: "T7 라운드 6 — 고친 칸이 없다",
      text: "간선 8 개를 적힌 차례대로 읽습니다. 꼬리의 값이 없는 간선 1 개는 ③ 으로 넘어갑니다. 나머지 간선도 적힌 값을 못 줄여 고친 칸이 없고, changed 가 거짓이라 여기서 반복을 끝냅니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 6",
        },
        {
          value: "dist 7",
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
          label: "1",
        },
        {
          kind: "tree",
          state: "read",
          label: "2",
        },
        {
          kind: "tree",
          state: "read",
          label: "-3",
        },
        {
          kind: "tree",
          state: "read",
          label: "3",
        },
        {
          kind: "tree",
          state: "read",
          label: "4",
        },
        {
          state: "read",
          label: "9",
        },
        {
          state: "out",
          label: "2",
        },
        {
          state: "read",
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "read",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["7", "6", "4", "7", "4", "9", "—", "14"],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "out",
            "7": "read",
          },
          slots: 8,
        },
      ],
      calc: {
        expr: "고친 칸 0 개 → !changed =",
        result: "참",
      },
      vars: "간선 읽기 48 / 48",
    },
    {
      title: "T8 dist 와 판정을 돌려준다",
      text: "마지막 라운드가 한 칸도 못 고쳐 ⑤ 에서 끝났습니다. 음수 사이클은 없다고 판정하고 [0, 4, 7, 4, 6, 7, Infinity] 와 false 를 돌려줍니다. 들어오는 간선이 없는 정점 6 은 Infinity 로 남았습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 7",
        },
        {
          value: "dist 4",
        },
        {
          value: "dist 6",
        },
        {
          value: "dist 7",
        },
        {
          value: "Infinity",
          state: "out",
        },
      ],
      edges: [
        {
          kind: "tree",
          label: "1",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          kind: "tree",
          label: "3",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          label: "9",
        },
        {
          label: "2",
        },
        {
          label: "7",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["4→5", "3→4", "2→3", "1→2", "0→1", "0→2", "6→5", "5→1"],
          states: {},
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "", ""],
          states: {},
          slots: 8,
        },
      ],
      calc: {
        expr: "hasNegativeCycle =",
        result: "false",
      },
      vars: "간선 읽기 48 / 48",
    },
  ],
};
