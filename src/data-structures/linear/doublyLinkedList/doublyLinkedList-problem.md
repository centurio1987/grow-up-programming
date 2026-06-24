# DoublyLinkedList (이중 연결 리스트)

## 한 줄 요약
> 앞뒤 노드 포인터를 모두 갖는 이중 연결 리스트를 구현하여, 노드 참조만 있으면 삽입·삭제를 O(1)에 처리한다.

## 스토리

음악 스트리밍 앱을 개발 중인 당신은 플레이리스트 기능을 맡았습니다. 사용자는 재생 중인 곡을 즉시 제거하거나, 현재 곡의 바로 다음 위치에 새 곡을 끼워 넣을 수 있어야 합니다. "이전 곡"과 "다음 곡"으로도 자유롭게 이동할 수 있어야 하죠.

처음에는 배열로 구현했습니다. 하지만 곡을 중간에서 삭제하거나 삽입할 때마다 이후 요소를 전부 한 칸씩 밀어야 해서 O(n) 시간이 걸렸습니다. 1만 곡짜리 플레이리스트에서 중간 삭제를 반복하면 앱이 버벅이기 시작했습니다.

해결책은 이중 연결 리스트입니다. 각 곡(노드)이 이전 곡과 다음 곡을 직접 가리키는 포인터를 갖고 있으면, 현재 재생 중인 노드 참조만 있으면 삭제와 삽입이 O(1)에 끝납니다. 배열처럼 인덱스를 순회할 필요가 없습니다.

## 함수 인터페이스

```ts
export class ListNode<T> {
  value: T;
  prev: ListNode<T> | null;
  next: ListNode<T> | null;
}

export class DoublyLinkedList<T> {
  prepend(value: T): ListNode<T>                          // O(1)
  append(value: T): ListNode<T>                           // O(1)
  insertAfter(node: ListNode<T>, value: T): ListNode<T>  // O(1)
  remove(node: ListNode<T>): void                         // O(1)
  toArray(): T[]                                           // O(n)
  size(): number                                           // O(1)
}
```

| 메서드 | 설명 |
|--------|------|
| `prepend(value)` | 리스트 맨 앞에 노드를 추가하고 새 노드를 반환한다 |
| `append(value)` | 리스트 맨 뒤에 노드를 추가하고 새 노드를 반환한다 |
| `insertAfter(node, value)` | 주어진 노드 바로 뒤에 새 노드를 삽입하고 반환한다. 노드는 반드시 이 리스트에 속해야 한다 |
| `remove(node)` | 주어진 노드를 리스트에서 제거한다. 노드는 반드시 이 리스트에 속해야 한다 |
| `toArray()` | head → tail 순서로 모든 값을 배열로 반환한다 |
| `size()` | 현재 노드 개수를 반환한다 |

## 제약 조건

- `insertAfter`와 `remove`의 `node` 파라미터는 항상 해당 리스트에 속한 유효한 노드임이 보장된다
- 리스트 크기: 0 ≤ n ≤ 10⁵
- 값 타입: 제네릭 `T` (비교 불필요, 저장만)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

`ListNode<T>` 클래스는 `value`, `prev`, `next` 세 필드를 갖습니다. `DoublyLinkedList<T>`는 내부적으로 `head`와 `tail` 센티넬 포인터(혹은 실제 노드 참조)를 유지하여 경계 케이스(빈 리스트, 단일 노드)를 처리해야 합니다.

**핵심 불변식**: 리스트의 모든 노드 `n`에 대해 다음이 성립해야 한다.
- `n.next !== null` 이면 `n.next.prev === n`
- `n.prev !== null` 이면 `n.prev.next === n`

## 예시

```ts
const list = new DoublyLinkedList<string>();

const a = list.append("A");   // [A]
const b = list.append("B");   // [A, B]
const c = list.append("C");   // [A, B, C]

list.toArray();   // ["A", "B", "C"]
list.size();      // 3

const d = list.insertAfter(a, "D");  // [A, D, B, C]
list.toArray();   // ["A", "D", "B", "C"]

list.remove(b);   // [A, D, C]
list.toArray();   // ["A", "D", "C"]

list.prepend("Z");  // [Z, A, D, C]
list.toArray();     // ["Z", "A", "D", "C"]
list.size();        // 4
```
