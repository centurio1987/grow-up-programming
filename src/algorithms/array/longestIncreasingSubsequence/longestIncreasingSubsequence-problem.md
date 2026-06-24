# Longest Increasing Subsequence

## 한 줄 요약

> 정수 배열을 받아, **엄격하게 증가하는 부분 수열 중 가장 긴 것의 길이**를 반환한다.

## 스토리

마라톤 코치 지호는 선수들의 완주 기록을 시간 순서대로 기록해왔다. 그는 기록이 꾸준히 개선된 최장 연속(비연속도 허용) 흐름을 찾고 싶다.

단, "개선"은 엄격해야 한다. 같은 기록이 반복된 것은 개선으로 보지 않는다. 원래 순서를 유지하되 일부 기록을 건너뛰어도 되며, 고른 기록들이 순서대로 엄격히 감소해야 한다(기록은 작을수록 빠르지만, 이 문제에서는 배열 값이 커질수록 증가하는 것으로 간주한다).

지호는 이 가장 긴 엄격 증가 부분 수열의 길이를 알고 싶다.

## 함수 인터페이스

```ts
export function longestIncreasingSubsequence(A: number[]): number;
```

- `A` — 정수 배열.
- 반환 — 엄격하게 증가하는 부분 수열 중 가장 긴 것의 길이.

## 제약 조건

- $1 \leq N \leq 100{,}000$ (여기서 $N$은 `A`의 길이)
- $-10^9 \leq A[i] \leq 10^9$ (정수)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

인덱스 수열 $i_0 < i_1 < \cdots < i_{L-1}$에 대해

$$A[i_0] < A[i_1] < \cdots < A[i_{L-1}]$$

를 만족하는 최대 $L$을 반환한다. 같은 값이 연속되더라도 엄격히 작아야 하므로 중복 값은 같은 부분 수열에 포함될 수 없다. 원소가 하나뿐이면 길이는 항상 $1$이다.

## 예시

```ts
longestIncreasingSubsequence([10, 9, 2, 5, 3, 7, 101, 18]); // 4  — 예: [2,3,7,18]
longestIncreasingSubsequence([0, 1, 0, 3, 2, 3]);           // 4  — 예: [0,1,2,3]
longestIncreasingSubsequence([1, 3, 6, 7, 9, 4, 10, 5, 6]); // 6  — 예: [1,3,6,7,9,10]

longestIncreasingSubsequence([7, 7, 7, 7]);                  // 1  — 모두 같은 값, 엄격 증가 불가
longestIncreasingSubsequence([5, 4, 3, 2, 1]);              // 1  — 엄격 감소, 단일 원소만 선택 가능
longestIncreasingSubsequence([-3, -2, -1, 0]);              // 4  — 음수 포함 엄격 증가

longestIncreasingSubsequence([42]);                         // 1  — 단일 원소
```
