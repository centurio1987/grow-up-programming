# 빠른 거듭제곱 (Fast Exponentiation)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function fastPower(base: bigint, exp: bigint, mod: bigint): bigint;
```

## 제약 조건

- `exp` $\geq 0$ (bigint)
- `mod` $\geq 1$ (bigint)
- `base` 는 bigint (임의의 정수)
- 시간 복잡도 $O(\log \text{exp})$

## 문제 상세

다음 값을 효율적으로 계산해 반환한다.

$$\text{base}^{\text{exp}} \bmod m$$

결과는 항상 $[0,\ m)$ 범위로 정규화되어야 한다.

엣지 케이스:

- $\text{exp} = 0$ 인 경우 결과는 $1 \bmod m$
- $m = 1$ 이면 모든 결과는 $0$

## 예시

```ts
fastPower(2n, 10n, 1000n);             // 24n   (1024 mod 1000)
fastPower(3n, 200n, 50n);              // 1n
fastPower(0n, 0n, 7n);                 // 1n
fastPower(5n, 117n, 19n);              // ...
fastPower(2n, 1000000000n, 1000000007n);
```
