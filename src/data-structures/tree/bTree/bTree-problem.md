# BTree (B-트리)

## 한 줄 요약
> 최소 차수 t를 매개변수로 받아 디스크 페이지 크기에 최적화된 균형 다진 탐색 트리를 구현하라.

## 스토리

파일 시스템 개발자 민혁은 수억 개의 파일을 저장하는 SSD 기반 파일 시스템의 인덱스를 설계하고 있다. SSD는 한 번에 4KB 또는 16KB의 페이지 단위로 데이터를 읽는다. 이진 트리는 노드 하나를 읽기 위해 매번 I/O를 발생시켜 성능이 극히 나쁘다.

B-트리는 하나의 노드에 여러 개의 키를 저장함으로써 디스크 페이지 하나에 수백 ~ 수천 개의 키를 담는다. 높이가 2~3에 불과한 트리로 수십억 개의 키를 관리할 수 있고, 탐색에 필요한 디스크 I/O 횟수가 O(log_t n)으로 감소한다. t=1000이면 10억 개의 키를 3번의 I/O로 찾는다.

현대의 ext4, NTFS, HFS+, btrfs 등 대부분의 파일 시스템이 B-트리 또는 그 변형을 사용한다.

## 함수 인터페이스

```ts
export class BTree<T> {
  constructor(t: number = 3, comparator?: (a: T, b: T) => number)
  // t: 최소 차수. 각 비루트 노드는 t-1 ~ 2t-1개의 키를 가짐
  insert(value: T): void      // O(log_t n)
  delete(value: T): boolean   // O(log_t n)
  has(value: T): boolean      // O(log_t n)
  size(): number
  inOrder(): T[]
}
```

## 제약 조건

- $n \leq 10^4$, $t \geq 2$
- 시간 제한: 1초, 메모리 제한: 256 MB
- 중복 값은 한 번만 저장한다 (집합 의미론)
- 비루트 노드: t-1 이상 2t-1 이하의 키
- 루트 노드: 1 이상 2t-1 이하의 키
- 모든 리프는 같은 깊이에 위치해야 한다

## 문제 상세

### 노드 구조

```
BTreeNode<T> {
  keys: T[]         // 정렬된 키 배열. 비루트는 t-1 ~ 2t-1개
  children: BTreeNode<T>[]  // 키 수 + 1개. 리프면 비어있음
  isLeaf: boolean
}
```

### 삽입 규칙 (선제적 분할, preemptive split)

삽입 경로를 내려가면서 가득 찬 노드(키 2t-1개)를 미리 분할한다.

1. 루트가 가득 찼으면 새 루트를 만들고 기존 루트를 분할한다.
2. 내부 노드를 내려갈 때, 다음 자식이 가득 찼으면 분할한다.
3. 분할(`splitChild`): 가득 찬 노드의 중간 키(인덱스 t-1)를 부모에 삽입하고, 나머지를 두 노드로 분리한다.
4. 리프에 도달하면 적절한 위치에 키를 삽입한다.

### 삭제 규칙

삭제 경로를 내려가면서 언더플로우가 발생하지 않도록 사전에 보충한다.

1. **리프에서 삭제**: 해당 키를 직접 제거한다.
2. **내부 노드에서 삭제**:
   - 왼쪽 자식이 t개 이상의 키를 가지면: in-order predecessor로 대체 후 재귀 삭제
   - 오른쪽 자식이 t개 이상의 키를 가지면: in-order successor로 대체 후 재귀 삭제
   - 양쪽 자식 모두 t-1개이면: 두 자식과 해당 부모 키를 병합 후 재귀 삭제
3. **경로상의 노드가 t-1개이면** (언더플로우 가능성):
   - 오른쪽 형제에서 빌리기 (형제가 t개 이상일 때)
   - 왼쪽 형제에서 빌리기 (형제가 t개 이상일 때)
   - 형제와 병합 (형제가 t-1개일 때)

### 시간복잡도 분석

| 연산 | 시간복잡도 | 비고 |
|------|-----------|------|
| insert | O(t · log_t n) | 분할당 O(t) |
| delete | O(t · log_t n) | 병합당 O(t) |
| has | O(t · log_t n) | 노드당 이진탐색 O(log t) 가능 |
| inOrder | O(n) | 전체 순회 |

## 예시

```ts
const tree = new BTree<number>(3); // 최소 차수 t=3

for (const v of [10, 20, 5, 6, 12, 30, 7, 17]) {
  tree.insert(v);
}

console.log(tree.has(6));      // true
console.log(tree.has(99));     // false
console.log(tree.size());      // 8
console.log(tree.inOrder());   // [5, 6, 7, 10, 12, 17, 20, 30]

tree.delete(6);
tree.delete(12);
console.log(tree.inOrder());   // [5, 7, 10, 17, 20, 30]
```
