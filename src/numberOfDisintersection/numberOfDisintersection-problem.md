# Number of Disc Intersections

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function solution(A: number[]): number;
```

## 제약 조건

- $0 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- 각 원소는 $0 \leq A[J] \leq 2{,}147{,}483{,}647$ 인 정수

## 문제 상세

$N$ 개의 원판이 평면 위에 그려진다. $J$ 번 원판의 중심은 $(J,\, 0)$ 이고 반지름은 $A[J]$ 이다.
두 원판 $J$, $K$ ($J \neq K$) 가 **교차** 한다는 것은 두 원판이 적어도 한 점을 공유함을 의미한다 (경계 포함):

$$\text{intersect}(J, K) \iff |J - K| \leq A[J] + A[K]$$

교차하는 (순서 없는) 원판 쌍의 수를 반환한다.
교차 쌍의 수가 $10{,}000{,}000$ 을 초과하면 $-1$ 을 반환한다.

## 예시

```ts
solution([1, 5, 2, 1, 4, 0]); // 11
//
// 원판 0: 중심 (0,0), 반지름 1 -> 구간 [-1, 1]
// 원판 1: 중심 (1,0), 반지름 5 -> 구간 [-4, 6]
// 원판 2: 중심 (2,0), 반지름 2 -> 구간 [0, 4]
// 원판 3: 중심 (3,0), 반지름 1 -> 구간 [2, 4]
// 원판 4: 중심 (4,0), 반지름 4 -> 구간 [0, 8]
// 원판 5: 중심 (5,0), 반지름 0 -> 구간 [5, 5]
//
// 원판 1과 4는 다른 모든 원판과 교차하고, 원판 2는 원판 0, 3과도 추가로 교차한다.

solution([]);  // 0
solution([0]); // 0
```

## 원문 (참고)

> We draw N discs on a plane. The discs are numbered from 0 to N − 1. An array A of N non-negative integers, specifying the radiuses of the discs, is given. The J-th disc is drawn with its center at (J, 0) and radius A[J].
>
> We say that the J-th disc and K-th disc intersect if J ≠ K and the J-th and K-th discs have at least one common point (assuming that the discs contain their borders).
>
> Write a function that, given an array A describing N discs as explained above, returns the number of (unordered) pairs of intersecting discs. The function should return −1 if the number of intersecting pairs exceeds 10,000,000.
>
> Write an efficient algorithm for the following assumptions:
> - N is an integer within the range [0..100,000];
> - each element of array A is an integer within the range [0..2,147,483,647].
