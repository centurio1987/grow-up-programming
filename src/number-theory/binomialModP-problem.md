# 조합 수 (mod p)

## 함수 인터페이스

```ts
export function binomialModP(n: bigint, k: bigint, p: bigint): bigint;
```

## 제약 조건

- $n \geq 0$ (bigint)
- $k \geq 0$ (bigint)
- $p \geq 2$ 는 소수 (bigint)
- 결과 범위: $0 \leq$ 결과 $< p$

## 문제 상세

소수 $p$ 에 대해 이항 계수

$$\binom{n}{k} = \frac{n!}{k!\,(n-k)!}$$

의 값을 $\bmod p$ 로 계산한다.

엣지 케이스:

- $k < 0$ 또는 $k > n$ 이면 $0$
- $k = 0$ 또는 $k = n$ 이면 $1$

$n$ 이 $p$ 보다 클 수도 있다는 점에 유의한다.

## 예시

```ts
binomialModP(5n, 2n, 7n);     // 3n    (C(5,2) = 10, 10 mod 7 = 3)
binomialModP(10n, 3n, 13n);   // 3n    (C(10,3) = 120, 120 mod 13 = 3)
binomialModP(5n, 0n, 7n);     // 1n
binomialModP(5n, 6n, 7n);     // 0n    (k > n)
binomialModP(1000n, 500n, 1000000007n);
```
