# SplayTree

## 한 줄 요약
> 접근한 노드를 루트로 끌어올리는 스플레이 연산으로 지역성을 활용하는 상각 O(log n) BST를 구현하라.

## 스토리

스플레이 트리는 1985년 Daniel Sleator와 Robert Tarjan이 고안했다. 핵심 아이디어는 단순하다: **방금 접근한 데이터는 곧 다시 접근될 가능성이 높다**. 그래서 탐색·삽입·삭제 때마다 해당 노드를 루트로 끌어올린다(splay).

LRU 캐시처럼 자주 쓰이는 원소가 빠르게 접근 가능한 위치에 있다. 네트워크 라우터, 가비지 컬렉터의 메모리 탐색, 문자열 편집기의 커서 이동 등 지역성이 강한 워크로드에서 AVL이나 레드-블랙 트리보다 실제 성능이 더 좋을 수 있다.

팀은 실시간 로그 분석 시스템을 만들고 있다. 로그에는 같은 사용자 ID가 연속해서 등장하는 경향이 있다. 반복 접근 패턴에 특화된 BST로 탐색 성능을 높여라.

## 함수 인터페이스

```ts
export class SplayTree<T> {
  constructor(comparator?: (a: T, b: T) => number)
  insert(value: T): void      // O(log n) 상각
  delete(value: T): boolean   // O(log n) 상각
  has(value: T): boolean      // O(log n) 상각
  min(): T | undefined
  max(): T | undefined
  inOrder(): T[]
  size(): number
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `insert(value)` | BST 삽입 후 해당 노드를 루트로 스플레이 | `void` |
| `delete(value)` | 노드 스플레이 후 제거, 두 서브트리 합병 | `boolean` |
| `has(value)` | 탐색 후 해당 노드(또는 최근 방문 노드)를 스플레이 | `boolean` |
| `min()` | 최솟값 | `T \| undefined` |
| `max()` | 최댓값 | `T \| undefined` |
| `inOrder()` | 중위 순회 배열 | `T[]` |
| `size()` | 노드 수 | `number` |

## 제약 조건
- $n \leq 10^4$
- 시간 제한: 1초, 메모리 제한: 256 MB
- 상각 O(log n) 보장. 개별 연산은 O(n) 최악이 가능
- 중복 삽입은 무시한다 (set 의미론)

## 문제 상세

### 스플레이 연산 3종

노드 x를 루트로 끌어올릴 때 x의 부모(p)와 조부모(g) 관계에 따라 회전을 선택한다.

| 케이스 | 조건 | 연산 |
|--------|------|------|
| **Zig** | p가 루트 | x에서 단일 회전 |
| **Zig-Zig** | x와 p가 같은 방향 자식 | p부터 회전 후 x 회전 |
| **Zig-Zag** | x와 p가 다른 방향 자식 | x를 두 번 회전 |

```
Zig-Zig (LL):         Zig-Zag (LR):
    g                     g
   /                     /
  p        →            p     →  x
 /        x먼저        /  \      / \
x         올라감      x    p   p    g
```

### 삭제 전략

1. 삭제 대상 값 x를 스플레이하여 루트로
2. 루트 제거 → 왼쪽 서브트리 L, 오른쪽 서브트리 R
3. L의 최대 원소를 스플레이 → L의 오른쪽 자식이 없어짐
4. L의 오른쪽에 R을 연결

## 예시

```ts
const tree = new SplayTree<number>();
[10, 5, 15, 3, 7].forEach(v => tree.insert(v));

tree.has(3);     // true — 3이 루트로 스플레이됨
tree.inOrder();  // [3, 5, 7, 10, 15] — 정렬 유지

tree.delete(5);
tree.inOrder();  // [3, 7, 10, 15]
```
