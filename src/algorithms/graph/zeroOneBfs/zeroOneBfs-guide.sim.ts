/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. T1 이 시작, 간선 하나를 읽는 일이 걸음 하나이고,
 * 꺼낸 정점에 나가는 간선이 없으면 꺼낸 것만으로 한 걸음이다. 마지막 걸음이 덱이 비어 끝나는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 값(`dist`)과
 * 상태, 간선의 종류(지금 거리를 낸 간선은 굵은 실선)와 상태, 무대 아래 덱의 띠 둘(`strips`)만 바꾼다
 * (`src/_viz/player/graphStage.ts`).
 *
 * 덱의 띠는 **왼쪽 끝이 앞**이다 — 윗줄이 정점, 아랫줄이 넣을 때 적은 거리이고 같은 칸 번호가 한 항목이다.
 * 이번 걸음에 넣은 항목은 새로 씀, 뒤처진 항목은 이번 걸음 밖이다. 그렇게 정한 까닭은 그림 사이드카 머리
 * 주석에 있다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `zeroOneBfs-guide.test.ts` 가 잰다.
 */
export const zeroOneWalk = {
  player: "stage",
  stage: "graph",
  title:
    "zeroOneBfs(6, [[0,1,1],[0,2,0],[2,1,0],[2,3,1],[1,3,1],[3,4,0]], 0) — 간선 옆 수는 가중치, 정점 안의 수는 dist",
  sub: "T1–T10 · 걸음마다 간선 하나",
  result: "[0,0,0,1,1,-1]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 0,
        y: 1,
      },
      {
        id: 1,
        x: 1.3,
        y: 0,
      },
      {
        id: 2,
        x: 1.3,
        y: 2,
      },
      {
        id: 3,
        x: 2.6,
        y: 1,
      },
      {
        id: 4,
        x: 3.9,
        y: 0,
      },
      {
        id: 5,
        x: 3.9,
        y: 2,
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
        from: 2,
        to: 1,
      },
      {
        from: 2,
        to: 3,
      },
      {
        from: 1,
        to: 3,
      },
      {
        from: 3,
        to: 4,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 시작값 — 덱에 정점 0",
      text: "dist[0] 에 0 을 적고 나머지는 ∞ 로 둡니다. 덱에는 정점 0 이 넣을 때 거리 0 으로 들어갑니다.",
      nodes: [
        {
          value: "0",
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
          label: "1",
        },
        {
          label: "0",
        },
        {
          label: "0",
        },
        {
          label: "1",
        },
        {
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
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
      vars: "간선 검사 0 / 7",
    },
    {
      title: "T2 정점 0 을 꺼내 0→1 을 본다",
      text: "덱 앞에서 정점 0 을 꺼냅니다. 넣을 때 거리는 0 이고 지금 dist[0] 는 0 입니다. 간선 0→1 의 새 값 0 + 1 = 1 이 지금 dist[1] = ∞ 보다 작아 고쳐 적고, 가중치가 1 이라 거리가 하나 커졌으므로 덱 뒤에 넣습니다.",
      nodes: [
        {
          value: "0",
          state: "read",
        },
        {
          value: "1",
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
          label: "1",
        },
        {
          label: "0",
        },
        {
          label: "0",
        },
        {
          label: "1",
        },
        {
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 + 1 = 1 < ∞ →",
        result: "뒤에 넣는다",
      },
      vars: "간선 검사 1 / 7",
    },
    {
      title: "T3 정점 0 의 0→2 를 본다",
      text: "간선 0→2 의 새 값 0 + 0 = 0 이 지금 dist[2] = ∞ 보다 작아 고쳐 적고, 가중치가 0 이라 거리가 그대로이므로 덱 앞에 넣습니다.",
      nodes: [
        {
          value: "0",
          state: "read",
        },
        {
          value: "1",
        },
        {
          value: "0",
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
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "0",
        },
        {
          label: "0",
        },
        {
          label: "1",
        },
        {
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [2, 1],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [0, 1],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 + 0 = 0 < ∞ →",
        result: "앞에 넣는다",
      },
      vars: "간선 검사 2 / 7",
    },
    {
      title: "T4 정점 2 를 꺼내 2→1 을 본다",
      text: "덱 앞에서 정점 2 를 꺼냅니다. 넣을 때 거리는 0 이고 지금 dist[2] 는 0 입니다. 간선 2→1 의 새 값 0 + 0 = 0 이 지금 dist[1] = 1 보다 작아 고쳐 적고, 가중치가 0 이라 거리가 그대로이므로 덱 앞에 넣습니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
          state: "focus",
        },
        {
          value: "0",
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
          label: "1",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          state: "focus",
          label: "0",
        },
        {
          label: "1",
        },
        {
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [1, 1],
          states: {
            "0": "focus",
            "1": "out",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [0, 1],
          states: {
            "0": "focus",
            "1": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 + 0 = 0 < 1 →",
        result: "앞에 넣는다",
      },
      vars: "간선 검사 3 / 7",
    },
    {
      title: "T5 정점 2 의 2→3 을 본다",
      text: "간선 2→3 의 새 값 0 + 1 = 1 이 지금 dist[3] = ∞ 보다 작아 고쳐 적고, 가중치가 1 이라 거리가 하나 커졌으므로 덱 뒤에 넣습니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "0",
          state: "read",
        },
        {
          value: "1",
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
          label: "1",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          state: "focus",
          label: "1",
        },
        {
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [1, 1, 3],
          states: {
            "1": "out",
            "2": "focus",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [0, 1, 1],
          states: {
            "1": "out",
            "2": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 + 1 = 1 < ∞ →",
        result: "뒤에 넣는다",
      },
      vars: "간선 검사 4 / 7",
    },
    {
      title: "T6 정점 1 을 꺼내 1→3 을 본다",
      text: "덱 앞에서 정점 1 을 꺼냅니다. 넣을 때 거리는 0 이고 지금 dist[1] 는 0 입니다. 간선 1→3 의 새 값 0 + 1 = 1 이 지금 dist[3] = 1 보다 작지 않아 그대로 둡니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
          state: "read",
        },
        {
          value: "0",
        },
        {
          value: "1",
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
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          state: "read",
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [1, 3],
          states: {
            "0": "out",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [1, 1],
          states: {
            "0": "out",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "0 + 1 = 1 >= 1 →",
        result: "그대로",
      },
      vars: "간선 검사 5 / 7",
    },
    {
      title: "T7 정점 1 을 다시 꺼내 1→3 을 본다",
      text: "덱 앞에서 정점 1 을 꺼냅니다. 넣을 때 거리는 1 이고 지금 dist[1] 는 0 입니다. 간선 1→3 의 새 값 0 + 1 = 1 이 지금 dist[3] = 1 보다 작지 않아 그대로 둡니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
          state: "read",
        },
        {
          value: "0",
        },
        {
          value: "1",
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
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          state: "read",
          label: "1",
        },
        {
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [3],
          states: {},
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [1],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "0 + 1 = 1 >= 1 →",
        result: "그대로",
      },
      vars: "간선 검사 6 / 7",
    },
    {
      title: "T8 정점 3 을 꺼내 3→4 를 본다",
      text: "덱 앞에서 정점 3 을 꺼냅니다. 넣을 때 거리는 1 이고 지금 dist[3] 는 1 입니다. 간선 3→4 의 새 값 1 + 0 = 1 이 지금 dist[4] = ∞ 보다 작아 고쳐 적고, 가중치가 0 이라 거리가 그대로이므로 덱 앞에 넣습니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "1",
          state: "read",
        },
        {
          value: "1",
          state: "focus",
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
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "1",
        },
        {
          kind: "tree",
          state: "focus",
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [4],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 3,
        },
      ],
      calc: {
        expr: "1 + 0 = 1 < ∞ →",
        result: "앞에 넣는다",
      },
      vars: "간선 검사 7 / 7",
    },
    {
      title: "T9 정점 4 를 꺼낸다 — 나가는 간선이 없다",
      text: "덱 앞에서 정점 4 를 꺼냅니다. 넣을 때 거리는 1 이고 지금 dist[4] 는 1 입니다. 이 정점에서 나가는 간선이 없어 볼 것이 없습니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "1",
        },
        {
          value: "1",
          state: "read",
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
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "1",
        },
        {
          kind: "tree",
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "adj[4] 의 간선 →",
        result: "0 개",
      },
      vars: "간선 검사 7 / 7",
    },
    {
      title: "T10 덱이 비어 ∞ 칸을 -1 로 적는다",
      text: "덱이 비어 반복이 끝납니다. 한 번도 값을 받지 못한 정점 5 가 -1 로 적히고, 반환값은 [0, 0, 0, 1, 1, -1] 입니다.",
      nodes: [
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "0",
        },
        {
          value: "1",
        },
        {
          value: "1",
        },
        {
          value: "-1",
          state: "out",
        },
      ],
      edges: [
        {
          label: "1",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "0",
        },
        {
          kind: "tree",
          label: "1",
        },
        {
          label: "1",
        },
        {
          kind: "tree",
          label: "0",
        },
      ],
      strips: [
        {
          label: "덱 · 정점 (왼쪽이 앞)",
          values: [],
          states: {},
          slots: 3,
        },
        {
          label: "덱 · 넣을 때 거리",
          values: [],
          states: {},
          slots: 3,
        },
      ],
      calc: {
        expr: "deque.size() > 0 →",
        result: "거짓",
      },
      vars: "간선 검사 7 / 7",
    },
  ],
};
