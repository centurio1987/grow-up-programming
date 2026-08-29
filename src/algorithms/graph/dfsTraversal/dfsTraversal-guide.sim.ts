import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(11)와 같다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 안 꺼냄 · 스택에 있음 · 지금 꺼낸 것 · 결과에
 * 들어감)와 지금 따라가는 간선을 그리고, `keyValue` 는 그 순간의 스택 · 꺼낸 정점 · 결과
 * 배열 · 분기를 적는다. 그래프 그림만으로는 **스택의 순서**가 안 보이고, 이 알고리즘의 방문
 * 순서가 바로 그 순서에서 나오므로 두 패널이 함께 있어야 한 프레임이 완결된다.
 * 앞선 `bfsShortestPath`·`connectedComponents` 가 쓴 짝을 그대로 쓴다.
 *
 * 좌표는 0~100 정규화다. 정점 0 에서 두 갈래가 갈리는 모양을 그대로 그리고, 간선이 하나도
 * 없는 정점 5 는 오른쪽에 떨어뜨려 둔다.
 *
 * `nodeValue` 는 **결과 배열에서의 자리**(1 부터)다. 거리가 아니라 순서를 재는 편이라
 * 정점 옆에 붙는 수도 순서여야 한다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const dfsWalk = {
  view: ["graph", "keyValue"] as const,
  title: "dfsTraversal(6, [[0,2],[0,1],[1,3],[2,4]], 0)",
  result: "[0,1,3,2,4]",
  steps: [
    {
      title: "T1 시작",
      detail: "시작 정점 0 을 스택에 넣는다. 결과 배열은 아직 비어 있다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: { 0: "frontier" },
      entries: [
        { label: "스택", value: "[0]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "order", value: "[]" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 정점 0 을 꺼낸다",
      detail:
        "처음 꺼내는 정점이다. 결과에 넣고 이웃 [1, 2] 를 큰 번호부터 스택에 넣는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: { 0: "active", 1: "frontier", 2: "frontier" },
      nodeValue: { 0: 1 },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "스택", value: "[2, 1]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "order", value: "[0]" },
        { label: "분기", value: "① 처음 꺼내는 정점" },
      ],
    },
    {
      title: "T3 정점 1 을 꺼낸다",
      detail:
        "스택 맨 위가 1 이라 2 보다 먼저 나온다. 이웃 [0, 3] 을 큰 번호부터 넣는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "active",
        2: "frontier",
        3: "frontier",
      },
      nodeValue: { 0: 1, 1: 2 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "스택", value: "[2, 3, 0]" },
        { label: "꺼낸 정점", value: "1" },
        { label: "order", value: "[0, 1]" },
        { label: "분기", value: "① 처음 꺼내는 정점" },
      ],
    },
    {
      title: "T4 정점 0 을 꺼낸다",
      detail: "이미 결과에 들어간 정점이다. 아무것도 하지 않고 그대로 버린다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "frontier",
        3: "frontier",
      },
      nodeValue: { 0: 1, 1: 2 },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "스택", value: "[2, 3]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "order", value: "[0, 1]" },
        { label: "분기", value: "② 이미 결과에 있다" },
      ],
    },
    {
      title: "T5 정점 3 을 꺼낸다",
      detail: "처음 꺼내는 정점이다. 이웃은 [1] 하나뿐이라 1 만 넣는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "frontier",
        3: "active",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "스택", value: "[2, 1]" },
        { label: "꺼낸 정점", value: "3" },
        { label: "order", value: "[0, 1, 3]" },
        { label: "분기", value: "① 처음 꺼내는 정점" },
      ],
    },
    {
      title: "T6 정점 1 을 꺼낸다",
      detail:
        "왼쪽 갈래에는 더 갈 곳이 없다. 이미 결과에 있는 정점이라 버린다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "frontier",
        3: "visited",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "스택", value: "[2]" },
        { label: "꺼낸 정점", value: "1" },
        { label: "order", value: "[0, 1, 3]" },
        { label: "분기", value: "② 이미 결과에 있다" },
      ],
    },
    {
      title: "T7 정점 2 를 꺼낸다",
      detail:
        "T2 에서 정점 0 이 넣어 둔 2 다. 갈림길로 되돌아간 것이 스택 하나로 처리된다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "active",
        3: "visited",
        4: "frontier",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3, 2: 4 },
      activeEdge: { from: 0, to: 2 },
      entries: [
        { label: "스택", value: "[4, 0]" },
        { label: "꺼낸 정점", value: "2" },
        { label: "order", value: "[0, 1, 3, 2]" },
        { label: "분기", value: "① 처음 꺼내는 정점" },
      ],
    },
    {
      title: "T8 정점 0 을 꺼낸다",
      detail: "정점 2 의 이웃 중 작은 쪽이지만 이미 결과에 있어 버린다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "frontier",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3, 2: 4 },
      activeEdge: { from: 0, to: 2 },
      entries: [
        { label: "스택", value: "[4]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "order", value: "[0, 1, 3, 2]" },
        { label: "분기", value: "② 이미 결과에 있다" },
      ],
    },
    {
      title: "T9 정점 4 를 꺼낸다",
      detail: "마지막으로 처음 꺼내는 정점이다. 이웃 [2] 를 넣는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "active",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3, 2: 4, 4: 5 },
      activeEdge: { from: 2, to: 4 },
      entries: [
        { label: "스택", value: "[2]" },
        { label: "꺼낸 정점", value: "4" },
        { label: "order", value: "[0, 1, 3, 2, 4]" },
        { label: "분기", value: "① 처음 꺼내는 정점" },
      ],
    },
    {
      title: "T10 정점 2 를 꺼낸다",
      detail: "이미 결과에 있다. 스택이 비어 다음 반복에서 끝난다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3, 2: 4, 4: 5 },
      activeEdge: { from: 2, to: 4 },
      entries: [
        { label: "스택", value: "[]" },
        { label: "꺼낸 정점", value: "2" },
        { label: "order", value: "[0, 1, 3, 2, 4]" },
        { label: "분기", value: "② 이미 결과에 있다" },
      ],
    },
    {
      title: "T11 종료",
      detail:
        "스택이 비어 반복이 끝난다. 정점 5 는 한 번도 스택에 안 들어가 결과에서 빠진다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 14, y: 42 },
        { id: 2, x: 66, y: 42 },
        { id: 3, x: 14, y: 80 },
        { id: 4, x: 66, y: 80 },
        { id: 5, x: 94, y: 60 },
      ],
      edges: [
        { from: 0, to: 1 },
        { from: 0, to: 2 },
        { from: 1, to: 3 },
        { from: 2, to: 4 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 1, 1: 2, 3: 3, 2: 4, 4: 5 },
      entries: [
        { label: "스택", value: "[]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "order", value: "[0, 1, 3, 2, 4]" },
        { label: "분기", value: "스택이 비어 반복이 끝난다" },
      ],
    },
  ] satisfies Frame[],
};
