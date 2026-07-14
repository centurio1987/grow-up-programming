// 낭비 비율 실측 (n=12)
function countWaste(n: number) {
  const FULL = (1 << n) - 1;
  let totalVIter = 0;      // mask x v 순회 총 횟수
  let skippedNotInMask = 0; // v가 mask에 없어 스킵
  let skippedInfinity = 0;  // v는 mask에 있지만 아직 도달 못해 스킵(더미 실행으로 판정)
  const dp: number[][] = Array.from({ length: FULL + 1 }, () => new Array(n).fill(Infinity));
  dp[1][0] = 0;
  const dist: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : 1 + ((i * 7 + j * 13) % 50)))
  );

  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      totalVIter++;
      if (!(mask & (1 << v))) { skippedNotInMask++; continue; }
      if (dp[mask][v] === Infinity) { skippedInfinity++; continue; }
      for (let u = 0; u < n; u++) {
        if (mask & (1 << u)) continue;
        const next = mask | (1 << u);
        const cand = dp[mask][v] + dist[v][u];
        if (cand < dp[next][u]) dp[next][u] = cand;
      }
    }
  }
  const processed = totalVIter - skippedNotInMask - skippedInfinity;
  console.log(`n=${n}: mask*v 순회=${totalVIter}, v not-in-mask 스킵=${skippedNotInMask} (${(100*skippedNotInMask/totalVIter).toFixed(1)}%), 미도달(Infinity) 스킵=${skippedInfinity} (${(100*skippedInfinity/totalVIter).toFixed(1)}%), 실제 처리=${processed} (${(100*processed/totalVIter).toFixed(1)}%)`);
}
countWaste(12);
countWaste(16);
