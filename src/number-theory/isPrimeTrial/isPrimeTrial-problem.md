# 소수 판정 (시행 나눗셈)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function isPrimeTrial(n: number): boolean;
```

## 제약 조건

- $n$ 은 정수
- $n \leq 10^{12}$ 범위에서 권장
- 시간 복잡도 $O(\sqrt{n})$

## 문제 상세

정수 $n$ 이 소수인지 판별해 `true` / `false` 를 반환한다.

알고리즘으로는 **시행 나눗셈 (Trial Division)** 을 사용한다.

정의에 따라 $n < 2$ 인 경우는 소수가 아니다.

## 예시

```ts
isPrimeTrial(0);          // false
isPrimeTrial(1);          // false
isPrimeTrial(2);          // true
isPrimeTrial(3);          // true
isPrimeTrial(9);          // false
isPrimeTrial(17);         // true
isPrimeTrial(25);         // false
isPrimeTrial(1_000_003);  // true
```
