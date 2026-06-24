# UnrolledLinkedList (펼침 연결 리스트)

## 한 줄 요약

> 각 노드가 원소를 하나씩이 아니라 고정 크기 배열(청크)로 묶어 저장하는 연결 리스트 — 캐시 지역성을 높이고 포인터 오버헤드를 줄인다.

## 스토리

수십만 줄짜리 로그 파일을 메모리에 올려 편집하는 프로그램을 작성한다고 상상해 보세요. 단순 연결 리스트로 구현하면 각 줄마다 별도의 노드 객체와 포인터가 생기므로 메모리 단편화가 심하고, CPU 캐시 미스가 자주 발생합니다.

UnrolledLinkedList는 이 문제를 해결하기 위해 각 노드(청크)에 여러 원소를 연속된 배열로 저장합니다. 덕분에 청크 안을 순회할 때는 캐시 친화적인 선형 접근이 가능하고, 청크 간 이동에만 포인터를 사용합니다. 노드 수가 `n/chunkSize`로 줄어들므로 인덱스 기반 접근도 O(√n)에 가능합니다.

현업에서는 대용량 텍스트 에디터의 줄 버퍼, 데이터베이스의 B-Tree 리프 페이지 구현 등에 유사한 아이디어가 활용됩니다.

## 함수 인터페이스

```ts
export class UnrolledLinkedList<T> {
  constructor(chunkSize: number = 16)
  push(item: T): void
  pop(): T | undefined
  get(index: number): T | undefined
  size(): number
  toArray(): T[]
}
```

| 메서드 | 설명 | 시간복잡도 |
|--------|------|-----------|
| `constructor(chunkSize)` | 청크 크기를 지정해 리스트를 생성한다 | O(1) |
| `push(item)` | 맨 끝에 원소를 추가한다. tail 청크에 여유가 있으면 바로 삽입, 없으면 새 청크를 생성한다 | O(1) amortized |
| `pop()` | 맨 끝 원소를 제거하고 반환한다. 빈 청크가 생기면 tail을 이전 청크로 갱신한다 | O(1) amortized |
| `get(index)` | 0-based index에 해당하는 원소를 반환한다 | O(√n) |
| `size()` | 전체 원소 개수를 반환한다 | O(1) |
| `toArray()` | 모든 원소를 순서대로 담은 배열을 반환한다 | O(n) |

## 제약 조건

- `chunkSize`는 1 이상의 정수여야 한다.
- `get(index)`에서 index가 0 미만이거나 size() 이상이면 `undefined`를 반환한다.
- `pop()`에서 리스트가 비어 있으면 `undefined`를 반환한다.
- 내부 연결 리스트 구조는 단방향(singly linked)으로 구현한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

청크(노드) 구조는 아래와 같습니다:

```
[ items: T[], next: Chunk | null ]
```

- `head`: 첫 번째 청크를 가리키는 포인터
- `tail`: 마지막 청크를 가리키는 포인터 (push/pop 효율화를 위해 유지)
- `_size`: 전체 원소 수 (get과 size()에서 활용)

`push` 구현 시 주의할 점: tail 청크의 items 배열 길이가 `chunkSize`에 도달하면 새 청크를 생성하고 tail을 갱신합니다.

`pop` 구현 시 주의할 점: tail 청크의 마지막 원소를 제거한 후, tail 청크가 비어 있으면 head부터 순회하여 이전 청크를 새 tail로 지정합니다. (단방향 연결 리스트이므로 O(p) 탐색 필요)

## 예시

```ts
const list = new UnrolledLinkedList<number>(4);

list.push(1); list.push(2); list.push(3); list.push(4);
// 청크 1: [1, 2, 3, 4]

list.push(5);
// 청크 1: [1, 2, 3, 4] → 청크 2: [5]

console.log(list.get(4)); // 5  (두 번째 청크 첫 번째 원소)
console.log(list.size()); // 5
console.log(list.toArray()); // [1, 2, 3, 4, 5]

list.pop(); // 5 반환
// 청크 2가 비어 tail이 청크 1로 돌아옴
console.log(list.size()); // 4
```
