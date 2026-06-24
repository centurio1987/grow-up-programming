# ConcurrentSkipList

## 한 줄 요약
> 계층화된 연결 리스트로 정렬 순서를 유지하는 스킵 리스트를 구현하라.

## 스토리

분산 캐시 시스템에서 점수 기반 랭킹 보드를 관리합니다. 수천 명의 플레이어가 동시에 점수를 업데이트하고, "현재 내 점수 순위는?"을 실시간으로 조회합니다. 정렬된 배열은 삽입이 O(n)이고, 이진 탐색 트리는 편향되면 O(n)으로 열화됩니다.

Java의 `ConcurrentSkipListMap`은 이 문제를 lock-free 스킵 리스트로 해결합니다. 스킵 리스트는 여러 레벨의 연결 리스트를 쌓아 상위 레벨에서 큰 폭으로 건너뛰고, 하위 레벨에서 정밀 탐색합니다. 무작위 레벨 결정 덕분에 평균 O(log n)의 삽입·삭제·탐색이 가능합니다.

이 구현은 단일 스레드 환경에서 같은 인터페이스를 연습합니다. 헤드와 테일 sentinel 노드를 사용해 경계 조건을 단순화하고, `findUpdate`로 각 레벨의 선행 노드를 한 번의 탐색에 모두 수집합니다.

## 함수 인터페이스

```ts
export class ConcurrentSkipList<T> {
  constructor(maxLevel: number = 16, comparator?: (a: T, b: T) => number)
  insert(value: T): void          // O(log n) 평균
  delete(value: T): boolean       // O(log n) 평균
  has(value: T): boolean          // O(log n) 평균
  min(): T | undefined
  max(): T | undefined
  toArray(): T[]                  // 정렬된 배열
  size(): number
}
```

## 제약 조건
- $n \leq 10^4$ (원소 수)
- `maxLevel`: 기본값 16 (log₂(10^5) ≈ 17이므로 충분)
- 중복 값은 무시 (집합 의미론)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 스킵 리스트 구조

레벨 0: Head → 1 → 2 → 3 → 5 → 7 → 9 → Tail
레벨 1: Head → 1 → 3 → 7 → Tail
레벨 2: Head → 3 → Tail

상위 레벨에서 탐색을 시작해 목표보다 작은 동안 전진하고, 더 갈 수 없으면 한 레벨 내려갑니다.

### 레벨 결정

```
randomLevel():
  level = 1
  while random() < 0.5 AND level < maxLevel:
    level++
  return level
```

평균 레벨 = 2, 최대 16. 확률적으로 균형이 유지됩니다.

### findUpdate 알고리즘

insert와 delete 모두 "각 레벨에서 삽입/삭제 위치 직전 노드"를 알아야 합니다.

```
findUpdate(value):
  update = [head, head, ..., head]  // maxLevel 크기
  current = head
  for level = currentLevel downto 0:
    while current.forward[level] != tail AND
          comparator(current.forward[level].value, value) < 0:
      current = current.forward[level]
    update[level] = current
  return update
```

## 예시

```ts
const sl = new ConcurrentSkipList<number>();
sl.insert(3);
sl.insert(1);
sl.insert(2);
sl.toArray();    // [1, 2, 3]
sl.has(2);       // true
sl.min();        // 1
sl.max();        // 3
sl.delete(2);    // true
sl.toArray();    // [1, 3]
sl.size();       // 2

// 내림차순
const sl2 = new ConcurrentSkipList<number>(16, (a, b) => b - a);
sl2.insert(1); sl2.insert(3); sl2.insert(2);
sl2.toArray();   // [3, 2, 1]
```
