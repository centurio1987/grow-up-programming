# CircularBuffer

## 한 줄 요약
> 고정 용량의 링 버퍼를 구현하라 — 꽉 차면 가장 오래된 항목을 덮어쓴다.

## 스토리

분산 로그 수집 시스템에서 각 서버는 초당 수천 건의 로그를 생성한다. 전체 로그를 영구 저장하기엔 디스크가 부족하고, 실시간 분석에는 최신 N개만 있으면 충분하다.

엔지니어 수빈은 처음에 단순 배열에 로그를 쌓고 길이가 N을 초과하면 `splice(0, 1)`로 앞을 잘랐다. 기능은 맞았지만 splice가 O(n) 시프트를 일으켜 CPU 사용률이 급등했다.

해결책은 원형 버퍼(Ring Buffer)였다. 고정 크기 배열과 두 포인터(`head`, `tail`)만으로 최신 N개를 O(1)에 유지할 수 있다. `tail`이 배열 끝에 닿으면 다시 0으로 돌아가 기존 공간을 재사용한다. 꽉 찬 상태에서 새 로그가 오면 `head`가 가리키는 가장 오래된 로그 자리에 덮어쓰고 `head`를 하나 앞으로 이동시킨다. 이렇게 하면 쓰기 1번에 항상 O(1), 어떤 사이즈의 로그 스트림도 메모리 사용량은 고정 N이다.

## 함수 인터페이스

```ts
export class CircularBuffer<T> {
  constructor(capacity: number)  // 버퍼 최대 용량 설정, capacity >= 1
  write(item: T): void           // 뒤에 추가, 꽉 차면 가장 오래된 항목 덮어씀
  read(): T | undefined          // 가장 오래된 항목 제거 후 반환, 비어있으면 undefined
  peek(): T | undefined          // 가장 오래된 항목 조회 (제거 없음), 비어있으면 undefined
  isFull(): boolean              // 꽉 찼으면 true
  isEmpty(): boolean             // 비어있으면 true
  size(): number                 // 현재 아이템 개수
}
```

| 메서드 | 설명 | 시간복잡도 |
|--------|------|-----------|
| `constructor(capacity)` | 용량 초기화 | O(capacity) |
| `write(item)` | 새 항목 쓰기, 오버플로우 시 덮어씀 | O(1) |
| `read()` | 가장 오래된 항목 제거 후 반환 | O(1) |
| `peek()` | 가장 오래된 항목 조회 | O(1) |
| `isFull()` | 꽉 찼으면 `true` | O(1) |
| `isEmpty()` | 비어있으면 `true` | O(1) |
| `size()` | 현재 원소 수 | O(1) |

## 제약 조건

- $1 \leq \text{capacity} \leq 10^6$
- $1 \leq n \leq 10^6$ (총 연산 횟수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 내부 배열은 반드시 **고정 크기(capacity)**를 사용해야 한다
- 동적 크기 배열(`push`, `splice` 등) 사용 금지

## 문제 상세

원형 버퍼는 두 포인터 `head`(읽을 위치)와 `tail`(쓸 위치)로 동작한다.

$$\text{size} = \text{(isFull)} ? \text{capacity} : (\text{tail} - \text{head} + \text{capacity}) \bmod \text{capacity}$$

**write 동작**:
- 꽉 차지 않은 경우: `buf[tail] = item`, `tail = (tail + 1) % capacity`, `count++`
- 꽉 찬 경우: `buf[tail] = item`, `tail = (tail + 1) % capacity`, `head = (head + 1) % capacity` (오래된 항목 자동 제거)

**read 동작**:
- 비어있으면 `undefined`
- 아니면: `x = buf[head]`, `head = (head + 1) % capacity`, `count--`, return x

## 예시

```ts
const buf = new CircularBuffer<number>(3);

buf.write(1);
buf.write(2);
buf.write(3);

console.log(buf.isFull());  // true
console.log(buf.peek());    // 1 (가장 오래된)

buf.write(4);               // 꽉 찼으므로 1을 덮어씀
console.log(buf.peek());    // 2 (이제 가장 오래된)
console.log(buf.read());    // 2 (제거)
console.log(buf.read());    // 3
console.log(buf.size());    // 1
console.log(buf.read());    // 4
console.log(buf.isEmpty()); // true
console.log(buf.read());    // undefined
```
