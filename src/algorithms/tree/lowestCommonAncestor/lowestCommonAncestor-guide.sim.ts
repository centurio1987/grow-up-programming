/**
 * 걸음 재생 패널 — `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 제목은
 * 원고의 걸음 번호(`T#`)로 연다 — P3 이 그 자리를 잰다. 이웃 목록 하나 · 깊이와 부모 하나 · 층마다 하나가
 * 준비 걸음이고, 질의마다 깊이 맞추기 하나와 함께 올리기의 `k` 하나하나가 걸음 하나다. 깊이를 맞춘 자리에서
 * 두 정점이 같으면 그 질의는 걸음 하나로 끝난다. 마지막 걸음이 넷째 질의의 답을 내는 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가 실제보다
 * 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 패널 규약 — 「그래프」 무대(KAN-058, SPEC §13)
 *
 * `player: "stage"` 가 걸음 재생 패널(`src/_viz/player/StepPlayer.tsx`)을 고르고, `stage: "graph"` 가
 * 무대 갈래를 고른다. 정점과 간선의 자리(`layout`)는 패널에 한 번만 적는다 — 뿌리 0 에서 매단 트리를
 * `treeLayout` 으로 놓은 자리다. 걸음마다 정점 안의 값(깊이)과 상태, 간선의 상태(이번 걸음에 올라간 길은
 * 강조), 지금 `u` · `v` 가 선 정점을 두른 묶음, 무대 아래 띠만 바꾼다(`src/_viz/player/graphStage.ts`).
 * 띠는 맨 위가 정점 번호, 그 아래가 2^k 조상 표의 층(`k` 층 = `2^k` 칸 위 — 파일럿 `sparseTableRangeMin`
 * 의 층과 같은 말), 맨 아래가 답 목록이다. 아직 계산하지 않은 칸은 점선(아직), 이번 걸음에 쓴 칸은 강조,
 * 읽은 칸은 읽음이다. 간선에 방향이 없으므로 `directed: false` 다.
 *
 * **값은 손으로 적지 않았다.** 이 리터럴은 그림 사이드카의 `stageStepsFromRef()` 가 정본과 같은 절차를
 * 실행해 낸 결과를 옮긴 것이고, 둘이 같은지는 `lowestCommonAncestor-guide.test.ts` 가 잰다.
 */
export const lcaWalk = {
  player: "stage",
  stage: "graph",
  title:
    "lowestCommonAncestor(9, [[0,1],[0,2],[1,3],[1,4],[2,5],[3,6],[5,7],[5,8]], 0, [[6,4],[6,7],[3,6],[8,7]]) — 정점 안은 깊이, 띠는 2^k 조상 표의 층",
  sub: "T1–T21 · 준비 걸음 5 개 뒤 질의 4 개를 답한다",
  result: "[1, 0, 3, 5]",
  layout: {
    nodes: [
      {
        id: 0,
        x: 1.5,
        y: 0,
      },
      {
        id: 1,
        x: 0.5,
        y: 1,
      },
      {
        id: 2,
        x: 2.5,
        y: 1,
      },
      {
        id: 3,
        x: 0,
        y: 2,
      },
      {
        id: 4,
        x: 1,
        y: 2,
      },
      {
        id: 5,
        x: 2.5,
        y: 2,
      },
      {
        id: 6,
        x: 0,
        y: 3,
      },
      {
        id: 7,
        x: 2,
        y: 3,
      },
      {
        id: 8,
        x: 3,
        y: 3,
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
        from: 3,
        to: 6,
      },
      {
        from: 5,
        to: 7,
      },
      {
        from: 5,
        to: 8,
      },
    ],
    directed: false,
  },
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      text: "간선 8 개를 양쪽 정점의 목록에 한 번씩 넣었습니다. 깊이는 아직 정하지 않았고, anc 는 전부 뿌리 0 으로 채워 두었지만 계산한 칸이 아니라서 점선으로 그립니다.",
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
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "near 목록 길이의 합 =",
        result: "16 = 2E",
      },
      vars: "쌓은 층 0 / 4",
    },
    {
      title: "T2 뿌리에서 따라가 깊이와 0 층(부모)을 정한다 ①",
      text: "뿌리 0 에서 스택으로 따라가며 0 → 2 → 5 → 8 → 7 → 1 → 4 → 3 → 6 차례로 꺼냈습니다. 새로 만난 이웃마다 깊이와 부모를 적었고, 이미 본 이웃 8 개는 건너뛰었습니다. 0 층이 곧 부모이고, 뿌리의 칸은 처음 채워 둔 뿌리 자신입니다.",
      nodes: [
        {
          value: "depth 0",
          state: "focus",
        },
        {
          value: "depth 1",
          state: "focus",
        },
        {
          value: "depth 1",
          state: "focus",
        },
        {
          value: "depth 2",
          state: "focus",
        },
        {
          value: "depth 2",
          state: "focus",
        },
        {
          value: "depth 2",
          state: "focus",
        },
        {
          value: "depth 3",
          state: "focus",
        },
        {
          value: "depth 3",
          state: "focus",
        },
        {
          value: "depth 3",
          state: "focus",
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
          state: "focus",
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
          state: "focus",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "이미 본 이웃을 건너뛴 횟수 =",
        result: "8",
      },
      vars: "쌓은 층 1 / 4",
    },
    {
      title: "T3 1 층(2 칸 위)을 0 층으로 쌓는다 ②",
      text: "1 층의 칸 v 마다 0 층을 두 번 따라간 값을 적었습니다 — anc[anc[v][0]][0]. 2 칸 위가 뿌리를 넘는 정점 2 개는 뿌리 0 에 머뭅니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "read",
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[6][1] = anc[anc[6][0]][0] = anc[3][0] =",
        result: "1",
      },
      vars: "쌓은 층 2 / 4",
    },
    {
      title: "T4 2 층(4 칸 위)을 1 층으로 쌓는다 ②",
      text: "2 층의 칸 v 마다 1 층을 두 번 따라간 값을 적었습니다 — anc[anc[v][1]][1]. 4 칸 위가 뿌리를 넘는 정점 8 개는 뿌리 0 에 머뭅니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "read",
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: ["", "", "", "", "", "", "", "", ""],
          states: {
            "0": "empty",
            "1": "empty",
            "2": "empty",
            "3": "empty",
            "4": "empty",
            "5": "empty",
            "6": "empty",
            "7": "empty",
            "8": "empty",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[6][2] = anc[anc[6][1]][1] = anc[1][1] =",
        result: "0",
      },
      vars: "쌓은 층 3 / 4",
    },
    {
      title: "T5 3 층(8 칸 위)을 2 층으로 쌓는다 ②",
      text: "3 층의 칸 v 마다 2 층을 두 번 따라간 값을 적었습니다 — anc[anc[v][2]][2]. 8 칸 위가 뿌리를 넘는 정점 8 개는 뿌리 0 에 머뭅니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "0": "read",
            "1": "read",
            "2": "read",
            "3": "read",
            "4": "read",
            "5": "read",
            "6": "read",
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "0": "focus",
            "1": "focus",
            "2": "focus",
            "3": "focus",
            "4": "focus",
            "5": "focus",
            "6": "focus",
            "7": "focus",
            "8": "focus",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[6][3] = anc[anc[6][2]][2] = anc[0][2] =",
        result: "0",
      },
      vars: "쌓은 층 4 / 4",
    },
    {
      title: "T6 lca(6, 4) 깊이를 맞춘다 ③",
      text: "lca(6, 4) 를 받았습니다. gap 의 켜진 자리마다 올렸습니다 — anc[6][0] = 3. u = 3 · v = 4 는 서로 다른 정점이라 함께 올리기로 갑니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
          state: "focus",
        },
        {
          value: "depth 2",
          state: "read",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
          state: "read",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [3],
          label: "u",
          state: "focus",
        },
        {
          members: [4],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "6": "read",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "gap = depth[6] − depth[4] =",
        result: "1 → u = 3",
      },
      vars: "질의 1 / 4",
    },
    {
      title: "T7 lca(6, 4) k = 3 · 8 칸 위를 비교한다",
      text: "8 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [3],
          label: "u",
        },
        {
          members: [4],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[3][3] = 0 · anc[4][3] = 0",
        result: "= → 그대로",
      },
      vars: "질의 1 / 4 · k = 3",
    },
    {
      title: "T8 lca(6, 4) k = 2 · 4 칸 위를 비교한다",
      text: "4 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [3],
          label: "u",
        },
        {
          members: [4],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[3][2] = 0 · anc[4][2] = 0",
        result: "= → 그대로",
      },
      vars: "질의 1 / 4 · k = 2",
    },
    {
      title: "T9 lca(6, 4) k = 1 · 2 칸 위를 비교한다",
      text: "2 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [3],
          label: "u",
        },
        {
          members: [4],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[3][1] = 0 · anc[4][1] = 0",
        result: "= → 그대로",
      },
      vars: "질의 1 / 4 · k = 1",
    },
    {
      title: "T10 lca(6, 4) k = 0 · 1 칸 위를 비교한다",
      text: "1 칸 위 두 조상이 모두 1 이라서 올리지 않습니다. k 를 다 봤으니 u 의 부모 anc[3][0] = 1 을 답으로 냅니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
          state: "focus",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [3],
          label: "u",
        },
        {
          members: [4],
          label: "v",
        },
        {
          members: [1],
          label: "답",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "3": "read",
            "4": "read",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1],
          states: {
            "0": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[3][0] = 1 · anc[4][0] = 1",
        result: "= → 그대로 · 답 1",
      },
      vars: "질의 1 / 4 · k = 0",
    },
    {
      title: "T11 lca(6, 7) 깊이를 맞춘다 ③",
      text: "lca(6, 7) 을 받았습니다. gap 이 0 이라 올리지 않습니다. u = 6 · v = 7 은 서로 다른 정점이라 함께 올리기로 갑니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
          state: "read",
        },
        {
          value: "depth 3",
          state: "read",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [6],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "gap = depth[6] − depth[7] =",
        result: "0 → 그대로",
      },
      vars: "질의 2 / 4",
    },
    {
      title: "T12 lca(6, 7) k = 3 · 8 칸 위를 비교한다",
      text: "8 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [6],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "6": "read",
            "7": "read",
          },
        },
        {
          label: "답 목록",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[6][3] = 0 · anc[7][3] = 0",
        result: "= → 그대로",
      },
      vars: "질의 2 / 4 · k = 3",
    },
    {
      title: "T13 lca(6, 7) k = 2 · 4 칸 위를 비교한다",
      text: "4 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [6],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "6": "read",
            "7": "read",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[6][2] = 0 · anc[7][2] = 0",
        result: "= → 그대로",
      },
      vars: "질의 2 / 4 · k = 2",
    },
    {
      title: "T14 lca(6, 7) k = 1 · 2 칸 위를 비교한다 ⑤",
      text: "2 칸 위 두 조상 1 과 2 가 달라서 둘 다 올렸습니다. 이제 u = 1 · v = 2 입니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
          state: "focus",
        },
        {
          value: "depth 1",
          state: "focus",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
          state: "focus",
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
      ],
      groups: [
        {
          members: [1],
          label: "u",
          state: "focus",
        },
        {
          members: [2],
          label: "v",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {
            "6": "read",
            "7": "read",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[6][1] = 1 · anc[7][1] = 2",
        result: "≠ → u = 1 · v = 2",
      },
      vars: "질의 2 / 4 · k = 1",
    },
    {
      title: "T15 lca(6, 7) k = 0 · 1 칸 위를 비교한다",
      text: "1 칸 위 두 조상이 모두 0 이라서 올리지 않습니다. k 를 다 봤으니 u 의 부모 anc[1][0] = 0 을 답으로 냅니다.",
      nodes: [
        {
          value: "depth 0",
          state: "focus",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [1],
          label: "u",
        },
        {
          members: [2],
          label: "v",
        },
        {
          members: [0],
          label: "답",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "1": "read",
            "2": "read",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1, 0],
          states: {
            "1": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[1][0] = 0 · anc[2][0] = 0",
        result: "= → 그대로 · 답 0",
      },
      vars: "질의 2 / 4 · k = 0",
    },
    {
      title: "T16 lca(3, 6) 깊이를 맞춘다 ③ ④",
      text: "lca(3, 6) 을 받았습니다. gap 의 켜진 자리마다 올렸습니다 — anc[6][0] = 3. 깊이를 맞춘 자리에서 두 정점이 모두 3 이 되어 3 이 답입니다. 함께 올리기로 가지 않습니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
          state: "focus",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
          state: "read",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [3],
          label: "u = v = 답",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "6": "read",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1, 0, 3],
          states: {
            "2": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "gap = depth[6] − depth[3] =",
        result: "1 → u = v = 3",
      },
      vars: "질의 3 / 4",
    },
    {
      title: "T17 lca(8, 7) 깊이를 맞춘다 ③",
      text: "lca(8, 7) 을 받았습니다. gap 이 0 이라 올리지 않습니다. u = 8 · v = 7 은 서로 다른 정점이라 함께 올리기로 갑니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
          state: "read",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [8],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1, 0, 3],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "gap = depth[8] − depth[7] =",
        result: "0 → 그대로",
      },
      vars: "질의 4 / 4",
    },
    {
      title: "T18 lca(8, 7) k = 3 · 8 칸 위를 비교한다",
      text: "8 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [8],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "답 목록",
          values: [1, 0, 3],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[8][3] = 0 · anc[7][3] = 0",
        result: "= → 그대로",
      },
      vars: "질의 4 / 4 · k = 3",
    },
    {
      title: "T19 lca(8, 7) k = 2 · 4 칸 위를 비교한다",
      text: "4 칸 위 두 조상이 모두 0 이라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
          state: "read",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [8],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1, 0, 3],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[8][2] = 0 · anc[7][2] = 0",
        result: "= → 그대로",
      },
      vars: "질의 4 / 4 · k = 2",
    },
    {
      title: "T20 lca(8, 7) k = 1 · 2 칸 위를 비교한다",
      text: "2 칸 위 두 조상이 모두 2 가라서 올리지 않습니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
          state: "read",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [8],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {},
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1, 0, 3],
          states: {},
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[8][1] = 2 · anc[7][1] = 2",
        result: "= → 그대로",
      },
      vars: "질의 4 / 4 · k = 1",
    },
    {
      title: "T21 lca(8, 7) k = 0 · 1 칸 위를 비교한다",
      text: "1 칸 위 두 조상이 모두 5 가라서 올리지 않습니다. k 를 다 봤으니 u 의 부모 anc[8][0] = 5 를 답으로 냅니다.",
      nodes: [
        {
          value: "depth 0",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 1",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
        },
        {
          value: "depth 2",
          state: "focus",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
        },
        {
          value: "depth 3",
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
        {
          kind: "tree",
        },
        {
          kind: "tree",
        },
      ],
      groups: [
        {
          members: [8],
          label: "u",
        },
        {
          members: [7],
          label: "v",
        },
        {
          members: [5],
          label: "답",
          state: "focus",
        },
      ],
      strips: [
        {
          label: "정점 v",
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        },
        {
          label: "0 층 · 1 칸 위",
          values: [0, 0, 0, 1, 1, 2, 3, 5, 5],
          states: {
            "7": "read",
            "8": "read",
          },
        },
        {
          label: "1 층 · 2 칸 위",
          values: [0, 0, 0, 0, 0, 0, 1, 2, 2],
          states: {},
        },
        {
          label: "2 층 · 4 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "3 층 · 8 칸 위",
          values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          states: {},
        },
        {
          label: "답 목록",
          values: [1, 0, 3, 5],
          states: {
            "3": "focus",
          },
          slots: 4,
        },
      ],
      calc: {
        expr: "anc[8][0] = 5 · anc[7][0] = 5",
        result: "= → 그대로 · 답 5",
      },
      vars: "질의 4 / 4 · k = 0",
    },
  ],
};
