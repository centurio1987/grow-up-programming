# RedBlackTree

## 한 줄 요약
> 5가지 채색 규칙으로 Black 높이의 균형을 유지하여 O(log n)을 보장하는 자기 균형 BST를 구현하라.

## 스토리

C++의 `std::map`, `std::set`, Java의 `TreeMap`, `TreeSet`, Linux 커널의 프로세스 스케줄러 — 이들은 모두 레드-블랙 트리를 내부 자료구조로 사용한다. AVL 트리보다 삽입·삭제 시 회전 횟수가 적어(최대 3회) 쓰기가 잦은 환경에 더 적합하다.

1972년 Rudolf Bayer가 고안한 "대칭 이진 B-트리"가 기원이며, 1978년 Guibas와 Sedgewick이 레드-블랙 트리로 재해석했다. 노드 색상이라는 단순한 메타데이터 하나로 트리의 균형을 관리한다는 발상이 핵심이다.

당신의 팀은 고성능 인메모리 데이터베이스를 만들고 있다. 초당 수만 건의 삽입·삭제가 발생하는 상황에서 O(log n) 보장이 필수다. 레드-블랙 트리로 인덱스 계층을 구현하라.

## 함수 인터페이스

```ts
export class RedBlackTree<T> {
  constructor(comparator?: (a: T, b: T) => number)
  insert(value: T): void      // O(log n)
  delete(value: T): boolean   // O(log n)
  has(value: T): boolean      // O(log n)
  min(): T | undefined
  max(): T | undefined
  inOrder(): T[]
  size(): number
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `insert(value)` | 삽입 후 채색 규칙 복구. 중복 시 무시 | `void` |
| `delete(value)` | 삭제 후 채색 규칙 복구 | `boolean` |
| `has(value)` | 값 존재 여부 | `boolean` |
| `min()` | 최솟값 | `T \| undefined` |
| `max()` | 최댓값 | `T \| undefined` |
| `inOrder()` | 중위 순회 배열 | `T[]` |
| `size()` | 노드 수 | `number` |

## 제약 조건
- $n \leq 10^4$
- 시간 제한: 1초, 메모리 제한: 256 MB
- 중복 삽입은 무시한다 (set 의미론)
- `comparator` 미제공 시 기본 대소 비교 사용

## 문제 상세

### 5가지 레드-블랙 속성

1. **채색**: 모든 노드는 RED 또는 BLACK
2. **루트**: 루트는 반드시 BLACK
3. **NIL 리프**: 외부 노드(NIL)는 모두 BLACK
4. **Red 규칙**: RED 노드의 자식은 모두 BLACK (연속 Red 금지)
5. **Black 높이**: 임의 노드에서 리프까지 경로의 Black 노드 수가 동일

### 삽입 픽스업 케이스

새 노드를 RED로 삽입 후 속성 위반 시 3가지 케이스로 복구:
- **케이스 1**: 삼촌이 RED → 부모·삼촌을 BLACK, 할아버지를 RED로 재채색 후 할아버지에서 재귀
- **케이스 2**: 삼촌이 BLACK, 삼각 형태 → 부모 기준 회전으로 케이스 3으로 변환
- **케이스 3**: 삼촌이 BLACK, 직선 형태 → 할아버지 기준 회전 + 채색 교환

### 삭제 픽스업

삭제 시 "이중 흑색(double black)" 노드가 발생하면 4가지 케이스로 복구.

## 예시

```ts
const tree = new RedBlackTree<number>();
[7, 3, 18, 10, 22, 8, 11, 26].forEach(v => tree.insert(v));

tree.inOrder();  // [3, 7, 8, 10, 11, 18, 22, 26]
tree.min();      // 3
tree.max();      // 26
tree.has(11);    // true

tree.delete(18);
tree.inOrder();  // [3, 7, 8, 10, 11, 22, 26]
```
