/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 준비(이웃 목록 · 시작값 · 큐), 정점
 * 하나를 꺼내 그 간선을 읽는 일이 걸음 하나, 마지막 걸음이 큐가 비어 dist 를 돌려주는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(걸음이
 * 끝난 뒤의 dist)과 상태, 간선의 종류(지금 그 정점의 값을 낸 간선은 굵은 실선)와 상태, 무대 아래 띠
 * 셋(`strips` — 적힌 차례대로의 간선 목록 · 그 걸음의 후보 dist[u] + w · 꺼낼 차례대로의 큐)만 바꾼다
 * (`src/_viz/player/graphStage.ts`). 그렇게 정한 까닭은 그림 사이드카 머리 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `spfa-guide.test.ts` 가 잰다.
 */
export const spfaWalk = {
  player: "stage",
  stage: "graph",
  title:
    "spfa(6, [[0,1,6],[0,2,1],[0,3,20],[1,3,4],[2,1,-3],[2,3,9],[3,4,2],[5,4,1]], 0) — 간선 옆 수는 가중치",
  sub: "T1–T10 · 걸음마다 정점 하나를 꺼낸다",
  result: "[0, -2, 1, 2, 4, Infinity]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 0,
      },
      {
        id: 1,
        x: 1.4,
        y: 0.75,
      },
      {
        id: 2,
        x: 1.4,
        y: 1.75,
      },
      {
        id: 3,
        x: 2.8,
        y: 0,
      },
      {
        id: 4,
        x: 4.1,
        y: 0,
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
        from: 0,
        to: 2,
      },
      {
        from: 0,
        to: 3,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 2,
        to: 1,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
      {
        from: 5,
        to: 4,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 이웃 목록 · 시작값 · 큐",
      text: "간선 8 개를 꼬리 정점별로 모아 이웃 목록을 만들고, dist[0] 에 0 을 적은 뒤 나머지 5 칸은 Infinity 로 둡니다. 큐에는 시작 정점 0 하나가 들어 있습니다.",
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
      ],
      edges: [
        {
          label: "6",
        },
        {
          label: "1",
        },
        {
          label: "20",
        },
        {
          label: "4",
        },
        {
          label: "-3",
        },
        {
          label: "9",
        },
        {
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {},
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "", ""],
          states: {},
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "dist[0] =",
        result: "0",
      },
      vars: "간선 읽기 0 / 9 · 꺼내기 0 / 8",
    },
    {
      title: "T2 정점 0 을 꺼낸다 — dist[1] · dist[2] · dist[3] 을 고친다",
      text: "정점 0 을 꺼내 표시를 내리고, 그 정점에서 나가는 간선 3 개만 읽습니다. 간선 목록의 나머지 5 개는 읽지 않습니다. 0→1 이 0 + 6 = 6 을 처음 적습니다. 정점 1 은 큐에 없어 뒤에 넣습니다. 0→2 가 0 + 1 = 1 을 처음 적습니다. 정점 2 는 큐에 없어 뒤에 넣습니다. 0→3 이 0 + 20 = 20 을 처음 적습니다. 정점 3 은 큐에 없어 뒤에 넣습니다. 큐에는 [1, 2, 3] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
          state: "read",
        },
        {
          value: "dist 6",
          state: "focus",
        },
        {
          value: "dist 1",
          state: "focus",
        },
        {
          value: "dist 20",
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
          state: "focus",
          label: "6",
        },
        {
          kind: "tree",
          state: "focus",
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "20",
        },
        {
          label: "4",
        },
        {
          label: "-3",
        },
        {
          label: "9",
        },
        {
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["6", "1", "20", "", "", "", "", ""],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [1, 2, 3],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head 0 < 길이 1 → 꺼낸 정점 =",
        result: "0",
      },
      vars: "간선 읽기 3 / 9 · 꺼내기 1 / 8",
    },
    {
      title: "T3 정점 1 을 꺼낸다 — dist[3] 을 고친다",
      text: "정점 1 을 꺼내 표시를 내리고, 그 정점에서 나가는 간선 1 개만 읽습니다. 간선 목록의 나머지 7 개는 읽지 않습니다. 1→3 이 20 을 6 + 4 = 10 으로 고칩니다. 정점 3 은 이미 큐에 있어 넣지 않습니다. 큐에는 [2, 3] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist 6",
          state: "read",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 10",
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
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          state: "focus",
          label: "4",
        },
        {
          label: "-3",
        },
        {
          label: "9",
        },
        {
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "focus",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "10", "", "", "", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "focus",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [2, 3],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "head 1 < 길이 4 → 꺼낸 정점 =",
        result: "1",
      },
      vars: "간선 읽기 4 / 9 · 꺼내기 2 / 8",
    },
    {
      title: "T4 정점 2 를 꺼낸다 — dist[1] 을 고친다",
      text: "정점 2 를 꺼내 표시를 내리고, 그 정점에서 나가는 간선 2 개만 읽습니다. 간선 목록의 나머지 6 개는 읽지 않습니다. 2→1 이 6 을 1 + (-3) = -2 로 고칩니다. 정점 1 은 큐에 없어 뒤에 넣습니다. 2→3 은 1 + 9 = 10 이 10 보다 작지 않아 그대로입니다. 큐에는 [3, 1] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
          state: "focus",
        },
        {
          value: "dist 1",
          state: "read",
        },
        {
          value: "dist 10",
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
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          kind: "tree",
          state: "focus",
          label: "-3",
        },
        {
          state: "read",
          label: "9",
        },
        {
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "focus",
            "5": "read",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "-2", "10", "", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "focus",
            "5": "read",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [3, 1],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head 2 < 길이 4 → 꺼낸 정점 =",
        result: "2",
      },
      vars: "간선 읽기 6 / 9 · 꺼내기 3 / 8",
    },
    {
      title: "T5 정점 3 을 꺼낸다 — dist[4] 를 고친다",
      text: "정점 3 을 꺼내 표시를 내리고, 그 정점에서 나가는 간선 1 개만 읽습니다. 간선 목록의 나머지 7 개는 읽지 않습니다. 3→4 가 10 + 2 = 12 를 처음 적습니다. 정점 4 는 큐에 없어 뒤에 넣습니다. 큐에는 [1, 4] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 10",
          state: "read",
        },
        {
          value: "dist 12",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          label: "9",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "focus",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "12", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "focus",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [1, 4],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head 3 < 길이 5 → 꺼낸 정점 =",
        result: "3",
      },
      vars: "간선 읽기 7 / 9 · 꺼내기 4 / 8",
    },
    {
      title: "T6 정점 1 을 꺼낸다 — dist[3] 을 고친다",
      text: "정점 1 을 꺼내 표시를 내리고, 그 정점에서 나가는 간선 1 개만 읽습니다. 간선 목록의 나머지 7 개는 읽지 않습니다. 1→3 이 10 을 -2 + 4 = 2 로 고칩니다. 정점 3 은 큐에 없어 뒤에 넣습니다. 큐에는 [4, 3] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
          state: "read",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 2",
          state: "focus",
        },
        {
          value: "dist 12",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          state: "focus",
          label: "4",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          label: "9",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "focus",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "2", "", "", "", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "focus",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [4, 3],
          states: {
            "1": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head 4 < 길이 6 → 꺼낸 정점 =",
        result: "1",
      },
      vars: "간선 읽기 8 / 9 · 꺼내기 5 / 8",
    },
    {
      title: "T7 정점 4 를 꺼낸다 — 나가는 간선이 없다",
      text: "정점 4 를 꺼냈지만 나가는 간선이 없어 한 개도 읽지 않습니다. 큐에는 [3] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 12",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          label: "9",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [3],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "head 5 < 길이 7 → 꺼낸 정점 =",
        result: "4",
      },
      vars: "간선 읽기 8 / 9 · 꺼내기 6 / 8",
    },
    {
      title: "T8 정점 3 을 꺼낸다 — dist[4] 를 고친다",
      text: "정점 3 을 꺼내 표시를 내리고, 그 정점에서 나가는 간선 1 개만 읽습니다. 간선 목록의 나머지 7 개는 읽지 않습니다. 3→4 가 12 를 2 + 2 = 4 로 고칩니다. 정점 4 는 큐에 없어 뒤에 넣습니다. 큐에는 [4] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 2",
          state: "read",
        },
        {
          value: "dist 4",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          label: "9",
        },
        {
          kind: "tree",
          state: "focus",
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "focus",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "4", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "focus",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [4],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "head 6 < 길이 7 → 꺼낸 정점 =",
        result: "3",
      },
      vars: "간선 읽기 9 / 9 · 꺼내기 7 / 8",
    },
    {
      title: "T9 정점 4 를 꺼낸다 — 나가는 간선이 없다",
      text: "정점 4 를 꺼냈지만 나가는 간선이 없어 한 개도 읽지 않습니다. 큐에는 [] 이 남습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 4",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          label: "9",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "", ""],
          states: {
            "0": "out",
            "1": "out",
            "2": "out",
            "3": "out",
            "4": "out",
            "5": "out",
            "6": "out",
            "7": "out",
          },
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "head 7 < 길이 8 → 꺼낸 정점 =",
        result: "4",
      },
      vars: "간선 읽기 9 / 9 · 꺼내기 8 / 8",
    },
    {
      title: "T10 큐가 비어 dist 를 돌려준다",
      text: "head 가 queue.length 와 같아져 반복이 끝났습니다. [0, -2, 1, 2, 4, Infinity] 을 돌려줍니다. 들어오는 간선이 없는 정점 5 는 한 번도 큐에 들지 않아 Infinity 로 남았습니다.",
      nodes: [
        {
          value: "dist 0",
        },
        {
          value: "dist -2",
        },
        {
          value: "dist 1",
        },
        {
          value: "dist 2",
        },
        {
          value: "dist 4",
        },
        {
          value: "Infinity",
          state: "out",
        },
      ],
      edges: [
        {
          label: "6",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "20",
        },
        {
          kind: "tree",
          label: "4",
        },
        {
          kind: "tree",
          label: "-3",
        },
        {
          label: "9",
        },
        {
          kind: "tree",
          label: "2",
        },
        {
          label: "1",
        },
      ],
      strips: [
        {
          label: "간선 목록",
          values: ["0→1", "0→2", "0→3", "1→3", "2→1", "2→3", "3→4", "5→4"],
          states: {},
          slots: 8,
        },
        {
          label: "dist[u] + w",
          values: ["", "", "", "", "", "", "", ""],
          states: {},
          slots: 8,
        },
        {
          label: "큐 · 정점",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "head < queue.length =",
        result: "거짓",
      },
      vars: "간선 읽기 9 / 9 · 꺼내기 8 / 8",
    },
  ],
};
