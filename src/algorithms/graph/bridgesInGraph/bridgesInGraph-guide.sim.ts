import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수(15)는 그 절의
 * `T#` 단계 수(21)를 넘지 않는다 — P3 이 그 관계를 잰다. 스물한 걸음 가운데 상태가 실제로
 * 바뀌는 자리 열다섯을 골랐고, 건너뛴 걸음은 `detail` 이 번호로 짚는다.
 *
 * **뷰가 둘이다.** `graph` 는 정점의 상태(아직 안 들어감 · 호출 스택에 있음 · 지금 보는 중 ·
 * 이웃을 다 봄)와 지금 읽는 간선을 그리고, `keyValue` 는 그 순간의 호출 스택 · `disc` ·
 * `low` · 지금까지 모은 다리 · 갈래를 적는다. 이 편에서 갈리는 것은 **자식의 `low` 가 부모의
 * `disc` 보다 큰가**라, 그래프 그림의 색만으로는 판정의 근거가 안 보인다.
 *
 * `nodeValue` 는 `disc/low` 를 한 칸에 적는다 — 자식의 `low` 와 부모의 `disc` 를 맞대는 것이
 * 이 절차의 판정이라, 두 값을 떼어 놓으면 독자가 매 프레임 두 줄을 맞대야 한다.
 *
 * **`activeEdge` 는 방향 없는 간선을 읽은 쪽에서 적는다.** T4 의 `1 → 0` 과 T3 의 `0 → 1` 은
 * 같은 간선인데, 어느 쪽 끝에서 읽는가가 갈래를 정하는 것이 이 편의 자리다.
 *
 * 좌표는 0~100 정규화다. 삼각형 `1−2−3` 을 아래쪽에 두고 그 위로 `0−1` 을, 왼쪽으로 `0−5` 를,
 * 오른쪽으로 꼬리 `3−4` 를 늘어뜨려 다리 셋이 그림에서 목이 되는 자리에 오게 했다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가
 * 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const bridgesWalk = {
  view: ["graph", "keyValue"] as const,
  title: "bridgesInGraph(6, [[0,1],[1,2],[2,3],[3,1],[3,4],[0,5]])",
  result: "[[0, 1], [0, 5], [3, 4]]",
  steps: [
    {
      title: "T1 준비",
      detail:
        "간선 목록을 양쪽 정점에 나눠 담아 이웃 목록을 만들고, 그때 쓴 간선 번호를 같은 자리에 적는다. disc 와 low 를 전부 -1 로 두고 timer 를 0 으로 둔다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {},
      nodeValue: { 0: "-/-", 1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-" },
      entries: [
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[-, -, -, -, -, -]" },
        { label: "low", value: "[-, -, -, -, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "①② 준비" },
      ],
    },
    {
      title: "T2 진입",
      detail:
        "바깥 반복이 disc[0] = -1 을 보고 정점 0 으로 들어간다. disc[0] 과 low[0] 에 같은 수 0 을 적고 호출 스택에 담는다. 내려올 때 쓴 간선 자리에는 -1 이 들어간다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: { 0: "active" },
      nodeValue: { 0: "0/0", 1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-" },
      entries: [
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, -, -, -, -, -]" },
        { label: "low", value: "[0, -, -, -, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "③ 진입" },
      ],
    },
    {
      title: "T3 내려감",
      detail:
        "정점 0 의 첫 이웃은 간선 0 으로 이어진 정점 1 이다. 처음 보는 정점이라 나무 간선으로 삼고 그리로 내려간다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "호출 스택", value: "[0, 1]" },
        { label: "disc", value: "[0, 1, -, -, -, -]" },
        { label: "low", value: "[0, 1, -, -, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "⑤③ 내려감" },
      ],
    },
    {
      title: "T4 넘어감",
      detail:
        "정점 1 에서 간선 0 으로 이어진 정점 0 을 읽는다. 내려올 때 쓴 바로 그 간선이라 아무것도 하지 않고 다음 자리로 넘어간다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 1, to: 0 },
      entries: [
        { label: "호출 스택", value: "[0, 1]" },
        { label: "disc", value: "[0, 1, -, -, -, -]" },
        { label: "low", value: "[0, 1, -, -, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "④ 넘어감" },
      ],
    },
    {
      title: "T5 내려감",
      detail:
        "정점 1 의 다음 이웃은 간선 1 로 이어진 정점 2 다. 처음 보는 정점이라 내려간다. T6 은 정점 2 에서 간선 1 을 되읽고 넘어가는 걸음이다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "-/-", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, -, -, -]" },
        { label: "low", value: "[0, 1, 2, -, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "⑤③ 내려감" },
      ],
    },
    {
      title: "T7 내려감",
      detail:
        "정점 2 에서 간선 2 로 이어진 정점 3 으로 내려간다. 여기까지가 삼각형 1−2−3 의 세 정점이다. T8 은 정점 3 에서 간선 2 를 되읽고 넘어가는 걸음이다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "frontier", 3: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "3/3", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2, 3]" },
        { label: "disc", value: "[0, 1, 2, 3, -, -]" },
        { label: "low", value: "[0, 1, 2, 3, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "⑤③ 내려감" },
      ],
    },
    {
      title: "T9 되돌아감",
      detail:
        "정점 3 에서 간선 3 으로 정점 1 을 읽는다. 이미 들어갔던 정점이고 내려올 때 쓴 간선도 아니라 되돌아가는 간선이다. low[3] 이 disc[1] = 1 까지 내려간다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "frontier", 3: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "3/1", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 3, to: 1 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2, 3]" },
        { label: "disc", value: "[0, 1, 2, 3, -, -]" },
        { label: "low", value: "[0, 1, 2, 1, -, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "⑥ 되돌아감" },
      ],
    },
    {
      title: "T10 내려감",
      detail:
        "정점 3 의 남은 이웃은 간선 4 로 이어진 정점 4 다. 꼬리 쪽으로 내려간다. T11 은 정점 4 에서 간선 4 를 되읽고 넘어가는 걸음이다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "active",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "3/1", 4: "4/4", 5: "-/-" },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2, 3, 4]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 2, 1, 4, -]" },
        { label: "다리", value: "[]" },
        { label: "갈래", value: "⑤③ 내려감" },
      ],
    },
    {
      title: "T12 판정",
      detail:
        "정점 4 는 이웃을 다 봤다. 빼면서 low[4] = 4 를 부모 3 의 disc = 3 과 맞대면 4 가 3 보다 커서 간선 3−4 가 다리다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "active",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "3/1", 4: "4/4", 5: "-/-" },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2, 3]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 2, 1, 4, -]" },
        { label: "다리", value: "3−4" },
        { label: "갈래", value: "⑦⑧ 판정" },
      ],
    },
    {
      title: "T13 복귀",
      detail:
        "정점 3 을 뺀다. low[3] = 1 을 부모 2 의 disc = 2 와 맞대면 1 이 2 보다 크지 않아 간선 2−3 은 다리가 아니다. 부모의 low[2] 도 1 로 내려간다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "active",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/1", 3: "3/1", 4: "4/4", 5: "-/-" },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 1, 1, 4, -]" },
        { label: "다리", value: "3−4" },
        { label: "갈래", value: "⑦ 복귀" },
      ],
    },
    {
      title: "T15 되돌아감",
      detail:
        "정점 1 이 남은 이웃 3 을 읽는다. 같은 되돌아가는 간선을 위쪽 끝에서 다시 읽는 자리이고, disc[3] = 3 은 low[1] = 1 보다 커서 값이 안 바뀐다. 바로 앞 T14 는 정점 2 를 뺀 걸음이다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "active",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/1", 3: "3/1", 4: "4/4", 5: "-/-" },
      activeEdge: { from: 1, to: 3 },
      entries: [
        { label: "호출 스택", value: "[0, 1]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 1, 1, 4, -]" },
        { label: "다리", value: "3−4" },
        { label: "갈래", value: "⑥ 되돌아감" },
      ],
    },
    {
      title: "T16 판정",
      detail:
        "정점 1 을 뺀다. low[1] = 1 을 부모 0 의 disc = 0 과 맞대면 1 이 0 보다 커서 간선 0−1 이 다리다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "active",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/1", 3: "3/1", 4: "4/4", 5: "-/-" },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 1, 1, 4, -]" },
        { label: "다리", value: "0−1 3−4" },
        { label: "갈래", value: "⑦⑧ 판정" },
      ],
    },
    {
      title: "T17 내려감",
      detail:
        "정점 0 의 남은 이웃은 간선 5 로 이어진 정점 5 다. 처음 보는 정점이라 내려간다. T18 은 정점 5 에서 간선 5 를 되읽고 넘어가는 걸음이다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "active",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/1", 3: "3/1", 4: "4/4", 5: "5/5" },
      activeEdge: { from: 0, to: 5 },
      entries: [
        { label: "호출 스택", value: "[0, 5]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "low", value: "[0, 1, 1, 1, 4, 5]" },
        { label: "다리", value: "0−1 3−4" },
        { label: "갈래", value: "⑤③ 내려감" },
      ],
    },
    {
      title: "T19 판정",
      detail:
        "정점 5 를 뺀다. low[5] = 5 가 disc[0] = 0 보다 커서 간선 0−5 도 다리다. 뿌리 0 은 나무 자식이 둘인데도 따로 볼 규칙이 없다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "active",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/1", 3: "3/1", 4: "4/4", 5: "5/5" },
      activeEdge: { from: 0, to: 5 },
      entries: [
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "low", value: "[0, 1, 1, 1, 4, 5]" },
        { label: "다리", value: "0−1 0−5 3−4" },
        { label: "갈래", value: "⑦⑧ 판정" },
      ],
    },
    {
      title: "T21 반환",
      detail:
        "T20 에서 정점 0 을 빼면 호출 스택이 빈다. 모은 다리를 사전순으로 정렬해 돌려준다.",
      nodes: [
        { id: 0, x: 30, y: 18 },
        { id: 1, x: 52, y: 18 },
        { id: 2, x: 40, y: 78 },
        { id: 3, x: 66, y: 78 },
        { id: 4, x: 92, y: 78 },
        { id: 5, x: 8, y: 18 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 3, directed: false },
        { from: 3, to: 1, directed: false },
        { from: 3, to: 4, directed: false },
        { from: 0, to: 5, directed: false },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/1", 3: "3/1", 4: "4/4", 5: "5/5" },
      entries: [
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "low", value: "[0, 1, 1, 1, 4, 5]" },
        { label: "다리", value: "0−1 0−5 3−4" },
        { label: "갈래", value: "⑨ 반환" },
      ],
    },
  ] satisfies Frame[],
};
