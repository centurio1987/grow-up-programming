# HashMapOpenAddressing

## 한 줄 요약
> 선형 탐사(linear probing)와 tombstone 삭제 마커를 사용하는 개방 주소 해시맵을 구현하라.

## 스토리

당신은 임베디드 시스템용 캐시를 설계하고 있습니다. 메모리가 제한된 환경에서 해시맵을 사용해야 하는데, 체이닝 방식은 각 버킷마다 동적 배열을 할당해 메모리 파편화와 캐시 미스(cache miss)가 잦습니다.

**개방 주소법(open addressing)**은 모든 항목을 하나의 연속 배열에 저장합니다. 충돌이 발생하면 별도 메모리를 할당하는 대신, 배열 내에서 다음 빈 슬롯을 탐사합니다. 이를 **선형 탐사(linear probing)**라 부릅니다. 배열이 연속 메모리이기 때문에 CPU 캐시 라인에 잘 맞아 캐시 지역성(cache locality)이 뛰어납니다.

그러나 삭제가 문제입니다. 슬롯을 단순히 비우면, 그 슬롯 뒤에 연속 배치된 항목들의 탐사 체인이 끊겨 버립니다. 이를 해결하기 위해 **tombstone** 마커를 씁니다. 삭제된 슬롯에 "이 자리는 비었지만 탐사를 계속하라"는 표식을 남겨, 뒤에 있는 키들을 여전히 찾을 수 있게 합니다.

## 함수 인터페이스

```ts
export class HashMapOpenAddressing<K, V> {
  constructor(initialCapacity: number = 16)
  set(key: K, value: V): void      // O(1) 평균
  get(key: K): V | undefined       // O(1) 평균
  has(key: K): boolean             // O(1) 평균
  delete(key: K): boolean          // tombstone 마커 사용
  size(): number                   // O(1)
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `set(key, value)` | 키-값 쌍 삽입 또는 값 갱신 | `void` |
| `get(key)` | 키에 대응하는 값 조회 | `V \| undefined` |
| `has(key)` | 키 존재 여부 확인 | `boolean` |
| `delete(key)` | tombstone으로 키 삭제, 성공 시 `true` | `boolean` |
| `size()` | 살아있는 항목 수 | `number` |

## 제약 조건

- $n \leq 10^5$ (저장되는 항목 수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `initialCapacity`는 양의 정수 (기본값 16)
- load factor 임계값: **0.5** — 초과 시 버킷 수 2배 확장 후 재해시 (개방 주소는 0.75보다 낮은 임계값 필요)
- 탐사 방식: 선형 탐사 `(hash(key) + i) % capacity`, i=0,1,2,...
- 삭제: tombstone 마커 사용

## 문제 상세

### 슬롯 상태

각 슬롯은 세 가지 상태 중 하나입니다:

| 상태 | 의미 |
|------|------|
| `empty` | 한 번도 사용되지 않은 빈 슬롯 |
| `occupied` | 유효한 키-값을 저장 중 |
| `tombstone` | 삭제된 슬롯 (탐사는 계속) |

### 선형 탐사 (Linear Probing)

```
probe(key):
  start = hash(key)
  for i = 0 to capacity-1:
    index = (start + i) % capacity
    if slots[index].state === "empty": break (없음)
    if slots[index].state === "occupied" and slots[index].key === key: found
    // tombstone이면 계속 탐사
```

### Tombstone 삭제

```
delete(key):
  탐사로 key 위치를 찾은 뒤
  slots[index] = { state: "tombstone" }
  count--
```

재해시(resize) 시에는 tombstone 슬롯을 건너뛰고 `occupied` 슬롯만 새 배열에 복사합니다.

### Load Factor와 재해시

load factor = count / capacity. 개방 주소법에서 load factor가 높아지면 탐사 체인이 길어져 성능이 급격히 저하됩니다. 따라서 임계값을 0.5로 낮게 유지합니다.

## 예시

```ts
const map = new HashMapOpenAddressing<string, number>();

map.set("a", 1);
map.set("b", 2);
map.set("c", 3);

console.log(map.get("b"));   // 2
console.log(map.has("c"));   // true

map.delete("b");             // tombstone 마킹
console.log(map.has("b"));   // false
console.log(map.get("c"));   // 3 — tombstone 건너뛰고 탐색

map.set("b", 99);            // tombstone 슬롯 재활용
console.log(map.get("b"));   // 99
console.log(map.size());     // 3
```
