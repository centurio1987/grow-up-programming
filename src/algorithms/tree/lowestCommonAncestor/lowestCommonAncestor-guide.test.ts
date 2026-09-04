/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스 둘(사슬 10,000 개에 질의 10,000 개, 별 모양 100,000 개에 질의 1,000 개를
 * 100ms 안에)은 그대로 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스들이 실제로
 * 지키던 것은 **제약 규모에서 호출 깊이에 걸리지 않고 답이 나온다**는 것이라, 아래에서 같은 두
 * 모양의 반환값으로 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 *
 * **원본에 없던 케이스 넷을 더 걸었다.** ① 입력 배열을 변형하지 않는가 ② 질의 순서를 바꾸면
 * 답의 순서도 그대로 따라오는가 ③ 답이 언제나 두 정점의 조상이고 그중 가장 깊은가(작은 트리
 * 전수 대조) ④ 뿌리를 바꾸면 같은 정점 쌍의 답이 달라지는가.
 */
import { expect, test } from "bun:test";
import { lowestCommonAncestor } from "./lowestCommonAncestor-guide.ref.ts";

type Edge = [number, number];
type Query = [number, number];

/** 정점 여섯 개짜리 작은 트리 — 원본 테스트가 여러 케이스에서 쓴다. */
const SMALL: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
];

const CASES: [string, number, Edge[], number, Query[], number[]][] = [
  ["단일 노드 트리에서 (0,0)", 1, [], 0, [[0, 0]], [0]],
  [
    "두 노드 트리",
    2,
    [[0, 1]],
    0,
    [
      [0, 1],
      [1, 1],
    ],
    [0, 1],
  ],
  [
    "간단한 트리에서 다섯 질의",
    6,
    SMALL,
    0,
    [
      [3, 4],
      [3, 5],
      [4, 5],
      [3, 1],
      [5, 0],
    ],
    [1, 0, 0, 1, 0],
  ],
  [
    "자기 자신의 답은 자기 자신",
    3,
    [
      [0, 1],
      [1, 2],
    ],
    0,
    [[2, 2]],
    [2],
  ],
  [
    "조상·자손 관계의 답은 조상",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    0,
    [
      [0, 3],
      [1, 3],
    ],
    [0, 1],
  ],
  [
    "사슬 여섯 정점",
    6,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
    0,
    [
      [2, 5],
      [1, 4],
      [3, 3],
    ],
    [2, 1, 3],
  ],
  [
    "별 모양에서 잎 두 개의 답은 중심",
    5,
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    0,
    [
      [1, 2],
      [3, 4],
      [1, 4],
    ],
    [0, 0, 0],
  ],
  [
    "질의가 비어 있으면 빈 배열",
    3,
    [
      [0, 1],
      [1, 2],
    ],
    0,
    [],
    [],
  ],
  [
    "뿌리를 0 이 아닌 정점으로 지정",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    2,
    [
      [0, 3],
      [0, 1],
    ],
    [2, 1],
  ],
  ["n=2 최소 트리", 2, [[0, 1]], 0, [[1, 0]], [0]],
  [
    "본문 전개가 쓰는 고정 입력",
    9,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [3, 6],
      [5, 7],
      [5, 8],
    ],
    0,
    [
      [6, 4],
      [6, 7],
      [3, 6],
      [8, 7],
    ],
    [1, 0, 3, 5],
  ],
];

for (const [name, n, edges, root, qs, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(lowestCommonAncestor(n, edges, root, qs)).toEqual(want);
  });
}

test("입력 배열을 변형하지 않는다", () => {
  const edges: Edge[] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ];
  const qs: Query[] = [
    [3, 5],
    [3, 4],
  ];
  const before = `${JSON.stringify(edges)}|${JSON.stringify(qs)}`;
  lowestCommonAncestor(6, edges, 0, qs);
  expect(`${JSON.stringify(edges)}|${JSON.stringify(qs)}`).toBe(before);
});

test("질의 순서를 뒤집으면 답의 순서도 뒤집힌다", () => {
  const qs: Query[] = [
    [3, 4],
    [3, 5],
    [4, 5],
    [3, 1],
    [5, 0],
  ];
  const forward = lowestCommonAncestor(6, SMALL, 0, qs);
  const backward = lowestCommonAncestor(6, SMALL, 0, [...qs].reverse());
  expect(backward).toEqual([...forward].reverse());
});

test("답은 두 정점의 공통 조상 중 가장 깊은 정점이다", () => {
  // 정점 열두 개짜리 트리에서 모든 정점 쌍을 조상 목록으로 직접 대조한다.
  const n = 12;
  const edges: Edge[] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [3, 6],
    [5, 7],
    [5, 8],
    [6, 9],
    [8, 10],
    [4, 11],
  ];
  const parent = new Array<number>(n).fill(0);
  const depth = new Array<number>(n).fill(0);
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const seen = new Array<boolean>(n).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const v of near[u] as number[]) {
      if (seen[v]) continue;
      seen[v] = true;
      parent[v] = u;
      depth[v] = (depth[u] as number) + 1;
      stack.push(v);
    }
  }
  const chainUp = (v: number): number[] => {
    const out = [v];
    let x = v;
    while (x !== 0) {
      x = parent[x] as number;
      out.push(x);
    }
    return out;
  };

  const qs: Query[] = [];
  for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) qs.push([u, v]);
  const got = lowestCommonAncestor(n, edges, 0, qs);

  for (const [i, [u, v]] of qs.entries()) {
    const up = new Set(chainUp(u));
    const shared = chainUp(v).filter((x) => up.has(x));
    const deepest = shared.reduce((a, b) =>
      (depth[a] as number) >= (depth[b] as number) ? a : b,
    );
    expect(got[i]).toBe(deepest);
  }
});

test("뿌리를 바꾸면 같은 정점 쌍의 답이 달라진다", () => {
  const edges: Edge[] = [
    [0, 1],
    [1, 2],
    [1, 3],
  ];
  expect(lowestCommonAncestor(4, edges, 0, [[2, 3]])).toEqual([1]);
  expect(lowestCommonAncestor(4, edges, 2, [[0, 3]])).toEqual([1]);
  expect(lowestCommonAncestor(4, edges, 3, [[0, 2]])).toEqual([1]);
});

test("사슬 정점 100,000 개에서 답이 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const n = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);
  const qs: Query[] = [
    [0, n - 1],
    [n - 2, n - 1],
    [12_345, 54_321],
  ];
  expect(lowestCommonAncestor(n, edges, 0, qs)).toEqual([0, n - 2, 12_345]);
});

test("별 모양 정점 100,000 개에서 답이 나온다", () => {
  const n = 100_000;
  const edges: Edge[] = [];
  for (let i = 1; i < n; i++) edges.push([0, i]);
  const qs: Query[] = [];
  for (let i = 0; i < 1_000; i++) {
    qs.push([1 + (i % (n - 1)), 1 + ((i * 13) % (n - 1))]);
  }
  const got = lowestCommonAncestor(n, edges, 0, qs);
  expect(got).toHaveLength(qs.length);
  expect(
    got.every(
      (x, i) =>
        x ===
        ((qs[i] as Query)[0] === (qs[i] as Query)[1] ? (qs[i] as Query)[0] : 0),
    ),
  ).toBe(true);
});
