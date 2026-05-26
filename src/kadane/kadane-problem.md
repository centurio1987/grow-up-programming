# Maximum Subarray Sum

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function maxSubarraySum(nums: number[]): number;
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `nums` 의 길이)
- `nums` 의 원소는 정수 (음수 포함)

## 문제 상세

정수 배열 `nums` 가 주어질 때, **연속된 부분 배열** 의 합 중 최댓값을 반환한다.

부분 배열을 $\text{nums}[i..j]$ ($0 \leq i \leq j < N$) 로 정의하면:

$$\text{maxSubarraySum}(\text{nums}) = \max_{0 \leq i \leq j < N} \sum_{k=i}^{j} \text{nums}[k]$$

## 예시

```ts
maxSubarraySum([-2, 1, -3, 4, -1, 2, 1, -5, 4]); // 6   (부분 배열 [4, -1, 2, 1])
maxSubarraySum([1]);                              // 1
maxSubarraySum([5, 4, -1, 7, 8]);                 // 23  (전체 배열)
maxSubarraySum([-3, -2, -5, -1]);                 // -1  (단일 원소 [-1])
```
