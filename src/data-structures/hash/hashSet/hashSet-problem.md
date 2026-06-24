# HashSet

## 한 줄 요약
> HashMapChaining 기반의 고유 원소 집합과 합집합·교집합·차집합 연산을 구현하라.

## 스토리

당신은 대규모 소셜 네트워크 플랫폼의 팔로우 추천 시스템을 개발하고 있습니다. 사용자 A가 팔로우하는 계정 목록과 사용자 B가 팔로우하는 계정 목록이 주어질 때, 다음을 빠르게 계산해야 합니다:

- **팔로우 여부 확인**: 특정 계정이 팔로우 목록에 있는지 O(1)에 확인
- **공통 팔로우 (교집합)**: "두 사람 모두 팔로우하는 계정" — 공통 친구 추천에 활용
- **팔로우 전체 목록 (합집합)**: "둘 중 하나라도 팔로우하는 계정" — 노출 범위 계산
- **독자적 팔로우 (차집합)**: "A는 팔로우하지만 B는 팔로우하지 않는 계정" — 차별화 추천

배열 기반 선형 탐색으로 교집합을 구하면 O(n × m)이 걸려 각각 10만 팔로워를 가진 사용자의 공통 팔로우 계산에 10<sup>10</sup>번의 비교가 필요합니다. HashSet을 사용하면 O(n + m)으로 줄어듭니다.

HashSet은 내부적으로 HashMapChaining을 활용합니다. 값 없이 키만 저장하는 구조로, 집합의 수학적 연산을 효율적으로 지원합니다.

## 함수 인터페이스

```ts
export class HashSet<T> {
  constructor(initialCapacity: number = 16)
  add(item: T): void                          // O(1) 평균
  has(item: T): boolean                       // O(1) 평균
  delete(item: T): boolean                    // O(1) 평균
  size(): number                              // O(1)
  values(): T[]                               // O(n)
  union(other: HashSet<T>): HashSet<T>        // O(n + m)
  intersection(other: HashSet<T>): HashSet<T> // O(n)
  difference(other: HashSet<T>): HashSet<T>   // O(n)
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `add(item)` | 항목 추가 (중복 무시) | `void` |
| `has(item)` | 항목 존재 여부 | `boolean` |
| `delete(item)` | 항목 삭제, 성공 시 `true` | `boolean` |
| `size()` | 저장된 항목 수 | `number` |
| `values()` | 모든 항목 배열 | `T[]` |
| `union(other)` | 합집합: this ∪ other | `HashSet<T>` |
| `intersection(other)` | 교집합: this ∩ other | `HashSet<T>` |
| `difference(other)` | 차집합: this \ other | `HashSet<T>` |

## 제약 조건

- $n \leq 10^5$ (집합 원소 수)
- 시간 제한: 1초, 메모리 제한: 256 MB
- 집합 연산은 원본 집합을 변경하지 않고 **새로운 HashSet**을 반환한다
- `initialCapacity`는 양의 정수 (기본값 16)
- 중복 `add`는 크기를 증가시키지 않는다

## 문제 상세

### 내부 구현

HashSet은 `HashMapChaining<T, true>`처럼 동작합니다. 값 자리에는 항상 `true` 같은 더미 값을 저장하고, 키 존재 여부만 추적합니다.

```
// 개념적 내부 구조
map: HashMapChaining<T, true>

add(item) = map.set(item, true)
has(item) = map.has(item)
delete(item) = map.delete(item)
size() = map.size()
values() = map.keys()
```

### 집합 연산

**합집합 (union)**: this의 모든 요소 + other의 모든 요소, 중복 제거
```
result = new HashSet()
for x in this.values(): result.add(x)
for x in other.values(): result.add(x)
return result
```

**교집합 (intersection)**: this의 요소 중 other에도 있는 것만
```
result = new HashSet()
for x in this.values():
  if other.has(x): result.add(x)
return result
```

**차집합 (difference)**: this의 요소 중 other에 없는 것만
```
result = new HashSet()
for x in this.values():
  if not other.has(x): result.add(x)
return result
```

## 예시

```ts
// 소셜 네트워크 팔로우 시스템
const aliceFollows = new HashSet<string>();
aliceFollows.add("bob");
aliceFollows.add("charlie");
aliceFollows.add("dave");

const bobFollows = new HashSet<string>();
bobFollows.add("alice");
bobFollows.add("charlie");
bobFollows.add("eve");

// 두 사람이 공통으로 팔로우하는 계정
const common = aliceFollows.intersection(bobFollows);
console.log(common.values()); // ["charlie"]

// 둘 중 하나라도 팔로우하는 전체 계정
const all = aliceFollows.union(bobFollows);
console.log(all.size());      // 5

// Alice만 팔로우하고 Bob은 팔로우하지 않는 계정
const onlyAlice = aliceFollows.difference(bobFollows);
console.log(onlyAlice.values().sort()); // ["bob", "dave"]

// 팔로우 여부 확인
console.log(aliceFollows.has("charlie")); // true
console.log(aliceFollows.has("alice"));   // false
```
