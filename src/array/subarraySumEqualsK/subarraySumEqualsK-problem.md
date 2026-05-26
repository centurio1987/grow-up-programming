# Subarray Sum Equals K

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function subarraySumEqualsK(nums: number[], k: number): number;
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `nums` 의 길이)
- $-10^4 \leq nums[i] \leq 10^4$ (정수, 음수 가능)
- $-10^9 \leq k \leq 10^9$ (정수)

## 문제 상세

정수 배열 $nums$ 와 정수 $k$ 가 주어진다. 합이 정확히 $k$ 가 되는 **연속 부분 배열의 개수** 를 반환한다.

같은 합을 가지는 서로 다른 인덱스 구간은 각각 다른 부분 배열로 센다. 즉, 인덱스 쌍 $(l, r)$ 로 표현된 구간 $[l, r]$ ($0 \leq l \leq r < N$) 중

$$\sum_{i=l}^{r} nums[i] = k$$

를 만족하는 쌍의 개수를 반환한다.

## 예시

```ts
subarraySumEqualsK([1, 1, 1], 2);          // 2   ([1,1](0..1), [1,1](1..2))
subarraySumEqualsK([1, 2, 3], 3);          // 2   ([1,2], [3])
subarraySumEqualsK([1, -1, 1, -1], 0);     // 4   ([1,-1], [-1,1], [1,-1], [1,-1,1,-1])
subarraySumEqualsK([3, 4, 7, 2, -3, 1, 4, 2], 7); // 4
subarraySumEqualsK([1], 0);                // 0
```
