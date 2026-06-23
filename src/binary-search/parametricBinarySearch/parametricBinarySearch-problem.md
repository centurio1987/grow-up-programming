# Parametric Binary Search — Split Array Largest Sum

## 한 줄 요약

> 정수 배열과 분할 수를 받아, K개의 연속 부분 배열로 나눌 때 부분 배열 합의 최댓값이 최소가 되는 값을 반환한다.

## 스토리

물류회사 팀장 준석은 배송 기사 K명에게 일감을 분배해야 한다. 일감은 도로 위에 순서대로 나열되어 있고, 각 기사는 연속한 구간만 담당할 수 있다. 기사들을 공평하게 배분하려면 가장 힘든 기사의 업무량이 최대한 적어야 한다.

준석은 "가장 바쁜 기사의 업무량 상한을 X라고 가정하면 K명 이하로 배분이 가능한가?"라는 질문을 반복해서 던진다. X를 크게 잡으면 분명히 가능하고, 너무 작게 잡으면 불가능하다. 가능 여부를 기준 삼아 X 범위를 좁혀 나가면, 결국 정확한 최솟값을 찾을 수 있다.

## 함수 인터페이스

```ts
export function parametricBinarySearch(A: number[], K: number): number;
```

- `A` — 음이 아닌 정수 배열
- `K` — 분할 수 (비어 있지 않은 연속 부분 배열의 개수)
- 반환 — K개 연속 부분 배열로 분할할 때 가능한 부분 배열 합의 최댓값 중 최솟값

## 제약 조건

- $1 \leq N \leq 10^{5}$ ($N$은 배열 길이)
- $1 \leq K \leq N$
- $0 \leq A[i] \leq 10^{6}$
- 각 부분 배열은 비어 있으면 안 된다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

음이 아닌 정수 배열 $A$와 정수 $K$가 주어진다. $A$를 $K$개의 비어있지 않은 연속 부분 배열로 분할할 때, 각 부분 배열 합의 최댓값을 최소화하는 값을 반환한다.

가능한 모든 $K$-분할 $\pi = (S_1, S_2, \ldots, S_K)$에 대해:

$$\text{parametricBinarySearch}(A, K) = \min_{\pi} \max_{1 \leq j \leq K} \sum_{i \in S_j} A[i]$$

## 예시

```ts
parametricBinarySearch([7, 2, 5, 10, 8], 2);     // 18 — 최적 분할: [7,2,5]|[10,8], max(14,18)=18
parametricBinarySearch([1, 2, 3, 4, 5], 2);      // 9  — 최적 분할: [1,2,3]|[4,5], max(6,9)=9
parametricBinarySearch([1, 4, 4], 3);            // 4  — 각 원소가 한 묶음, max(1,4,4)=4
parametricBinarySearch([1, 2, 3, 4, 5], 1);      // 15 — K=1이면 전체 합
parametricBinarySearch([1, 2, 3, 4, 5], 5);      // 5  — K=N이면 각 원소가 한 묶음, 최댓값=5
parametricBinarySearch([7], 1);                  // 7  — 원소가 하나
```
