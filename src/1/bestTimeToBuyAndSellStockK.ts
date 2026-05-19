/**
 * 주식 매매 최대 이익 (최대 k회 거래)
 *
 * $i$번째 날의 주식 가격이 $prices[i]$로 주어지고, 최대 거래 횟수 $k$가 주어진다.
 * 최대 $k$번의 매수·매도 짝을 통해 얻을 수 있는 최대 이익을 반환한다.
 * (동시에 한 개의 주식만 보유 가능. 매도 후 즉시 재매수 가능)
 *
 * 알고리즘: DP — 상태는 (거래 횟수, 보유 여부).
 *
 * - $N$은 가격 배열 길이 ($1 \leq N \leq 1{,}000$)
 * - $k$는 최대 거래 횟수 ($0 \leq k \leq 100$)
 * - $prices[i]$는 정수 ($0 \leq prices[i] \leq 10^4$)
 */

/**
 * Best Time to Buy and Sell Stock (최대 k회)
 *
 * 상태:
 * - $buy[t][i]$: $i$일에 $t$번째 매수를 마친 상태에서의 최대 이익
 * - $sell[t][i]$: $i$일에 $t$번째 매도를 마친 상태에서의 최대 이익
 *
 * 점화식:
 *
 * $$buy[t][i] = \max(buy[t][i-1],\; sell[t-1][i-1] - prices[i])$$
 * $$sell[t][i] = \max(sell[t][i-1],\; buy[t][i-1] + prices[i])$$
 *
 * 결과:
 *
 * $$\text{maxProfitK}(k, prices) = \max_{0 \leq t \leq k} sell[t][N-1]$$
 *
 * 시간복잡도: $O(Nk)$
 *
 * @param k - 최대 거래 횟수 ($0 \leq k \leq 100$)
 * @param prices - 가격 배열 ($1 \leq N \leq 1{,}000$)
 * @returns 최대 이익 ($\geq 0$)
 */
export function bestTimeToBuyAndSellStockK(_k: number, _prices: number[]): number {
  throw new Error("Not implemented");
}
