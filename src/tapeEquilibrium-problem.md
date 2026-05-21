# Tape Equilibrium

## 함수 인터페이스

```ts
export function tapeEquilibrium(A: number[]): number;
```

## 제약 조건

- $2 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- 각 원소는 $-1{,}000 \leq A[i] \leq 1{,}000$ 인 정수

## 문제 상세

$N$ 개의 정수로 이루어진 비어있지 않은 배열 $A$ 가 주어진다.
정수 $P$ ($1 \leq P \leq N-1$) 는 테이프를 두 개의 비어있지 않은 부분으로 나눈다:

- 왼쪽 부분: $A[0],\, A[1],\, \ldots,\, A[P-1]$
- 오른쪽 부분: $A[P],\, A[P+1],\, \ldots,\, A[N-1]$

분할 지점 $P$ 에서의 차이값은 두 부분 합의 절댓값 차이로 정의된다:

$$D(P) = \left| \sum_{i=0}^{P-1} A[i] \;-\; \sum_{i=P}^{N-1} A[i] \right|$$

가능한 모든 $P$ 에 대해 $D(P)$ 의 **최솟값** 을 반환한다:

$$\text{tapeEquilibrium}(A) = \min_{1 \leq P \leq N-1} D(P)$$

## 예시

```ts
tapeEquilibrium([3, 1, 2, 4, 3]); // 1
// P=1: |3 - 10| = 7
// P=2: |4 -  9| = 5
// P=3: |6 -  7| = 1   <- 최솟값
// P=4: |10 - 3| = 7

tapeEquilibrium([1, 2]);          // 1   (P=1: |1 - 2|)
tapeEquilibrium([-1000, 1000]);   // 2000
```

## 원문 (참고)

> A non-empty array A consisting of N integers is given. Array A represents numbers on a tape.
>
> Any integer P, such that 0 < P < N, splits this tape into two non-empty parts: A[0], A[1], ..., A[P − 1] and A[P], A[P + 1], ..., A[N − 1].
>
> The difference between the two parts is the value of: |(A[0] + A[1] + ... + A[P − 1]) − (A[P] + A[P + 1] + ... + A[N − 1])|
>
> In other words, it is the absolute difference between the sum of the first part and the sum of the second part.
>
> Write a function that, given a non-empty array A of N integers, returns the minimal difference that can be achieved.
>
> Write an efficient algorithm for the following assumptions:
> - N is an integer within the range [2..100,000];
> - each element of array A is an integer within the range [−1,000..1,000].
