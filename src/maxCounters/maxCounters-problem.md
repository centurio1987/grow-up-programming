# Max Counters

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function maxCounters(N: number, A: number[]): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$
- $1 \leq M \leq 100{,}000$ (여기서 $M$ 은 `A` 의 길이)
- `A` 의 각 원소는 $1 \leq A[K] \leq N + 1$ 인 정수

## 문제 상세

$N$ 개의 카운터 $C = [c_1, c_2, \ldots, c_N]$ 가 모두 $0$ 으로 초기화된다.
길이 $M$ 인 연산 배열 $A$ 가 주어지며, 각 원소는 다음 두 연산 중 하나를 나타낸다:

$$\text{op}(K) = \begin{cases}
  c_{A[K]} \leftarrow c_{A[K]} + 1 & \text{if } 1 \leq A[K] \leq N \\
  c_i \leftarrow \max(C) \quad \forall i & \text{if } A[K] = N + 1
\end{cases}$$

모든 연산을 순서대로 수행한 뒤 최종 카운터 배열 (길이 $N$) 을 반환한다.

## 예시

```ts
maxCounters(5, [3, 4, 4, 6, 1, 4, 4]); // [3, 2, 2, 4, 2]

// 진행 과정:
// 시작:         (0, 0, 0, 0, 0)
// A[0]=3 -> +1: (0, 0, 1, 0, 0)
// A[1]=4 -> +1: (0, 0, 1, 1, 0)
// A[2]=4 -> +1: (0, 0, 1, 2, 0)
// A[3]=6 -> max: (2, 2, 2, 2, 2)
// A[4]=1 -> +1: (3, 2, 2, 2, 2)
// A[5]=4 -> +1: (3, 2, 2, 3, 2)
// A[6]=4 -> +1: (3, 2, 2, 4, 2)
```

## 원문 (참고)

> You are given N counters, initially set to 0, and you have two possible operations on them:
>
> - increase(X) − counter X is increased by 1,
> - max counter − all counters are set to the maximum value of any counter.
>
> A non-empty array A of M integers is given. This array represents consecutive operations:
>
> - if A[K] = X, such that 1 ≤ X ≤ N, then operation K is increase(X),
> - if A[K] = N + 1 then operation K is max counter.
>
> The goal is to calculate the value of every counter after all operations.
>
> Write a function that, given an integer N and a non-empty array A consisting of M integers, returns a sequence of integers representing the values of the counters.
>
> Write an efficient algorithm for the following assumptions:
> - N and M are integers within the range [1..100,000];
> - each element of array A is an integer within the range [1..N + 1].
