# FibonacciHeap (피보나치 힙)

## 한 줄 요약
> decrease-key를 O(1) 상각으로 지원하는 병합 가능한 힙으로, 다익스트라 알고리즘을 최적화합니다.

## 스토리

당신은 지도 서비스의 최단 경로 탐색 엔진을 개선하고 있습니다. 수백만 개의 교차로(정점)와 도로(간선)로 이루어진 그래프에서 매 초마다 수천 건의 경로 요청을 처리해야 합니다.

다익스트라 알고리즘의 병목은 우선순위 큐의 decrease-key 연산입니다. 이진 힙으로 구현하면 decrease-key가 O(log n)이므로 전체 복잡도가 O((V + E) log V)가 됩니다. 간선 수 E가 V²에 가까운 밀집 그래프에서는 O(V² log V)로 치솟습니다.

피보나치 힙은 decrease-key를 O(1) 상각으로 처리함으로써 다익스트라의 전체 복잡도를 O(E + V log V)로 낮춥니다. 루트 리스트에 노드를 즉시 잘라내어 올리는 지연(lazy) 전략과, 마킹(mark) 비트를 통한 cascading cut으로 이 복잡도를 달성합니다.

## 함수 인터페이스

```ts
export class FibNode<T> {
  item: T;
  degree: number;
  marked: boolean;
}

export class FibonacciHeap<T> {
  constructor(compare: (a: T, b: T) => number)
  insert(item: T): FibNode<T>              // O(1) 상각
  extractMin(): T | undefined              // O(log n) 상각
  decreaseKey(node: FibNode<T>, newItem: T): void  // O(1) 상각
  merge(other: FibonacciHeap<T>): FibonacciHeap<T>  // O(1)
  peek(): T | undefined                    // O(1)
  size(): number                           // O(1)
  isEmpty(): boolean                       // O(1)
}
```

## 제약 조건

- 비교 함수 `compare(a, b)`는 a < b이면 음수, a === b이면 0, a > b이면 양수를 반환한다.
- `decreaseKey`는 반드시 기존 값보다 작거나 같은 값으로만 호출된다고 가정한다.
- `extractMin`과 `peek`은 힙이 비어 있으면 `undefined`를 반환한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**피보나치 힙 구조**

- **루트 리스트:** 여러 트리의 루트를 이중 원형 연결 리스트로 연결. min 포인터는 이 중 최솟값 루트를 가리킨다.
- **힙-순서 속성:** 각 트리의 부모 값 ≤ 자식 값.
- **차수(degree):** 노드의 자식 수. extractMin 후 통합(consolidation) 단계에서 같은 차수의 트리를 결합한다.
- **마크(mark) 비트:** 한 노드가 자식을 잃은 적이 있으면 true. 두 번째 자식을 잃으면 cascading cut이 발생한다.

**핵심 연산 설명**

| 연산 | 전략 | 이유 |
|------|------|------|
| insert | 루트 리스트에 즉시 추가 (lazy) | O(1) 달성 |
| merge | 두 루트 리스트를 이어 붙임 | O(1) 달성 |
| extractMin | min 제거 → 자식을 루트로 승격 → consolidate | O(log n) 상각 |
| decreaseKey | 부모와 힙 순서 위반 시 잘라내어 루트로 승격 | O(1) 상각 |

**Cascading Cut**

decreaseKey로 부모로부터 잘라낸 노드의 부모가 이미 mark=true이면, 부모도 잘라내어 루트로 승격하고 반복한다. 이는 각 트리의 차수가 O(log n) 상한을 유지하도록 보장한다.

## 예시

```ts
const heap = new FibonacciHeap<number>((a, b) => a - b);
const n1 = heap.insert(10);
const n2 = heap.insert(20);
heap.insert(5);

console.log(heap.peek());       // 5
console.log(heap.extractMin()); // 5 (→ consolidate 발생)

heap.decreaseKey(n2, 3);        // 20 → 3
console.log(heap.peek());       // 3

console.log(heap.extractMin()); // 3
console.log(heap.extractMin()); // 10
```
