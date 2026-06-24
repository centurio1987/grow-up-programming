# HashMapChaining

## 한 줄 요약
> 체이닝 충돌 해결 방식을 사용하는 제네릭 해시맵을 구현하라.

## 스토리

당신은 간단한 스크립팅 언어 인터프리터를 개발하고 있습니다. 인터프리터는 실행 중에 변수명(문자열)과 그 값을 빠르게 저장하고 조회할 수 있는 **심볼 테이블**이 필요합니다. `let x = 10` 같은 구문을 실행하면 `"x"` → `10` 매핑을 테이블에 저장하고, `x + 1`을 평가할 때 `"x"`를 O(1)에 조회해야 합니다.

배열 기반 선형 탐색은 O(n)으로 너무 느리고, 정렬된 이진 탐색 트리는 O(log n)으로 나쁘지 않지만 균형을 유지해야 하는 복잡성이 있습니다. 해시맵은 평균 O(1) 삽입·조회를 제공하며, 충돌이 발생할 경우 **체이닝(chaining)**으로 처리합니다. 같은 해시 버킷에 여러 항목이 들어오면 배열에 차례로 이어 붙입니다.

테이블이 꽉 차면(load factor > 0.75) 버킷 수를 2배로 늘리고 모든 항목을 재해시(rehash)해 성능을 유지합니다. 이렇게 하면 평균적으로 각 버킷당 항목 수가 1 미만으로 유지되어 O(1) 성능을 보장합니다.

## 함수 인터페이스

```ts
export class HashMapChaining<K, V> {
  constructor(initialCapacity: number = 16)
  set(key: K, value: V): void      // O(1) 평균
  get(key: K): V | undefined       // O(1) 평균
  has(key: K): boolean             // O(1) 평균
  delete(key: K): boolean          // O(1) 평균, 삭제 성공 시 true
  size(): number                   // O(1)
  keys(): K[]                      // O(n)
  values(): V[]                    // O(n)
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `set(key, value)` | 키-값 쌍 삽입 또는 값 갱신 | `void` |
| `get(key)` | 키에 대응하는 값 조회 | `V \| undefined` |
| `has(key)` | 키 존재 여부 확인 | `boolean` |
| `delete(key)` | 키 삭제, 성공 시 `true` | `boolean` |
| `size()` | 현재 저장된 항목 수 | `number` |
| `keys()` | 모든 키 목록 | `K[]` |
| `values()` | 모든 값 목록 | `V[]` |

## 제약 조건

- $n \leq 10^5$ (저장되는 항목 수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- `initialCapacity`는 양의 정수 (기본값 16)
- load factor 임계값: **0.75** — 초과 시 버킷 수 2배 확장 후 재해시
- 키는 임의의 타입 `K`; 해시 함수는 `String(key)` 변환 후 문자별 코드로 계산

## 문제 상세

### 해시 함수

키를 버킷 인덱스로 변환합니다. 키를 문자열로 변환한 뒤 각 문자의 코드 포인트를 순차 누산합니다.

```
hash(key):
  s = String(key)
  h = 0
  for each char c in s:
    h = (h * 31 + charCode(c)) mod capacity
  return h
```

### 충돌 처리 — 체이닝

버킷 배열 `buckets[i]`는 `[K, V][]` 형태의 배열입니다. 동일한 해시 인덱스로 여러 키가 삽입되면 해당 배열에 순서대로 추가합니다. 조회 시에는 버킷 내 배열을 선형 탐색해 키를 비교합니다.

```
buckets = Array(capacity).fill([])
index = hash(key)
chain = buckets[index]
// 삽입: chain에 [key, value] 추가 (기존 키면 값 업데이트)
// 조회: chain에서 key 선형 탐색
```

### Load Factor와 재해시

load factor = count / capacity. 새 항목 삽입 후 load factor가 0.75를 초과하면:
1. 새 용량 = 기존 용량 × 2
2. 새 버킷 배열 생성
3. 모든 기존 항목을 새 배열에 재해시

## 예시

```ts
const map = new HashMapChaining<string, number>();

map.set("name", 42);
map.set("age", 30);

console.log(map.get("name"));  // 42
console.log(map.get("age"));   // 30
console.log(map.get("none"));  // undefined

console.log(map.has("name"));  // true
console.log(map.has("none"));  // false

map.set("name", 99);           // 덮어쓰기
console.log(map.get("name"));  // 99
console.log(map.size());       // 2

map.delete("age");
console.log(map.size());       // 1
console.log(map.keys());       // ["name"]
```
