# 중국인의 나머지 정리 (Chinese Remainder Theorem)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function crt(
  remainders: bigint[],
  moduli: bigint[],
): { x: bigint; M: bigint } | null;
```

## 제약 조건

- `remainders` 와 `moduli` 의 길이는 같으며 $k \geq 1$
- 모든 $m_i \geq 1$ (bigint)
- 모듈러는 서로소가 아닐 수도 있다 (일반 CRT)
- 전체 $O(k \log M)$ 시간으로 동작해야 한다

## 문제 상세

다음과 같은 연립 합동식이 주어진다.

$$\begin{cases}
  x \equiv r_1 \pmod{m_1} \\
  x \equiv r_2 \pmod{m_2} \\
  \quad\vdots \\
  x \equiv r_k \pmod{m_k}
\end{cases}$$

- 모든 $m_i$ 가 서로 쌍쌍이 서로소이면 해는 항상 존재한다.
- 일반적으로 모듈러 쌍 $(m_i, m_j)$ 에 대해 $r_i \equiv r_j \pmod{\gcd(m_i, m_j)}$ 이어야 해가 존재한다.

출력:

- 해가 존재하면 $\{\, x,\ M\, \}$ ($0 \leq x < M$, $M = \mathrm{lcm}(m_1, \ldots, m_k)$)
- 모순되어 해가 존재하지 않으면 `null`

## 예시

```ts
crt([2n, 3n, 2n], [3n, 5n, 7n]);   // { x: 23n, M: 105n }
// x ≡ 2 (mod 3), x ≡ 3 (mod 5), x ≡ 2 (mod 7)

crt([1n, 2n], [4n, 6n]);           // null
// x ≡ 1 (mod 4), x ≡ 2 (mod 6) — gcd(4,6) = 2, 1 ≢ 2 (mod 2)

crt([0n, 3n], [4n, 6n]);           // { x: 9n, M: 12n }
```
