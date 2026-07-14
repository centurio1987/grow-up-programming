// E3 자기검증용 스크래치 — 가이드 본문에 싣는 코드(원형/개선/최종 + 함정 시연)를 그대로
// 옮겨 실행 결과를 실측한다. src/algorithms/dp/unboundedKnapsack/unboundedKnapsack.ts(학습자
// 스텁)와는 무관하게, 가이드 자신의 코드만으로 독립 검증한다.

// ── 원형(naive): 메모 없는 재귀 ──────────────────────────────────
function unboundedKnapsackNaive(coins: number[], amount: number): number {
  function solve(remaining: number): number {
    if (remaining === 0) return 0;
    if (remaining < 0) return Infinity;
    let best = Infinity;
    for (const c of coins) {
      const sub = solve(remaining - c);
      if (sub !== Infinity) best = Math.min(best, sub + 1);
    }
    return best;
  }
  const result = solve(amount);
  return result === Infinity ? -1 : result;
}

// 위 naive와 완전히 동일한 로직에 호출 횟수 계측만 추가한 버전(중복 재계산 시연용)
function unboundedKnapsackNaiveCounting(coins: number[], amount: number) {
  const calls = new Map<number, number>();
  function solve(remaining: number): number {
    calls.set(remaining, (calls.get(remaining) ?? 0) + 1);
    if (remaining === 0) return 0;
    if (remaining < 0) return Infinity;
    let best = Infinity;
    for (const c of coins) {
      const sub = solve(remaining - c);
      if (sub !== Infinity) best = Math.min(best, sub + 1);
    }
    return best;
  }
  const result = solve(amount);
  return { result: result === Infinity ? -1 : result, calls };
}

// ── 개선(기본 구현): 하향식 메모이제이션 ─────────────────────────
function unboundedKnapsackMemo(coins: number[], amount: number): number {
  const memo = new Array<number>(amount + 1).fill(-1); // -1 = 미방문

  function solve(remaining: number): number {
    if (remaining === 0) return 0;
    if (remaining < 0) return Infinity;
    if (memo[remaining] !== -1) return memo[remaining];

    let best = Infinity;
    for (const c of coins) {
      const sub = solve(remaining - c);
      if (sub !== Infinity) best = Math.min(best, sub + 1);
    }
    memo[remaining] = best;
    return best;
  }

  const result = solve(amount);
  return result === Infinity ? -1 : result;
}

// ── 기본 구현(§4, 2D): 동전 종류를 행으로 두고 바텀업으로 채우는 2차원 DP ──
// dp[i][x] = "coins[0..i-1]까지 사용 가능할 때 금액 x를 만드는 최소 동전 수"
// dp[i][x] = min(dp[i-1][x], dp[i][x-coins[i-1]]+1)  (같은 행 참조 = 동전 i 재사용)
function unboundedKnapsack2D(coins: number[], amount: number): number {
  const n = coins.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(Infinity));
  for (let i = 0; i <= n; i++) dp[i]![0] = 0; // 금액 0은 항상 동전 0개로 만들 수 있다

  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1]!;
    for (let x = 1; x <= amount; x++) {
      dp[i]![x] = dp[i - 1]![x]!; // 동전 i를 쓰지 않는 경우부터 복사(위 행)
      if (x >= c && dp[i]![x - c] !== Infinity) {
        dp[i]![x] = Math.min(dp[i]![x]!, dp[i]![x - c]! + 1); // 같은 행 재참조 = 동전 i 재사용
      }
    }
  }

  return dp[n]![amount] === Infinity ? -1 : dp[n]![amount]!;
}

// 2D 표 전체를 반환하는 트레이스용 버전(본문 표 검증)
function unboundedKnapsack2DTrace(coins: number[], amount: number): (number | "∞")[][] {
  const n = coins.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(Infinity));
  for (let i = 0; i <= n; i++) dp[i]![0] = 0;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1]!;
    for (let x = 1; x <= amount; x++) {
      dp[i]![x] = dp[i - 1]![x]!;
      if (x >= c && dp[i]![x - c] !== Infinity) {
        dp[i]![x] = Math.min(dp[i]![x]!, dp[i]![x - c]! + 1);
      }
    }
  }
  return dp.map((row) => row.map((v) => (v === Infinity ? "∞" : v)));
}

// 함정 시연용(2D): x>=c 가드 없이 무조건 같은 행을 참조 → 음수 인덱스 → NaN 오염
function unboundedKnapsack2DNoGuard(coins: number[], amount: number): (number | "∞" | "NaN")[][] {
  const n = coins.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(Infinity));
  for (let i = 0; i <= n; i++) dp[i]![0] = 0;
  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1]!;
    for (let x = 1; x <= amount; x++) {
      dp[i]![x] = dp[i - 1]![x]!;
      // 가드 누락: x < c여도 그냥 dp[i][x-c]에 접근(음수 인덱스 → undefined)
      const prev = dp[i]![x - c];
      dp[i]![x] = Math.min(dp[i]![x]!, (prev as number) + 1);
    }
  }
  return dp.map((row) => row.map((v) => (Number.isNaN(v) ? "NaN" : v === Infinity ? "∞" : v)));
}

// ── 최적화 코드(§7): 상향식 반복 1D DP (2D의 행 차원을 접은 결과) ─────
function unboundedKnapsack(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] !== Infinity) {
        dp[x] = Math.min(dp[x], dp[x - c] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}

// dp 배열 전체를 반환하는 트레이스용 버전(본문 표·시뮬 프레임 검증)
function unboundedKnapsackTrace(coins: number[], amount: number): (number | "∞")[] {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] !== Infinity) {
        dp[x] = Math.min(dp[x], dp[x - c] + 1);
      }
    }
  }
  return dp.map((v) => (v === Infinity ? "∞" : v));
}

// 함정 시연용: dp[x-c]가 ∞일 때 가드 없이 그냥 +1 해버리는 버그 버전
function unboundedKnapsackBuggyNoGuard(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x) {
        // 가드 누락: dp[x - c]가 Infinity여도 그냥 +1
        dp[x] = Math.min(dp[x], dp[x - c] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

function fmt(v: number) {
  return v === Infinity ? "∞" : v;
}

console.log("=== 섹션2 naive 중복 재계산 시연: coins=[1,3,4], amount=6 ===");
console.log("naive 반환값:", unboundedKnapsackNaive([1, 3, 4], 6));
const counted = unboundedKnapsackNaiveCounting([1, 3, 4], 6);
for (const [k, v] of [...counted.calls.entries()].sort((a, b) => b[0] - a[0])) {
  console.log(`  solve(${k}) 호출 ${v}회`);
}

console.log("\n=== 대표 예시: coins=[1,5,6], amount=11 (시뮬과 동일 입력) ===");
console.log("naive:", unboundedKnapsackNaive([1, 5, 6], 11));
console.log("memo :", unboundedKnapsackMemo([1, 5, 6], 11));
console.log("final:", unboundedKnapsack([1, 5, 6], 11));
console.log("trace:", unboundedKnapsackTrace([1, 5, 6], 11).join(","));

console.log("\n=== dp[0..6] 트레이스, coins=[1,3,4] amount=6 ===");
console.log(unboundedKnapsackTrace([1, 3, 4], 6).join(","));

console.log("\n=== 문제 예시 교차검증 (naive vs memo vs 최종) ===");
const cases: [number[], number, number][] = [
  [[1, 2, 5], 11, 3],
  [[2], 3, -1],
  [[1], 0, 0],
  [[1, 3, 4], 6, 2],
  [[5, 10], 3, -1],
];
for (const [coins, amount, expected] of cases) {
  const n = unboundedKnapsackNaive(coins, amount);
  const m = unboundedKnapsackMemo(coins, amount);
  const b = unboundedKnapsack(coins, amount);
  const ok = n === expected && m === expected && b === expected;
  console.log(
    `coins=${JSON.stringify(coins)} amount=${amount} -> naive=${n} memo=${m} final=${b} expected=${expected} ${ok ? "OK" : "MISMATCH!!"}`
  );
}

console.log("\n=== 엣지 케이스 ===");
const edgeCases: [number[], number, number][] = [
  [[1, 2, 5], 0, 0],
  [[2], 3, -1],
  [[1], 10000, 10000],
  [[10000], 10000, 1],
  [[], 0, 0],
  [[], 5, -1],
];
for (const [coins, amount, expected] of edgeCases) {
  const got = unboundedKnapsack(coins, amount);
  console.log(
    `coins=${JSON.stringify(coins)} amount=${amount} -> ${got} expected=${expected} ${got === expected ? "OK" : "MISMATCH!!"}`
  );
}

console.log("\n=== 함정 시연: 가드 누락 버전 ===");
console.log("coins=[2], amount=3, 가드 있음 ->", unboundedKnapsack([2], 3), "(정답 -1)");
console.log("coins=[2], amount=3, 가드 없음(버그) ->", unboundedKnapsackBuggyNoGuard([2], 3));

console.log("\n=== 무작위 교차검증 (naive vs memo vs 최종, 작은 규모) ===");
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
let mismatches = 0;
for (let t = 0; t < 300; t++) {
  const n = 1 + randInt(4);
  const coins = Array.from({ length: n }, () => 1 + randInt(8));
  const amount = randInt(16);
  const a = unboundedKnapsackNaive(coins, amount);
  const b = unboundedKnapsackMemo(coins, amount);
  const c = unboundedKnapsack(coins, amount);
  if (a !== b || b !== c) {
    mismatches++;
    console.log("MISMATCH", { coins, amount, a, b, c });
  }
}
console.log(`무작위 300회 중 불일치 ${mismatches}건`);

console.log("\n=== 성능 목표 검증: n=100, amount=10000 ===");
const bigCoins = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
const t0 = performance.now();
const bigResult = unboundedKnapsack(bigCoins, 10000);
const t1 = performance.now();
console.log(`bottom-up 결과=${bigResult}, 소요시간=${(t1 - t0).toFixed(2)}ms`);

console.log("\n=== 재귀 깊이 및 memo vs bottom-up 실측 비교(n=100, amount=10000) ===");
try {
  const tm0 = performance.now();
  const memoResult = unboundedKnapsackMemo(bigCoins, 10000);
  const tm1 = performance.now();
  console.log(`memo(재귀) 결과=${memoResult}, 소요시간=${(tm1 - tm0).toFixed(2)}ms (스택 초과 없이 완료)`);
} catch (e) {
  console.log("memo(재귀) 에러:", (e as Error).message);
}
// 워밍업 이후 재측정(JIT 안정화)
for (let i = 0; i < 3; i++) {
  const a0 = performance.now();
  unboundedKnapsackMemo(bigCoins, 10000);
  const a1 = performance.now();
  const b0 = performance.now();
  unboundedKnapsack(bigCoins, 10000);
  const b1 = performance.now();
  console.log(`  워밍업 ${i + 1}회차 — memo: ${(a1 - a0).toFixed(2)}ms, bottom-up: ${(b1 - b0).toFixed(2)}ms`);
}

console.log("\n=== 함정 시연 2: c<=x 가드 누락 → 음수 인덱스 → NaN 오염 ===");
function unboundedKnapsackBuggyNoRangeGuard(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      // c <= x 가드 누락: x - c가 음수일 수 있다
      const prev = dp[x - c]; // 음수 인덱스 접근 시 undefined
      dp[x] = Math.min(dp[x], (prev as number) + 1); // undefined + 1 = NaN
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
const buggyDp = (() => {
  const coins = [1, 5, 6];
  const amount = 11;
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      const prev = dp[x - c];
      dp[x] = Math.min(dp[x], (prev as number) + 1);
    }
  }
  return dp;
})();
console.log("가드 없이 진행한 dp 배열:", buggyDp);
console.log(
  "coins=[1,5,6], amount=11, 가드 없음 ->",
  unboundedKnapsackBuggyNoRangeGuard([1, 5, 6], 11),
  "(가드 있는 정답: 2)"
);

console.log("\n=== 함정 시연 3: 최종 -1 변환 누락 ===");
function unboundedKnapsackBuggyNoFinalConvert(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x && dp[x - c] !== Infinity) dp[x] = Math.min(dp[x], dp[x - c] + 1);
    }
  }
  return dp[amount]; // -1 변환 누락 — 계약 위반(불가능하면 -1을 반환해야 함)
}
console.log(
  "coins=[2], amount=3, 최종 변환 누락 ->",
  unboundedKnapsackBuggyNoFinalConvert([2], 3),
  "(계약상 정답: -1)"
);

console.log("\n=== 함정 시연 4: 내림차순(descending) 순회로 바꾸면? ===");
function unboundedKnapsackDescendingBug(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = amount; x >= 1; x--) {
    for (const c of coins) {
      if (c <= x && dp[x - c] !== Infinity) dp[x] = Math.min(dp[x], dp[x - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
console.log(
  "coins=[1,5,6], amount=11, 내림차순 순회 ->",
  unboundedKnapsackDescendingBug([1, 5, 6], 11),
  "(오름차순 정답: 2)"
);
console.log(
  "coins=[1,3,4], amount=6, 내림차순 순회 ->",
  unboundedKnapsackDescendingBug([1, 3, 4], 6),
  "(오름차순 정답: 2)"
);

console.log("\n=== 출발점 절에 인용하는 naive 지수 폭발 실측: coins=[1,2,5] ===");
function countCalls(coins: number[], amount: number): { result: number; calls: number } {
  let calls = 0;
  function solve(remaining: number): number {
    calls++;
    if (remaining === 0) return 0;
    if (remaining < 0) return Infinity;
    let best = Infinity;
    for (const c of coins) {
      const sub = solve(remaining - c);
      if (sub !== Infinity) best = Math.min(best, sub + 1);
    }
    return best;
  }
  const result = solve(amount);
  return { result: result === Infinity ? -1 : result, calls };
}
for (const amt of [20, 25, 30]) {
  const t0 = performance.now();
  const { calls } = countCalls([1, 2, 5], amt);
  const t1 = performance.now();
  console.log(`amount=${amt} -> solve 호출 ${calls.toLocaleString()}회 (${(t1 - t0).toFixed(2)}ms)`);
}

console.log("\n=== 헷갈리기 쉬운 포인트 절 인용: 내림차순 순회의 '우연한 일치' 케이스 ===");
console.log(
  "coins=[1,5,6], amount=6 (정답=단일 동전 6, 1개), 내림차순 순회 ->",
  unboundedKnapsackDescendingBug([1, 5, 6], 6),
  "(정답 1)"
);
console.log(
  "coins=[1,5,6], amount=11 (정답=6+5, 2개), 내림차순 순회 ->",
  unboundedKnapsackDescendingBug([1, 5, 6], 11),
  "(정답 2, 실제로는 불일치)"
);
console.log(
  "coins=[1], amount=5, 내림차순 순회 ->",
  unboundedKnapsackDescendingBug([1], 5),
  "(정답 5)"
);
console.log(
  "coins=[2], amount=6, 내림차순 순회 ->",
  unboundedKnapsackDescendingBug([2], 6),
  "(정답 3)"
);

console.log("\n=== §3.1/§4용: 2D 표, coins=[2,3], amount=7 ===");
{
  const coins = [2, 3];
  const amount = 7;
  const trace2D = unboundedKnapsack2DTrace(coins, amount);
  trace2D.forEach((row, i) => console.log(`i=${i}: [${row.join(", ")}]`));
  console.log("2D 최종값 dp[n][amount] =", unboundedKnapsack2D(coins, amount), "(1D 최종값과 일치해야 함:", unboundedKnapsack(coins, amount), ")");
}

console.log("\n=== §4/§7 동치 검증: 2D vs 1D vs naive vs memo (문제 예시 + 대표 케이스) ===");
{
  const cases: [number[], number, number][] = [
    [[1, 2, 5], 11, 3],
    [[2], 3, -1],
    [[1], 0, 0],
    [[1, 3, 4], 6, 2],
    [[5, 10], 3, -1],
    [[1, 5, 6], 11, 2],
    [[2, 3], 7, 3],
  ];
  for (const [coins, amount, expected] of cases) {
    const twoD = unboundedKnapsack2D(coins, amount);
    const oneD = unboundedKnapsack(coins, amount);
    const n = unboundedKnapsackNaive(coins, amount);
    const m = unboundedKnapsackMemo(coins, amount);
    const ok = twoD === expected && oneD === expected && n === expected && m === expected;
    console.log(
      `coins=${JSON.stringify(coins)} amount=${amount} -> 2D=${twoD} 1D=${oneD} naive=${n} memo=${m} expected=${expected} ${ok ? "OK" : "MISMATCH!!"}`
    );
  }
}

console.log("\n=== §4/§7 무작위 동치 검증: 2D vs 1D (naive와 이미 검증된 1D를 오라클로) ===");
{
  let mismatches2D = 0;
  for (let t = 0; t < 300; t++) {
    const n = 1 + randInt(4);
    const coins = Array.from({ length: n }, () => 1 + randInt(8));
    const amount = randInt(16);
    const a = unboundedKnapsack2D(coins, amount);
    const b = unboundedKnapsack(coins, amount);
    if (a !== b) {
      mismatches2D++;
      console.log("MISMATCH(2D vs 1D)", { coins, amount, a, b });
    }
  }
  console.log(`2D vs 1D 무작위 300회 중 불일치 ${mismatches2D}건`);
}

console.log("\n=== §3.4용: 2D 가드 누락(x>=c 없이 같은 행 접근) → NaN 오염 실측, coins=[2,3], amount=7 ===");
{
  const buggy2D = unboundedKnapsack2DNoGuard([2, 3], 7);
  buggy2D.forEach((row, i) => console.log(`i=${i}: [${row.join(", ")}]`));
}

console.log("\n=== §5용: 2D 표 전체, coins=[1,5,6], amount=11 (행이 3개 이상인 예시) ===");
{
  const trace2Db = unboundedKnapsack2DTrace([1, 5, 6], 11);
  trace2Db.forEach((row, i) => console.log(`i=${i}: [${row.join(", ")}]`));
}

console.log("\n=== §3.4용: 2D 인덱스 오프셋 버그(coins[i-1] 대신 coins[i]) 실측, coins=[7], amount=7 ===");
{
  function unboundedKnapsack2DOffsetBug(coins: number[], amount: number): number {
    const n = coins.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(amount + 1).fill(Infinity));
    for (let i = 0; i <= n; i++) dp[i]![0] = 0;
    for (let i = 1; i <= n; i++) {
      const c = coins[i]; // 버그: coins[i-1]이어야 하는데 coins[i]를 읽음(마지막 행에서 undefined)
      for (let x = 1; x <= amount; x++) {
        dp[i]![x] = dp[i - 1]![x]!;
        if (c !== undefined && x >= c && dp[i]![x - c] !== Infinity) {
          dp[i]![x] = Math.min(dp[i]![x]!, dp[i]![x - c]! + 1);
        }
      }
    }
    return dp[n]![amount] === Infinity ? -1 : dp[n]![amount]!;
  }
  console.log("coins=[7], amount=7, 올바름(coins[i-1]) ->", unboundedKnapsack2D([7], 7), "(정답 1)");
  console.log("coins=[7], amount=7, 오프셋 버그(coins[i]) ->", unboundedKnapsack2DOffsetBug([7], 7), "(정답과 달라야 버그 시연 성공)");
}

console.log("\n=== 참고: Infinity 가드(dp[x-c] !== Infinity) 없이도 정확성엔 무해함(실측) ===");
function unboundedKnapsackNoInfGuard(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const c of coins) {
      if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1); // Infinity 가드만 제거, 범위 가드는 유지
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}
let infGuardMismatches = 0;
for (let t = 0; t < 500; t++) {
  const n = 1 + randInt(4);
  const coins = Array.from({ length: n }, () => 1 + randInt(8));
  const amount = randInt(16);
  const withGuard = unboundedKnapsack(coins, amount);
  const withoutGuard = unboundedKnapsackNoInfGuard(coins, amount);
  if (withGuard !== withoutGuard) {
    infGuardMismatches++;
    console.log("MISMATCH(infGuard)", { coins, amount, withGuard, withoutGuard });
  }
}
console.log(`Infinity 가드 제거 후 무작위 500회 중 불일치: ${infGuardMismatches}건 (JS Infinity+1=Infinity 이므로 무해)`);
