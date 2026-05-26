# 확장 유클리드 호제법 (Extended Euclidean Algorithm)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function extendedEuclidean(
  a: bigint,
  b: bigint,
): { g: bigint; x: bigint; y: bigint };
```

## 제약 조건

- $a$, $b$ 는 bigint (음수 가능, $0$ 가능)
- 시간 복잡도 $O(\log \min(|a|, |b|))$

## 문제 상세

두 정수 $a$, $b$ 에 대해 다음 **베주 항등식 (Bezout's identity)** 을 만족하는 $g$, $x$, $y$ 를 반환한다.

$$a \cdot x + b \cdot y = g = \gcd(a, b)$$

반환 객체는 `{ g, x, y }` 형태이며,

- $g = \gcd(a, b)$
- $a x + b y = g$

를 만족해야 한다.

## 예시

```ts
extendedEuclidean(30n, 18n);
// { g: 6n, x: ..., y: ... } 인데 30x + 18y = 6 을 만족 (예: x = -1n, y = 2n)

extendedEuclidean(7n, 5n);
// { g: 1n, x: ..., y: ... } 인데 7x + 5y = 1 을 만족 (예: x = -2n, y = 3n)

extendedEuclidean(0n, 5n);
// { g: 5n, x: 0n, y: 1n }
```
