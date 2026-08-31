import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`graph-flow` 카테고리의 첫 편이라 `graph` 뷰를 「덩어리」에 쓰는 규약을 여기서 정한다.**
 * 앞선 편들(`dijkstra`·`topologicalSort`·`dagShortestPath`)은 이 뷰로 **탐색의 진행**을
 * 그렸다 — 어디까지 갔는가가 상태였다. 여기서는 지나가는 것이 없고 **정점이 어느 덩어리에
 * 속하는가**가 상태다. 그래서 다섯을 새로 정한다.
 *
 * 1. **`nodeStatus` 는 한 축이다** — 「이 정점이 지금 무엇인가」. 값 넷을 겹치지 않게 나눈다.
 *    `default` 아직 아무 간선에도 안 묶여 혼자다 · `visited` 덩어리에 묶였고 대표가 아니다 ·
 *    `frontier` 덩어리에 묶였고 그 덩어리의 대표다 · `active` 지금 보고 있는 간선의 두 끝점
 *    (앞의 셋을 덮는다). 축을 둘로 쓰면 같은 색이 프레임마다 다른 뜻을 갖는다 —
 *    `dagShortestPath` 가 「줄 만들기」와 「완화」를 한 시뮬에 담으며 겪은 자리다.
 * 2. **`nodeValue` 는 `parent` 배열의 그 칸이다**(`→3` 꼴). 대표(`find` 의 결과)가 아니라
 *    **배열에 실제로 적힌 값**이다. 둘이 갈리는 순간이 이 편의 요점이라(T5 에서 경로 압축이
 *    `parent[0]` 을 1 에서 3 으로 바꾼다) 그림이 배열을 그대로 비춰야 한다. 자기 자신을
 *    가리키는 칸은 적지 않는다 — 여섯 정점이 전부 `→자기번호` 를 달고 있으면 읽을 것이 없다.
 * 3. **간선은 일곱 개를 매 프레임 전부 그린다.** `GraphFrame` 에는 간선마다의 상태가 없어서
 *    (`activeEdge` 하나뿐이다) 「고른 간선」을 선으로 가를 방법이 없다. 고른 간선의 목록은
 *    `keyValue` 패널이 지고, 그림은 **어느 정점이 어느 덩어리인가**만 진다. 이 한계를 감추지
 *    않고 적어 둔다 — 뒤의 `primMst`·`isBipartite` 가 같은 자리를 만난다.
 * 4. **`edges` 의 `weight` 를 붙인다.** 이 편은 간선을 가중치 순으로 보는 것이 절차 전체라
 *    가중치가 그림에 없으면 왜 그 간선을 지금 보는지가 사라진다.
 * 5. **프레임은 그 단계를 끝낸 뒤의 상태다.** T2 는 간선 (0,1) 을 고른 뒤이고, T5 는 건너뛰기로
 *    정한 뒤다. 앞선 편들과 같다.
 *
 * 좌표는 0~100 정규화다. **본문 그림과 같은 2×3 격자로 놓는다** — 이 입력의 간선 일곱 개가
 * 격자의 가로 넷과 세로 셋에 정확히 맞아, md 의 ascii 그림과 웹 패널이 같은 모양이 된다.
 * 무방향 그래프라 `directed` 를 붙이지 않는다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const kruskalWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "kruskalMst(6, [[3,4,6],[0,1,1],[0,3,4],[4,5,5],[2,3,2],[0,5,7],[1,2,3]])",
  result: "17",
  steps: [
    {
      title: "T1 간선을 가중치 오름차순으로 놓는다",
      detail:
        "입력에 적힌 순서는 가중치 순이 아니다. 정렬하면 (0,1)=1 · (2,3)=2 · (1,2)=3 · (0,3)=4 · (4,5)=5 · (3,4)=6 · (0,5)=7 이 된다. 아직 아무 간선도 고르지 않았고 여섯 정점이 저마다 혼자다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "default",
        1: "default",
        2: "default",
        3: "default",
        4: "default",
        5: "default",
      },
      entries: [
        { label: "지금 보는 간선", value: "—" },
        { label: "두 끝점의 대표", value: "—" },
        { label: "parent", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "rank", value: "[0, 0, 0, 0, 0, 0]" },
        { label: "고른 간선", value: "없다" },
        { label: "합계 · 고른 수", value: "0 · 0" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 간선 (0,1) 가중치 1 — 고른다",
      detail:
        "정점 0 과 1 의 대표가 0 과 1 로 다르다. 두 덩어리를 합치고 이 간선을 고른다. 두 대표의 rank 가 0 으로 같아서 한쪽을 다른 쪽에 붙이고 붙인 쪽의 rank 를 1 로 올린다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "active",
        1: "active",
        2: "default",
        3: "default",
        4: "default",
        5: "default",
      },
      nodeValue: { 0: "→1" },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "지금 보는 간선", value: "(0,1) 가중치 1" },
        { label: "두 끝점의 대표", value: "0 · 1 — 다르다" },
        { label: "parent", value: "[1, 1, 2, 3, 4, 5]" },
        { label: "rank", value: "[0, 1, 0, 0, 0, 0]" },
        { label: "고른 간선", value: "(0,1)" },
        { label: "합계 · 고른 수", value: "1 · 1" },
        { label: "분기", value: "① 합친다 · ④ rank 가 같아 하나 올린다" },
      ],
    },
    {
      title: "T3 간선 (2,3) 가중치 2 — 고른다",
      detail:
        "정점 2 와 3 도 서로 다른 덩어리다. 앞의 {0,1} 과는 아무 관계가 없다. 덩어리가 둘로 늘었고 정점 4 와 5 는 아직 혼자다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "visited",
        1: "frontier",
        2: "active",
        3: "active",
        4: "default",
        5: "default",
      },
      nodeValue: { 0: "→1", 2: "→3" },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "지금 보는 간선", value: "(2,3) 가중치 2" },
        { label: "두 끝점의 대표", value: "2 · 3 — 다르다" },
        { label: "parent", value: "[1, 1, 3, 3, 4, 5]" },
        { label: "rank", value: "[0, 1, 0, 1, 0, 0]" },
        { label: "고른 간선", value: "(0,1) (2,3)" },
        { label: "합계 · 고른 수", value: "3 · 2" },
        { label: "분기", value: "① 합친다 · ④ rank 가 같아 하나 올린다" },
      ],
    },
    {
      title: "T4 간선 (1,2) 가중치 3 — 고른다",
      detail:
        "정점 1 의 대표는 1 이고 정점 2 의 대표는 3 이다. 서로 다르므로 {0,1} 과 {2,3} 이 하나로 합쳐진다. 두 대표의 rank 가 1 로 같아 rank[3] 이 2 가 된다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "visited",
        1: "active",
        2: "active",
        3: "frontier",
        4: "default",
        5: "default",
      },
      nodeValue: { 0: "→1", 1: "→3", 2: "→3" },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "지금 보는 간선", value: "(1,2) 가중치 3" },
        { label: "두 끝점의 대표", value: "1 · 3 — 다르다" },
        { label: "parent", value: "[1, 3, 3, 3, 4, 5]" },
        { label: "rank", value: "[0, 1, 0, 2, 0, 0]" },
        { label: "고른 간선", value: "(0,1) (2,3) (1,2)" },
        { label: "합계 · 고른 수", value: "6 · 3" },
        { label: "분기", value: "① 합친다 · ④ rank 가 같아 하나 올린다" },
      ],
    },
    {
      title: "T5 간선 (0,3) 가중치 4 — 건너뛴다",
      detail:
        "정점 0 의 대표를 찾으려면 0 → 1 → 3 을 따라간다. 정점 3 의 대표도 3 이다. 둘이 같으므로 이 간선을 넣으면 사이클이 생긴다. 대표를 찾는 김에 parent[0] 을 3 으로 바꿔 다음부터는 한 칸만 읽는다 — 그림의 0 옆 표기가 →1 에서 →3 으로 바뀐 자리다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "active",
        1: "visited",
        2: "visited",
        3: "active",
        4: "default",
        5: "default",
      },
      nodeValue: { 0: "→3", 1: "→3", 2: "→3" },
      activeEdge: { from: 0, to: 3 },
      entries: [
        { label: "지금 보는 간선", value: "(0,3) 가중치 4" },
        { label: "두 끝점의 대표", value: "3 · 3 — 같다" },
        { label: "parent", value: "[3, 3, 3, 3, 4, 5]" },
        { label: "rank", value: "[0, 1, 0, 2, 0, 0]" },
        { label: "고른 간선", value: "(0,1) (2,3) (1,2)" },
        { label: "합계 · 고른 수", value: "6 · 3" },
        { label: "분기", value: "② 건너뛴다" },
      ],
    },
    {
      title: "T6 간선 (4,5) 가중치 5 — 고른다",
      detail:
        "아직 혼자였던 정점 4 와 5 가 서로 묶인다. 이 덩어리는 앞의 넷과 아직 이어져 있지 않아 고른 간선이 넷인데 덩어리는 둘이다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "frontier",
        4: "active",
        5: "active",
      },
      nodeValue: { 0: "→3", 1: "→3", 2: "→3", 4: "→5" },
      activeEdge: { from: 4, to: 5 },
      entries: [
        { label: "지금 보는 간선", value: "(4,5) 가중치 5" },
        { label: "두 끝점의 대표", value: "4 · 5 — 다르다" },
        { label: "parent", value: "[3, 3, 3, 3, 5, 5]" },
        { label: "rank", value: "[0, 1, 0, 2, 0, 1]" },
        { label: "고른 간선", value: "(0,1) (2,3) (1,2) (4,5)" },
        { label: "합계 · 고른 수", value: "11 · 4" },
        { label: "분기", value: "① 합친다 · ④ rank 가 같아 하나 올린다" },
      ],
    },
    {
      title: "T7 간선 (3,4) 가중치 6 — 고른다",
      detail:
        "정점 3 의 대표는 3(rank 2)이고 정점 4 의 대표는 5(rank 1)다. rank 가 다르므로 작은 쪽 5 를 큰 쪽 3 에 붙인다. 이때 rank 는 올리지 않는다 — 큰 쪽의 높이가 그대로이기 때문이다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "active",
        5: "visited",
      },
      nodeValue: { 0: "→3", 1: "→3", 2: "→3", 4: "→5", 5: "→3" },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "지금 보는 간선", value: "(3,4) 가중치 6" },
        { label: "두 끝점의 대표", value: "3 · 5 — 다르다" },
        { label: "parent", value: "[3, 3, 3, 3, 5, 3]" },
        { label: "rank", value: "[0, 1, 0, 2, 0, 1]" },
        { label: "고른 간선", value: "(0,1) (2,3) (1,2) (4,5) (3,4)" },
        { label: "합계 · 고른 수", value: "17 · 5" },
        { label: "분기", value: "① 합친다 · ③ rank 가 달라 낮은 쪽을 붙인다" },
      ],
    },
    {
      title: "T8 고른 간선이 다섯 개가 되어 답을 낸다",
      detail:
        "정점이 여섯이므로 신장 트리의 간선 수는 다섯이다. 그 수가 찼으므로 남은 간선 (0,5) 가중치 7 은 보지 않고 합계 17 을 반환한다. 여섯 정점이 전부 대표 3 아래 한 덩어리다.",
      nodes: [
        { id: 5, x: 16, y: 28 },
        { id: 0, x: 50, y: 28 },
        { id: 1, x: 84, y: 28 },
        { id: 4, x: 16, y: 76 },
        { id: 3, x: 50, y: 76 },
        { id: 2, x: 84, y: 76 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1 },
        { from: 2, to: 3, weight: 2 },
        { from: 1, to: 2, weight: 3 },
        { from: 0, to: 3, weight: 4 },
        { from: 4, to: 5, weight: 5 },
        { from: 3, to: 4, weight: 6 },
        { from: 0, to: 5, weight: 7 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "frontier",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: "→3", 1: "→3", 2: "→3", 4: "→5", 5: "→3" },
      entries: [
        { label: "지금 보는 간선", value: "—" },
        { label: "두 끝점의 대표", value: "—" },
        { label: "parent", value: "[3, 3, 3, 3, 5, 3]" },
        { label: "rank", value: "[0, 1, 0, 2, 0, 1]" },
        { label: "고른 간선", value: "(0,1) (2,3) (1,2) (4,5) (3,4)" },
        { label: "합계 · 고른 수", value: "17 · 5" },
        { label: "분기", value: "⑤ 다섯 개가 찼다 — 17 을 반환한다" },
      ],
    },
  ] satisfies Frame[],
};
