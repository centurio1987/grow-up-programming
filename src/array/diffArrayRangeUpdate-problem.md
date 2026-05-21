# 구간 갱신 + 점 질의 (Difference Array Range Update)

## 함수 인터페이스

```ts
export function diffArrayRangeUpdate(
  N: number,
  updates: Array<[number, number, number]>,
): number[];
```

## 제약 조건

- $1 \leq N \leq 100{,}000$ (배열의 길이)
- $1 \leq Q \leq 100{,}000$ (여기서 $Q$ 는 `updates` 의 길이, 즉 갱신 횟수)
- 각 갱신 $(l, r, v)$ 는 $0 \leq l \leq r \leq N - 1$, $-10^4 \leq v \leq 10^4$ (정수)

## 문제 상세

길이 $N$ 의 정수 배열 $A$ 가 모든 원소 $0$ 으로 초기화된 상태에서, 일련의 구간 갱신 연산이 주어진다. 각 갱신 $(l, r, v)$ 는 다음을 의미한다.

$$\forall\, i \in [l, r],\; A[i] \mathrel{+}= v$$

모든 갱신을 적용한 뒤의 배열 $A$ 를 반환한다.

## 예시

```ts
diffArrayRangeUpdate(5, [[0, 2, 3]]);
// [3, 3, 3, 0, 0]

diffArrayRangeUpdate(5, [
  [0, 2, 3],
  [1, 4, 2],
  [2, 2, -10],
]);
// [3, 5, -5, 2, 2]

diffArrayRangeUpdate(3, []);
// [0, 0, 0]
```
