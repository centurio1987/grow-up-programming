# PriorityQueue (우선순위 큐)

## 한 줄 요약
> 사용자 정의 비교 함수로 임의의 우선순위를 지원하는 MinHeap 기반 제네릭 우선순위 큐

## 스토리

지도 앱의 길찾기 엔진을 구현 중인 당신은 다익스트라 알고리즘으로 최단 경로를 구해야 합니다.
다익스트라는 매 단계마다 "아직 방문하지 않은 노드 중 현재 거리가 가장 짧은 노드"를 선택해야 합니다.
단순 배열에서 최솟값을 찾으면 O(V²)가 되지만, 우선순위 큐를 사용하면 O((V+E) log V)로 개선됩니다.

우선순위 큐는 힙(Heap) 자료구조를 기반으로 합니다.
완전 이진 트리 형태의 배열로 구현되며, 부모 노드가 자식 노드보다 항상 우선순위가 높은 힙 속성을 유지합니다.
삽입 시 트리 아래에서 위로 bubbleUp, 추출 시 루트를 제거하고 마지막 원소를 루트로 올린 뒤 siftDown으로 힙 속성을 복원합니다.

제네릭 비교 함수를 주입받아 숫자 최솟값, 문자열 사전순, 복잡한 객체의 임의 우선순위를 모두 지원합니다.

## 함수 인터페이스

```ts
export class PriorityQueue<T> {
  constructor(compare: (a: T, b: T) => number)
  enqueue(item: T): void
  dequeue(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
}
```

| 메서드 | 설명 | 반환값 | 시간복잡도 |
|--------|------|--------|-----------|
| `constructor(compare)` | 비교 함수로 우선순위 큐 생성 | — | O(1) |
| `enqueue(item)` | 원소 삽입 | `void` | O(log n) |
| `dequeue()` | 최우선 원소 제거 및 반환 | `T \| undefined` | O(log n) |
| `peek()` | 최우선 원소 조회 (제거 안 함) | `T \| undefined` | O(1) |
| `size()` | 현재 원소 수 | `number` | O(1) |
| `isEmpty()` | 비어있으면 true | `boolean` | O(1) |

**비교 함수 규약:**
- `compare(a, b) < 0` → a가 b보다 높은 우선순위 (먼저 dequeue됨)
- `compare(a, b) > 0` → b가 a보다 높은 우선순위
- `compare(a, b) === 0` → 동등한 우선순위

## 제약 조건

- 비교 함수는 전순서(total order)를 만족해야 한다
- `n <= 10^5`
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

MinHeap 기반 우선순위 큐를 구현하라.

**힙 속성(Heap Property):** 모든 부모 노드는 자식 노드보다 우선순위가 높거나 같다.

**배열 기반 완전 이진 트리:**
- 인덱스 `i`의 부모: `Math.floor((i - 1) / 2)`
- 인덱스 `i`의 왼쪽 자식: `2 * i + 1`
- 인덱스 `i`의 오른쪽 자식: `2 * i + 2`

**enqueue (bubbleUp):**
1. 원소를 배열 끝에 추가
2. 부모보다 우선순위가 높으면 부모와 swap
3. 힙 속성이 만족될 때까지 반복

**dequeue (siftDown):**
1. 루트(최우선 원소) 저장
2. 마지막 원소를 루트로 이동
3. 두 자식 중 더 높은 우선순위 자식과 swap
4. 힙 속성이 만족될 때까지 반복

## 예시

```ts
// 숫자 최솟값 우선
const pq = new PriorityQueue<number>((a, b) => a - b);
pq.enqueue(5);
pq.enqueue(1);
pq.enqueue(3);
pq.peek();    // => 1
pq.dequeue(); // => 1
pq.dequeue(); // => 3
pq.dequeue(); // => 5

// 객체: 다익스트라 노드 (거리 기준 최솟값)
type Node = { id: number; dist: number };
const dijkstraPQ = new PriorityQueue<Node>((a, b) => a.dist - b.dist);
dijkstraPQ.enqueue({ id: 3, dist: 10 });
dijkstraPQ.enqueue({ id: 1, dist: 2 });
dijkstraPQ.dequeue(); // => { id: 1, dist: 2 }

// 최댓값 우선 (비교 함수 반전)
const maxPQ = new PriorityQueue<number>((a, b) => b - a);
maxPQ.enqueue(3);
maxPQ.enqueue(9);
maxPQ.dequeue(); // => 9
```
