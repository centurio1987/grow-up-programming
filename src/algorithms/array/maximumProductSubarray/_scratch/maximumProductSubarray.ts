// E3 자기검증 스크래치 — 가이드 본문 코드를 그대로 추출해 실행 확인한다.

// 1) naive: 모든 구간 [l, r]의 곱을 직접 계산
function maximumProductSubarrayNaive(A: number[]): number {
  let best = A[0]!;
  for (let l = 0; l < A.length; l++) {
    let prod = 1;
    for (let r = l; r < A.length; r++) {
      prod *= A[r]!;
      best = Math.max(best, prod);
    }
  }
  return best;
}

// 2) 원형 아이디어: 합의 Kadane을 그대로 곱에 옮긴 단일 변수 버전 (실패함을 보이기 위한 코드)
function maximumProductSubarrayBrokenSingleVar(A: number[]): number {
  let curMax = A[0]!;
  let best = A[0]!;
  for (let i = 1; i < A.length; i++) {
    curMax = Math.max(A[i]!, curMax * A[i]!);
    best = Math.max(best, curMax);
  }
  return best;
}

// 3) 최종: 최댓값/최솟값 동시 추적
function maximumProductSubarray(A: number[]): number {
  let curMax = A[0]!;
  let curMin = A[0]!;
  let best = A[0]!;

  for (let i = 1; i < A.length; i++) {
    const prevMax = curMax; // 동시 갱신 충돌 방지: 이전 최댓값 저장
    const x = A[i]!;
    curMax = Math.max(x, prevMax * x, curMin * x);
    curMin = Math.min(x, prevMax * x, curMin * x);
    best = Math.max(best, curMax);
  }

  return best;
}

// 최종 코드 + 트레이스 로깅 버전 (시뮬레이션 프레임 검증용)
function maximumProductSubarrayTraced(A: number[]): number {
  let curMax = A[0]!;
  let curMin = A[0]!;
  let best = A[0]!;
  console.log(`i=0: curMax=${curMax}, curMin=${curMin}, best=${best}`);

  for (let i = 1; i < A.length; i++) {
    const prevMax = curMax;
    const x = A[i]!;
    curMax = Math.max(x, prevMax * x, curMin * x);
    curMin = Math.min(x, prevMax * x, curMin * x);
    best = Math.max(best, curMax);
    console.log(
      `i=${i}: A[i]=${x}, prevMax=${prevMax}, candidates=[${x}, ${prevMax * x}, ${curMin === x || true ? "" : ""}${""}] curMax=${curMax}, curMin=${curMin}, best=${best}`,
    );
  }

  return best;
}

const cases: Array<[number[], number]> = [
  [[2, 3, -2, 4], 6],
  [[-2, 3, -4], 24],
  [[2, 3, 4], 24],
  [[-2, 0, -1], 0],
  [[0, 2], 2],
  [[-2], -2],
  [[-10, -10], 100],
  [[2, -5, -2, -4, 3], 24],
  [[-3], -3],
  [[-2, -3, -4], 12],
  [[2, 0, 3], 3],
];

console.log("=== 대표/엣지 케이스 검증 (naive vs 최종) ===");
for (const [A, expected] of cases) {
  const naive = maximumProductSubarrayNaive(A);
  const final = maximumProductSubarray(A);
  const ok = naive === expected && final === expected && naive === final;
  console.log(
    `A=${JSON.stringify(A)} expected=${expected} naive=${naive} final=${final} ${ok ? "OK" : "MISMATCH"}`,
  );
  if (!ok) throw new Error(`MISMATCH at A=${JSON.stringify(A)}`);
}

console.log("\n=== 원형(단일 변수) 실패 시연: A=[3,-2,-5] ===");
{
  const A = [3, -2, -5];
  const broken = maximumProductSubarrayBrokenSingleVar(A);
  const naive = maximumProductSubarrayNaive(A);
  const final = maximumProductSubarray(A);
  console.log(`broken(single-var)=${broken}, naive(정답)=${naive}, final=${final}`);
}

console.log("\n=== 시뮬레이션 트레이스: A=[2,3,-2,4] ===");
maximumProductSubarrayTraced([2, 3, -2, 4]);

console.log("\n=== 무작위 교차검증 (naive vs 최종, 100회) ===");
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
let allOk = true;
for (let t = 0; t < 100; t++) {
  const n = randInt(1, 12);
  const A = Array.from({ length: n }, () => randInt(-10, 10));
  const naive = maximumProductSubarrayNaive(A);
  const final = maximumProductSubarray(A);
  if (naive !== final) {
    allOk = false;
    console.log(`MISMATCH A=${JSON.stringify(A)} naive=${naive} final=${final}`);
  }
}
console.log(allOk ? "무작위 100회 모두 일치" : "무작위 검증 실패 있음");

console.log("\n=== 순서 버그(prevMax 미저장) 시연: A=[-7,2,-1,-8] ===");
{
  function buggy(A: number[]): number {
    let curMax = A[0]!, curMin = A[0]!, best = A[0]!;
    for (let i = 1; i < A.length; i++) {
      const x = A[i]!;
      curMax = Math.max(x, curMax * x, curMin * x); // prevMax 저장 없이 curMax를 바로 갱신
      curMin = Math.min(x, curMax * x, curMin * x); // 버그: 이미 갱신된 curMax를 사용
      best = Math.max(best, curMax);
      console.log(`i=${i}: x=${x} -> curMax=${curMax}, curMin=${curMin}, best=${best}`);
    }
    return best;
  }
  const A = [-7, 2, -1, -8];
  console.log("정답(final) =", maximumProductSubarray(A));
  console.log("buggy 결과 =", buggy(A));
}

console.log("\n=== 스스로 점검하기 Q1 트레이스: A=[-4,-3,1,2] ===");
maximumProductSubarrayTraced([-4, -3, 1, 2]);
console.log("naive =", maximumProductSubarrayNaive([-4, -3, 1, 2]));

console.log("\n=== best=0 초기화 오류 시연: A=[-3] ===");
{
  // best를 0으로 잘못 초기화하면 어떻게 되는지 (루프가 안 도는 n=1 케이스로 바로 노출됨)
  const A = [-3];
  const wrongBest = 0; // 잘못된 초기값
  console.log(`A=[-3], 정답=${maximumProductSubarray(A)}, best=0으로 초기화 시 (루프 미실행) 반환값=${wrongBest}`);
}


console.log("\n=== 정답 트레이스: A=[-7,2,-1,-8] (버그 대조용) ===");
maximumProductSubarrayTraced([-7, 2, -1, -8]);
