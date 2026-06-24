# Quadtree (쿼드트리)

## 한 줄 요약
> 2D 공간을 재귀적으로 4분할하여 오브젝트를 공간적으로 인덱싱하고, 특정 범위 내 오브젝트를 O(log n)에 조회하는 자료구조.

## 스토리

2D 게임에서 총알 100개와 적 캐릭터 100개가 화면을 날아다닙니다. 매 프레임마다 충돌을 감지해야 한다면, 모든 조합을 확인하는 naive 방법은 O(n²) = 10,000번의 비교가 필요합니다. 60fps 게임에서는 초당 600,000번의 계산이 됩니다.

쿼드트리는 화면 공간을 동적으로 4분할하여 이 문제를 해결합니다. 화면을 NW, NE, SW, SE 4개의 사분면으로 나누고, 각 사분면에 오브젝트가 일정 수 이상 들어오면 다시 4분할합니다. 이렇게 하면 충돌 검사 시 서로 다른 사분면에 있는 오브젝트끼리는 비교할 필요가 없어지고, 인접한 오브젝트만 비교하게 되어 실질적인 비교 횟수가 O(n log n)으로 줄어듭니다.

게임 엔진(Unity의 Physics2D, Godot의 Area2D) 외에도 지리 정보 시스템(GIS)에서 지역 내 상점 검색, 위성 이미지 압축 등에 폭넓게 활용됩니다.

## 함수 인터페이스

```ts
type Point2D = [number, number];
type Rect = { x: number; y: number; width: number; height: number };

export class Quadtree {
  constructor(boundary: Rect, capacity: number = 4)
  // boundary: 이 쿼드트리가 담당하는 직사각형 영역
  // capacity: 한 노드에 담을 최대 점 수, 초과 시 4분할

  insert(point: Point2D): boolean
  // 점 삽입. 경계 밖이면 false 반환

  query(range: Rect): Point2D[]
  // range와 겹치는 모든 점 반환

  size(): number
  // 저장된 총 점의 수 — O(1)
}
```

## 제약 조건

- $n \leq 10^4$ (점의 수)
- capacity: 1 이상의 양의 정수 (기본값 4)
- 좌표 범위: $-10^6 \leq x, y \leq 10^6$
- 시간 제한: 1초, 메모리 제한: 256 MB
- `boundary.width > 0`, `boundary.height > 0` (양수 크기 보장)

## 문제 상세

### 공간 분할 방식

쿼드트리는 2차원 공간을 **4개의 사분면**으로 재귀적으로 분할합니다.

```
경계: { x:0, y:0, w:100, h:100 }

┌─────┬─────┐
│ NW  │ NE  │
│(0,0)│(50,0│
│ 50x50 각각│
├─────┼─────┤
│ SW  │ SE  │
│(0,50│(50,50)
└─────┴─────┘
```

**분할 트리거:** 현재 노드에 저장된 점의 수가 `capacity`를 초과할 때 4분할합니다. 분할 시 기존 점들도 적절한 자식 노드로 재배분합니다.

### insert 알고리즘

1. 점이 현재 노드의 `boundary` 내에 없으면 `false` 반환
2. 분할되지 않은 상태에서 `points.length < capacity`이면 현재 노드에 저장, `true` 반환
3. `capacity` 초과 시 `subdivide()`를 호출하여 4분할
4. 4개의 자식 노드 중 해당하는 노드에 재귀 삽입

### query 알고리즘

1. `range`와 현재 노드의 `boundary`가 겹치지 않으면 빈 배열 반환
2. 현재 노드의 점들 중 `range` 내에 있는 것을 결과에 추가
3. 분할된 상태라면 4개의 자식 노드에서도 재귀 탐색하여 결과 합산

### 경계 포함 정책

점 `(px, py)`가 `Rect { x, y, width, height }` 내에 있는 조건:
```
x ≤ px ≤ x + width  AND  y ≤ py ≤ y + height
```
경계선 위의 점도 포함합니다 (닫힌 구간).

## 예시

```ts
const boundary = { x: 0, y: 0, width: 100, height: 100 };
const qt = new Quadtree(boundary, 2);

qt.insert([10, 10]); // true
qt.insert([80, 80]); // true
qt.insert([30, 30]); // true — capacity(2) 초과, 4분할 발생
qt.insert([150, 150]); // false — 경계 밖

qt.size(); // 3

// 왼쪽 위 사분면 검색
qt.query({ x: 0, y: 0, width: 50, height: 50 });
// → [[10, 10], [30, 30]] (순서 무관)

// 전체 범위 검색
qt.query({ x: 0, y: 0, width: 100, height: 100 });
// → [[10, 10], [80, 80], [30, 30]] (순서 무관)
```
