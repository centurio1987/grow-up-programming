# Missing Integer

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function missingInteger(A: number[]): number;
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- 각 원소는 $-1{,}000{,}000 \leq A[i] \leq 1{,}000{,}000$ 인 정수

## 문제 상세

$N$ 개의 정수로 이루어진 배열 $A$ 가 주어질 때,
$A$ 에 존재하지 않는 **가장 작은 양의 정수** ($> 0$) 를 반환한다.

양의 정수 집합 $S = \{ x \in A \mid x > 0 \}$ 에 대해:

$$\text{missingInteger}(A) = \min\left( \mathbb{Z}^{+} \setminus S \right)$$

즉, $1, 2, 3, \ldots$ 순으로 탐색하여 $S$ 에 없는 첫 번째 값을 반환한다.

## 예시

```ts
missingInteger([1, 3, 6, 4, 1, 2]); // 5
missingInteger([1, 2, 3]);          // 4
missingInteger([-1, -3]);           // 1
```

## 원문 (참고)

> This is a demo task.
>
> Write a function that, given an array A of N integers, returns the smallest positive integer (greater than 0) that does not occur in A.
>
> For example, given A = [1, 3, 6, 4, 1, 2], the function should return 5.
> Given A = [1, 2, 3], the function should return 4.
> Given A = [−1, −3], the function should return 1.
>
> Write an efficient algorithm for the following assumptions:
> - N is an integer within the range [1..100,000];
> - each element of array A is an integer within the range [−1,000,000..1,000,000].
