# IntervalTree (구간 트리)

## 한 줄 요약
> 구간 집합을 증강 BST로 관리하고, 특정 점/구간과 겹치는 구간을 O(log n)에 검색하는 자료구조.

## 스토리

스타트업이 운영하는 공유 오피스 예약 시스템에서 회의실 충돌 감지 기능을 구현해야 한다. 각 예약은 `[startTime, endTime]` 시간대를 가지며, 새 예약 요청이 들어왔을 때 기존 예약들과 겹치는지 빠르게 확인해야 한다.

예약이 수천 건 이상 쌓이면 단순 배열 순회는 O(n)으로 느리다. 정렬된 배열에 이진 탐색을 쓰더라도 "겹치는 구간"이라는 2차원 조건 때문에 단순 탐색이 통하지 않는다 — 시작 시간으로 정렬해도 종료 시간의 분포가 불규칙하기 때문이다.

구간 트리는 이 문제를 해결하기 위해 BST 각 노드에 **서브트리 내 모든 구간의 최대 high 값(maxHigh)** 을 추가로 저장한다. 질의 시 이 값을 이용해 "이 서브트리에 겹치는 구간이 존재할 수 없다"는 판단을 내리고 탐색을 가지치기한다. 결과적으로 삽입·삭제·단건 겹침 검색을 O(log n)에, 전체 결과 반환을 O(k + log n)에 수행한다.

## 함수 인터페이스

```ts
export class IntervalTree {
  // 구간 삽입, O(log n)
  insert(low: number, high: number, data?: unknown): void

  // 구간 삭제, O(log n)
  delete(low: number, high: number): boolean

  // 점을 포함하는 모든 구간 반환 (low <= point <= high), O(k + log n)
  stabQuery(point: number): Array<[number, number]>

  // 겹치는 모든 구간 반환, O(k + log n)
  // 겹침 조건: !(qHigh < storedLow || storedHigh < qLow)
  overlapQuery(low: number, high: number): Array<[number, number]>

  // 저장된 구간 수, O(1)
  size(): number
}
```

## 제약 조건

- $1 \leq n \leq 10^5$
- 구간의 low, high 값은 임의의 정수 (음수 포함 가능)
- $low \leq high$ (비어있지 않은 구간)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 노드 구조

각 노드는 구간 `[low, high]`, 임의 데이터 `data`, 그리고 서브트리 내 최대 high 값 `maxHigh`를 저장한다.

```
Node:
  low: number       // 구간 시작 (BST 정렬 기준)
  high: number      // 구간 끝
  maxHigh: number   // 서브트리 내 모든 노드의 high 중 최댓값
  data: unknown     // 임의 연결 데이터
  left: Node | null
  right: Node | null
```

### BST 정렬 기준

노드는 `low` 값을 기준으로 BST 순서를 유지한다. `low`가 같으면 `high`를 보조 기준으로 사용할 수 있다.

### maxHigh 갱신

삽입·삭제 후 탐색 경로 상의 모든 노드를 상향식으로 갱신한다.

```
node.maxHigh = max(node.high, leftChild.maxHigh, rightChild.maxHigh)
```

### stabQuery (점 포함 질의)

점 `p`에 대해 `low <= p <= high`인 구간을 수집한다.

```
stabQuery(node, p):
  if node == null OR node.maxHigh < p:
    return []            // 이 서브트리엔 p를 포함하는 구간이 없다
  result = []
  if node.low <= p <= node.high:
    result.push([node.low, node.high])
  result += stabQuery(node.left, p)
  result += stabQuery(node.right, p)  // node.low > p라도 오른쪽에 있을 수 있음
  return result
```

### overlapQuery (구간 겹침 질의)

`[l, r]`과 겹치는 구간: `!(r < node.low || node.high < l)` 즉, `node.low <= r && l <= node.high`.

```
overlapQuery(node, l, r):
  if node == null OR node.maxHigh < l:
    return []            // 이 서브트리의 모든 구간이 l보다 먼저 끝남
  result = []
  if node.low <= r AND l <= node.high:
    result.push([node.low, node.high])
  result += overlapQuery(node.left, l, r)
  if node.low <= r:      // 오른쪽 서브트리는 low > node.low이므로
    result += overlapQuery(node.right, l, r)
  return result
```

## 예시

```ts
// 회의실 예약 시스템
const tree = new IntervalTree();
tree.insert(9, 11, { room: "A", title: "스탠드업" });
tree.insert(14, 16, { room: "A", title: "스프린트 리뷰" });
tree.insert(10, 12, { room: "B", title: "1on1" });
tree.insert(15, 17, { room: "B", title: "고객 미팅" });

// 10시~12시에 회의실을 예약할 수 있는가?
const conflicts = tree.overlapQuery(10, 12);
// [[9,11], [10,12]] — 두 예약과 충돌

// 11시에 진행 중인 예약은?
const active = tree.stabQuery(11);
// [[9,11], [10,12]] — 두 예약이 11시를 포함

// 예약 취소
tree.delete(9, 11); // true
tree.size(); // 3

// 취소 후 10시~12시 재확인
tree.overlapQuery(10, 12); // [[10,12]] — 이제 하나만 충돌
```
