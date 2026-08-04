export function bestTimeToBuyAndSellStockK(
  k: number,
  prices: number[],
): number {
  if (prices.length < 2) {
    return 0;
  }

  let totalProfit = 0;
  let minPrice = prices[0]!;
  let maxProfit = 0;
  let minPIdx = 0;
  let maxProfitQIdx = 0;

  for (let j = 0; j < k; j++) {
    for (let i = 1; i < prices.length; i++) {
      if (prices[i]! < minPrice) {
        minPrice = prices[i]!;
        minPIdx = i;
      } else if (prices[i]! - minPrice > maxProfit) {
        maxProfit = prices[i]! - minPrice;
        maxProfitQIdx = i;
      }
    }
    prices = prices.splice(minPIdx, 1);
    prices = prices.splice(maxProfitQIdx, 1);
    totalProfit += maxProfit;
  }

  return totalProfit;
}
