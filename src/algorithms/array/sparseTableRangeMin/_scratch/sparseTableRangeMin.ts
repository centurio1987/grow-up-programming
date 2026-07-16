// E3 자기검증 스크래치: 가이드 본문에 실리는 모든 코드를 그대로 추출해 실행값을 확인한다.
// bun src/algorithms/array/sparseTableRangeMin/_scratch/sparseTableRangeMin.ts

// ---------- 1) naive ----------
function sparseTableRangeMinNaive(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  return queries.map(([l, r]) => {
    let m = A[l]!;
    for (let i = l + 1; i <= r; i++) if (A[i]! < m) m = A[i]!;
    return m;
  });
}

// ---------- 2) 기본 구현 (Math.log2 매 질의 계산) ----------
function sparseTableRangeMinBasic(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  const N = A.length;
  const LOG = Math.floor(Math.log2(N)) + 1;
  const st: number[][] = Array.from({ length: LOG }, () => new Array(N).fill(0));

  for (let i = 0; i < N; i++) st[0]![i] = A[i]!;

  for (let k = 1; k < LOG; k++) {
    for (let i = 0; i + (1 << k) <= N; i++) {
      st[k]![i] = Math.min(st[k - 1]![i]!, st[k - 1]![i + (1 << (k - 1))]!);
    }
  }

  const result: number[] = [];
  for (const [l, r] of queries) {
    const len = r - l + 1;
    const k = Math.floor(Math.log2(len));
    result.push(Math.min(st[k]![l]!, st[k]![r - (1 << k) + 1]!));
  }
  return result;
}

// ---------- 3) 최적화 구현 (log2 룩업 테이블) ----------
function sparseTableRangeMin(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  const N = A.length;
  const LOG = Math.floor(Math.log2(N)) + 1;

  const log2Table = new Array<number>(N + 1).fill(0);
  for (let i = 2; i <= N; i++) log2Table[i] = log2Table[i >> 1]! + 1;

  const st: number[][] = Array.from({ length: LOG }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) st[0]![i] = A[i]!;
  for (let k = 1; k < LOG; k++) {
    for (let i = 0; i + (1 << k) <= N; i++) {
      st[k]![i] = Math.min(st[k - 1]![i]!, st[k - 1]![i + (1 << (k - 1))]!);
    }
  }

  const result: number[] = [];
  for (const [l, r] of queries) {
    const k = log2Table[r - l + 1]!;
    result.push(Math.min(st[k]![l]!, st[k]![r - (1 << k) + 1]!));
  }
  return result;
}

// ---------- 대표 예시 (problem.md) ----------
console.log("=== 대표 예시 ===");
console.log(
  sparseTableRangeMin(
    [3, 1, 4, 1, 5, 9, 2, 6],
    [[0, 7], [0, 2], [2, 2], [4, 7], [4, 5]],
  ),
); // expect [1, 1, 4, 2, 5]

console.log(sparseTableRangeMin([7, -3, 2, -1], [[0, 3], [1, 1], [2, 3]])); // expect [-3, -3, -1]
console.log(sparseTableRangeMin([5, 3, 7, 1, 9], [[0, 4]])); // expect [1]
console.log(sparseTableRangeMin([1, 2, 3], [])); // expect []
console.log(sparseTableRangeMin([42], [[0, 0]])); // expect [42]

// ---------- 시뮬레이션 고정 입력 ----------
console.log("=== 시뮬 고정 입력 ===");
const A_sim = [2, 4, 3, 1, 6, 7];
console.log("naive:", sparseTableRangeMinNaive(A_sim, [[0, 4], [2, 5]])); // expect [1,1]
console.log("basic:", sparseTableRangeMinBasic(A_sim, [[0, 4], [2, 5]])); // expect [1,1]
console.log("optimized:", sparseTableRangeMin(A_sim, [[0, 4], [2, 5]])); // expect [1,1]

// st 레벨 값 직접 확인 (시뮬 프레임과 대조)
{
  const N = A_sim.length;
  const st0 = A_sim.slice();
  const st1 = [];
  for (let i = 0; i + 2 <= N; i++) st1.push(Math.min(st0[i]!, st0[i + 1]!));
  const st2 = [];
  for (let i = 0; i + 4 <= N; i++) st2.push(Math.min(st1[i]!, st1[i + 2]!));
  console.log("st0:", st0);
  console.log("st1:", st1);
  console.log("st2:", st2);
}

// ---------- prefixMin으로 [l,r] 복원 불가 예시 ----------
console.log("=== prefixMin 반례 ===");
{
  const A = [2, 4, 3, 1, 6, 7];
  const prefixMin = (r: number) => Math.min(...A.slice(0, r + 1));
  console.log("prefixMin(4) =", prefixMin(4)); // expect 1
  console.log("prefixMin(1) =", prefixMin(1)); // expect 2
  console.log("실제 min(A[2..4]) =", Math.min(A[2]!, A[3]!, A[4]!)); // expect 1
}

// ---------- 합 연산에 겹침 허용을 적용했을 때의 오답 ----------
console.log("=== sum 겹침 오답 ===");
{
  const A = [2, 4, 3, 1, 6];
  const sum = (l: number, r: number) => A.slice(l, r + 1).reduce((a, b) => a + b, 0);
  const overlapSum = sum(0, 3) + sum(1, 4); // 겹치는 [1,3] 구간이 두 번 카운트됨
  const realSum = sum(0, 4);
  console.log("overlapSum(겹침 허용 오답) =", overlapSum);
  console.log("realSum(정답) =", realSum);
}

// ---------- 경계 가드 누락 시 NaN 전파 ----------
console.log("=== 경계 가드 누락 시 NaN ===");
{
  const A = [2, 4, 3, 1, 6, 7];
  const N = A.length;
  const LOG = Math.floor(Math.log2(N)) + 1;
  const st: number[][] = Array.from({ length: LOG }, () => new Array(N).fill(0));
  for (let i = 0; i < N; i++) st[0]![i] = A[i]!;
  // 버그: 가드 없이 i를 0..N-1까지 전부 순회
  for (let k = 1; k < LOG; k++) {
    for (let i = 0; i < N; i++) {
      st[k]![i] = Math.min(st[k - 1]![i]!, st[k - 1]![i + (1 << (k - 1))]!);
    }
  }
  console.log("st[2] (버그, 가드 없음):", st[2]);
  console.log("st[2][5] =", st[2]![5]); // NaN 기대
}

// ---------- log2Table off-by-one 버그 ----------
console.log("=== log2Table off-by-one 버그 ===");
{
  const N = 6;
  const buggy = new Array<number>(N + 1).fill(0);
  for (let i = 2; i <= N; i++) buggy[i] = buggy[i - 1]! + 1; // i>>1 대신 i-1 실수
  console.log("buggy log2Table:", buggy);
  const correct = new Array<number>(N + 1).fill(0);
  for (let i = 2; i <= N; i++) correct[i] = correct[i >> 1]! + 1;
  console.log("correct log2Table:", correct);
}

// ---------- 무작위 교차검증 (naive vs optimized) ----------
console.log("=== 무작위 교차검증 ===");
{
  function randInt(lo: number, hi: number) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  let mismatches = 0;
  for (let t = 0; t < 200; t++) {
    const N = randInt(1, 50);
    const A = Array.from({ length: N }, () => randInt(-50, 50));
    const Q = randInt(0, 20);
    const queries: Array<[number, number]> = [];
    for (let i = 0; i < Q; i++) {
      const l = randInt(0, N - 1);
      const r = randInt(l, N - 1);
      queries.push([l, r]);
    }
    const a = sparseTableRangeMinNaive(A, queries);
    const b = sparseTableRangeMinBasic(A, queries);
    const c = sparseTableRangeMin(A, queries);
    if (JSON.stringify(a) !== JSON.stringify(b) || JSON.stringify(a) !== JSON.stringify(c)) {
      mismatches++;
      console.log("MISMATCH", { A, queries, a, b, c });
    }
  }
  console.log("무작위 테스트 200회, 불일치:", mismatches);
}

// ---------- 엣지 케이스 ----------
console.log("=== 엣지 케이스 ===");
console.log("N=1:", sparseTableRangeMin([9], [[0, 0]])); // [9]
console.log("queries=[]:", sparseTableRangeMin([1, 2, 3], [])); // []
console.log("l==r:", sparseTableRangeMin([5, 1, 9], [[1, 1]])); // [1]
console.log("음수 포함:", sparseTableRangeMin([-5, -1, -9, 3], [[0, 3]])); // [-9]

// ---------- 목표 복잡도 수치 ----------
console.log("=== 목표 복잡도 수치 ===");
{
  const N = 100000;
  const Q = 100000;
  const LOG = Math.floor(Math.log2(N)) + 1;
  console.log("LOG =", LOG, "N*LOG =", N * LOG, "N*LOG+Q =", N * LOG + Q);
  console.log("naive N*Q =", N * Q);
}
