import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(13)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(성분 번호 없음 · 큐에 있음 · 꺼내는 중 · 처리 끝)와
 * 지금 보고 있는 간선을 그리고, `keyValue` 는 그 순간의 시작점 후보 · 큐 · `comp` · 분기를
 * 적는다. 그래프 그림만으로는 **바깥 반복이 어디까지 왔는지**가 안 보이고, 이 알고리즘의
 * 핵심이 바로 그 바깥 반복이라서 두 패널이 함께 있어야 한 프레임이 완결된다.
 * `bfsShortestPath` 가 연 짝을 그대로 쓴다(`bfsShortestPath-guide.sim.ts` 헤더).
 *
 * 좌표는 0~100 정규화다. 정점 0·4·2 를 삼각형으로 놓아 사이클이 한 자리에 보이게 하고,
 * 간선 하나로 이어진 1·3 을 오른쪽에, 간선이 하나도 없는 정점 5 를 오른쪽 아래에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const ccWalk = {
  view: ["graph", "keyValue"] as const,
  title: "connectedComponents(6, [[0,4],[4,2],[2,0],[1,3]])",
  result: "[[0,2,4],[1,3],[5]]",
  steps: [
    {
      title: "T1 초기화",
      detail:
        "이웃 목록을 만들고 comp 를 전부 -1 로 둔다. 아직 어느 정점도 성분에 안 들어갔다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      entries: [
        { label: "시작점 후보 s", value: "—" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[-1, -1, -1, -1, -1, -1]" },
        { label: "분기", value: "—" },
      ],
    },
    {
      title: "T2 시작점 s = 0",
      detail:
        "comp[0] 이 -1 이라 새 성분의 시작점이다. 번호 0 을 붙이고 큐에 넣는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0 },
      entries: [
        { label: "시작점 후보 s", value: "0" },
        { label: "큐", value: "[0]" },
        { label: "comp", value: "[0, -1, -1, -1, -1, -1]" },
        { label: "분기", value: "① 새 성분의 시작점" },
      ],
    },
    {
      title: "T3 정점 0 의 이웃 4",
      detail: "comp[4] 가 -1 이라 처음 만나는 이웃이다. 같은 번호 0 을 적는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: { 0: "active", 4: "frontier" },
      nodeValue: { 0: 0, 4: 0 },
      activeEdge: { from: 0, to: 4 },
      entries: [
        { label: "시작점 후보 s", value: "0" },
        { label: "큐", value: "[4]" },
        { label: "comp", value: "[0, -1, -1, -1, 0, -1]" },
        { label: "분기", value: "③ 처음 만나는 이웃" },
      ],
    },
    {
      title: "T4 정점 0 의 이웃 2",
      detail: "같은 갈래다. comp[2] 에 0 을 적고 큐 뒤에 넣는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: { 0: "active", 2: "frontier", 4: "frontier" },
      nodeValue: { 0: 0, 2: 0, 4: 0 },
      activeEdge: { from: 2, to: 0 },
      entries: [
        { label: "시작점 후보 s", value: "0" },
        { label: "큐", value: "[4, 2]" },
        { label: "comp", value: "[0, -1, 0, -1, 0, -1]" },
        { label: "분기", value: "③ 처음 만나는 이웃" },
      ],
    },
    {
      title: "T5 정점 4 의 이웃 0 과 2",
      detail: "둘 다 이미 번호가 있다. comp 를 바꾸지 않고 큐에도 안 넣는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: { 0: "visited", 2: "frontier", 4: "active" },
      nodeValue: { 0: 0, 2: 0, 4: 0 },
      activeEdge: { from: 4, to: 2 },
      entries: [
        { label: "시작점 후보 s", value: "0" },
        { label: "큐", value: "[2]" },
        { label: "comp", value: "[0, -1, 0, -1, 0, -1]" },
        { label: "분기", value: "④ 두 번 다 이미 번호가 있다" },
      ],
    },
    {
      title: "T6 정점 2 의 이웃 4 와 0",
      detail: "둘 다 이미 번호가 있다. 큐가 비어 성분 0 이 닫힌다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: { 0: "visited", 2: "active", 4: "visited" },
      nodeValue: { 0: 0, 2: 0, 4: 0 },
      activeEdge: { from: 2, to: 0 },
      entries: [
        { label: "시작점 후보 s", value: "0" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[0, -1, 0, -1, 0, -1]" },
        { label: "분기", value: "④ 두 번 다 이미 번호가 있다" },
      ],
    },
    {
      title: "T7 시작점 s = 1",
      detail: "comp[1] 이 -1 이다. 새 성분 번호 1 을 붙이고 큐에 넣는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: { 0: "visited", 1: "frontier", 2: "visited", 4: "visited" },
      nodeValue: { 0: 0, 1: 1, 2: 0, 4: 0 },
      entries: [
        { label: "시작점 후보 s", value: "1" },
        { label: "큐", value: "[1]" },
        { label: "comp", value: "[0, 1, 0, -1, 0, -1]" },
        { label: "분기", value: "① 새 성분의 시작점" },
      ],
    },
    {
      title: "T8 정점 1 의 이웃 3",
      detail: "처음 만나는 이웃이다. comp[3] 에 1 을 적는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "active",
        2: "visited",
        3: "frontier",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: 1, 4: 0 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "시작점 후보 s", value: "1" },
        { label: "큐", value: "[3]" },
        { label: "comp", value: "[0, 1, 0, 1, 0, -1]" },
        { label: "분기", value: "③ 처음 만나는 이웃" },
      ],
    },
    {
      title: "T9 정점 3 의 이웃 1",
      detail: "이미 번호가 있다. 큐가 비어 성분 1 이 닫힌다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: 1, 4: 0 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "시작점 후보 s", value: "1" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[0, 1, 0, 1, 0, -1]" },
        { label: "분기", value: "④ 이미 번호가 있다" },
      ],
    },
    {
      title: "T10 시작점 후보 2 · 3 · 4",
      detail:
        "comp 가 각각 0 · 1 · 0 이라 셋 다 건너뛴다. 탐색을 새로 시작하지 않는다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: 1, 4: 0 },
      entries: [
        { label: "시작점 후보 s", value: "2 · 3 · 4" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[0, 1, 0, 1, 0, -1]" },
        { label: "분기", value: "② 이미 번호가 있다 — 세 번 다" },
      ],
    },
    {
      title: "T11 시작점 s = 5",
      detail:
        "comp[5] 가 -1 이다. 번호 2 를 붙이지만 이웃 목록이 비어 있어 큐가 곧바로 빈다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "active",
      },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: 1, 4: 0, 5: 2 },
      entries: [
        { label: "시작점 후보 s", value: "5" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[0, 1, 0, 1, 0, 2]" },
        { label: "분기", value: "① 새 성분의 시작점" },
      ],
    },
    {
      title: "T12 정점 번호 오름차순으로 담는다",
      detail:
        "v 를 0 부터 5 까지 보며 out[comp[v]] 에 넣는다. 성분 안이 정렬된 채로 나온다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: 1, 4: 0, 5: 2 },
      entries: [
        { label: "시작점 후보 s", value: "—" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[0, 1, 0, 1, 0, 2]" },
        { label: "분기", value: "out = [[0,2,4], [1,3], [5]]" },
      ],
    },
    {
      title: "T13 종료",
      detail: "성분 세 개를 그대로 반환한다.",
      nodes: [
        { id: 0, x: 22, y: 12 },
        { id: 1, x: 66, y: 16 },
        { id: 2, x: 40, y: 58 },
        { id: 3, x: 66, y: 58 },
        { id: 4, x: 6, y: 58 },
        { id: 5, x: 94, y: 90 },
      ],
      edges: [
        { from: 0, to: 4 },
        { from: 4, to: 2 },
        { from: 2, to: 0 },
        { from: 1, to: 3 },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: 1, 4: 0, 5: 2 },
      entries: [
        { label: "시작점 후보 s", value: "—" },
        { label: "큐", value: "[]" },
        { label: "comp", value: "[0, 1, 0, 1, 0, 2]" },
        { label: "분기", value: "반환 [[0,2,4], [1,3], [5]]" },
      ],
    },
  ] satisfies Frame[],
};
