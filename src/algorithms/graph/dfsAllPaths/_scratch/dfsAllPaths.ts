// 자기검증용 스크래치 — dfsAllPaths 문제/테스트/가이드 본문 값을 실측 검증한다. 프로덕션 아님.
// 실행: bun src/algorithms/graph/dfsAllPaths/_scratch/dfsAllPaths.ts

type Edges = [number, number][];

// 방향 그래프 인접 리스트: 자기 루프 제외, 이웃 오름차순, 중복 이웃 제거(경로 중복 방지).
// 입력 edges는 변형하지 않는다.
function buildAdj(n: number, edges: Edges): number[][] {
  const sets: Set<number>[] = Array.from({ length: n }, () => new Set());
  for (const [u, v] of edges) {
    if (u === v) continue; // 자기 루프는 단순 경로에 쓰일 수 없음
    sets[u]!.add(v);
  }
  return sets.map((s) => [...s].sort((a, b) => a - b));
}

// (A) base — 백트래킹으로 source→target 모든 단순 경로. 진입 시 mark/push, 이탈 시 unmark/pop.
function allPaths(n: number, edges: Edges, source: number, target: number): number[][] {
  const adj = buildAdj(n, edges);
  const onPath = new Uint8Array(n);
  const path: number[] = [];
  const result: number[][] = [];

  const dfs = (u: number) => {
    onPath[u] = 1;
    path.push(u);
    if (u === target) {
      result.push(path.slice()); // 스냅샷 저장 — target에서 더 뻗지 않는다
    } else {
      for (const v of adj[u]!) {
        if (!onPath[v]) dfs(v);
      }
    }
    onPath[u] = 0; // 백트래킹: 되돌아가며 표시 해제
    path.pop();
  };

  dfs(source);
  return result;
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`[FAIL] ${label}\n  expected ${e}\n  actual   ${a}`);
  console.log(`[ok] ${label} => ${a}`);
}

function isLexSorted(paths: number[][]): boolean {
  for (let i = 1; i < paths.length; i++) {
    if (JSON.stringify(paths[i - 1]) > JSON.stringify(paths[i])) {
      // 문자열 비교로는 부정확할 수 있어 원소 비교로 재확인
      const a = paths[i - 1]!, b = paths[i]!;
      let cmp = 0;
      for (let k = 0; k < Math.min(a.length, b.length); k++) {
        if (a[k]! !== b[k]!) { cmp = a[k]! - b[k]!; break; }
      }
      if (cmp === 0) cmp = a.length - b.length;
      if (cmp > 0) return false;
    }
  }
  return true;
}

type Case = { n: number; edges: Edges; s: number; t: number; expected: number[][]; label: string };
const cases: Case[] = [
  { label: "예시1 다이아몬드 DAG", n: 4, edges: [[0, 1], [0, 2], [1, 3], [2, 3]], s: 0, t: 3, expected: [[0, 1, 3], [0, 2, 3]] },
  { label: "예시2 다중 경로 사전식", n: 4, edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3]], s: 0, t: 3, expected: [[0, 1, 2, 3], [0, 1, 3], [0, 2, 3]] },
  { label: "예시3 경로 없음", n: 3, edges: [[0, 1]], s: 0, t: 2, expected: [] },
  { label: "예시4 source==target", n: 3, edges: [[0, 1], [1, 2]], s: 1, t: 1, expected: [[1]] },
  { label: "예시5 사이클 존재-단순경로만", n: 3, edges: [[0, 1], [1, 2], [2, 0], [0, 2]], s: 0, t: 2, expected: [[0, 1, 2], [0, 2]] },
  { label: "예시6 자기루프 무시", n: 2, edges: [[0, 0], [0, 1]], s: 0, t: 1, expected: [[0, 1]] },
  { label: "경계 중복간선-경로중복없음", n: 3, edges: [[0, 1], [0, 1], [1, 2]], s: 0, t: 2, expected: [[0, 1, 2]] },
  { label: "경계 target 도달불가(역방향만)", n: 2, edges: [[1, 0]], s: 0, t: 1, expected: [] },
];

for (const c of cases) {
  const got = allPaths(c.n, c.edges, c.s, c.t);
  assertEqual(got, c.expected, c.label);
  if (!isLexSorted(got)) throw new Error(`[FAIL] ${c.label} — 사전식 정렬 아님`);
}

// 입력 불변 확인
{
  const edges: Edges = [[0, 1], [0, 2], [1, 3], [2, 3]];
  const snap = JSON.stringify(edges);
  allPaths(4, edges, 0, 3);
  assertEqual(JSON.stringify(edges), snap, "입력 edges 불변");
}

// 성능/경로수 상한: m×m 격자 DAG(오른쪽/아래), 경로 수 = C(2m, m)
function gridDag(m: number): { n: number; edges: Edges; s: number; t: number } {
  const id = (r: number, c: number) => r * (m + 1) + c;
  const edges: Edges = [];
  for (let r = 0; r <= m; r++) {
    for (let c = 0; c <= m; c++) {
      if (c < m) edges.push([id(r, c), id(r, c + 1)]); // 오른쪽
      if (r < m) edges.push([id(r, c), id(r + 1, c)]); // 아래
    }
  }
  return { n: (m + 1) * (m + 1), edges, s: id(0, 0), t: id(m, m) };
}

function centralBinomial(m: number): number {
  // C(2m, m)
  let r = 1;
  for (let i = 1; i <= m; i++) r = (r * (m + i)) / i;
  return Math.round(r);
}

{
  const m = 7;
  const g = gridDag(m);
  const t0 = performance.now();
  const paths = allPaths(g.n, g.edges, g.s, g.t);
  const elapsed = performance.now() - t0;
  const expectedCount = centralBinomial(m); // C(14,7) = 3432
  assertEqual(paths.length, expectedCount, `격자 ${m}x${m} 경로 수 = C(2m,m)`);
  assertEqual(paths[0], [0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63], "격자 첫 경로(전부 오른쪽 뒤 아래)");
  console.log(`[perf] allPaths grid ${m}x${m}: ${paths.length} paths, ${elapsed.toFixed(1)}ms`);
}

console.log("\n모든 검증 통과.");
