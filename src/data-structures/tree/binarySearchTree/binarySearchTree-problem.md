# Binary Search Tree (이진 탐색 트리)

## 한 줄 요약
> BST 성질(왼쪽 < 루트 < 오른쪽)을 유지하며 정수 키를 삽입·삭제·검색하고, 중위 순회로 정렬 결과를 반환하는 자료구조를 구현하라.

## 스토리

대학 도서관에서 수만 권의 장서를 ISBN 번호로 관리하는 시스템을 새로 구축한다. 사서들은 매일 신규 도서를 등록하고, 대출·반납에 따라 보유 목록을 갱신하며, 특정 ISBN의 보유 여부를 즉시 확인할 수 있어야 한다. 또한 특정 범위의 ISBN을 정렬 순서로 출력해 목록을 인쇄하는 기능도 필요하다.

단순 배열에 저장하면 삽입은 O(1)이지만 검색이 O(n)이라 수만 건의 조회 요청을 처리하기 어렵다. 정렬 배열은 이진 탐색으로 O(log n) 검색을 지원하지만 삽입·삭제가 O(n)으로 느리다. 링크드 해시 테이블은 빠른 검색을 제공하지만 정렬 순회가 O(n log n)의 추가 정렬 비용을 요구한다.

이진 탐색 트리(BST)는 세 가지 요구사항을 균형 있게 충족한다. 각 노드는 왼쪽 서브트리의 모든 키보다 크고 오른쪽 서브트리의 모든 키보다 작다. 이 BST 성질 덕분에 평균 O(log n)으로 삽입·삭제·검색이 가능하고, 중위 순회(inorder traversal)는 자동으로 정렬 순서를 만들어낸다. 도서관 ISBN 관리 시스템의 핵심 엔진이 될 BST를 완성하라.

## 함수 인터페이스

```ts
export class BinarySearchTree {
  insert(key: number): void       // 중복 키는 무시
  search(key: number): boolean
  delete(key: number): void       // 자식이 둘인 경우 오른쪽 서브트리 최솟값(in-order successor)으로 대체
  inorder(): number[]             // 중위 순회 결과 (오름차순 정렬)
  min(): number | undefined       // 빈 트리이면 undefined
  max(): number | undefined       // 빈 트리이면 undefined
}
// 평균 O(log n), 정렬된 입력 시 최악 O(n)
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `insert(key)` | BST 성질을 유지하며 키 삽입. 중복이면 무시 | `void` |
| `search(key)` | 키 존재 여부 확인 | `boolean` |
| `delete(key)` | 키 제거. 자식이 둘이면 in-order successor로 대체 | `void` |
| `inorder()` | 중위 순회로 오름차순 배열 반환 | `number[]` |
| `min()` | 최솟값 반환. 빈 트리면 `undefined` | `number \| undefined` |
| `max()` | 최댓값 반환. 빈 트리면 `undefined` | `number \| undefined` |

## 제약 조건

- 키는 정수 범위 $-2^{31} \le key \le 2^{31}-1$
- 저장 가능한 키의 개수: $n \le 10^5$
- 시간복잡도
  - `insert` / `search` / `delete`: $O(\log n)$ 평균, $O(n)$ 최악
  - `inorder` / `min` / `max`: $O(n)$ / $O(h)$ / $O(h)$ (h = 트리 높이)

## 문제 상세

**BST 성질**: 모든 노드 v에 대해
- v의 왼쪽 서브트리의 모든 키 < v.key
- v의 오른쪽 서브트리의 모든 키 > v.key

이 성질이 유지되는 한 검색은 매 단계마다 탐색 범위가 절반으로 줄어든다.

**삽입 (`insert`)**: 루트에서 시작해 삽입할 키와 현재 노드를 비교한다. 작으면 왼쪽, 크면 오른쪽으로 이동한다. null에 도달하면 새 노드를 생성한다. 같으면 무시한다.

**검색 (`search`)**: 루트에서 시작해 키와 현재 노드를 비교한다. 같으면 `true`, 작으면 왼쪽, 크면 오른쪽으로 이동한다. null에 도달하면 `false`.

**삭제 (`delete`)**: 세 가지 경우가 있다.
1. 자식 없음(단말 노드): 그냥 제거한다.
2. 자식 하나: 자식으로 대체한다.
3. 자식 둘: **in-order successor**(오른쪽 서브트리의 최솟값)의 키로 현재 노드의 키를 교체하고, in-order successor 노드를 삭제한다. in-order successor는 왼쪽 자식이 없으므로 case 1 또는 case 2로 귀결된다.

**중위 순회 (`inorder`)**: 왼쪽 서브트리 → 현재 노드 → 오른쪽 서브트리 순서로 방문하면 BST 성질에 의해 오름차순이 보장된다.

**최솟값/최댓값**: min은 루트에서 왼쪽으로만, max는 오른쪽으로만 따라가면 된다.

## 예시

```ts
const bst = new BinarySearchTree();

bst.insert(5);
bst.insert(3);
bst.insert(7);
bst.insert(1);
bst.insert(4);

//       5
//      / \
//     3   7
//    / \
//   1   4

console.log(bst.inorder());  // [1, 3, 4, 5, 7]
console.log(bst.search(4));  // true
console.log(bst.search(6));  // false
console.log(bst.min());      // 1
console.log(bst.max());      // 7

bst.delete(3); // 자식이 둘 → in-order successor(4)로 대체
//       5
//      / \
//     4   7
//    /
//   1

console.log(bst.inorder());  // [1, 4, 5, 7]

bst.insert(5); // 중복 무시
console.log(bst.inorder());  // [1, 4, 5, 7]
```
