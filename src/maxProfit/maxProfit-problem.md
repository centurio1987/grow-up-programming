# Max Profit

## 함수 인터페이스

```ts
export function maxProfit(A: number[]): number;
```

## 제약 조건

- $0 \leq N \leq 400{,}000$ (여기서 $N$ 은 `A` 의 길이)
- 각 원소는 $0 \leq A[i] \leq 200{,}000$ 인 정수

## 문제 상세

$N$ 개의 정수로 이루어진 배열 $A$ 가 주어진다. $A[i]$ 는 $i$ 번째 날의 주식 가격이다.
하루 $P$ 에 매수하고 하루 $Q$ 에 매도할 때 ($0 \leq P \leq Q < N$),
거래의 이익은 $A[Q] - A[P]$ 이다.

**한 번의 거래** 로 얻을 수 있는 최대 이익을 반환한다.
이익을 낼 수 없거나 배열이 비어 있다면 $0$ 을 반환한다.

$$\text{maxProfit}(A) = \max\left(0,\; \max_{0 \leq P \leq Q < N}\, \big(A[Q] - A[P]\big)\right)$$

## 예시

```ts
maxProfit([23171, 21011, 21123, 21366, 21013, 21367]); // 356  (day 1 매수, day 5 매도)
maxProfit([7, 1, 5, 3, 6, 4]);                          // 5    (day 1 매수, day 4 매도)
maxProfit([7, 6, 4, 3, 1]);                             // 0    (이익 없음)
maxProfit([]);                                          // 0
```

## 원문 (참고)

> An array A consisting of N integers is given. It contains daily prices of a stock share for a period of N consecutive days. If a single share was bought on day P and sold on day Q, where 0 ≤ P ≤ Q < N, then the profit of such transaction is equal to A[Q] − A[P], provided that A[Q] ≥ A[P]. Otherwise, the transaction brings loss of A[P] − A[Q].
>
> Write a function that, given an array A consisting of N integers containing daily prices of a stock share for a period of N consecutive days, returns the maximum possible profit from one transaction during this period. The function should return 0 if it was impossible to gain any profit.
>
> Write an efficient algorithm for the following assumptions:
> - N is an integer within the range [0..400,000];
> - each element of array A is an integer within the range [0..200,000].
