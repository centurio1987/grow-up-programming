import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 후보가 아님 · 큐에 있음 · 지금 꺼낸 것 ·
 * 결과에 들어감)와 지금 줄이고 있는 간선을 그리고, `keyValue` 는 그 순간의 큐 · 남은 선행
 * 정점 수 배열 · 결과 배열 · 분기를 적는다. 그래프 그림만으로는 **남은 선행 정점 수**가
 * 안 보이고, 이 알고리즘이 다음 정점을 고르는 근거가 바로 그 수라서 두 패널이 함께 있어야
 * 한 프레임이 완결된다. 앞선 `dfsTraversal`·`bfsShortestPath` 가 쓴 짝을 그대로 쓴다.
 *
 * 좌표는 0~100 정규화다. 간선에 방향이 있으므로 `directed: true` 를 붙인다. 출발 후보 둘
 * (4·5)을 위쪽에 두고, 도착점 1 을 맨 아래에 둔다.
 *
 * `nodeValue` 는 **결과 배열에서의 자리**(1 부터)다. 이 편이 재는 것이 순서라 정점 옆에
 * 붙는 수도 순서여야 한다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const topoWalk = {
  view: ["graph", "keyValue"] as const,
  title: "topologicalSort(6, [[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]])",
  result: "[4,5,2,0,3,1]",
  steps: [
    {
      title: "T1 남은 선행 정점 수를 세고 0 인 정점을 큐에 담는다",
      detail:
        "정점 4 와 5 는 들어오는 간선이 없어 남은 수가 0 이다. 번호가 작은 것부터 담아 큐가 [4, 5] 로 시작한다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: { 4: "frontier", 5: "frontier" },
      entries: [
        { label: "큐", value: "[4, 5]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "남은 선행 정점 수", value: "0:2 1:2 2:1 3:1 4:0 5:0" },
        { label: "order", value: "[]" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 정점 4 를 꺼낸다",
      detail:
        "정점 0 과 1 의 남은 수가 각각 2 에서 1 로 준다. 둘 다 0 이 아니라 큐에 담지 않는다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: { 4: "active", 5: "frontier" },
      nodeValue: { 4: 1 },
      activeEdge: { from: 4, to: 1 },
      entries: [
        { label: "큐", value: "[5]" },
        { label: "꺼낸 정점", value: "4" },
        { label: "남은 선행 정점 수", value: "0:1 1:1 2:1 3:1 4:0 5:0" },
        { label: "order", value: "[4]" },
        { label: "분기", value: "② 줄였지만 아직 0 이 아니다 (두 번)" },
      ],
    },
    {
      title: "T3 정점 5 를 꺼낸다",
      detail:
        "정점 2 의 남은 수가 1 에서 0 이 되고, 정점 0 의 남은 수도 1 에서 0 이 된다. 둘 다 그 자리에서 큐에 담는다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: { 4: "visited", 5: "active", 2: "frontier", 0: "frontier" },
      nodeValue: { 4: 1, 5: 2 },
      activeEdge: { from: 5, to: 2 },
      entries: [
        { label: "큐", value: "[2, 0]" },
        { label: "꺼낸 정점", value: "5" },
        { label: "남은 선행 정점 수", value: "0:0 1:1 2:0 3:1 4:0 5:0" },
        { label: "order", value: "[4, 5]" },
        { label: "분기", value: "① 0 이 된 그 순간에 담는다 (두 번)" },
      ],
    },
    {
      title: "T4 정점 2 를 꺼낸다",
      detail:
        "큐는 먼저 담은 것을 먼저 꺼낸다. 정점 2 가 정점 0 보다 먼저 담겼으므로 먼저 나온다. 정점 3 의 남은 수가 0 이 된다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: {
        4: "visited",
        5: "visited",
        2: "active",
        0: "frontier",
        3: "frontier",
      },
      nodeValue: { 4: 1, 5: 2, 2: 3 },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "큐", value: "[0, 3]" },
        { label: "꺼낸 정점", value: "2" },
        { label: "남은 선행 정점 수", value: "0:0 1:1 2:0 3:0 4:0 5:0" },
        { label: "order", value: "[4, 5, 2]" },
        { label: "분기", value: "① 0 이 된 그 순간에 담는다" },
      ],
    },
    {
      title: "T5 정점 0 을 꺼낸다",
      detail:
        "정점 0 은 나가는 간선이 없다. 줄일 것이 없어 큐에 새로 담기는 정점도 없다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: {
        4: "visited",
        5: "visited",
        2: "visited",
        0: "active",
        3: "frontier",
      },
      nodeValue: { 4: 1, 5: 2, 2: 3, 0: 4 },
      entries: [
        { label: "큐", value: "[3]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "남은 선행 정점 수", value: "0:0 1:1 2:0 3:0 4:0 5:0" },
        { label: "order", value: "[4, 5, 2, 0]" },
        { label: "분기", value: "나가는 간선이 없어 갈래가 실행되지 않는다" },
      ],
    },
    {
      title: "T6 정점 3 을 꺼낸다",
      detail:
        "정점 1 의 남은 수가 1 에서 0 이 된다. T2 에서 한 번 줄어 있었고, 여기서 두 번째로 줄어 0 이 됐다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: {
        4: "visited",
        5: "visited",
        2: "visited",
        0: "visited",
        3: "active",
        1: "frontier",
      },
      nodeValue: { 4: 1, 5: 2, 2: 3, 0: 4, 3: 5 },
      activeEdge: { from: 3, to: 1 },
      entries: [
        { label: "큐", value: "[1]" },
        { label: "꺼낸 정점", value: "3" },
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "order", value: "[4, 5, 2, 0, 3]" },
        { label: "분기", value: "① 0 이 된 그 순간에 담는다" },
      ],
    },
    {
      title: "T7 정점 1 을 꺼낸다",
      detail:
        "정점 1 도 나가는 간선이 없다. 큐에 남은 것이 없어 다음 바퀴에서 반복이 끝난다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: {
        4: "visited",
        5: "visited",
        2: "visited",
        0: "visited",
        3: "visited",
        1: "active",
      },
      nodeValue: { 4: 1, 5: 2, 2: 3, 0: 4, 3: 5, 1: 6 },
      entries: [
        { label: "큐", value: "[]" },
        { label: "꺼낸 정점", value: "1" },
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "order", value: "[4, 5, 2, 0, 3, 1]" },
        { label: "분기", value: "나가는 간선이 없어 갈래가 실행되지 않는다" },
      ],
    },
    {
      title: "T8 종료",
      detail:
        "큐에서 더 꺼낼 것이 없다. 결과 길이 6 이 정점 수 6 과 같으므로 이 배열이 위상 순서다.",
      nodes: [
        { id: 5, x: 18, y: 12 },
        { id: 4, x: 78, y: 12 },
        { id: 2, x: 12, y: 42 },
        { id: 0, x: 50, y: 34 },
        { id: 3, x: 14, y: 70 },
        { id: 1, x: 58, y: 90 },
      ],
      edges: [
        { from: 5, to: 2, directed: true },
        { from: 5, to: 0, directed: true },
        { from: 4, to: 0, directed: true },
        { from: 4, to: 1, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 1, directed: true },
      ],
      nodeStatus: {
        4: "visited",
        5: "visited",
        2: "visited",
        0: "visited",
        3: "visited",
        1: "visited",
      },
      nodeValue: { 4: 1, 5: 2, 2: 3, 0: 4, 3: 5, 1: 6 },
      entries: [
        { label: "큐", value: "[]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "남은 선행 정점 수", value: "0:0 1:0 2:0 3:0 4:0 5:0" },
        { label: "order", value: "[4, 5, 2, 0, 3, 1]" },
        { label: "분기", value: "③ 길이 6 = n 이라 순열을 반환한다" },
      ],
    },
  ] satisfies Frame[],
};
