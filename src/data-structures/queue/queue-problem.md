# Queue

## 한 줄 요약
> 프린터 대기열처럼 먼저 들어온 것이 먼저 나오는 FIFO 자료구조를 구현하라.

## 스토리

사무실 공용 프린터에는 하루에도 수백 건의 인쇄 요청이 쌓인다. 팀원 중 누군가가 문서를 보내면 프린터는 도착한 순서대로 출력해야 한다 — 나중에 보낸 사람이 먼저 뽑히면 불공평하다.

신입 개발자 지수는 프린터 서버 소프트웨어를 작성하게 됐다. 처음엔 JavaScript 배열에 `push()`로 추가하고 `shift()`로 앞을 꺼냈다. 기능은 정상이었지만 요청이 10만 건을 넘어서자 `shift()`가 매번 O(n) 시프트를 일으켜 서버 응답이 수십 초씩 걸리기 시작했다.

지수는 헤드 포인터를 별도로 관리하는 방식으로 전환했다. 배열에서 실제로 원소를 앞으로 당기는 대신 "현재 꺼낼 위치"만 인덱스로 기억하면, dequeue를 O(1)에 처리할 수 있다. 이 방식으로 100만 건의 인쇄 요청도 1초 안에 처리할 수 있게 됐다.

## 함수 인터페이스

```ts
export class Queue<T> {
  enqueue(item: T): void     // 큐 뒤에 아이템 추가, amortized O(1)
  dequeue(): T | undefined   // 큐 앞 아이템 제거 후 반환, 비어있으면 undefined
  front(): T | undefined     // 큐 앞 아이템 제거 없이 반환, 비어있으면 undefined
  isEmpty(): boolean         // 큐가 비어있으면 true
  size(): number             // 현재 아이템 개수 반환
}
```

| 메서드 | 설명 | 시간복잡도 |
|--------|------|-----------|
| `enqueue(item)` | 큐 뒤(rear)에 아이템 추가 | amortized O(1) |
| `dequeue()` | 큐 앞(front)에서 아이템 제거 후 반환 | amortized O(1) |
| `front()` | 큐 앞 아이템 조회 (제거 없음) | O(1) |
| `isEmpty()` | 비어있으면 `true` 반환 | O(1) |
| `size()` | 현재 원소 수 반환 | O(1) |

## 제약 조건

- $1 \leq n \leq 10^6$ (총 연산 횟수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `Array.shift()`를 직접 사용하지 않아야 한다 (O(n) 금지)
- `dequeue()`와 `front()`는 amortized O(1)을 달성해야 한다

## 문제 상세

FIFO(First-In First-Out) 큐를 구현한다. `Array.shift()`는 배열 앞 원소를 제거할 때 나머지를 전부 앞으로 당기므로 O(n)이 된다.

헤드 포인터(`head` 인덱스) 방식을 사용하면 이를 O(1)로 해결할 수 있다:

$$\text{size} = \text{tail} - \text{head}$$

`dequeue()`는 `items[head]`를 반환한 뒤 `head++`만 수행한다. 실제 배열에서 원소를 제거하지 않는다. 단, `head`가 충분히 커지면 가비지 컬렉션이 일어날 수 있도록 일정 주기로 슬라이싱하거나, 두 개의 스택으로 구현하는 방식도 유효하다.

## 예시

```ts
const q = new Queue<number>();
q.enqueue(1);
q.enqueue(2);
q.enqueue(3);

console.log(q.front());    // 1  (제거 없음)
console.log(q.dequeue());  // 1  (제거)
console.log(q.dequeue());  // 2
console.log(q.size());     // 1
console.log(q.isEmpty());  // false
console.log(q.dequeue());  // 3
console.log(q.dequeue());  // undefined (비어있음)
console.log(q.isEmpty());  // true
```
