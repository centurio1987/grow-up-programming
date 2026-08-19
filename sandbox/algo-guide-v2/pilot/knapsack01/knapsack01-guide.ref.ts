/**
 * `code.final` 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/knapsack01/knapsack01.ts` 와 **같은 절차**다 — 물건을 한 개씩
 * 늘려 가며 용량별 최선을 표로 채운다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * 원본이 `Math.max` 로 쓴 자리를 **삼항으로 풀었다.** 절차는 같고, 갈림길이 코드에
 * 드러나야 `trace` 가 그것을 값으로 밟을 수 있기 때문이다(L17 (c) · P4).
 */

/** 용량 `W` 이하로 담아 얻을 수 있는 최대 가치 합. */
export function knapsack01(
  weights: number[],
  values: number[],
  W: number,
): number {
  const n = values.length;

  // dp[i][c] = 앞의 i 개만 놓고 골랐을 때, 용량 c 로 얻는 최대 가치.
  // 0 번째 줄은 "물건이 하나도 없다" 라 전부 0 이다.
  const dp = Array.from({ length: n + 1 }, () =>
    Array.from({ length: W + 1 }, () => 0),
  );

  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1] as number;
    const v = values[i - 1] as number;
    const prev = dp[i - 1] as number[]; // 윗 줄 — 이 물건을 아직 안 본 세계
    const cur = dp[i] as number[]; // 이번 줄 — 이 물건까지 본 세계

    for (let c = 0; c <= W; c++) {
      if (c < w) {
        // ① 못 담는다 — 남은 용량이 이 물건의 무게보다 작다. 윗 줄을 그대로 물려받는다.
        cur[c] = prev[c] as number;
      } else {
        const skip = prev[c] as number; // 이 물건을 두고 간다
        const take = (prev[c - w] as number) + v; // 담고, 무게만큼 용량을 뺀 자리에서 이어받는다
        // ② 두고 가는 쪽이 크거나 같다 · ③ 담는 쪽이 크다
        cur[c] = skip >= take ? skip : take;
      }
    }
  }

  return (dp[n] as number[])[W] as number;
}
