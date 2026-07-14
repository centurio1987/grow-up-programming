// E3 자기검증용 스크래치. 가이드 본문에 실을 세 구현 + 오답 버전을 그대로 옮겨
// bun으로 실행하고, 대표 입력·시뮬 프레임·무작위 교차검증·순회방향 함정을 실측한다.

// ── 단계 1: 완전탐색 (O(2^n)) ──────────────────────────────────────────────
function knapsack01Naive(weights: number[], values: number[], W: number): number {
  const n = weights.length;

  function solve(i: number, remainW: number): number {
    if (i === n) return 0;
    const skip = solve(i + 1, remainW);
    const w = weights[i]!;
    const take = w <= remainW ? values[i]! + solve(i + 1, remainW - w) : -Infinity;
    return Math.max(skip, take);
  }

  return solve(0, W);
}

// ── 단계 2: 2D 바텀업 DP (O(nW) 시간, O(nW) 공간) ───────────────────────────
function knapsack01_2D(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const w_i = weights[i - 1]!;
    const v_i = values[i - 1]!;
    for (let w = 0; w <= W; w++) {
      if (w >= w_i) {
        dp[i]![w] = Math.max(dp[i - 1]![w]!, dp[i - 1]![w - w_i]! + v_i);
      } else {
        dp[i]![w] = dp[i - 1]![w]!;
      }
    }
  }

  return dp[n]![W]!;
}

// dp 표 전체를 반환하는 버전(시뮬 프레임 검증용)
function knapsack01_2D_trace(weights: number[], values: number[], W: number): number[][] {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const w_i = weights[i - 1]!;
    const v_i = values[i - 1]!;
    for (let w = 0; w <= W; w++) {
      if (w >= w_i) {
        dp[i]![w] = Math.max(dp[i - 1]![w]!, dp[i - 1]![w - w_i]! + v_i);
      } else {
        dp[i]![w] = dp[i - 1]![w]!;
      }
    }
  }
  return dp;
}

// ── 단계 3: 1D 롤링 배열 (O(nW) 시간, O(W) 공간) — 올바른 내림차순 ─────────
function knapsack01_1D(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);

  for (let i = 0; i < n; i++) {
    const w_i = weights[i]!;
    const v_i = values[i]!;
    for (let w = W; w >= w_i; w--) {
      dp[w] = Math.max(dp[w], dp[w - w_i]! + v_i);
    }
  }

  return dp[W]!;
}

// ── 함정 버전: 인덱스 오프셋 오류 (weights[i] 대신 weights[i-1]을 써야 함) ──
function knapsack01_2D_WRONG_offset(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const w_i = weights[i]; // 버그: weights[i-1]이어야 함
    const v_i = values[i]; // 버그: values[i-1]이어야 함
    for (let w = 0; w <= W; w++) {
      if (w_i !== undefined && w >= w_i) {
        dp[i]![w] = Math.max(dp[i - 1]![w]!, dp[i - 1]![w - w_i]! + (v_i ?? 0));
      } else {
        dp[i]![w] = dp[i - 1]![w]!;
      }
    }
  }

  return dp[n]![W]!;
}

// ── 함정 버전: 오름차순 순회 (무한 배낭처럼 동작 — 틀린 결과) ──────────────
function knapsack01_1D_WRONG_ascending(weights: number[], values: number[], W: number): number {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);

  for (let i = 0; i < n; i++) {
    const w_i = weights[i]!;
    const v_i = values[i]!;
    for (let w = w_i; w <= W; w++) {
      // 오름차순: dp[w - w_i]가 "이번 물건으로 이미 갱신된" 값일 수 있음
      dp[w] = Math.max(dp[w], dp[w - w_i]! + v_i);
    }
  }

  return dp[W]!;
}

// ── 실행부 ──────────────────────────────────────────────────────────────

console.log("=== 1) 가이드 주입 시뮬 입력 검증: weights=[1,3,4], values=[1,4,5], W=5 ===");
{
  const weights = [1, 3, 4];
  const values = [1, 4, 5];
  const W = 5;
  const trace = knapsack01_2D_trace(weights, values, W);
  console.log("dp 표 전체:");
  for (const row of trace) console.log("  ", row);
  console.log("naive :", knapsack01Naive(weights, values, W));
  console.log("2D    :", knapsack01_2D(weights, values, W));
  console.log("1D    :", knapsack01_1D(weights, values, W));
  console.log("기대값(시뮬 마지막 프레임): 6");
}

console.log("\n=== 2) 순회 방향 함정 실측: weights=[2,3], values=[3,4], W=4 ===");
{
  const weights = [2, 3];
  const values = [3, 4];
  const W = 4;
  console.log("naive (정답)      :", knapsack01Naive(weights, values, W));
  console.log("2D (정답)         :", knapsack01_2D(weights, values, W));
  console.log("1D 내림차순 (정답) :", knapsack01_1D(weights, values, W));
  console.log("1D 오름차순 (버그) :", knapsack01_1D_WRONG_ascending(weights, values, W));
}

console.log("\n=== 3) 순회 방향 함정 실측 #2: 가이드 메인 예시로도 재현되는지 ===");
{
  const weights = [1, 3, 4];
  const values = [1, 4, 5];
  const W = 5;
  console.log("1D 내림차순 (정답) :", knapsack01_1D(weights, values, W));
  console.log("1D 오름차순 (버그) :", knapsack01_1D_WRONG_ascending(weights, values, W));
}

console.log("\n=== 3-1) 인덱스 오프셋 함정 실측: weights=[5], values=[42], W=5 ===");
{
  const weights = [5];
  const values = [42];
  const W = 5;
  console.log("2D (정답)         :", knapsack01_2D(weights, values, W));
  console.log("2D 오프셋버그(오답):", knapsack01_2D_WRONG_offset(weights, values, W));
}

console.log("\n=== 4) 예시 문제(knapsack01-problem.md)의 예시들 교차검증 ===");
{
  const cases: [number[], number[], number, number][] = [
    [[1, 3, 4, 5], [1, 4, 5, 7], 7, 9],
    [[3, 4], [4, 5], 4, 5],
    [[1, 2, 3], [10, 20, 30], 10, 60],
    [[5], [10], 4, 0],
    [[], [], 10, 0],
  ];
  for (const [w, v, W, expected] of cases) {
    const n2 = knapsack01_2D(w, v, W);
    const n1 = knapsack01_1D(w, v, W);
    const nn = knapsack01Naive(w, v, W);
    const ok = n2 === expected && n1 === expected && nn === expected;
    console.log(
      `  w=${JSON.stringify(w)} v=${JSON.stringify(v)} W=${W} → expected=${expected} naive=${nn} 2D=${n2} 1D=${n1} ${ok ? "OK" : "MISMATCH"}`,
    );
  }
}

console.log("\n=== 5) 무작위 교차검증: naive vs 2D vs 1D (소규모 n, W) ===");
{
  let mismatches = 0;
  const trials = 300;
  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(Math.random() * 6); // 1~6개 (naive가 감당할 크기)
    const W = Math.floor(Math.random() * 12); // 0~11
    const weights = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 8));
    const values = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 8));

    const rNaive = knapsack01Naive(weights, values, W);
    const r2D = knapsack01_2D(weights, values, W);
    const r1D = knapsack01_1D(weights, values, W);

    if (rNaive !== r2D || r2D !== r1D) {
      mismatches++;
      console.log("  MISMATCH:", { weights, values, W, rNaive, r2D, r1D });
    }
  }
  console.log(`  ${trials}회 중 불일치 ${mismatches}건`);
}

console.log("\n=== 6) 엣지 케이스 ===");
{
  console.log("빈 입력 W=10          :", knapsack01_2D([], [], 10), knapsack01_1D([], [], 10));
  console.log("W=0                    :", knapsack01_2D([1, 2, 3], [10, 20, 30], 0));
  console.log("모든 물건이 W보다 무거움:", knapsack01_2D([10, 20, 30], [100, 200, 300], 5));
  console.log("물건 1개, 정확히 W=W  :", knapsack01_2D([5], [42], 5), knapsack01_1D([5], [42], 5));
}
