# MinHeap (최소 힙)

## 한 줄 요약
> 비교 함수를 받는 제네릭 최소 힙을 구현하여, 항상 우선순위가 가장 높은 원소를 O(log n)으로 삽입·추출한다.

## 스토리

병원 응급실 트리아지(triage) 시스템을 개발 중입니다. 응급실에는 매 분 새 환자가 도착하고, 의사는 항상 **긴급도가 가장 높은 환자**부터 치료해야 합니다. 긴급도는 1(즉각 처치)부터 5(경미)까지의 숫자로 표시됩니다.

처음에는 배열에 환자를 추가하고, 치료할 때마다 배열 전체를 정렬하거나 순회해서 최솟값을 찾았습니다. 환자가 100명이면 매번 O(n) 탐색이 필요해 응급 대응이 늦어졌습니다.

해결책은 최소 힙입니다. 새 환자가 도착할 때 O(log n) 삽입, 다음 치료 환자를 꺼낼 때 O(log n) 추출로, 항상 우선순위 큐의 맨 위에 긴급도 최솟값이 유지됩니다. 배열 기반 완전 이진 트리로 구현하면 추가 포인터 없이 인덱스 계산만으로 부모·자식 노드에 O(1) 접근이 가능합니다.

## 함수 인터페이스

```ts
export class MinHeap<T> {
  constructor(compare: (a: T, b: T) => number)
  // compare(a, b) < 0 이면 a가 b보다 우선순위 높음 (a가 먼저 pop 됨)

  push(item: T): void       // O(log n), 힙에 원소 삽입
  pop(): T | undefined      // O(log n), 최상위(최소) 원소 제거 후 반환
  peek(): T | undefined     // O(1),     최상위 원소를 제거하지 않고 반환
  size(): number            // O(1)
  isEmpty(): boolean        // O(1)
}
```

| 메서드 | 설명 |
|--------|------|
| `constructor(compare)` | `compare(a, b) < 0`이면 a가 b보다 높은 우선순위. `(a, b) => a - b`면 오름차순 최소 힙 |
| `push(item)` | 아이템을 힙에 삽입하고 힙 속성을 복원한다(siftUp) |
| `pop()` | 최상위 아이템을 제거하고 반환한다(siftDown). 비어있으면 `undefined` |
| `peek()` | 최상위 아이템을 반환하되 제거하지 않는다. 비어있으면 `undefined` |
| `size()` | 현재 저장된 아이템 개수를 반환한다 |
| `isEmpty()` | 힙이 비어있으면 `true` |

## 제약 조건

- `compare` 함수는 순수 함수(side-effect 없음)임이 보장된다
- `compare`는 전순서(total order)를 만족한다: 반사성, 비대칭성, 추이성
- 힙 크기: 0 ≤ n ≤ 10⁵
- 아이템 타입: 제네릭 `T`
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

배열 기반 완전 이진 트리에서 인덱스 관계:
- 부모: `⌊(i - 1) / 2⌋`
- 왼쪽 자식: `2 * i + 1`
- 오른쪽 자식: `2 * i + 2`

**힙 속성(Min-Heap property)**: 모든 노드의 값은 자식 노드의 값보다 우선순위가 높거나 같아야 한다. 즉, `compare(parent, child) <= 0`.

**siftUp**: 새 원소를 배열 끝에 추가한 뒤, 부모보다 우선순위가 높으면 교환을 반복하며 올라간다.

**siftDown**: 루트를 제거하고 배열 마지막 원소를 루트 자리에 놓은 뒤, 두 자식 중 우선순위가 높은 것과 교환을 반복하며 내려간다.

## 예시

```ts
// 숫자 최소 힙
const heap = new MinHeap<number>((a, b) => a - b);

heap.push(5);
heap.push(1);
heap.push(3);
heap.peek();   // 1  (최솟값, 제거 안 함)
heap.size();   // 3

heap.pop();    // 1  (최솟값 제거)
heap.pop();    // 3
heap.pop();    // 5
heap.pop();    // undefined (빈 힙)

// 객체 우선순위 큐 (긴급도 오름차순)
type Patient = { name: string; urgency: number };
const er = new MinHeap<Patient>((a, b) => a.urgency - b.urgency);

er.push({ name: "Kim", urgency: 3 });
er.push({ name: "Lee", urgency: 1 });
er.push({ name: "Park", urgency: 5 });

er.pop();   // { name: "Lee", urgency: 1 }  — 가장 긴급한 환자
er.pop();   // { name: "Kim", urgency: 3 }
er.pop();   // { name: "Park", urgency: 5 }
```
