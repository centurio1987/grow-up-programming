# Longest Subarray with Sum at Most S

## 한 줄 요약

> 비음의 정수 배열과 상한 $S$를 받아, **합이 $S$ 이하인 연속 부분 배열 중 가장 긴 것의 길이**를 반환한다.

## 스토리

영양사 소연은 하루 칼로리 예산 $S$ 킬로칼로리 안에서 연속된 음식 메뉴를 최대한 많이 골라야 한다. 메뉴 목록은 순서가 고정되어 있고, 건너뛸 수 없다.

소연은 어느 위치에서 시작해 어느 위치에서 멈출지를 정해, 그 구간의 메뉴를 모두 고를 때 칼로리 합이 $S$를 넘지 않으면서 가장 많은 메뉴를 포함하려 한다.

이 조건을 만족하는 최대 메뉴 수를 구하는 함수를 작성해야 한다.

## 함수 인터페이스

```ts
export function longestSubarrayAtMostSum(nums: number[], S: number): number;
```

- `nums` — 비음의 정수 배열. `nums[i]`는 $i$번째 메뉴의 칼로리.
- `S` — 합의 상한 (비음의 정수).
- 반환 — 합이 $S$ 이하인 연속 부분 배열의 최대 길이. 그러한 부분 배열이 없으면 `0`.

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$은 `nums`의 길이)
- $0 \leq nums[i] \leq 10{,}000$ (비음의 정수)
- $0 \leq S \leq 10^9$ (비음의 정수)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

인덱스 구간 $[l, r]$ ($0 \leq l \leq r < N$)의 합을

$$\text{sum}(l, r) = \sum_{k=l}^{r} nums[k]$$

로 정의하면, 답은

$$\max\{\, r - l + 1 \mid 0 \leq l \leq r < N,\; \text{sum}(l, r) \leq S \,\}$$

이다.

모든 단일 원소가 $S$를 초과하면 합 조건을 만족하는 부분 배열이 없으므로 $0$을 반환한다. `nums`의 모든 원소가 $0$이면 전체 길이가 답이 된다.

## 예시

```ts
longestSubarrayAtMostSum([1, 2, 1, 0, 1, 1, 0], 4); // 5  — 인덱스 [1,5] 합=1+0+1+1+0=3
longestSubarrayAtMostSum([1, 1, 1, 1, 1], 3);       // 3  — 어느 연속 세 원소든 합=3
longestSubarrayAtMostSum([1, 2, 3], 10);            // 3  — 전체 합 6 ≤ 10

longestSubarrayAtMostSum([5, 6, 7], 4);             // 0  — 단일 원소도 S 초과
longestSubarrayAtMostSum([1, 2, 3], 0);             // 0  — S=0이고 모든 원소 양수

longestSubarrayAtMostSum([0, 0, 0, 0], 0);          // 4  — 모든 원소 0, 전체 길이
longestSubarrayAtMostSum([5], 10);                  // 1  — 단일 원소, 조건 충족
longestSubarrayAtMostSum([5], 1);                   // 0  — 단일 원소, 조건 초과
```
