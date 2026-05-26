# 무한 배낭 — 동전 교환 최소 개수 (Coin Change · Min Coins)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function unboundedKnapsack(coins: number[], amount: number): number;
```

## 제약 조건

- $1 \leq n \leq 100$ (여기서 $n$ 은 `coins` 의 길이)
- $0 \leq amount \leq 10^4$
- $1 \leq c_i \leq 10^4$ (각 동전의 액면가)

## 문제 상세

액면가 $coins = [c_1, c_2, \ldots, c_n]$ 의 동전이 각각 **무한히** 있다.

정수 금액 $amount$ 를 만들기 위해 필요한 **동전의 최소 개수**를 구해 반환하라. 만들 수 없으면 $-1$ 을 반환한다.

$amount = 0$ 인 경우 $0$ 을 반환한다.

## 예시

```ts
unboundedKnapsack([1, 2, 5], 11);   // 3    (5 + 5 + 1)
unboundedKnapsack([2], 3);          // -1   (3을 만들 수 없음)
unboundedKnapsack([1], 0);          // 0
unboundedKnapsack([1, 3, 4], 6);    // 2    (3 + 3)
unboundedKnapsack([2, 5, 10, 1], 27); // 4  (10 + 10 + 5 + 2)
```
