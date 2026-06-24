# 이산 로그 (Baby-step Giant-step)

## 한 줄 요약

> 함수는 밑 `a`, 목표값 `b`, 모듈러 `m`을 받아 $a^x \equiv b \pmod{m}$을 만족하는 가장 작은 음이 아닌 정수 $x$를 반환한다.

## 스토리

암호 통신 시스템에서 앨리스와 밥은 공개된 채널로 비밀 키를 교환한다. 앨리스는 밥에게 "나는 공개된 숫자 `a`를 어떤 비밀 횟수만큼 거듭제곱해서 `b`를 만들었어"라고 알려준다. 밥은 그 비밀 횟수 `x`를 알아내야 한다.

문제는 모듈러 연산 때문에 단순 나눗셈으로는 역추적이 불가능하다는 것이다. 누군가 중간에서 통신을 엿듣더라도 `a`, `b`, `m`만으로는 `x`를 쉽게 구할 수 없다.

보안 감사팀은 취약한 파라미터 조합을 탐지하기 위해 이 문제를 빠르게 풀 수 있는 내부 도구가 필요하다. 해가 없는 경우에는 $-1$을 반환해 "공격 불가"로 표시해야 한다.

## 함수 인터페이스

```ts
export function babyStepGiantStep(a: bigint, b: bigint, m: bigint): bigint;
```

- `a` — 밑 (base), bigint
- `b` — 목표값, bigint
- `m` — 모듈러, $m \geq 2$인 bigint
- 반환 — $a^x \equiv b \pmod{m}$을 만족하는 최솟값 $x \geq 0$; 해가 없으면 $-1n$

## 제약 조건

- $m \geq 2$ (bigint)
- $a$, $b$는 임의의 bigint
- $0 \leq x < m$ 범위에서 탐색
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

모듈러 $m$ 위에서 다음을 만족하는 가장 작은 음이 아닌 정수 $x$를 구한다.

$$a^x \equiv b \pmod{m}$$

- 해가 존재하지 않으면 $-1n$을 반환한다.
- 복수의 해가 있으면 가장 작은 $x \geq 0$을 반환한다.
- `a`, `b`가 `m`보다 크거나 음수일 수 있으며, 연산 전 $\bmod m$으로 정규화한다.

## 예시

```ts
babyStepGiantStep(2n, 1n, 5n);   // 0n  — 2^0 = 1 ≡ 1 (mod 5)
babyStepGiantStep(2n, 3n, 5n);   // 3n  — 2^3 = 8 ≡ 3 (mod 5)
babyStepGiantStep(3n, 13n, 17n); // 4n  — 3^4 = 81 ≡ 13 (mod 17)
babyStepGiantStep(2n, 3n, 4n);   // -1n — 2의 거듭제곱은 mod 4에서 {1,2,0}만 순환, 3 없음
babyStepGiantStep(7n, 1n, 13n);  // 0n  — 7^0 = 1 ≡ 1 (mod 13)
```
