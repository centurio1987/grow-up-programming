# 연립 합동식 (Chinese Remainder Theorem)

## 한 줄 요약

> 함수는 나머지 배열 `remainders`와 모듈러 배열 `moduli`를 받아, 각 합동식을 동시에 만족하는 최솟값 $x$와 주기 $M$을 반환한다. 해가 없으면 `null`을 반환한다.

## 스토리

물류 창고에 여러 개의 화물 분류기가 있다. 첫 번째 분류기는 3개씩 처리하는데 현재 2번째 짐을 처리 중이고, 두 번째는 5개씩 처리하는데 3번째 짐, 세 번째는 7개씩 처리하는데 2번째 짐을 처리 중이다. 창고 관리자는 세 분류기가 마지막으로 동시에 첫 번째 짐을 처리한 게 언제인지 알고 싶다.

각 분류기의 위치 조건이 서로 모순 없이 양립할 때만 그 시점을 특정할 수 있다. 예를 들어 첫 번째가 "짝수 번째"이고 두 번째도 "짝수 번째"를 요구한다면 호환되지만, 한쪽이 홀수를 요구하면 해가 존재하지 않는다.

관리자는 가장 가까운 과거 시점(가장 작은 $x$)과 이 패턴이 반복되는 주기 $M$을 알고 싶다.

## 함수 인터페이스

```ts
export function crt(
  remainders: bigint[],
  moduli: bigint[],
): { x: bigint; M: bigint } | null;
```

- `remainders` — 각 합동식의 나머지 값 배열
- `moduli` — 각 합동식의 모듈러 값 배열, 길이는 `remainders`와 동일
- 반환 — 해가 존재하면 `{ x, M }` ($0 \leq x < M$, $M = \mathrm{lcm}(m_1, \ldots, m_k)$); 모순이면 `null`

## 제약 조건

- `remainders`와 `moduli`의 길이는 같으며 $k \geq 1$
- 모든 $m_i \geq 1$ (bigint)
- 모듈러들이 서로소가 아닐 수 있음 (일반 CRT)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

다음과 같은 연립 합동식이 주어진다.

$$\begin{cases}
  x \equiv r_1 \pmod{m_1} \\
  x \equiv r_2 \pmod{m_2} \\
  \quad\vdots \\
  x \equiv r_k \pmod{m_k}
\end{cases}$$

해가 존재할 조건: 모듈러 쌍 $(m_i, m_j)$에 대해 $r_i \equiv r_j \pmod{\gcd(m_i, m_j)}$이어야 한다.

- 해가 존재하면 $0 \leq x < M$인 최솟값 $x$와 $M = \mathrm{lcm}(m_1, \ldots, m_k)$를 반환한다.
- 어느 두 조건이 모순되면 `null`을 반환한다.

## 예시

```ts
crt([2n, 3n, 2n], [3n, 5n, 7n]);
// { x: 23n, M: 105n }  — x ≡ 2 (mod 3), x ≡ 3 (mod 5), x ≡ 2 (mod 7)

crt([1n, 2n], [4n, 6n]);
// null  — gcd(4,6) = 2이고 1 ≢ 2 (mod 2)이므로 모순

crt([0n, 3n], [4n, 6n]);
// null  — gcd(4,6) = 2이고 0 ≢ 3 (mod 2)이므로 모순

crt([5n], [7n]);
// { x: 5n, M: 7n }  — 단일 합동식

crt([1n, 2n], [2n, 3n]);
// { x: 5n, M: 6n }  — x ≡ 1 (mod 2), x ≡ 2 (mod 3)
```
