# Best Time to Buy and Sell Stock (1회 거래)

## 함수 인터페이스

```ts
export function bestTimeToBuyAndSellStock(prices: number[]): number;
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `prices` 의 길이)
- $0 \leq prices[i] \leq 10^4$ (각 날의 주식 가격, 정수)

## 문제 상세

$i$ 번째 날의 주식 가격이 $prices[i]$ 로 주어진다. 한 번 사고 한 번 팔아서 얻을 수 있는 **최대 이익** 을 반환한다.

단, 사기 전에 팔 수 없으며 (매수일 $i$ 와 매도일 $j$ 는 $i \leq j$ 를 만족해야 한다), 거래하지 않는 경우 이익은 $0$ 이다.

매수일 $i$ 와 매도일 $j$ 에 대한 이익은

$$\text{profit}(i, j) = prices[j] - prices[i]$$

이며, 최대 이익은

$$\text{maxProfit}(prices) = \max_{0 \leq i \leq j < N}\, prices[j] - prices[i]$$

이다. 모든 $(i, j)$ 쌍에서 이익이 음수라면 거래하지 않고 $0$ 을 반환한다.

## 예시

```ts
bestTimeToBuyAndSellStock([7, 1, 5, 3, 6, 4]); // 5   (1에 사서 6에 팔기)
bestTimeToBuyAndSellStock([7, 6, 4, 3, 1]);    // 0   (계속 하락, 거래하지 않음)
bestTimeToBuyAndSellStock([1, 2]);             // 1
bestTimeToBuyAndSellStock([5]);                // 0
```
