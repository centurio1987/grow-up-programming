# 최댓값·최솟값 동시 찾기 (Min-Max Pair)

## 함수 인터페이스

```ts
export function minMaxPair(arr: number[]): { min: number; max: number };
```

## 제약 조건

- $1 \leq n \leq 10^5$ (여기서 $n$ 은 `arr` 의 길이)
- `arr` 의 원소는 정수

## 문제 상세

길이 $n$ 인 정수 배열 $A$ 에 대해 최솟값과 최댓값을 함께 구해 객체 `{ min, max }` 형태로 반환하라.

$$\text{minMaxPair}(A) = \left( \min_{0 \leq i < n} A[i],\; \max_{0 \leq i < n} A[i] \right)$$

## 예시

| `arr` | 반환값 |
| --- | --- |
| `[3]` | `{ min: 3, max: 3 }` |
| `[1, 2]` | `{ min: 1, max: 2 }` |
| `[5, 3, 8, 1, 9, 2]` | `{ min: 1, max: 9 }` |
| `[-4, -1, -7, -3]` | `{ min: -7, max: -1 }` |
