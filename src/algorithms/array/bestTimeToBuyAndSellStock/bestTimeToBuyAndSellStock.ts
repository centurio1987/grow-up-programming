export function bestTimeToBuyAndSellStock(prices: number[]): number {
  if (prices.length < 2) {
    return 0;
  }

  let minP = prices[0]!;
  let maxPrice = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i]! < minP) {
      minP = prices[i]!;
    } else if (maxPrice < prices[i]! - minP) {
      maxPrice = prices[i]! - minP;
    }
  }

  return maxPrice;
}
