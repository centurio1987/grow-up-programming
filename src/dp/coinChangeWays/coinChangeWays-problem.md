# 동전으로 금액 만드는 경우의 수 (Coin Change · Ways)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function coinChangeWays(coins: number[], amount: number): number;
```

## 제약 조건

- $1 \leq n \leq 100$ (여기서 $n$ 은 `coins` 의 길이)
- $0 \leq amount \leq 10^4$
- $1 \leq c_i \leq 10^4$ (각 동전의 액면가)

## 문제 상세

액면가 $coins = [c_1, c_2, \ldots, c_n]$ 의 동전이 각각 무한히 있다.

정수 금액 $amount$ 를 만드는 서로 다른 **조합(combination)** 의 수를 구한다. (순서는 구분하지 않는다.)

## 예시

```ts
coinChangeWays([1, 2, 5], 5);   // 4   ([5], [2,2,1], [2,1,1,1], [1,1,1,1,1])
coinChangeWays([2], 3);         // 0   (3을 만들 수 없음)
coinChangeWays([1], 0);         // 1   (아무 동전도 사용하지 않는 한 가지 방법)
coinChangeWays([1, 2, 3], 4);   // 4   ([1,1,1,1], [1,1,2], [2,2], [1,3])
```
