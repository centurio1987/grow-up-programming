import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(11)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`tree` 카테고리의 다섯 번째 편이다.** `treeDiameter`(W2) · `lowestCommonAncestor`(배치1) ·
 * `heavyLightDecomposition`(배치3) · `treeRerooting`(배치5)이 세운 규약을 이어받는다.
 *
 * 1. **이어받음 — `root` 는 그 걸음 끝의 구조 전체다.** 프레임마다 트리 한 벌을 통째로 적는다.
 * 2. **이어받음 — 뿌리가 끝까지 정점 0 으로 고정이다.** 이 문제는 생성자가 뿌리를 인자로
 *    받고 그 뿌리가 바뀌지 않으므로, 그림에서 뿌리가 움직이면 그것이 절차의 자유도로 읽힌다.
 * 3. **이어받음 — `label` 이 글자 하나가 아니라 둘을 담는다**(`1 · 2` 꼴). 정점 번호와 그
 *    정점이 받은 **자리**(`tin[v]`)다. 아직 자리를 안 받았으면 `-` 로 둔다. **뜻을 끝까지
 *    바꾸지 않는다** — 구간 끝 `tout[v]` 나 값 `value[v]` 를 같은 칸에 섞으면 같은 자리의
 *    숫자가 걸음마다 다른 것을 뜻하게 된다. 그 둘은 `keyValue` 가 진다.
 * 4. **이어받음 — `children` 에 `null` 을 넣지 않는다.** 이 트리에는 「빈 자리」가 없다.
 * 5. **늘었다 — 상태 값 넷이 국면마다 다른 축을 뜻한다.** 자리 매기기(T2~T6)에서는 `active`
 *    이 걸음에 자리나 구간 끝이 정해진 정점 · `frontier` 스택에 남아 있는 정점 · `visited`
 *    구간 끝까지 정해진 정점 · `default` 아직 자리를 못 받은 정점이다. 담기(T7)에서는
 *    `visited` 가 값이 펜윅 트리에 들어간 정점 전부다. 작업 처리(T8~T11)에서는 `active` 이
 *    걸음이 건드린 정점 · `visited` 그 답에 값이 들어간 정점 · `default` 나머지다.
 *    값을 늘리면 색이 여덟 가지가 되어 그림을 읽을 수 없다.
 *
 * **`tree` 가 못 담는 것을 `keyValue` 가 진다.** 넷이다 — ① **자리별로 늘어놓은 값 배열**은
 * 정점을 한 줄로 늘어놓은 것이라 위에서 아래로 가는 간선으로 그릴 수 없다. ② **펜윅 트리의
 * 칸**은 자리가 아니라 자리 구간을 담는 칸이라 정점에 붙일 자리가 없다. ③ **스택의 내용**은
 * 걸음마다 길이가 달라지는 목록이다. ④ **구간 끝 `tout`** 는 라벨을 두 뜻으로 쓰지 않기로
 * 한 규약(3번) 때문에 노드 밖에 둔다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const subtreeWalk = {
  view: ["tree", "keyValue"] as const,
  title:
    "new SubtreeSumQuery(6, [[0,1],[0,2],[1,3],[1,4],[2,5]], 0, [1,2,3,4,5,6])",
  result: "26",
  steps: [
    {
      title: "T1 이웃 목록을 만들고 정점마다의 칸을 준비한다",
      detail:
        "무방향 간선 하나를 양쪽 정점의 목록에 넣는다. 자리 tin 과 구간 끝 tout 은 아직 아무 정점도 못 받았고, 값 value 는 생성자가 받은 그대로다.",
      root: {
        id: 0,
        label: "0 · -",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · -",
            status: "default",
            children: [
              { id: 3, label: "3 · -", status: "default" },
              { id: 4, label: "4 · -", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · -",
            status: "default",
            children: [{ id: 5, label: "5 · -", status: "default" }],
          },
        ],
      },
      entries: [
        {
          label: "near",
          value: "0:[1,2] 1:[0,3,4] 2:[0,5] 3:[1] 4:[1] 5:[2]",
        },
        { label: "자리 tin", value: "- - - - - -" },
        { label: "구간 끝 tout", value: "- - - - - -" },
        { label: "값 value", value: "1 2 3 4 5 6" },
        { label: "스택", value: "[]" },
      ],
    },
    {
      title: "T2 뿌리 0 에 자리 0 을 주고 스택에 담는다",
      detail:
        "뿌리는 순회를 시작하는 정점이라 첫 자리를 받는다. timer 는 다음에 나갈 자리를 가리키므로 1 이 된다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · -",
            status: "default",
            children: [
              { id: 3, label: "3 · -", status: "default" },
              { id: 4, label: "4 · -", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · -",
            status: "default",
            children: [{ id: 5, label: "5 · -", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "자리 tin", value: "0 - - - - -" },
        { label: "구간 끝 tout", value: "- - - - - -" },
        { label: "timer", value: "1" },
        { label: "스택", value: "[0]" },
      ],
    },
    {
      title: "T3 정점 0 의 첫 이웃 1 로 내려간다",
      detail:
        "near[0] 의 첫 항목이 1 이고 아직 자리를 안 받았으므로 자리 1 을 주고 스택에 담는다. 스택의 맨 위가 정점 1 로 바뀐다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "active",
            children: [
              { id: 3, label: "3 · -", status: "default" },
              { id: 4, label: "4 · -", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · -",
            status: "default",
            children: [{ id: 5, label: "5 · -", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "자리 tin", value: "0 1 - - - -" },
        { label: "구간 끝 tout", value: "- - - - - -" },
        { label: "timer", value: "2" },
        { label: "스택", value: "[0, 1]" },
      ],
    },
    {
      title: "T4 정점 1 의 이웃 0 은 건너뛰고 이웃 3 으로 내려간다",
      detail:
        "near[1] 의 첫 항목은 0 인데 이미 자리를 받았다 — 부모 방향이라 아무것도 하지 않는다. 다음 항목 3 에 자리 2 를 준다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "frontier",
            children: [
              { id: 3, label: "3 · 2", status: "active" },
              { id: 4, label: "4 · -", status: "default" },
            ],
          },
          {
            id: 2,
            label: "2 · -",
            status: "default",
            children: [{ id: 5, label: "5 · -", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "자리 tin", value: "0 1 - 2 - -" },
        { label: "구간 끝 tout", value: "- - - - - -" },
        { label: "timer", value: "3" },
        { label: "스택", value: "[0, 1, 3]" },
      ],
    },
    {
      title: "T5 정점 3 을 빼고, 정점 4 에 자리를 준 뒤 4 와 1 을 뺀다",
      detail:
        "정점 3 은 이웃이 1 뿐이라 볼 것이 없다 — timer - 1 = 2 가 구간 끝이다. 이어 정점 4 가 자리 3 을 받고 같은 이유로 곧바로 빠지며, 정점 1 도 이웃을 다 봐서 구간 끝 3 을 받는다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "frontier",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "active",
            children: [
              { id: 3, label: "3 · 2", status: "active" },
              { id: 4, label: "4 · 3", status: "active" },
            ],
          },
          {
            id: 2,
            label: "2 · -",
            status: "default",
            children: [{ id: 5, label: "5 · -", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "자리 tin", value: "0 1 - 2 3 -" },
        { label: "구간 끝 tout", value: "- 3 - 2 3 -" },
        { label: "timer", value: "4" },
        { label: "스택", value: "[0]" },
        { label: "정점 1 의 구간", value: "자리 1 부터 3 까지" },
      ],
    },
    {
      title: "T6 정점 2 와 5 에 자리를 주고 5 · 2 · 0 을 차례로 뺀다",
      detail:
        "정점 0 의 남은 이웃 2 가 자리 4 를, 그 자식 5 가 자리 5 를 받는다. 그다음 5 · 2 · 0 이 차례로 빠지며 구간 끝이 전부 5 로 정해진다. 스택이 비면서 순회가 끝난다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              { id: 3, label: "3 · 2", status: "visited" },
              { id: 4, label: "4 · 3", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 4",
            status: "active",
            children: [{ id: 5, label: "5 · 5", status: "active" }],
          },
        ],
      },
      entries: [
        { label: "자리 tin", value: "0 1 4 2 3 5" },
        { label: "구간 끝 tout", value: "5 3 5 2 3 5" },
        { label: "timer", value: "6" },
        { label: "스택", value: "[]" },
        { label: "자리별 정점", value: "0 1 3 4 2 5" },
        { label: "자리별 값", value: "1 2 4 5 3 6" },
      ],
    },
    {
      title: "T7 펜윅 트리를 값에서 한 번에 만든다",
      detail:
        "칸 i 에 자리 i-1 의 값을 적고, 칸 1 부터 6 까지 각 칸을 자기를 덮는 다음 칸에 한 번씩 더한다. 칸 4 가 자리 0 부터 3 까지 넷을, 칸 6 이 자리 4 와 5 를 담는다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "visited",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              { id: 3, label: "3 · 2", status: "visited" },
              { id: 4, label: "4 · 3", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 4",
            status: "visited",
            children: [{ id: 5, label: "5 · 5", status: "visited" }],
          },
        ],
      },
      entries: [
        { label: "자리별 값", value: "1 2 4 5 3 6" },
        { label: "칸에 값만 적은 tree", value: "0 1 2 4 5 3 6" },
        { label: "칸 1 을 칸 2 에 더함", value: "0 1 3 4 5 3 6" },
        { label: "칸 2 를 칸 4 에 더함", value: "0 1 3 4 8 3 6" },
        { label: "칸 3 을 칸 4 에 더함", value: "0 1 3 4 12 3 6" },
        { label: "칸 5 를 칸 6 에 더함", value: "0 1 3 4 12 3 9" },
        { label: "완성된 tree", value: "0 1 3 4 12 3 9" },
      ],
    },
    {
      title: "T8 querySubtree(1) 을 접두사 합 둘의 차로 답한다",
      detail:
        "정점 1 의 구간은 자리 1 부터 3 까지다. prefix(3) 이 칸 4 하나를 읽어 12 를 내고, prefix(0) 이 칸 1 하나를 읽어 1 을 낸다. 12 - 1 = 11 이 답이다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "active",
            children: [
              { id: 3, label: "3 · 2", status: "visited" },
              { id: 4, label: "4 · 3", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 4",
            status: "default",
            children: [{ id: 5, label: "5 · 5", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "정점 1 의 구간", value: "자리 1 부터 3 까지" },
        { label: "prefix(3)", value: "칸 4 → 12" },
        { label: "prefix(0)", value: "칸 1 → 1" },
        { label: "답", value: "12 − 1 = 11" },
      ],
    },
    {
      title: "T9 update(4, 10) 이 차이 5 를 펜윅 트리에 더한다",
      detail:
        "정점 4 의 지금 값이 5 이고 새 값이 10 이라 차이가 5 다. 정점 4 의 자리는 3 이므로 칸 4 에서 시작해 i += i & -i 로 올라가는데, 다음 칸 8 은 6 보다 커서 칸 4 하나만 고친다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "default",
            children: [
              { id: 3, label: "3 · 2", status: "default" },
              { id: 4, label: "4 · 3", status: "active" },
            ],
          },
          {
            id: 2,
            label: "2 · 4",
            status: "default",
            children: [{ id: 5, label: "5 · 5", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "지금 값 value[4]", value: "5" },
        { label: "차이 delta", value: "10 − 5 = 5" },
        { label: "고친 칸", value: "칸 4 하나" },
        { label: "값 value", value: "1 2 3 4 10 6" },
        { label: "고친 tree", value: "0 1 3 4 17 3 9" },
      ],
    },
    {
      title: "T10 querySubtree(1) 을 다시 답한다",
      detail:
        "구간은 그대로 자리 1 부터 3 까지다. 칸 4 의 값만 12 에서 17 로 바뀌었으므로 17 - 1 = 16 이 된다. 갱신된 정점 4 가 정점 1 의 구간 안에 있어서 답이 따라 움직인 것이다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "default",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "active",
            children: [
              { id: 3, label: "3 · 2", status: "visited" },
              { id: 4, label: "4 · 3", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 4",
            status: "default",
            children: [{ id: 5, label: "5 · 5", status: "default" }],
          },
        ],
      },
      entries: [
        { label: "정점 1 의 구간", value: "자리 1 부터 3 까지" },
        { label: "prefix(3)", value: "칸 4 → 17" },
        { label: "prefix(0)", value: "칸 1 → 1" },
        { label: "답", value: "17 − 1 = 16" },
      ],
    },
    {
      title: "T11 querySubtree(0) 이 트리 전체의 합을 답한다",
      detail:
        "뿌리의 구간은 자리 0 부터 5 까지라 배열 전체다. prefix(5) 가 칸 6 과 칸 4 를 읽어 9 + 17 = 26 을 내고, prefix(-1) 은 읽을 칸이 없어 0 이다. 26 을 돌려준다.",
      root: {
        id: 0,
        label: "0 · 0",
        status: "active",
        children: [
          {
            id: 1,
            label: "1 · 1",
            status: "visited",
            children: [
              { id: 3, label: "3 · 2", status: "visited" },
              { id: 4, label: "4 · 3", status: "visited" },
            ],
          },
          {
            id: 2,
            label: "2 · 4",
            status: "visited",
            children: [{ id: 5, label: "5 · 5", status: "visited" }],
          },
        ],
      },
      entries: [
        { label: "정점 0 의 구간", value: "자리 0 부터 5 까지" },
        { label: "prefix(5)", value: "칸 6 → 9, 칸 4 → 17, 합 26" },
        { label: "prefix(-1)", value: "읽을 칸 없음 → 0" },
        { label: "반환", value: "26" },
      ],
    },
  ] satisfies Frame[],
};
