# 빠른 거듭제곱 (Fast Exponentiation)

## 한 줄 요약

> 함수는 밑 `base`, 지수 `exp`, 모듈러 `mod`를 받아 $\text{base}^{\text{exp}} \bmod \text{mod}$를 반환한다.

## 스토리

보안 팀이 RSA 암호화 시스템을 구현하고 있다. 암호화 과정에서 수백 자리 수를 수만 번 거듭제곱해야 한다. $2^{1{,}000{,}000{,}000}$처럼 지수가 10억 단위인 계산을 반복해야 한다.

단순히 `base`를 `exp`번 곱하면 수십 년이 걸린다. 수십 밀리초 안에 결과를 내야 하는 실시간 통신에는 쓸 수 없다.

결과는 모듈러 연산으로 항상 일정 범위 내로 유지되어야 하며, 결과가 $[0, \text{mod})$ 범위를 벗어나면 안 된다.

## 함수 인터페이스

```ts
export function fastPower(base: bigint, exp: bigint, mod: bigint): bigint;
```

- `base` — 밑, 임의의 bigint
- `exp` — 지수, $\text{exp} \geq 0$인 bigint
- `mod` — 모듈러, $\text{mod} \geq 1$인 bigint
- 반환 — $\text{base}^{\text{exp}} \bmod \text{mod}$, 범위 $[0,\ \text{mod})$

## 제약 조건

- $\text{exp} \geq 0$ (bigint)
- $\text{mod} \geq 1$ (bigint)
- `base`는 임의의 정수 (음수 포함)
- 결과는 항상 $[0,\ \text{mod})$ 범위로 정규화
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

다음 값을 계산해 반환한다.

$$\text{base}^{\text{exp}} \bmod \text{mod}$$

경계 동작:

- $\text{exp} = 0$이면 결과는 $1 \bmod \text{mod}$
- $\text{mod} = 1$이면 결과는 항상 $0$
- `base`가 `mod`보다 클 때도 먼저 $\bmod \text{mod}$로 정규화한 뒤 계산한다

## 예시

```ts
fastPower(2n, 10n, 1000n);              // 24n  — 2^10 = 1024, 1024 mod 1000 = 24
fastPower(3n, 5n, 100n);               // 43n  — 3^5 = 243, 243 mod 100 = 43
fastPower(123n, 0n, 1000n);            // 1n   — 지수 0이면 1 mod 1000 = 1
fastPower(5n, 100n, 1n);               // 0n   — mod 1이면 항상 0
fastPower(1005n, 2n, 1000n);           // 25n  — 1005 mod 1000 = 5, 5^2 = 25
fastPower(2n, 1000000000n, 1000000007n); // 페르마 소정리 활용 가능 케이스
```
