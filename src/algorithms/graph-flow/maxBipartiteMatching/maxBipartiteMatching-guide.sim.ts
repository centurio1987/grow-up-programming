import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수(12)는 그 절의
 * `T#` 단계 수(14)를 넘지 않는다 — P3 이 그 관계를 잰다. 걸음 열넷 중 상태가 실제로 바뀌는
 * 자리 열둘을 골랐고, 건너뛴 걸음은 `detail` 이 이름으로 짚는다.
 *
 * **뷰가 둘이다.** `graph` 는 정점의 상태(아직 안 봄 · 지금 보는 중 · 짝이 있음)와 지금 읽는
 * 간선을 그리고, `keyValue` 는 그 순간의 `matchR` · `seen` · `size` · 갈래를 적는다. 이
 * 편에서 갈리는 것은 **방문 표가 어디까지 찼는가**라 그래프 그림의 색만으로는 실패의 근거가
 * 보이지 않는다.
 *
 * `nodeValue` 는 그 정점의 짝을 적는다 — 왼쪽 정점에는 이어진 오른쪽 정점 이름이, 오른쪽
 * 정점에는 이어진 왼쪽 정점 이름이 붙는다. 재배정은 두 값이 함께 움직이는 사건이라 한쪽만
 * 그리면 무슨 일이 났는지 안 보인다.
 *
 * 좌표는 0~100 정규화다. 왼쪽 정점을 왼쪽 줄에, 오른쪽 정점을 오른쪽 줄에 세워 이분 그래프의
 * 두 무리가 그림에서 갈리게 했다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가
 * 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const matchWalk = {
  view: ["graph", "keyValue"] as const,
  title: "maxBipartiteMatching(3, 3, [[0,0],[0,1],[1,0],[2,0]])",
  result: "2",
  steps: [
    {
      title: "T1 준비",
      detail:
        "간선 목록을 왼쪽 정점별로 나눠 담아 이웃 목록을 만들고, 짝 표 matchR 을 전부 -1 로, 방문 표 seen 을 전부 거짓으로 둔다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: {},
      nodeValue: { 0: "-", 1: "-", 2: "-", 10: "-", 11: "-", 12: "-" },
      entries: [
        { label: "matchR", value: "[-, -, -]" },
        { label: "seen", value: "[F, F, F]" },
        { label: "size", value: "0" },
        { label: "갈래", value: "①② 준비" },
      ],
    },
    {
      title: "T2 L0 에서 탐색을 시작한다",
      detail:
        "바깥 반복이 왼쪽 정점 L0 을 집는다. 방문 표를 전부 거짓으로 다시 채우고 증대 경로 탐색에 들어간다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 0: "active" },
      nodeValue: { 0: "-", 1: "-", 2: "-", 10: "-", 11: "-", 12: "-" },
      entries: [
        { label: "matchR", value: "[-, -, -]" },
        { label: "seen", value: "[F, F, F]" },
        { label: "size", value: "0" },
        { label: "갈래", value: "⑨ 방문 표를 새로 채운다" },
      ],
    },
    {
      title: "T3 L0 이 R0 을 보고 바로 잇는다",
      detail:
        "L0 의 첫 이웃 R0 은 짝이 없는 자리라 그대로 이어 붙인다. 증대 경로의 길이가 간선 하나다. size 는 탐색이 끝나고 바깥 반복으로 돌아간 뒤에 올라가므로 아직 0 이다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 0: "visited", 10: "visited" },
      nodeValue: { 0: "R0", 1: "-", 2: "-", 10: "L0", 11: "-", 12: "-" },
      activeEdge: { from: 0, to: 10 },
      entries: [
        { label: "matchR", value: "[0, -, -]" },
        { label: "seen", value: "[T, F, F]" },
        { label: "size", value: "0" },
        { label: "갈래", value: "⑤⑦ 빈자리를 만나 잇는다" },
      ],
    },
    {
      title: "T4 L1 에서 탐색을 시작한다",
      detail:
        "방문 표를 다시 전부 거짓으로 채운다. 앞 탐색이 R0 을 봤다는 표시가 여기서 지워진다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 0: "visited", 10: "visited", 1: "active" },
      nodeValue: { 0: "R0", 1: "-", 2: "-", 10: "L0", 11: "-", 12: "-" },
      entries: [
        { label: "matchR", value: "[0, -, -]" },
        { label: "seen", value: "[F, F, F]" },
        { label: "size", value: "1" },
        { label: "갈래", value: "⑨ 방문 표를 새로 채운다" },
      ],
    },
    {
      title: "T5 L1 이 R0 을 보고 그 짝 L0 으로 내려간다",
      detail:
        "R0 에는 이미 L0 이 붙어 있다. 여기서 멈추지 않고 L0 이 다른 자리로 옮겨 갈 수 있는지 본다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 1: "active", 10: "frontier", 0: "frontier" },
      nodeValue: { 0: "R0", 1: "-", 2: "-", 10: "L0", 11: "-", 12: "-" },
      activeEdge: { from: 1, to: 10 },
      entries: [
        { label: "matchR", value: "[0, -, -]" },
        { label: "seen", value: "[T, F, F]" },
        { label: "size", value: "1" },
        { label: "갈래", value: "⑥ 짝이 있는 자리라 내려간다" },
      ],
    },
    {
      title: "T6 L0 이 R0 을 다시 보지만 이미 본 자리다",
      detail:
        "L0 의 첫 이웃은 R0 인데 이번 탐색이 방금 봤다. 다시 보면 같은 자리를 되풀이하게 되므로 넘어간다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 0: "active", 10: "visited", 1: "frontier" },
      nodeValue: { 0: "R0", 1: "-", 2: "-", 10: "L0", 11: "-", 12: "-" },
      activeEdge: { from: 0, to: 10 },
      entries: [
        { label: "matchR", value: "[0, -, -]" },
        { label: "seen", value: "[T, F, F]" },
        { label: "size", value: "1" },
        { label: "갈래", value: "④ 이미 본 자리라 넘어간다" },
      ],
    },
    {
      title: "T7 L0 이 R1 을 보고 그리로 옮겨 간다",
      detail:
        "L0 의 다음 이웃 R1 은 짝이 없다. 여기가 증대 경로의 끝이고, 이 자리에서 matchR[1] 에 L0 을 적는다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 0: "active", 11: "active", 10: "visited", 1: "frontier" },
      nodeValue: { 0: "R1", 1: "-", 2: "-", 10: "L0", 11: "L0", 12: "-" },
      activeEdge: { from: 0, to: 11 },
      entries: [
        { label: "matchR", value: "[0, 0, -]" },
        { label: "seen", value: "[T, T, F]" },
        { label: "size", value: "1" },
        { label: "갈래", value: "⑤⑦ 빈자리를 만나 잇는다" },
      ],
    },
    {
      title: "T8 되돌아와 R0 의 짝을 L1 로 고쳐 적는다",
      detail:
        "L0 이 R1 로 옮겨 갔으니 R0 이 비었다. 그 자리에 L1 을 적으면 이 탐색이 성공으로 끝난다. matchR 의 짝은 둘이 됐고 size 는 바깥 반복으로 돌아간 뒤에 2 가 된다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        10: "visited",
        11: "visited",
      },
      nodeValue: { 0: "R1", 1: "R0", 2: "-", 10: "L1", 11: "L0", 12: "-" },
      activeEdge: { from: 1, to: 10 },
      entries: [
        { label: "matchR", value: "[1, 0, -]" },
        { label: "seen", value: "[T, T, F]" },
        { label: "size", value: "1" },
        { label: "갈래", value: "⑦ 경로를 뒤집어 자리를 적는다" },
      ],
    },
    {
      title: "T9 L2 에서 탐색을 시작한다",
      detail: "방문 표를 다시 비운다. 남은 왼쪽 정점은 L2 하나다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        10: "visited",
        11: "visited",
        2: "active",
      },
      nodeValue: { 0: "R1", 1: "R0", 2: "-", 10: "L1", 11: "L0", 12: "-" },
      entries: [
        { label: "matchR", value: "[1, 0, -]" },
        { label: "seen", value: "[F, F, F]" },
        { label: "size", value: "2" },
        { label: "갈래", value: "⑨ 방문 표를 새로 채운다" },
      ],
    },
    {
      title: "T10 L2 가 R0 을 보고 그 짝 L1 로 내려간다",
      detail:
        "L2 의 이웃은 R0 하나뿐이다. R0 에는 L1 이 붙어 있으므로 L1 이 옮겨 갈 자리가 있는지 본다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 2: "active", 10: "frontier", 1: "frontier" },
      nodeValue: { 0: "R1", 1: "R0", 2: "-", 10: "L1", 11: "L0", 12: "-" },
      activeEdge: { from: 2, to: 10 },
      entries: [
        { label: "matchR", value: "[1, 0, -]" },
        { label: "seen", value: "[T, F, F]" },
        { label: "size", value: "2" },
        { label: "갈래", value: "⑥ 짝이 있는 자리라 내려간다" },
      ],
    },
    {
      title: "T12 L1 의 이웃이 다 떨어져 실패를 돌려준다",
      detail:
        "T11 은 L1 이 R0 을 다시 본 걸음이라 넘어갔다. L1 의 이웃은 R0 뿐이었으므로 여기서 실패가 된다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: { 1: "active", 10: "visited", 2: "frontier" },
      nodeValue: { 0: "R1", 1: "R0", 2: "-", 10: "L1", 11: "L0", 12: "-" },
      entries: [
        { label: "matchR", value: "[1, 0, -]" },
        { label: "seen", value: "[T, F, F]" },
        { label: "size", value: "2" },
        { label: "갈래", value: "⑧ 증대 경로가 없어 실패한다" },
      ],
    },
    {
      title: "T14 매칭 크기 2 를 돌려준다",
      detail:
        "T13 에서 L2 도 실패로 끝났다. 왼쪽 정점을 다 봤으므로 짝 표에 적힌 두 쌍이 답이다. R2 는 어느 왼쪽 정점과도 이어지지 않아 끝까지 비어 있다.",
      nodes: [
        { id: 0, label: "L0", x: 22, y: 20 },
        { id: 1, label: "L1", x: 22, y: 50 },
        { id: 2, label: "L2", x: 22, y: 80 },
        { id: 10, label: "R0", x: 78, y: 20 },
        { id: 11, label: "R1", x: 78, y: 50 },
        { id: 12, label: "R2", x: 78, y: 80 },
      ],
      edges: [
        { from: 0, to: 10, directed: false },
        { from: 0, to: 11, directed: false },
        { from: 1, to: 10, directed: false },
        { from: 2, to: 10, directed: false },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        10: "visited",
        11: "visited",
      },
      nodeValue: { 0: "R1", 1: "R0", 2: "-", 10: "L1", 11: "L0", 12: "-" },
      entries: [
        { label: "matchR", value: "[1, 0, -]" },
        { label: "seen", value: "[T, F, F]" },
        { label: "size", value: "2" },
        { label: "반환값", value: "2" },
      ],
    },
  ] satisfies Frame[],
};
