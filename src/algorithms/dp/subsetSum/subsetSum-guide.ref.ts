/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/subsetSum/subsetSum.ts` 가 요구하는 것과 **같은 계약**이다 —
 * 비음의 정수 배열과 목표 합을 받아, 합이 정확히 목표와 같은 부분집합이 있는지 돌려준다.
 * 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `nums` 의 원소를 0 번 또는 1 번씩 골라 합이 정확히 `target` 이 되게 할 수 있는가.
 *
 * 칸에 참/거짓만 적고 표를 왼쪽 위에서 오른쪽 아래로 채운다. `t - a` 를 **윗 줄에서** 읽는
 * 것이 각 원소를 최대 한 번만 쓰게 하는 자리다.
 */
export function subsetSum(nums: number[], target: number): boolean {
  const n = nums.length;

  // dp[i][t] = 앞의 i 개 원소만 써서 합 t 를 정확히 만들 수 있는가.
  const dp = Array.from({ length: n + 1 }, () =>
    new Array<boolean>(target + 1).fill(false),
  );
  // ① 아무것도 고르지 않은 부분집합의 합은 0 이다.
  (dp[0] as boolean[])[0] = true;

  for (let i = 1; i <= n; i++) {
    const a = nums[i - 1] as number;
    const prev = dp[i - 1] as boolean[]; // 윗 줄 — 이 원소를 아직 안 본 층
    const cur = dp[i] as boolean[]; // 이번 줄 — 이 원소까지 본 층

    for (let t = 0; t <= target; t++) {
      if (t < a) {
        // ② 이 원소 하나가 이미 t 보다 크다 — 윗 줄을 그대로 옮긴다.
        cur[t] = prev[t] as boolean;
      } else {
        // ③ 이 원소를 안 고른 경우이거나, 고르고 t - a 를 앞의 원소로 만든 경우.
        cur[t] = (prev[t] as boolean) || (prev[t - a] as boolean);
      }
    }
  }

  return (dp[n] as boolean[])[target] as boolean;
}
