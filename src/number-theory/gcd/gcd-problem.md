# 최대공약수 (Greatest Common Divisor)

## 함수 인터페이스

```ts
export function gcd(a: bigint, b: bigint): bigint;
```

## 제약 조건

- $-2^{63} \leq a, b \leq 2^{63} - 1$ 범위의 bigint
- 시간 복잡도 $O(\log \min(|a|, |b|))$

## 문제 상세

두 정수 $a$, $b$ 의 **최대공약수** 를 반환한다.

- 두 인자 중 한쪽이 $0$ 이면 나머지의 절댓값이 결과가 된다.
- 결과는 항상 음이 아닌 값으로 정의한다.

$$\gcd(a, b) \geq 0$$

## 예시

```ts
gcd(12n, 18n);     // 6n
gcd(100n, 75n);    // 25n
gcd(17n, 5n);      // 1n
gcd(0n, 9n);       // 9n
gcd(9n, 0n);       // 9n
gcd(0n, 0n);       // 0n
gcd(-12n, 18n);    // 6n
gcd(-12n, -18n);   // 6n
```
