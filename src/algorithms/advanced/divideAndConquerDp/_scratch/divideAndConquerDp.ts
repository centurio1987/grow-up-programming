// E3 자기검증용 스크래치 — 가이드 본문에 실릴 코드를 그대로 옮겨 실측한다.

// ---------- 1. 출발점: naive O(k n^2) ----------
function kPartitionNaive(cost: number[][], k: number): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;
  for (let g = 2; g <= k; g++) {
    for (let i = g - 1; i < n; i++) {
      for (let j = g - 2; j < i; j++) {
        const val = dp[g - 1]![j]! + cost[j + 1]![i]!;
        if (val < dp[g]![i]!) dp[g]![i] = val;
      }
    }
  }
  return dp[k]![n - 1]!;
}

// naive 루프 카운트 (ascii art 수치 검증용)
function countNaiveIterations(n: number, k: number): number {
  let count = 0;
  for (let g = 2; g <= k; g++) {
    for (let i = g - 1; i < n; i++) {
      for (let j = g - 2; j < i; j++) {
        count++;
      }
    }
  }
  return count;
}

// ---------- 2. 아이디어를 코드로: 기본 분할 정복 구현 (O(kn) 공간) ----------
function kPartitionDivideConquer(cost: number[][], k: number): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;

  const solve = (g: number, lo: number, hi: number, optLo: number, optHi: number) => {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let bestCost = INF;
    let bestOpt = optLo;
    const upper = Math.min(optHi, mid - 1);
    for (let j = optLo; j <= upper; j++) {
      const val = dp[g - 1]![j]! + cost[j + 1]![mid]!;
      if (val < bestCost) {
        bestCost = val;
        bestOpt = j;
      }
    }
    dp[g]![mid] = bestCost;
    solve(g, lo, mid - 1, optLo, bestOpt);
    solve(g, mid + 1, hi, bestOpt, optHi);
  };

  for (let g = 2; g <= k; g++) {
    solve(g, 0, n - 1, 0, n - 2);
  }
  return dp[k]![n - 1]!;
}

// ---------- 3. 최적화 코드: 롤링 배열로 O(n) 공간 ----------
function divideAndConquerDp(cost: number[][], k: number): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;

  let prev = new Array<number>(n).fill(INF); // dp[g-1]
  for (let i = 0; i < n; i++) prev[i] = cost[0]![i]!; // g=1 기저

  for (let g = 2; g <= k; g++) {
    const cur = new Array<number>(n).fill(INF); // dp[g]

    const solve = (lo: number, hi: number, optLo: number, optHi: number) => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        const val = prev[j]! + cost[j + 1]![mid]!;
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };

    solve(0, n - 1, 0, n - 2);
    prev = cur; // 다음 계층을 위해 교체
  }

  return prev[n - 1]!;
}

// ---------- 시뮬레이션용: 최적점 추적 버전 (opt(g,i) 로그) ----------
function divideAndConquerDpWithTrace(cost: number[][], k: number) {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(INF));
  const opt: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(-1));
  const log: string[] = [];
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;

  const solve = (g: number, lo: number, hi: number, optLo: number, optHi: number) => {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let bestCost = INF;
    let bestOpt = optLo;
    const upper = Math.min(optHi, mid - 1);
    for (let j = optLo; j <= upper; j++) {
      const val = dp[g - 1]![j]! + cost[j + 1]![mid]!;
      if (val < bestCost) {
        bestCost = val;
        bestOpt = j;
      }
    }
    dp[g]![mid] = bestCost;
    opt[g]![mid] = bestOpt;
    log.push(`solve(${g}, ${lo}, ${hi}, ${optLo}, ${optHi}) mid=${mid} dp[${g}][${mid}]=${bestCost} opt=${bestOpt}`);
    solve(g, lo, mid - 1, optLo, bestOpt);
    solve(g, mid + 1, hi, bestOpt, optHi);
  };

  for (let g = 2; g <= k; g++) {
    solve(g, 0, n - 1, 0, n - 2);
  }
  return { result: dp[k]![n - 1]!, dp, opt, log };
}

// ---------- 비용 행렬 빌더 (a의 구간 합의 제곱, QI 만족) ----------
function buildCost(a: number[]): number[][] {
  const n = a.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i]! + a[i]!;
  const cost: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const s = prefix[j + 1]! - prefix[i]!;
      cost[i]![j] = s * s;
    }
  }
  return cost;
}

// =================== 실행 & 검증 ===================

console.log("=== naive 루프 카운트 (ascii art 수치) ===");
console.log("n=6, k=3:", countNaiveIterations(6, 3));
console.log("n=6, k=2:", countNaiveIterations(6, 2));
console.log("n=500, k=500:", countNaiveIterations(500, 500));

console.log("\n=== 대표 예시: problem.md 예시 c ===");
const c = [
  [0, 2, 5],
  [0, 0, 3],
  [0, 0, 0],
];
console.log("k=1:", divideAndConquerDp(c, 1), "(기대 5)");
console.log("k=3:", divideAndConquerDp(c, 3), "(기대 0)");
console.log("k=2:", divideAndConquerDp(c, 2), "(기대 2)");

console.log("\n=== 단일 원소 ===");
console.log(divideAndConquerDp([[7]], 1), "(기대 7)");

console.log("\n=== 균등 분할 c2 ===");
const c2 = buildCost([2, 2, 2, 2]);
console.log(JSON.stringify(c2));
console.log("k=2:", divideAndConquerDp(c2, 2), "(기대 32)");

console.log("\n=== 시뮬레이션 대표 예시: a=[1,2,3,4], n=4, k=2 ===");
const a = [1, 2, 3, 4];
const costA = buildCost(a);
console.log("cost matrix:", JSON.stringify(costA));
const trace = divideAndConquerDpWithTrace(costA, 2);
console.log("최종 결과:", trace.result);
console.log("dp 테이블:", JSON.stringify(trace.dp));
console.log("opt 테이블:", JSON.stringify(trace.opt));
console.log("실행 로그:");
trace.log.forEach((l) => console.log(" ", l));

console.log("\n=== 세 구현 일치성 + 랜덤 교차검증 ===");
function randomTest(trials: number) {
  let allOk = true;
  for (let t = 0; t < trials; t++) {
    const n = 1 + Math.floor(Math.random() * 8);
    const arr = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 9));
    const cost = buildCost(arr);
    const k = 1 + Math.floor(Math.random() * n);
    const r1 = kPartitionNaive(cost, k);
    const r2 = kPartitionDivideConquer(cost, k);
    const r3 = divideAndConquerDp(cost, k);
    const ok = r1 === r2 && r2 === r3;
    if (!ok) {
      allOk = false;
      console.log("MISMATCH", { arr, k, r1, r2, r3 });
    }
  }
  console.log(allOk ? `랜덤 ${trials}회 전부 일치` : "불일치 발견!");
}
randomTest(500);

console.log("\n=== 엣지: n=1,k=1 ===");
console.log(divideAndConquerDp([[7]], 1));

console.log("\n=== 엣지: k=n (각 원소 단독 구간) ===");
const c3 = buildCost([3, 1, 4, 1, 5]);
console.log("k=n:", divideAndConquerDp(c3, 5), "naive:", kPartitionNaive(c3, 5));
let sumDiag = 0;
for (let i = 0; i < 5; i++) sumDiag += c3[i]![i]!;
console.log("대각합(기대):", sumDiag);

console.log("\n=== opt 단조성 확인 (n=8) ===");
const bigA = [1, 2, 3, 4, 5, 6, 7, 8];
const bigCost = buildCost(bigA);
const bigTrace = divideAndConquerDpWithTrace(bigCost, 3);
console.log("opt[3]:", bigTrace.opt[3]);
console.log("결과:", bigTrace.result, "naive:", kPartitionNaive(bigCost, 3));

console.log("\n=== 점검문제 1: a=[1,1,1], k=2 ===");
const qa = buildCost([1, 1, 1]);
console.log("cost:", JSON.stringify(qa));
console.log("답:", divideAndConquerDp(qa, 2));

console.log("\n=== 함정 시연: upper 상한을 min(optHi, mid-1) 대신 optHi로 두면? ===");
function buggyDivideAndConquerDp(cost: number[][], k: number): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;
  const solve = (g: number, lo: number, hi: number, optLo: number, optHi: number) => {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let bestCost = INF;
    let bestOpt = optLo;
    const upper = optHi; // 버그: min(optHi, mid-1) 캡을 빼먹음
    for (let j = optLo; j <= upper; j++) {
      if (j >= mid) continue; // 배열 범위는 지키되 캡 자체가 없는 상황을 재현
      const val = dp[g - 1]![j]! + cost[j + 1]![mid]!;
      if (val < bestCost) {
        bestCost = val;
        bestOpt = j;
      }
    }
    dp[g]![mid] = bestCost;
    solve(g, lo, mid - 1, optLo, bestOpt);
    solve(g, mid + 1, hi, bestOpt, optHi);
  };
  for (let g = 2; g <= k; g++) solve(g, 0, n - 1, 0, n - 2);
  return dp[k]![n - 1]!;
}
// 진짜 버그(캡을 아예 안 거는 경우) - optHi를 그대로 상한으로 쓰면 j가 mid 이상도 후보가 되어
// 재귀 불변식이 깨진다. 좌측 재귀에 넘기는 bestOpt가 mid 이상이 될 수 있음을 직접 보인다.
function trulyBuggyDivideAndConquerDp(cost: number[][], k: number): { result: number; note: string } {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;
  let note = "";
  const solve = (g: number, lo: number, hi: number, optLo: number, optHi: number) => {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let bestCost = INF;
    let bestOpt = optLo;
    const upper = optHi; // 캡 없음: j가 mid를 넘어설 수 있다
    for (let j = optLo; j <= upper && j < n; j++) {
      const val = dp[g - 1]![j]! + (cost[j + 1] ? cost[j + 1]![mid]! : NaN);
      if (!Number.isNaN(val) && val < bestCost) {
        bestCost = val;
        bestOpt = j;
      }
    }
    if (bestOpt >= mid) note += `mid=${mid}인데 bestOpt=${bestOpt} (bestOpt >= mid, 불변식 위반!); `;
    dp[g]![mid] = bestCost;
    solve(g, lo, mid - 1, optLo, bestOpt);
    solve(g, mid + 1, hi, bestOpt, optHi);
  };
  for (let g = 2; g <= k; g++) solve(g, 0, n - 1, 0, n - 2);
  return { result: dp[k]![n - 1]!, note };
}
const bugResult = trulyBuggyDivideAndConquerDp(costA, 2);
console.log("정상 결과:", divideAndConquerDp(costA, 2));
console.log("버그 결과:", bugResult.result, "| 위반 로그:", bugResult.note || "(위반 없음, 다른 예시 필요)");

console.log("\n=== 함정2: prev=cur 스왑을 빼먹으면 (롤링 배열 재사용 버그) ===");
function buggyRollingDivideAndConquerDp(cost: number[][], k: number): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  let prev = new Array<number>(n).fill(INF);
  for (let i = 0; i < n; i++) prev[i] = cost[0]![i]!;
  for (let g = 2; g <= k; g++) {
    // 버그: cur를 새로 만들지 않고 prev를 직접 덮어씀 (같은 계층 안에서도 값이 섞인다)
    const cur = prev; // 새 배열이 아니라 같은 참조!
    const solve = (lo: number, hi: number, optLo: number, optHi: number) => {
      if (lo > hi) return;
      const mid = (lo + hi) >> 1;
      let bestCost = INF;
      let bestOpt = optLo;
      const upper = Math.min(optHi, mid - 1);
      for (let j = optLo; j <= upper; j++) {
        const val = prev[j]! + cost[j + 1]![mid]!; // prev가 이미 cur로 오염된 상태일 수 있음
        if (val < bestCost) {
          bestCost = val;
          bestOpt = j;
        }
      }
      cur[mid] = bestCost;
      solve(lo, mid - 1, optLo, bestOpt);
      solve(mid + 1, hi, bestOpt, optHi);
    };
    solve(0, n - 1, 0, n - 2);
    prev = cur;
  }
  return prev[n - 1]!;
}
console.log("정상:", divideAndConquerDp(costA, 2), "버그:", buggyRollingDivideAndConquerDp(costA, 2));
const bigK = 4;
const bigA2 = [1, 2, 3, 4, 5, 6];
const bigCost2 = buildCost(bigA2);
console.log("정상(n=6,k=4):", divideAndConquerDp(bigCost2, bigK), "naive:", kPartitionNaive(bigCost2, bigK), "버그:", buggyRollingDivideAndConquerDp(bigCost2, bigK));

console.log("\n=== 함정1 재탐색: min(optHi, mid-1) 캡 생략 버그가 실제로 값을 틀리게 하는 예시 찾기 ===");
function capBugDivideAndConquerDp(cost: number[][], k: number): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: k + 1 }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;
  const solve = (g: number, lo: number, hi: number, optLo: number, optHi: number) => {
    if (lo > hi) return;
    const mid = (lo + hi) >> 1;
    let bestCost = INF;
    let bestOpt = optLo;
    const upper = optHi; // 버그: mid-1 캡 생략. j가 mid 이상도 허용된다.
    for (let j = optLo; j <= upper && j < n; j++) {
      const rowJ1 = cost[j + 1];
      const cVal = rowJ1 ? (rowJ1[mid] ?? 0) : 0; // j+1 > mid인 칸은 0으로 잘못 채워진 미계산 영역
      const val = dp[g - 1]![j]! + cVal;
      if (val < bestCost) {
        bestCost = val;
        bestOpt = j;
      }
    }
    dp[g]![mid] = bestCost;
    solve(g, lo, mid - 1, optLo, bestOpt);
    solve(g, mid + 1, hi, bestOpt, optHi);
  };
  for (let g = 2; g <= k; g++) solve(g, 0, n - 1, 0, n - 2);
  return dp[k]![n - 1]!;
}
let found = false;
for (let t = 0; t < 3000 && !found; t++) {
  const n = 2 + Math.floor(Math.random() * 7);
  const arr = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 9));
  const cost = buildCost(arr);
  const k = 2 + Math.floor(Math.random() * (n - 1));
  const good = divideAndConquerDp(cost, k);
  const bad = capBugDivideAndConquerDp(cost, k);
  if (good !== bad) {
    console.log("발견:", { arr, k, good, bad });
    found = true;
  }
}
if (!found) console.log("3000회 탐색에서 분기 못 찾음 - 더 큰 n 필요");

console.log("\n=== 함정1 확정 시연: n=4 a=[1,2,3,4], k=3 (dp[2][0] 오염이 dp[3]에 전파되는지) ===");
console.log("정상(k=3):", divideAndConquerDp(costA, 3), "naive:", kPartitionNaive(costA, 3));
console.log("버그(k=3):", capBugDivideAndConquerDp(costA, 3));

console.log("\n=== 함정1 dp[2][0] 오염값 직접 확인 ===");
function capBugTraceDp2at0(cost: number[][]): number {
  const n = cost.length;
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: 3 }, () => new Array(n).fill(INF));
  for (let i = 0; i < n; i++) dp[1]![i] = cost[0]![i]!;
  const mid = 0, optLo = 0, optHi = 0; // solve(2,0,0,0,0) 호출 시점 재현
  let bestCost = INF, bestOpt = optLo;
  const upper = optHi; // 캡 생략 버그
  for (let j = optLo; j <= upper; j++) {
    const rowJ1 = cost[j + 1];
    const cVal = rowJ1 ? (rowJ1[mid] ?? 0) : 0;
    const val = dp[1]![j]! + cVal;
    if (val < bestCost) { bestCost = val; bestOpt = j; }
  }
  console.log(`buggy dp[2][0] = ${bestCost} (j=${bestOpt} 사용, cost[1][0]=${cost[1]?.[0]}를 유효한 비용처럼 오인)`);
  return bestCost;
}
capBugTraceDp2at0(costA);
console.log("정상 알고리즘에서는 solve(2,0,0,0,0)이 j 범위 [0, min(0,-1)]=[0,-1]로 공집합이라 dp[2][0]은 갱신되지 않는다(도달 불가능한 상태로 남아야 함).");
