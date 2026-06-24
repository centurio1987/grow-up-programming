# 행렬 거듭제곱을 이용한 피보나치 (Matrix Power Fibonacci)

## 한 줄 요약

> 0 이상의 정수 n을 받아, n번째 피보나치 수를 bigint로 반환한다.

## 스토리

생물학자 서연은 세균 군집의 성장 패턴을 분석한다. 이 세균은 피보나치 수열과 동일한 번식 법칙을 따르며, 1세대에 1마리, 2세대에 1마리, 이후 각 세대는 앞선 두 세대의 합만큼 늘어난다.

연구 대상 세대 번호가 최대 $10^{18}$에 달하는 경우, 세대를 하나씩 계산하면 우주 나이보다 오래 걸린다. 서연에게는 훨씬 빠르게 임의 세대의 개체 수를 계산하는 방법이 필요하다.

## 함수 인터페이스

```ts
export function matrixPowerFibonacci(n: bigint): bigint;
```

- `n` — 0 이상의 정수, 피보나치 수열의 인덱스
- 반환 — $n$번째 피보나치 수 $F_n$ (bigint)

## 제약 조건

- $0 \leq n \leq 10^{18}$
- 반환값은 `bigint` 타입이어야 한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

피보나치 수열은 다음과 같이 정의된다:

$$F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}\ (n \geq 2)$$

주어진 인덱스 $n$에 대해 $n$번째 피보나치 수 $F_n$을 `bigint`로 반환한다.

$n$이 최대 $10^{18}$까지 커질 수 있으므로, 단순 반복으로는 시간 안에 계산할 수 없다. 반드시 $O(\log n)$ 수준의 시간 복잡도로 해결해야 한다.

## 예시

```ts
matrixPowerFibonacci(0n);   // 0n  — 정의에 의해 F(0) = 0
matrixPowerFibonacci(1n);   // 1n  — 정의에 의해 F(1) = 1
matrixPowerFibonacci(2n);   // 1n  — F(1) + F(0) = 1
matrixPowerFibonacci(3n);   // 2n  — F(2) + F(1) = 2
matrixPowerFibonacci(10n);  // 55n — F(10)
matrixPowerFibonacci(50n);  // 12586269025n — F(50)
matrixPowerFibonacci(100n); // 354224848179261915075n — F(100), 21자리 수
```
