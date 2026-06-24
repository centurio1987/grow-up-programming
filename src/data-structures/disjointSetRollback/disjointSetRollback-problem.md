# DisjointSetRollback

## 한 줄 요약
> union 연산을 되돌릴 수 있는 롤백 기능이 있는 분리 집합(유니온-파인드)을 구현하라.

## 스토리

온라인 게임 서버에서 플레이어들의 파티 기록을 분석합니다. "시간 t에 A와 B는 같은 파티였나?"를 수천 번 쿼리해야 합니다. 파티는 수시로 합쳐지고 해산됩니다. 단순 유니온-파인드는 union을 되돌릴 수 없어서, 각 쿼리 시점마다 전체 파티 상태를 재계산해야 합니다.

DisjointSetRollback은 union 연산의 변경 기록을 스택에 쌓아두고, rollback()으로 가장 최근 union을 O(1)에 되돌립니다. snapshot()으로 특정 시점을 저장하고 restore(version)으로 해당 시점으로 복원하면, 시간 역행이 가능한 그래프 분석이 가능합니다.

이 구조는 오프라인 동적 연결성 문제에서 Link-Cut Tree의 대안으로 활용됩니다. 특히 간선의 추가·삭제 이벤트를 시간 축으로 정리해 분할 정복(Divide & Conquer on Time)과 결합하면, 각 쿼리 시점의 연결 여부를 효율적으로 처리할 수 있습니다.

## 함수 인터페이스

```ts
export class DisjointSetRollback {
  constructor(n: number)
  find(x: number): number         // O(log n) — 경로 압축 없음
  union(x: number, y: number): boolean  // O(log n), 같은 집합이면 false
  rollback(): void                // 마지막 union 되돌리기 O(1)
  snapshot(): number              // 현재 상태 스냅샷, 버전 번호 반환
  restore(version: number): void  // 특정 버전으로 복원
  same(x: number, y: number): boolean  // O(log n)
  groupCount(): number            // 현재 독립 집합 수
}
```

## 제약 조건
- $n \leq 10^4$ (노드 수)
- 노드 번호는 0-indexed
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 왜 경로 압축을 쓰지 않는가?

일반 유니온-파인드의 경로 압축은 노드의 부모 포인터를 루트로 직접 연결합니다.
롤백하려면 이 변경들을 모두 되돌려야 하는데, 경로 압축 하나가 O(n)개의 포인터를 바꿀 수 있어 기록 비용이 폭발합니다.

**해결책**: Union by Rank만 사용합니다. 이 경우 union 하나당 변경되는 포인터는 정확히 하나(루트의 parent 하나)이므로, 기록 크기가 union 횟수에 비례합니다.

### Union by Rank

두 트리를 합칠 때 rank(트리 높이의 상한)가 낮은 쪽을 높은 쪽의 자식으로 붙입니다.
rank가 같을 때만 하나 증가합니다. 이로써 트리 높이 ≤ log₂n이 보장됩니다.

### rollback 구현

```
history = [{node: rootX, oldParent: rootX, otherNode: rootY, oldRank: rankX, merged: true}, ...]
```

rollback() 시:
1. history에서 마지막 항목 팝
2. merged가 true면: `parent[rootX] = rootX`, `rank[rootY] -= delta`, `count += 1`

### snapshot / restore

```
snapshots[version] = history.length  // 그 시점까지의 union 수
```

restore(v) = history.length > snapshots[v] 인 동안 rollback() 반복

## 예시

```ts
const ds = new DisjointSetRollback(5);
ds.union(0, 1);       // true, [0,1]이 같은 집합
ds.union(2, 3);       // true, [2,3]이 같은 집합
const v = ds.snapshot(); // 버전 저장

ds.union(1, 2);       // true, [0,1,2,3] 합침
ds.same(0, 3);        // true

ds.restore(v);        // union(1,2) 취소
ds.same(0, 3);        // false
ds.same(0, 1);        // true (0-1 연결은 유지)
ds.groupCount();      // 3
```
