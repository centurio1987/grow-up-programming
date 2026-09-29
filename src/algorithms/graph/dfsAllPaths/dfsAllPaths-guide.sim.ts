/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 걸음 하나는 walk 진입 하나, 경로 안 이웃을
 * 건너뛰기 하나, 또는 잇달아 일어난 되돌아가기 한 묶음이다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적고, 걸음마다 정점의 표시 상태와
 * path 안의 자리, 간선의 종류(path 위의 간선은 굵은 실선, 건너뛴 간선은 대시)와 상태, 무대 아래 띠
 * (path 하나와 result 의 경로마다 한 줄)만 바꾼다(`src/_viz/player/graphStage.ts`). 표시가 꺼진 정점은
 * 점선이고, 이번 걸음에 표시를 켜거나 지운 정점이 새로 씀이다. 띠의 칸 수는 가장 길었을 때에 맞춰 고정한다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `dfsAllPaths-guide.test.ts` 가 잰다.
 */
export const allPathsWalk = {
  player: "stage",
  stage: "graph",
  title:
    "dfsAllPaths(6, [[0,2],[0,1],[1,2],[1,4],[2,0],[2,4],[2,5],[5,5]], 0, 4) — 정점 안의 값은 path 안의 자리",
  sub: "T1–T16 · 걸음마다 진입 · 건너뛰기 · 되돌아가기 하나",
  result: "[[0,1,2,4],[0,1,4],[0,2,4]]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1,
        y: 0,
      },
      {
        id: 1,
        x: 0,
        y: 1,
      },
      {
        id: 2,
        x: 2,
        y: 1,
      },
      {
        id: 3,
        x: 3.2,
        y: 0,
      },
      {
        id: 4,
        x: 1,
        y: 2,
      },
      {
        id: 5,
        x: 3.2,
        y: 2,
      },
    ],
    edges: [
      {
        from: 0,
        to: 2,
      },
      {
        from: 0,
        to: 1,
      },
      {
        from: 1,
        to: 2,
      },
      {
        from: 1,
        to: 4,
      },
      {
        from: 2,
        to: 0,
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
        from: 5,
        to: 5,
      },
    ],
    directed: true,
  },
  steps: [
    {
      title: "T1 출발 정점 0 에서 walk 를 시작한다",
      text: "정점 0 의 표시를 켜고 path 끝에 담습니다. 도착 정점이 아니라 이웃 목록 [1, 2] 를 차례로 봅니다.",
      nodes: [
        {
          value: "path[0]",
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
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      strips: [
        {
          label: "path",
          values: [0],
          states: {
            "0": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "walk(0) · 0 === target →",
        result: "거짓",
      },
      vars: "진입 1 / 9",
    },
    {
      title: "T2 walk(1) 에 들어간다 — ③",
      text: "정점 0 의 이웃 1 은 경로에 없어 한 칸 내려갑니다. 정점 1 의 표시를 켜고 path 끝에 담습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
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
        {},
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
          label: "path",
          values: [0, 1],
          states: {
            "1": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[1] →",
        result: "거짓",
      },
      vars: "진입 2 / 9",
    },
    {
      title: "T3 walk(2) 에 들어간다 — ③",
      text: "정점 1 의 이웃 2 는 경로에 없어 한 칸 내려갑니다. 정점 2 의 표시를 켜고 path 끝에 담습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
        },
        {
          value: "path[2]",
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 1, 2],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[2] →",
        result: "거짓",
      },
      vars: "진입 3 / 9",
    },
    {
      title: "T4 이웃 0 이 경로 안에 있어 건너뛴다 — ②",
      text: "정점 2 의 이웃 0 은 이미 경로 안에 있습니다. 다시 담으면 같은 정점이 두 번 들어가므로 건너뜁니다.",
      nodes: [
        {
          value: "path[0]",
          state: "read",
        },
        {
          value: "path[1]",
        },
        {
          value: "path[2]",
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
        {},
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
        {},
        {
          kind: "back",
          state: "read",
          label: "건너뜀",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 1, 2],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[0] →",
        result: "참",
      },
      vars: "진입 3 / 9",
    },
    {
      title: "T5 walk(4) 에 들어가 경로를 담는다 — ①",
      text: "정점 4 의 표시를 켜고 path 끝에 담습니다. 도착 정점이라 path [0, 1, 2, 4] 를 복사해 result 에 담고, 이웃 목록은 읽지 않습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
        },
        {
          value: "path[2]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[3]",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {},
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
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 1, 2, 4],
          states: {
            "3": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
          },
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "4 === target →",
        result: "참",
      },
      vars: "진입 4 / 9",
    },
    {
      title: "T6 4 에서 되돌아간다 — 표시를 지운다",
      text: "walk(4) 가 끝나 4 의 표시를 지우고 path 에서 뺍니다. 정점 2 의 다음 이웃으로 이어갑니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
        },
        {
          value: "path[2]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "지움",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
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
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 1, 2],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[4] ←",
        result: "거짓",
      },
      vars: "진입 4 / 9",
    },
    {
      title: "T7 walk(5) 에 들어간다 — ③",
      text: "정점 2 의 이웃 5 는 경로에 없어 한 칸 내려갑니다. 정점 5 의 표시를 켜고 path 끝에 담습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
        },
        {
          value: "path[2]",
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
          value: "path[3]",
          state: "focus",
        },
      ],
      edges: [
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
        {
          kind: "tree",
          state: "focus",
        },
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 1, 2, 5],
          states: {
            "3": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[5] →",
        result: "거짓",
      },
      vars: "진입 5 / 9",
    },
    {
      title: "T8 5 · 2 에서 되돌아간다 — 표시를 지운다",
      text: "walk(5) · walk(2) 가 끝나 5 · 2 의 표시를 지우고 path 에서 뺍니다. 정점 1 의 다음 이웃으로 이어갑니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
        },
        {
          value: "지움",
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
          value: "지움",
          state: "focus",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
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
          label: "path",
          values: [0, 1],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[5, 2] ←",
        result: "거짓",
      },
      vars: "진입 5 / 9",
    },
    {
      title: "T9 walk(4) 에 들어가 경로를 담는다 — ①",
      text: "정점 4 의 표시를 켜고 path 끝에 담습니다. 도착 정점이라 path [0, 1, 4] 를 복사해 result 에 담고, 이웃 목록은 읽지 않습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "path[1]",
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
          value: "path[2]",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [
        {},
        {
          kind: "tree",
        },
        {},
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
          label: "path",
          values: [0, 1, 4],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "4 === target →",
        result: "참",
      },
      vars: "진입 6 / 9",
    },
    {
      title: "T10 4 · 1 에서 되돌아간다 — 표시를 지운다",
      text: "walk(4) · walk(1) 이 끝나 4 · 1 의 표시를 지우고 path 에서 뺍니다. 정점 0 의 다음 이웃으로 이어갑니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "지움",
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
          value: "지움",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      strips: [
        {
          label: "path",
          values: [0],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[4, 1] ←",
        result: "거짓",
      },
      vars: "진입 6 / 9",
    },
    {
      title: "T11 walk(2) 에 들어간다 — ③",
      text: "정점 0 의 이웃 2 는 경로에 없어 한 칸 내려갑니다. 정점 2 의 표시를 켜고 path 끝에 담습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[1]",
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
          state: "focus",
        },
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 2],
          states: {
            "1": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[2] →",
        result: "거짓",
      },
      vars: "진입 7 / 9",
    },
    {
      title: "T12 이웃 0 이 경로 안에 있어 건너뛴다 — ②",
      text: "정점 2 의 이웃 0 은 이미 경로 안에 있습니다. 다시 담으면 같은 정점이 두 번 들어가므로 건너뜁니다.",
      nodes: [
        {
          value: "path[0]",
          state: "read",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[1]",
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
        {},
        {
          kind: "back",
          state: "read",
          label: "건너뜀",
        },
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 2],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[0] →",
        result: "참",
      },
      vars: "진입 7 / 9",
    },
    {
      title: "T13 walk(4) 에 들어가 경로를 담는다 — ①",
      text: "정점 4 의 표시를 켜고 path 끝에 담습니다. 도착 정점이라 path [0, 2, 4] 를 복사해 result 에 담고, 이웃 목록은 읽지 않습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[1]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[2]",
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
        {},
        {},
        {},
        {
          kind: "tree",
          state: "focus",
        },
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 2, 4],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [0, 2, 4],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "4 === target →",
        result: "참",
      },
      vars: "진입 8 / 9",
    },
    {
      title: "T14 4 에서 되돌아간다 — 표시를 지운다",
      text: "walk(4) 가 끝나 4 의 표시를 지우고 path 에서 뺍니다. 정점 2 의 다음 이웃으로 이어갑니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[1]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "지움",
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
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      strips: [
        {
          label: "path",
          values: [0, 2],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [0, 2, 4],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[4] ←",
        result: "거짓",
      },
      vars: "진입 8 / 9",
    },
    {
      title: "T15 walk(5) 에 들어간다 — ③",
      text: "정점 2 의 이웃 5 는 경로에 없어 한 칸 내려갑니다. 정점 5 의 표시를 켜고 path 끝에 담습니다.",
      nodes: [
        {
          value: "path[0]",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "path[1]",
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
          value: "path[2]",
          state: "focus",
        },
      ],
      edges: [
        {
          kind: "tree",
        },
        {},
        {},
        {},
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
          label: "path",
          values: [0, 2, 5],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [0, 2, 4],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[5] →",
        result: "거짓",
      },
      vars: "진입 9 / 9",
    },
    {
      title: "T16 5 · 2 · 0 에서 되돌아간다 — 표시를 지운다",
      text: "walk(5) · walk(2) · walk(0) 이 끝나 5 · 2 · 0 의 표시를 지우고 path 에서 뺍니다. path 가 비어 전체가 끝납니다.",
      nodes: [
        {
          value: "지움",
          state: "focus",
        },
        {
          value: "",
          state: "empty",
        },
        {
          value: "지움",
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
          value: "지움",
          state: "focus",
        },
      ],
      edges: [{}, {}, {}, {}, {}, {}, {}, {}],
      strips: [
        {
          label: "path",
          values: [],
          states: {},
          slots: 4,
        },
        {
          label: "result[0]",
          values: [0, 1, 2, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[1]",
          values: [0, 1, 4],
          states: {},
          slots: 4,
        },
        {
          label: "result[2]",
          values: [0, 2, 4],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "onPath[5, 2, 0] ←",
        result: "거짓",
      },
      vars: "진입 9 / 9",
    },
  ],
};
