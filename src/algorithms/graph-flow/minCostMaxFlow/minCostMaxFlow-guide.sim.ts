import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)와 같다 — P3 이 그 관계를 잰다.
 *
 * ## 뷰를 `graph` + `keyValue` 로 짝지은 이유
 *
 * 이 절차가 한 걸음에 바꾸는 것이 **두 종류**다. 하나는 간선마다의 잔여 용량이고(그래프),
 * 다른 하나는 누적 유량과 누적 총비용이라는 스칼라 둘이다(키-값). 앞엣것은 정점 위에 그려야
 * 읽히고 뒤엣것은 표로 적어야 읽힌다.
 *
 * 1. **간선의 `weight` 는 잔여 용량이다.** 단위 비용이 아니다 — 단위 비용은 라운드 내내 안
 *    바뀌므로 프레임마다 실을 값이 아니고, 원고의 기호표와 첫 그림이 한 번에 보인다.
 * 2. **역방향 항목은 잔여 용량이 0 보다 클 때만 그린다.** 처음에는 다섯 간선만 있다가
 *    유량이 흐른 뒤에 늘어나는 것이 이 절차의 요점이라, 처음부터 용량 0 짜리 항목을 열 개
 *    그려 두면 그 늘어남이 안 보인다.
 * 3. **`nodeValue` 는 그 라운드의 `dist` 다.** 경로를 찾는 프레임에서만 채우고 유량을 보내는
 *    프레임에서는 그대로 둔다 — 같은 값을 두 프레임에 걸쳐 보이는 것이 「이 거리로 이 경로를
 *    골랐다」를 잇는 자리다.
 * 4. **`activeEdge` 는 그 라운드가 고른 경로의 마지막 항목이다.** 경로 전체를 칠할 수단이
 *    없어 한 항목만 칠하고, 경로 전체는 `entries` 의 「고른 경로」 줄이 적는다.
 *
 * 좌표는 0~100 정규화다. 소스 0 을 왼쪽, 싱크 3 을 오른쪽에 두고 가운데 둘을 위아래로
 * 갈랐다 — 정점 1 이 위, 정점 2 가 아래다. 원고 그림의 배치를 그대로 옮겼다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const mcmfWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "minCostMaxFlow(4, [[0,1,3,1],[0,2,3,4],[1,2,2,1],[1,3,3,6],[2,3,4,1]], 0, 3)",
  result: "{ flow: 6, cost: 32 }",
  steps: [
    {
      title: "T1 잔여 그래프를 만든다",
      detail:
        "간선 다섯을 정방향 항목으로 담고 짝이 되는 역방향 항목을 용량 0 · 단위 비용 반대 부호로 함께 담는다. 역방향 항목은 잔여 용량이 0 이라 아직 그리지 않는다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 3, directed: true },
        { from: 1, to: 2, weight: 2, directed: true },
        { from: 1, to: 3, weight: 3, directed: true },
        { from: 2, to: 3, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "active", 3: "frontier" },
      entries: [
        { label: "누적 유량 / 누적 총비용", value: "0 / 0" },
        { label: "잔여 용량 (0→1,0→2,1→2,1→3,2→3)", value: "3 3 2 3 4" },
        { label: "역방향 항목의 잔여 용량", value: "전부 0" },
      ],
    },
    {
      title: "T2 라운드 1 — 단위 비용 합이 가장 작은 경로",
      detail:
        "완화 큐가 dist = [0, 1, 2, 3] 을 낸다. 정점 2 는 0→2 로 바로 가면 4 인데 0→1→2 로 가면 2 라 뒤엣것이 남는다. 싱크의 값 3 이 이 경로로 한 단위를 보낼 때의 비용이다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 3, directed: true },
        { from: 0, to: 2, weight: 3, directed: true },
        { from: 1, to: 2, weight: 2, directed: true },
        { from: 1, to: 3, weight: 3, directed: true },
        { from: 2, to: 3, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 3 },
      entries: [
        { label: "dist", value: "[0, 1, 2, 3]" },
        { label: "고른 경로", value: "0 → 1 → 2 → 3" },
        { label: "한 단위의 비용", value: "3" },
      ],
    },
    {
      title: "T3 라운드 1 — 병목 2 만큼 보낸다",
      detail:
        "경로 위 세 항목의 잔여 용량이 3 · 2 · 4 라 병목은 2 다. 정방향에서 2 를 덜고 짝이 되는 역방향에 2 를 더한다. 누적 유량 2 · 누적 총비용 2 × 3 = 6.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 3, directed: true },
        { from: 1, to: 3, weight: 3, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
        { from: 1, to: 0, weight: 2, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 3, to: 2, weight: 2, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "active", 2: "active", 3: "active" },
      nodeValue: { 0: 0, 1: 1, 2: 2, 3: 3 },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "병목", value: "2" },
        { label: "누적 유량 / 누적 총비용", value: "2 / 6" },
        { label: "잔여 용량 (0→1,0→2,1→2,1→3,2→3)", value: "1 3 0 3 2" },
      ],
    },
    {
      title: "T4 라운드 2 — 1→2 가 다 차서 값이 커진다",
      detail:
        "1→2 의 잔여 용량이 0 이라 정점 2 로 가는 길이 0→2 하나뿐이다. dist = [0, 1, 4, 5] 이고 싱크의 값이 3 에서 5 로 커졌다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 3, directed: true },
        { from: 1, to: 3, weight: 3, directed: true },
        { from: 2, to: 3, weight: 2, directed: true },
        { from: 1, to: 0, weight: 2, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 3, to: 2, weight: 2, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 1, 2: 4, 3: 5 },
      entries: [
        { label: "dist", value: "[0, 1, 4, 5]" },
        { label: "고른 경로", value: "0 → 2 → 3" },
        { label: "한 단위의 비용", value: "5" },
      ],
    },
    {
      title: "T5 라운드 2 — 병목 2 만큼 보낸다",
      detail:
        "0→2 의 잔여 3 과 2→3 의 잔여 2 중 작은 쪽이 2 다. 누적 유량 4 · 누적 총비용 6 + 2 × 5 = 16.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 1, to: 3, weight: 3, directed: true },
        { from: 1, to: 0, weight: 2, directed: true },
        { from: 2, to: 0, weight: 2, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "active", 2: "active", 3: "active" },
      nodeValue: { 0: 0, 1: 1, 2: 4, 3: 5 },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "병목", value: "2" },
        { label: "누적 유량 / 누적 총비용", value: "4 / 16" },
        { label: "잔여 용량 (0→1,0→2,1→2,1→3,2→3)", value: "1 1 0 3 0" },
      ],
    },
    {
      title: "T6 라운드 3 — 싱크로 가는 길이 1→3 하나뿐이다",
      detail:
        "2→3 의 잔여 용량이 0 이라 싱크로 들어가는 정방향 항목이 1→3 만 남았다. dist = [0, 1, 4, 7] 이고 싱크의 값이 7 이다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 1, to: 3, weight: 3, directed: true },
        { from: 1, to: 0, weight: 2, directed: true },
        { from: 2, to: 0, weight: 2, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 1, 2: 4, 3: 7 },
      entries: [
        { label: "dist", value: "[0, 1, 4, 7]" },
        { label: "고른 경로", value: "0 → 1 → 3" },
        { label: "한 단위의 비용", value: "7" },
      ],
    },
    {
      title: "T7 라운드 3 — 병목 1 만큼 보낸다",
      detail:
        "0→1 의 잔여 1 이 병목이다. 누적 유량 5 · 누적 총비용 16 + 1 × 7 = 23. 소스에서 나가는 정방향 항목 중 0→2 만 1 이 남았다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 1, to: 3, weight: 2, directed: true },
        { from: 1, to: 0, weight: 3, directed: true },
        { from: 2, to: 0, weight: 2, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 3, to: 1, weight: 1, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "active", 3: "active" },
      nodeValue: { 0: 0, 1: 1, 2: 4, 3: 7 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "병목", value: "1" },
        { label: "누적 유량 / 누적 총비용", value: "5 / 23" },
        { label: "잔여 용량 (0→1,0→2,1→2,1→3,2→3)", value: "0 1 0 2 0" },
      ],
    },
    {
      title: "T8 라운드 4 — 역방향 항목을 지나는 경로",
      detail:
        "정점 1 의 값이 3 이다. 0→1 이 다 차서 4 를 내고 0→2 로 간 뒤 역방향 항목 2→1 (단위 비용 -1) 로 되돌아온 값이다. dist = [0, 3, 4, 9] 이고 싱크의 값이 9 다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 0, to: 2, weight: 1, directed: true },
        { from: 1, to: 3, weight: 2, directed: true },
        { from: 1, to: 0, weight: 3, directed: true },
        { from: 2, to: 0, weight: 2, directed: true },
        { from: 2, to: 1, weight: 2, directed: true },
        { from: 3, to: 1, weight: 1, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "visited", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 9 },
      activeEdge: { from: 2, to: 1 },
      entries: [
        { label: "dist", value: "[0, 3, 4, 9]" },
        { label: "고른 경로", value: "0 → 2 → 1 → 3 (2→1 은 역방향)" },
        { label: "한 단위의 비용", value: "9" },
      ],
    },
    {
      title: "T9 라운드 4 — 병목 1 만큼 보낸다",
      detail:
        "역방향 항목 2→1 로 1 을 보내는 것은 1→2 로 보내 두었던 1 을 물린다는 뜻이다. 1→2 의 잔여 용량이 0 에서 1 로 돌아온다. 누적 유량 6 · 누적 총비용 23 + 1 × 9 = 32.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 1, to: 2, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 1, to: 0, weight: 3, directed: true },
        { from: 2, to: 0, weight: 3, directed: true },
        { from: 2, to: 1, weight: 1, directed: true },
        { from: 3, to: 1, weight: 2, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "active", 2: "active", 3: "active" },
      nodeValue: { 0: 0, 1: 3, 2: 4, 3: 9 },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "병목", value: "1" },
        { label: "누적 유량 / 누적 총비용", value: "6 / 32" },
        { label: "잔여 용량 (0→1,0→2,1→2,1→3,2→3)", value: "0 0 1 1 0" },
      ],
    },
    {
      title: "T10 라운드 5 — 소스에서 나가는 정방향 항목이 다 찼다",
      detail:
        "0→1 과 0→2 의 잔여 용량이 둘 다 0 이라 완화 큐가 소스 하나만 보고 끝난다. 싱크의 값이 그대로라 반복을 끝내고 { flow: 6, cost: 32 } 를 낸다.",
      nodes: [
        { id: 0, label: "0 소스", x: 10, y: 50 },
        { id: 1, label: "1", x: 45, y: 18 },
        { id: 2, label: "2", x: 45, y: 82 },
        { id: 3, label: "3 싱크", x: 88, y: 50 },
      ],
      edges: [
        { from: 1, to: 2, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 1, to: 0, weight: 3, directed: true },
        { from: 2, to: 0, weight: 3, directed: true },
        { from: 2, to: 1, weight: 1, directed: true },
        { from: 3, to: 1, weight: 2, directed: true },
        { from: 3, to: 2, weight: 4, directed: true },
      ],
      nodeStatus: { 0: "visited", 3: "default" },
      nodeValue: { 0: 0, 1: "∞", 2: "∞", 3: "∞" },
      entries: [
        { label: "dist", value: "[0, ∞, ∞, ∞]" },
        { label: "고른 경로", value: "없음 — 반복을 끝낸다" },
        { label: "반환값", value: "{ flow: 6, cost: 32 }" },
      ],
    },
  ] satisfies Frame[],
};
