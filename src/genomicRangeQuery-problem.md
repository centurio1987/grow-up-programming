# Genomic Range Query

## 함수 인터페이스

```ts
export function solution(S: string, P: number[], Q: number[]): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 문자열 $S$ 의 길이)
- $1 \leq M \leq 50{,}000$ (여기서 $M$ 은 배열 $P$, $Q$ 의 길이)
- 각 $P[K]$, $Q[K]$ 는 정수이고 $0 \leq P[K] \leq Q[K] \leq N - 1$
- $S$ 는 대문자 영문자 `A`, `C`, `G`, `T` 로만 구성

## 문제 상세

DNA 문자열 $S$ 의 각 뉴클레오타이드는 다음 충격 지수(impact factor)를 가진다:

$$\text{impact}(c) = \begin{cases} 1 & c = \text{A} \\ 2 & c = \text{C} \\ 3 & c = \text{G} \\ 4 & c = \text{T} \end{cases}$$

$M$ 개의 쿼리 $(P[K],\, Q[K])$ 에 대해, 구간 $[P[K],\, Q[K]]$ 내 최소 충격 지수를 반환한다:

$$\text{answer}[K] = \min_{P[K] \leq i \leq Q[K]} \text{impact}(S[i])$$

## 예시

```ts
solution("CAGCCTA", [2, 5, 0], [4, 5, 6]); // [2, 4, 1]
// 구간 [2,4] = "GCC" -> min(3, 2, 2) = 2
// 구간 [5,5] = "T"   -> 4
// 구간 [0,6] = "CAGCCTA" -> min impact = 1 (A 포함)
```

## 원문 (참고)

> A DNA sequence can be represented as a string consisting of the letters A, C, G and T, which correspond to the types of successive nucleotides in the sequence. Each nucleotide has an impact factor, which is an integer. Nucleotides of types A, C, G and T have impact factors of 1, 2, 3 and 4, respectively. You are going to answer several queries of the form: What is the minimal impact factor of nucleotides contained in a particular part of the given DNA sequence?
>
> The DNA sequence is given as a non-empty string S = S[0]S[1]...S[N-1] consisting of N characters. There are M queries, which are given in non-empty arrays P and Q, each consisting of M integers. The K-th query (0 ≤ K < M) requires you to find the minimal impact factor of nucleotides contained in the DNA sequence between positions P[K] and Q[K] (inclusive).
>
> For example, consider string S = CAGCCTA and arrays P, Q such that:
>     P[0] = 2    Q[0] = 4
>     P[1] = 5    Q[1] = 5
>     P[2] = 0    Q[2] = 6
>
> The answers to these M = 3 queries are as follows:
>
>         The part of the DNA between positions 2 and 4 contains nucleotides G and C (twice), whose impact factors are 3 and 2 respectively, so the answer is 2.
>         The part between positions 5 and 5 contains a single nucleotide T, whose impact factor is 4, so the answer is 4.
>         The part between positions 0 and 6 (the whole string) contains all nucleotides, in particular nucleotide A whose impact factor is 1, so the answer is 1.
>
> Write a function that, given a non-empty string S consisting of N characters and two non-empty arrays P and Q consisting of M integers, returns an array consisting of M integers specifying the consecutive answers to all queries.
>
> Write an efficient algorithm for the following assumptions:
> - N is an integer within the range [1..100,000];
> - M is an integer within the range [1..50,000];
> - each element of arrays P and Q is an integer within the range [0..N - 1];
> - P[K] ≤ Q[K], where 0 ≤ K < M;
> - string S consists only of upper-case English letters A, C, G, T.
