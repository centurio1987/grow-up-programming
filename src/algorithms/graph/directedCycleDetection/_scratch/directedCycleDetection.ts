// 가이드 본문 코드 자기 검증용 스크래치 파일 (E3)
// 가이드에 싣는 코드를 그대로 옮겨 실제 실행 결과로 본문 수치를 검증한다.

const WHITE = 0;
const GRAY = 1;
const BLACK = 2;

// ── naive: 정점마다 DFS를 새로 시작해 자기 자신으로 돌아오는지 확인 ──
function directedCycleDetectionNaive(
  n: number,
  edges: [number, number][],
): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);

  function reachesBack(start: number, v: number, visited: Set<number>): boolean {
    for (const w of adj[v]) {
      if (w === start) return true; // start로 돌아오는 경로 발견
      if (!visited.has(w)) {
        visited.add(w);
        if (reachesBack(start, w, visited)) return true;
      }
    }
    return false;
  }

  for (let s = 0; s < n; s++) {
    if (reachesBack(s, s, new Set([s]))) return true;
  }
  return false;
}

// ── 기본 구현: 3색 DFS (재귀) ──
function directedCycleDetectionRecursive(
  n: number,
  edges: [number, number][],
): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v); // 유향: 단방향만 등록

  const color = new Array<number>(n).fill(WHITE);

  function dfs(v: number): boolean {
    color[v] = GRAY; // 현재 DFS 경로에 올라감

    for (const w of adj[v]) {
      if (color[w] === GRAY) return true; // back edge = 사이클
      if (color[w] === WHITE) {
        if (dfs(w)) return true;
      }
      // BLACK이면 스킵 (이미 사이클 없음이 확인된 정점)
    }

    color[v] = BLACK; // 서브트리 탐색 완료, 사이클 없음 확정
    return false;
  }

  for (let s = 0; s < n; s++) {
    if (color[s] === WHITE) {
      if (dfs(s)) return true;
    }
  }

  return false;
}

// ── 최적화 구현: 3색 DFS (명시적 스택, 반복) ──
function directedCycleDetection(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);

  const color = new Array<number>(n).fill(WHITE);

  for (let s = 0; s < n; s++) {
    if (color[s] !== WHITE) continue;

    // 스택 프레임 = [정점, 다음에 검사할 인접 리스트 인덱스]
    const stack: [number, number][] = [[s, 0]];
    color[s] = GRAY;

    while (stack.length > 0) {
      const top = stack[stack.length - 1]!;
      const v = top[0];
      const idx = top[1];

      if (idx < adj[v].length) {
        const w = adj[v][idx]!;
        top[1] = idx + 1; // 이 프레임으로 돌아왔을 때 다음 이웃부터 이어본다
        if (color[w] === GRAY) return true; // back edge = 사이클
        if (color[w] === WHITE) {
          color[w] = GRAY;
          stack.push([w, 0]);
        }
        // BLACK이면 스킵
      } else {
        color[v] = BLACK; // 이 정점의 인접 리스트를 다 봤다 = 서브트리 탐색 완료
        stack.pop();
      }
    }
  }

  return false;
}

// ── 검증 유틸 ──
function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: got=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

function chainEdges(n: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
  return edges;
}

// 대표 예시 (시뮬레이션과 동일 입력)
for (const [label, fn] of [
  ["재귀", directedCycleDetectionRecursive],
  ["반복(최종)", directedCycleDetection],
] as const) {
  assertEq(`[${label}] 대표: n=4, [[0,1],[1,2],[2,0],[2,3]]`, fn(4, [[0, 1], [1, 2], [2, 0], [2, 3]]), true);
  assertEq(`[${label}] 0→1→2→0`, fn(3, [[0, 1], [1, 2], [2, 0]]), true);
  assertEq(`[${label}] 자기 루프 0→0`, fn(1, [[0, 0]]), true);
  assertEq(`[${label}] 양방향 0→1,1→0`, fn(2, [[0, 1], [1, 0]]), true);
  assertEq(`[${label}] 선형 DAG 0→1→2→3`, fn(4, [[0, 1], [1, 2], [2, 3]]), false);
  assertEq(`[${label}] 다이아몬드 DAG (cross edge)`, fn(4, [[0, 1], [0, 2], [1, 3], [2, 3]]), false);
  assertEq(`[${label}] 간선 없음`, fn(5, []), false);
  assertEq(`[${label}] 분리된 컴포넌트: {0→1}, {2→3→2}`, fn(4, [[0, 1], [2, 3], [3, 2]]), true);
}

// naive ↔ 재귀 ↔ 반복 3자 교차 검증 (랜덤)
function randomEdges(n: number, e: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < e; i++) {
    const u = Math.floor(Math.random() * n);
    const v = Math.floor(Math.random() * n);
    edges.push([u, v]);
  }
  return edges;
}

let mismatches = 0;
for (let trial = 0; trial < 500; trial++) {
  const n = 1 + Math.floor(Math.random() * 8);
  const e = Math.floor(Math.random() * 10);
  const edges = randomEdges(n, e);
  const a = directedCycleDetectionNaive(n, edges);
  const b = directedCycleDetectionRecursive(n, edges);
  const c = directedCycleDetection(n, edges);
  if (a !== b || b !== c) {
    mismatches++;
    console.log("MISMATCH", { n, edges, naive: a, recursive: b, iterative: c });
  }
}
console.log(`랜덤 교차검증 500회 완료 (naive/재귀/반복 3자 일치), mismatch=${mismatches}`);

// 재귀 깊이 한계 실측: 체인 그래프에서 재귀 버전이 어디서 무너지는지
{
  const n = 100000;
  const edges = chainEdges(n);

  let recursiveResult: string;
  try {
    directedCycleDetectionRecursive(n, edges);
    recursiveResult = "성공(오버플로 없음)";
  } catch (e) {
    recursiveResult = "실패: " + (e as Error).message;
  }
  console.log(`[재귀] n=${n} 체인 그래프(DAG) → ${recursiveResult}`);

  const t0 = performance.now();
  const iterResult = directedCycleDetection(n, edges);
  const t1 = performance.now();
  console.log(`[반복] n=${n} 체인 그래프(DAG) → result=${iterResult}, ${(t1 - t0).toFixed(2)}ms (오버플로 없음)`);
}

// 재귀가 실제로 무너지기 시작하는 지점을 이진 탐색으로 실측
{
  function tryDepth(n: number): boolean {
    try {
      directedCycleDetectionRecursive(n, chainEdges(n));
      return true;
    } catch {
      return false;
    }
  }
  let lo = 1000, hi = 200000;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (tryDepth(mid)) lo = mid; else hi = mid - 1;
  }
  console.log(`[재귀] 안전하게 처리하는 최대 체인 길이 실측 ≈ ${lo} (이 환경 기준)`);
}

// 반복형이 정점 10만 개 체인에서도 사이클을 정확히 잡아내는지(자기 루프 포함) 재확인
{
  const n = 100000;
  const edges = chainEdges(n);
  edges.push([n - 1, n - 1]); // 마지막 정점에 자기 루프 추가 → 사이클 있음
  const result = directedCycleDetection(n, edges);
  console.log(`[반복] n=${n} 체인 + 마지막에 자기 루프 → result=${result} (true여야 함)`);
}
