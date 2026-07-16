// 함정 검증: u가 이미 mask에 있어도 체크 없이 전이하면 어떻게 되는가
function tspBitmaskBuggyRevisit(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;

  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      for (let u = 0; u < n; u++) {
        // BUG: u가 이미 mask에 있어도 체크하지 않고 전이
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

const dist3 = [
  [0, 1, 2],
  [2, 0, 1],
  [1, 2, 0],
];
console.log("정답(올바른 구현): 3");
console.log("버그 구현(재방문 허용) 결과:", tspBitmaskBuggyRevisit(dist3));

// 함정 검증 2: 최종 loop에서 v=0도 포함하면?
function tspBitmaskIncludeV0(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  const FULL = (1 << n) - 1;
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue;
        const next = mask | (1 << u);
        const cand = dp[mask][v] + dist[v][u];
        if (cand < dp[next][u]) dp[next][u] = cand;
      }
    }
  }
  let answer = Infinity;
  for (let v = 0; v < n; v++) { // BUG: v=0부터 포함
    answer = Math.min(answer, dp[FULL][v] + dist[v][0]);
  }
  return answer;
}
console.log("v=0 포함 버전 결과 (dp[111][0] 확인용):", tspBitmaskIncludeV0(dist3));
