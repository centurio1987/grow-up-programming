import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(16)와 같다 — P3 이 그 관계를 잰다.
 *
 * **뷰가 둘이다** — `graph` 는 정점이 지금 경로 안에 있는지(`frontier`), 방금 진입한
 * 정점인지(`active`), 결과에 담긴 경로의 끝인지(`visited`)를 그리고, `keyValue` 는 그 순간의
 * `path` · `onPath` · `result` 와 어느 갈래가 실행됐는지를 적는다. 그래프 그림만으로는
 * **표시를 언제 지웠는지**가 확인되지 않고 이 알고리즘의 전부가 그 자리에 있으므로, 두
 * 패널이 함께 있어야 한 프레임이 완결된다. 앞선 `dfsTraversal`·`connectedComponents` ·
 * `bfsShortestPath` 가 쓴 짝을 그대로 쓴다.
 *
 * 좌표는 0~100 정규화다. 간선에 방향이 있으므로 `directed: true` 를 붙인다. 정점 3 은 간선이
 * 하나도 없어 오른쪽 위에 떨어뜨려 두고, 막다른 정점 5 는 오른쪽 아래에 둔다.
 *
 * `nodeValue` 는 **지금 경로에서의 자리**(1 부터)다. 거리가 아니라 경로를 만드는 편이라
 * 정점 옆에 붙는 수도 경로 안의 자리여야 한다. 되돌아간 정점은 값이 함께 사라진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const allPathsWalk = {
  view: ["graph", "keyValue"] as const,
  title: "dfsAllPaths(6, [[0,2],[0,1],[1,2],[1,4],[2,0],[2,4],[2,5],[5,5]], 0, 4)",
  result: "[[0,1,2,4],[0,1,4],[0,2,4]]",
  steps: [
    {
      title: "T1 walk(0) 에 진입한다",
      detail:
        "시작 정점 0 의 표시를 켜고 경로에 담는다. 도착 정점이 아니라 이웃 목록으로 내려간다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "active" },
      nodeValue: { 0: 1 },
      entries: [
        { label: "path", value: "[0]" },
        { label: "onPath", value: "{0}" },
        { label: "result", value: "[]" },
        { label: "분기", value: "진입" },
      ],
    },
    {
      title: "T2 walk(1) 에 진입한다",
      detail:
        "adj[0] = [1, 2] 의 첫 이웃 1 은 경로에 없다. 한 칸 내려간다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "active" },
      nodeValue: { 0: 1, 1: 2 },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "path", value: "[0, 1]" },
        { label: "onPath", value: "{0, 1}" },
        { label: "result", value: "[]" },
        { label: "분기", value: "③ 경로에 없는 이웃" },
      ],
    },
    {
      title: "T3 walk(2) 에 진입한다",
      detail:
        "adj[1] = [2, 4] 의 첫 이웃 2 로 내려간다. 작은 번호를 먼저 보는 것이 사전식 순서를 만든다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: 1, 1: 2, 2: 3 },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "path", value: "[0, 1, 2]" },
        { label: "onPath", value: "{0, 1, 2}" },
        { label: "result", value: "[]" },
        { label: "분기", value: "③ 경로에 없는 이웃" },
      ],
    },
    {
      title: "T4 이웃 0 에서 막힌다",
      detail:
        "adj[2] = [0, 4, 5] 의 첫 이웃 0 은 지금 경로 안에 있다. 다시 담으면 단순 경로가 아니다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: 1, 1: 2, 2: 3 },
      activeEdge: { from: 2, to: 0 },
      entries: [
        { label: "path", value: "[0, 1, 2]" },
        { label: "onPath", value: "{0, 1, 2}" },
        { label: "result", value: "[]" },
        { label: "분기", value: "② 경로 안에 있는 이웃" },
      ],
    },
    {
      title: "T5 walk(4) 에 진입해 경로를 담는다",
      detail:
        "4 는 도착 정점이다. 지금 경로를 복사해 결과에 담고 여기서 더 내려가지 않는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "frontier", 4: "visited" },
      nodeValue: { 0: 1, 1: 2, 2: 3, 4: 4 },
      activeEdge: { from: 2, to: 4 },
      entries: [
        { label: "path", value: "[0, 1, 2, 4]" },
        { label: "onPath", value: "{0, 1, 2, 4}" },
        { label: "result", value: "[[0,1,2,4]]" },
        { label: "분기", value: "① 도착 정점" },
      ],
    },
    {
      title: "T6 walk(4) 에서 되돌아간다",
      detail:
        "표시를 지우고 경로 끝에서 뺀다. 정점 4 가 다시 열려 다음 경로에서 쓸 수 있다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: 1, 1: 2, 2: 3 },
      entries: [
        { label: "path", value: "[0, 1, 2]" },
        { label: "onPath", value: "{0, 1, 2}" },
        { label: "result", value: "[[0,1,2,4]]" },
        { label: "분기", value: "되돌아간다" },
      ],
    },
    {
      title: "T7 walk(5) 에 진입한다",
      detail:
        "adj[2] 의 마지막 이웃 5 로 내려간다. adj[5] 가 비어 있어 도착 정점에 도달하지 못한다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "frontier", 5: "active" },
      nodeValue: { 0: 1, 1: 2, 2: 3, 5: 4 },
      activeEdge: { from: 2, to: 5 },
      entries: [
        { label: "path", value: "[0, 1, 2, 5]" },
        { label: "onPath", value: "{0, 1, 2, 5}" },
        { label: "result", value: "[[0,1,2,4]]" },
        { label: "분기", value: "③ 경로에 없는 이웃" },
      ],
    },
    {
      title: "T8 walk(5) 와 walk(2) 에서 되돌아간다",
      detail:
        "정점 5 는 아무것도 담지 못하고 되돌아간다. 정점 2 도 이웃을 다 확인해 되돌아간다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "active" },
      nodeValue: { 0: 1, 1: 2 },
      entries: [
        { label: "path", value: "[0, 1]" },
        { label: "onPath", value: "{0, 1}" },
        { label: "result", value: "[[0,1,2,4]]" },
        { label: "분기", value: "되돌아간다" },
      ],
    },
    {
      title: "T9 walk(4) 에 진입해 두 번째 경로를 담는다",
      detail:
        "adj[1] 의 다음 이웃 4 다. T6 에서 표시를 지웠기 때문에 여기서 다시 담을 수 있다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 4: "visited" },
      nodeValue: { 0: 1, 1: 2, 4: 3 },
      activeEdge: { from: 1, to: 4 },
      entries: [
        { label: "path", value: "[0, 1, 4]" },
        { label: "onPath", value: "{0, 1, 4}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4]]" },
        { label: "분기", value: "① 도착 정점" },
      ],
    },
    {
      title: "T10 walk(4) 와 walk(1) 에서 되돌아간다",
      detail:
        "정점 1 의 이웃 [2, 4] 를 다 확인했다. 경로에 정점 0 만 남는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "active" },
      nodeValue: { 0: 1 },
      entries: [
        { label: "path", value: "[0]" },
        { label: "onPath", value: "{0}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4]]" },
        { label: "분기", value: "되돌아간다" },
      ],
    },
    {
      title: "T11 walk(2) 에 진입한다",
      detail:
        "adj[0] 의 다음 이웃 2 다. 정점 2 는 T8 에서 표시가 지워져 다시 열려 있다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 2: "active" },
      nodeValue: { 0: 1, 2: 2 },
      activeEdge: { from: 0, to: 2 },
      entries: [
        { label: "path", value: "[0, 2]" },
        { label: "onPath", value: "{0, 2}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4]]" },
        { label: "분기", value: "③ 경로에 없는 이웃" },
      ],
    },
    {
      title: "T12 이웃 0 에서 다시 막힌다",
      detail:
        "adj[2] 의 첫 이웃 0 은 여전히 경로 안에 있다. 시작 정점으로 되돌아가는 간선이 여기서 걸린다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 2: "active" },
      nodeValue: { 0: 1, 2: 2 },
      activeEdge: { from: 2, to: 0 },
      entries: [
        { label: "path", value: "[0, 2]" },
        { label: "onPath", value: "{0, 2}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4]]" },
        { label: "분기", value: "② 경로 안에 있는 이웃" },
      ],
    },
    {
      title: "T13 walk(4) 에 진입해 세 번째 경로를 담는다",
      detail:
        "adj[2] 의 다음 이웃 4 다. 결과가 사전식 순서 그대로 세 개가 됐다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 2: "frontier", 4: "visited" },
      nodeValue: { 0: 1, 2: 2, 4: 3 },
      activeEdge: { from: 2, to: 4 },
      entries: [
        { label: "path", value: "[0, 2, 4]" },
        { label: "onPath", value: "{0, 2, 4}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4], [0,2,4]]" },
        { label: "분기", value: "① 도착 정점" },
      ],
    },
    {
      title: "T14 walk(4) 에서 되돌아간다",
      detail:
        "표시를 지우고 경로 끝에서 뺀다. adj[2] 에는 아직 이웃 5 가 남아 있다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 2: "active" },
      nodeValue: { 0: 1, 2: 2 },
      entries: [
        { label: "path", value: "[0, 2]" },
        { label: "onPath", value: "{0, 2}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4], [0,2,4]]" },
        { label: "분기", value: "되돌아간다" },
      ],
    },
    {
      title: "T15 walk(5) 에 진입한다",
      detail:
        "두 번째로 정점 5 에 들어간다. 여기서도 아무것도 담지 못하고 되돌아간다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: { 0: "frontier", 2: "frontier", 5: "active" },
      nodeValue: { 0: 1, 2: 2, 5: 3 },
      activeEdge: { from: 2, to: 5 },
      entries: [
        { label: "path", value: "[0, 2, 5]" },
        { label: "onPath", value: "{0, 2, 5}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4], [0,2,4]]" },
        { label: "분기", value: "③ 경로에 없는 이웃" },
      ],
    },
    {
      title: "T16 walk(2) 와 walk(0) 에서 되돌아가 끝난다",
      detail:
        "정점 0 의 이웃을 다 확인했다. 경로와 표시가 시작 직전 상태로 돌아오고 결과 셋이 남는다.",
      nodes: [
        { id: 0, x: 40, y: 8 },
        { id: 1, x: 12, y: 42 },
        { id: 2, x: 62, y: 42 },
        { id: 3, x: 90, y: 12 },
        { id: 4, x: 36, y: 86 },
        { id: 5, x: 90, y: 62 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 0, to: 2, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 1, to: 4, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 4, directed: true },
        { from: 2, to: 5, directed: true },
      ],
      nodeStatus: {},
      entries: [
        { label: "path", value: "[]" },
        { label: "onPath", value: "{}" },
        { label: "result", value: "[[0,1,2,4], [0,1,4], [0,2,4]]" },
        { label: "분기", value: "종료" },
      ],
    },
  ] satisfies Frame[],
};
