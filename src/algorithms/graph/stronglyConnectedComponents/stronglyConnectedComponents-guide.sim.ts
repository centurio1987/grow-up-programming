import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수(12)는 그 절의
 * `T#` 단계 수(17)를 넘지 않는다 — P3 이 그 관계를 잰다. 걸음 열일곱 중 상태가 실제로
 * 바뀌는 자리 열둘을 골랐고, 건너뛴 걸음은 `detail` 이 이름으로 짚는다.
 *
 * **뷰가 둘이다.** `graph` 는 정점의 상태(아직 안 봄 · 스택에 있음 · 지금 보는 중 · 무리가
 * 정해짐)와 지금 읽는 간선을 그리고, `keyValue` 는 그 순간의 스택 · 호출 스택 · `disc` ·
 * `low` · 확정된 무리 · 갈래를 적는다. 이 편에서 갈리는 것은 **정점이 스택에 남아 있는가**라
 * 그래프 그림의 색만으로는 `disc` 와 `low` 가 어떻게 움직이는지가 안 보인다.
 *
 * `nodeValue` 는 `disc/low` 를 한 칸에 적는다 — 둘이 같아지는 순간이 무리의 뿌리 판정이라,
 * 두 값을 떼어 놓으면 독자가 매 프레임 두 줄을 맞대야 한다.
 *
 * 좌표는 0~100 정규화다. 사이클 `0 → 1 → 2 → 0` 을 왼쪽에 삼각형으로 두고, 그 오른쪽에
 * 사이클 `3 ⇄ 4` 를 두어 두 무리가 눈으로 갈리게 했다. 들어오는 간선이 하나도 없는 정점 5 는
 * 오른쪽 위에 떨어뜨려 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const sccWalk = {
  view: ["graph", "keyValue"] as const,
  title:
    "stronglyConnectedComponents(6, [[0,1],[1,2],[2,0],[2,3],[3,4],[4,3],[5,3]])",
  result: "[[0, 1, 2], [3, 4], [5]]",
  steps: [
    {
      title: "T1 준비",
      detail:
        "이웃 목록을 만들고 disc 와 low 를 전부 -1 로, onStack 을 전부 거짓으로 둔다. 스택과 호출 스택은 비어 있고 timer 는 0 이다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {},
      nodeValue: { 0: "-/-", 1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-" },
      entries: [
        { label: "스택", value: "[]" },
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[-, -, -, -, -, -]" },
        { label: "low", value: "[-, -, -, -, -, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "①② 준비" },
      ],
    },
    {
      title: "T2 정점 0 에 처음 들어간다",
      detail:
        "바깥 반복이 disc[0] = -1 을 보고 정점 0 으로 들어간다. disc[0] 과 low[0] 에 같은 수 0 을 적고 스택과 호출 스택에 담는다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: { 0: "active" },
      nodeValue: { 0: "0/0", 1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-", 5: "-/-" },
      entries: [
        { label: "스택", value: "[0]" },
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, -, -, -, -, -]" },
        { label: "low", value: "[0, -, -, -, -, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "③ 정점에 처음 들어간다" },
      ],
    },
    {
      title: "T4 정점 2 까지 내려간다",
      detail:
        "T3 이 간선 0→1 을 읽어 정점 1 로, T4 가 간선 1→2 를 읽어 정점 2 로 내려간다. 셋 다 처음 보는 정점이라 같은 갈래를 지난다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "-/-", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "스택", value: "[0, 1, 2]" },
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, -, -, -]" },
        { label: "low", value: "[0, 1, 2, -, -, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "④ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T5 간선 2→0 — 스택에 있는 정점이다",
      detail:
        "정점 0 은 이미 봤고 아직 스택에 있다. 그래서 low[2] 를 disc[0] = 0 까지 내린다. 여기서 쓰는 것은 low[0] 이 아니라 disc[0] 이다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/0", 3: "-/-", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 2, to: 0 },
      entries: [
        { label: "스택", value: "[0, 1, 2]" },
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, -, -, -]" },
        { label: "low", value: "[0, 1, 0, -, -, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "⑤ 스택에 있는 정점으로 되돌아간다" },
      ],
    },
    {
      title: "T6 간선 2→3 으로 정점 3 에 들어간다",
      detail:
        "정점 2 의 둘째 이웃이 정점 3 이고 아직 안 본 정점이라 내려간다. disc[3] = low[3] = 3 이다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "frontier", 3: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/0", 3: "3/3", 4: "-/-", 5: "-/-" },
      activeEdge: { from: 2, to: 3 },
      entries: [
        { label: "스택", value: "[0, 1, 2, 3]" },
        { label: "호출 스택", value: "[0, 1, 2, 3]" },
        { label: "disc", value: "[0, 1, 2, 3, -, -]" },
        { label: "low", value: "[0, 1, 0, 3, -, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "④ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T7 간선 3→4 로 정점 4 에 들어간다",
      detail:
        "스택이 다섯 칸으로 가장 길어지는 자리다. 정점 여섯 중 다섯이 아직 어느 무리로도 정해지지 않았다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "active",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/0", 3: "3/3", 4: "4/4", 5: "-/-" },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "스택", value: "[0, 1, 2, 3, 4]" },
        { label: "호출 스택", value: "[0, 1, 2, 3, 4]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 0, 3, 4, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "④ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T8 간선 4→3 — low[4] 가 3 으로 내려간다",
      detail:
        "정점 3 이 스택에 있으므로 low[4] = min(4, disc[3] = 3) = 3 이다. low[4] 가 disc[4] = 4 와 달라져 정점 4 는 뿌리가 아니다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "frontier",
        3: "frontier",
        4: "active",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/0", 3: "3/3", 4: "4/3", 5: "-/-" },
      activeEdge: { from: 4, to: 3 },
      entries: [
        { label: "스택", value: "[0, 1, 2, 3, 4]" },
        { label: "호출 스택", value: "[0, 1, 2, 3, 4]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 0, 3, 3, -]" },
        { label: "확정된 무리", value: "[]" },
        { label: "갈래", value: "⑤ 스택에 있는 정점으로 되돌아간다" },
      ],
    },
    {
      title: "T10 정점 3 이 뿌리다 — 무리 [3, 4] 를 걷어낸다",
      detail:
        "T9 가 정점 4 를 호출 스택에서 빼며 low[3] = min(3, low[4] = 3) = 3 을 적었다. 이제 low[3] 이 disc[3] 과 같으므로 스택 위에서 정점 3 이 나올 때까지 빼내 무리로 묶는다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "frontier",
        1: "frontier",
        2: "active",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/0", 3: "3/3", 4: "4/3", 5: "-/-" },
      entries: [
        { label: "스택", value: "[0, 1, 2]" },
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 1, 0, 3, 3, -]" },
        { label: "확정된 무리", value: "[[3, 4]]" },
        { label: "갈래", value: "⑧ 무리의 뿌리에서 걷어낸다" },
      ],
    },
    {
      title: "T12 되돌아가는 값이 2 → 1 → 0 으로 전달된다",
      detail:
        "T11 이 정점 2 를 빼며 low[1] 을 0 으로, T12 가 정점 1 을 빼며 low[0] 을 0 으로 적는다. 정점 2 와 1 은 low 가 disc 와 달라 뿌리가 아니고 스택에 그대로 남는다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "active",
        1: "frontier",
        2: "frontier",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/3", 5: "-/-" },
      entries: [
        { label: "스택", value: "[0, 1, 2]" },
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 0, 0, 3, 3, -]" },
        { label: "확정된 무리", value: "[[3, 4]]" },
        { label: "갈래", value: "⑦ 이웃을 다 본 정점을 뺀다" },
      ],
    },
    {
      title: "T13 정점 0 이 뿌리다 — 무리 [0, 1, 2] 를 걷어낸다",
      detail:
        "low[0] = disc[0] = 0 이라 스택을 정점 0 이 나올 때까지 비운다. 스택이 비고 바깥 반복이 정점 5 로 넘어간다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/3", 5: "-/-" },
      entries: [
        { label: "스택", value: "[]" },
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, -]" },
        { label: "low", value: "[0, 0, 0, 3, 3, -]" },
        { label: "확정된 무리", value: "[[3, 4], [0, 1, 2]]" },
        { label: "갈래", value: "⑧ 무리의 뿌리에서 걷어낸다" },
      ],
    },
    {
      title: "T15 간선 5→3 — 무리가 이미 정해진 정점이다",
      detail:
        "T14 가 정점 5 에 들어갔고 그 이웃이 정점 3 이다. 정점 3 은 이미 봤지만 스택에 없으므로 low[5] 를 건드리지 않는다. 정점 3 에서 정점 5 로 돌아오는 길이 없다는 것이 그 표시의 뜻이다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "active",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/3", 5: "5/5" },
      activeEdge: { from: 5, to: 3 },
      entries: [
        { label: "스택", value: "[5]" },
        { label: "호출 스택", value: "[5]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "low", value: "[0, 0, 0, 3, 3, 5]" },
        { label: "확정된 무리", value: "[[3, 4], [0, 1, 2]]" },
        { label: "갈래", value: "⑥ 무리가 정해진 정점이라 무시한다" },
      ],
    },
    {
      title: "T17 반환",
      detail:
        "T16 이 정점 5 를 뿌리로 판정해 무리 [5] 를 걷어냈다. 찾은 순서는 [3, 4] · [0, 1, 2] · [5] 이고, 반환 직전에 첫 원소 기준으로 정렬해 [[0, 1, 2], [3, 4], [5]] 를 돌려준다.",
      nodes: [
        { id: 0, x: 14, y: 18 },
        { id: 1, x: 14, y: 76 },
        { id: 2, x: 42, y: 48 },
        { id: 3, x: 72, y: 26 },
        { id: 4, x: 72, y: 84 },
        { id: 5, x: 95, y: 8 },
      ],
      edges: [
        { from: 0, to: 1, directed: true },
        { from: 1, to: 2, directed: true },
        { from: 2, to: 0, directed: true },
        { from: 2, to: 3, directed: true },
        { from: 3, to: 4, directed: true },
        { from: 4, to: 3, directed: true },
        { from: 5, to: 3, directed: true },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
        5: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/3", 5: "5/5" },
      entries: [
        { label: "스택", value: "[]" },
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[0, 1, 2, 3, 4, 5]" },
        { label: "low", value: "[0, 0, 0, 3, 3, 5]" },
        { label: "확정된 무리", value: "[[3, 4], [0, 1, 2], [5]]" },
        { label: "갈래", value: "반환 직전에 첫 원소 기준으로 정렬한다" },
      ],
    },
  ] satisfies Frame[],
};
