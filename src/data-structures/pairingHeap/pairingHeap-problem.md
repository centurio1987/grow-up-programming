# PairingHeap (쌍 힙)

## 한 줄 요약
> 구현이 단순하면서도 실용적으로 빠른 병합 가능 힙으로, insert와 merge가 O(1)입니다.

## 스토리

게임 서버에서 수백만 개의 이벤트(몬스터 스폰, 아이템 획득, 플레이어 액션)를 우선순위 큐로 처리합니다. 이벤트 타입마다 별도 큐가 있고, 여러 큐를 하나로 병합해 순서대로 처리해야 할 때가 자주 있습니다.

Fibonacci Heap은 이론적으로 완벽하지만 구현이 매우 복잡하고 상수 인수가 커 실무에서는 오히려 느린 경우가 많습니다. 이진 힙은 구현이 쉽지만 병합이 O(n)입니다.

쌍 힙(Pairing Heap)은 이 두 극단의 균형점입니다. 각 노드가 첫 번째 자식과 다음 형제 포인터만 갖는 단순한 구조로, insert/merge는 O(1), extractMin은 O(log n) 상각입니다. 실제 벤치마크에서는 Fibonacci Heap을 능가하는 경우가 많습니다.

## 함수 인터페이스

```ts
export class PairingHeap<T> {
  constructor(compare: (a: T, b: T) => number)
  insert(item: T): void                          // O(1)
  extractMin(): T | undefined                    // O(log n) 상각
  merge(other: PairingHeap<T>): PairingHeap<T>  // O(1)
  peek(): T | undefined                          // O(1)
  size(): number                                 // O(1)
  isEmpty(): boolean                             // O(1)
}
```

## 제약 조건

- 비교 함수 `compare(a, b)`는 a < b이면 음수, a === b이면 0, a > b이면 양수를 반환한다.
- `extractMin`과 `peek`은 힙이 비어 있으면 `undefined`를 반환한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**노드 구조**

```
PairingNode {
  item: T
  leftChild: PairingNode | null   // 첫 번째 자식
  nextSibling: PairingNode | null // 오른쪽 형제 (부모의 leftChild 체인)
  parent: PairingNode | null      // 부모 (선택적, decreaseKey 지원 시 필요)
}
```

자식 리스트는 `leftChild → nextSibling → nextSibling → ...` 체인으로 표현된다.

**두 트리 연결 (link)**

두 루트를 비교해 더 작은 쪽이 새 루트가 되고, 더 큰 쪽이 그 루트의 첫 번째 자식이 된다.

```
link(a, b):
  if a.item ≤ b.item:
    b.nextSibling = a.leftChild
    a.leftChild = b
    return a
  else:
    a.nextSibling = b.leftChild
    b.leftChild = a
    return b
```

**extractMin의 Two-Pass Merge**

루트를 제거하면 자식 리스트(형제 체인)만 남는다. 이를 재결합하는 전략:

1. **Forward pass:** 형제 체인을 왼쪽부터 두 개씩 묶어 link한다. → 쌍(pair)을 형성
2. **Backward pass:** 남은 쌍들을 오른쪽에서 왼쪽으로 순서대로 link한다.

이 Two-Pass 방식이 상각 O(log n)을 보장한다.

## 예시

```ts
const heap = new PairingHeap<number>((a, b) => a - b);
heap.insert(10);
heap.insert(5);
heap.insert(15);
heap.insert(3);

console.log(heap.peek());       // 3
console.log(heap.extractMin()); // 3 (Two-Pass merge 발생)
console.log(heap.extractMin()); // 5

const heap2 = new PairingHeap<number>((a, b) => a - b);
heap2.insert(1);
heap2.insert(8);

const merged = heap.merge(heap2); // O(1)
console.log(merged.extractMin()); // 1
```
