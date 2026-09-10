import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)와 같다 — P3 이 그 관계를 잰다.
 *
 * ## 뷰를 `graph` + `priorityQueue` 로 짝지은 이유
 *
 * `dijkstra` 편이 같은 짝을 먼저 썼고 그 선례를 그대로 따른다. 다른 것은 **큐 항목의 키**다.
 * 거기서는 키가 곧 그 정점까지의 비용이었는데, 여기서는 **비용에 남은 비용의 추정값을 더한
 * 값**이다. 그래서 이 패널은 세 가지를 답한다 — ① 큐에 무엇이 들어 있는가 ② 그 항목의 키가
 * 얼마인가 ③ 다음에 무엇이 나오는가.
 *
 * 1. **`heap` 은 정렬한 목록이 아니라 배열의 실제 순서다.** `PriorityQueueView` 가
 *    *"배열 순서대로의 힙 원소. key 기준 정렬은 시각화하지 않고 그대로 그린다"* 로 정의돼
 *    있고(`src/_guide-sim/index.tsx`), 그 정의를 그대로 따른다. T7 에서 자리 0 의 키가 14 이고
 *    자리 2 의 키가 16 인 것이 그 자리다.
 * 2. **`highlight: [0]`** — 자리 0 하나만 강조한다. 배열 순서로 그렸기 때문에 「앞에서
 *    꺼낸다」가 자명하지 않다. 큐가 비면 강조도 없다.
 * 3. **`label` 은 정점, `key` 는 그때의 `f` 값이다.** 같은 정점이 키를 달리해 두 번 들어가는
 *    것이 이 절차의 요점(뒤처진 기록)이라 라벨이 겹쳐 보이는 것을 감추지 않는다. T5·T6·T7 에서
 *    `정점 3` 이 둘로 보이는 것이 그 자리이고, T8 이 그중 하나를 버린다.
 *
 * **`nodeValue` 는 `g` 값이다.** 화면에 셋(`g`·`h`·`f`)을 다 적으면 어느 것이 순서를 정하는지
 * 흐려져서, 정점에는 지금까지의 비용만 적고 키는 큐 패널이 진다. `h` 는 정점마다 고정이라
 * 프레임에 실을 값이 아니고 원고의 표가 한 번에 보인다.
 *
 * 좌표는 0~100 정규화다. 원고 그림의 좌표를 그대로 옮겼다 — `x` 는 왼쪽에서 오른쪽으로,
 * `y` 는 위로 갈수록 작아진다. 목표 정점 6 을 오른쪽 끝에 두고, 목표와 반대쪽으로 떨어져 있는
 * 정점 7 을 왼쪽 위에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const aStarWalk = {
  view: ["graph", "priorityQueue"] as const,
  title:
    "aStarSearch(8, [[0,1,3],[0,2,4],[0,7,5],[1,4,2],[2,3,7],[4,3,3],[3,5,2],[5,6,6]], 0, 6, 맨해튼)",
  result: "16",
  steps: [
    {
      title: "T1 시작값",
      detail:
        "비용 배열을 전부 Infinity 로 두고 g[0] = 0 만 적는다. 큐에는 항목 (정점 0, g=0, f=0+8=8) 하나가 들어간다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0 },
      heap: [{ label: "정점 0", key: 8 }],
      highlight: [0],
    },
    {
      title: "T2 정점 0 을 꺼낸다",
      detail:
        "키 8 이 큐에서 가장 작다. 나가는 간선 셋을 완화해 g[1] = 3 · g[2] = 4 · g[7] = 5 를 적고 항목 셋을 넣는다. 키는 각각 3+7=10 · 4+5=9 · 5+13=18 이다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "frontier", 2: "frontier", 7: "frontier" },
      nodeValue: { 0: 0, 1: 3, 2: 4, 7: 5 },
      activeEdge: { from: 0, to: 7 },
      heap: [
        { label: "정점 2", key: 9 },
        { label: "정점 1", key: 10 },
        { label: "정점 7", key: 18 },
      ],
      highlight: [0],
    },
    {
      title: "T3 정점 2 를 꺼낸다",
      detail:
        "키 9 가 가장 작다. 정점 7 은 비용이 5 로 더 작지만 키가 18 이라 뒤로 밀린다. 2→3 이 g[3] = 11 을 처음 적고 키 11+3=14 로 넣는다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "frontier",
        2: "active",
        3: "frontier",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 11, 7: 5 },
      activeEdge: { from: 2, to: 3 },
      heap: [
        { label: "정점 1", key: 10 },
        { label: "정점 7", key: 18 },
        { label: "정점 3", key: 14 },
      ],
      highlight: [0],
    },
    {
      title: "T4 정점 1 을 꺼낸다",
      detail:
        "키 10 이 가장 작다. 1→4 가 g[4] = 5 를 처음 적고 키 5+5=10 으로 넣는다. 정점 4 는 비용이 5 인데 추정도 5 라 키가 10 이다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "active",
        2: "visited",
        3: "frontier",
        4: "frontier",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 11, 4: 5, 7: 5 },
      activeEdge: { from: 1, to: 4 },
      heap: [
        { label: "정점 4", key: 10 },
        { label: "정점 7", key: 18 },
        { label: "정점 3", key: 14 },
      ],
      highlight: [0],
    },
    {
      title: "T5 정점 4 를 꺼낸다",
      detail:
        "키 10 이 가장 작다. 4→3 이 5+3 = 8 로 g[3] = 11 을 8 로 줄이고 키 8+3=11 로 다시 넣는다. 이제 정점 3 짜리 항목이 키 11 과 키 14 로 둘이다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "frontier",
        4: "active",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 8, 4: 5, 7: 5 },
      activeEdge: { from: 4, to: 3 },
      heap: [
        { label: "정점 3", key: 11 },
        { label: "정점 7", key: 18 },
        { label: "정점 3", key: 14 },
      ],
      highlight: [0],
    },
    {
      title: "T6 정점 3 을 꺼낸다",
      detail:
        "키 11 짜리 항목이 나온다. 넣을 때의 비용 8 이 지금 적힌 g[3] = 8 과 같으므로 뒤처진 기록이 아니다. 3→5 가 g[5] = 10 을 처음 적고 키 10+2=12 로 넣는다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "visited",
        5: "frontier",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 8, 4: 5, 5: 10, 7: 5 },
      activeEdge: { from: 3, to: 5 },
      heap: [
        { label: "정점 5", key: 12 },
        { label: "정점 7", key: 18 },
        { label: "정점 3", key: 14 },
      ],
      highlight: [0],
    },
    {
      title: "T7 정점 5 를 꺼낸다",
      detail:
        "키 12 가 가장 작다. 5→6 이 g[6] = 16 을 처음 적고 키 16+0=16 으로 넣는다. 목표 정점의 추정은 0 이라 키가 비용과 같다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "active",
        6: "frontier",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 8, 4: 5, 5: 10, 6: 16, 7: 5 },
      activeEdge: { from: 5, to: 6 },
      heap: [
        { label: "정점 3", key: 14 },
        { label: "정점 7", key: 18 },
        { label: "정점 6", key: 16 },
      ],
      highlight: [0],
    },
    {
      title: "T8 정점 3 을 다시 꺼낸다",
      detail:
        "키 14 짜리 항목이다. 넣을 때의 비용 11 이 지금 적힌 g[3] = 8 보다 크다. T3 이 넣어 둔 뒤처진 기록이므로 이웃을 하나도 보지 않고 버린다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "visited",
        5: "visited",
        6: "frontier",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 8, 4: 5, 5: 10, 6: 16, 7: 5 },
      heap: [
        { label: "정점 6", key: 16 },
        { label: "정점 7", key: 18 },
      ],
      highlight: [0],
    },
    {
      title: "T9 정점 6 을 꺼낸다",
      detail:
        "키 16 이 가장 작다. 꺼낸 정점이 목표라 그 자리에서 16 을 반환한다. 큐에는 정점 7 짜리 항목이 키 18 로 남아 있고, 그 정점은 한 번도 안 꺼낸다.",
      nodes: [
        { id: 0, x: 8, y: 78 },
        { id: 1, x: 29, y: 65 },
        { id: 2, x: 39, y: 78 },
        { id: 3, x: 61, y: 78 },
        { id: 4, x: 50, y: 65 },
        { id: 5, x: 71, y: 78 },
        { id: 6, x: 92, y: 78 },
        { id: 7, x: 8, y: 13 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 4, directed: true },
        { from: 0, to: 7, weight: 5, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 2, to: 3, weight: 7, directed: true },
        { from: 4, to: 3, weight: 3, directed: true },
        { from: 3, to: 5, weight: 2, directed: true },
        { from: 5, to: 6, weight: 6, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
        6: "active",
        7: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 8, 4: 5, 5: 10, 6: 16, 7: 5 },
      heap: [{ label: "정점 7", key: 18 }],
      highlight: [0],
    },
  ] satisfies Frame[],
};
