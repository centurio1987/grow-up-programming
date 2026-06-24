# Multiset

## 한 줄 요약
> 중복 원소를 허용하면서 정렬 순서를 유지하는 집합을 구현하라.

## 스토리

실시간 센서 데이터 분석 시스템에서 슬라이딩 윈도우 중앙값을 계산해야 합니다. 매초 온도 측정값이 들어오고, 최근 K개 측정값의 중앙값을 실시간으로 보고해야 합니다. 단순 배열에 정렬하면 O(K)의 삽입/삭제 비용이 발생하고, 매번 정렬하면 O(K log K)가 필요합니다.

Multiset 두 개로 중앙값을 경계로 양쪽 절반을 유지하면 삽입·삭제·중앙값 조회가 모두 O(log K)에 가능합니다. lower half(작은 쪽)와 upper half(큰 쪽)의 크기를 항상 같거나 lower가 하나 더 많게 유지하면, `lower.max()`가 항상 중앙값입니다.

C++에서는 `std::multiset`이 이를 표준 라이브러리로 제공하지만, TypeScript/JavaScript에는 없습니다. 이 문제에서는 이진 탐색 기반 배열로 Multiset의 핵심 연산을 직접 구현합니다.

## 함수 인터페이스

```ts
export class Multiset<T> {
  constructor(comparator?: (a: T, b: T) => number)
  add(item: T): void              // O(log n) 탐색 + O(n) 삽입
  delete(item: T): boolean        // 하나만 제거, 없으면 false
  deleteAll(item: T): number      // 해당 원소 전부 제거, 제거된 수 반환
  has(item: T): boolean           // O(log n)
  count(item: T): number          // 특정 원소 개수, O(log n)
  min(): T | undefined            // O(1)
  max(): T | undefined            // O(1)
  size(): number                  // 총 원소 수 (중복 포함), O(1)
  toArray(): T[]                  // 정렬된 배열, O(n)
}
```

## 제약 조건
- $n \leq 10^4$ (총 원소 수)
- 비교자(comparator) 미제공 시 기본 오름차순 (`<` 연산자 기준)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 핵심 연산: lowerBound / upperBound

정렬된 배열에서 이진 탐색으로 삽입 위치를 찾습니다.

- **lowerBound(item)**: `item`이 처음 등장하는 인덱스(또는 삽입될 위치)
- **upperBound(item)**: `item`보다 큰 첫 번째 원소의 인덱스

`count(item) = upperBound(item) - lowerBound(item)`

### 삽입 전략

`lowerBound`로 삽입 위치를 찾고 `splice`로 삽입합니다. 정렬 불변식이 유지됩니다.

### 삭제 전략

`lowerBound`로 위치를 찾고, 해당 위치의 원소가 `item`과 같으면 `splice`로 제거합니다. `deleteAll`은 `lowerBound`~`upperBound` 범위를 한 번에 제거합니다.

## 예시

```ts
const ms = new Multiset<number>();
ms.add(3); ms.add(1); ms.add(2); ms.add(2);
ms.toArray();   // [1, 2, 2, 3]
ms.count(2);    // 2
ms.min();       // 1
ms.max();       // 3
ms.delete(2);   // true
ms.toArray();   // [1, 2, 3]
ms.deleteAll(2);// 1
ms.size();      // 2

// 슬라이딩 윈도우 중앙값
const lower = new Multiset<number>(); // 작은 절반
const upper = new Multiset<number>(); // 큰 절반
// lower.max() === 중앙값
```
