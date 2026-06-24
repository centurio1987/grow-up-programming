# Search in Rotated Sorted Array

## 한 줄 요약

> 알 수 없는 지점에서 회전된 오름차순 배열과 목표값을 받아, 목표값의 인덱스 또는 -1을 반환한다.

## 스토리

탐험가 소희는 원형 트랙에 일정 간격으로 표지판이 세워진 구간을 조사한다. 표지판은 원래 1번부터 순서대로 오름차순으로 번호가 매겨져 있었지만, 어느 시점에 트랙의 임의 지점이 시작점으로 재설정되었다. 예컨대 `[4, 5, 6, 7, 0, 1, 2]`처럼 중간에서 끊어진 채 이어진 형태다.

소희는 특정 번호의 표지판이 어디 있는지 찾아야 한다. 전체를 처음부터 끝까지 훑으면 확실하지만 너무 오래 걸린다. 반으로 나눠서 "왼쪽 절반이 오름차순인지, 오른쪽 절반이 오름차순인지"를 먼저 파악하면, 타깃이 어느 쪽에 있는지 판단해 범위를 좁힐 수 있다.

## 함수 인터페이스

```ts
export function searchInRotatedSortedArray(A: number[], target: number): number;
```

- `A` — 서로 다른 정수로 구성된, 어떤 인덱스에서 회전된 오름차순 정렬 배열
- `target` — 찾고자 하는 정수
- 반환 — `A[i] === target`인 인덱스 `i`. 존재하지 않으면 `-1`.

## 제약 조건

- $1 \leq N \leq 10^{6}$ ($N$은 배열 길이)
- $A$의 모든 원소는 서로 다르다.
- 회전 지점 $k$는 $0 \leq k < N$를 만족하는 임의의 값이다 ($k=0$이면 회전 없음).
- $-10^{4} \leq A[i],\ \text{target} \leq 10^{4}$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

서로 다른 정수로 이루어진 오름차순 배열이 알 수 없는 인덱스 $k$에서 회전되어 주어진다. 회전이란 배열의 앞부분 $k$개를 잘라 뒤에 이어 붙이는 것을 의미한다. 예를 들어 $[0,1,2,4,5,6,7]$이 $k=4$에서 회전되면 $[4,5,6,7,0,1,2]$가 된다.

회전된 배열 $A$와 목표값 $\text{target}$이 주어질 때, $A[i] = \text{target}$인 인덱스 $i$를 반환한다. 없으면 $-1$을 반환한다.

$$\text{searchInRotatedSortedArray}(A, \text{target}) = \begin{cases}
  i & \text{if } \exists\, i \in [0, N) \text{ s.t. } A[i] = \text{target} \\
  -1 & \text{otherwise}
\end{cases}$$

## 예시

```ts
searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 0);    // 4  — A[4] === 0 (회전 지점)
searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 4);    // 0  — A[0] === 4 (배열의 첫 번째)
searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 2);    // 6  — A[6] === 2 (배열의 마지막)
searchInRotatedSortedArray([4, 5, 6, 7, 0, 1, 2], 3);    // -1 — 배열에 없는 값
searchInRotatedSortedArray([1], 1);                      // 0  — 원소가 하나이고 일치
searchInRotatedSortedArray([3, 1], 1);                   // 1  — A[1] === 1
searchInRotatedSortedArray([1, 2, 3, 4, 5], 3);          // 2  — 회전 없는 정렬 배열
```
