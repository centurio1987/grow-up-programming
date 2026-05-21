# 소수 판정 (Miller-Rabin, 결정적 버전)

## 함수 인터페이스

```ts
export function millerRabin(n: bigint): boolean;
```

## 제약 조건

- $n$ 은 bigint, $n < 2^{64}$
- 64-bit 범위 내에서 **결정적 (deterministic)** 으로 판정해야 한다
- 시간 복잡도 $O(k \log^3 n)$ ($k$ 는 증인의 수)

## 문제 상세

정수 $n$ 이 소수인지 **Miller-Rabin 소수 판정 알고리즘** 의 결정적 버전으로 판별해 `true` / `false` 를 반환한다.

64-bit 범위에서 결정적이 되도록 충분한 증인(witness) 집합을 사용해야 한다. 예를 들어 다음 집합을 사용하면 $n < 2^{64}$ 에서 결정적이다.

$$\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$$

정의에 따라 $n < 2$ 인 경우는 소수가 아니다.

## 예시

```ts
millerRabin(2n);                       // true
millerRabin(3n);                       // true
millerRabin(4n);                       // false
millerRabin(1n);                       // false
millerRabin(561n);                     // false  (카마이클 수)
millerRabin(1_000_000_007n);           // true
millerRabin(1_000_000_008n);           // false
millerRabin(2305843009213693951n);     // true   (메르센 소수 2^61 - 1)
```
