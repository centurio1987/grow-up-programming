# 이산 로그 (Baby-step Giant-step)

## 함수 인터페이스

```ts
export function babyStepGiantStep(a: bigint, b: bigint, m: bigint): bigint;
```

## 제약 조건

- $m \geq 2$ (bigint)
- $a$, $b$ 는 bigint
- 시간/공간 복잡도 $O(\sqrt{m})$ 으로 동작해야 한다

## 문제 상세

모듈러 $m$ 위에서 다음을 만족하는 가장 작은 음이 아닌 정수 $x$ 를 구한다.

$$a^x \equiv b \pmod{m}$$

해가 존재하지 않으면 $-1$ 을 반환한다.

알고리즘으로는 **Baby-step Giant-step (BSGS)** 을 사용한다.

## 예시

```ts
babyStepGiantStep(2n, 1n, 5n);   // 0n   (2^0 = 1 ≡ 1 (mod 5))
babyStepGiantStep(2n, 3n, 5n);   // 3n   (2^3 = 8 ≡ 3 (mod 5))
babyStepGiantStep(2n, 0n, 6n);   // -1n  (해 없음)
```
