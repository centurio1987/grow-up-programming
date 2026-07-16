// E3 자기검증용 스크래치. 가이드 본문에 싣는 모든 코드를 그대로 옮겨 실제 실행으로 검증한다.

// ── naive: 정점을 하나씩 제거하고 연결 성분 수를 비교 ─────────────────────────
function countComponents(n: number, adj: number[][], removed: number): number {
  const visited = new Array<boolean>(n).fill(false);
  visited[removed] = true;
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    count++;
    const stack = [s];
    visited[s] = true;
    while (stack.length > 0) {
      const v = stack.pop()!;
      for (const w of adj[v]) {
        if (!visited[w]) {
          visited[w] = true;
          stack.push(w);
        }
      }
    }
  }
  return count;
}

function articulationPointsNaive(n: number, edges: [number, number][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue; // 자기 루프는 인접 리스트에 넣지 않아도 결과 불변(연결성에 기여 안 함)
    adj[u].push(v);
    adj[v].push(u);
  }
  const baseline = countComponents(n, adj, -1);
  const result: number[] = [];
  for (let v = 0; v < n; v++) {
    const adjWithoutV: number[][] = adj.map((list) => list.filter((w) => w !== v));
    const after = countComponents(n, adjWithoutV, v);
    // v가 속한 컴포넌트가 k(>=2) 조각으로 쪼개지면 after = baseline - 1 + k > baseline.
    // v가 고립 정점이거나(k=0, after=baseline-1) 리프여서 쪼개지지 않으면(k=1, after=baseline)
    // 둘 다 after <= baseline이므로 단절점이 아니다.
    if (after > baseline) result.push(v);
  }
  return result;
}

// ── 기본 구현: 재귀 DFS + disc/low (아이디어를 코드로 옮기기) ─────────────────
function articulationPointsBasic(n: number, edges: [number, number][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const disc = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(-1);
  const isAP = new Array<boolean>(n).fill(false);
  let timer = 0;

  function dfs(v: number, parent: number): void {
    disc[v] = low[v] = timer++;
    let children = 0;

    for (const w of adj[v]) {
      if (w === v) continue; // 자기 루프 스킵(있어도 위 min 성질상 무해하지만 명시적으로 건너뛴다)
      if (disc[w] === -1) {
        children++;
        dfs(w, v);
        low[v] = Math.min(low[v], low[w]); // 재귀가 끝난 뒤에만 갱신
        if (parent !== -1 && low[w] >= disc[v]) {
          isAP[v] = true;
        }
      } else if (w !== parent) {
        low[v] = Math.min(low[v], disc[w]);
      }
    }

    if (parent === -1 && children >= 2) {
      isAP[v] = true;
    }
  }

  for (let v = 0; v < n; v++) {
    if (disc[v] === -1) dfs(v, -1);
  }

  const result: number[] = [];
  for (let v = 0; v < n; v++) if (isAP[v]) result.push(v);
  return result;
}

// ── 함정 재현용: 루트 특수 처리를 빼먹은 버전 (문서의 구체 오답 시연) ──────────
function articulationPointsBuggyNoRootRule(n: number, edges: [number, number][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const disc = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(-1);
  const isAP = new Array<boolean>(n).fill(false);
  let timer = 0;

  function dfs(v: number, parent: number): void {
    disc[v] = low[v] = timer++;
    for (const w of adj[v]) {
      if (w === v) continue;
      if (disc[w] === -1) {
        dfs(w, v);
        low[v] = Math.min(low[v], low[w]);
        // 버그: parent === -1(루트)인 경우도 그냥 같은 규칙을 적용한다 (children>=2 특수 처리 없음)
        if (low[w] >= disc[v]) {
          isAP[v] = true;
        }
      } else if (w !== parent) {
        low[v] = Math.min(low[v], disc[w]);
      }
    }
  }

  for (let v = 0; v < n; v++) {
    if (disc[v] === -1) dfs(v, -1);
  }

  const result: number[] = [];
  for (let v = 0; v < n; v++) if (isAP[v]) result.push(v);
  return result;
}

// ── 최적화 코드: 재귀를 명시적 스택으로 바꾼 최종 구현 ─────────────────────────
export function articulationPoints(n: number, edges: [number, number][]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const disc = new Array<number>(n).fill(-1);
  const low = new Array<number>(n).fill(-1);
  const isAP = new Array<boolean>(n).fill(false);
  let timer = 0;

  // 프레임: [v, parent, 다음에 볼 adj 인덱스, 이 v가 루트에서 만든 tree-edge 자식 수]
  type Frame = { v: number; parent: number; idx: number; children: number };

  for (let start = 0; start < n; start++) {
    if (disc[start] !== -1) continue;

    const stack: Frame[] = [{ v: start, parent: -1, idx: 0, children: 0 }];
    disc[start] = low[start] = timer++;

    while (stack.length > 0) {
      const top = stack[stack.length - 1]!;
      const { v, parent } = top;
      const neighbors = adj[v];

      if (top.idx < neighbors.length) {
        const w = neighbors[top.idx]!;
        top.idx++;
        if (w === v) continue; // 자기 루프 스킵

        if (disc[w] === -1) {
          top.children++;
          disc[w] = low[w] = timer++;
          stack.push({ v: w, parent: v, idx: 0, children: 0 });
        } else if (w !== parent) {
          low[v] = Math.min(low[v], disc[w]);
        }
      } else {
        // v의 인접 리스트를 모두 처리했다 → 부모에게 low를 전파하고 스택에서 내린다
        stack.pop();
        if (stack.length > 0) {
          const parentFrame = stack[stack.length - 1]!;
          low[parentFrame.v] = Math.min(low[parentFrame.v], low[v]);
          if (parentFrame.parent !== -1 && low[v] >= disc[parentFrame.v]) {
            isAP[parentFrame.v] = true;
          }
        } else if (parent === -1 && top.children >= 2) {
          isAP[v] = true;
        }
      }
    }
  }

  const result: number[] = [];
  for (let v = 0; v < n; v++) if (isAP[v]) result.push(v);
  return result;
}

// ── 실측 실행 ────────────────────────────────────────────────────────────────
function eq(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

console.log("=== 대표 예시: 시뮬레이션용 그래프 n=5, edges=[[0,1],[1,2],[2,0],[1,3],[3,4]] ===");
{
  const n = 5;
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 0],
    [1, 3],
    [3, 4],
  ];
  console.log("naive   :", articulationPointsNaive(n, edges));
  console.log("basic   :", articulationPointsBasic(n, edges));
  console.log("optimal :", articulationPoints(n, edges));
}

console.log("\n=== 루트 특수 처리 누락 트랩 시연 (같은 그래프) ===");
{
  const n = 5;
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 0],
    [1, 3],
    [3, 4],
  ];
  console.log("정답(최적화 코드)         :", articulationPoints(n, edges));
  console.log("버그(루트 특수 처리 누락) :", articulationPointsBuggyNoRootRule(n, edges));
}

console.log("\n=== problem.md 예시들 ===");
{
  console.log("chain 0-1-2:", articulationPoints(3, [[0, 1], [1, 2]])); // [1]
  console.log(
    "두 사이클 공유 정점 2:",
    articulationPoints(5, [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 2],
    ]),
  ); // [2]
  console.log("삼각형:", articulationPoints(3, [[0, 1], [1, 2], [2, 0]])); // []
  console.log("간선 없음:", articulationPoints(5, [])); // []
  console.log("V=1:", articulationPoints(1, [])); // []
}

console.log("\n=== 엣지 케이스: 자기 루프 / 분리된 성분 / 두 정점 ===");
{
  console.log(
    "자기 루프 포함 사이클:",
    articulationPoints(3, [
      [0, 0],
      [0, 1],
      [1, 2],
      [2, 0],
    ]),
  ); // []
  console.log(
    "분리된 두 체인 (0-1-2, 3-4-5):",
    articulationPoints(6, [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
    ]),
  ); // [1, 4]
  console.log("두 정점 단일 간선:", articulationPoints(2, [[0, 1]])); // []
  console.log("선형 경로 0-1-2-3-4:", articulationPoints(5, [[0, 1], [1, 2], [2, 3], [3, 4]])); // [1,2,3]
  console.log(
    "두 사이클이 다리로 연결:",
    articulationPoints(6, [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 3],
    ]),
  ); // [2,3]
}

console.log("\n=== 무작위 교차검증 (naive vs basic vs optimal, 소규모) ===");
{
  let seed = 42;
  function rnd() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  let mismatches = 0;
  for (let trial = 0; trial < 300; trial++) {
    const n = 1 + Math.floor(rnd() * 8);
    const edgeCount = Math.floor(rnd() * 10);
    const edges: [number, number][] = [];
    for (let i = 0; i < edgeCount; i++) {
      const u = Math.floor(rnd() * n);
      const v = Math.floor(rnd() * n);
      edges.push([u, v]);
    }
    const a = articulationPointsNaive(n, edges);
    const b = articulationPointsBasic(n, edges);
    const c = articulationPoints(n, edges);
    if (!eq(a, b) || !eq(b, c)) {
      mismatches++;
      console.log("MISMATCH", { n, edges, naive: a, basic: b, optimal: c });
    }
  }
  console.log(`무작위 300건 중 불일치 ${mismatches}건`);
}

console.log("\n=== 성능: V=10^5 체인 ===");
{
  const V = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  const start = performance.now();
  const result = articulationPoints(V, edges);
  const elapsed = performance.now() - start;
  console.log("길이:", result.length, "첫값:", result[0], "끝값:", result[result.length - 1], "ms:", elapsed.toFixed(2));
}
