// E3 자기검증 스크립트 — 가이드 본문에 실리는 3단계 코드(naive / basic / optimized)를
// 그대로 옮겨와 실행하고, 대표 입력·엣지 케이스·무작위 교차검증을 수행한다.

// ---- 1) 원형(naive): 모든 (i, j) 쌍 ----
function bestTimeToBuyAndSellStockNaive(prices: number[]): number {
  let best = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i; j < prices.length; j++) {
      best = Math.max(best, prices[j] - prices[i]);
    }
  }
  return best;
}

// ---- 2) 기본 구현: 좌측 최솟값을 배열로 미리 계산 (O(N) 시간, O(N) 공간) ----
function bestTimeToBuyAndSellStockBasic(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;

  const leftMin = new Array<number>(n);
  leftMin[0] = prices[0];
  for (let j = 1; j < n; j++) {
    leftMin[j] = Math.min(leftMin[j - 1], prices[j]);
  }

  let best = 0;
  for (let j = 1; j < n; j++) {
    best = Math.max(best, prices[j] - leftMin[j - 1]);
  }
  return best;
}

// ---- 3) 최적화 코드: 배열을 변수 하나로 굴린다 (O(N) 시간, O(1) 공간) ----
function bestTimeToBuyAndSellStock(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;

  let minLeft = prices[0];
  let best = 0;

  for (let j = 1; j < n; j++) {
    best = Math.max(best, prices[j] - minLeft);
    minLeft = Math.min(minLeft, prices[j]);
  }
  return best;
}

// ---- 참고: Kadane's algorithm (최대 부분합)을 diff 배열에 그대로 적용한 버전 ----
// profit(i, j) = prices[j] - prices[i] = sum_{k=i+1}^{j} d[k], d[k] = prices[k] - prices[k-1]
// "빈 구간(0)"을 허용하는 변형 Kadane과 동치임을 보이기 위한 대조군.
function bestTimeToBuyAndSellStockKadane(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;

  let curSum = 0; // 현재 위치에서 끝나는 최적 "부분합"(빈 구간 포함 가능)
  let best = 0;

  for (let k = 1; k < n; k++) {
    const d = prices[k] - prices[k - 1];
    curSum = Math.max(d, curSum + d);
    best = Math.max(best, curSum);
  }
  return best;
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) throw new Error(`mismatch at ${label}`);
}

// ---- 대표 예시 ----
const REP = [7, 1, 5, 3, 6, 4];
console.log("=== 대표 예시 prices =", REP, "===");
assertEqual("naive(REP)", bestTimeToBuyAndSellStockNaive(REP), 5);
assertEqual("basic(REP)", bestTimeToBuyAndSellStockBasic(REP), 5);
assertEqual("optimized(REP)", bestTimeToBuyAndSellStock(REP), 5);
assertEqual("kadane(REP)", bestTimeToBuyAndSellStockKadane(REP), 5);

// leftMin 배열 값 직접 출력 (3.1절 표에 쓰기 위함)
{
  const n = REP.length;
  const leftMin = new Array<number>(n);
  leftMin[0] = REP[0];
  for (let j = 1; j < n; j++) leftMin[j] = Math.min(leftMin[j - 1], REP[j]);
  console.log("leftMin(REP) =", leftMin);

  const diffs: number[] = [];
  for (let k = 1; k < n; k++) diffs.push(REP[k] - REP[k - 1]);
  console.log("diffs(REP) =", diffs);

  // Kadane curSum 트레이스
  let curSum = 0;
  const trace: number[] = [];
  for (let k = 1; k < n; k++) {
    const d = REP[k] - REP[k - 1];
    curSum = Math.max(d, curSum + d);
    trace.push(curSum);
  }
  console.log("kadane curSum trace =", trace);
}

// ---- 엣지 케이스 ----
console.log("=== 엣지 케이스 ===");
assertEqual("empty", bestTimeToBuyAndSellStock([]), 0);
assertEqual("single", bestTimeToBuyAndSellStock([5]), 0);
assertEqual("monotonic decreasing", bestTimeToBuyAndSellStock([5, 4, 3, 2, 1]), 0);
assertEqual("monotonic increasing", bestTimeToBuyAndSellStock([1, 2, 3, 4, 5]), 4);
assertEqual("all equal", bestTimeToBuyAndSellStock([5, 5, 5, 5]), 0);
assertEqual("boundary max", bestTimeToBuyAndSellStock([0, 10000]), 10000);
assertEqual("boundary given", bestTimeToBuyAndSellStock([1, 10000]), 9999);
assertEqual("two-element decreasing", bestTimeToBuyAndSellStock([2, 1]), 0);
assertEqual("valley then peak", bestTimeToBuyAndSellStock([2, 4, 1, 7]), 6);
assertEqual("decreasing then rising", bestTimeToBuyAndSellStock([7, 6, 4, 3, 1]), 0);

for (const arr of [[], [5], [5, 4, 3, 2, 1], [1, 2, 3, 4, 5], [5, 5, 5, 5], [0, 10000], [1, 10000], [2, 1], [2, 4, 1, 7], [7, 6, 4, 3, 1]]) {
  assertEqual(`basic vs optimized: ${JSON.stringify(arr)}`, bestTimeToBuyAndSellStockBasic(arr), bestTimeToBuyAndSellStock(arr));
  assertEqual(`kadane vs optimized: ${JSON.stringify(arr)}`, bestTimeToBuyAndSellStockKadane(arr), bestTimeToBuyAndSellStock(arr));
}

// ---- 무작위 교차검증 ----
console.log("=== 무작위 교차검증 (naive vs basic vs optimized vs kadane) ===");
function randArr(): number[] {
  const n = 1 + Math.floor(Math.random() * 12);
  return Array.from({ length: n }, () => Math.floor(Math.random() * 21)); // 0..20
}
for (let t = 0; t < 2000; t++) {
  const arr = randArr();
  const a = bestTimeToBuyAndSellStockNaive(arr);
  const b = bestTimeToBuyAndSellStockBasic(arr);
  const c = bestTimeToBuyAndSellStock(arr);
  const d = bestTimeToBuyAndSellStockKadane(arr);
  if (a !== b || a !== c || a !== d) {
    console.log("MISMATCH", arr, { a, b, c, d });
    throw new Error("random mismatch");
  }
}
console.log("random cross-check OK (2000 trials)");

// ---- 함정 시나리오: 순서를 바꾸면(먼저 minLeft 갱신 후 이익 계산) 값이 달라지는지 확인 ----
function buggyWrongOrder(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;
  let minLeft = prices[0];
  let best = 0;
  for (let j = 1; j < n; j++) {
    minLeft = Math.min(minLeft, prices[j]); // 순서를 바꿔 먼저 갱신 (오답 함정 시연용)
    best = Math.max(best, prices[j] - minLeft);
  }
  return best;
}
console.log("=== 함정: minLeft를 먼저 갱신하면? ===");
console.log("prices=[2,1]  correct=0  buggy=", buggyWrongOrder([2, 1]));
console.log("prices=[3,2,6,5,0,3]  correct=", bestTimeToBuyAndSellStock([3, 2, 6, 5, 0, 3]), " buggy=", buggyWrongOrder([3, 2, 6, 5, 0, 3]));

// ---- 함정 시나리오 B: "누적 최저가" 대신 "바로 전날 가격"과만 비교 ----
function buggyAdjacentOnly(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;
  let best = 0;
  for (let j = 1; j < n; j++) {
    best = Math.max(best, prices[j] - prices[j - 1]); // 누적 최저가 대신 바로 전날 가격만 사용
  }
  return best;
}
console.log("=== 함정: minLeft 대신 바로 전날 가격만 비교하면? ===");
console.log(`prices=${JSON.stringify(REP)}  correct=`, bestTimeToBuyAndSellStock(REP), " buggy(adjacent-only)=", buggyAdjacentOnly(REP));

// ---- 함정 시나리오 C: minLeft 초기값을 0으로 두면? ----
function buggyZeroInit(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;
  let minLeft = 0; // prices[0] 대신 0으로 초기화 (틀린 가정)
  let best = 0;
  for (let j = 1; j < n; j++) {
    best = Math.max(best, prices[j] - minLeft);
    minLeft = Math.min(minLeft, prices[j]);
  }
  return best;
}
console.log("=== 함정: minLeft 초기값을 0으로 두면? ===");
console.log(`prices=${JSON.stringify(REP)}  correct=`, bestTimeToBuyAndSellStock(REP), " buggy(zero-init)=", buggyZeroInit(REP));
