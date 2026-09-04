import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점의 상태(아직 값이 없음 · 이 바퀴에 고쳐짐 · 값이 그대로)와
 * 그 바퀴에서 마지막으로 값을 고친 간선을 그리고, `keyValue` 는 그 바퀴의 번호 · `dist` 전체 ·
 * 실행된 갈래 라벨 · 고친 자리를 적는다. 이 절차는 **한 걸음이 간선 목록 전체**라 그래프
 * 그림만으로는 「몇 번째 바퀴인가」와 「이 바퀴가 무엇을 고쳤는가」가 안 보인다.
 *
 * **한 프레임이 바퀴 하나다.** 간선 하나마다 프레임을 두면 8 x 6 = 48 장이 되어 무엇이
 * 남았는지가 사라진다. 대신 `detail` 과 `entries` 가 그 바퀴에서 고친 자리를 전부 적는다.
 *
 * **`activeEdge` 는 그 바퀴에서 마지막으로 값을 고친 간선**이다. 한 바퀴가 간선 여덟 개를
 * 전부 읽으므로 「지금 보고 있는 간선」이라는 것이 없고, 그 바퀴의 결과가 어느 자리에서
 * 나왔는지를 하나만 표시한다. 값은 `bellmanFord-guide.proof.ts` 의 `counted()` 가 정본과
 * 같은 절차로 낸 것이고, 원고의 걸음 표도 같은 함수에서 나온다.
 *
 * **`nodeValue` 는 유한한 값만 적는다.** `Infinity` 를 다른 기호로 바꿔 그리면 원고의 표기와
 * 갈리므로(L25), 아직 값이 없는 정점은 값 없이 색으로만 구분한다.
 *
 * 좌표는 0~100 정규화다. 사슬 `0 → 1 → 2 → 3 → 4 → 5` 를 지그재그로 놓아 간선 목록에 적힌
 * 순서(내림차순)와 실제 진행 방향이 반대라는 것이 보이게 했고, 들어오는 간선이 없는 정점 6 은
 * 왼쪽 아래에 떨어뜨려 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const bellmanFordWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "bellmanFord(7, [[4,5,1],[3,4,2],[2,3,-3],[1,2,3],[0,1,4],[0,2,9],[6,5,2],[5,1,7]], 0)",
  result: "{ dist: [0, 4, 7, 4, 6, 7, Infinity], hasNegativeCycle: false }",
  steps: [
    {
      title: "T1 시작값",
      detail:
        "거리 배열을 전부 Infinity 로 두고 dist[0] = 0 만 적는다. 아직 간선을 하나도 읽지 않았다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0 },
      entries: [
        { label: "바퀴", value: "아직 시작하지 않았다" },
        {
          label: "dist",
          value:
            "[0, Infinity, Infinity, Infinity, Infinity, Infinity, Infinity]",
        },
        { label: "이 바퀴가 고친 자리", value: "—" },
        { label: "실행된 갈래", value: "① 시작값" },
      ],
    },
    {
      title: "T2 첫 바퀴",
      detail:
        "간선 여덟 개를 목록 순서대로 읽는다. 앞의 네 간선은 꼬리 정점의 값이 없어 ③ 으로 넘어가고, 0→1 과 0→2 만 값을 적는다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "active" },
      nodeValue: { 0: 0, 1: 4, 2: 9 },
      activeEdge: { from: 0, to: 2 },
      entries: [
        { label: "바퀴", value: "1" },
        {
          label: "dist",
          value: "[0, 4, 9, Infinity, Infinity, Infinity, Infinity]",
        },
        {
          label: "이 바퀴가 고친 자리",
          value: "dist[1] Infinity -> 4 · dist[2] Infinity -> 9",
        },
        { label: "실행된 갈래", value: "② 바퀴 · ③ 건너뛰기 · ④ 완화" },
      ],
    },
    {
      title: "T3 둘째 바퀴",
      detail:
        "2→3 이 9 − 3 = 6 을 처음 적고, 그 뒤에 읽은 1→2 가 9 를 7 로 줄인다. 같은 바퀴 안에서 뒤에 읽은 간선이 앞 결과를 고치는 자리다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "active", 3: "active" },
      nodeValue: { 0: 0, 1: 4, 2: 7, 3: 6 },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "바퀴", value: "2" },
        { label: "dist", value: "[0, 4, 7, 6, Infinity, Infinity, Infinity]" },
        {
          label: "이 바퀴가 고친 자리",
          value: "dist[3] Infinity -> 6 · dist[2] 9 -> 7",
        },
        { label: "실행된 갈래", value: "② 바퀴 · ③ 건너뛰기 · ④ 완화" },
      ],
    },
    {
      title: "T4 셋째 바퀴",
      detail:
        "3→4 가 6 + 2 = 8 을 처음 적고, 2→3 이 7 − 3 = 4 로 앞 바퀴의 6 을 줄인다. 정점 3 의 값이 두 번째로 작아졌다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "active",
      },
      nodeValue: { 0: 0, 1: 4, 2: 7, 3: 4, 4: 8 },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "바퀴", value: "3" },
        { label: "dist", value: "[0, 4, 7, 4, 8, Infinity, Infinity]" },
        {
          label: "이 바퀴가 고친 자리",
          value: "dist[4] Infinity -> 8 · dist[3] 6 -> 4",
        },
        { label: "실행된 갈래", value: "② 바퀴 · ③ 건너뛰기 · ④ 완화" },
      ],
    },
    {
      title: "T5 넷째 바퀴",
      detail:
        "4→5 가 8 + 1 = 9 를 처음 적고, 3→4 가 4 + 2 = 6 으로 8 을 줄인다. 5→1 은 9 + 7 = 16 이라 dist[1] = 4 를 못 줄인다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "active",
        5: "active",
      },
      nodeValue: { 0: 0, 1: 4, 2: 7, 3: 4, 4: 6, 5: 9 },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "바퀴", value: "4" },
        { label: "dist", value: "[0, 4, 7, 4, 6, 9, Infinity]" },
        {
          label: "이 바퀴가 고친 자리",
          value: "dist[5] Infinity -> 9 · dist[4] 8 -> 6",
        },
        { label: "실행된 갈래", value: "② 바퀴 · ③ 건너뛰기 · ④ 완화" },
      ],
    },
    {
      title: "T6 다섯째 바퀴",
      detail:
        "4→5 하나만 값을 고친다. 6 + 1 = 7 이 앞 바퀴의 9 보다 작다. 이 바퀴가 마지막으로 값을 고친 바퀴다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "active",
      },
      nodeValue: { 0: 0, 1: 4, 2: 7, 3: 4, 4: 6, 5: 7 },
      activeEdge: { from: 4, to: 5 },
      entries: [
        { label: "바퀴", value: "5" },
        { label: "dist", value: "[0, 4, 7, 4, 6, 7, Infinity]" },
        { label: "이 바퀴가 고친 자리", value: "dist[5] 9 -> 7" },
        { label: "실행된 갈래", value: "② 바퀴 · ③ 건너뛰기 · ④ 완화" },
      ],
    },
    {
      title: "T7 여섯째 바퀴",
      detail:
        "간선 여덟 개를 다시 읽었는데 고칠 것이 하나도 없다. ⑤ 가 참이 되어 여기서 반복이 끝나고, 음수 사이클은 없다는 판정이 함께 나온다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 4, 2: 7, 3: 4, 4: 6, 5: 7 },
      entries: [
        { label: "바퀴", value: "6" },
        { label: "dist", value: "[0, 4, 7, 4, 6, 7, Infinity]" },
        { label: "이 바퀴가 고친 자리", value: "고친 것이 없다" },
        { label: "실행된 갈래", value: "② 바퀴 · ③ 건너뛰기 · ⑤ 조기 종료" },
      ],
    },
    {
      title: "T8 반환",
      detail:
        "정점 6 은 들어오는 간선이 하나도 없어 Infinity 로 남는다. 반환값은 dist 와 hasNegativeCycle = false 두 개다.",
      nodes: [
        { id: 0, x: 8, y: 50 },
        { id: 1, x: 26, y: 16 },
        { id: 2, x: 44, y: 54 },
        { id: 3, x: 62, y: 16 },
        { id: 4, x: 80, y: 54 },
        { id: 5, x: 94, y: 18 },
        { id: 6, x: 30, y: 90 },
      ],
      edges: [
        { from: 0, to: 1, weight: 4, directed: true },
        { from: 0, to: 2, weight: 9, directed: true },
        { from: 1, to: 2, weight: 3, directed: true },
        { from: 2, to: 3, weight: -3, directed: true },
        { from: 3, to: 4, weight: 2, directed: true },
        { from: 4, to: 5, weight: 1, directed: true },
        { from: 5, to: 1, weight: 7, directed: true },
        { from: 6, to: 5, weight: 2, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: 0, 1: 4, 2: 7, 3: 4, 4: 6, 5: 7 },
      entries: [
        { label: "바퀴", value: "끝났다" },
        { label: "dist", value: "[0, 4, 7, 4, 6, 7, Infinity]" },
        { label: "이 바퀴가 고친 자리", value: "—" },
        { label: "실행된 갈래", value: "hasNegativeCycle = false" },
      ],
    },
  ] satisfies Frame[],
};
