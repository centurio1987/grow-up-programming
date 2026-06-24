# 확장 유클리드 호제법 (Extended Euclidean Algorithm)

## 한 줄 요약

> 함수는 두 정수 `a`, `b`를 받아 $a \cdot x + b \cdot y = \gcd(a, b)$를 만족하는 정수 해 $(g, x, y)$를 반환한다.

## 스토리

두 공장이 각각 `a`개, `b`개 단위로만 부품을 생산한다. 조달 담당자는 정확히 `g`개의 부품을 맞추기 위해 첫 번째 공장에 `x`배치, 두 번째 공장에 `y`배치를 주문해야 한다. 여기서 `x`나 `y`가 음수이면 그 공장 물량을 되돌려 보내는 것을 의미한다.

이러한 조합이 가능한 가장 작은 단위 `g`가 바로 두 공장 생산량의 최대공약수다. 조달 담당자는 `g`, `x`, `y`를 동시에 구해야 한다.

이 계산은 암호 시스템에서 모듈러 역원을 구할 때도 핵심적으로 쓰인다. 예를 들어 $3^{-1} \pmod{11}$은 $3x + 11y = 1$의 정수해 $x$를 구하면 된다.

## 함수 인터페이스

```ts
export function extendedEuclidean(
  a: bigint,
  b: bigint,
): { g: bigint; x: bigint; y: bigint };
```

- `a` — 첫 번째 정수, 음수·0·양수 모두 가능한 bigint
- `b` — 두 번째 정수, 음수·0·양수 모두 가능한 bigint
- 반환 — `{ g, x, y }` 형태로 $a \cdot x + b \cdot y = g = \gcd(a, b)$를 만족

## 제약 조건

- `a`, `b`는 임의의 bigint (음수, 0 포함)
- $g = \gcd(|a|, |b|)$ (항상 음이 아닌 값)
- 반환된 $x$, $y$는 $a \cdot x + b \cdot y = g$를 정확히 만족해야 함
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

두 정수 $a$, $b$에 대해 다음 **베주 항등식**을 만족하는 $g$, $x$, $y$를 반환한다.

$$a \cdot x + b \cdot y = g = \gcd(a, b)$$

- $g$는 항상 음이 아닌 값이다 ($g \geq 0$).
- $a = b = 0$이면 $g = 0$이며 $x = 0$, $y = 0$을 반환한다.
- $b = 0$이면 $g = |a|$이며 $a \cdot x = g$를 만족하는 $x$를 반환한다.
- $a = 0$이면 $g = |b|$이며 $b \cdot y = g$를 만족하는 $y$를 반환한다.

## 예시

```ts
extendedEuclidean(30n, 18n);
// { g: 6n, x: -1n, y: 2n } (또는 동일 항등식을 만족하는 다른 해)
// 검증: 30 * (-1) + 18 * 2 = -30 + 36 = 6 ✓

extendedEuclidean(7n, 5n);
// { g: 1n, x: -2n, y: 3n } (또는 동일 항등식을 만족하는 다른 해)
// 검증: 7 * (-2) + 5 * 3 = -14 + 15 = 1 ✓

extendedEuclidean(0n, 9n);
// { g: 9n, x: 0n, y: 1n }
// 검증: 0 * 0 + 9 * 1 = 9 ✓

extendedEuclidean(0n, 0n);
// { g: 0n, x: 0n, y: 0n }

extendedEuclidean(17n, 5n);
// g=1n, a*x + b*y = 1 — 17과 5는 서로소
```
