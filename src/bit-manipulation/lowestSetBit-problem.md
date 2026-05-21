# 최하위 1비트 (Lowest Set Bit)

## 함수 인터페이스

```ts
export function lowestSetBit(x: number): number;
```

## 제약 조건

- $-2^{31} \leq x \leq 2^{31} - 1$ (32비트 정수)

## 문제 상세

32비트 정수 $x$ 가 주어질 때, $x$ 에서 가장 낮은 위치의 1비트만을 추출한 값을 반환한다.

즉, $x$ 의 이진 표현에서 가장 낮은 자리에 있는 1비트만 남기고, 그 외의 비트는 모두 0으로 만든 값을 반환한다. $x = 0$ 이면 0을 반환한다.

## 예시

- $\text{lowestSetBit}(12) = \text{lowestSetBit}(0\text{b}1100) = 4$
- $\text{lowestSetBit}(1) = 1$
- $\text{lowestSetBit}(0) = 0$
