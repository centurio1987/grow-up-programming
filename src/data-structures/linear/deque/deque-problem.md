# Deque

## 한 줄 요약
> 양쪽 끝에서 O(1) 삽입/삭제가 가능한 Double-Ended Queue(덱)를 구현하라.

## 스토리

실시간 서버 모니터링 시스템에서 지난 K초 동안의 최대 CPU 사용률을 매 초마다 보고해야 한다. 슬라이딩 윈도우 문제다.

시니어 개발자 민준은 처음에 단순히 윈도우 내 배열 전체를 매 초마다 스캔했다. K=3600(1시간 윈도우)이면 매 초 3600번 비교 → 하루 24시간이면 약 3억 번 연산. 서버 CPU가 모니터링 프로그램 때문에 과부하가 걸리는 아이러니한 상황이 발생했다.

해결책은 단조 감소 덱(Monotonic Deque)이었다. 덱의 앞에서는 윈도우를 벗어난 오래된 항목을 제거하고, 뒤에서는 현재 값보다 작은 무의미한 항목을 제거한다. 덱의 앞이 항상 현재 윈도우의 최댓값이 된다. 이렇게 하면 각 원소가 덱에 최대 1번 들어오고 1번 나가므로 전체 O(n) — 매 초 O(1) 조회가 가능하다. 이 패턴을 쓰려면 앞뒤 양쪽에서 O(1) 삽입/삭제가 가능한 덱이 필수다.

## 함수 인터페이스

```ts
export class Deque<T> {
  pushFront(item: T): void   // 덱 앞에 추가, amortized O(1)
  pushBack(item: T): void    // 덱 뒤에 추가, amortized O(1)
  popFront(): T | undefined  // 앞 제거 후 반환, 비어있으면 undefined
  popBack(): T | undefined   // 뒤 제거 후 반환, 비어있으면 undefined
  peekFront(): T | undefined // 앞 조회 (제거 없음), 비어있으면 undefined
  peekBack(): T | undefined  // 뒤 조회 (제거 없음), 비어있으면 undefined
  isEmpty(): boolean         // 비어있으면 true
  size(): number             // 현재 아이템 개수
}
```

| 메서드 | 설명 | 시간복잡도 |
|--------|------|-----------|
| `pushFront(item)` | 덱 앞에 아이템 추가 | amortized O(1) |
| `pushBack(item)` | 덱 뒤에 아이템 추가 | amortized O(1) |
| `popFront()` | 앞 아이템 제거 후 반환 | amortized O(1) |
| `popBack()` | 뒤 아이템 제거 후 반환 | amortized O(1) |
| `peekFront()` | 앞 아이템 조회 (제거 없음) | O(1) |
| `peekBack()` | 뒤 아이템 조회 (제거 없음) | O(1) |
| `isEmpty()` | 비어있으면 `true` | O(1) |
| `size()` | 원소 수 반환 | O(1) |

## 제약 조건

- $1 \leq n \leq 10^6$ (총 연산 횟수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `pushFront`, `popFront`에서 `Array.unshift()` / `Array.shift()` 직접 사용 금지 (O(n))
- 모든 연산이 amortized O(1)을 달성해야 한다

## 문제 상세

덱은 스택과 큐를 일반화한 자료구조다. 앞뒤 양쪽에서 삽입/삭제가 모두 가능하다.

JS 배열을 그대로 쓰면 `push` / `pop`은 O(1)이지만 `unshift` / `shift`는 O(n)이다. 순수 배열 두 개(front 스택 + back 스택)를 조합하거나, 이중 연결 리스트를 사용하면 모든 연산을 O(1)로 구현할 수 있다.

두 배열 방식(front 배열은 역순 저장):

$$\text{논리 순서} = \text{front}[\ldots \text{reversed}] + \text{back}[\ldots]$$

`popFront`는 `front`가 비어있으면 `back`의 일부를 `front`로 이동시킨다. 이 재조정은 상각하면 원소당 O(1)이다.

## 예시

```ts
const dq = new Deque<number>();
dq.pushBack(1);
dq.pushBack(2);
dq.pushFront(0);

console.log(dq.peekFront()); // 0
console.log(dq.peekBack());  // 2
console.log(dq.popFront());  // 0
console.log(dq.popBack());   // 2
console.log(dq.size());      // 1
console.log(dq.popFront());  // 1
console.log(dq.isEmpty());   // true
console.log(dq.popBack());   // undefined
```
