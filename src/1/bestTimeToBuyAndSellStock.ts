/**
 * 주식 매매 최대 이익 (1회 거래)
 *
 * $i$번째 날의 주식 가격이 $prices[i]$로 주어진다.
 * 한 번 사고 한 번 팔아서 얻을 수 있는 최대 이익을 반환한다.
 * (단, 사기 전에 팔 수 없으며, 거래하지 않는 경우 이익은 $0$이다.)
 *
 * 알고리즘: 좌측 최솟값 추적 — 각 시점까지의 최저 매수가를 갱신한다.
 *
 * - $N$은 가격 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $prices[i]$는 정수 ($0 \leq prices[i] \leq 10^4$)
 */

/**
 * Best Time to Buy and Sell Stock (1회 거래)
 *
 * 매수일 $i$와 매도일 $j$ ($i \leq j$)에 대해:
 *
 * $$\text{profit}(i, j) = prices[j] - prices[i]$$
 *
 * 최대 이익:
 *
 * $$\text{maxProfit}(prices) = \max_{0 \leq i \leq j < N}\, prices[j] - prices[i]$$
 *
 * 좌측 최솟값 갱신:
 *
 * $$minLeft[j] = \min_{0 \leq i \leq j}\, prices[i]$$
 * $$\text{result} = \max_{0 \leq j < N}\, prices[j] - minLeft[j]$$
 *
 * 시간복잡도: $O(N)$
 *
 * @param prices - 가격 배열 ($1 \leq N \leq 100{,}000$)
 * @returns 최대 이익 ($\geq 0$)
 */
export function bestTimeToBuyAndSellStock(_prices: number[]): number {
  throw new Error("Not implemented");
}
