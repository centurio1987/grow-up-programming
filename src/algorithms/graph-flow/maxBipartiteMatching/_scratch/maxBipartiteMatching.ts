// E3 자기검증 스크래치 — 가이드 본문에 실릴 세 코드(브루트포스/기본구현/최적화)를
// 그대로 옮겨 실행하고, 가이드에 적을 모든 수치를 실측으로 확정한다.

// ---------- 0. 브루트포스 (부분집합 열거, 아주 작은 예시 전용) ----------
function maxBipartiteMatchingBrute(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const E = edges.length;
  let best = 0;
  for (let mask = 0; mask < 1 << E; mask++) {
    const usedL = new Set<number>();
    const usedR = new Set<number>();
    let ok = true;
    let size = 0;
    for (let i = 0; i < E; i++) {
      if (!(mask & (1 << i))) continue;
      const [u, v] = edges[i]!;
      if (usedL.has(u) || usedR.has(v)) {
        ok = false;
        break;
      }
      usedL.add(u);
      usedR.add(v);
      size++;
    }
    if (ok) best = Math.max(best, size);
  }
  return best;
}

// ---------- 1. 기본 구현: 단순 헝가리안 DFS (증가 경로를 하나씩) ----------
function maxBipartiteMatchingBasic(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);

  const matchR = new Array<number>(right).fill(-1); // NIL = -1

  function tryAugment(u: number, visited: boolean[]): boolean {
    for (const v of adj[u]!) {
      if (visited[v]) continue;
      visited[v] = true;
      if (matchR[v] === -1 || tryAugment(matchR[v]!, visited)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  }

  let matching = 0;
  for (let u = 0; u < left; u++) {
    const visited = new Array<boolean>(right).fill(false);
    if (tryAugment(u, visited)) matching++;
  }
  return matching;
}

// 계측판: 기본 구현이 3x3 예시에서 남기는 matchR 트레이스(시뮬레이션 대조용)
function maxBipartiteMatchingBasicTraced(
  left: number,
  right: number,
  edges: [number, number][],
): { matching: number; matchR: number[]; log: string[] } {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);
  const matchR = new Array<number>(right).fill(-1);
  const log: string[] = [];

  function tryAugment(u: number, visited: boolean[]): boolean {
    for (const v of adj[u]!) {
      if (visited[v]) continue;
      visited[v] = true;
      if (matchR[v] === -1 || tryAugment(matchR[v]!, visited)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  }

  let matching = 0;
  for (let u = 0; u < left; u++) {
    const visited = new Array<boolean>(right).fill(false);
    const before = matchR.slice();
    const ok = tryAugment(u, visited);
    if (ok) matching++;
    log.push(
      `u=${u}: ${ok ? "성공" : "실패"} | before=${JSON.stringify(before)} after=${JSON.stringify(matchR)} matching=${matching}`,
    );
  }
  return { matching, matchR, log };
}

// ---------- 2. 최적화: Hopcroft-Karp (BFS 레이어 + DFS 배치) ----------
function maxBipartiteMatching(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const NIL = -1;
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);

  const matchL = new Array<number>(left).fill(NIL);
  const matchR = new Array<number>(right).fill(NIL);
  const dist = new Array<number>(left).fill(Infinity);

  function bfs(): boolean {
    const queue: number[] = [];
    for (let u = 0; u < left; u++) {
      if (matchL[u] === NIL) {
        dist[u] = 0;
        queue.push(u);
      } else {
        dist[u] = Infinity;
      }
    }
    let found = false;
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const v of adj[u]!) {
        const next = matchR[v]!;
        if (next === NIL) {
          found = true;
        } else if (dist[next] === Infinity) {
          dist[next] = dist[u]! + 1;
          queue.push(next);
        }
      }
    }
    return found;
  }

  function dfs(u: number): boolean {
    for (const v of adj[u]!) {
      const next = matchR[v]!;
      if (next === NIL || (dist[next] === dist[u]! + 1 && dfs(next))) {
        matchL[u] = v;
        matchR[v] = u;
        return true;
      }
    }
    dist[u] = Infinity;
    return false;
  }

  let matching = 0;
  while (bfs()) {
    for (let u = 0; u < left; u++) {
      if (matchL[u] === NIL && dfs(u)) matching++;
    }
  }
  return matching;
}

// 계측판: Hopcroft-Karp가 3x3 예시에서 라운드마다 남기는 dist/matchL 트레이스
function maxBipartiteMatchingTraced(
  left: number,
  right: number,
  edges: [number, number][],
) {
  const NIL = -1;
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);

  const matchL = new Array<number>(left).fill(NIL);
  const matchR = new Array<number>(right).fill(NIL);
  const dist = new Array<number>(left).fill(Infinity);
  const rounds: string[] = [];

  function bfs(): boolean {
    const queue: number[] = [];
    for (let u = 0; u < left; u++) {
      if (matchL[u] === NIL) {
        dist[u] = 0;
        queue.push(u);
      } else {
        dist[u] = Infinity;
      }
    }
    let found = false;
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const v of adj[u]!) {
        const next = matchR[v]!;
        if (next === NIL) {
          found = true;
        } else if (dist[next] === Infinity) {
          dist[next] = dist[u]! + 1;
          queue.push(next);
        }
      }
    }
    return found;
  }

  function dfs(u: number): boolean {
    for (const v of adj[u]!) {
      const next = matchR[v]!;
      if (next === NIL || (dist[next] === dist[u]! + 1 && dfs(next))) {
        matchL[u] = v;
        matchR[v] = u;
        return true;
      }
    }
    dist[u] = Infinity;
    return false;
  }

  let matching = 0;
  let round = 0;
  while (bfs()) {
    round++;
    const distSnapshotAfterBFS = dist.map((d) => (d === Infinity ? "INF" : d));
    let augmentedThisRound = 0;
    for (let u = 0; u < left; u++) {
      if (matchL[u] === NIL && dfs(u)) {
        matching++;
        augmentedThisRound++;
      }
    }
    rounds.push(
      `라운드${round}: BFS 후 dist=${JSON.stringify(distSnapshotAfterBFS)} | 이 라운드 증가 경로 수=${augmentedThisRound} | 누적 matching=${matching} | matchL=${JSON.stringify(matchL)}`,
    );
  }
  return { matching, matchL: matchL.slice(), matchR: matchR.slice(), rounds };
}

// =====================================================================
// 실행 검증
// =====================================================================

console.log("=== problem.md 예시 교차검증 ===");
const cases: Array<[number, number, [number, number][], number]> = [
  [3, 3, [[0, 0], [0, 1], [1, 0], [1, 2], [2, 2]], 3],
  [2, 2, [[0, 0], [1, 0]], 1],
  [3, 3, [], 0],
  [4, 1, [[0, 0], [1, 0], [2, 0], [3, 0]], 1],
  [3, 3, [[0, 0], [0, 1], [1, 0], [2, 1], [2, 2]], 3],
];
for (const [L, R, E, expected] of cases) {
  const brute = E.length <= 20 ? maxBipartiteMatchingBrute(L, R, E) : null;
  const basic = maxBipartiteMatchingBasic(L, R, E);
  const opt = maxBipartiteMatching(L, R, E);
  console.log(
    `L=${L} R=${R} E=${JSON.stringify(E)} → expected=${expected} brute=${brute} basic=${basic} opt=${opt} ${
      basic === expected && opt === expected && (brute === null || brute === expected) ? "OK" : "MISMATCH!!"
    }`,
  );
}

console.log("\n=== 엣지 케이스 ===");
console.log("L=1,R=1,E=[] →", maxBipartiteMatching(1, 1, []));
console.log("L=1,R=1,E=[[0,0]] →", maxBipartiteMatching(1, 1, [[0, 0]]));
console.log(
  "완전 이분(L=3,R=3, 모든 간선) →",
  maxBipartiteMatching(
    3,
    3,
    [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ],
  ),
);
console.log(
  "단방향 연결(L=1,R=3) →",
  maxBipartiteMatching(1, 3, [[0, 0], [0, 1], [0, 2]]),
);
console.log(
  "중복 간선(L=2,R=2) →",
  maxBipartiteMatching(2, 2, [[0, 0], [0, 0], [0, 0], [1, 0], [1, 1]]),
);

console.log("\n=== 3x3 대표 예시: 기본 구현(단순 헝가리안 DFS) 트레이스 ===");
const basicTrace = maxBipartiteMatchingBasicTraced(
  3,
  3,
  [[0, 0], [0, 1], [1, 0], [1, 2], [2, 2]],
);
for (const line of basicTrace.log) console.log(line);
console.log("최종 matchR:", basicTrace.matchR, "matching:", basicTrace.matching);

console.log("\n=== 3x3 대표 예시: Hopcroft-Karp 라운드 트레이스 ===");
const hkTrace = maxBipartiteMatchingTraced(
  3,
  3,
  [[0, 0], [0, 1], [1, 0], [1, 2], [2, 2]],
);
for (const line of hkTrace.rounds) console.log(line);
console.log("최종 matchL:", hkTrace.matchL, "matchR:", hkTrace.matchR, "matching:", hkTrace.matching);

console.log("\n=== 무작위 교차검증 (basic vs opt vs brute-소규모) ===");
function randomEdges(L: number, R: number, p: number, seed: number): [number, number][] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const edges: [number, number][] = [];
  for (let u = 0; u < L; u++) {
    for (let v = 0; v < R; v++) {
      if (rand() < p) edges.push([u, v]);
    }
  }
  return edges;
}
let allOk = true;
for (let trial = 0; trial < 200; trial++) {
  const L = 1 + (trial % 6);
  const R = 1 + ((trial * 3) % 6);
  const p = 0.2 + 0.15 * (trial % 5);
  const edges = randomEdges(L, R, p, trial * 97 + 13);
  const basic = maxBipartiteMatchingBasic(L, R, edges);
  const opt = maxBipartiteMatching(L, R, edges);
  const brute = edges.length <= 16 ? maxBipartiteMatchingBrute(L, R, edges) : null;
  if (basic !== opt || (brute !== null && brute !== opt)) {
    allOk = false;
    console.log(
      `MISMATCH trial=${trial} L=${L} R=${R} edges=${JSON.stringify(edges)} basic=${basic} opt=${opt} brute=${brute}`,
    );
  }
}
console.log(allOk ? "무작위 200케이스 전부 일치 (OK)" : "불일치 발견!!");

console.log("\n=== 단순 그리디(재배치 없음) vs 증가 경로(재배치) 비교 ===");
function greedyNoReassign(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);
  const usedR = new Array<boolean>(right).fill(false);
  let matching = 0;
  for (let u = 0; u < left; u++) {
    for (const v of adj[u]!) {
      if (!usedR[v]) {
        usedR[v] = true;
        matching++;
        break;
      }
    }
  }
  return matching;
}
const gEdges: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 2], [2, 2]];
console.log("그리디(재배치 없음):", greedyNoReassign(3, 3, gEdges));
console.log("증가 경로(기본 구현):", maxBipartiteMatchingBasic(3, 3, gEdges));

console.log("\n=== 함정: visited를 u마다 리셋하지 않으면? ===");
function maxBipartiteMatchingBuggyNoReset(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);
  const matchR = new Array<number>(right).fill(-1);
  const visited = new Array<boolean>(right).fill(false); // 버그: 루프 밖에서 한 번만 생성

  function tryAugment(u: number): boolean {
    for (const v of adj[u]!) {
      if (visited[v]) continue;
      visited[v] = true;
      if (matchR[v] === -1 || tryAugment(matchR[v]!)) {
        matchR[v] = u;
        return true;
      }
    }
    return false;
  }

  let matching = 0;
  for (let u = 0; u < left; u++) {
    if (tryAugment(u)) matching++;
  }
  return matching;
}
console.log("정상(visited 매번 리셋):", maxBipartiteMatchingBasic(3, 3, gEdges));
console.log("버그(visited 한 번만 생성):", maxBipartiteMatchingBuggyNoReset(3, 3, gEdges));

console.log("\n=== 함정: BFS가 첫 미매칭 오른쪽 정점에서 즉시 멈추면? ===");
function maxBipartiteMatchingBuggyEarlyExit(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const NIL = -1;
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);
  const matchL = new Array<number>(left).fill(NIL);
  const matchR = new Array<number>(right).fill(NIL);
  const dist = new Array<number>(left).fill(Infinity);

  function bfs(): boolean {
    const queue: number[] = [];
    for (let u = 0; u < left; u++) {
      if (matchL[u] === NIL) { dist[u] = 0; queue.push(u); } else dist[u] = Infinity;
    }
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const v of adj[u]!) {
        const next = matchR[v]!;
        if (next === NIL) {
          return true; // 버그: 같은 라운드의 다른 최단 경로를 더 찾지 않고 즉시 반환
        } else if (dist[next] === Infinity) {
          dist[next] = dist[u]! + 1;
          queue.push(next);
        }
      }
    }
    return false;
  }
  function dfs(u: number): boolean {
    for (const v of adj[u]!) {
      const next = matchR[v]!;
      if (next === NIL || (dist[next] === dist[u]! + 1 && dfs(next))) {
        matchL[u] = v; matchR[v] = u; return true;
      }
    }
    dist[u] = Infinity;
    return false;
  }
  let matching = 0;
  while (bfs()) {
    for (let u = 0; u < left; u++) if (matchL[u] === NIL && dfs(u)) matching++;
  }
  return matching;
}
let earlyExitMismatch: { L: number; R: number; edges: [number, number][]; correct: number; buggy: number } | null = null;
for (let trial = 0; trial < 500 && !earlyExitMismatch; trial++) {
  const L = 2 + (trial % 5);
  const R = 2 + ((trial * 7) % 5);
  const p = 0.25 + 0.1 * (trial % 4);
  const edges = randomEdges(L, R, p, trial * 53 + 7);
  const correct = maxBipartiteMatching(L, R, edges);
  const buggy = maxBipartiteMatchingBuggyEarlyExit(L, R, edges);
  if (correct !== buggy) earlyExitMismatch = { L, R, edges, correct, buggy };
}
console.log(earlyExitMismatch ?? "500회 무작위 시도 안에서 불일치 사례를 찾지 못함(정확성엔 영향 없고 라운드 수만 늘어남 — 성능 함정)");

console.log("\n=== 함정: matching++ 를 dfs 내부에서 재귀마다 세면? ===");
function maxBipartiteMatchingBuggyDoubleCount(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  const NIL = -1;
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) adj[u]!.push(v);
  const matchL = new Array<number>(left).fill(NIL);
  const matchR = new Array<number>(right).fill(NIL);
  const dist = new Array<number>(left).fill(Infinity);
  let matching = 0; // 버그: dfs 내부에서 성공할 때마다 증가시킬 것

  function bfs(): boolean {
    const queue: number[] = [];
    for (let u = 0; u < left; u++) {
      if (matchL[u] === NIL) { dist[u] = 0; queue.push(u); } else dist[u] = Infinity;
    }
    let found = false;
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++]!;
      for (const v of adj[u]!) {
        const next = matchR[v]!;
        if (next === NIL) found = true;
        else if (dist[next] === Infinity) { dist[next] = dist[u]! + 1; queue.push(next); }
      }
    }
    return found;
  }
  function dfs(u: number): boolean {
    for (const v of adj[u]!) {
      const next = matchR[v]!;
      if (next === NIL || (dist[next] === dist[u]! + 1 && dfs(next))) {
        matchL[u] = v; matchR[v] = u;
        matching++; // 버그: 경로 위의 재배치까지 전부 새 매칭으로 센다
        return true;
      }
    }
    dist[u] = Infinity;
    return false;
  }
  while (bfs()) {
    for (let u = 0; u < left; u++) if (matchL[u] === NIL) dfs(u);
  }
  return matching;
}
console.log("정상(최적화 코드):", maxBipartiteMatching(3, 3, gEdges));
console.log("버그(dfs 내부에서 카운트):", maxBipartiteMatchingBuggyDoubleCount(3, 3, gEdges));

console.log("\n=== 성능 목표용 자릿수 확인 ===");
console.log("L=1000,E=1e6 → naive(O(L*E)) 후보 연산수:", 1000 * 1e6);
console.log("sqrt(2000) ≈", Math.sqrt(2000));
console.log("E*sqrt(V) for E=1e6,V=2000 ≈", 1e6 * Math.sqrt(2000));

console.log("\n=== 스스로 점검하기용 예시 검증 ===");
const quizEdges: [number, number][] = [[0, 0], [0, 1], [1, 0], [2, 0]];
console.log("left=3,right=2,edges=", JSON.stringify(quizEdges), "→", maxBipartiteMatching(3, 2, quizEdges));
