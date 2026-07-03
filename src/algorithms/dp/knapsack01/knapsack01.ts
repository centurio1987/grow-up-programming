export function knapsack01(
  weights: number[],
  values: number[],
  W: number,
): number {
  return knapsack01_dp1_repeat(weights, values, W);
}

function knapsack01_dp2(weights: number[], values: number[], W: number) {
  const N = values.length + 1;
  const dp = Array.from({ length: N }, () =>
    Array.from({ length: W + 1 }, () => 0),
  );

  for (let i = 1; i < N; i++) {
    const value = values[i - 1]!;
    const weight = weights[i - 1]!;

    for (let j = 1; j <= W; j++) {
      if (weight <= j) {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i - 1]![j - weight]! + value);
      } else {
        dp[i]![j] = dp[i - 1]![j]!;
      }
    }
  }

  return dp[N - 1]![W]!;
}

function knapsack01_dp1(weights: number[], values: number[], W: number) {
  const N = values.length;
  const dp = Array.from({ length: W + 1 }, () => 0);

  for (let i = 0; i < N; i++) {
    const weight = weights[i]!;
    const value = values[i]!;

    for (let j = W; j >= weight; j--) {
      dp[j] = Math.max(dp[j]!, dp[j - weight]! + value);
    }
  }

  return dp[W]!;
}

function knapsack01_repeat(weights: number[], values: number[], W: number) {
  return recursive(values.length - 1, W, weights, values);
}

function recursive(
  i: number,
  W: number,
  weights: number[],
  values: number[],
): number {
  if (W === 0 || i < 0) return 0;

  const weight = weights[i]!;
  const value = values[i]!;

  const skip = recursive(i - 1, W, weights, values);
  const applied = recursive(i - 1, W - weight, weights, values) + value;

  return Math.max(skip, applied);
}

function knapsack01_dp2_repeat(weights: number[], values: number[], W: number) {
  const DP_I_LENGTH = values.length + 1;
  const DP_W_LENGTH = W + 1;
  const dp = Array.from({ length: DP_I_LENGTH }, () =>
    Array.from({ length: DP_W_LENGTH }, () => 0),
  );

  for (let i = 1; i < DP_I_LENGTH; i++) {
    const value = values[i - 1]!;
    const weight = weights[i - 1]!;

    for (let w = 0; w < DP_W_LENGTH; w++) {
      if (w >= weight) {
        dp[i]![w] = Math.max(dp[i - 1]![w]!, dp[i - 1]![w - weight]! + value);
      } else {
        dp[i]![w] = dp[i - 1]![w]!;
      }
    }
  }

  return dp[DP_I_LENGTH - 1]![DP_W_LENGTH - 1]!;
}

function knapsack01_dp1_repeat(weights: number[], values: number[], W: number) {
  const dp = Array.from({ length: W + 1 }, () => 0);

  for (let i = 0; i < values.length; i++) {
    const value = values[i]!;
    const weight = weights[i]!;

    for (let w = W; w >= 0; w--) {
      if (w >= weight) {
        dp[w] = Math.max(dp[w]!, dp[w - weight]! + value);
      }
    }
  }

  return dp[W]!;
}
