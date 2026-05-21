# Best Time to Buy and Sell Stock (최대 k회 거래)

## 함수 인터페이스

```ts
export function bestTimeToBuyAndSellStockK(k: number, prices: number[]): number;
```

## 제약 조건

- $1 \leq N \leq 1{,}000$ (여기서 $N$ 은 `prices` 의 길이)
- $0 \leq k \leq 100$ (최대 거래 횟수)
- $0 \leq prices[i] \leq 10^4$ (각 날의 주식 가격, 정수)

## 문제 상세

$i$ 번째 날의 주식 가격이 $prices[i]$ 로 주어지고, 최대 거래 횟수 $k$ 가 주어진다. 최대 $k$ 번의 매수·매도 짝을 통해 얻을 수 있는 **최대 이익** 을 반환한다.

규칙:

- 동시에 한 개의 주식만 보유 가능하다 (현재 보유 중이라면 새로 매수할 수 없다).
- 매도 후 같은 날 다시 매수해도 된다.
- 거래를 한 번도 하지 않을 수 있으며, 이때 이익은 $0$ 이다.

$t$ 번째 매수/매도 시점을 추적하는 DP 점화식은

$$buy[t][i] = \max(buy[t][i-1],\; sell[t-1][i-1] - prices[i])$$
$$sell[t][i] = \max(sell[t][i-1],\; buy[t][i-1] + prices[i])$$

이고, 최종 결과는

$$\text{maxProfitK}(k, prices) = \max_{0 \leq t \leq k}\, sell[t][N-1]$$

이다.

## 예시

```ts
bestTimeToBuyAndSellStockK(2, [3, 2, 6, 5, 0, 3]); // 7   ([2→6] + [0→3])
bestTimeToBuyAndSellStockK(2, [2, 4, 1]);          // 2   ([2→4])
bestTimeToBuyAndSellStockK(0, [1, 5, 3, 8]);       // 0   (거래 금지)
bestTimeToBuyAndSellStockK(3, [5, 4, 3, 2, 1]);    // 0   (계속 하락)
```
