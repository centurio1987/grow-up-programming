# VanEmdeBoasTree (반 엠데 보아스 트리)

## 한 줄 요약
> 정수 universe [0, U-1] 위의 집합에서 삽입, 삭제, successor, predecessor를 모두 O(log log U) 시간에 처리하는 자료구조를 구현하라.

## 스토리

네트워크 엔지니어 현수는 초고속 라우터를 개발하고 있다. IPv4 주소 공간은 2^32 (약 42억)개이고, 패킷이 도착할 때마다 목적지 IP의 "다음 홉"을 찾는 라우팅 테이블을 조회해야 한다. 초당 수백만 건의 패킷을 처리해야 하므로 탐색이 극도로 빨라야 한다.

이진 탐색 트리나 AVL 트리라면 O(log n) = O(32), 즉 32회 비교가 필요하다. 하지만 vEB(반 엠데 보아스) 트리는 **O(log log U) = O(log 32) = O(5)** 번만에 successor/predecessor를 찾는다. 일반적인 비교 기반 탐색보다 근본적으로 빠른 것이다.

이 자료구조는 Peter van Emde Boas가 1975년 발표했으며, 재귀적 분할 아이디어를 통해 universe 크기를 매번 제곱근으로 줄여나가는 방식으로 동작한다. 정수 우선순위 큐, 다이크스트라 알고리즘 최적화, 네트워크 라우팅 테이블 등에 활용된다.

## 함수 인터페이스

```ts
// 정수 universe [0, U-1] 상에서 동작하는 집합 자료구조
export class VanEmdeBoasTree {
  constructor(U: number)         // universe 크기 (2의 거듭제곱 권장)
  insert(x: number): void        // O(log log U)
  delete(x: number): void        // O(log log U)
  has(x: number): boolean        // O(log log U)
  min(): number | undefined      // O(1)
  max(): number | undefined      // O(1)
  successor(x: number): number | undefined   // O(log log U)
  predecessor(x: number): number | undefined // O(log log U)
}
```

## 제약 조건

- $U \leq 2^{16} = 65536$ (테스트 기준)
- $0 \leq x < U$
- 시간 제한: 1초, 메모리 제한: 256 MB
- 중복 삽입은 무시한다 (집합 의미론)
- 없는 값의 삭제는 무시한다 (오류 없이 실행)

## 문제 상세

### 재귀 구조

universe [0, U-1]을 √U 크기의 클러스터 √U개로 분할한다.

```
vEB(U) {
  min: number | undefined   // 별도 저장 (O(1) 접근)
  max: number | undefined   // 별도 저장 (O(1) 접근)
  summary: vEB(√U)          // 어느 클러스터에 원소가 있는지
  clusters: vEB(√U)[]       // 각 클러스터의 내용, 크기 √U
}
```

**핵심 함수:**
- `high(x) = floor(x / √U)` — 클러스터 번호
- `low(x) = x mod √U` — 클러스터 내 위치
- `index(h, l) = h * √U + l` — 클러스터 번호 + 위치 → 원소 값

### 기저 사례 (U = 2)

원소가 0 또는 1만 존재하므로 min/max 두 변수만으로 관리한다.

### insert(x)

1. 트리가 비어있으면 min = max = x.
2. x < min이면 x와 min을 교환하고 min에는 x를 저장, 실제 삽입은 이전 min 값으로.
3. U > 2이면:
   - summary에 high(x) 삽입 (클러스터 존재 표시)
   - clusters[high(x)]에 low(x) 삽입
4. x > max이면 max = x.

### delete(x)

1. x === min이면: summary에서 최솟값 클러스터를 찾아 새 min 계산 후, 그 값을 실제 삭제.
2. clusters[high(x)]에서 low(x) 삭제.
3. 삭제 후 클러스터가 비었으면 summary에서 high(x) 삭제.
4. x === max이면: 새 max 계산.
5. 트리에 원소가 1개만 있을 때는 min = max = undefined.

### successor(x)

1. U = 2: min/max로 간단히 판별.
2. low(x) < max(clusters[high(x)]) 이면: 같은 클러스터 내에서 찾는다.
3. 아니면: summary에서 high(x)의 successor(다음 클러스터)를 찾아 그 클러스터의 min을 반환.

## 예시

```ts
const veb = new VanEmdeBoasTree(16); // [0, 15] 범위

veb.insert(2);
veb.insert(5);
veb.insert(8);
veb.insert(11);

console.log(veb.has(5));           // true
console.log(veb.has(6));           // false
console.log(veb.min());            // 2
console.log(veb.max());            // 11
console.log(veb.successor(5));     // 8
console.log(veb.successor(8));     // 11
console.log(veb.successor(11));    // undefined
console.log(veb.predecessor(8));   // 5

veb.delete(5);
console.log(veb.has(5));           // false
console.log(veb.successor(2));     // 8
```
