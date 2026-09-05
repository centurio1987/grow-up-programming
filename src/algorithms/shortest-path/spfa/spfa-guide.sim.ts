import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 값이 없음 · 대기열에 있음 · 꺼내서 처리를
 * 끝냄)와 그 걸음에서 마지막으로 값을 고친 간선을 그리고, `keyValue` 는 꺼낸 정점 · `dist`
 * 전체 · 대기열 내용 · 실행된 갈래 라벨을 적는다. 이 절차는 **대기열의 내용이 곧 남은
 * 일**이라 그래프 그림만으로는 「무엇이 남았는가」가 안 보인다.
 *
 * **한 프레임이 꺼내기 하나다.** 간선 하나마다 프레임을 두면 걸음이 늘어나기만 하고 대기열
 * 이 어떻게 줄어드는지가 사라진다. 대신 `detail` 과 `entries` 가 그 걸음에서 고친 자리를
 * 전부 적는다.
 *
 * **`activeEdge` 는 그 걸음에서 마지막으로 값을 고친 간선**이다. 값을 하나도 못 고친 걸음
 * (T7 · T9)에는 두지 않는다.
 *
 * **`nodeValue` 는 유한한 값만 적는다.** `Infinity` 를 다른 기호로 바꿔 그리면 원고의
 * 표기와 갈리므로(L25), 아직 값이 없는 정점은 값 없이 색으로만 구분한다.
 *
 * 좌표는 0~100 정규화다. 정점 5 는 들어오는 간선이 없어 한 번도 대기열에 담기지 않으므로
 * 아래쪽에 떨어뜨려 두었다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const spfaWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "spfa(6, [[0,1,6],[0,2,1],[0,3,20],[1,3,4],[2,1,-3],[2,3,9],[3,4,2],[5,4,1]], 0)",
  result: "[0, -2, 1, 2, 4, Infinity]",
  steps: [
    {
      title: "T1 이웃 목록과 시작값",
      detail:
        "간선 목록을 꼬리 정점별로 모으고, 거리 배열을 전부 Infinity 로 둔 뒤 dist[0] = 0 만 적는다. 대기열에는 시작 정점 하나가 들어 있다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0 },
      entries: [
        { label: "꺼낸 정점", value: "아직 없다" },
        {
          label: "dist",
          value: "[0, Infinity, Infinity, Infinity, Infinity, Infinity]",
        },
        { label: "대기열", value: "[0]" },
        { label: "실행된 갈래", value: "① 이웃 목록 · ② 시작값 · ③ 대기열" },
      ],
    },
    {
      title: "T2 정점 0 을 꺼낸다",
      detail:
        "0 에서 나가는 간선 셋을 읽는다. 세 정점 모두 값이 없어 전부 고쳐지고, 셋 다 대기열에 새로 담긴다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "frontier", 2: "frontier", 3: "frontier" },
      nodeValue: { 0: 0, 1: 6, 2: 1, 3: 20 },
      activeEdge: { from: 0, to: 3 },
      entries: [
        { label: "꺼낸 정점", value: "0" },
        { label: "dist", value: "[0, 6, 1, 20, Infinity, Infinity]" },
        { label: "대기열", value: "[1, 2, 3]" },
        { label: "실행된 갈래", value: "④ 꺼내기 · ⑤ 완화 · ⑥ 다시 담기" },
      ],
    },
    {
      title: "T3 정점 1 을 꺼낸다",
      detail:
        "1→3 이 6 + 4 = 10 으로 dist[3] 을 20 에서 줄인다. 그런데 3 은 이미 대기열에 있어 다시 담지 않는다 — 값만 고쳐 두면 그 정점이 꺼내질 때 새 값으로 처리된다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "frontier", 3: "frontier" },
      nodeValue: { 0: 0, 1: 6, 2: 1, 3: 10 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "꺼낸 정점", value: "1" },
        { label: "dist", value: "[0, 6, 1, 10, Infinity, Infinity]" },
        { label: "대기열", value: "[2, 3]" },
        { label: "실행된 갈래", value: "④ 꺼내기 · ⑤ 완화" },
      ],
    },
    {
      title: "T4 정점 2 를 꺼낸다",
      detail:
        "2→1 이 1 − 3 = −2 로 dist[1] 을 6 에서 줄인다. 1 은 이미 꺼내서 처리를 끝낸 정점이라 대기열에 없고, 그래서 다시 담긴다. 2→3 은 1 + 9 = 10 이라 dist[3] = 10 을 못 줄인다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "frontier", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 10 },
      activeEdge: { from: 2, to: 1 },
      entries: [
        { label: "꺼낸 정점", value: "2" },
        { label: "dist", value: "[0, -2, 1, 10, Infinity, Infinity]" },
        { label: "대기열", value: "[3, 1]" },
        { label: "실행된 갈래", value: "④ 꺼내기 · ⑤ 완화 · ⑥ 다시 담기" },
      ],
    },
    {
      title: "T5 정점 3 을 꺼낸다",
      detail:
        "3→4 가 10 + 2 = 12 로 dist[4] 를 처음 적는다. 이 값은 dist[3] = 10 을 근거로 만든 것이고, dist[3] 은 뒤에서 한 번 더 줄어든다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "frontier",
        2: "visited",
        3: "visited",
        4: "frontier",
      },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 10, 4: 12 },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "꺼낸 정점", value: "3" },
        { label: "dist", value: "[0, -2, 1, 10, 12, Infinity]" },
        { label: "대기열", value: "[1, 4]" },
        { label: "실행된 갈래", value: "④ 꺼내기 · ⑤ 완화 · ⑥ 다시 담기" },
      ],
    },
    {
      title: "T6 정점 1 을 다시 꺼낸다",
      detail:
        "두 번째로 꺼낸 1 은 dist[1] = −2 를 들고 있다. 1→3 이 −2 + 4 = 2 로 dist[3] 을 10 에서 줄이고, 3 이 대기열에 다시 담긴다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "frontier",
        4: "frontier",
      },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 2, 4: 12 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "꺼낸 정점", value: "1" },
        { label: "dist", value: "[0, -2, 1, 2, 12, Infinity]" },
        { label: "대기열", value: "[4, 3]" },
        { label: "실행된 갈래", value: "④ 꺼내기 · ⑤ 완화 · ⑥ 다시 담기" },
      ],
    },
    {
      title: "T7 정점 4 를 꺼낸다",
      detail:
        "4 에서 나가는 간선이 하나도 없어 읽을 것이 없다. 값도 대기열도 그대로다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "frontier",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 2, 4: 12 },
      entries: [
        { label: "꺼낸 정점", value: "4" },
        { label: "dist", value: "[0, -2, 1, 2, 12, Infinity]" },
        { label: "대기열", value: "[3]" },
        { label: "실행된 갈래", value: "④ 꺼내기" },
      ],
    },
    {
      title: "T8 정점 3 을 다시 꺼낸다",
      detail:
        "dist[3] = 2 로 3→4 를 다시 읽는다. 2 + 2 = 4 가 앞서 적은 12 보다 작아 dist[4] 가 고쳐지고, 4 가 대기열에 다시 담긴다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "frontier",
      },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 2, 4: 4 },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "꺼낸 정점", value: "3" },
        { label: "dist", value: "[0, -2, 1, 2, 4, Infinity]" },
        { label: "대기열", value: "[4]" },
        { label: "실행된 갈래", value: "④ 꺼내기 · ⑤ 완화 · ⑥ 다시 담기" },
      ],
    },
    {
      title: "T9 정점 4 를 다시 꺼낸다",
      detail:
        "읽을 간선이 없어 값이 그대로이고, 대기열이 비었다. 정점 5 는 들어오는 간선이 없어 한 번도 담긴 적이 없다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 2, 4: 4 },
      entries: [
        { label: "꺼낸 정점", value: "4" },
        { label: "dist", value: "[0, -2, 1, 2, 4, Infinity]" },
        { label: "대기열", value: "[]" },
        { label: "실행된 갈래", value: "④ 꺼내기" },
      ],
    },
    {
      title: "T10 반환",
      detail:
        "대기열이 비어 반복이 끝난다. 정점 5 의 값은 시작값 Infinity 그대로이고, 5→4 는 한 번도 읽히지 않았다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 34, y: 16 },
        { id: 2, x: 34, y: 80 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 92, y: 44 },
        { id: 5, x: 64, y: 92 },
      ],
      edges: [
        { from: 0, to: 1, weight: 6, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 0, to: 3, weight: 20, directed: true },
        { from: 1, to: 3, weight: 4, directed: true },
        { from: 2, to: 1, weight: -3, directed: true },
        { from: 2, to: 3, weight: 9, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 5, to: 4, weight: 1, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: -2, 2: 1, 3: 2, 4: 4 },
      entries: [
        { label: "꺼낸 정점", value: "끝났다" },
        { label: "dist", value: "[0, -2, 1, 2, 4, Infinity]" },
        { label: "대기열", value: "[]" },
        { label: "실행된 갈래", value: "반환값 [0, -2, 1, 2, 4, Infinity]" },
      ],
    },
  ] satisfies Frame[],
};
