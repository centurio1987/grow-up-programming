import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 거리 없음 · 큐에 있음 · 꺼내는 중 · 처리 끝)와
 * 지금 보고 있는 간선을 그리고, `keyValue` 는 그 순간의 큐·꺼낸 정점·`dist`·분기를 적는다.
 * 그래프 그림만으로는 **큐의 순서**가 안 보이고, 이 알고리즘이 옳은 이유가 바로 그 순서라서
 * 두 패널이 함께 있어야 한 프레임이 완결된다. `graph` 를 쓰는 뒤 편들도 이 짝을 그대로 쓴다.
 *
 * 좌표는 0~100 정규화다. 정점 0~4 를 오각형으로 놓아 사이클이 한눈에 갈리게 하고, 간선이
 * 하나도 없는 정점 5 는 오른쪽에 떨어뜨려 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const bfsWalk = {
  view: ["graph", "keyValue"] as const,
  title: "bfsShortestPath(6, [[0,1],[1,2],[2,3],[3,4],[4,0]], 0)",
  result: "[0,1,2,2,1,-1]",
  steps: [
    {
      title: "T1 시작",
      detail: "dist[0] = 0 을 적고 정점 0 을 큐에 넣는다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0 },
      entries: [
        { label: "큐", value: "[0]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "dist", value: "[0, -1, -1, -1, -1, -1]" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 정점 0 의 이웃 1",
      detail:
        "dist[1] 이 -1 이라 처음 만나는 정점이다. 거리 1 을 적고 큐 뒤에 넣는다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: { 0: "active", 1: "frontier" },
      nodeValue: { 0: 0, 1: 1 },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "큐", value: "[1]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "dist", value: "[0, 1, -1, -1, -1, -1]" },
        { label: "분기", value: "① 처음 만나는 정점" },
      ],
    },
    {
      title: "T3 정점 0 의 이웃 4",
      detail: "같은 갈래다. dist[4] = 1 을 적고 큐 뒤에 넣는다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: { 0: "active", 1: "frontier", 4: "frontier" },
      nodeValue: { 0: 0, 1: 1, 4: 1 },
      activeEdge: { from: 4, to: 0 },
      entries: [
        { label: "큐", value: "[1, 4]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "dist", value: "[0, 1, -1, -1, 1, -1]" },
        { label: "분기", value: "① 처음 만나는 정점" },
      ],
    },
    {
      title: "T4 정점 1 의 이웃 0",
      detail: "dist[0] 이 0 이라 이미 거리가 있다. 아무것도 바꾸지 않는다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: { 0: "visited", 1: "active", 4: "frontier" },
      nodeValue: { 0: 0, 1: 1, 4: 1 },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "큐", value: "[4]" },
        { label: "꺼낸 정점", value: "1" },
        { label: "dist", value: "[0, 1, -1, -1, 1, -1]" },
        { label: "분기", value: "② 이미 거리가 있다" },
      ],
    },
    {
      title: "T5 정점 1 의 이웃 2",
      detail: "처음 만나는 정점이다. dist[2] = dist[1] + 1 = 2.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "frontier", 4: "frontier" },
      nodeValue: { 0: 0, 1: 1, 2: 2, 4: 1 },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "큐", value: "[4, 2]" },
        { label: "꺼낸 정점", value: "1" },
        { label: "dist", value: "[0, 1, 2, -1, 1, -1]" },
        { label: "분기", value: "① 처음 만나는 정점" },
      ],
    },
    {
      title: "T6 정점 4 의 이웃 3",
      detail:
        "거리 1 인 정점을 다 꺼내기 전에는 거리 2 인 정점을 꺼내지 않는다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "frontier",
        3: "frontier",
        4: "active",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 2, 4: 1 },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "큐", value: "[2, 3]" },
        { label: "꺼낸 정점", value: "4" },
        { label: "dist", value: "[0, 1, 2, 2, 1, -1]" },
        { label: "분기", value: "① 처음 만나는 정점" },
      ],
    },
    {
      title: "T7 정점 4 의 이웃 0",
      detail:
        "이미 거리가 있다. 사이클을 한 바퀴 지나 정점 0 으로 다시 온 간선이다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "frontier",
        3: "frontier",
        4: "active",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 2, 4: 1 },
      activeEdge: { from: 4, to: 0 },
      entries: [
        { label: "큐", value: "[2, 3]" },
        { label: "꺼낸 정점", value: "4" },
        { label: "dist", value: "[0, 1, 2, 2, 1, -1]" },
        { label: "분기", value: "② 이미 거리가 있다" },
      ],
    },
    {
      title: "T8 정점 2 의 이웃 1 과 3",
      detail: "둘 다 이미 거리가 있다. 사이클이 여기서 닫힌다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "active",
        3: "frontier",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 2, 4: 1 },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "큐", value: "[3]" },
        { label: "꺼낸 정점", value: "2" },
        { label: "dist", value: "[0, 1, 2, 2, 1, -1]" },
        { label: "분기", value: "② 두 번 다 이미 거리가 있다" },
      ],
    },
    {
      title: "T9 정점 3 의 이웃 2 와 4",
      detail: "둘 다 이미 거리가 있다. 큐에 새로 들어가는 정점이 없다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 2, 4: 1 },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "큐", value: "[]" },
        { label: "꺼낸 정점", value: "3" },
        { label: "dist", value: "[0, 1, 2, 2, 1, -1]" },
        { label: "분기", value: "② 두 번 다 이미 거리가 있다" },
      ],
    },
    {
      title: "T10 종료",
      detail: "head 가 큐 길이와 같아져 반복이 끝난다. 정점 5 는 -1 로 남는다.",
      nodes: [
        { id: 0, x: 38, y: 10 },
        { id: 1, x: 72, y: 35 },
        { id: 2, x: 59, y: 76 },
        { id: 3, x: 17, y: 76 },
        { id: 4, x: 4, y: 35 },
        { id: 5, x: 92, y: 62 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 1, to: 2 },
        { from: 2, to: 3 },
        { from: 3, to: 4 },
        { from: 4, to: 0 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 2, 4: 1 },
      entries: [
        { label: "큐", value: "[]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "dist", value: "[0, 1, 2, 2, 1, -1]" },
        { label: "분기", value: "큐가 비어 반복이 끝난다" },
      ],
    },
  ] satisfies Frame[],
};
