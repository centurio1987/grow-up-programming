import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수(10)는 그 절의
 * T# 단계 수(10)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * **`matrix` 와 `tree` 를 함께 세우는 첫 편이다.** 두 뷰의 선례는 각각 따로 서 있었다 —
 * `matrix` 는 `subsetSum`·`unboundedKnapsack` 처럼 `keyValue` 와 짝지었고, `tree` 는
 * `treeDiameter`·`trie` 처럼 역시 `keyValue` 와 짝지었다. 여기서 정한 규약 넷을 적어 둔다.
 * 같은 조합의 다음 편이 이것을 이어받는다.
 *
 * 1. **둘 다 `view` 에 넣고 `extraViews` 는 비운다.** `extraViews` 는 `VIEW_REGISTRY` 에
 *    없는 **새 이름**을 끼우는 자리이고(`src/_guide-sim/index.tsx:431` 이 프리셋 이름과
 *    겹치면 던진다), `matrix`·`tree` 는 둘 다 프리셋이다. 조합이 처음이라는 것은 새
 *    컴포넌트가 필요하다는 뜻이 아니다.
 * 2. **`keyValue` 를 안 쓴다.** 앞선 두 편이 `keyValue` 에 담던 것(상태 배열 전체 · 지금
 *    보는 자리)을 여기서는 표가 그대로 진다 — 이 알고리즘의 상태가 **노드마다 네 값**이라
 *    행이 노드, 열이 값 이름인 표 하나에 남김없이 들어간다. 세 뷰를 세우면 같은 값이 두
 *    패널에 나온다.
 * 3. **트리 노드와 표 행을 잇는 것은 라벨 문자열 자체다.** `TreeNodeData.label` 과
 *    `rowLabels[v]` 를 **글자 그대로 같게** 둔다(`"0 (w=9)"`). 노드 번호로만 이으면 독자가
 *    표에서 행을 세어 찾아야 하는데, 그림과 표가 같은 화면에 있어도 그 대조는 눈으로 한다.
 *    가중치를 라벨에 붙이는 것은 `TreeFrame` 에 노드값 필드가 없기 때문이고, 이것은
 *    `treeDiameter` 가 간선 가중치를 자식 라벨에 붙인 것과 같은 자리다.
 * 4. **트리는 진행을, 표는 값을 진다.** 트리의 `status` 는 값을 안 담고 **그 노드가 어느
 *    단계에 있는지**만 담는다 — `default` 자식이 아직 남았다 · `frontier` 두 값이
 *    확정됐고 부모에 아직 안 더했다 · `active` 이 걸음에서 부모에 더한 노드 ·
 *    `visited` 부모에 더하는 일까지 끝났다. 값은 전부 표에 있고, `cells` 가 이 걸음에서
 *    바뀐 칸을 짚는다. 두 뷰가 같은 걸음에서 무엇을 말하는지 갈라 두면 어느 쪽을 봐도
 *    다른 쪽이 필요해진다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const walk = {
  view: ["tree", "matrix"] as const,
  title:
    "treeMaxIndependentSet(7, [[0,2],[0,1],[1,3],[1,4],[2,5],[5,6]], [9,8,-2,5,1,7,4])",
  result: "22",
  steps: [
    {
      title: "T1 간선 목록을 이웃 목록으로 옮긴다",
      detail:
        "무방향이라 간선 하나를 양쪽 노드의 목록에 넣는다. adj[0] 이 [2, 1] 인 것은 간선 [0,2] 가 [0,1] 보다 먼저 적혀 있기 때문이고, 그림의 자식 순서도 그것을 따른다. 아직 어떤 값도 정하지 않았다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "default",
                children: [{ id: 6, label: "6 (w=4)", status: "default" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "default",
            children: [
              { id: 3, label: "3 (w=5)", status: "default" },
              { id: 4, label: "4 (w=1)", status: "default" },
            ],
          },
        ],
      },
      matrix: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [] as [number, number][],
    },
    {
      title: "T2 노드마다 두 값의 시작값을 적는다",
      detail:
        "자식을 하나도 안 더한 시점이다. 안 고르면 자기 가중치가 안 들어가 0 이고, 고르면 자기 가중치만 들어가 w 다. 잎 3·4·6 은 더할 자식이 없어 이 값이 곧 확정값이다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "default",
                children: [{ id: 6, label: "6 (w=4)", status: "frontier" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "default",
            children: [
              { id: 3, label: "3 (w=5)", status: "frontier" },
              { id: 4, label: "4 (w=1)", status: "frontier" },
            ],
          },
        ],
      },
      matrix: [
        [null, null, 0, 9],
        [null, null, 0, 8],
        [null, null, 0, -2],
        [null, null, 0, 5],
        [null, null, 0, 1],
        [null, null, 0, 7],
        [null, null, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [3, 3],
        [4, 3],
        [6, 3],
      ] as [number, number][],
    },
    {
      title: "T3 뿌리 0 에서 방문 순서와 부모를 정한다",
      detail:
        "너비 우선으로 order = [0, 2, 1, 5, 3, 4, 6] 을 얻는다. 순서 열이 노드 번호와 다르다 — 이웃 목록의 차례가 정하는 값이라 노드 번호와 무관하다. 부모 열은 뿌리만 비어 있다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "default",
                children: [{ id: 6, label: "6 (w=4)", status: "frontier" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "default",
            children: [
              { id: 3, label: "3 (w=5)", status: "frontier" },
              { id: 4, label: "4 (w=1)", status: "frontier" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 0, 9],
        [2, 0, 0, 8],
        [1, 0, 0, -2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 0, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [5, 0],
        [6, 0],
      ] as [number, number][],
    },
    {
      title: "T4 순서 6 — 노드 6 을 부모 5 에 더한다",
      detail:
        "부모 5 를 안 고르면 자식 6 은 두 값 중 큰 쪽 max(0, 4) = 4 를 쓴다. 부모 5 를 고르면 자식 6 은 안 고르는 값 0 만 쓸 수 있다. 이 걸음이 끝나면 노드 5 의 두 값이 확정된다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "frontier",
                children: [{ id: 6, label: "6 (w=4)", status: "active" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "default",
            children: [
              { id: 3, label: "3 (w=5)", status: "frontier" },
              { id: 4, label: "4 (w=1)", status: "frontier" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 0, 9],
        [2, 0, 0, 8],
        [1, 0, 0, -2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [5, 2],
        [5, 3],
      ] as [number, number][],
    },
    {
      title: "T5 순서 5 — 노드 4 를 부모 1 에 더한다",
      detail:
        "부모 1 의 dp0 이 0 에서 max(0, 1) = 1 이 된다. dp1 은 자식 4 의 dp0 인 0 을 더해 8 그대로다. 노드 1 은 자식 3 이 아직 남아 확정이 아니다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "frontier",
                children: [{ id: 6, label: "6 (w=4)", status: "visited" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "default",
            children: [
              { id: 3, label: "3 (w=5)", status: "frontier" },
              { id: 4, label: "4 (w=1)", status: "active" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 0, 9],
        [2, 0, 1, 8],
        [1, 0, 0, -2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [1, 2],
        [1, 3],
      ] as [number, number][],
    },
    {
      title: "T6 순서 4 — 노드 3 을 부모 1 에 더한다",
      detail:
        "부모 1 의 dp0 이 1 에서 1 + max(0, 5) = 6 이 된다. dp1 은 다시 0 을 더해 8 이다. 자식 둘을 다 더했으므로 노드 1 의 두 값이 확정된다 — 6 과 8 이다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "default",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "frontier",
                children: [{ id: 6, label: "6 (w=4)", status: "visited" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "frontier",
            children: [
              { id: 3, label: "3 (w=5)", status: "active" },
              { id: 4, label: "4 (w=1)", status: "visited" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 0, 9],
        [2, 0, 6, 8],
        [1, 0, 0, -2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [1, 2],
        [1, 3],
      ] as [number, number][],
    },
    {
      title: "T7 순서 3 — 노드 5 를 부모 2 에 더한다",
      detail:
        "부모 2 를 안 고르면 max(4, 7) = 7 을 받아 dp0 이 7 이다. 부모 2 를 고르면 자식 5 의 dp0 인 4 만 더해 -2 + 4 = 2 다. 가중치가 음수인 노드라 고르는 쪽이 더 작다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "active",
                children: [{ id: 6, label: "6 (w=4)", status: "visited" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "frontier",
            children: [
              { id: 3, label: "3 (w=5)", status: "visited" },
              { id: 4, label: "4 (w=1)", status: "visited" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 0, 9],
        [2, 0, 6, 8],
        [1, 0, 7, 2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [2, 2],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T8 순서 2 — 노드 1 을 부모 0 에 더한다",
      detail:
        "뿌리의 dp0 이 max(6, 8) = 8 이 되고, dp1 은 자식 1 의 dp0 인 6 을 더해 9 + 6 = 15 가 된다. 뿌리는 자식 2 가 아직 남아 확정이 아니다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "default",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "frontier",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "visited",
                children: [{ id: 6, label: "6 (w=4)", status: "visited" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "active",
            children: [
              { id: 3, label: "3 (w=5)", status: "visited" },
              { id: 4, label: "4 (w=1)", status: "visited" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 8, 15],
        [2, 0, 6, 8],
        [1, 0, 7, 2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [0, 2],
        [0, 3],
      ] as [number, number][],
    },
    {
      title: "T9 순서 1 — 노드 2 를 부모 0 에 더한다",
      detail:
        "뿌리의 dp0 이 8 + max(7, 2) = 15 가 되고, dp1 은 자식 2 의 dp0 인 7 을 더해 15 + 7 = 22 가 된다. 자식 둘을 다 더했으므로 뿌리의 두 값이 확정됐다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "frontier",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "active",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "visited",
                children: [{ id: 6, label: "6 (w=4)", status: "visited" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "visited",
            children: [
              { id: 3, label: "3 (w=5)", status: "visited" },
              { id: 4, label: "4 (w=1)", status: "visited" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 15, 22],
        [2, 0, 6, 8],
        [1, 0, 7, 2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [
        [0, 2],
        [0, 3],
      ] as [number, number][],
    },
    {
      title: "T10 뿌리의 두 값 중 큰 쪽을 돌려준다",
      detail:
        "max(15, 22) = 22 다. 22 는 뿌리 0 과 노드 3·4·5 를 고른 합 9 + 5 + 1 + 7 이고, 어느 둘도 간선으로 이어져 있지 않다. 15 는 뿌리를 안 고른 쪽으로 노드 1 과 5 를 고른 합 8 + 7 이다.",
      root: {
        id: 0,
        label: "0 (w=9)",
        status: "active",
        children: [
          {
            id: 2,
            label: "2 (w=-2)",
            status: "visited",
            children: [
              {
                id: 5,
                label: "5 (w=7)",
                status: "visited",
                children: [{ id: 6, label: "6 (w=4)", status: "visited" }],
              },
            ],
          },
          {
            id: 1,
            label: "1 (w=8)",
            status: "visited",
            children: [
              { id: 3, label: "3 (w=5)", status: "visited" },
              { id: 4, label: "4 (w=1)", status: "visited" },
            ],
          },
        ],
      },
      matrix: [
        [0, "—", 15, 22],
        [2, 0, 6, 8],
        [1, 0, 7, 2],
        [4, 1, 0, 5],
        [5, 1, 0, 1],
        [3, 2, 4, 7],
        [6, 5, 0, 4],
      ],
      rowLabels: [
        "0 (w=9)",
        "1 (w=8)",
        "2 (w=-2)",
        "3 (w=5)",
        "4 (w=1)",
        "5 (w=7)",
        "6 (w=4)",
      ],
      colLabels: ["순서 k", "부모 p", "안 고른다 dp0", "고른다 dp1"],
      cells: [[0, 3]] as [number, number][],
    },
  ] satisfies Frame[],
};
