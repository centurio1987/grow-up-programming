/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/bit-manipulation/matrixPowerFibonacci/matrixPowerFibonacci.ts` 는
 * 학습자가 채우는 자리라 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서
 * 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 누적
 * 행렬의 시작값을 세우는 줄 하나를 바꾼다. 맞는 줄이 정확히 하나가 아니면 던지므로,
 * 그 대입식을 주석에 다시 적지 않는다.
 */

/** 2×2 정수 행렬. 칸은 `[[좌상, 우상], [좌하, 우하]]` 차례다. */
export type Mat = [[bigint, bigint], [bigint, bigint]];

/** 단위행렬. 어느 행렬에 곱해도 그 행렬이 그대로 나온다. */
export const IDENTITY: Mat = [
  [1n, 0n],
  [0n, 1n],
];

/** 한 걸음 전이 행렬. 상태 `(F(k), F(k-1))` 을 `(F(k+1), F(k))` 로 옮긴다. */
export const TRANSITION: Mat = [
  [1n, 1n],
  [1n, 0n],
];

/**
 * 2×2 행렬 두 개를 곱한다. 곱셈 여덟 번과 덧셈 네 번이고, 어떤 값이 들어와도 같다.
 *
 * 행렬 곱은 일반적으로 교환법칙을 지키지 않는다. 이 절차가 쓰는 것은 결합법칙 하나다.
 */
export function multiply(A: Mat, B: Mat): Mat {
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

/**
 * `n` 번째 피보나치 수를 돌려준다. `F(0) = 0`, `F(1) = 1`, `F(n) = F(n-1) + F(n-2)` 다.
 *
 * `n` 은 0 이상이라고 본다. 전이 행렬의 `n` 제곱을 이진 거듭제곱으로 구하고 그 행렬의
 * 오른쪽 위 칸을 돌려준다. `n = 0` 이면 바퀴가 한 번도 실행되지 않아 단위행렬의 오른쪽
 * 위 칸인 0 이 그대로 답이 된다.
 */
export function matrixPowerFibonacci(n: bigint): bigint {
  // ① 누적 행렬을 단위행렬로, 자리 행렬을 전이 행렬로, 남은 지수를 n 으로 둔다.
  let acc: Mat = IDENTITY;
  let step: Mat = TRANSITION;
  let e = n;

  while (e > 0n) {
    // ② 아직 처리할 비트가 남았는가 — 남아 있으면 아래 세 줄을 한 번 실행한다.
    if ((e & 1n) === 1n) {
      // ③ 이번 비트가 1 이면 그 자리의 걸음 수만큼을 누적 행렬에 곱한다.
      acc = multiply(acc, step);
    }
    // ④ 자리 행렬을 제곱해 걸음 수가 두 배인 행렬로 만든다.
    step = multiply(step, step);
    // ⑤ 남은 지수를 오른쪽으로 한 칸 옮겨 다음 비트를 최하위로 보낸다.
    e >>= 1n;
  }

  // ⑥ 누적 행렬이 M^n 이고, 그 오른쪽 위 칸이 F(n) 이다.
  return acc[0][1];
}
