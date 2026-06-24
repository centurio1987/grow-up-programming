# PersistentSegmentTree (영속 세그먼트 트리)

## 한 줄 요약
> 각 업데이트마다 변경된 경로의 노드만 새로 생성하여 과거 버전을 O(log n) 공간으로 보존하는 세그먼트 트리.

## 스토리

버전 관리 시스템을 상상해보세요. Git처럼 수천 개의 파일에 대한 커밋 이력이 있고, 각 커밋에서 특정 파일들의 크기 합계를 질의해야 합니다. "3번 커밋 기준으로 파일 [0..10]의 총 크기는?" 같은 쿼리가 초당 수천 번 들어옵니다.

일반 세그먼트 트리는 업데이트할 때마다 현재 상태를 덮어씁니다. 과거 버전을 보려면 매번 전체 트리를 복사해야 하는데, 이는 O(n) 공간과 시간이 필요합니다.

영속 세그먼트 트리는 이 문제를 해결합니다. 업데이트 시 변경이 필요한 노드(루트부터 변경 위치까지의 경로, O(log n)개)만 새로 만들고, 나머지는 이전 버전의 노드를 그대로 공유합니다. 이렇게 하면 버전당 O(log n)의 추가 공간만으로 무한한 버전 이력을 관리할 수 있습니다.

코드 에디터의 undo/redo, 온라인 저지의 시간 여행 쿼리, 함수형 프로그래밍의 불변 자료구조 등에 폭넓게 활용됩니다.

## 함수 인터페이스

```ts
export class PersistentSegmentTree {
  constructor(arr: number[])
  // 초기 배열로 버전 0 구성 — O(n)

  update(version: number, i: number, val: number): number
  // version 버전을 기반으로 인덱스 i를 val로 변경한 새 버전 생성
  // 새 버전 번호 반환 — O(log n)

  query(version: number, l: number, r: number): number
  // version 버전의 [l, r] 구간 합 반환 — O(log n)

  versionCount(): number
  // 현재 총 버전 수 반환 — O(1)
}
```

## 제약 조건

- $n \leq 10^4$ (초기 배열 크기)
- $0 \leq i < n$ (업데이트 인덱스)
- $0 \leq l \leq r < n$ (질의 구간)
- 버전 번호: $0 \leq \text{version} < \text{versionCount()}$
- 값 범위: $-10^9 \leq \text{val} \leq 10^9$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 핵심 아이디어: 경로 복사(Path Copying)

일반 세그먼트 트리에서 인덱스 `i`를 업데이트하면 루트에서 리프까지의 경로(O(log n)개 노드)가 변경됩니다. 영속 버전에서는 이 경로에 있는 노드만 새로 복사하고, 변경되지 않는 서브트리는 기존 버전과 **공유**합니다.

```
버전 0: [1, 2, 3, 4]         업데이트 (index=1, val=10):

         [10]                          [11]  ← 새 루트
        /    \                        /    \
      [3]    [7]          →         [11]   [7] ← 공유
      / \    / \                   /   \
    [1] [2] [3] [4]             [1]  [10] ← 새 노드

버전 0의 노드는 변경 없이 유지됨
새로 생성된 노드: 루트와 왼쪽 경로의 2개 → O(log n)
```

### update 알고리즘

```
새 버전의 루트 = updateNode(old_root, 0, n-1, i, val)

updateNode(old_node, lo, hi, i, val):
  new_node ← 새 노드 생성 (old_node를 복사)
  if lo == hi:  // 리프
    new_node.sum ← val
    return new_node
  mid ← (lo + hi) / 2
  if i <= mid:
    new_node.left ← updateNode(old_node.left, lo, mid, i, val)
    new_node.right ← old_node.right  // 공유
  else:
    new_node.left ← old_node.left    // 공유
    new_node.right ← updateNode(old_node.right, mid+1, hi, i, val)
  new_node.sum ← new_node.left.sum + new_node.right.sum
  return new_node
```

### query 알고리즘

특정 버전의 루트 포인터를 사용한 일반 세그먼트 트리 질의와 동일합니다.

```
query(version, l, r):
  return queryNode(roots[version], 0, n-1, l, r)

queryNode(node, lo, hi, l, r):
  if l > hi or r < lo: return 0
  if l <= lo and hi <= r: return node.sum
  mid ← (lo + hi) / 2
  return queryNode(node.left, lo, mid, l, r)
       + queryNode(node.right, mid+1, hi, l, r)
```

## 예시

```ts
const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
// 버전 0: [1, 2, 3, 4, 5]

tree.query(0, 0, 4); // 15 (1+2+3+4+5)
tree.query(0, 1, 3); // 9  (2+3+4)

const v1 = tree.update(0, 2, 100);
// 버전 1: [1, 2, 100, 4, 5]

tree.query(v1, 0, 4); // 112 (1+2+100+4+5)
tree.query(0, 0, 4);  // 15  (버전 0은 변경 없음!)

const v2 = tree.update(v1, 0, -1);
// 버전 2: [-1, 2, 100, 4, 5]

tree.query(v2, 0, 2); // 101 (-1+2+100)
tree.query(v1, 0, 2); // 103 (1+2+100) — v1도 변경 없음

tree.versionCount(); // 3 (버전 0, 1, 2)

// 버전 0을 기반으로 분기
const vA = tree.update(0, 4, 99);
// 버전 3: [1, 2, 3, 4, 99]
tree.query(vA, 3, 4); // 103 (4+99)
tree.query(v1, 3, 4); // 9   (4+5, v1은 독립 유지)
```
