# SinglyLinkedList (단방향 연결 리스트)

## 한 줄 요약
> 각 노드가 다음 노드만 참조하는 단방향 연결 리스트를 구현하라.

## 스토리

당신은 브라우저의 방문 히스토리 기능을 개발하고 있다. 사용자는 페이지를 방문할 때마다 히스토리에 추가되고, "뒤로 가기" 버튼을 누르면 가장 최근 페이지가 제거된다. 이 기능에는 양방향 순회가 필요 없고, 앞/뒤 삽입과 앞에서 제거만 있으면 충분하다.

이중 연결 리스트(doubly linked list)를 쓰면 메모리가 두 배로 들기 때문에, 방문 페이지 수가 수백만 건에 달하는 대용량 환경에서는 부담이 크다. 단방향 연결 리스트는 각 노드에 `next` 포인터 하나만 저장하므로 메모리를 절반으로 줄일 수 있다.

`tail` 포인터를 별도로 유지하면 `append`를 O(n)이 아닌 O(1)로 만들 수 있다. 이 최적화가 핵심 구현 디테일이다.

## 함수 인터페이스

```ts
export class ListNode<T> {
  value: T;
  next: ListNode<T> | null;
  constructor(value: T);
}

export class SinglyLinkedList<T> {
  prepend(value: T): ListNode<T>;     // O(1) — 맨 앞 삽입
  append(value: T): ListNode<T>;      // O(1) — 맨 뒤 삽입 (tail 포인터 이용)
  removeFirst(): T | undefined;       // O(1) — 맨 앞 제거
  find(value: T): ListNode<T> | null; // O(n) — 선형 탐색
  toArray(): T[];                     // O(n) — 전체 순회
  size(): number;                     // O(1) — 현재 개수
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `prepend(value)` | 리스트 맨 앞에 노드 삽입 | 삽입된 `ListNode<T>` |
| `append(value)` | 리스트 맨 뒤에 노드 삽입 | 삽입된 `ListNode<T>` |
| `removeFirst()` | 맨 앞 노드 제거 후 값 반환 | `T \| undefined` |
| `find(value)` | 값 일치 첫 노드 탐색 | `ListNode<T> \| null` |
| `toArray()` | head→tail 순 배열 | `T[]` |
| `size()` | 노드 개수 | `number` |

## 제약 조건

- $n \leq 10^5$ (노드 개수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `find`는 참조 동일성(===)으로 비교한다
- 빈 리스트에서 `removeFirst`를 호출하면 `undefined`를 반환한다

## 문제 상세

단방향 연결 리스트는 각 노드(ListNode)가 `value`와 `next` 두 필드만 갖는 선형 자료구조다. 이중 연결 리스트와 달리 `prev` 포인터가 없어 역방향 순회는 불가능하지만, 메모리 효율이 높고 앞쪽 삽입/제거가 O(1)이다.

**tail 포인터 최적화**: head만 유지하면 `append`가 O(n)이 된다. `tail` 포인터를 별도로 관리하면 O(1)로 줄일 수 있다. 단, 노드 제거 후 `tail`이 무효해지지 않도록 상태를 정확히 업데이트해야 한다.

**빈 리스트 처리**: `head`와 `tail`이 모두 `null`인 상태에서 `prepend`/`append`를 하면 둘 다 새 노드를 가리켜야 한다. 단일 노드를 제거하면 둘 다 다시 `null`이 된다.

## 예시

```ts
const list = new SinglyLinkedList<number>();

list.append(1);   // [1]
list.append(2);   // [1, 2]
list.append(3);   // [1, 2, 3]
list.prepend(0);  // [0, 1, 2, 3]

list.toArray();   // [0, 1, 2, 3]
list.size();      // 4

list.find(2);     // ListNode { value: 2, next: ListNode { value: 3, ... } }
list.find(99);    // null

list.removeFirst(); // 0
list.toArray();     // [1, 2, 3]
list.size();        // 3
```
