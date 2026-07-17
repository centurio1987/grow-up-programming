// 자기검증용 스크래치 — dfsTraversal 문제/테스트/가이드 본문에 싣는 구현을 모두 모아
// 실제로 실행하고, 예시·경계·성능 수치가 맞는지 assert로 확인한다. 프로덕션 코드 아님.
//
// 실행: bun src/algorithms/graph/dfsTraversal/_scratch/dfsTraversal.ts

type Edges = [number, number][];

// 인접 리스트 구성: 무향(양방향), 자기 루프 제외, 이웃은 오름차순 정렬(결정적).
// 입력 edges는 변형하지 않는다(내부 배열에만 push).
function buildAdj(n: number, edges: Edges): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue; // 자기 루프는 방문에 영향 없음
    adj[u]!.push(v);
    adj[v]!.push(u);
  }
  for (const list of adj) list.sort((a, b) => a - b);
  return adj;
}

// (A) base — 재귀 preorder DFS. 간결하지만 깊은 그래프에서 호출 스택 오버플로 위험.
function dfsRecursive(n: number, edges: Edges, start: number): number[] {
  const adj = buildAdj(n, edges);
  const visited = new Uint8Array(n);
  const order: number[] = [];
  const go = (node: number) => {
    visited[node] = 1;
    order.push(node);
    for (const next of adj[node]!) {
      if (!visited[next]) go(next);
    }
  };
  go(start);
  return order;
}

// (B) optimized — 명시적 스택 preorder DFS. 재귀와 동일한 순서를 내되 스택 깊이에 안전.
// 이웃을 내림차순으로 push해 작은 인덱스가 먼저 pop 되게 하고, pop 시점에 방문 확정.
function dfsIterative(n: number, edges: Edges, start: number): number[] {
  const adj = buildAdj(n, edges);
  const visited = new Uint8Array(n);
  const order: number[] = [];
  const stack: number[] = [start];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited[node]) continue;
    visited[node] = 1;
    order.push(node);
    const neighbors = adj[node]!;
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const next = neighbors[i]!;
      if (!visited[next]) stack.push(next);
    }
  }
  return order;
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`[FAIL] ${label}\n  expected ${e}\n  actual   ${a}`);
  }
  console.log(`[ok] ${label} => ${a}`);
}

// ── problem.md 예시 & 테스트 기대값 검증 ───────────────────────────────
type Case = { n: number; edges: Edges; start: number; expected: number[]; label: string };
const cases: Case[] = [
  { label: "예시1 분기(0에서)", n: 5, edges: [[0, 1], [0, 2], [1, 3], [2, 4]], start: 0, expected: [0, 1, 3, 2, 4] },
  { label: "예시2 오름차순 tie-break", n: 4, edges: [[0, 2], [0, 1], [1, 3]], start: 0, expected: [0, 1, 3, 2] },
  { label: "예시3 비연결(도달분만)", n: 5, edges: [[0, 1], [2, 3]], start: 0, expected: [0, 1] },
  { label: "예시4 자기루프+중복간선 흡수", n: 3, edges: [[0, 0], [0, 1], [0, 1]], start: 0, expected: [0, 1] },
  { label: "예시5 단일 정점", n: 1, edges: [], start: 0, expected: [0] },
  { label: "예시6 start!=0", n: 4, edges: [[0, 1], [1, 2], [2, 3]], start: 2, expected: [2, 1, 0, 3] },
  { label: "경계 start 고립", n: 3, edges: [[0, 1]], start: 2, expected: [2] },
];

for (const c of cases) {
  // 재귀·반복 두 구현이 동일 순서를 내는지 교차검증
  const rec = dfsRecursive(c.n, c.edges, c.start);
  const it = dfsIterative(c.n, c.edges, c.start);
  assertEqual(rec, c.expected, `${c.label} (recursive)`);
  assertEqual(it, c.expected, `${c.label} (iterative)`);
}

// 입력 불변 확인
{
  const edges: Edges = [[0, 2], [0, 1], [1, 3]];
  const snapshot = JSON.stringify(edges);
  dfsIterative(4, edges, 0);
  assertEqual(JSON.stringify(edges), snapshot, "입력 edges 불변");
}

// 재귀의 스택 깊이 한계 관찰: 긴 체인에서 재귀는 터지고 반복은 안전
{
  const V = 100_000;
  const edges: Edges = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

  let recursiveOverflowed = false;
  try {
    dfsRecursive(V, edges, 0);
  } catch (e) {
    recursiveOverflowed = e instanceof RangeError; // Maximum call stack size exceeded
  }
  console.log(`[obs] 재귀 체인 V=${V} 오버플로 발생: ${recursiveOverflowed}`);

  const t0 = performance.now();
  const order = dfsIterative(V, edges, 0);
  const elapsed = performance.now() - t0;
  assertEqual(order.length, V, "반복 체인 방문 수 = V");
  assertEqual(order[0], 0, "반복 체인 시작 = 0");
  assertEqual(order[V - 1], V - 1, "반복 체인 끝 = V-1");
  console.log(`[perf] iterative V=${V}: ${elapsed.toFixed(1)}ms`);
}

console.log("\n모든 검증 통과.");
