// 자기검증용 스크래치: 가이드 본문에 싣는 세 코드(원형/개선/최종)를 그대로 실행해 검증한다.
// 가이드: src/algorithms/advanced/knuthOptimization/knuthOptimization-guide.new.mdx

// ── 원형: O(n^3) 구간 DP (출발점 절) ─────────────────────────────
function knuthOptimizationNaive(freq: number[]): number {
  const n = freq.length;
  if (n <= 1) return 0;

  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + freq[i];
  const S = (i: number, j: number) => prefix[j + 1] - prefix[i];

  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = Number.MAX_SAFE_INTEGER;
      for (let k = i; k < j; k++) {
        const val = dp[i][k] + dp[k + 1][j] + S(i, j);
        if (val < best) best = val;
      }
      dp[i][j] = best;
    }
  }
  return dp[0][n - 1];
}

// ── 개선: O(n^2) Knuth's Optimization, 중첩 배열 (아이디어를 코드로 옮기기 절) ──
function knuthOptimizationBase(freq: number[]): number {
  const n = freq.length;
  if (n <= 1) return 0;

  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + freq[i];
  const S = (i: number, j: number) => prefix[j + 1] - prefix[i];

  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const opt: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    dp[i][i] = 0;
    opt[i][i] = i;
  }

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = INF;
      const loK = opt[i][j - 1];
      const hiK = opt[i + 1][j];
      for (let k = loK; k <= Math.min(hiK, j - 1); k++) {
        const val = dp[i][k] + dp[k + 1][j] + S(i, j);
        if (val < dp[i][j]) {
          dp[i][j] = val;
          opt[i][j] = k;
        }
      }
    }
  }
  return dp[0][n - 1];
}

// 트레이스용 (dp/opt 행렬을 그대로 노출 — 시뮬레이션 프레임 대조 목적)
function knuthOptimizationTraced(freq: number[]) {
  const n = freq.length;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + freq[i];
  const S = (i: number, j: number) => prefix[j + 1] - prefix[i];
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: (number | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
  const opt: (number | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
  for (let i = 0; i < n; i++) {
    dp[i][i] = 0;
    opt[i][i] = i;
  }
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = INF;
      const loK = opt[i][j - 1] as number;
      const hiK = opt[i + 1][j] as number;
      for (let k = loK; k <= Math.min(hiK, j - 1); k++) {
        const val = (dp[i][k] as number) + (dp[k + 1][j] as number) + S(i, j);
        if (val < (dp[i][j] as number)) {
          dp[i][j] = val;
          opt[i][j] = k;
        }
      }
    }
  }
  return { dp, opt, prefix, result: dp[0][n - 1] };
}

// ── 최종: O(n^2) + flat typed array (최적화 코드 절) ─────────────────
function knuthOptimizationFlat(freq: number[]): number {
  const n = freq.length;
  if (n <= 1) return 0;

  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + freq[i];
  const S = (i: number, j: number) => prefix[j + 1] - prefix[i];

  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp = new Float64Array(n * n); // dp[i*n+j]
  const opt = new Int32Array(n * n); // opt[i*n+j]

  for (let i = 0; i < n; i++) {
    dp[i * n + i] = 0;
    opt[i * n + i] = i;
  }

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i * n + j] = INF;
      const loK = opt[i * n + (j - 1)];
      const hiK = opt[(i + 1) * n + j];
      for (let k = loK; k <= Math.min(hiK, j - 1); k++) {
        const val = dp[i * n + k] + dp[(k + 1) * n + j] + S(i, j);
        if (val < dp[i * n + j]) {
          dp[i * n + j] = val;
          opt[i * n + j] = k;
        }
      }
    }
  }
  return dp[n - 1];
}

// ────────────────────────────── 검증 ──────────────────────────────

function randArr(n: number, max: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * max));
}

console.log("=== 대표 예시 freq=[4,1,2,3] : naive / base / flat 일치 확인 ===");
console.log("naive:", knuthOptimizationNaive([4, 1, 2, 3]));
console.log("base :", knuthOptimizationBase([4, 1, 2, 3]));
console.log("flat :", knuthOptimizationFlat([4, 1, 2, 3]));

console.log("\n=== 대표 예시 dp/opt 트레이스 (시뮬레이션 프레임과 대조) ===");
const traced = knuthOptimizationTraced([4, 1, 2, 3]);
console.log("prefix:", traced.prefix);
console.log("dp:", traced.dp);
console.log("opt:", traced.opt);
console.log("result (dp[0][3]):", traced.result);

console.log("\n=== QI 부등식 손 검산 (a=0,b=1,c=2,d=3) ===");
const pfx = traced.prefix;
const Sfn = (i: number, j: number) => pfx[j + 1] - pfx[i];
console.log(`S(0,2)=${Sfn(0, 2)}  S(1,3)=${Sfn(1, 3)}  합=${Sfn(0, 2) + Sfn(1, 3)}`);
console.log(`S(0,3)=${Sfn(0, 3)}  S(1,2)=${Sfn(1, 2)}  합=${Sfn(0, 3) + Sfn(1, 2)}`);

console.log("\n=== 문제 예시(problem.md) 전수 검증 ===");
const cases: [number[], number][] = [
  [[10], 0],
  [[10, 20], 30],
  [[1, 2, 3], 9],
  [[10, 20, 30], 90],
  [[0, 5, 0], 10],
  [[0, 0, 0, 0], 0],
  [[10, 10, 10, 10], 80],
];
let casesOk = true;
for (const [input, expected] of cases) {
  const naive = knuthOptimizationNaive(input);
  const base = knuthOptimizationBase(input);
  const flat = knuthOptimizationFlat(input);
  const ok = naive === expected && base === expected && flat === expected;
  if (!ok) casesOk = false;
  console.log(
    `freq=${JSON.stringify(input)} expected=${expected} naive=${naive} base=${base} flat=${flat} ${ok ? "OK" : "MISMATCH"}`,
  );
}
console.log("전체 예시 일치:", casesOk);

console.log("\n=== 랜덤 교차검증 (n<=45, naive vs base vs flat, 300케이스) ===");
let allOk = true;
for (let t = 0; t < 300; t++) {
  const n = 1 + Math.floor(Math.random() * 45);
  const arr = randArr(n, 60);
  const a = knuthOptimizationNaive(arr);
  const b = knuthOptimizationBase(arr);
  const c = knuthOptimizationFlat(arr);
  if (a !== b || b !== c) {
    allOk = false;
    console.log("MISMATCH", arr, { a, b, c });
  }
}
console.log("랜덤 300케이스 전부 일치:", allOk);

console.log("\n=== 성능 비교: O(n^3) naive vs O(n^2) base (체감용, n=200) ===");
{
  const arr = randArr(200, 500);
  const t0 = performance.now();
  knuthOptimizationNaive(arr);
  const t1 = performance.now();
  knuthOptimizationBase(arr);
  const t2 = performance.now();
  console.log(`n=200: naive(O(n^3))=${(t1 - t0).toFixed(1)}ms, base(O(n^2))=${(t2 - t1).toFixed(1)}ms`);
}

console.log("\n=== 성능 비교: nested array(base) vs flat typed array(flat), O(n^2) 동일 복잡도 ===");
for (const n of [1000, 2000, 3000]) {
  const arr = randArr(n, 1000);
  const s0 = performance.now();
  knuthOptimizationBase(arr);
  const s1 = performance.now();
  knuthOptimizationFlat(arr);
  const s2 = performance.now();
  console.log(`n=${n}: nested=${(s1 - s0).toFixed(1)}ms, flat=${(s2 - s1).toFixed(1)}ms`);
}

console.log("\n=== n=5000 대규모 스모크 (제약 상한) ===");
{
  const arr = randArr(5000, 1000);
  const t0 = performance.now();
  const r = knuthOptimizationFlat(arr);
  const t1 = performance.now();
  console.log(`n=5000 flat: result type=${typeof r}, ms=${(t1 - t0).toFixed(1)}`);
}

console.log("\n=== 점검문제 1: freq=[5,2,4] 손 계산 대조 ===");
console.log("base:", knuthOptimizationBase([5, 2, 4]));
const t2 = knuthOptimizationTraced([5, 2, 4]);
console.log("dp:", t2.dp, "opt:", t2.opt);

console.log("\n=== 점검문제 2 함정: lo_k/hi_k를 뒤바꾸면? ===");
function knuthOptimizationSwappedBug(freq: number[]): number {
  const n = freq.length;
  if (n <= 1) return 0;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + freq[i];
  const S = (i: number, j: number) => prefix[j + 1] - prefix[i];
  const INF = Number.MAX_SAFE_INTEGER / 2;
  const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const opt: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) { dp[i][i] = 0; opt[i][i] = i; }
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      dp[i][j] = INF;
      const loK = opt[i + 1][j];   // 뒤바뀜 (버그)
      const hiK = opt[i][j - 1];   // 뒤바뀜 (버그)
      for (let k = loK; k <= Math.min(hiK, j - 1); k++) {
        const val = dp[i][k] + dp[k + 1][j] + S(i, j);
        if (val < dp[i][j]) { dp[i][j] = val; opt[i][j] = k; }
      }
    }
  }
  return dp[0][n - 1];
}
console.log("정상 base(freq=[4,1,2,3]):", knuthOptimizationBase([4, 1, 2, 3]));
console.log("버그 swapped(freq=[4,1,2,3]):", knuthOptimizationSwappedBug([4, 1, 2, 3]), "(INF 근처 값이면 반복문이 거의 안 돈 것)");
console.log("INF 값 참고 (MAX_SAFE_INTEGER/2):", Number.MAX_SAFE_INTEGER / 2);
