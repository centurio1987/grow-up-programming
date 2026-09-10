/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/unboundedKnapsack/unboundedKnapsack.ts` 가 요구하는 것과
 * **같은 계약**이다 — 액면가 목록과 목표 금액을 받아, 그 금액을 정확히 만드는 최소 동전
 * 개수를 돌려주고 만들 수 없으면 `-1` 을 돌려준다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `coins` 의 액면가를 몇 개든 써서 `amount` 를 정확히 만드는 최소 동전 개수. 못 만들면 `-1`.
 *
 * 칸에 최소 개수를 적고 표를 왼쪽 위에서 오른쪽 아래로 채운다. `a - c` 를 **이번 줄에서**
 * 읽는 것이 같은 액면가를 몇 개든 쓰게 하는 자리다.
 */
export function unboundedKnapsack(coins: number[], amount: number): number {
  const n = coins.length;

  // dp[i][a] = 앞의 i 종류만 써서 금액 a 를 만드는 최소 동전 개수.
  //            만들 수 없는 칸은 Infinity 로 남는다.
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(Number.POSITIVE_INFINITY),
  );
  // ① 금액 0 은 동전 0 개로 만든다.
  (dp[0] as number[])[0] = 0;

  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const prev = dp[i - 1] as number[]; // 윗 줄 — 이 액면가를 아직 안 연 층
    const cur = dp[i] as number[]; // 이번 줄 — 이 액면가까지 연 층

    for (let a = 0; a <= amount; a++) {
      if (a < c) {
        // ② 이 액면가 하나가 이미 a 보다 크다 — 윗 줄을 그대로 옮긴다.
        cur[a] = prev[a] as number;
      } else {
        const skip = prev[a] as number; // 이 액면가를 한 개도 안 쓴다
        const take = (cur[a - c] as number) + 1; // 이번 줄에서 한 개 더 쓴다
        // ③ 안 쓰는 쪽이 작거나 같다 · ④ 한 개 더 쓰는 쪽이 작다
        cur[a] = skip <= take ? skip : take;
      }
    }
  }

  const best = (dp[n] as number[])[amount] as number;
  return Number.isFinite(best) ? best : -1;
}
