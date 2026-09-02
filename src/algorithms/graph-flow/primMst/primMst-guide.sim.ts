import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * ## 앞선 두 편의 규약을 각각 물려받고, 갈리는 자리 셋을 여기서 정한다
 *
 * `graph` 뷰의 「덩어리」 규약은 `kruskalMst-guide.sim.ts` 가, `priorityQueue` 뷰의 규약은
 * `dijkstra-guide.sim.ts` 가 세웠다. 이 편은 둘을 함께 쓰는 첫 편이라 갈리는 자리만 정한다.
 *
 * 1. **`nodeStatus` 는 한 축이다** — 「이 정점이 지금 무엇인가」. 값 넷을 겹치지 않게 나눈다.
 *    `default` 큐에 후보조차 없다 · `frontier` 큐에 후보가 있고 아직 트리 밖이다 ·
 *    `visited` 트리에 들어갔다 · `active` 이번 걸음에 큐에서 꺼낸 정점(앞의 셋을 덮는다).
 *    `kruskalMst` 는 같은 네 값을 「덩어리와 대표」로 나눴는데 여기서는 나눌 덩어리가 하나뿐
 *    이라(트리) 그 축이 「트리 안인가 · 후보인가」가 된다.
 * 2. **`nodeValue` 는 그 정점이 지금 달고 있는 키다.** 트리에 든 정점이면 **트리에 넣을 때
 *    치른 값**이고, 트리 밖이면 **큐에 있는 그 정점짜리 항목 중 가장 작은 키**다. 둘을 한
 *    칸에 적는 것은 값의 뜻이 편입 전후로 바뀌기 때문이 아니라 **바뀌지 않기 때문**이다 —
 *    편입 순간에 그 키가 그대로 합계에 더해진다. `dijkstra` 의 `nodeValue`(거리)와 다른
 *    자리라 여기 적어 둔다. 후보가 없는 정점은 칸을 비운다.
 * 3. **`activeEdge` 는 이번에 꺼낸 항목이 온 간선이다.** 편입한 걸음에서는 트리에 새로 들어간
 *    간선이고(T3·T4·T5·T7·T8), **지나간 후보를 버린 걸음(T6)에서도 그 항목이 온 간선을
 *    그린다** — 버려지는 것이 「간선 (0,3)=4」라는 것이 이 걸음의 요점이다. 첫 정점을 넣는
 *    T2 에는 간선이 없어 붙이지 않는다.
 *
 * **`heap` 은 정렬한 목록이 아니라 배열의 실제 순서다**(`dijkstra` 규약 1). 값은
 * `primMst-guide.proof.ts` 의 `byHeap` 이 정본과 같은 절차로 낸 것이다. `highlight: [0]` 이
 * 다음에 꺼낼 자리이고, **T8 에는 강조가 없다** — 여섯 정점이 다 찼으므로 남은 항목
 * `5(7)` 은 꺼내지 않고 끝난다.
 *
 * 좌표는 0~100 정규화다. **`kruskalMst` 편과 같은 2×3 격자로 놓는다** — 같은 그래프이고, 두
 * 편의 그림이 같은 모양이라야 「같은 트리를 다른 순서로 만든다」가 그림에서 확인된다.
 * 무방향 그래프라 `directed` 를 붙이지 않는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const primWalk = {
  view: ["graph", "priorityQueue"] as const,
  title:
    "primMst(6, [[0,1,1],[0,3,4],[0,5,7],[1,2,3],[2,3,2],[3,4,6],[4,5,5]])",
  result: "17",
  steps: [
    {
      title: "T1 시작값",
      detail:
        "간선 목록을 이웃 목록으로 바꾸고, 정점 0 을 비용 0 짜리 항목으로 큐에 넣는다. 트리에 든 정점은 아직 없고 합계는 0 이다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "frontier",
        1: "default",
        2: "default",
        3: "default",
        4: "default",
        5: "default",
      },
      nodeValue: { 0: 0 },
      heap: [{ label: "정점 0", key: 0 }],
      highlight: [0],
    },
    {
      title: "T2 항목 0(0) 을 꺼낸다 — 정점 0 을 트리에 넣는다",
      detail:
        "트리의 첫 정점이라 치르는 값이 0 이다. 정점 0 의 이웃 셋이 전부 트리 밖이므로 후보 셋을 넣는다 — 정점 1 에 키 1, 정점 3 에 키 4, 정점 5 에 키 7. 합계 0, 트리 안 정점 1 개.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "active",
        1: "frontier",
        2: "default",
        3: "frontier",
        4: "default",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 3: 4, 5: 7 },
      heap: [
        { label: "정점 1", key: 1 },
        { label: "정점 3", key: 4 },
        { label: "정점 5", key: 7 },
      ],
      highlight: [0],
    },
    {
      title: "T3 항목 1(1) 을 꺼낸다 — 간선 (0,1)=1 로 정점 1 을 넣는다",
      detail:
        "키 1 이 큐에서 가장 작다. 정점 1 이 아직 트리 밖이므로 트리에 넣고 합계에 1 을 더한다. 정점 1 의 이웃 중 트리 밖인 것은 정점 2 하나라 키 3 짜리 항목을 넣는다. 합계 1, 트리 안 정점 2 개.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "active",
        2: "frontier",
        3: "frontier",
        4: "default",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 2: 3, 3: 4, 5: 7 },
      activeEdge: { from: 0, to: 1 },
      heap: [
        { label: "정점 2", key: 3 },
        { label: "정점 5", key: 7 },
        { label: "정점 3", key: 4 },
      ],
      highlight: [0],
    },
    {
      title: "T4 항목 2(3) 을 꺼낸다 — 간선 (1,2)=3 으로 정점 2 를 넣는다",
      detail:
        "큐의 키 셋은 3 · 7 · 4 이고 그중 3 이 가장 작다. 정점 2 를 넣고 합계에 3 을 더한다. 정점 2 의 이웃 중 트리 밖인 것은 정점 3 이고 그 간선의 가중치가 2 라, 정점 3 짜리 항목이 키 4 와 키 2 로 둘이 된다. 합계 4, 트리 안 정점 3 개.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "active",
        3: "frontier",
        4: "default",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 2: 3, 3: 2, 5: 7 },
      activeEdge: { from: 1, to: 2 },
      heap: [
        { label: "정점 3", key: 2 },
        { label: "정점 5", key: 7 },
        { label: "정점 3", key: 4 },
      ],
      highlight: [0],
    },
    {
      title: "T5 항목 3(2) 를 꺼낸다 — 간선 (2,3)=2 로 정점 3 을 넣는다",
      detail:
        "정점 3 짜리 항목 둘 중 키가 작은 2 가 먼저 나온다. 정점 3 을 넣고 합계에 2 를 더한다. 정점 3 의 이웃 중 트리 밖인 것은 정점 4 이고 키 6 짜리 항목을 넣는다. 큐에는 키 4 짜리 정점 3 항목이 그대로 남아 있다. 합계 6, 트리 안 정점 4 개.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 2: 3, 3: 2, 4: 6, 5: 7 },
      activeEdge: { from: 2, to: 3 },
      heap: [
        { label: "정점 3", key: 4 },
        { label: "정점 5", key: 7 },
        { label: "정점 4", key: 6 },
      ],
      highlight: [0],
    },
    {
      title: "T6 항목 3(4) 를 꺼낸다 — 지나간 후보라 버린다",
      detail:
        "이 항목은 T2 에서 간선 (0,3)=4 를 보고 넣어 둔 것이다. 그런데 정점 3 은 T5 에서 이미 더 가벼운 간선 (2,3)=2 로 트리에 들어갔다. 트리에 든 정점이므로 이 항목은 버리고 이웃도 보지 않는다. 합계와 트리 안 정점 수가 그대로다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 2: 3, 3: 2, 4: 6, 5: 7 },
      activeEdge: { from: 0, to: 3 },
      heap: [
        { label: "정점 4", key: 6 },
        { label: "정점 5", key: 7 },
      ],
      highlight: [0],
    },
    {
      title: "T7 항목 4(6) 을 꺼낸다 — 간선 (3,4)=6 으로 정점 4 를 넣는다",
      detail:
        "남은 두 항목의 키가 6 과 7 이라 6 이 먼저 나온다. 정점 4 를 넣고 합계에 6 을 더한다. 정점 4 의 이웃 중 트리 밖인 것은 정점 5 이고 그 간선의 가중치가 5 라, 정점 5 짜리 항목이 키 7 과 키 5 로 둘이 된다. 합계 12, 트리 안 정점 5 개.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "active",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 2: 3, 3: 2, 4: 6, 5: 5 },
      activeEdge: { from: 3, to: 4 },
      heap: [
        { label: "정점 5", key: 5 },
        { label: "정점 5", key: 7 },
      ],
      highlight: [0],
    },
    {
      title: "T8 항목 5(5) 를 꺼낸다 — 여섯 정점이 다 찼다",
      detail:
        "간선 (4,5)=5 로 정점 5 를 넣고 합계가 17 이 된다. 트리 안 정점이 여섯이 되어 큐에 남은 항목 5(7) 은 꺼내지 않고 17 을 돌려준다. 고른 다섯 간선은 (0,1)=1 · (1,2)=3 · (2,3)=2 · (3,4)=6 · (4,5)=5 다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 5, to: 0, weight: 7 },
        { from: 0, to: 1, weight: 1 },
        { from: 4, to: 3, weight: 6 },
        { from: 3, to: 2, weight: 2 },
        { from: 5, to: 4, weight: 5 },
        { from: 0, to: 3, weight: 4 },
        { from: 1, to: 2, weight: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "active",
      },
      nodeValue: { 0: 0, 1: 1, 2: 3, 3: 2, 4: 6, 5: 5 },
      activeEdge: { from: 4, to: 5 },
      heap: [{ label: "정점 5", key: 7 }],
    },
  ] satisfies Frame[],
};
