# Binary Search

## 한 줄 요약

> 정렬된 정수 배열과 목표값을 받아, 목표값이 있는 인덱스 또는 -1을 반환한다.

## 스토리

도서관 사서 유나는 수십만 권의 책이 청구 번호 순서로 꽂힌 서가를 관리한다. 방문객이 "ISBN 7번 책이 어디 있나요?"라고 물으면, 유나는 서가 한쪽 끝부터 하나씩 뒤지지 않는다. 대신 서가 한가운데 책부터 확인한다.

중간 책의 번호가 찾는 번호보다 작으면 오른쪽 절반으로, 크면 왼쪽 절반으로 범위를 좁힌다. 이 과정을 반복하면 수십만 권 중에서도 단 수십 번의 비교만으로 책을 찾을 수 있다.

책이 아예 서가에 없다면, 범위가 빌 때까지 좁혀가다 "없음"을 답한다.

## 함수 인터페이스

```ts
export function binarySearch(A: number[], target: number): number;
```

- `A` — 오름차순으로 정렬된 정수 배열
- `target` — 찾고자 하는 정수
- 반환 — `A[i] === target`인 인덱스 `i`. 존재하지 않으면 `-1`.

## 제약 조건

- $0 \leq N \leq 10^{6}$ ($N$은 배열 길이)
- $A[i] \leq A[i+1]$ (오름차순 정렬 보장)
- $-2^{31} \leq A[i],\ \text{target} \leq 2^{31} - 1$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

정렬된 정수 배열 $A$와 목표값 $\text{target}$이 주어진다. $A[i] = \text{target}$인 인덱스 $i$를 반환한다. 해당 값이 배열에 존재하지 않으면 $-1$을 반환한다.

배열이 비어 있으면 항상 $-1$을 반환한다.

$$\text{binarySearch}(A, \text{target}) = \begin{cases}
  i & \text{if } \exists\, i \in [0, N) \text{ s.t. } A[i] = \text{target} \\
  -1 & \text{otherwise}
\end{cases}$$

## 예시

```ts
binarySearch([1, 3, 5, 7, 9], 5);   // 2 — A[2] === 5
binarySearch([1, 3, 5, 7, 9], 1);   // 0 — 맨 앞 원소
binarySearch([1, 3, 5, 7, 9], 9);   // 4 — 맨 뒤 원소
binarySearch([1, 3, 5, 7, 9], 4);   // -1 — 배열에 없는 값
binarySearch([], 1);                // -1 — 빈 배열
binarySearch([42], 42);             // 0 — 원소가 하나이고 일치
binarySearch([42], 7);              // -1 — 원소가 하나이고 불일치
```
