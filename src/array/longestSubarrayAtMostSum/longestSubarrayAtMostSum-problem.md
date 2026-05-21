# Longest Subarray with Sum at Most S

## 함수 인터페이스

```ts
export function longestSubarrayAtMostSum(nums: number[], S: number): number;
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `nums` 의 길이)
- $0 \leq nums[i] \leq 10^4$ (비음의 정수)
- $0 \leq S \leq 10^9$ (비음의 정수)

## 문제 상세

비음의 정수 배열 $nums$ 와 비음의 정수 $S$ 가 주어진다. **합이 $S$ 이하인 연속 부분 배열** 의 최대 길이를 반환한다.

인덱스 구간 $[l, r]$ 에 대해

$$\text{sum}(l, r) = \sum_{k=l}^{r} nums[k]$$

라 하면, 답은

$$\max\{\, r - l + 1 \,\mid\, 0 \leq l \leq r < N,\; \text{sum}(l, r) \leq S \,\}$$

이다. 그러한 구간이 없으면 (즉, 모든 단일 원소가 이미 $S$ 를 초과하면) $0$ 을 반환한다.

## 예시

```ts
longestSubarrayAtMostSum([1, 2, 1, 0, 1, 1, 0], 4); // 5   ([2, 1, 0, 1] 또는 [1, 0, 1, 1, 0])
longestSubarrayAtMostSum([3, 1, 2, 1], 5);          // 3   ([1, 2, 1])
longestSubarrayAtMostSum([5, 6, 7], 4);             // 0   (모든 원소가 S 초과)
longestSubarrayAtMostSum([0, 0, 0], 0);             // 3
longestSubarrayAtMostSum([1, 1, 1, 1], 10);         // 4
```
