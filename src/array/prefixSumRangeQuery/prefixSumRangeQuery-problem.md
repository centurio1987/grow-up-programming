# 구간 합 질의 (정적 배열, Prefix Sum)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★★ 상 — 필수 |
| 난이도 | 초급 |

## 함수 인터페이스

```ts
export function prefixSumRangeQuery(
  A: number[],
  queries: Array<[number, number]>,
): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$ 은 `A` 의 길이)
- $1 \leq Q \leq 100{,}000$ (여기서 $Q$ 는 `queries` 의 길이)
- $-10^4 \leq A[i] \leq 10^4$ (정수)
- 각 질의 $(l, r)$ 는 $0 \leq l \leq r \leq N - 1$

## 문제 상세

정수 배열 $A$ 와 여러 개의 질의 $(l, r)$ 가 주어진다 (`A` 는 갱신되지 않는 정적 배열).

각 질의에 대해

$$\text{sum}(l, r) = \sum_{k=l}^{r} A[k]$$

을 계산하고, 모든 질의의 결과를 입력 순서대로 담은 배열을 반환한다.

## 예시

```ts
prefixSumRangeQuery(
  [1, 2, 3, 4, 5],
  [
    [0, 4],  // 1+2+3+4+5 = 15
    [1, 3],  // 2+3+4    = 9
    [2, 2],  // 3
    [0, 0],  // 1
  ],
);
// [15, 9, 3, 1]

prefixSumRangeQuery(
  [-1, 2, -3, 4],
  [
    [0, 3],  // 2
    [1, 2],  // -1
  ],
);
// [2, -1]
```
