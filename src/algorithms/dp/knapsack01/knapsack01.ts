export function knapsack01(
  weights: number[],
  values: number[],
  W: number,
): number {
  return knapsack01_dp2(weights, values, W);
}

function knapsack01_dp2(weights: number[], values: number[], W: number) {
  const dp = Array.from({ length: values.length + 1 }, (_v, k) =>
    Array.from({ length: W + 1 }, () => 0),
  );

  for (let i = 1; i <= values.length; i++) {
    for (let remainedW = 0; remainedW < W + 1; remainedW++) {
      if (remainedW >= weights[i - 1]!) {
        const value = values[i - 1]!;
        const weight = weights[i - 1]!;
        dp[i]![remainedW] = Math.max(
          dp[i - 1]![remainedW]!,
          dp[i - 1]![remainedW - weight]! + value,
        );
      } else {
        dp[i]![remainedW] = dp[i - 1]![remainedW]!;
      }
    }
  }

  return dp[values.length]![W]!;
}
