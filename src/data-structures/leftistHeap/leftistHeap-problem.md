# LeftistHeap (좌향 힙)

## 한 줄 요약
> 오른쪽 경로를 항상 최단으로 유지하는 이진 트리 힙으로, 두 힙을 O(log n)에 병합합니다.

## 스토리

온라인 알고리즘 심사 시스템(Online Judge)을 운영 중입니다. 각 언어별·문제별로 독립적인 채점 큐가 존재하며, 트래픽 급증 시 여러 큐를 즉시 합쳐 하나의 채점 서버로 몰아야 합니다.

이진 힙은 두 힙을 합치는 데 O(n) 시간이 필요합니다. 채점 큐가 수만 건일 때 큐 병합이 병목이 됩니다.

좌향 힙(Leftist Heap)은 왼쪽 편향 이진 트리를 사용해 **병합을 O(log n)**에 수행합니다. 오른쪽 경로(rightmost path)를 항상 짧게 유지함으로써 병합 시 오른쪽 경로만 재귀적으로 합치면 되기 때문입니다. 이진 힙 대비 단순한 구조로 병합 지원 힙의 첫 번째 선택이 됩니다.

## 함수 인터페이스

```ts
export class LeftistHeap<T> {
  constructor(compare: (a: T, b: T) => number)
  insert(item: T): void                            // O(log n)
  extractMin(): T | undefined                      // O(log n)
  merge(other: LeftistHeap<T>): LeftistHeap<T>    // O(log n)
  peek(): T | undefined                            // O(1)
  size(): number                                   // O(1)
  isEmpty(): boolean                               // O(1)
}
```

## 제약 조건

- 비교 함수 `compare(a, b)`는 a < b이면 음수, a === b이면 0, a > b이면 양수를 반환한다.
- `extractMin`과 `peek`은 힙이 비어 있으면 `undefined`를 반환한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**Rank (s-value) 정의**

노드의 rank는 해당 노드에서 null 노드까지의 오른쪽 경로 길이이다.
- null 노드의 rank = 0
- 리프 노드의 rank = 1
- 내부 노드의 rank = min(left.rank, right.rank) + 1 → 단, 항상 right.rank = rank - 1

**좌향(Leftist) 속성**

모든 노드에서 `rank(left) ≥ rank(right)`.

즉, 왼쪽 서브트리의 rank가 항상 오른쪽 이상이어야 한다. 이를 통해 오른쪽 경로 길이가 최소가 되고, n개 노드를 가진 트리의 오른쪽 경로 길이는 O(log n)이 된다.

**병합 알고리즘 (재귀)**

두 힙 h1, h2를 병합할 때 (h1.root.item ≤ h2.root.item 가정):
1. h1.root.right = merge(h1.root.right, h2)
2. rank(h1.root.left) < rank(h1.root.right)이면 좌우 교환
3. rank 갱신

**삽입은 merge로 구현:**  
크기 1인 임시 힙을 만들어 현재 힙과 병합한다.

**extractMin은 merge로 구현:**  
루트 제거 후 좌우 서브트리를 병합한다.

## 예시

```ts
const heap = new LeftistHeap<number>((a, b) => a - b);
heap.insert(10);
heap.insert(5);
heap.insert(15);

console.log(heap.peek());       // 5 (O(1))
console.log(heap.extractMin()); // 5
console.log(heap.size());       // 2

const heap2 = new LeftistHeap<number>((a, b) => a - b);
heap2.insert(3);
heap2.insert(8);

const merged = heap.merge(heap2); // O(log n)
console.log(merged.extractMin()); // 3
console.log(merged.extractMin()); // 8
console.log(merged.extractMin()); // 10
console.log(merged.extractMin()); // 15
```
