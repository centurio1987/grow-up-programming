# DaryHeap (D진 힙)

## 한 줄 요약
> 각 노드가 d개의 자식을 갖는 배열 기반 힙으로, d 조정으로 push/pop 성능 균형을 맞춥니다.

## 스토리

당신은 실시간 이벤트 스트리밍 시스템을 최적화하고 있습니다. 수백만 개의 이벤트가 초당 수십만 건씩 들어오고, 이벤트를 우선순위별로 처리합니다. 현재 이진 힙(d=2)을 사용 중이지만 push 연산이 병목입니다.

이진 힙의 siftUp(push 시 올라가기)은 O(log₂ n) 단계가 필요합니다. d를 4로 늘리면 트리 높이가 log₄ n = log₂ n / 2로 줄어들어 siftUp이 절반 단계만 올라가도 됩니다. 또한 d개의 자식이 배열에 연속 저장되어 캐시 라인 활용률도 향상됩니다.

반면 siftDown(pop 시 내려가기)은 각 레벨에서 d개 자식을 비교해야 하므로 d * log_d n이 됩니다. push가 훨씬 많은 워크로드(이벤트 삽입 >> 처리)라면 d=4 또는 d=8이 이진 힙보다 실용적으로 빠릅니다.

## 함수 인터페이스

```ts
export class DaryHeap<T> {
  constructor(d: number, compare: (a: T, b: T) => number)
  push(item: T): void      // O(log_d n)
  pop(): T | undefined     // O(d * log_d n)
  peek(): T | undefined    // O(1)
  size(): number           // O(1)
  isEmpty(): boolean       // O(1)
}
```

## 제약 조건

- `d ≥ 2` (d=1은 연결 리스트로 퇴화)
- 비교 함수 `compare(a, b)`는 a < b이면 음수, a === b이면 0, a > b이면 양수를 반환한다.
- `pop`과 `peek`은 힙이 비어 있으면 `undefined`를 반환한다.
- 내부 저장소는 배열(0-indexed)을 사용한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**인덱스 계산 (0-based 배열)**

| 관계 | 공식 |
|------|------|
| 노드 i의 부모 | `Math.floor((i - 1) / d)` |
| 노드 i의 k번째 자식 (k=0..d-1) | `d * i + k + 1` |
| 노드 i의 자식 범위 | `[d*i+1, d*i+d]` |

**siftUp (push 후 위로 올리기)**

새 원소를 배열 끝에 추가한 뒤, 부모보다 작으면 교환을 반복한다.

```
siftUp(i):
  while i > 0:
    parent = floor((i - 1) / d)
    if compare(data[i], data[parent]) < 0:
      swap(data[i], data[parent])
      i = parent
    else: break
```

**siftDown (pop 후 아래로 내리기)**

마지막 원소를 루트로 올린 뒤, 자식 중 최솟값보다 크면 교환을 반복한다.

```
siftDown(i):
  while true:
    minChild = -1
    for k = 0..d-1:
      childIdx = d * i + k + 1
      if childIdx >= size: break
      if minChild == -1 or compare(data[childIdx], data[minChild]) < 0:
        minChild = childIdx
    if minChild == -1 or compare(data[i], data[minChild]) <= 0: break
    swap(data[i], data[minChild])
    i = minChild
```

**d별 트레이드오프**

| d | siftUp | siftDown | 적합한 워크로드 |
|---|--------|----------|----------------|
| 2 | O(log₂ n) | O(2 log₂ n) | 범용 |
| 4 | O(log₄ n) | O(4 log₄ n) | push 많을 때 |
| 8 | O(log₈ n) | O(8 log₈ n) | 극단적 push 중심 |

## 예시

```ts
// d=4 캐시 친화적 힙
const heap = new DaryHeap<number>(4, (a, b) => a - b);
heap.push(10);
heap.push(5);
heap.push(15);
heap.push(3);

console.log(heap.peek()); // 3
console.log(heap.pop());  // 3
console.log(heap.pop());  // 5
console.log(heap.size()); // 2

// 최대 힙 (역순 비교자)
const maxHeap = new DaryHeap<number>(2, (a, b) => b - a);
maxHeap.push(1);
maxHeap.push(9);
maxHeap.push(5);
console.log(maxHeap.pop()); // 9
```
