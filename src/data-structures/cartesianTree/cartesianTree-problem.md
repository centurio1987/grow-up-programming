# CartesianTree

## 한 줄 요약
> BST 성질(인덱스 기준 중위 순서)과 힙 성질(값 기준 최솟값이 루트)을 동시에 만족하는 카르테시안 트리를 배열에서 O(n)에 구성하라.

## 스토리

카르테시안 트리는 1980년 Jean Vuillemin이 제안한 자료구조로, 이름은 데카르트 좌표계(Cartesian coordinates)에서 유래한다: 배열의 인덱스를 x축, 값을 y축으로 보면 각 점이 "x축 기준 BST, y축 기준 힙"을 형성하기 때문이다.

현대에서 가장 중요한 응용은 **RMQ (Range Minimum Query)** 전처리다. 배열에서 임의 구간 [l, r]의 최솟값을 O(1)에 답하기 위해 카르테시안 트리를 구성하고, 구간 최솟값 = 해당 구간의 LCA (Lowest Common Ancestor)라는 사실을 이용한다. Treap(트립)은 카르테시안 트리에 랜덤 우선순위를 부여한 변형으로 self-balancing BST로 사용된다.

당신의 팀은 수백만 개의 센서 데이터에서 빠르게 구간 최솟값을 조회해야 하는 모니터링 시스템을 만들고 있다. 카르테시안 트리로 데이터를 전처리하라.

## 함수 인터페이스

```ts
export class CartesianTree<T> {
  static fromArray<T>(
    arr: T[],
    comparator?: (a: T, b: T) => number
  ): CartesianTree<T>

  value(): T | undefined        // 루트 값 (빈 트리면 undefined)
  left(): CartesianTree<T> | undefined
  right(): CartesianTree<T> | undefined
  inOrder(): T[]                // 원래 배열 순서 복원
  size(): number
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `fromArray(arr, cmp?)` | 배열에서 O(n) 카르테시안 트리 구성 | `CartesianTree<T>` |
| `value()` | 루트 값 (배열 전체 최솟값) | `T \| undefined` |
| `left()` | 왼쪽 서브트리 | `CartesianTree<T> \| undefined` |
| `right()` | 오른쪽 서브트리 | `CartesianTree<T> \| undefined` |
| `inOrder()` | 중위 순회 = 원래 배열 복원 | `T[]` |
| `size()` | 전체 노드 수 | `number` |

## 제약 조건
- $n \leq 10^4$
- 시간 제한: 1초, 메모리 제한: 256 MB
- `fromArray`는 O(n)이어야 한다
- `comparator` 미제공 시 min-heap 기준 (`a < b`이면 a가 부모)
- 중복 값 허용 (배열 원소 그대로 보존)

## 문제 상세

### 두 성질의 동시 만족

| 성질 | 정의 |
|------|------|
| **BST 성질** | 중위 순회 시 원래 배열 순서 복원 |
| **힙 성질** | 부모 값 ≤ 자식 값 (min-heap 기준) |

이 두 성질을 동시에 만족하는 트리는 배열마다 유일하게 존재한다.

### O(n) 스택 기반 구성

```
배열: [5, 10, 40, 10, 20]

처리:
  5  → 스택: [5]
  10 → 5 < 10, 그냥 push. 스택: [5, 10]  (10은 5의 오른쪽)
  40 → 10 < 40, push. 스택: [5, 10, 40]
  10 → 40 > 10, pop. 40이 10의 left. 10 < 10, push. 스택: [5, 10새, 10전]
     실제: 새 10의 left = 팝된 40, 이전 노드의 right = 새 10
  20 → 10 < 20, push. 스택: [5, 10새, 10전, 20]

최종 트리:
      5
       \
       10(이전)
       /  \
      10(새) 20
      /
     40
```

핵심: 스택은 오른쪽 경계(rightmost path)를 유지한다. 새 원소가 스택 탑보다 작으면 팝하며 왼쪽 자식으로 연결한다.

## 예시

```ts
const tree = CartesianTree.fromArray([5, 10, 40, 10, 20]);
tree.value();    // 5 (배열 최솟값)
tree.inOrder();  // [5, 10, 40, 10, 20] (원배열 복원)
tree.left();     // undefined (5 왼쪽에 없음)
tree.right()?.value();  // 10

// max-heap 기준
const maxTree = CartesianTree.fromArray([5, 10, 40, 10, 20], (a, b) => b - a);
maxTree.value();  // 40
maxTree.inOrder();  // [5, 10, 40, 10, 20]
```
