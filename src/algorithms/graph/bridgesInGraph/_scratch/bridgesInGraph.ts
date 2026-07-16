// E3 자기검증 스크래치 — 가이드 본문에 싣는 코드를 그대로 추출해 실행한다.
// bun src/algorithms/graph/bridgesInGraph/_scratch/bridgesInGraph.ts

// ---------- naive (원형): 간선마다 제거 후 연결성분 수 비교 ----------
function countComponents(n: number, edges: [number, number][]): number {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]!]!;
      x = parent[x]!;
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (const [u, v] of edges) union(u, v);
  const roots = new Set<number>();
  for (let i = 0; i < n; i++) roots.add(find(i));
  return roots.size;
}

function bridgesInGraphNaive(n: number, edges: [number, number][]): [number, number][] {
  const bridges: [number, number][] = [];
  const base = countComponents(n, edges);
  for (let i = 0; i < edges.length; i++) {
    const rest = edges.filter((_, j) => j !== i);
    if (countComponents(n, rest) > base) {
      const [u, v] = edges[i]!;
      bridges.push(u < v ? [u, v] : [v, u]);
    }
  }
  bridges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return bridges;
}

// ---------- 아이디어를 코드로: 재귀 DFS low-link (기본 구현) ----------
function bridgesInGraphRecursive(n: number, edges: [number, number][]): [number, number][] {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i]!;
    adj[u]!.push([v, i]);
    adj[v]!.push([u, i]);
  }

  const disc = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(-1);
  const bridges: [number, number][] = [];
  let timer = 0;

  function dfs(v: number, parentEdgeIdx: number): void {
    disc[v] = low[v] = timer++;
    for (const [w, eidx] of adj[v]!) {
      if (eidx === parentEdgeIdx) continue; // 부모 방향 간선 스킵(간선 인덱스 기반)
      if (disc[w] === -1) {
        dfs(w, eidx);
        low[v] = Math.min(low[v]!, low[w]!);
        if (low[w]! > disc[v]!) {
          const u = Math.min(v, w);
          const c = Math.max(v, w);
          bridges.push([u, c]);
        }
      } else {
        low[v] = Math.min(low[v]!, disc[w]!);
      }
    }
  }

  for (let v = 0; v < n; v++) {
    if (disc[v] === -1) dfs(v, -1);
  }

  bridges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return bridges;
}

// ---------- 최적화 코드: 명시적 스택으로 재귀 제거 (깊은 재귀에 안전) ----------
function bridgesInGraph(n: number, edges: [number, number][]): [number, number][] {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  for (let i = 0; i < edges.length; i++) {
    const [u, v] = edges[i]!;
    adj[u]!.push([v, i]);
    adj[v]!.push([u, i]);
  }

  const disc = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(-1);
  const bridges: [number, number][] = [];
  let timer = 0;

  // 프레임: [v, parentEdgeIdx, adj 순회 커서]
  type Frame = { v: number; parentEdgeIdx: number; cursor: number };

  for (let start = 0; start < n; start++) {
    if (disc[start] !== -1) continue;

    const stack: Frame[] = [{ v: start, parentEdgeIdx: -1, cursor: 0 }];
    disc[start] = low[start] = timer++;

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      const neighbors = adj[frame.v]!;

      if (frame.cursor >= neighbors.length) {
        // v의 인접 리스트를 모두 처리 → 부모로 low 전파하고 다리 판정
        stack.pop();
        if (stack.length > 0) {
          const parent = stack[stack.length - 1]!;
          low[parent.v] = Math.min(low[parent.v]!, low[frame.v]!);
          if (low[frame.v]! > disc[parent.v]!) {
            const u = Math.min(parent.v, frame.v);
            const c = Math.max(parent.v, frame.v);
            bridges.push([u, c]);
          }
        }
        continue;
      }

      const [w, eidx] = neighbors[frame.cursor]!;
      frame.cursor++;
      if (eidx === frame.parentEdgeIdx) continue; // 부모 방향 간선 스킵

      if (disc[w] === -1) {
        disc[w] = low[w] = timer++;
        stack.push({ v: w, parentEdgeIdx: eidx, cursor: 0 });
      } else {
        low[frame.v] = Math.min(low[frame.v]!, disc[w]!);
      }
    }
  }

  bridges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return bridges;
}

// ---------- 대표 예시 ----------
const cases: Array<{ name: string; n: number; edges: [number, number][]; expected: [number, number][] }> = [
  { name: "체인 0-1-2-3", n: 4, edges: [[0, 1], [1, 2], [2, 3]], expected: [[0, 1], [1, 2], [2, 3]] },
  { name: "사이클 0-1-2-3-0", n: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], expected: [] },
  {
    name: "두 삼각형 + 연결 간선 2-3",
    n: 6,
    edges: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3]],
    expected: [[2, 3]],
  },
  { name: "중복 간선 [0,1]x2", n: 2, edges: [[0, 1], [0, 1]], expected: [] },
  { name: "단일 간선 [1,0]", n: 2, edges: [[1, 0]], expected: [[0, 1]] },
  { name: "정점 1개, 간선 없음", n: 1, edges: [], expected: [] },
  { name: "간선 없음 (n=4)", n: 4, edges: [], expected: [] },
  {
    name: "시뮬 예시 n=5",
    n: 5,
    edges: [[0, 1], [1, 2], [2, 0], [1, 3], [3, 4]],
    expected: [[1, 3], [3, 4]],
  },
];

function eq(a: [number, number][], b: [number, number][]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x[0] === b[i]![0] && x[1] === b[i]![1]);
}

let allOk = true;
for (const c of cases) {
  const r1 = bridgesInGraphNaive(c.n, c.edges);
  const r2 = bridgesInGraphRecursive(c.n, c.edges);
  const r3 = bridgesInGraph(c.n, c.edges);
  const ok = eq(r1, c.expected) && eq(r2, c.expected) && eq(r3, c.expected);
  allOk = allOk && ok;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${c.name} → naive=${JSON.stringify(r1)} recursive=${JSON.stringify(r2)} iterative=${JSON.stringify(r3)} expected=${JSON.stringify(c.expected)}`,
  );
}

// ---------- 무작위 교차검증: naive vs recursive vs iterative ----------
function randomGraph(n: number, maxE: number): [number, number][] {
  const e: [number, number][] = [];
  const cnt = Math.floor(Math.random() * maxE);
  for (let i = 0; i < cnt; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    if (u !== v) e.push([u, v]);
  }
  return e;
}

let randomOk = true;
for (let t = 0; t < 200; t++) {
  const n = 1 + Math.floor(Math.random() * 8);
  const edges = randomGraph(n, 10);
  const r1 = bridgesInGraphNaive(n, edges);
  const r2 = bridgesInGraphRecursive(n, edges);
  const r3 = bridgesInGraph(n, edges);
  if (!eq(r1, r2) || !eq(r1, r3)) {
    randomOk = false;
    console.log(`FAIL random n=${n} edges=${JSON.stringify(edges)} naive=${JSON.stringify(r1)} recursive=${JSON.stringify(r2)} iterative=${JSON.stringify(r3)}`);
  }
}
console.log(randomOk ? "OK   무작위 200회 교차검증 통과" : "FAIL 무작위 교차검증 실패 있음");

// ---------- 깊은 재귀 스택 오버플로 재현 (선형 체인, n=1e5) ----------
{
  const n = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);

  let recursiveCrashed = false;
  try {
    bridgesInGraphRecursive(n, edges);
  } catch (e) {
    recursiveCrashed = true;
    console.log(`재귀 버전 n=1e5 선형 체인: 예외 발생 → ${(e as Error).message}`);
  }
  if (!recursiveCrashed) {
    console.log("재귀 버전 n=1e5 선형 체인: 예외 없이 통과(런타임 스택 한도에 따라 다를 수 있음)");
  }

  const r = bridgesInGraph(n, edges);
  const iterativeOk = r.length === n - 1;
  console.log(`반복 버전 n=1e5 선형 체인: 다리 개수=${r.length} (기대 ${n - 1}) → ${iterativeOk ? "OK" : "FAIL"}`);
}

console.log(allOk ? "\n전체 대표 예시 통과" : "\n일부 대표 예시 실패");
