/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/coinChangeWays/coinChangeWays.ts` 가 요구하는 것과 **같은 계약**
 * 이다 — 동전 액면가 목록과 목표 금액을 받아, 순서를 구분하지 않는 조합의 수를 돌려준다.
 * 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `coins` 의 동전을 몇 개든 써서 `amount` 를 만드는 서로 다른 조합의 수.
 *
 * 동전 종류를 바깥 루프로, 금액을 안쪽 루프로 둔다. 그래야 한 조합이 「액면가 순서대로 쓴
 * 것」 한 벌로만 세어진다.
 */
export function coinChangeWays(coins: number[], amount: number): number {
  const n = coins.length;

  // dp[i][a] = 앞의 i 종류만 써서 금액 a 를 만드는 조합의 수.
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(0),
  );
  // ① 금액 0 은 아무 동전도 쓰지 않는 조합 하나로 센다.
  (dp[0] as number[])[0] = 1;

  for (let i = 1; i <= n; i++) {
    const c = coins[i - 1] as number;
    const prev = dp[i - 1] as number[]; // 윗 줄 — 이 동전을 아직 안 연 층
    const cur = dp[i] as number[]; // 이번 줄 — 이 동전까지 연 층

    for (let a = 0; a <= amount; a++) {
      if (a < c) {
        // ② 이 동전은 한 개도 못 들어간다 — 윗 줄을 그대로 옮긴다.
        cur[a] = prev[a] as number;
      } else {
        // ③ 이 동전을 한 개도 안 쓴 조합 + 적어도 한 개 쓴 조합.
        cur[a] = (prev[a] as number) + (cur[a - c] as number);
      }
    }
  }

  return (dp[n] as number[])[amount] as number;
}
