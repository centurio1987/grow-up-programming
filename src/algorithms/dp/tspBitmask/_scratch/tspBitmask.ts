// 원형: naive permutation recursion
function tspNaive(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;

  function search(current: number, visited: number, cost: number): number {
    if (visited === (1 << n) - 1) {
      return cost + dist[current][0];
    }
    let best = Infinity;
    for (let next = 0; next < n; next++) {
      if (visited & (1 << next)) continue;
      const cand = search(next, visited | (1 << next), cost + dist[current][next]);
      if (cand < best) best = cand;
    }
    return best;
  }

  return search(0, 1, 0);
}

// 기본 구현: 정확하지만 낭비가 있는 bottom-up 배열 DP
function tspBitmaskBasic(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;

  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue; // u는 이미 방문 - 정확성 필수
        const next = mask | (1 << u);
        const cand = dp[mask][v] + dist[v][u];
        if (cand < dp[next][u]) dp[next][u] = cand;
      }
    }
  }

  let answer = Infinity;
  for (let v = 1; v < n; v++) {
    const cand = dp[FULL][v] + dist[v][0];
    if (cand < answer) answer = cand;
  }
  return answer;
}

// 최적화 코드: 유효 상태만 순회 + flat typed array
function tspBitmask(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  const FULL = (1 << n) - 1;
  const size = (FULL + 1) * n;
  const dp = new Float64Array(size).fill(Infinity);
  dp[1 * n + 0] = 0;

  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      if (!(mask & (1 << v))) continue; // v가 mask에 없으면 도달 불가능한 상태
      const cur = dp[mask * n + v];
      if (cur === Infinity) continue; // 아직 갱신된 적 없는 상태는 건너뜀
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue; // u는 이미 방문 - 정확성 필수
        const next = mask | (1 << u);
        const cand = cur + dist[v][u];
        const idx = next * n + u;
        if (cand < dp[idx]) dp[idx] = cand;
      }
    }
  }

  let answer = Infinity;
  for (let v = 1; v < n; v++) {
    const cand = dp[FULL * n + v] + dist[v][0];
    if (cand < answer) answer = cand;
  }
  return answer;
}

// ---- 검증 ----

function assertEq(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

// 대표 예시: 3개 도시
const dist3 = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
];
console.log("=== 대표 예시 (3 city) ===");
assertEq("naive", tspNaive(dist3), 3);
assertEq("basic", tspBitmaskBasic(dist3), 3);
assertEq("optimized", tspBitmask(dist3), 3);

// 엣지: n=1
console.log("=== n=1 ===");
assertEq("naive", tspNaive([[0]]), 0);
assertEq("basic", tspBitmaskBasic([[0]]), 0);
assertEq("optimized", tspBitmask([[0]]), 0);

// 엣지: n=2
console.log("=== n=2 ===");
const dist2 = [
  [0, 10],
  [10, 0],
];
assertEq("naive", tspNaive(dist2), 20);
assertEq("basic", tspBitmaskBasic(dist2), 20);
assertEq("optimized", tspBitmask(dist2), 20);

// 비대칭 3x3 (problem.md 예시)
console.log("=== 비대칭 3x3 ===");
const distAsym = [
  [0, 1, 10],
  [10, 0, 1],
  [1, 10, 0],
];
assertEq("naive", tspNaive(distAsym), 3);
assertEq("basic", tspBitmaskBasic(distAsym), 3);
assertEq("optimized", tspBitmask(distAsym), 3);

// 4x4 (problem.md 예시)
console.log("=== 4x4 ===");
const dist4 = [
  [0, 10, 15, 20],
  [10, 0, 35, 25],
  [15, 35, 0, 30],
  [20, 25, 30, 0],
];
assertEq("naive", tspNaive(dist4), 80);
assertEq("basic", tspBitmaskBasic(dist4), 80);
assertEq("optimized", tspBitmask(dist4), 80);

// 무작위 교차검증 (n=1..7)
console.log("=== 무작위 교차검증 ===");
function randDist(n: number): number[][] {
  const d: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) d[i][j] = 1 + Math.floor(Math.random() * 50);
    }
  }
  return d;
}
let randFail = false;
for (let trial = 0; trial < 200; trial++) {
  const n = 1 + Math.floor(Math.random() * 7); // 1..7
  const d = randDist(n);
  const a = tspNaive(d);
  const b = tspBitmaskBasic(d);
  const c = tspBitmask(d);
  if (a !== b || b !== c) {
    randFail = true;
    console.log(`FAIL trial=${trial} n=${n} naive=${a} basic=${b} optimized=${c}`, d);
  }
}
console.log(randFail ? "무작위 교차검증: FAIL 있음" : "무작위 교차검증: 200회 모두 일치");

// mask 초기화 단계 실측 (초기화 프레임 확인용)
console.log("=== 초기화 직후 dp 값 (3 city, mask=001) ===");
{
  const n = 3;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  console.log("dp[001] =", dp[1]);
}

// 순회 첫 스텝 실측 (mask=001, v=0 에서 전이)
console.log("=== mask=001, v=0 전이 후 ===");
{
  const n = 3;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  const mask = 1;
  const v = 0;
  for (let u = 0; u < n; u++) {
    if (mask & (1 << u)) continue;
    const next = mask | (1 << u);
    const cand = dp[mask][v] + dist3[v][u];
    if (cand < dp[next][u]) dp[next][u] = cand;
  }
  console.log("dp[011] =", dp[0b011], "dp[101] =", dp[0b101]);
}

// 성능 비교 (기본 구현 vs 최적화 구현), n=16
console.log("=== 성능 비교 n=16 ===");
{
  const n = 16;
  const d = randDist(n);
  const t0 = performance.now();
  const rBasic = tspBitmaskBasic(d);
  const t1 = performance.now();
  const rOpt = tspBitmask(d);
  const t2 = performance.now();
  console.log(`basic=${rBasic} time=${(t1 - t0).toFixed(1)}ms`);
  console.log(`optimized=${rOpt} time=${(t2 - t1).toFixed(1)}ms`);
  console.log("일치:", rBasic === rOpt);
}
