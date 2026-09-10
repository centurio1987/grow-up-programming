import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)와 같다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 표시된 정점과 지금 확인하는 이웃을 그리고, `keyValue` 는 그
 * 순간의 스택 · `from` 배열 · 표시된 정점 · 갈래를 적는다. 무향 간선은 양쪽에서 걸어갈 수
 * 있어서 **어느 방향으로 확인하는 중인지**가 그림만으로는 안 보이고, 이 절차가 건너뛰는
 * 이웃을 정하는 근거가 바로 그 방향이라 두 패널이 함께 있어야 한 프레임이 완결된다.
 *
 * 상태는 `nodeStatus` 로 옮긴다 — 표시하지 않은 정점은 `default`(적지 않는다), 표시했고
 * 스택에 남아 있는 정점은 `frontier`, 지금 이웃을 확인하고 있는 정점은 `active`, 스택에서
 * 꺼내 확인을 마친 정점은 `visited` 다. `nodeValue` 는 **그 정점을 표시하게 한 이웃**
 * (`from` 값)이고 시작 정점에는 `시작` 을 붙인다.
 *
 * 좌표는 0~100 정규화다. **간선에 방향이 없으므로 `directed` 를 붙이지 않는다.**
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const undirectedWalk = {
  view: ["graph", "keyValue"] as const,
  title: "undirectedCycleDetection(6, [[0,1],[1,2],[3,4],[4,5],[5,3]])",
  result: "true",
  steps: [
    {
      title: "T1 정점 0 을 표시하고 스택에 넣는다",
      detail:
        "바깥 반복이 표시되지 않은 첫 정점 0 을 잡았다. 표시는 스택에 넣는 자리에서 한다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: "시작" },
      entries: [
        { label: "스택 (아래→위)", value: "[0]" },
        { label: "from (짝지은 이웃)", value: "[시작]" },
        { label: "지금 확인하는 이웃", value: "—" },
        { label: "표시된 정점", value: "0" },
        { label: "갈래", value: "—" },
      ],
    },
    {
      title: "T2 정점 0 의 이웃 1 을 확인한다",
      detail:
        "0 을 꺼내 이웃 목록 [1] 을 확인한다. 1 은 표시되지 않았으므로 표시하고 스택에 넣는다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: { 0: "active", 1: "frontier" },
      nodeValue: { 0: "시작", 1: 0 },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "스택 (아래→위)", value: "[1]" },
        { label: "from (짝지은 이웃)", value: "[0]" },
        { label: "지금 확인하는 이웃", value: "0 의 이웃 1" },
        { label: "표시된 정점", value: "0 · 1" },
        { label: "갈래", value: "③ 처음 보는 정점이라 표시하고 넣는다" },
      ],
    },
    {
      title: "T3 정점 1 의 이웃 0 을 확인한다 — 지나온 이웃이다",
      detail:
        "1 을 꺼냈다. from 이 0 이므로 이웃 목록 [0, 2] 의 첫 이웃 0 은 지나온 이웃이고, 그리로 돌아가는 것은 사이클이 아니라 왔던 간선이다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: { 0: "visited", 1: "active" },
      nodeValue: { 0: "시작", 1: 0 },
      activeEdge: { from: 1, to: 0 },
      entries: [
        { label: "스택 (아래→위)", value: "[]" },
        { label: "from (짝지은 이웃)", value: "[]" },
        { label: "지금 확인하는 이웃", value: "1 의 이웃 0" },
        { label: "표시된 정점", value: "0 · 1" },
        { label: "갈래", value: "① 지나온 이웃이라 건너뛴다" },
      ],
    },
    {
      title: "T4 정점 1 의 이웃 2 를 확인한다",
      detail:
        "같은 자리에서 목록의 다음 이웃 2 를 확인한다. 표시되지 않았으므로 표시하고 스택에 넣는다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "frontier" },
      nodeValue: { 0: "시작", 1: 0, 2: 1 },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "스택 (아래→위)", value: "[2]" },
        { label: "from (짝지은 이웃)", value: "[1]" },
        { label: "지금 확인하는 이웃", value: "1 의 이웃 2" },
        { label: "표시된 정점", value: "0 · 1 · 2" },
        { label: "갈래", value: "③ 처음 보는 정점이라 표시하고 넣는다" },
      ],
    },
    {
      title: "T5 정점 2 의 이웃 1 을 확인한다 — 스택이 빈다",
      detail:
        "2 를 꺼냈다. 이웃은 1 하나이고 그것이 지나온 이웃이라 건너뛴다. 스택이 비어 이 덩어리가 끝났고, 여기까지 사이클이 없다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "active" },
      nodeValue: { 0: "시작", 1: 0, 2: 1 },
      activeEdge: { from: 2, to: 1 },
      entries: [
        { label: "스택 (아래→위)", value: "[]" },
        { label: "from (짝지은 이웃)", value: "[]" },
        { label: "지금 확인하는 이웃", value: "2 의 이웃 1" },
        { label: "표시된 정점", value: "0 · 1 · 2" },
        { label: "갈래", value: "① 지나온 이웃이라 건너뛴다" },
      ],
    },
    {
      title: "T6 표시되지 않은 정점 3 에서 다시 시작한다",
      detail:
        "바깥 반복이 1 과 2 를 표시돼 있다고 넘기고 3 을 잡는다. 정점 3·4·5 는 0 에서 걸어갈 수 없는 다른 덩어리다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "frontier",
      },
      nodeValue: { 0: "시작", 1: 0, 2: 1, 3: "시작" },
      entries: [
        { label: "스택 (아래→위)", value: "[3]" },
        { label: "from (짝지은 이웃)", value: "[시작]" },
        { label: "지금 확인하는 이웃", value: "—" },
        { label: "표시된 정점", value: "0 · 1 · 2 · 3" },
        { label: "갈래", value: "—" },
      ],
    },
    {
      title: "T7 정점 3 의 이웃 4 를 확인한다",
      detail:
        "3 을 꺼내 이웃 목록 [4, 5] 를 확인한다. 첫 이웃 4 는 표시되지 않았으므로 표시하고 스택에 넣는다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
      },
      nodeValue: { 0: "시작", 1: 0, 2: 1, 3: "시작", 4: 3 },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "스택 (아래→위)", value: "[4]" },
        { label: "from (짝지은 이웃)", value: "[3]" },
        { label: "지금 확인하는 이웃", value: "3 의 이웃 4" },
        { label: "표시된 정점", value: "0 · 1 · 2 · 3 · 4" },
        { label: "갈래", value: "③ 처음 보는 정점이라 표시하고 넣는다" },
      ],
    },
    {
      title: "T8 정점 3 의 이웃 5 를 확인한다",
      detail:
        "같은 자리에서 목록의 다음 이웃 5 를 확인한다. 5 도 표시되지 않았으므로 표시하고 스택에 넣는다. 이제 스택에 4 와 5 가 함께 있다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
        5: "frontier",
      },
      nodeValue: { 0: "시작", 1: 0, 2: 1, 3: "시작", 4: 3, 5: 3 },
      activeEdge: { from: 3, to: 5 },
      entries: [
        { label: "스택 (아래→위)", value: "[4, 5]" },
        { label: "from (짝지은 이웃)", value: "[3, 3]" },
        { label: "지금 확인하는 이웃", value: "3 의 이웃 5" },
        { label: "표시된 정점", value: "0 · 1 · 2 · 3 · 4 · 5" },
        { label: "갈래", value: "③ 처음 보는 정점이라 표시하고 넣는다" },
      ],
    },
    {
      title: "T9 정점 5 의 이웃 4 를 확인한다 — 사이클이다",
      detail:
        "5 를 꺼냈다. from 이 3 이라 이웃 4 는 지나온 이웃이 아닌데 이미 표시돼 있다. 4 까지 가는 길이 3 을 거치는 것 말고 하나 더 있다는 뜻이라 true 를 반환한다.",
      nodes: [
        { id: 0, x: 12, y: 18 },
        { id: 1, x: 44, y: 10 },
        { id: 2, x: 76, y: 18 },
        { id: 3, x: 20, y: 62 },
        { id: 4, x: 46, y: 92 },
        { id: 5, x: 72, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
        { from: 5, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "frontier",
        5: "active",
      },
      nodeValue: { 0: "시작", 1: 0, 2: 1, 3: "시작", 4: 3, 5: 3 },
      activeEdge: { from: 5, to: 4 },
      entries: [
        { label: "스택 (아래→위)", value: "[4]" },
        { label: "from (짝지은 이웃)", value: "[3]" },
        { label: "지금 확인하는 이웃", value: "5 의 이웃 4" },
        { label: "표시된 정점", value: "0 · 1 · 2 · 3 · 4 · 5" },
        { label: "갈래", value: "② 표시된 정점이라 true 를 반환한다" },
      ],
    },
  ] satisfies Frame[],
};
