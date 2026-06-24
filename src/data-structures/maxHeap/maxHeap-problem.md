# MaxHeap (최대 힙)

## 한 줄 요약
> 사용자 정의 비교 함수로 "최댓값"을 정의하는 제네릭 최대 힙 — 실시간 Top-K 스트림 처리에 최적

## 스토리

실시간 광고 입찰 시스템을 구축 중인 당신은 매 밀리초마다 수십만 건의 입찰가가 들어오는 스트림을 처리해야 합니다.
광고주들은 "현재 상위 K개 입찰가"를 즉시 알고 싶어 합니다.
전체를 정렬하거나 매번 선형 탐색하면 스트림 속도를 따라갈 수 없습니다.

최대 힙(MaxHeap)은 루트에 항상 최댓값이 위치하는 완전 이진 트리입니다.
새 입찰가가 들어오면 O(log n)에 삽입하고, 최고 입찰가는 O(1)에 조회할 수 있습니다.
Top-K를 구할 때는 K번 pop하면 되므로 O(K log n)이면 충분합니다.

MinHeap과 구조는 동일하지만 비교 방향이 반전됩니다.
제네릭 비교 함수를 주입받아 숫자 크기, 객체의 특정 필드, 복잡한 가중치 등 임의의 "최댓값" 기준을 지정할 수 있습니다.

## 함수 인터페이스

```ts
export class MaxHeap<T> {
  constructor(compare: (a: T, b: T) => number)
  push(item: T): void
  pop(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
}
```

| 메서드 | 설명 | 반환값 | 시간복잡도 |
|--------|------|--------|-----------|
| `constructor(compare)` | 비교 함수로 최대 힙 생성 | — | O(1) |
| `push(item)` | 원소 삽입 | `void` | O(log n) |
| `pop()` | 최댓값 원소 제거 및 반환 | `T \| undefined` | O(log n) |
| `peek()` | 최댓값 원소 조회 (제거 안 함) | `T \| undefined` | O(1) |
| `size()` | 현재 원소 수 | `number` | O(1) |
| `isEmpty()` | 비어있으면 true | `boolean` | O(1) |

**비교 함수 규약 (MaxHeap):**
- `compare(a, b) > 0` → a가 b보다 크다 (a가 먼저 pop됨)
- `compare(a, b) < 0` → b가 a보다 크다
- `compare(a, b) === 0` → 동등한 크기

**PriorityQueue와의 차이:**
- PriorityQueue: `compare(a,b) < 0`이면 a가 높은 우선순위 (MinHeap 기본)
- MaxHeap: `compare(a,b) > 0`이면 a가 더 큰 값 (MaxHeap)
- 내부적으로 동일한 힙 구조이며, 비교 방향만 다르다

## 제약 조건

- 비교 함수는 전순서(total order)를 만족해야 한다
- `n <= 10^5`
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

MaxHeap을 구현하라.

**힙 속성 (MaxHeap):** 모든 부모 노드는 자식 노드보다 크거나 같다.
즉, `compare(heap[parent], heap[child]) >= 0`이 항상 성립한다.

**배열 기반 완전 이진 트리 인덱싱:**
```
부모(i):        Math.floor((i - 1) / 2)
왼쪽 자식(i):  2 * i + 1
오른쪽 자식(i): 2 * i + 2
```

**push (bubbleUp):**
1. 원소를 배열 끝에 추가
2. 부모보다 크면 부모와 swap
3. 힙 속성이 만족될 때까지 반복

**pop (siftDown):**
1. 루트(최댓값) 저장
2. 마지막 원소를 루트로 이동
3. 두 자식 중 더 큰 자식과 swap
4. 힙 속성이 만족될 때까지 반복

## 예시

```ts
// 숫자 최댓값 우선
const heap = new MaxHeap<number>((a, b) => a - b);
heap.push(3);
heap.push(9);
heap.push(1);
heap.push(7);
heap.peek();  // => 9
heap.pop();   // => 9
heap.pop();   // => 7
heap.pop();   // => 3
heap.pop();   // => 1

// Top-K 추출
const stream = [3, 1, 4, 1, 5, 9, 2, 6, 5];
const maxHeap = new MaxHeap<number>((a, b) => a - b);
stream.forEach((n) => maxHeap.push(n));
// Top-3 추출
const top3 = [maxHeap.pop(), maxHeap.pop(), maxHeap.pop()];
// => [9, 6, 5]

// 게임 점수 랭킹
type Player = { name: string; score: number };
const ranking = new MaxHeap<Player>((a, b) => a.score - b.score);
ranking.push({ name: "Alice", score: 80 });
ranking.push({ name: "Bob", score: 95 });
ranking.pop(); // => { name: "Bob", score: 95 } — 1등
```
