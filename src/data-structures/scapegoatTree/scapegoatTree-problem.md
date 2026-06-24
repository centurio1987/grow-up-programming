# ScapegoatTree

## 한 줄 요약
> 회전 없이 alpha 균형 조건 위반 시 해당 서브트리를 통째로 재구성하는 단순한 자기 균형 BST를 구현하라.

## 스토리

스케이프고트 트리는 1993년 Igal Galperin과 Ronald Rivest가 발표했다. 이름의 유래는 균형이 깨질 때 "책임자"(scapegoat) 노드를 찾아 해당 서브트리를 재구성하는 방식에서 왔다.

AVL 트리와 레드-블랙 트리는 삽입/삭제마다 복잡한 회전 로직을 수행한다. 스케이프고트 트리는 이를 완전히 제거했다: 균형이 깨지지 않으면 아무것도 하지 않고, 깨지면 그 부분만 통째로 재구성한다. 회전 로직이 없어 구현이 단순하며, 재구성은 배열 정렬 후 완전 이진 트리 구성으로 O(k) (k = 서브트리 크기) 이면 충분하다.

당신의 팀은 주로 읽기 위주인 설정 레지스트리를 만들고 있다. 삽입/삭제가 간헐적으로 발생하며, 코드 복잡도를 낮추고 싶다. 회전 없는 균형 BST인 스케이프고트 트리로 구현하라.

## 함수 인터페이스

```ts
export class ScapegoatTree<T> {
  constructor(alpha?: number, comparator?: (a: T, b: T) => number)
  // alpha: 0.5 < alpha < 1.0, 기본값 0.65
  insert(value: T): void      // O(log n) 상각
  delete(value: T): boolean   // O(log n) 상각
  has(value: T): boolean      // O(log n)
  size(): number              // O(1)
  inOrder(): T[]              // O(n)
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `insert(value)` | 삽입 후 alpha 위반 조상 발견 시 서브트리 재구성 | `void` |
| `delete(value)` | 논리 삭제 후 조건에서 전체 재구성 | `boolean` |
| `has(value)` | 일반 BST 탐색 | `boolean` |
| `size()` | 논리 노드 수 (삭제 마킹 제외) | `number` |
| `inOrder()` | 중위 순회 (삭제 노드 제외) | `T[]` |

## 제약 조건
- $n \leq 10^4$
- $0.5 < \alpha < 1.0$ (기본값 0.65)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 중복 삽입은 무시한다 (set 의미론)

## 문제 상세

### alpha 균형 조건

노드 v의 서브트리 크기를 `size(v)`라 할 때:
$$\text{size}(v.\text{left}) \leq \alpha \cdot \text{size}(v)$$
$$\text{size}(v.\text{right}) \leq \alpha \cdot \text{size}(v)$$

위 조건이 하나라도 위반되면 v가 "스케이프고트"다.

### 삽입 알고리즘

1. 일반 BST 삽입 (삽입 경로를 스택에 기록)
2. 삽입 경로를 거슬러 올라가며 alpha 조건 검사
3. 위반한 최상위 조상(스케이프고트)의 서브트리를 중위 순회 배열로 수집
4. 배열을 재귀적으로 완전 이진 트리로 재구성

### 삭제 알고리즘

논리 삭제(deleted 마킹)를 사용한다:
1. 대상 노드를 `deleted = true`로 마킹
2. `_size`를 감소
3. `_size < alpha * _maxSize`가 되면 전체 트리를 재구성하고 `_maxSize = _size`로 초기화

### 서브트리 재구성

```
function rebuild(nodes: T[]): Node | undefined:
  if nodes.length == 0: return undefined
  mid = floor(nodes.length / 2)
  node = new Node(nodes[mid])
  node.left  = rebuild(nodes[0..mid-1])
  node.right = rebuild(nodes[mid+1..])
  return node
```

## 예시

```ts
const tree = new ScapegoatTree<number>(0.65);
[10, 5, 15, 3, 7, 12, 20].forEach(v => tree.insert(v));

tree.inOrder();  // [3, 5, 7, 10, 12, 15, 20]
tree.has(7);     // true
tree.size();     // 7

tree.delete(5);
tree.delete(15);
tree.inOrder();  // [3, 7, 10, 12, 20]
tree.size();     // 5
```
