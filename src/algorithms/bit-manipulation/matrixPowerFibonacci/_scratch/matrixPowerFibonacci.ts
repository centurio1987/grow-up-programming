// E3 자기검증용 스크래치. 가이드 본문에 실을 코드를 그대로 옮겨 실측한다.

// ---- 출발점: naive O(n) 반복 ----
function fibNaive(n: bigint): bigint {
  if (n === 0n) return 0n;
  let a = 0n;
  let b = 1n;
  for (let i = 1n; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// ---- 아이디어를 코드로 옮기기: 행렬 거듭제곱 (반복 제곱법) ----
type Mat = [[bigint, bigint], [bigint, bigint]];

function matMul(A: Mat, B: Mat): Mat {
  return [
    [
      A[0][0] * B[0][0] + A[0][1] * B[1][0],
      A[0][0] * B[0][1] + A[0][1] * B[1][1],
    ],
    [
      A[1][0] * B[0][0] + A[1][1] * B[1][0],
      A[1][0] * B[0][1] + A[1][1] * B[1][1],
    ],
  ];
}

function matPow(M: Mat, n: bigint): Mat {
  let result: Mat = [
    [1n, 0n],
    [0n, 1n],
  ]; // 단위행렬 I
  let base: Mat = M;
  let e = n;
  while (e > 0n) {
    if (e & 1n) {
      result = matMul(result, base);
    }
    base = matMul(base, base);
    e >>= 1n;
  }
  return result;
}

function matrixPowerFibonacci(n: bigint): bigint {
  if (n === 0n) return 0n;
  const M: Mat = [
    [1n, 1n],
    [1n, 0n],
  ];
  const result = matPow(M, n);
  return result[0][1];
}

// ---- 검증 ----
function assertEq(label: string, actual: bigint, expected: bigint) {
  const ok = actual === expected;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 대표값 ===");
assertEq("F(0)", matrixPowerFibonacci(0n), 0n);
assertEq("F(1)", matrixPowerFibonacci(1n), 1n);
assertEq("F(2)", matrixPowerFibonacci(2n), 1n);
assertEq("F(3)", matrixPowerFibonacci(3n), 2n);
assertEq("F(10)", matrixPowerFibonacci(10n), 55n);
assertEq("F(50)", matrixPowerFibonacci(50n), 12586269025n);
assertEq(
  "F(100)",
  matrixPowerFibonacci(100n),
  354224848179261915075n,
);

console.log("=== naive와 교차검증 (n=0..300) ===");
let crossOk = true;
for (let n = 0n; n <= 300n; n++) {
  const a = matrixPowerFibonacci(n);
  const b = fibNaive(n);
  if (a !== b) {
    crossOk = false;
    console.log(`FAIL cross n=${n}: matrix=${a} naive=${b}`);
  }
}
console.log(crossOk ? "OK   naive 교차검증 n=0..300 전부 일치" : "FAIL 교차검증 실패");

console.log("=== 무작위 교차검증 (n=301..2000 중 30개 샘플) ===");
let randOk = true;
for (let i = 0; i < 30; i++) {
  const n = 301n + BigInt(Math.floor(Math.random() * 1700));
  const a = matrixPowerFibonacci(n);
  const b = fibNaive(n);
  if (a !== b) {
    randOk = false;
    console.log(`FAIL rand n=${n}: matrix=${a} naive=${b}`);
  }
}
console.log(randOk ? "OK   무작위 교차검증 통과" : "FAIL 무작위 교차검증 실패");

function matStr(m: Mat): string {
  return `[[${m[0][0]},${m[0][1]}],[${m[1][0]},${m[1][1]}]]`;
}

console.log("=== n = 10 트레이스 (시뮬레이션 대조) ===");
{
  const M: Mat = [
    [1n, 1n],
    [1n, 0n],
  ];
  let result: Mat = [
    [1n, 0n],
    [0n, 1n],
  ];
  let base: Mat = M;
  let e = 10n;
  let step = 0;
  console.log(`초기: base=${matStr(base)} result=${matStr(result)} e(2진)=${e.toString(2)}`);
  while (e > 0n) {
    const bit = e & 1n;
    if (bit === 1n) {
      result = matMul(result, base);
    }
    base = matMul(base, base);
    e >>= 1n;
    step++;
    console.log(
      `step${step}: bit=${bit} base(제곱후)=${matStr(base)} result=${matStr(result)} e남음(2진)=${e.toString(2)}`,
    );
  }
  console.log(`최종 result=${matStr(result)} → F(10)=${result[0][1]}`);
}

console.log("=== 엣지 케이스 ===");
assertEq("F(0) 엣지", matrixPowerFibonacci(0n), 0n);
assertEq("F(1) 엣지", matrixPowerFibonacci(1n), 1n);
assertEq("F(2) 엣지", matrixPowerFibonacci(2n), 1n);

console.log("=== naive 비용 체감(작은 n) ===");
console.log(`fibNaive(20) 반복 횟수 개념 확인: F(20)=${fibNaive(20n)}`);
