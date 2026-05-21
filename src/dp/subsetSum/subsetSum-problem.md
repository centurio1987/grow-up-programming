# 부분집합 합 (Subset Sum)

## 함수 인터페이스

```ts
export function subsetSum(nums: number[], target: number): boolean;
```

## 제약 조건

- $1 \leq n \leq 1000$ (여기서 $n$ 은 `nums` 의 길이)
- $0 \leq target \leq 10^4$
- $0 \leq nums[i] \leq 10^4$

## 문제 상세

비음의 정수 배열 $nums$ 와 목표 합 $target$ 이 주어진다.

$nums$ 의 부분집합 중 **원소 합이 정확히 $target$ 인 것이 존재**하는지 판정하여 `true` / `false` 를 반환하라.

빈 부분집합의 합은 $0$ 이며, 모든 원소를 사용하지 않는 것도 부분집합으로 인정한다.

## 예시

| `nums` | `target` | 반환값 |
| --- | --- | --- |
| `[1, 2, 3]` | `5` | `true`  (2 + 3) |
| `[1, 2, 3]` | `7` | `false` |
| `[3, 34, 4, 12, 5, 2]` | `9` | `true`  (4 + 5) |
| `[1, 2, 3]` | `0` | `true`  (빈 부분집합) |
| `[5]` | `5` | `true` |
| `[5]` | `4` | `false` |
