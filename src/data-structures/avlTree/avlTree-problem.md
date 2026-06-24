# AVLTree

## 한 줄 요약
> 모든 노드의 높이 균형 인수를 ±1 이하로 유지하여 최악 O(log n)을 보장하는 자기 균형 이진 탐색 트리를 구현하라.

## 스토리

1962년 소련의 수학자 Adelson-Velsky와 Landis가 고안한 AVL 트리는 세계 최초의 자기 균형 이진 탐색 트리다. 일반 BST는 정렬된 데이터를 삽입하면 O(n)으로 퇴화하지만, AVL 트리는 삽입·삭제 시마다 회전(rotation)으로 균형을 교정하여 항상 O(log n)을 유지한다.

PostgreSQL의 B-Tree 인덱스, 파일 시스템의 디렉터리 구조, 실시간 랭킹 시스템처럼 읽기/쓰기가 균형 잡힌 환경에서 빛난다. 레드-블랙 트리보다 더 엄격히 균형을 유지하기 때문에 조회가 약간 더 빠르며, 삽입·삭제 때 회전 횟수가 더 많다.

팀의 데이터베이스 엔진이 느려지고 있다. 팀 리드는 "인덱스 자료구조를 직접 구현해 보자"고 했다. 당신은 AVL 트리를 처음부터 구현하는 임무를 맡았다.

## 함수 인터페이스

```ts
export class AVLTree<T> {
  constructor(comparator?: (a: T, b: T) => number)
  insert(value: T): void      // O(log n)
  delete(value: T): boolean   // O(log n)
  has(value: T): boolean      // O(log n)
  min(): T | undefined        // O(log n)
  max(): T | undefined        // O(log n)
  inOrder(): T[]              // O(n) 정렬된 배열
  size(): number              // O(1)
  height(): number            // O(1) 루트의 높이
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `insert(value)` | 값을 삽입하고 균형 유지. 중복 시 무시 | `void` |
| `delete(value)` | 값을 삭제하고 균형 유지 | 삭제 성공 여부 `boolean` |
| `has(value)` | 값이 존재하는지 확인 | `boolean` |
| `min()` | 최솟값 반환 | `T \| undefined` |
| `max()` | 최댓값 반환 | `T \| undefined` |
| `inOrder()` | 중위 순회로 정렬 배열 반환 | `T[]` |
| `size()` | 전체 노드 수 | `number` |
| `height()` | 루트 기준 트리 높이 | `number` |

## 제약 조건
- $n \leq 10^4$
- 시간 제한: 1초, 메모리 제한: 256 MB
- 중복 값은 삽입을 무시한다 (set 의미론)
- `comparator` 미제공 시 기본 대소 비교(`<`, `>`) 사용

## 문제 상세

### 균형 인수 (Balance Factor)
각 노드에 `height` 필드를 유지한다. 균형 인수 = `height(left) - height(right)`. 이 값이 -1, 0, 1이면 균형, 그 외이면 회전이 필요하다.

### 4종 회전

| 불균형 패턴 | 해결 회전 |
|-------------|-----------|
| LL (왼쪽-왼쪽) | 오른쪽 단일 회전 |
| RR (오른쪽-오른쪽) | 왼쪽 단일 회전 |
| LR (왼쪽-오른쪽) | 왼쪽 회전 후 오른쪽 회전 |
| RL (오른쪽-왼쪽) | 오른쪽 회전 후 왼쪽 회전 |

### 삭제 전략
두 자식이 있는 노드를 삭제할 때는 **중위 후계자(in-order successor)** — 오른쪽 서브트리의 최솟값 — 를 대체 노드로 사용한 뒤 높이를 갱신하고 균형 인수를 재검사한다.

## 예시

```ts
const tree = new AVLTree<number>();
[5, 3, 7, 1, 4, 6, 8].forEach(v => tree.insert(v));

tree.inOrder();  // [1, 3, 4, 5, 6, 7, 8]
tree.height();   // 3
tree.min();      // 1
tree.max();      // 8

tree.delete(5);
tree.inOrder();  // [1, 3, 4, 6, 7, 8]
tree.has(5);     // false
```
