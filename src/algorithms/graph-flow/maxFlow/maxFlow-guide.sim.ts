import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 레벨 없음 · 레벨을 받음 · 지금 지나는 중 ·
 * 처리 끝)와 간선의 **잔여 용량**을 그리고, `keyValue` 는 그 순간의 누적 유량 · 레벨 배열 ·
 * 역방향 잔여 용량 · 분기를 적는다. 그래프 그림만으로는 **역방향 잔여 용량**이 안 보이고,
 * 이 알고리즘이 최대를 내는 이유가 바로 그것이라서 두 패널이 함께 있어야 한 프레임이 완결된다.
 * 같은 짝을 `bfsShortestPath`·`kruskalMst` 도 쓴다.
 *
 * **간선은 원래 간선 일곱 개만 그린다.** 역방향 간선을 같은 자리에 하나 더 그리면 선과 숫자가
 * 겹쳐 어느 쪽 값인지 갈리지 않는다. 역방향 잔여 용량은 `keyValue` 패널이 적고, 역방향으로
 * 지나가는 걸음(T7)은 `activeEdge` 로 그 선을 강조한 뒤 `detail` 이 방향을 밝힌다.
 *
 * 좌표는 0~100 정규화다. 소스 0 을 왼쪽 끝에, 싱크 5 를 오른쪽 끝에 두고 중간 정점 넷을
 * 위아래로 갈라 놓아 경로 두 갈래가 갈리게 했다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const maxFlowWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "maxFlow(6, [[0,1,4],[1,2,2],[2,5,2],[0,3,3],[3,2,4],[1,4,5],[4,5,3]], 0, 5)",
  result: "{ flow: 5 }",
  steps: [
    {
      title: "T1 잔여 그래프를 만든다",
      detail:
        "간선 일곱 개마다 정방향(잔여 = 용량)과 역방향(잔여 0)을 짝지어 넣는다. 누적 유량은 0 이다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 1, to: 2, weight: 2, directed: true },
        { from: 2, to: 5, weight: 2, directed: true },
        { from: 0, to: 3, weight: 3, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
        { from: 1, to: 4, weight: 5, directed: true },
        { from: 4, to: 5, weight: 3, directed: true },
      ],
      nodeStatus: { 0: "active", 5: "frontier" },
      entries: [
        { label: "누적 유량", value: "0" },
        { label: "level", value: "아직 없다" },
        { label: "역방향 잔여", value: "전부 0" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 라운드 1 — BFS 로 레벨을 매긴다",
      detail:
        "잔여 용량이 있는 간선만 지나며 소스로부터의 최단 간선 수를 적는다. 싱크의 레벨이 3 이다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 1, to: 2, weight: 2, directed: true },
        { from: 2, to: 5, weight: 2, directed: true },
        { from: 0, to: 3, weight: 3, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
        { from: 1, to: 4, weight: 5, directed: true },
        { from: 4, to: 5, weight: 3, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "frontier",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 1, 4: 2, 5: 3 },
      entries: [
        { label: "누적 유량", value: "0" },
        { label: "level", value: "[0, 1, 2, 1, 2, 3]" },
        { label: "역방향 잔여", value: "전부 0" },
        { label: "분기", value: "① 레벨을 적고 큐 뒤에 넣는다" },
      ],
    },
    {
      title: "T3 경로 0 → 1 → 2 → 5 에 2 를 흘린다",
      detail:
        "레벨이 0 → 1 → 2 → 3 으로 한 칸씩 오르는 간선만 따라간다. 병목은 min(4, 2, 2) = 2 다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 2, directed: true },
        { from: 1, to: 2, weight: 0, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 3, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
        { from: 1, to: 4, weight: 5, directed: true },
        { from: 4, to: 5, weight: 3, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "active", 2: "active", 5: "active" },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 1, 4: 2, 5: 3 },
      activeEdge: { from: 2, to: 5 },
      entries: [
        { label: "누적 유량", value: "2" },
        { label: "level", value: "[0, 1, 2, 1, 2, 3]" },
        { label: "역방향 잔여", value: "1→0 = 2 · 2→1 = 2 · 5→2 = 2" },
        { label: "분기", value: "②③④ 내려가서 싱크에 도착하고 갱신한다" },
      ],
    },
    {
      title: "T4 경로 0 → 1 → 4 → 5 에 2 를 흘린다",
      detail:
        "1 → 2 가 포화라 같은 레벨 조건을 만족하는 다음 간선 1 → 4 로 옮긴다. 병목은 min(2, 5, 3) = 2 다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 0, directed: true },
        { from: 1, to: 2, weight: 0, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 3, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
        { from: 1, to: 4, weight: 3, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "active",
        1: "active",
        2: "visited",
        4: "active",
        5: "active",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 1, 4: 2, 5: 3 },
      activeEdge: { from: 4, to: 5 },
      entries: [
        { label: "누적 유량", value: "4" },
        { label: "level", value: "[0, 1, 2, 1, 2, 3]" },
        { label: "역방향 잔여", value: "1→0 = 4 · 4→1 = 2 · 5→4 = 2" },
        { label: "분기", value: "⑤ 포화된 간선을 건너뛰고 ②③④ 로 흘린다" },
      ],
    },
    {
      title: "T5 라운드 1 의 차단 유량이 소진됐다",
      detail:
        "0 → 3 → 2 까지는 갈 수 있지만 2 의 남은 간선이 전부 조건에 안 맞아 0 이 올라온다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 0, directed: true },
        { from: 1, to: 2, weight: 0, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 3, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
        { from: 1, to: 4, weight: 3, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 1, 4: 2, 5: 3 },
      entries: [
        { label: "누적 유량", value: "4" },
        { label: "level", value: "[0, 1, 2, 1, 2, 3]" },
        { label: "역방향 잔여", value: "1→0 = 4 · 2→1 = 2 · 4→1 = 2" },
        { label: "분기", value: "⑤ 간선을 다 옮겨 0 이 올라온다" },
      ],
    },
    {
      title: "T6 라운드 2 — 레벨을 다시 매긴다",
      detail:
        "0 → 1 이 포화라 이번에는 0 → 3 → 2 로 들어가고, 역방향 잔여 2 → 1 을 지나 1 에 레벨 3 이 붙는다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 0, directed: true },
        { from: 1, to: 2, weight: 0, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 3, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
        { from: 1, to: 4, weight: 3, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "frontier",
        5: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 2, 3: 1, 4: 4, 5: 5 },
      entries: [
        { label: "누적 유량", value: "4" },
        { label: "level", value: "[0, 3, 2, 1, 4, 5]" },
        { label: "역방향 잔여", value: "2→1 = 2 로 레벨이 이어진다" },
        { label: "분기", value: "① 역방향 간선에도 레벨을 적는다" },
      ],
    },
    {
      title: "T7 경로 0 → 3 → 2 → 1 → 4 → 5 에 1 을 흘린다",
      detail:
        "2 → 1 은 역방향 간선이다 — 라운드 1 에서 1 → 2 로 보낸 2 중 1 을 되돌려 4 쪽으로 보낸다. 병목은 min(3, 4, 2, 3, 1) = 1 이다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 0, directed: true },
        { from: 1, to: 2, weight: 1, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 2, directed: true },
        { from: 3, to: 2, weight: 3, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 0, directed: true },
      ],
      nodeStatus: {
        0: "active",
        1: "active",
        2: "active",
        3: "active",
        4: "active",
        5: "active",
      },
      nodeValue: { 0: 0, 1: 3, 2: 2, 3: 1, 4: 4, 5: 5 },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "누적 유량", value: "5" },
        { label: "level", value: "[0, 3, 2, 1, 4, 5]" },
        { label: "역방향 잔여", value: "2→1 = 1 로 줄고 1→2 = 1 이 살아난다" },
        { label: "분기", value: "②③④ 역방향 간선으로 내려간다" },
      ],
    },
    {
      title: "T8 라운드 2 의 차단 유량이 소진됐다",
      detail: "4 → 5 가 포화라 같은 레벨 배치로는 더 갈 수 없다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 0, directed: true },
        { from: 1, to: 2, weight: 1, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 2, directed: true },
        { from: 3, to: 2, weight: 3, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 0, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 3, 2: 2, 3: 1, 4: 4, 5: 5 },
      entries: [
        { label: "누적 유량", value: "5" },
        { label: "level", value: "[0, 3, 2, 1, 4, 5]" },
        { label: "역방향 잔여", value: "2→1 = 1 · 5→4 = 3 · 5→2 = 2" },
        { label: "분기", value: "⑤ 간선을 다 옮겨 0 이 올라온다" },
      ],
    },
    {
      title: "T9 라운드 3 — BFS 가 싱크에 레벨을 못 적는다",
      detail:
        "싱크로 들어가는 두 간선 2 → 5 와 4 → 5 가 둘 다 포화다. level[5] 가 -1 이라 반복이 끝난다.",
      nodes: [
        { id: 0, x: 6, y: 48 },
        { id: 1, x: 32, y: 20 },
        { id: 2, x: 60, y: 58 },
        { id: 3, x: 30, y: 80 },
        { id: 4, x: 62, y: 10 },
        { id: 5, x: 92, y: 36 },
      ],
      edges: [
        { from: 0, to: 1, weight: 0, directed: true },
        { from: 1, to: 2, weight: 1, directed: true },
        { from: 2, to: 5, weight: 0, directed: true },
        { from: 0, to: 3, weight: 2, directed: true },
        { from: 3, to: 2, weight: 3, directed: true },
        { from: 1, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 0, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "default",
      },
      nodeValue: { 0: 0, 1: 3, 2: 2, 3: 1, 4: 4, 5: -1 },
      entries: [
        { label: "누적 유량", value: "5" },
        { label: "level", value: "[0, 3, 2, 1, 4, -1]" },
        { label: "도달한 정점", value: "{0, 1, 2, 3, 4}" },
        { label: "분기", value: "⑥ level[5] 가 -1 이라 반복을 끝낸다" },
      ],
    },
  ] satisfies Frame[],
};
