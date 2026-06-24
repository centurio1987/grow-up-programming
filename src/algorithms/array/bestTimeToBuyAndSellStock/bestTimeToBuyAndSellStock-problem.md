# Best Time to Buy and Sell Stock

## 한 줄 요약

> 날짜별 주식 가격 배열을 받아, 한 번의 매수·매도로 얻을 수 있는 **최대 이익**을 반환한다.

## 스토리

주식 트레이더 지수는 지난 $N$일의 종가 기록을 들여다보고 있다. 이미 지나간 데이터이니, 어느 날 사서 어느 날 팔았어야 이익이 가장 컸는지 사후 분석이 가능하다.

단, 규칙이 하나 있다. 반드시 산 날보다 팔 날이 같거나 나중이어야 한다. 즉 미래를 보고 과거 시점에 팔 수는 없다.

지수는 딱 한 번만 매수하고 한 번만 매도하려 한다. 이 조건 아래에서 가능한 가장 큰 이익을 구해야 한다. 어떻게 해도 이익을 낼 수 없다면 거래를 포기하고 $0$을 돌려준다.

## 함수 인터페이스

```ts
export function bestTimeToBuyAndSellStock(prices: number[]): number;
```

- `prices` — 날짜 순서로 정렬된 주식 종가 배열. `prices[i]`는 $i$번째 날의 가격이다.
- 반환 — 한 번의 매수·매도로 얻을 수 있는 최대 이익. 이익이 없으면 `0`.

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$은 `prices`의 길이)
- $0 \leq prices[i] \leq 10{,}000$ (각 날의 가격, 정수)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

매수일 $i$와 매도일 $j$는 $i \leq j$를 만족해야 한다. 이때 이익은

$$\text{profit}(i, j) = prices[j] - prices[i]$$

이고, 최대 이익은

$$\text{answer} = \max_{0 \leq i \leq j < N}\, (prices[j] - prices[i])$$

이다.

모든 $(i, j)$ 쌍에서 이익이 $0$ 이하라면 거래를 하지 않고 $0$을 반환한다. 같은 날 사고 파는 것($i = j$)은 허용되며 이익은 $0$이다.

## 예시

```ts
bestTimeToBuyAndSellStock([7, 1, 5, 3, 6, 4]); // 5  — 1에 사서 6에 파는 것이 최선
bestTimeToBuyAndSellStock([1, 2, 3, 4, 5]);    // 4  — 첫날 사서 마지막날 판다
bestTimeToBuyAndSellStock([2, 4, 1, 7]);       // 6  — 1에 사서 7에 판다

bestTimeToBuyAndSellStock([7, 6, 4, 3, 1]);    // 0  — 매일 하락하여 이익 없음, 거래하지 않음
bestTimeToBuyAndSellStock([5, 5, 5, 5]);       // 0  — 가격 변동 없음, 이익 없음

bestTimeToBuyAndSellStock([5]);                // 0  — 원소 하나뿐, 거래 불가
bestTimeToBuyAndSellStock([0, 10000]);         // 10000  — 가능한 최대 차이
```
