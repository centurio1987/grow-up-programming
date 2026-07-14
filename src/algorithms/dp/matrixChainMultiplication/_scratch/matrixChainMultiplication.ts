// ── 원형: naive 재귀 (지수 시간) ──────────────────────────────
function minCostNaive(dims: number[], i: number, j: number): number {
  if (i === j) return 0;
  let best = Infinity;
  for (let k = i; k < j; k++) {
    const cost =
      minCostNaive(dims, i, k) +
      minCostNaive(dims, k + 1, j) +
      dims[i - 1]! * dims[k]! * dims[j]!;
    if (cost < best) best = cost;
  }
  return best;
}

function matrixChainMultiplicationNaive(dims: number[]): number {
  const n = dims.length - 1;
  if (n <= 1) return 0;
  return minCostNaive(dims, 1, n);
}

// ── 개선: 메모이제이션(top-down DP) ────────────────────────────
function matrixChainMultiplicationMemo(dims: number[]): number {
  const n = dims.length - 1;
  if (n <= 1) return 0;

  const memo: (number | undefined)[][] = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(undefined),
  );

  function solve(i: number, j: number): number {
    if (i === j) return 0;
    if (memo[i]![j] !== undefined) return memo[i]![j]!;
    let best = Infinity;
    for (let k = i; k < j; k++) {
      const cost = solve(i, k) + solve(k + 1, j) + dims[i - 1]! * dims[k]! * dims[j]!;
      if (cost < best) best = cost;
    }
    memo[i]![j] = best;
    return best;
  }

  return solve(1, n);
}

// ── 최종: bottom-up 구간 DP(tabulation) ────────────────────────
function matrixChainMultiplication(dims: number[]): number {
  const n = dims.length - 1;
  if (n <= 1) return 0;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));

  for (let len = 2; len <= n; len++) {
    for (let i = 1; i <= n - len + 1; i++) {
      const j = i + len - 1;
      dp[i]![j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = dp[i]![k]! + dp[k + 1]![j]! + dims[i - 1]! * dims[k]! * dims[j]!;
        if (cost < dp[i]![j]!) dp[i]![j] = cost;
      }
    }
  }

  return dp[1]![n]!;
}

// ── E3 자기검증 ──────────────────────────────────────────────
type Case = { dims: number[]; expected: number; label: string };

const cases: Case[] = [
  { dims: [10, 20], expected: 0, label: "n=1 (행렬 1개)" },
  { dims: [2, 3, 4], expected: 24, label: "n=2 (분할 하나뿐)" },
  { dims: [10, 100, 5, 50], expected: 7500, label: "대표 예시 (sim 원본)" },
  { dims: [10, 20, 30], expected: 6000, label: "problem.md 예시1" },
  { dims: [10, 30, 5, 60], expected: 4500, label: "problem.md 예시2" },
  { dims: [10, 20, 30, 40, 30], expected: 30000, label: "problem.md 예시3" },
  { dims: [5, 5, 5, 5], expected: 250, label: "problem.md 예시5 (동일 차원)" },
  { dims: [7], expected: 0, label: "엣지: 행렬 0개(dims 길이 1)" },
];

console.log("=== 대표/엣지 케이스 검증 ===");
for (const c of cases) {
  const rNaive = matrixChainMultiplicationNaive(c.dims);
  const rMemo = matrixChainMultiplicationMemo(c.dims);
  const rFinal = matrixChainMultiplication(c.dims);
  const ok = rNaive === c.expected && rMemo === c.expected && rFinal === c.expected;
  console.log(
    `${ok ? "OK" : "FAIL"} ${c.label}: dims=${JSON.stringify(c.dims)} -> naive=${rNaive} memo=${rMemo} final=${rFinal} (expected ${c.expected})`,
  );
  if (!ok) process.exitCode = 1;
}

// dp 테이블 전체 트레이스 (7500 케이스, 시뮬 프레임 검증용)
console.log("\n=== dims=[10,100,5,50] dp 테이블 상세 트레이스 ===");
{
  const dims = [10, 100, 5, 50];
  const n = dims.length - 1;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i <= n - len + 1; i++) {
      const j = i + len - 1;
      dp[i]![j] = Infinity;
      const trials: string[] = [];
      for (let k = i; k < j; k++) {
        const cost = dp[i]![k]! + dp[k + 1]![j]! + dims[i - 1]! * dims[k]! * dims[j]!;
        trials.push(
          `k=${k}: dp[${i}][${k}]+dp[${k + 1}][${j}]+${dims[i - 1]}*${dims[k]}*${dims[j]}=${dp[i]![k]}+${dp[k + 1]![j]}+${dims[i - 1]! * dims[k]! * dims[j]!}=${cost}`,
        );
        if (cost < dp[i]![j]!) dp[i]![j] = cost;
      }
      console.log(`len=${len} [${i},${j}]: ${trials.join(" | ")} => dp[${i}][${j}]=${dp[i]![j]}`);
    }
  }
  console.log("최종 dp 테이블:", JSON.stringify(dp));
  console.log("반환값 dp[1][3] =", dp[1]![n]);
}

// 랜덤 교차검증: naive(브루트포스) vs bottom-up DP, 작은 n(<=6)
console.log("\n=== 랜덤 교차검증 (n<=6, 20회) ===");
let allPass = true;
for (let t = 0; t < 20; t++) {
  const n = 1 + Math.floor(Math.random() * 6); // 1..6
  const dims: number[] = [];
  for (let i = 0; i <= n; i++) dims.push(1 + Math.floor(Math.random() * 20));
  const rNaive = matrixChainMultiplicationNaive(dims);
  const rMemo = matrixChainMultiplicationMemo(dims);
  const rFinal = matrixChainMultiplication(dims);
  const ok = rNaive === rMemo && rMemo === rFinal;
  if (!ok) {
    allPass = false;
    console.log(`FAIL dims=${JSON.stringify(dims)} naive=${rNaive} memo=${rMemo} final=${rFinal}`);
  }
}
console.log(allPass ? "모든 랜덤 케이스 일치 (OK)" : "불일치 발생 (FAIL)");
if (!allPass) process.exitCode = 1;

// 오버플로 감(최대 입력 근사) - n=100, dims=500 고정
console.log("\n=== 최대 입력 규모 근사 확인 ===");
{
  const n = 100;
  const dims = new Array(n + 1).fill(500);
  const r = matrixChainMultiplication(dims);
  console.log(
    `n=100, dims=500 고정 -> 반환값=${r} (Number.MAX_SAFE_INTEGER=${Number.MAX_SAFE_INTEGER})`,
  );
  console.log(`안전 범위 내: ${r <= Number.MAX_SAFE_INTEGER}`);
}

// ── 본문 "헷갈리기 쉬운 포인트" / 점검 문제의 구체 오답 수치 검증 ──
console.log("\n=== 헷갈리기 쉬운 포인트 1: dp[i][j] 0-초기화 버그 ===");
{
  function mcmBuggyZeroInit(dims: number[]): number {
    const n = dims.length - 1;
    if (n <= 1) return 0;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    for (let len = 2; len <= n; len++) {
      for (let i = 1; i <= n - len + 1; i++) {
        const j = i + len - 1;
        dp[i]![j] = 0; // 버그: Infinity 대신 0
        for (let k = i; k < j; k++) {
          const cost = dp[i]![k]! + dp[k + 1]![j]! + dims[i - 1]! * dims[k]! * dims[j]!;
          if (cost < dp[i]![j]!) dp[i]![j] = cost;
        }
      }
    }
    return dp[1]![n]!;
  }
  const dims = [10, 100, 5, 50];
  const r = mcmBuggyZeroInit(dims);
  console.log(`dims=${JSON.stringify(dims)} 0-초기화 버그 결과 = ${r} (본문 주장: 0)`);
  if (r !== 0) process.exitCode = 1;
}

console.log("\n=== 헷갈리기 쉬운 포인트 2: dims[k] → dims[k+1] 오타 버그 ===");
{
  function mcmBuggyIndex(dims: number[]): number {
    const n = dims.length - 1;
    if (n <= 1) return 0;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    for (let len = 2; len <= n; len++) {
      for (let i = 1; i <= n - len + 1; i++) {
        const j = i + len - 1;
        dp[i]![j] = Infinity;
        for (let k = i; k < j; k++) {
          // 버그: 가운데 항이 dims[k] 대신 dims[k+1]
          const cost = dp[i]![k]! + dp[k + 1]![j]! + dims[i - 1]! * dims[k + 1]! * dims[j]!;
          if (cost < dp[i]![j]!) dp[i]![j] = cost;
        }
      }
    }
    return dp[1]![n]!;
  }
  const dims = [10, 100, 5, 50];
  const r = mcmBuggyIndex(dims);
  console.log(`dims=${JSON.stringify(dims)} dims[k+1] 버그 결과 = ${r} (본문 주장: 25250)`);
  if (r !== 25250) process.exitCode = 1;
}

console.log("\n=== 스스로 점검하기 문제2: len 우선이 아닌 i-바깥/j-안쪽 순회 버그 ===");
{
  function mcmWrongLoopOrder(dims: number[]): number {
    const n = dims.length - 1;
    if (n <= 1) return 0;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let j = i + 1; j <= n; j++) {
        dp[i]![j] = Infinity;
        for (let k = i; k < j; k++) {
          const cost = dp[i]![k]! + dp[k + 1]![j]! + dims[i - 1]! * dims[k]! * dims[j]!;
          if (cost < dp[i]![j]!) dp[i]![j] = cost;
        }
      }
    }
    return dp[1]![n]!;
  }
  const dims = [10, 20, 30, 40, 30];
  const r = mcmWrongLoopOrder(dims);
  console.log(`dims=${JSON.stringify(dims)} 잘못된 루프 순서 결과 = ${r} (본문 주장: 6000, 정답 30000)`);
  if (r !== 6000) process.exitCode = 1;
}

console.log("\n=== 카탈란 수 표 (n=1..6, n=100) ===");
{
  function catalan(n: number): bigint {
    let numerator = 1n;
    let denominator = 1n;
    for (let i = 0; i < n; i++) {
      numerator *= BigInt(2 * n - i);
      denominator *= BigInt(i + 1);
    }
    return numerator / denominator / BigInt(n + 1);
  }
  for (const n of [1, 2, 3, 4, 5, 6]) {
    console.log(`n=${n} (행렬 수) -> C_{n-1}=${catalan(n - 1)}`);
  }
  const c99 = catalan(99);
  console.log(`n=100 -> C_99=${c99} (자릿수=${c99.toString().length})`);
}

console.log("\n=== 최종 최적화 코드의 n=100 분할점 비교 총 횟수 ===");
{
  const n = 100;
  const dims = new Array(n + 1).fill(500);
  let compareCount = 0;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i <= n - len + 1; i++) {
      const j = i + len - 1;
      dp[i]![j] = Infinity;
      for (let k = i; k < j; k++) {
        compareCount++;
        const cost = dp[i]![k]! + dp[k + 1]![j]! + dims[i - 1]! * dims[k]! * dims[j]!;
        if (cost < dp[i]![j]!) dp[i]![j] = cost;
      }
    }
  }
  console.log(`n=100 총 분할점 비교(min 갱신 시도) 횟수 = ${compareCount} (본문 주장: 166,650)`);
  if (compareCount !== 166650) process.exitCode = 1;
}
