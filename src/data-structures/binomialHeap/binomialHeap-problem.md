# BinomialHeap (이항 힙)

## 한 줄 요약
> 이항 트리 리스트로 구성된 병합 가능한 힙으로, 두 힙을 O(log n)에 합칩니다.

## 스토리

당신은 대규모 분산 작업 스케줄러를 설계하고 있습니다. 수십 개의 워커 노드가 각자 독립적인 작업 큐(우선순위 큐)를 유지하며, 우선순위가 낮은 숫자일수록 먼저 처리됩니다.

워커 노드 중 하나가 다운되면 그 노드의 작업 큐를 가장 여유 있는 다른 노드에게 전달해야 합니다. 일반적인 이진 힙은 두 힙을 합치는 데 O(n) 시간이 걸리기 때문에, 수천 개의 작업이 쌓인 큐를 합치는 시나리오에서 병목이 됩니다.

이항 힙(Binomial Heap)은 이항 트리의 리스트를 유지함으로써 두 힙의 병합을 O(log n)에 처리합니다. 이진수 덧셈과 동일한 원리로 같은 차수의 이항 트리를 결합해 나가면, 크기가 다른 두 힙도 빠르게 하나로 합칠 수 있습니다.

## 함수 인터페이스

```ts
export class BinomialHeap<T> {
  constructor(compare: (a: T, b: T) => number)
  insert(item: T): void         // O(log n) 상각
  extractMin(): T | undefined   // O(log n)
  peek(): T | undefined         // O(log n)
  merge(other: BinomialHeap<T>): BinomialHeap<T>  // O(log n)
  size(): number                // O(1)
  isEmpty(): boolean            // O(1)
}
```

## 제약 조건

- 비교 함수 `compare(a, b)`는 a < b이면 음수, a === b이면 0, a > b이면 양수를 반환한다.
- `extractMin`과 `peek`은 힙이 비어 있으면 `undefined`를 반환한다.
- `merge`는 두 원본 힙을 파괴하지 않아도 되지만, 파괴적 병합(destructive merge)도 허용한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**이항 트리 (Binomial Tree)**

이항 트리 B_k는 재귀적으로 정의된다:
- B_0는 단일 노드이다.
- B_k는 B_{k-1} 하나를 또 다른 B_{k-1}의 루트의 자식으로 붙인 트리이다.
- B_k는 정확히 2^k 개의 노드를 가지며, 깊이 i에는 C(k, i)개의 노드가 있다.

**이항 힙 구조**

- n개의 원소를 가진 이항 힙은 n의 이진 표현에서 1인 비트에 해당하는 차수의 이항 트리들로 구성된다.
- 예: n=13 = 1101₂ → B_3, B_2, B_0 세 개의 이항 트리
- 각 이항 트리는 최소 힙 속성(부모 ≤ 자식)을 만족한다.

**핵심 연산: 두 이항 트리 결합**

같은 차수 k의 이항 트리 두 개를 결합하면 차수 k+1의 이항 트리가 된다. 루트 값이 더 작은 트리가 새로운 루트가 되고, 상대 트리는 그 루트의 자식으로 추가된다.

**병합 알고리즘**

이진수 덧셈과 동일한 방식으로 두 힙의 트리 리스트를 같은 차수끼리 결합해 나간다. 올림(carry)이 발생할 수 있으며, 최종적으로 각 차수에 최대 하나의 트리만 남는다.

## 예시

```ts
const heap = new BinomialHeap<number>((a, b) => a - b);
heap.insert(10);
heap.insert(20);
heap.insert(5);
console.log(heap.peek());       // 5
console.log(heap.extractMin()); // 5
console.log(heap.size());       // 2

const heap2 = new BinomialHeap<number>((a, b) => a - b);
heap2.insert(3);
heap2.insert(7);

const merged = heap.merge(heap2);
console.log(merged.extractMin()); // 3
console.log(merged.extractMin()); // 7
console.log(merged.extractMin()); // 10
console.log(merged.extractMin()); // 20
```
