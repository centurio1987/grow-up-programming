import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다.** `graph` 는 정점의 상태(아직 값이 없음 · 덱에 있음 · 방금 꺼냄 · 처리 끝)와
 * 지금 보고 있는 간선을 그리고, `keyValue` 는 그 순간의 덱·꺼낸 정점·`dist`·갈래를 적는다.
 * 이 편에서 갈리는 것은 **덱의 어느 쪽에 넣었는가**라, 그래프 그림만으로는 그 자리가 안
 * 보인다. `bfsShortestPath` 가 세운 짝을 그대로 쓰되 `keyValue` 의 첫 줄을 「덱(앞→뒤)」로
 * 두어 앞뒤가 갈리는 것을 매 프레임 읽게 했다.
 *
 * **같은 정점이 덱에 두 번 보이는 것을 감추지 않는다.** T4·T5 의 덱에 정점 1 이 둘이고, 그것이
 * 이 절차의 요점(값을 고칠 때마다 다시 넣는다)이다. 그 정점의 `nodeStatus` 는 마지막으로
 * 정해진 상태 하나만 그릴 수 있으므로, 두 벌이라는 사실은 `keyValue` 의 덱 줄이 진다.
 *
 * 좌표는 0~100 정규화다. 정점 0 을 왼쪽 끝에 두고 가중치 0 간선(`0→2`·`2→1`·`3→4`)이 위로
 * 꺾여 올라가게 놓아 「비용 없이 올라가는 길」이 한 줄로 보이게 했고, 들어오는 간선이 하나도
 * 없는 정점 5 는 오른쪽 아래에 떨어뜨려 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const zeroOneWalk = {
  view: ["graph", "keyValue"] as const,
  title: "zeroOneBfs(6, [[0,1,1],[0,2,0],[2,1,0],[2,3,1],[1,3,1],[3,4,0]], 0)",
  result: "[0, 0, 0, 1, 1, -1]",
  steps: [
    {
      title: "T1 시작값",
      detail:
        "거리 배열을 전부 ∞ 로 두고 dist[0] = 0 만 적는다. 덱에는 정점 0 하나가 들어간다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "frontier" },
      nodeValue: { 0: 0, 1: "∞", 2: "∞", 3: "∞", 4: "∞", 5: "∞" },
      entries: [
        { label: "덱(앞→뒤)", value: "[0]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "dist", value: "[0, ∞, ∞, ∞, ∞, ∞]" },
        { label: "갈래", value: "dist[0] ← 0" },
      ],
    },
    {
      title: "T2 정점 0 을 꺼내 간선 0→1 을 본다",
      detail:
        "가중치가 1 이라 새 값은 0 + 1 = 1 이다. ∞ 보다 작으므로 dist[1] = 1 을 적고 거리가 하나 커졌으니 덱 뒤에 넣는다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "frontier" },
      nodeValue: { 0: 0, 1: 1, 2: "∞", 3: "∞", 4: "∞", 5: "∞" },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "덱(앞→뒤)", value: "[1]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "dist", value: "[0, 1, ∞, ∞, ∞, ∞]" },
        { label: "갈래", value: "③ 뒤에 넣는다" },
      ],
    },
    {
      title: "T3 정점 0 의 간선 0→2 를 본다",
      detail:
        "가중치가 0 이라 새 값은 0 + 0 = 0 이다. dist[2] = 0 을 적고 거리가 그대로이므로 덱 앞에 넣는다. 이제 덱 앞이 정점 2 다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "active", 1: "frontier", 2: "frontier" },
      nodeValue: { 0: 0, 1: 1, 2: 0, 3: "∞", 4: "∞", 5: "∞" },
      activeEdge: { from: 0, to: 2 },
      entries: [
        { label: "덱(앞→뒤)", value: "[2, 1]" },
        { label: "꺼낸 정점", value: "0" },
        { label: "dist", value: "[0, 1, 0, ∞, ∞, ∞]" },
        { label: "갈래", value: "② 앞에 넣는다" },
      ],
    },
    {
      title: "T4 정점 2 를 꺼내 간선 2→1 을 본다",
      detail:
        "새 값은 0 + 0 = 0 이고 지금 적힌 1 보다 작다. dist[1] 을 0 으로 고치고 덱 앞에 넣는다. 정점 1 이 덱에 두 벌이 됐다 — 앞쪽이 거리 0 으로 넣은 것이고 뒤쪽이 T2 가 거리 1 로 넣어 둔 것이다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "frontier", 2: "active" },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: "∞", 4: "∞", 5: "∞" },
      activeEdge: { from: 2, to: 1 },
      entries: [
        { label: "덱(앞→뒤)", value: "[1, 1]" },
        { label: "꺼낸 정점", value: "2" },
        { label: "dist", value: "[0, 0, 0, ∞, ∞, ∞]" },
        { label: "갈래", value: "② 앞에 넣는다" },
      ],
    },
    {
      title: "T5 정점 2 의 간선 2→3 을 본다",
      detail:
        "가중치가 1 이라 새 값은 0 + 1 = 1 이다. dist[3] = 1 을 적고 덱 뒤에 넣는다. 덱은 앞쪽이 거리 0, 뒤쪽이 거리 1 인 모양이다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "frontier", 2: "active", 3: "frontier" },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: 1, 4: "∞", 5: "∞" },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "덱(앞→뒤)", value: "[1, 1, 3]" },
        { label: "꺼낸 정점", value: "2" },
        { label: "dist", value: "[0, 0, 0, 1, ∞, ∞]" },
        { label: "갈래", value: "③ 뒤에 넣는다" },
      ],
    },
    {
      title: "T6 정점 1 을 꺼내 간선 1→3 을 본다",
      detail:
        "새 값은 0 + 1 = 1 이고 지금 적힌 dist[3] 도 1 이다. 작지 않으므로 아무것도 하지 않는다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: 1, 4: "∞", 5: "∞" },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "덱(앞→뒤)", value: "[1, 3]" },
        { label: "꺼낸 정점", value: "1 (첫 번째)" },
        { label: "dist", value: "[0, 0, 0, 1, ∞, ∞]" },
        { label: "갈래", value: "① 1 ≥ 1 이라 그대로" },
      ],
    },
    {
      title: "T7 정점 1 을 다시 꺼내 같은 간선을 본다",
      detail:
        "T2 가 거리 1 로 넣어 둔 벌이다. dist[1] 은 이미 0 이라 새 값도 1 이고 dist[3] 도 1 이라 또 아무것도 하지 않는다. 정점 하나를 두 번 꺼내도 답이 흔들리지 않는 자리다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: { 0: "visited", 1: "active", 2: "visited", 3: "frontier" },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: 1, 4: "∞", 5: "∞" },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "덱(앞→뒤)", value: "[3]" },
        { label: "꺼낸 정점", value: "1 (두 번째)" },
        { label: "dist", value: "[0, 0, 0, 1, ∞, ∞]" },
        { label: "갈래", value: "① 1 ≥ 1 이라 그대로" },
      ],
    },
    {
      title: "T8 정점 3 을 꺼내 간선 3→4 를 본다",
      detail:
        "가중치가 0 이라 새 값은 1 + 0 = 1 이다. dist[4] = 1 을 적고 거리가 그대로이므로 덱 앞에 넣는다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "active",
        4: "frontier",
      },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: "∞" },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "덱(앞→뒤)", value: "[4]" },
        { label: "꺼낸 정점", value: "3" },
        { label: "dist", value: "[0, 0, 0, 1, 1, ∞]" },
        { label: "갈래", value: "② 앞에 넣는다" },
      ],
    },
    {
      title: "T9 정점 4 를 꺼낸다",
      detail: "나가는 간선이 하나도 없어 볼 것이 없다. 덱이 비었다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "active",
      },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: "∞" },
      entries: [
        { label: "덱(앞→뒤)", value: "[]" },
        { label: "꺼낸 정점", value: "4" },
        { label: "dist", value: "[0, 0, 0, 1, 1, ∞]" },
        { label: "갈래", value: "볼 간선이 없다" },
      ],
    },
    {
      title: "T10 종료",
      detail:
        "덱이 비어 반복이 끝난다. 정점 5 는 들어오는 간선이 하나도 없어 ∞ 로 남았고, 마지막 줄이 그것을 -1 로 적는다. 반환값은 [0, 0, 0, 1, 1, -1] 이다.",
      nodes: [
        { id: 0, x: 6, y: 46 },
        { id: 1, x: 34, y: 12 },
        { id: 2, x: 34, y: 82 },
        { id: 3, x: 64, y: 44 },
        { id: 4, x: 90, y: 16 },
        { id: 5, x: 92, y: 86 },
      ],
      edges: [
        { from: 0, to: 1, weight: 1, directed: true },
        { from: 0, to: 2, weight: 0, directed: true },
        { from: 2, to: 1, weight: 0, directed: true },
        { from: 2, to: 3, weight: 1, directed: true },
        { from: 1, to: 3, weight: 1, directed: true },
        { from: 3, to: 4, weight: 0, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: -1 },
      entries: [
        { label: "덱(앞→뒤)", value: "[]" },
        { label: "꺼낸 정점", value: "—" },
        { label: "dist", value: "[0, 0, 0, 1, 1, -1]" },
        { label: "갈래", value: "④ ∞ 를 -1 로 적는다" },
      ],
    },
  ] satisfies Frame[],
};
