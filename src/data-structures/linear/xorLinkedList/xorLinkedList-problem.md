# XorLinkedList (XOR 연결 리스트)

## 한 줄 요약
> prev와 next 두 포인터 대신 XOR 하나로 양방향 순회가 가능한 연결 리스트를 구현하라.

## 스토리

임베디드 시스템의 센서 로그 모듈을 개발하는 중이다. 메모리가 수 KB밖에 없어서 이중 연결 리스트의 각 노드가 `prev`, `next` 두 포인터를 갖는 구조를 쓸 수 없다. 그런데 로그를 앞→뒤(최신 순)와 뒤→앞(역순) 모두 순회해야 한다.

XOR 연결 리스트는 이 딜레마를 수학 트릭으로 해결한다. 각 노드에 `xorId = prevId XOR nextId`만 저장한다. 순방향 순회 시 `nextId = xorId XOR prevId`, 역방향 순회 시 `prevId = xorId XOR nextId`로 양방향 모두 계산 가능하다.

JavaScript에는 C의 포인터 산술이 없어 실제로 주소를 XOR할 수 없다. 그러나 Map으로 노드 ID 테이블을 만들고 ID를 포인터처럼 사용하면 동일한 개념을 시뮬레이션할 수 있다.

## 함수 인터페이스

```ts
export class XorNode {
  id: number;      // 노드 고유 ID (1부터 시작, 0은 null 센티넬)
  value: number;
  xorId: number;   // prevId XOR nextId
  constructor(id: number, value: number);
}

export class XorLinkedList {
  append(value: number): void;        // O(1) — 맨 뒤 삽입
  toArray(): number[];                // O(n) — head→tail 순서
  toArrayReverse(): number[];         // O(n) — tail→head 순서
  size(): number;                     // O(1) — 노드 개수
}
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `append(value)` | 맨 뒤에 노드 삽입 | `void` |
| `toArray()` | 순방향 배열 | `number[]` |
| `toArrayReverse()` | 역방향 배열 | `number[]` |
| `size()` | 노드 개수 | `number` |

## 제약 조건

- $n \leq 10^4$ (노드 개수, XOR 시뮬레이션 한계 고려)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 값의 범위: `number` 전체 (음수, 0 포함)
- ID `0`은 `null` 포인터 역할을 한다 (센티넬)
- XOR 연산은 비트 연산자(`^`)를 사용한다

## 문제 상세

**XOR 연산의 핵심 성질**:
```
A XOR A = 0
A XOR 0 = A
(A XOR B) XOR A = B
```

이 성질을 이용해:
- `xorId = prevId ^ nextId`
- `nextId = xorId ^ prevId`  (순방향 이동)
- `prevId = xorId ^ nextId`  (역방향 이동)

**append 알고리즘**:
1. 새 노드 생성 (id = nextId++)
2. 현재 tail의 `xorId ^= 새_노드_id` (새 노드를 next로 등록)
3. 새 노드의 `xorId = tailId ^ 0` (prev=tail, next=null)
4. tailId = 새 노드 id

**순방향 순회 (toArray)**:
```
prevId = 0, currId = headId
while currId != 0:
  node = store[currId]
  result.push(node.value)
  nextId = node.xorId ^ prevId
  prevId = currId
  currId = nextId
```

**ID 0은 null**: C에서 NULL 포인터(주소 0)를 XOR 기준점으로 쓰는 것과 동일한 아이디어. 노드 ID는 1부터 시작해 충돌을 방지한다.

## 예시

```ts
const list = new XorLinkedList();

list.append(10); // 내부: node(id=1, value=10, xorId=0^0=0)
list.append(20); // 내부: node(id=2, value=20, xorId=1^0=1)
                 //        node(id=1).xorId 갱신: 0^2=2
list.append(30); // 내부: node(id=3, value=30, xorId=2^0=2)
                 //        node(id=2).xorId 갱신: 1^3=2→3이 되어야...

list.size();           // 3
list.toArray();        // [10, 20, 30]
list.toArrayReverse(); // [30, 20, 10]
```
