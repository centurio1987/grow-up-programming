# SegmentTree (세그먼트 트리)

## 한 줄 요약
> 배열의 구간에 대한 집계 연산(합·최솟값·최댓값 등)을 O(log n)에 질의하고 단일 원소를 O(log n)에 갱신하는 이진 트리 자료구조.

## 스토리

주식 거래 시스템을 운영하는 회사에서 실시간 가격 모니터링 기능을 구현해야 한다. 전국에 상장된 N개 종목의 가격이 매 초 업데이트되며, 트레이더들은 "인덱스 l번부터 r번 종목 중 최저가는 얼마인가?"와 같은 구간 질의를 수시로 보낸다.

단순 배열로 구현하면 업데이트는 O(1)이지만 구간 질의가 O(n)이 된다. 반대로 누적합 테이블을 쓰면 질의는 O(1)이지만 업데이트마다 O(n)을 재계산해야 한다. 두 연산이 모두 빈번한 상황에서는 세그먼트 트리가 해법이다.

세그먼트 트리는 각 노드가 특정 구간의 집계 값을 저장하는 완전 이진 트리이다. 루트는 전체 구간, 리프는 개별 원소를 나타낸다. 이 구조 덕분에 구간 질의와 단일 업데이트 모두 O(log n)에 수행할 수 있어, 빈번한 업데이트와 질의가 혼재하는 시나리오에서 최적이다.

## 함수 인터페이스

```ts
export class SegmentTree {
  // merge 함수 예: (a, b) => a + b (구간 합), Math.min (구간 최솟값)
  constructor(arr: number[], merge: (a: number, b: number) => number): void

  // [l, r] 구간(inclusive) 연산 결과, O(log n)
  query(l: number, r: number): number

  // 인덱스 i를 val로 갱신, O(log n)
  update(i: number, val: number): void

  // 원본 배열 크기 반환
  size(): number
}
```

## 제약 조건

- $1 \leq n \leq 10^5$
- $0 \leq l \leq r < n$
- merge 함수는 결합법칙(associativity)을 만족해야 한다
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 트리 구조

배열 크기 n에 대해 크기 4n의 내부 배열 `_tree`를 할당한다. 노드 번호를 1-indexed로 사용하며 다음 관계가 성립한다.

- 루트: 노드 1
- 노드 k의 왼쪽 자식: 2k
- 노드 k의 오른쪽 자식: 2k + 1
- 노드 k의 부모: ⌊k / 2⌋

### 빌드 (O(n))

리프부터 상향식으로 내부 배열을 채운다.

```
build(node, start, end):
  if start == end:
    tree[node] = arr[start]
  else:
    mid = (start + end) / 2
    build(2*node, start, mid)
    build(2*node+1, mid+1, end)
    tree[node] = merge(tree[2*node], tree[2*node+1])
```

### 구간 질의 (O(log n))

현재 구간 [start, end]와 질의 구간 [l, r]을 비교하며 재귀 탐색한다.

- 완전 포함(`l <= start && end <= r`): 현재 노드 값 반환
- 완전 배제: 단위원(identity element)을 반환 (합이면 0, 최솟값이면 +∞ 등)
- 부분 겹침: 좌·우 자식을 재귀 호출해 merge

### 단일 업데이트 (O(log n))

리프까지 내려가 값을 교체하고, 올라오면서 부모 노드를 재계산한다.

## 예시

```ts
// 주식 최저가 시스템
const prices = [100, 45, 78, 23, 56, 90, 31];
const st = new SegmentTree(prices, Math.min);

st.query(0, 6); // 23  — 전체 구간 최저가
st.query(0, 2); // 45  — [100, 45, 78] 중 최저가
st.query(4, 6); // 31  — [56, 90, 31] 중 최저가

st.update(3, 200); // 인덱스 3(23) → 200으로 상승
st.query(0, 6); // 31  — 이제 최저가는 31

// 구간 합
const arr = [1, 2, 3, 4, 5];
const sumTree = new SegmentTree(arr, (a, b) => a + b);
sumTree.query(1, 3); // 9  (2+3+4)
sumTree.update(2, 10);
sumTree.query(1, 3); // 16 (2+10+4)
```
