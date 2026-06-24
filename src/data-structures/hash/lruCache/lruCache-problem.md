# LRUCache (LRU 캐시)

## 한 줄 요약
> HashMap + 이중 연결 리스트를 결합하여, get과 put을 모두 O(1)에 처리하는 LRU(Least Recently Used) 캐시를 구현한다.

## 스토리

글로벌 CDN(콘텐츠 전송 네트워크)을 운영하는 당신은 에지 서버의 페이지 캐시를 담당합니다. 에지 서버는 메모리가 제한되어 있어 최대 `capacity`개의 페이지만 보관할 수 있습니다. 새 페이지를 캐시할 공간이 없을 때는 **가장 오랫동안 사용되지 않은(LRU) 페이지**를 제거해야 합니다.

처음에는 `Map`만 사용했습니다. 하지만 어떤 키가 가장 오래 사용되지 않았는지 추적하려면 사용 시각을 기록하거나 배열을 정렬해야 했고, 이는 O(n)이었습니다. 초당 수만 건의 요청이 들어오는 CDN에서 O(n) 연산은 허용되지 않습니다.

해결책은 **HashMap + DoublyLinkedList** 조합입니다. HashMap은 키로 노드를 O(1)에 조회하고, 이중 연결 리스트는 사용 순서를 O(1)에 갱신합니다. 리스트의 head는 가장 최근 사용(MRU), tail은 가장 오래된 사용(LRU)을 나타냅니다. 용량 초과 시 tail을 제거하면 항상 LRU가 퇴출됩니다.

## 함수 인터페이스

```ts
export class LRUCache {
  constructor(capacity: number)
  // capacity >= 1 보장

  get(key: number): number
  // key가 존재하면 해당 값 반환 및 MRU로 갱신, 없으면 -1 반환

  put(key: number, value: number): void
  // key가 이미 존재하면 값 갱신 후 MRU로 이동
  // 존재하지 않으면 삽입; 용량 초과 시 LRU(가장 오래된 항목) 제거 후 삽입
}
```

| 메서드 | 설명 |
|--------|------|
| `constructor(capacity)` | 최대 저장 용량 설정. `capacity >= 1` 보장 |
| `get(key)` | 값 반환 및 해당 항목을 MRU로 갱신. 없으면 `-1` |
| `put(key, value)` | 삽입 또는 갱신. 용량 초과 시 LRU 자동 제거. 모든 연산 O(1) |

## 제약 조건

- `1 <= capacity <= 3000`
- `0 <= key <= 10⁴`
- `0 <= value <= 10⁵`
- `get`과 `put`을 합쳐 최대 2 × 10⁵번 호출된다
- 모든 연산은 O(1) 평균 시간 복잡도를 만족해야 한다
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**LRU(Least Recently Used) 정책**: 캐시가 가득 찼을 때 "가장 오랫동안 참조되지 않은" 항목을 제거한다. `get`과 `put` 모두 해당 항목을 "최근 사용"으로 갱신한다.

**내부 구조**:
- `map: Map<number, ListNode>` — 키에서 노드로의 O(1) 조회
- 이중 연결 리스트 — 사용 순서 추적; head=MRU, tail=LRU
- 더미(dummy) head/tail 센티넬을 사용하면 경계 케이스 처리가 간단해진다

**핵심 연산 — 노드를 MRU로 이동**:
1. 리스트에서 노드를 제거 (이중 연결 리스트 remove)
2. 노드를 head 바로 다음에 삽입 (이중 연결 리스트 insertAfterHead)

## 예시

```ts
const cache = new LRUCache(3);  // capacity = 3

cache.put(1, 10);  // 캐시: [1:10]          (MRU→LRU: [1])
cache.put(2, 20);  // 캐시: [2:20, 1:10]    ([2, 1])
cache.put(3, 30);  // 캐시: [3:30, 2:20, 1:10] ([3, 2, 1])

cache.get(1);      // 10. 캐시: [1:10, 3:30, 2:20] (1이 MRU로 이동)
cache.put(4, 40);  // 용량 초과 → LRU=2 제거 후 4 삽입
                   // 캐시: [4:40, 1:10, 3:30]

cache.get(2);      // -1 (제거됨)
cache.get(3);      // 30. 캐시: [3:30, 4:40, 1:10]
cache.get(4);      // 40. 캐시: [4:40, 3:30, 1:10]
```
