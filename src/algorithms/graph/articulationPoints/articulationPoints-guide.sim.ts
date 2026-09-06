import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수(12)는 그 절의
 * `T#` 단계 수(19)를 넘지 않는다 — P3 이 그 관계를 잰다. 걸음 열아홉 중 상태가 실제로 바뀌는
 * 자리 열둘을 골랐고, 건너뛴 걸음은 `detail` 이 이름으로 짚는다.
 *
 * **뷰가 둘이다.** `graph` 는 정점의 상태(아직 안 봄 · 호출 스택에 있음 · 지금 보는 중 ·
 * 이웃을 다 봄)와 지금 읽는 간선을 그리고, `keyValue` 는 그 순간의 호출 스택 · `disc` ·
 * `low` · 단절점 목록 · 갈래를 적는다. 이 편에서 갈리는 것은 **`low` 가 어디까지 내려갔는가**
 * 라 그래프 그림의 색만으로는 판정의 근거가 안 보인다.
 *
 * `nodeValue` 는 `disc/low` 를 한 칸에 적는다 — 자식의 `low` 와 부모의 `disc` 를 맞대는 것이
 * 이 절차의 판정이라, 두 값을 떼어 놓으면 독자가 매 프레임 두 줄을 맞대야 한다.
 *
 * 좌표는 0~100 정규화다. 삼각형 `0−1−2` 를 왼쪽에 두고 꼬리 `0−3−4` 를 오른쪽으로 늘어뜨려,
 * 단절점 0 과 3 이 그림에서 목이 되는 자리에 오게 했다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지). 정적 계수가
 * 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const apWalk = {
  view: ["graph", "keyValue"] as const,
  title: "articulationPoints(5, [[0,1],[1,2],[2,0],[0,3],[3,4]])",
  result: "[0, 3]",
  steps: [
    {
      title: "T1 준비",
      detail:
        "간선 목록을 꼬리와 머리 양쪽에 나눠 담아 이웃 목록을 만들고, disc 와 low 를 전부 -1 로, cut 을 전부 거짓으로 둔다. 호출 스택은 비어 있고 timer 는 0 이다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: {},
      nodeValue: { 0: "-/-", 1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-" },
      entries: [
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[-, -, -, -, -]" },
        { label: "low", value: "[-, -, -, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "①② 준비" },
      ],
    },
    {
      title: "T2 정점 0 에 처음 들어간다",
      detail:
        "바깥 반복이 disc[0] = -1 을 보고 정점 0 으로 들어간다. disc[0] 과 low[0] 에 같은 수 0 을 적고 호출 스택에 담는다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "active" },
      nodeValue: { 0: "0/0", 1: "-/-", 2: "-/-", 3: "-/-", 4: "-/-" },
      entries: [
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, -, -, -, -]" },
        { label: "low", value: "[0, -, -, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "③ 정점에 처음 들어간다" },
      ],
    },
    {
      title: "T3 간선 0−1 을 읽고 정점 1 로 내려간다",
      detail:
        "이웃 목록에서 처음 보는 정점 1 을 만나 나무 간선으로 내려간다. 뿌리 0 의 나무 자식 수가 1 이 된다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "-/-", 3: "-/-", 4: "-/-" },
      activeEdge: { from: 0, to: 1 },
      entries: [
        { label: "호출 스택", value: "[0, 1]" },
        { label: "disc", value: "[0, 1, -, -, -]" },
        { label: "low", value: "[0, 1, -, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "④③ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T5 간선 1−2 를 읽고 정점 2 로 내려간다",
      detail:
        "T4 는 정점 1 에서 부모 0 을 다시 본 걸음이라 아무것도 하지 않았다. T5 가 처음 보는 정점 2 로 내려간다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/2", 3: "-/-", 4: "-/-" },
      activeEdge: { from: 1, to: 2 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, -, -]" },
        { label: "low", value: "[0, 1, 2, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "④③ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T7 되돌아가는 간선 2−0 을 읽는다",
      detail:
        "정점 0 은 이미 들어갔던 정점이고 2 의 부모도 아니다. 되돌아가는 간선이므로 low[2] 를 disc[0] = 0 까지 내린다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "frontier", 2: "active" },
      nodeValue: { 0: "0/0", 1: "1/1", 2: "2/0", 3: "-/-", 4: "-/-" },
      activeEdge: { from: 2, to: 0 },
      entries: [
        { label: "호출 스택", value: "[0, 1, 2]" },
        { label: "disc", value: "[0, 1, 2, -, -]" },
        { label: "low", value: "[0, 1, 0, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "⑤ 되돌아가는 간선에서 값을 내린다" },
      ],
    },
    {
      title: "T8 정점 2 를 호출 스택에서 뺀다",
      detail:
        "정점 2 의 이웃을 다 봤다. low[2] = 0 을 부모 1 에게 전달하고, low[2] = 0 이 disc[1] = 1 보다 작아 정점 1 은 단절점이 아니다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "active", 2: "visited" },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "-/-", 4: "-/-" },
      entries: [
        { label: "호출 스택", value: "[0, 1]" },
        { label: "disc", value: "[0, 1, 2, -, -]" },
        { label: "low", value: "[0, 0, 0, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "⑦ 이웃을 다 본 정점을 뺀다" },
      ],
    },
    {
      title: "T9 정점 1 을 호출 스택에서 뺀다",
      detail:
        "low[1] = 0 을 부모 0 에게 전달한다. 부모 0 은 뿌리라 이 자리의 판정을 쓰지 않는다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "active", 1: "visited", 2: "visited" },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "-/-", 4: "-/-" },
      entries: [
        { label: "호출 스택", value: "[0]" },
        { label: "disc", value: "[0, 1, 2, -, -]" },
        { label: "low", value: "[0, 0, 0, -, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "⑦ 이웃을 다 본 정점을 뺀다" },
      ],
    },
    {
      title: "T11 간선 0−3 을 읽고 정점 3 으로 내려간다",
      detail:
        "T10 은 뿌리 0 에서 되돌아가는 간선 0−2 를 읽었지만 low[0] 이 이미 0 이라 값이 안 바뀌었다. T11 에서 뿌리의 나무 자식 수가 2 가 된다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: { 0: "frontier", 1: "visited", 2: "visited", 3: "active" },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "-/-" },
      activeEdge: { from: 0, to: 3 },
      entries: [
        { label: "호출 스택", value: "[0, 3]" },
        { label: "disc", value: "[0, 1, 2, 3, -]" },
        { label: "low", value: "[0, 0, 0, 3, -]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "④③ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T13 간선 3−4 를 읽고 정점 4 로 내려간다",
      detail:
        "정점 4 는 잎이다. 되돌아가는 간선이 하나도 없어 low[4] 가 자기 진입 시각 4 에 그대로 남는다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "visited",
        2: "visited",
        3: "frontier",
        4: "active",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/4" },
      activeEdge: { from: 3, to: 4 },
      entries: [
        { label: "호출 스택", value: "[0, 3, 4]" },
        { label: "disc", value: "[0, 1, 2, 3, 4]" },
        { label: "low", value: "[0, 0, 0, 3, 4]" },
        { label: "단절점", value: "[]" },
        { label: "갈래", value: "④③ 처음 보는 이웃으로 내려간다" },
      ],
    },
    {
      title: "T15 정점 4 를 빼면서 정점 3 을 단절점으로 적는다",
      detail:
        "low[4] = 4 가 disc[3] = 3 이상이다. 정점 4 의 나무 아래에서 정점 3 위로 가는 길이 없다는 뜻이라 정점 3 이 단절점이다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: {
        0: "frontier",
        1: "visited",
        2: "visited",
        3: "active",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/4" },
      entries: [
        { label: "호출 스택", value: "[0, 3]" },
        { label: "disc", value: "[0, 1, 2, 3, 4]" },
        { label: "low", value: "[0, 0, 0, 3, 4]" },
        { label: "단절점", value: "[3]" },
        { label: "갈래", value: "⑦⑧ 뿌리가 아닌 부모를 단절점으로 적는다" },
      ],
    },
    {
      title: "T17 정점 0 을 빼고 호출 스택이 빈다",
      detail:
        "T16 이 정점 3 을 뺐고, 그 부모 0 은 뿌리라 판정을 안 쓴다. T17 에서 뿌리 자신이 빠지며 이 성분의 탐색이 끝난다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/4" },
      entries: [
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[0, 1, 2, 3, 4]" },
        { label: "low", value: "[0, 0, 0, 3, 4]" },
        { label: "단절점", value: "[3]" },
        { label: "갈래", value: "⑦ 이웃을 다 본 정점을 뺀다" },
      ],
    },
    {
      title: "T18 뿌리 0 을 자식 수로 판정한다",
      detail:
        "뿌리 0 의 나무 자식은 1 과 3 둘이다. 둘 이상이므로 뿌리 규칙으로 정점 0 도 단절점이다.",
      nodes: [
        { id: 0, x: 30, y: 16 },
        { id: 1, x: 10, y: 72 },
        { id: 2, x: 46, y: 74 },
        { id: 3, x: 68, y: 34 },
        { id: 4, x: 92, y: 82 },
      ],
      edges: [
        { from: 0, to: 1, directed: false },
        { from: 1, to: 2, directed: false },
        { from: 2, to: 0, directed: false },
        { from: 0, to: 3, directed: false },
        { from: 3, to: 4, directed: false },
      ],
      nodeStatus: {
        0: "visited",
        1: "visited",
        2: "visited",
        3: "visited",
        4: "visited",
      },
      nodeValue: { 0: "0/0", 1: "1/0", 2: "2/0", 3: "3/3", 4: "4/4" },
      entries: [
        { label: "호출 스택", value: "[]" },
        { label: "disc", value: "[0, 1, 2, 3, 4]" },
        { label: "low", value: "[0, 0, 0, 3, 4]" },
        { label: "단절점", value: "[0, 3]" },
        { label: "갈래", value: "⑨ 뿌리를 자식 수로 판정한다" },
      ],
    },
  ] satisfies Frame[],
};
