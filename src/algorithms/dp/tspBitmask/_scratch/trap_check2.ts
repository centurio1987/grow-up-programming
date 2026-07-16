const dist3 = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
];

// 함정 A: dp를 0으로 초기화 (Infinity 대신)
function tspBitmaskZeroInit(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(0)); // BUG
  dp[1][0] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      if (!(mask & (1 << v))) continue;
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue;
        const next = mask | (1 << u);
        const cand = dp[mask][v] + dist[v][u];
        if (cand < dp[next][u]) dp[next][u] = cand;
      }
    }
  }
  let answer = Infinity;
  for (let v = 1; v < n; v++) {
    answer = Math.min(answer, dp[FULL][v] + dist[v][0]);
  }
  return answer;
}
console.log("정답: 3");
console.log("함정A(0 초기화) 결과:", tspBitmaskZeroInit(dist3));

// 함정 B: n=1 가드 누락
function tspBitmaskNoGuard(dist: number[][]): number {
  const n = dist.length;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      if (!(mask & (1 << v))) continue;
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue;
        const next = mask | (1 << u);
        const cand = dp[mask][v] + dist[v][u];
        if (cand < dp[next][u]) dp[next][u] = cand;
      }
    }
  }
  let answer = Infinity;
  for (let v = 1; v < n; v++) {
    answer = Math.min(answer, dp[FULL][v] + dist[v][0]);
  }
  return answer;
}
console.log("정답(n=1): 0");
console.log("함정B(가드 누락) 결과:", tspBitmaskNoGuard([[0]]));

// 함정 C: mask 순회를 내림차순으로 (의존성 위반)
function tspBitmaskDescMask(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  for (let mask = FULL; mask >= 1; mask--) { // BUG: 내림차순
    for (let v = 0; v < n; v++) {
      if (!(mask & (1 << v))) continue;
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue;
        const next = mask | (1 << u);
        const cand = dp[mask][v] + dist[v][u];
        if (cand < dp[next][u]) dp[next][u] = cand;
      }
    }
  }
  let answer = Infinity;
  for (let v = 1; v < n; v++) {
    answer = Math.min(answer, dp[FULL][v] + dist[v][0]);
  }
  return answer;
}
console.log("정답: 3");
console.log("함정C(내림차순 순회) 결과:", tspBitmaskDescMask(dist3));
