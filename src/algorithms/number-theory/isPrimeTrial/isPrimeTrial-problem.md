# 소수 판정 (시행 나눗셈)

## 한 줄 요약

> 함수는 정수 `n`을 받아 소수이면 `true`, 아니면 `false`를 반환한다.

## 스토리

보안 감사 도구가 사용자가 입력한 숫자가 소수인지 빠르게 확인해야 한다. RSA 키 생성 과정에서 입력된 후보 숫자가 소수인지 검증하지 않으면 암호화 강도를 보장할 수 없다.

소수는 1과 자기 자신 외에 약수가 없는 2 이상의 자연수다. 0이나 1, 음수는 소수가 아니다. 9처럼 제곱수도 합성수이므로 소수가 아니다.

감사 도구는 $10^9$ 수준의 큰 수까지 1초 안에 판정해야 한다. 잘못된 판정이 나오면 취약한 키를 사용하게 되므로 정확성이 핵심이다.

## 함수 인터페이스

```ts
export function isPrimeTrial(n: number): boolean;
```

- `n` — 판정할 정수
- 반환 — 소수이면 `true`, 그 외 `false`

## 제약 조건

- $n$은 임의의 정수 (음수·0·1 포함)
- $n < 2$이면 소수가 아님
- 입력 권장 범위: $n \leq 10^{12}$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

정수 $n$이 소수인지 판별해 `true` / `false`를 반환한다.

소수 정의: $n \geq 2$이고, $1$과 $n$ 외의 약수가 없는 수.

경계 동작:

- $n < 2$이면 `false`
- $n = 2$이면 `true` (유일한 짝수 소수)
- $n$이 짝수이고 $n > 2$이면 `false`

## 예시

```ts
isPrimeTrial(2);           // true  — 가장 작은 소수
isPrimeTrial(3);           // true  — 소수
isPrimeTrial(4);           // false — 2의 배수
isPrimeTrial(9);           // false — 3 × 3, 제곱수
isPrimeTrial(17);          // true  — 소수
isPrimeTrial(25);          // false — 5 × 5
isPrimeTrial(1);           // false — 소수 정의에 따라 1 미만
isPrimeTrial(-7);          // false — 음수는 소수 아님
isPrimeTrial(1_000_003);   // true  — 큰 소수
```
