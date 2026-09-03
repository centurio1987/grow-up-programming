/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication.ts` 가
 * 요구하는 것과 **같은 계약**이다 — 행렬 체인의 차원 배열을 받아, 전체를 곱하는 데 필요한
 * 최소 스칼라 곱셈 횟수를 돌려준다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * 기호 이름은 본문과 맞춘다 — 구간의 두 끝이 `i`·`j`, 마지막으로 곱하는 자리가 `k`,
 * 구간 길이가 `L` 이다. 차원 배열만 이름이 다르다(본문 `p`, 코드 `dims`) — 문제가 정한
 * 인자 이름을 그대로 둔 것이다.
 */

/**
 * 행렬 `A_1 … A_n` 을 순서를 지키면서 곱할 때 필요한 최소 스칼라 곱셈 횟수.
 * 행렬 `A_i` 의 크기는 `dims[i-1] × dims[i]` 이고, 행렬이 한 개 이하면 0 이다.
 *
 * 구간을 **마지막으로 곱하는 자리** `k` 로 갈라 두 조각의 값을 읽는다. 그 두 조각이 더
 * 짧으므로 **길이가 짧은 구간부터** 채우면 읽는 칸이 반드시 이미 정해져 있다.
 */
export function matrixChainMultiplication(dims: number[]): number {
  const n = dims.length - 1;
  // ① 행렬이 한 개 이하다 — 곱셈이 일어나지 않는다.
  if (n <= 1) return 0;

  // dp[i][j] = 행렬 A_i … A_j 를 하나로 곱하는 데 드는 최소 스칼라 곱셈 횟수.
  // ② 길이 1 구간은 곱셈이 없다 — 대각선이 0 으로 남는다.
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let L = 2; L <= n; L++) {
    for (let i = 1; i + L - 1 <= n; i++) {
      const j = i + L - 1;
      let best = Number.POSITIVE_INFINITY;

      for (let k = i; k < j; k++) {
        const left = (dp[i] as number[])[k] as number; // A_i … A_k
        const right = (dp[k + 1] as number[])[j] as number; // A_(k+1) … A_j
        // 두 조각이 만나는 자리의 차원이 dims[k] 다.
        const join =
          (dims[i - 1] as number) * (dims[k] as number) * (dims[j] as number);
        const cost = left + right + join;
        // ③ 지금까지의 최소보다 작다 · ④ 작지 않다
        if (cost < best) best = cost;
      }

      (dp[i] as number[])[j] = best;
    }
  }

  return (dp[1] as number[])[n] as number;
}
