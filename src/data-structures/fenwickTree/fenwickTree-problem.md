# Fenwick Tree

## 한 줄 요약

> `FenwickTree`는 배열 크기를 받아, 점 갱신과 접두사 합 질의를 지원하는 자료구조이다.

## 스토리

경기 운영 시스템에서 선수들의 점수는 수시로 바뀐다. 관중석 전광판에는 "1번부터 k번 선수까지의 점수 합계"가 실시간으로 표시되고, 심판은 특정 선수의 점수를 언제든 조정할 수 있다.

단순 배열로 구현하면 합계 계산이 O(n)이라 수만 명 선수가 있을 때 전광판이 버벅인다. 운영팀은 점수 조정과 합계 계산 모두 빠르게 처리하는 구조를 요청했다.

크기 $n$의 점수 배열을 관리하며, 특정 선수의 점수 변경과 1번부터 k번까지의 합계 계산을 지원하는 자료구조를 구현하라.

## 함수 인터페이스

```ts
export class FenwickTree {
  constructor(n: number): void;
  update(i: number, delta: number): void;
  prefixSum(i: number): number;
  rangeSum(l: number, r: number): number;
}
```

- `n` — 배열의 크기 ($1$-기반 인덱스 사용, 유효 범위 $[1, n]$)
- `update(i, delta)` — 인덱스 $i$의 값에 $\delta$를 더한다. 반환값 없음
- `prefixSum(i)` — 인덱스 $1$부터 $i$까지의 합을 반환한다. $i = 0$이면 $0$을 반환
- `rangeSum(l, r)` — 인덱스 $l$부터 $r$까지의 합을 반환한다

## 제약 조건

- $1 \leq n \leq 10^5$
- $1 \leq i \leq n$ (update, prefixSum 인덱스)
- $1 \leq l \leq r \leq n$ (rangeSum)
- `delta`는 정수이며 음수 가능
- 질의 수 $q \leq 10^5$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

초기에는 모든 위치의 값이 $0$이다.

**update(i, delta):** 위치 $i$의 값에 $\delta$를 누적한다. 음수 $\delta$로 값을 줄일 수 있다.

$$A[i] \leftarrow A[i] + \delta$$

**prefixSum(i):** $A[1] + A[2] + \cdots + A[i]$를 반환한다. $i = 0$이면 반드시 $0$을 반환한다.

**rangeSum(l, r):** $A[l] + A[l+1] + \cdots + A[r]$를 반환한다. 이는 $\text{prefixSum}(r) - \text{prefixSum}(l-1)$으로 계산한다.

## 예시

```ts
const ft = new FenwickTree(5);
// 초기 상태: A = [0, 0, 0, 0, 0] (1-기반)

ft.update(1, 3);         // A = [3, 0, 0, 0, 0]
ft.update(3, 5);         // A = [3, 0, 5, 0, 0]
ft.update(5, 2);         // A = [3, 0, 5, 0, 2]

ft.prefixSum(3);         // 8 — A[1]+A[2]+A[3] = 3+0+5
ft.prefixSum(0);         // 0 — 경계: i=0은 항상 0
ft.prefixSum(5);         // 10 — A[1]~A[5] = 3+0+5+0+2

ft.rangeSum(2, 4);       // 5 — A[2]+A[3]+A[4] = 0+5+0
ft.rangeSum(3, 3);       // 5 — 단일 원소 구간
ft.rangeSum(1, 5);       // 10 — 전체

ft.update(3, -3);        // A = [3, 0, 2, 0, 2]
ft.rangeSum(1, 5);       // 7 — 음수 delta 적용 후
```
