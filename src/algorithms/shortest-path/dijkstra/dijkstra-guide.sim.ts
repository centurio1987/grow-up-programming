import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * ## `priorityQueue` 뷰의 첫 사용 — 프레임을 이렇게 설계했다
 *
 * 이 저장소에서 선 뷰는 `array`·`keyValue`·`graph`·`matrix` 넷뿐이었다. `priorityQueue` 는
 * 여기가 처음이라 선례가 없어, 이 편이 그 자리를 정한다. 뒤에 오는 `primMst`·
 * `medianFromDataStream` 이 이 파일을 본보기로 삼는다.
 *
 * **한 프레임이 답해야 하는 것은 둘이다** — ① 큐에 지금 무엇이 들어 있는가 ② 다음에 무엇이
 * 나오는가. 셋을 그렇게 맞췄다.
 *
 * 1. **`heap` 은 정렬한 목록이 아니라 배열의 실제 순서다.** `PriorityQueueView` 가
 *    *"배열 순서대로의 힙 원소. key 기준 정렬은 시각화하지 않고 그대로 그린다"* 로 정의돼
 *    있고(`src/_guide-sim/index.tsx`), 그 정의를 그대로 따른다. 정렬해 그리면 「키가 가장
 *    작은 것이 앞에 온다」가 그림의 성질이 되어 버려서, 힙이 **왜** 그 순서를 만드는지가
 *    사라진다. 값은 `dijkstra-guide.proof.ts` 의 `trace()` 가 정본과 같은 절차로 낸 것이다.
 * 2. **`highlight: [0]`** — 자리 0 하나만 강조한다. 그것이 다음에 나올 항목이라는 것이
 *    이 뷰가 답해야 하는 두 번째 질문이고, 배열 순서로 그렸기 때문에 「앞에서 꺼낸다」가
 *    자명하지 않다. 큐가 비면 강조도 없다.
 * 3. **`label` 은 정점, `key` 는 그때 적힌 거리다.** 같은 정점이 키를 달리해 여러 번
 *    들어가는 것이 이 알고리즘의 요점(뒤처진 기록)이라, 라벨이 겹쳐 보이는 것을 감추지 않는다.
 *    T3·T4 에서 `정점 1` 이 둘, T4·T5 에서 `정점 3` 이 둘로 보이는 것이 그 자리다. 원고는
 *    같은 항목을 `(1, 3)` 처럼 (정점, 키) 한 쌍으로 적고, 이 패널은 그것을 두 조각으로 그린다.
 *
 * **`graph` 와 짝지은 이유.** 큐만 보면 그 키가 그래프의 어느 자리에서 나왔는지 안 보이고,
 * 그래프만 보면 다음에 무엇이 확정되는지가 안 보인다. `bfsShortestPath` 가 같은 이유로
 * `graph` + `keyValue` 를 썼는데, 여기서는 그 `keyValue` 자리를 `priorityQueue` 가 대신한다 —
 * 적어야 할 상태가 「큐의 내용」 하나로 모여 있어서 표 대신 큐 자체를 그리는 편이 짧다.
 * 그래서 `dist` 배열과 갈래 번호는 프레임의 `detail` 이 문장으로 진다.
 *
 * 좌표는 0~100 정규화다. 정점 0 을 왼쪽에 두고 0 → 2 → 1 → 3 → 4 가 시계 방향으로 돌아가게
 * 놓아 최단 경로가 한 줄로 이어져 보이게 했고, 간선이 하나도 없는 정점 5 는 오른쪽 아래에
 * 떨어뜨려 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const dijkstraWalk = {
  view: ["graph", "priorityQueue"] as const,
  title:
    "dijkstra(6, [[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5],[3,4,3],[4,1,7]], 0)",
  result: "[0, 3, 1, 4, 7, Infinity]",
  steps: [
    {
      title: "T1 시작값",
      detail:
        "거리 배열을 전부 Infinity 로 두고 dist[0] = 0 만 적는다. 큐에는 항목 (0, 0) 하나가 들어간다.",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0 },
      heap: [{ label: "정점 0", key: 0 }],
      highlight: [0],
    },
    {
      title: "T2 정점 0 을 꺼낸다",
      detail:
        "키 0 이 dist[0] 과 같으므로 확정이다. 나가는 간선 둘을 완화해 dist[1] = 4 · dist[2] = 1 을 적고 항목 둘을 넣는다. dist = [0, 4, 1, Infinity, Infinity, Infinity].",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "frontier", 2: "frontier" },
      nodeValue: { 0: 0, 1: 4, 2: 1 },
      activeEdge: { from: 0, to: 2 },
      heap: [
        { label: "정점 2", key: 1 },
        { label: "정점 1", key: 4 },
      ],
      highlight: [0],
    },
    {
      title: "T3 정점 2 를 꺼낸다",
      detail:
        "키 1 이 큐에서 가장 작다. 2→1 이 4 를 3 으로 줄이고 2→3 이 6 을 처음 적는다. 정점 1 짜리 항목이 (1, 3) 과 (1, 4) 로 둘이 된다. dist = [0, 3, 1, 6, Infinity, Infinity].",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "frontier", 2: "active", 3: "frontier" },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 6 },
      activeEdge: { from: 2, to: 3 },
      heap: [
        { label: "정점 1", key: 3 },
        { label: "정점 1", key: 4 },
        { label: "정점 3", key: 6 },
      ],
      highlight: [0],
    },
    {
      title: "T4 정점 1 을 꺼낸다",
      detail:
        "키 3 이 dist[1] 과 같으므로 확정이다. 1→3 이 6 을 4 로 줄인다. 이제 정점 3 짜리 항목도 (3, 6) 과 (3, 4) 로 둘이다. dist = [0, 3, 1, 4, Infinity, Infinity].",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 4 },
      activeEdge: { from: 1, to: 3 },
      heap: [
        { label: "정점 1", key: 4 },
        { label: "정점 3", key: 6 },
        { label: "정점 3", key: 4 },
      ],
      highlight: [0],
    },
    {
      title: "T5 정점 1 을 다시 꺼낸다",
      detail:
        "키 4 가 dist[1] = 3 보다 크다. T3 이 넣어 둔 뒤처진 기록이므로 이웃을 하나도 보지 않고 버린다. dist 는 그대로다.",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 4 },
      heap: [
        { label: "정점 3", key: 4 },
        { label: "정점 3", key: 6 },
      ],
      highlight: [0],
    },
    {
      title: "T6 정점 3 을 꺼낸다",
      detail:
        "키 4 가 dist[3] 과 같으므로 확정이다. 3→4 가 7 을 처음 적는다. dist = [0, 3, 1, 4, 7, Infinity].",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 4, 4: 7 },
      activeEdge: { from: 3, to: 4 },
      heap: [
        { label: "정점 3", key: 6 },
        { label: "정점 4", key: 7 },
      ],
      highlight: [0],
    },
    {
      title: "T7 정점 3 을 다시 꺼낸다",
      detail:
        "키 6 이 dist[3] = 4 보다 크다. T3 이 넣어 둔 뒤처진 기록이므로 버린다. dist 는 그대로다.",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
      },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 4, 4: 7 },
      heap: [{ label: "정점 4", key: 7 }],
      highlight: [0],
    },
    {
      title: "T8 정점 4 를 꺼낸다",
      detail:
        "키 7 이 dist[4] 와 같으므로 확정이다. 4→1 은 7 + 7 = 14 라 dist[1] = 3 을 못 줄인다. 고칠 것이 없어 큐에 아무것도 넣지 않는다.",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "active",
      },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 4, 4: 7 },
      activeEdge: { from: 4, to: 1 },
      heap: [],
    },
    {
      title: "T9 종료",
      detail:
        "큐가 비어 반복이 끝난다. 정점 5 는 들어오는 간선이 하나도 없어 Infinity 로 남는다. 반환값은 [0, 3, 1, 4, 7, Infinity] 다.",
      nodes: [
        { id: 0, x: 8, y: 34 },
        { id: 1, x: 46, y: 8 },
        { id: 2, x: 30, y: 64 },
        { id: 3, x: 86, y: 36 },
        { id: 4, x: 62, y: 86 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 2, to: 3, weight: 5, directed: true },
        { from: 3, to: 4, weight: 3, directed: true },
        { from: 4, to: 1, weight: 7, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 3, 2: 1, 3: 4, 4: 7 },
      heap: [],
    },
  ] satisfies Frame[],
};
