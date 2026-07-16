// E3 자기검증용 스크래치. 가이드 본문에 실릴 코드 3종(naive recursive, 2D DP, 1D DP)을
// 그대로 옮겨 실행하고 서로 값이 일치하는지, 대표/엣지/랜덤 케이스에서 기대값과 맞는지 확인한다.

// ---- 1) naive recursive (출발점 절) ----
function coinChangeWaysNaive(coins: number[], amount: number): number {
  function count(remaining: number, coinIndex: number): number {
    if (remaining === 0) return 1;
    if (remaining < 0 || coinIndex >= coins.length) return 0;
    let total = 0;
    const c = coins[coinIndex]!;
    for (let k = 0; c * k <= remaining; k++) {
      total += count(remaining - c * k, coinIndex + 1);
    }
    return total;
  }
  return count(amount, 0);
}

// ---- 2) 2D DP (아이디어를 코드로 옮기기 절: 기본 구현) ----
function coinChangeWays2D(coins: number[], amount: number): number {
  const n = coins.length;
  // dp[i][x] = coins[0..i-1]만 사용해 금액 x를 만드는 조합 수
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i]![0] = 1; // 금액 0은 항상 빈 조합 1가지

  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1]!;
    for (let x = 0; x <= amount; x++) {
      let ways = dp[i - 1]![x]!; // coins[i-1]을 쓰지 않는 경우
      if (x >= c) ways += dp[i]![x - c]!; // coins[i-1]을 한 번 더 쓰는 경우 (같은 행 i 참조 → 무한 재사용)
      dp[i]![x] = ways;
    }
  }
  return dp[n]![amount]!;
}

// ---- 3) 1D DP (최적화 코드 절: 최종 구현) ----
function coinChangeWays1D(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;
  for (const c of coins) {
    for (let x = c; x <= amount; x++) {
      dp[x] = dp[x]! + dp[x - c]!;
    }
  }
  return dp[amount]!;
}

// ---- 함정 데모: 루프 순서를 뒤집으면(금액 바깥, 동전 안쪽) 순열을 센다 ----
function coinChangeWaysWrongOrder(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (x >= c) dp[x] = dp[x]! + dp[x - c]!;
    }
  }
  return dp[amount]!;
}

// ================= 실측 =================

const cases: Array<[number[], number]> = [
  [[1, 2, 5], 5],
  [[2], 3],
  [[1, 2, 5], 0],
  [[1, 2, 3], 4],
  [[5, 10], 3],
  [[1, 2], 0],
  [[5], 3],
  [[1], 10000],
];

console.log("=== 대표/엣지 케이스 ===");
for (const [coins, amount] of cases) {
  const naive = coinChangeWaysNaive(coins, amount);
  const d2 = coinChangeWays2D(coins, amount);
  const d1 = coinChangeWays1D(coins, amount);
  const ok = naive === d2 && d2 === d1;
  console.log(
    `coins=${JSON.stringify(coins)} amount=${amount} -> naive=${naive} 2D=${d2} 1D=${d1} ${ok ? "OK" : "MISMATCH"}`,
  );
}

console.log("\n=== 랜덤 교차검증 (naive vs 2D vs 1D, 작은 범위) ===");
function randInt(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}
let allOk = true;
for (let t = 0; t < 200; t++) {
  const n = randInt(1, 4);
  const coins = Array.from({ length: n }, () => randInt(1, 6));
  const amount = randInt(0, 12);
  const naive = coinChangeWaysNaive(coins, amount);
  const d2 = coinChangeWays2D(coins, amount);
  const d1 = coinChangeWays1D(coins, amount);
  if (!(naive === d2 && d2 === d1)) {
    allOk = false;
    console.log(`MISMATCH coins=${JSON.stringify(coins)} amount=${amount} naive=${naive} 2D=${d2} 1D=${d1}`);
  }
}
console.log(allOk ? "랜덤 200케이스 전부 일치" : "불일치 발견됨 (위 참조)");

console.log("\n=== 순서 함정 데모: coins=[1,2], amount=3 ===");
console.log("올바른(1D, 동전 바깥) 결과:", coinChangeWays1D([1, 2], 3));
console.log("잘못된(금액 바깥) 결과:", coinChangeWaysWrongOrder([1, 2], 3));

console.log("\n=== 시뮬레이션용 대표 예시: coins=[1,2,5], amount=5 단계별 dp ===");
{
  const amount = 5;
  const coins = [1, 2, 5];
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;
  console.log("init:", [...dp]);
  for (const c of coins) {
    for (let x = c; x <= amount; x++) dp[x] = dp[x]! + dp[x - c]!;
    console.log(`c=${c} 처리 후:`, [...dp]);
  }
}

console.log("\n=== 점검 문제 1용: coins=[1,2,3], amount=4 ===");
{
  const amount = 4;
  const coins = [1, 2, 3];
  const dp = new Array<number>(amount + 1).fill(0);
  dp[0] = 1;
  for (const c of coins) {
    for (let x = c; x <= amount; x++) dp[x] = dp[x]! + dp[x - c]!;
    console.log(`c=${c} 처리 후:`, [...dp]);
  }
  console.log("최종 dp[4] =", dp[4]);
}

console.log("\n=== 빈 coins 배열 방어 확인 (제약 밖이지만 견고성 점검) ===");
console.log("coins=[], amount=0 ->", coinChangeWays1D([], 0));
console.log("coins=[], amount=5 ->", coinChangeWays1D([], 5));

console.log("\n=== 오버플로 가능성 점검: coins=[1,2,5], amount=10000 ===");
console.log(coinChangeWays1D([1, 2, 5], 10000));

console.log("\n=== 오버플로 가능성 점검: coins=1..100, amount=10000 ===");
{
  const coins100 = Array.from({ length: 100 }, (_, i) => i + 1);
  const v = coinChangeWays1D(coins100, 10000);
  console.log("value =", v, "Number.MAX_SAFE_INTEGER =", Number.MAX_SAFE_INTEGER, "초과여부:", v > Number.MAX_SAFE_INTEGER);
}
