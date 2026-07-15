// E3 자기검증 스크래치. 가이드 본문 코드를 그대로 옮겨 실행 검증한다.

// ---------- 출발점: naive (조합 완전탐색, 아주 작은 입력만) ----------
function naiveCombinations(k: number, prices: number[]): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;

  let best = 0;

  // pairs: 선택된 (매수일, 매도일) 쌍들이 시간순으로 겹치지 않아야 한다.
  function search(startDay: number, remainingK: number, profit: number) {
    best = Math.max(best, profit);
    if (remainingK === 0) return;
    for (let buyDay = startDay; buyDay < n; buyDay++) {
      for (let sellDay = buyDay + 1; sellDay < n; sellDay++) {
        search(sellDay + 1, remainingK - 1, profit + (prices[sellDay]! - prices[buyDay]!));
      }
    }
  }

  search(0, k, 0);
  return best;
}

// ---------- 아이디어를 코드로 옮기기: 2D DP (기본 구현) ----------
function bestTimeToBuyAndSellStockK2D(k: number, prices: number[]): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;

  const buy: number[][] = Array.from({ length: k + 1 }, () =>
    new Array<number>(n).fill(-Infinity),
  );
  const sell: number[][] = Array.from({ length: k + 1 }, () =>
    new Array<number>(n).fill(0),
  );

  for (let i = 0; i < n; i++) {
    for (let t = 1; t <= k; t++) {
      const carryBuy = i > 0 ? buy[t]![i - 1]! : -Infinity;
      const carrySell = i > 0 ? sell[t]![i - 1]! : 0;
      buy[t]![i] = Math.max(carryBuy, sell[t - 1]![i]! - prices[i]!);
      sell[t]![i] = Math.max(carrySell, buy[t]![i]! + prices[i]!);
    }
  }

  let best = 0;
  for (let t = 0; t <= k; t++) best = Math.max(best, sell[t]![n - 1]!);
  return best;
}

// ---------- 최적화 코드: 1D 롤링 DP (최종) ----------
function bestTimeToBuyAndSellStockK(k: number, prices: number[]): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;

  const buy = new Array<number>(k + 1).fill(-Infinity);
  const sell = new Array<number>(k + 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let t = 1; t <= k; t++) {
      buy[t] = Math.max(buy[t]!, sell[t - 1]! - prices[i]!);
      sell[t] = Math.max(sell[t]!, buy[t]! + prices[i]!);
    }
  }

  let best = 0;
  for (let t = 0; t <= k; t++) best = Math.max(best, sell[t]!);
  return best;
}

// ---------- 함정 재현용 버그 버전 A: 루프 순서를 t 바깥 / i 안쪽으로 바꾼 경우 ----------
function buggyLoopOrder(k: number, prices: number[]): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;

  const buy = new Array<number>(k + 1).fill(-Infinity);
  const sell = new Array<number>(k + 1).fill(0);

  for (let t = 1; t <= k; t++) {
    for (let i = 0; i < n; i++) {
      buy[t] = Math.max(buy[t]!, sell[t - 1]! - prices[i]!);
      sell[t] = Math.max(sell[t]!, buy[t]! + prices[i]!);
    }
  }

  let best = 0;
  for (let t = 0; t <= k; t++) best = Math.max(best, sell[t]!);
  return best;
}

// ---------- 함정 재현용 버그 버전 B: buy 초기값을 -Infinity 대신 0으로 둔 경우 ----------
function buggyBuyInitZero(k: number, prices: number[]): number {
  const n = prices.length;
  if (n < 2 || k === 0) return 0;

  const buy = new Array<number>(k + 1).fill(0); // 버그: -Infinity 이어야 함
  const sell = new Array<number>(k + 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let t = 1; t <= k; t++) {
      buy[t] = Math.max(buy[t]!, sell[t - 1]! - prices[i]!);
      sell[t] = Math.max(sell[t]!, buy[t]! + prices[i]!);
    }
  }

  let best = 0;
  for (let t = 0; t <= k; t++) best = Math.max(best, sell[t]!);
  return best;
}

// ---------- k >= floor(N/2) 특화(무제한 거래) 참고용 ----------
function unlimitedTransactions(prices: number[]): number {
  let sum = 0;
  for (let i = 1; i < prices.length; i++) {
    sum += Math.max(0, prices[i]! - prices[i - 1]!);
  }
  return sum;
}

// ================= 실행부 =================

function assertEq(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 대표 예시: k=2, prices=[3,2,6,5,0,3] ===");
assertEq("1D 최종", bestTimeToBuyAndSellStockK(2, [3, 2, 6, 5, 0, 3]), 7);
assertEq("2D 기본", bestTimeToBuyAndSellStockK2D(2, [3, 2, 6, 5, 0, 3]), 7);
assertEq("naive", naiveCombinations(2, [3, 2, 6, 5, 0, 3]), 7);

console.log("\n=== 함정 A: 루프 순서 버그 (t 바깥/i 안쪽) ===");
const buggyResult = buggyLoopOrder(2, [3, 2, 6, 5, 0, 3]);
console.log(`buggyLoopOrder(2, [3,2,6,5,0,3]) = ${buggyResult} (정답 7과 달라야 함을 확인)`);
if (buggyResult === 7) {
  console.log("경고: 버그가 재현되지 않음");
  process.exitCode = 1;
}

console.log("\n=== 함정 B: buy 초기값 0 버그 ===");
const buggyResult2 = buggyBuyInitZero(1, [5, 1]);
console.log(`buggyBuyInitZero(1, [5,1]) = ${buggyResult2} (정답 0과 달라야 함을 확인)`);
console.log(`정상 1D 최종: bestTimeToBuyAndSellStockK(1, [5,1]) = ${bestTimeToBuyAndSellStockK(1, [5, 1])}`);

console.log("\n=== 문제 문서 예시 ===");
assertEq("k=2 [2,4,1]", bestTimeToBuyAndSellStockK(2, [2, 4, 1]), 2);
assertEq("k=1 [7,1,5,3,6,4]", bestTimeToBuyAndSellStockK(1, [7, 1, 5, 3, 6, 4]), 5);
assertEq("k=0 [1,5,3,8]", bestTimeToBuyAndSellStockK(0, [1, 5, 3, 8]), 0);
assertEq("k=3 하락장 [5,4,3,2,1]", bestTimeToBuyAndSellStockK(3, [5, 4, 3, 2, 1]), 0);
assertEq("원소 1개 k=2 [5]", bestTimeToBuyAndSellStockK(2, [5]), 0);
assertEq("k=100 [0,10000]", bestTimeToBuyAndSellStockK(100, [0, 10000]), 10000);

console.log("\n=== 엣지 케이스 ===");
assertEq("k=1 [5] (매도일 없음)", bestTimeToBuyAndSellStockK(1, [5]), 0);
assertEq("빈 배열", bestTimeToBuyAndSellStockK(3, []), 0);
assertEq("k=100 [1,2,3,4,5]", bestTimeToBuyAndSellStockK(100, [1, 2, 3, 4, 5]), 4);

console.log("\n=== k >= floor(N/2) 특화 vs 일반 DP 교차검증 ===");
{
  const prices = [1, 2, 3, 4, 5];
  const n = prices.length;
  const kUnlimited = Math.floor(n / 2);
  assertEq(
    "무제한 거래 특화 == 1D DP(k=floor(N/2))",
    unlimitedTransactions(prices),
    bestTimeToBuyAndSellStockK(kUnlimited, prices),
  );
}

console.log("\n=== 무작위 교차검증 (1D == 2D, 작은 입력에서 naive까지) ===");
function randInt(max: number) {
  return Math.floor(Math.random() * max);
}
let mismatches = 0;
for (let trial = 0; trial < 300; trial++) {
  const n = 1 + randInt(8);
  const prices = Array.from({ length: n }, () => randInt(20));
  const k = randInt(5);

  const r1 = bestTimeToBuyAndSellStockK(k, prices);
  const r2 = bestTimeToBuyAndSellStockK2D(k, prices);
  if (r1 !== r2) {
    mismatches++;
    console.log(`MISMATCH 1D vs 2D: k=${k}, prices=${JSON.stringify(prices)} -> 1D=${r1}, 2D=${r2}`);
  }

  if (n <= 6 && k <= 3) {
    const r3 = naiveCombinations(k, prices);
    if (r1 !== r3) {
      mismatches++;
      console.log(`MISMATCH 1D vs naive: k=${k}, prices=${JSON.stringify(prices)} -> 1D=${r1}, naive=${r3}`);
    }
  }
}
console.log(`무작위 300회 중 불일치: ${mismatches}건`);
if (mismatches > 0) process.exitCode = 1;

console.log("\n=== 큰 입력 성능 스모크 (N=1000, k=100) ===");
{
  const n = 1000;
  const prices = Array.from({ length: n }, () => randInt(10000));
  const t0 = performance.now();
  const r = bestTimeToBuyAndSellStockK(100, prices);
  const t1 = performance.now();
  console.log(`N=1000, k=100 결과=${r}, 소요 ${(t1 - t0).toFixed(2)}ms`);
}

console.log(process.exitCode === 1 ? "\n일부 검증 실패" : "\n모든 검증 통과");
