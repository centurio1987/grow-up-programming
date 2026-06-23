# 조합 수 (mod p)

## 한 줄 요약

> 함수는 정수 `n`, `k`와 소수 `p`를 받아 이항 계수 $\binom{n}{k}$를 $p$로 나눈 나머지를 반환한다.

## 스토리

경시 대회 분석팀이 대회 문제의 답을 검증하고 있다. 문제 답이 천문학적으로 커지는 경우가 많아 "답을 $10^9 + 7$로 나눈 나머지를 출력하라"는 형식을 쓴다. 그런데 $n$이 $10^5$처럼 큰 경우 $\binom{n}{k}$를 직접 계산하면 수천 자리 수가 나온다.

팀은 큰 $n$에서도 빠르게 $\binom{n}{k} \bmod p$를 구하는 도구가 필요하다. $n$이 소수 $p$보다 클 수도 있으므로 일반적인 팩토리얼 전처리만으로는 부족한 상황이다.

검증 도구가 오답을 내면 참가자 점수가 잘못 처리된다. 정확성이 최우선이다.

## 함수 인터페이스

```ts
export function binomialModP(n: bigint, k: bigint, p: bigint): bigint;
```

- `n` — 전체 원소 수, $n \geq 0$인 bigint
- `k` — 선택할 원소 수, $k \geq 0$인 bigint
- `p` — 소수 모듈러, $p \geq 2$인 bigint
- 반환 — $\binom{n}{k} \bmod p$, 범위 $[0,\ p)$

## 제약 조건

- $n \geq 0$, $k \geq 0$ (bigint)
- $p \geq 2$는 소수 (bigint)
- $k < 0$ 또는 $k > n$이면 결과는 $0$
- $k = 0$ 또는 $k = n$이면 결과는 $1$
- $n$이 $p$보다 클 수 있음
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

소수 $p$에 대해 이항 계수

$$\binom{n}{k} = \frac{n!}{k!\,(n-k)!}$$

의 값을 $\bmod p$로 계산한다.

- $k > n$이면 $0$을 반환한다.
- $n < p$일 때는 팩토리얼과 모듈러 역원을 이용해 직접 계산한다.
- $n \geq p$일 때도 올바른 결과를 반환해야 한다.

## 예시

```ts
binomialModP(5n, 2n, 7n);         // 3n  — C(5,2) = 10, 10 mod 7 = 3
binomialModP(10n, 3n, 13n);       // 3n  — C(10,3) = 120, 120 mod 13 = 3
binomialModP(5n, 0n, 7n);         // 1n  — C(n,0) = 1 항등
binomialModP(5n, 6n, 7n);         // 0n  — k > n이므로 0
binomialModP(6n, 3n, 7n);         // 6n  — C(6,3) = 20, 20 mod 7 = 6
binomialModP(100n, 50n, 1000000007n); // C(100,50) mod 10^9+7
```
