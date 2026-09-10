import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)와 같다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 줄에 없음 · 줄에 있음 · 지금 처리 중 ·
 * 완화가 끝남)와 지금 보고 있는 간선을 그리고, `keyValue` 는 그 순간의 남은 선행 정점 수 ·
 * 줄 · 거리 배열 · 갈래를 적는다. 그래프 그림만으로는 **줄의 순서**와 **거리 배열**이
 * 안 보이고, 이 알고리즘이 답을 정하는 근거가 그 둘이라 두 패널이 함께 있어야 한 프레임이
 * 완결된다. 같은 갈래(`graph` + `keyValue`)를 쓴 `topologicalSort` 의 짝을 그대로 따른다.
 *
 * **`nodeStatus` 의 뜻을 편 전체에서 한 벌로 둔다** — `frontier` 는 줄에 들어갔지만 아직
 * 완화하지 않은 정점, `active` 는 지금 완화하는 정점, `visited` 는 완화가 끝난 정점이다.
 * 줄을 만드는 단계(T2·T3)와 완화하는 단계(T5 이후)가 같은 색을 다른 뜻으로 쓰지 않는다.
 *
 * **`nodeValue` 는 그 시점의 `dist` 다.** 아직 갈 길을 못 찾은 정점에는 값을 붙이지 않는다 —
 * `Infinity` 를 정점 옆에 그리면 그 표기가 그래프 그림과 본문 배열 두 곳에 서로 다른 모양으로
 * 남는다. 본문은 `Infinity` 로 적고, 이 패널은 값이 정해진 정점에만 수를 붙인다.
 * 앞선 `dijkstra` 편이 같은 자리를 같은 방식으로 정했다.
 *
 * 좌표는 0~100 정규화다. 간선에 방향이 있으므로 `directed: true` 를 붙이고 가중치를 함께
 * 적는다. 시작 정점 0 을 왼쪽에 두고, 시작 정점으로 들어오는 간선을 가진 정점 4 를 그 위에,
 * 간선이 하나도 없는 정점 5 를 오른쪽 아래에 떨어뜨려 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const dagWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "dagShortestPath(6, [[2,3,2],[0,1,3],[1,2,-4],[0,2,5],[1,3,6],[4,0,2],[0,3,7]], 0)",
  result: "[0, 3, -1, 1, Infinity, Infinity]",
  steps: [
    {
      title: "T1 간선 목록을 두 자료로 옮긴다",
      detail:
        "정점마다 나가는 간선 목록과 들어오는 간선 수를 만든다. 줄은 아직 비어 있고 거리 배열도 아직 없다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      entries: [
        { label: "남은 선행 정점 수", value: "0:1 1:1 2:2 3:3 4:0 5:0" },
        { label: "줄", value: "[]" },
        { label: "처리 중", value: "—" },
        { label: "dist", value: "—" },
        { label: "갈래", value: "—" },
      ],
    },
    {
      title: "T2 들어오는 간선이 없는 정점을 줄에 놓는다",
      detail:
        "남은 선행 정점 수가 0 인 정점은 4 와 5 다. 번호가 작은 것부터 놓아 줄이 [4, 5] 로 시작한다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: { 4: "frontier", 5: "frontier" },
      entries: [
        { label: "남은 선행 정점 수", value: "0:1 1:1 2:2 3:3 4:0 5:0" },
        { label: "줄", value: "[4, 5]" },
        { label: "처리 중", value: "—" },
        { label: "dist", value: "—" },
        { label: "갈래", value: "① 남은 수가 0 인 정점을 줄에 놓는다" },
      ],
    },
    {
      title: "T3 줄을 끝까지 채운다",
      detail:
        "4 를 처리해 0 이, 0 을 처리해 1 이, 1 을 처리해 2 가, 2 를 처리해 3 이 줄 뒤에 붙는다. 정점 5 는 나가는 간선이 없어 붙일 것이 없다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "frontier",
        5: "frontier",
      },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "—" },
        { label: "dist", value: "—" },
        { label: "갈래", value: "② 0 이 된 그 순간에 줄 뒤에 붙인다" },
      ],
    },
    {
      title: "T4 거리 배열을 시작값으로 둔다",
      detail:
        "시작 정점 0 만 0 이고 나머지는 Infinity 다. dist = [0, Infinity, Infinity, Infinity, Infinity, Infinity].",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "frontier",
        5: "frontier",
      },
      nodeValue: { 0: 0 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "—" },
        {
          label: "dist",
          value: "[0, Infinity, Infinity, Infinity, Infinity, Infinity]",
        },
        { label: "갈래", value: "③ 시작 정점만 0 이다" },
      ],
    },
    {
      title: "T5 정점 4 를 건너뛴다",
      detail:
        "줄의 첫 자리는 4 인데 dist[4] 가 Infinity 다. 시작 정점에서 4 로 가는 길이 없으므로 4→0 을 완화해도 아무 값도 못 고친다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "active",
        5: "frontier",
      },
      nodeValue: { 0: 0 },
      activeEdge: { from: 4, to: 0 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "정점 4" },
        {
          label: "dist",
          value: "[0, Infinity, Infinity, Infinity, Infinity, Infinity]",
        },
        { label: "갈래", value: "④ 갈 길이 없어 건너뛴다" },
      ],
    },
    {
      title: "T6 정점 5 를 건너뛴다",
      detail:
        "정점 5 도 dist 가 Infinity 다. 나가는 간선도 없어 어차피 완화할 것이 없다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "visited",
        5: "active",
      },
      nodeValue: { 0: 0 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "정점 5" },
        {
          label: "dist",
          value: "[0, Infinity, Infinity, Infinity, Infinity, Infinity]",
        },
        { label: "갈래", value: "④ 갈 길이 없어 건너뛴다" },
      ],
    },
    {
      title: "T7 정점 0 의 간선 셋을 완화한다",
      detail:
        "dist[0] = 0 이다. 0→1 이 3, 0→2 가 5, 0→3 이 7 을 만들고 세 칸이 Infinity 였으므로 셋 다 고쳐 적는다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "active",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 3, 2: 5, 3: 7 },
      activeEdge: { from: 0, to: 3 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "정점 0" },
        { label: "dist", value: "[0, 3, 5, 7, Infinity, Infinity]" },
        { label: "갈래", value: "⑤ 세 번 다 작아서 고쳐 적는다" },
      ],
    },
    {
      title: "T8 음수 간선이 이미 적힌 값을 줄인다",
      detail:
        "dist[1] = 3 이다. 1→2 는 3 + (-4) = -1 이라 5 보다 작아 고쳐 적는다. 1→3 은 3 + 6 = 9 이고 지금 적힌 7 보다 크므로 그대로 둔다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "active",
        2: "frontier",
        3: "frontier",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 3, 2: -1, 3: 7 },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "정점 1" },
        { label: "dist", value: "[0, 3, -1, 7, Infinity, Infinity]" },
        { label: "갈래", value: "⑤ 한 번은 고치고 한 번은 그대로" },
      ],
    },
    {
      title: "T9 줄어든 값이 다음 정점으로 이어진다",
      detail:
        "dist[2] = -1 이다. 2→3 은 -1 + 2 = 1 이고 지금 적힌 7 보다 작아 고쳐 적는다. 음수 간선이 만든 값이 여기서 답으로 이어진다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "active",
        3: "frontier",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 3, 2: -1, 3: 1 },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "정점 2" },
        { label: "dist", value: "[0, 3, -1, 1, Infinity, Infinity]" },
        { label: "갈래", value: "⑤ 작아서 고쳐 적는다" },
      ],
    },
    {
      title: "T10 줄의 마지막 정점을 처리하고 끝난다",
      detail:
        "정점 3 은 나가는 간선이 없어 완화할 것이 없다. 줄을 다 읽었으므로 거리 배열을 그대로 돌려준다.",
      nodes: [
        { id: 4, x: 10, y: 8 },
        { id: 0, x: 12, y: 44 },
        { id: 1, x: 44, y: 18 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 80, y: 46 },
        { id: 5, x: 90, y: 90 },
      ],
      edges: [
        { from: 4, to: 0, weight: 2, directed: true },
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 5, directed: true },
        { from: 0, to: 3, weight: 7, directed: true },
        { from: 1, to: 2, weight: -4, directed: true },
        { from: 1, to: 3, weight: 6, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 3, 2: -1, 3: 1 },
      entries: [
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "줄", value: "[4, 5, 0, 1, 2, 3]" },
        { label: "처리 중", value: "정점 3" },
        { label: "dist", value: "[0, 3, -1, 1, Infinity, Infinity]" },
        { label: "갈래", value: "— 나가는 간선이 없다" },
      ],
    },
  ] satisfies Frame[],
};
