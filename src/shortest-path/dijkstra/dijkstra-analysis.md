# Dijkstra 솔루션 분석 보고서

## 1. 방향성 분석

문제는 음수 가중치가 없는 방향 그래프에서 단일 출발점 최단 거리를 구하는 표준 Dijkstra 문제이다. 솔루션의 큰 그림은 표준 아이디어를 따른다.

- min-heap 기반 우선순위 큐를 이용해 현재 `dist`가 가장 작은 정점을 꺼내 확정한다.
- 꺼낸 정점의 인접 간선에 대해 완화(relaxation)를 수행한다.
- lazy deletion 패턴(`d > dist[u]`이면 stale로 건너뜀)을 사용해 decrease-key 없이 구현한다.

방향 자체는 가이드(`dijkstra-guide.md`)와 일치한다. 그러나 **초기화 단계가 누락**되어 알고리즘이 작동하지 않으며, 우선순위 큐 내부에도 정확성 결함이 있다. 또한 인접 간선 탐색을 매번 전체 `edges` 배열을 `filter`로 훑는 방식이라 목표 복잡도 $O((V + E) \log V)$를 달성하지 못한다.

## 2. 정확성 분석 (테스트 결과 기반)

`bun test`를 실행한 결과 **13개 테스트 전부 실패** 했다. 받은 거리 배열이 사실상 항상 `[Infinity, Infinity, ...]`이거나, 첫 분기에서 길이 3짜리 임의 배열이 반환된다. 원인을 결함별로 정리한다.

### 결함 A. `dist[src] = 0` 초기화 누락 (치명적)

```ts
const result: number[] = Array.from(
  { length: n },
  (v, k) => Number.POSITIVE_INFINITY,
);
```

`result` 배열은 모든 인덱스를 `Infinity`로 초기화하지만, **`result[src] = 0`이 설정되지 않는다**. 단일 정점 테스트(`dijkstra(1, [], 0)`)에서 `[0]`이 아니라 `[Infinity]`가 반환되는 직접 원인이다.

### 결함 B. 우선순위 큐 초기 push 누락 (치명적)

알고리즘이 동작하려면 시작 정점을 큐에 넣고 시작해야 한다.

```ts
const priorityQ: PriorityQueue = new PriorityQueue();
// ... priorityQ.push([src, 0])가 없음
while (priorityQ.isEmpty() === false) { ... }
```

큐가 비어 있어 `while` 루프 본문은 한 번도 실행되지 않는다. 따라서 어떤 간선도 완화되지 않고 `result`는 초기 상태 그대로 반환된다. 이것이 13개 테스트 중 12개에서 `[Infinity, ...]`가 반환된 직접 원인이다.

### 결함 C. `edges.length === 0` 분기의 잘못된 반환

```ts
if (edges.length === 0) {
  return [src, src, Number.POSITIVE_INFINITY];
}
```

- 반환 배열의 길이가 항상 3으로 고정되어 있다. 사양은 길이 $V = n$ 이어야 한다.
- 원소의 의미가 명세와 무관하다(`src` 두 번 + `Infinity`).
- 이 분기 자체가 불필요하다. `edges = []`이고 `n = 1, src = 0`이면 정상 경로로도 `[0]`이 나와야 하며, 다른 모든 `edges = []`도 `result[src] = 0` 초기화만 되어 있으면 자연스럽게 처리된다.

테스트 "단일 정점, 자기 자신까지의 거리는 0"에서 받은 값이 `[0, 0, Infinity]`인 이유가 이 분기 때문이다.

### 결함 D. PriorityQueue.pop의 힙 다운 로직 버그

`pop` 내부 `while` 루프에 두 가지 결함이 있다.

```ts
let parentIdx = 0;
let childrenIdx = this.searchChildren(0);  // [1, 2]에 고정
while (childrenIdx[0]! < this.values.length) {
  if (childrenIdx[1]! < this.values.length &&
      this.values[childrenIdx[1]!]![1]! < this.values[parentIdx]![1]!) {
    // 오른쪽 자식과 swap, parentIdx = childrenIdx[1]
  } else if (...) {
    // 왼쪽 자식과 swap, parentIdx = childrenIdx[0]
  } else {
    break;
  }
}
```

- **D-1. `childrenIdx` 미갱신**: `parentIdx`가 자식 인덱스로 이동한 뒤에도 `childrenIdx`는 항상 루트의 자식 `[1, 2]`로 고정되어 있다. 이 때문에 다음 반복에서 비교 대상이 새 부모의 자식이 아니라 루트의 자식 슬롯에 머문다. 힙 다운이 한 단계 이상 진행되어야 할 때 잘못된 비교가 이루어지고, 종종 무한 루프나 invariant 파괴로 이어진다.
- **D-2. 자식 둘 중 더 작은 쪽을 고르지 않음**: 표준 min-heap 다운은 "두 자식 중 작은 쪽을 골라" 부모와 비교한 뒤 더 작으면 swap한다. 현재 코드는 오른쪽 자식이 부모보다 작으면 무조건 오른쪽과 swap한다. 예시: 부모 `10`, 왼쪽 `1`, 오른쪽 `5`. 오른쪽이 부모보다 작으므로 swap → `5, 1, 10` 상태가 되어 `5 > 1`인 부모-자식 관계가 만들어진다. 힙 invariant가 깨진다.

이 두 결함은 결함 A/B를 고친 뒤에도 잘못된 정점 순서로 정점이 꺼내져 잘못된 최단 거리를 만들거나, 무한 루프로 멈추는 원인이 된다.

### 결함 E. 인접 정점 탐색의 비효율 (정확성에는 영향 없음, 3장 참조)

```ts
const adjacentEdges = edges.filter((edge) => edge[0] === distanceU[0]);
```

매 정점 확장마다 전체 간선 배열을 선형 스캔한다. 결과는 맞지만 복잡도 등급이 한 단계 올라간다.

### 결함 F. `result[edge[1]] = result[edge[0]] + edge[2]` (논리 일관성 흠집)

완화식은 꺼낸 정점의 확정 거리 `distanceU[1]`를 기준으로 해야 의미가 명확하다. 현재 코드는 `result[edge[0]]`를 사용한다. stale 검사(`distanceU[1] > result[distanceU[0]]`)를 통과한 직후에는 두 값이 같으므로 결과는 같지만, 코드 의도가 흐려지고 차후 수정 시 버그 표면적이 된다.

---

요약: **결함 A, B가 모든 테스트 실패의 직접 원인** 이고, 그 둘을 고쳐도 **결함 D**로 인해 비자명 그래프에서 잘못된 답이 나오게 된다. **결함 C**는 단일 분기를 통째로 제거하면 사라진다.

## 3. 최적화 분석

### 3.1. 개선해야 할 핵심 이슈

#### 3.1.1. 알고리즘 원형에서 최종 구현으로의 전개

**원형 1: Naive Dijkstra ($O(V^2)$)**

`dist[v]`를 정점 $v$까지 현재까지 발견한 최단 거리로 정의한다. `visited[v]`는 정점 $v$의 거리가 확정되었는지 여부이다.

```
dist[v] ← Infinity (모든 v에 대하여)
dist[src] ← 0
visited[v] ← false

V번 반복:
    u ← visited[u] = false 인 정점 중 dist[u]가 최소인 것  # 선형 탐색 O(V)
    visited[u] ← true
    u의 각 이웃 (v, w)에 대하여:
        if dist[u] + w < dist[v]:
            dist[v] ← dist[u] + w
```

`u`를 선택하는 단계가 한 번에 $O(V)$, 총 $V$번 반복되므로 전체 $O(V^2)$이다. 본 문제의 제약 $V = 10^5$에서는 $10^{10}$ 연산으로 시간 초과이다.

**원형 2: 힙 기반 Dijkstra ($O((V+E)\log V)$)**

원형 1에서 "미확정 정점 중 `dist`가 최소인 것"을 찾는 단계가 병목이다. 이 단계를 자동으로 최솟값을 유지하는 자료구조 **min-heap**으로 대체한다.

- 매번 최솟값을 꺼내는 연산: $O(\log V)$
- 거리 갱신 시 새 항목을 삽입하는 연산: $O(\log V)$
- 총 삽입 횟수는 각 간선마다 최대 1회, 즉 $O(E)$회

이로부터 전체 복잡도는 $O((V + E) \log V)$가 된다.

**lazy deletion 패턴**: 힙의 표준 연산에는 "특정 키의 값을 줄이는" decrease-key가 없다. 이를 회피하기 위해, 거리 갱신 시 기존 항목을 수정하지 않고 새 항목 `(new_dist, v)`를 삽입한다. 그러면 힙에는 한 정점에 대한 여러 항목이 존재할 수 있다. 꺼낸 항목 `(d, u)`에 대해 `d > dist[u]`이면 그 항목은 stale(낡은 값) 이므로 건너뛴다. 힙 항목 수는 최악 $O(E)$이며, 정점당 valid 처리는 단 한 번이므로 정당성과 복잡도 모두 유지된다.

**왜 lazy deletion이 정당한가**: 가중치가 음수가 아니라는 조건 때문에, 한 번 valid하게 처리된 정점 `u`의 `dist[u]`는 그 이후 절대 감소하지 않는다. 따라서 동일 정점의 stale 항목은 안전하게 무시할 수 있다.

#### 3.1.2. 본 솔루션에서 필요한 구체적 개선

**개선 1: 초기화 절차 보강** (결함 A, B, C 해결)

```ts
const dist: number[] = new Array(n).fill(Number.POSITIVE_INFINITY);
dist[src] = 0;
const pq = new PriorityQueue();
pq.push([src, 0]);
```

`edges.length === 0` 분기는 제거한다. 위 초기화만으로 모든 $E = 0$ 케이스가 자연스럽게 처리된다(`while` 루프에서 `src`를 한 번 꺼내고 인접 간선이 없으므로 즉시 종료, `dist = […, 0, …]`).

**개선 2: 인접 리스트 사전 구성** (결함 E 해결, 복잡도 등급 개선)

매번 `edges.filter`로 인접 간선을 찾으면 정점 확장마다 $O(E)$ 비용이 들고, 정점 확장 횟수가 최악 $O(E)$이므로 전체가 $O(E^2)$로 악화된다(가이드의 $10^{10}$ 연산 시나리오). 이를 인접 리스트로 한 번에 구성한다.

```ts
const adj: [number, number][][] = Array.from({ length: n }, () => []);
for (const [u, v, w] of edges) {
  adj[u]!.push([v, w]);
}
```

구성 비용은 $O(V + E)$이고, 이후 `adj[u]` 조회는 $O(|N(u)|)$이다. 총합은 모든 정점의 차수 합 $= 2E$($\leq E$ 방향 그래프의 경우 $E$)로 한 번씩만 본다.

**개선 3: 우선순위 큐 힙 다운 정정** (결함 D 해결)

표준 min-heap 다운 절차는 다음과 같다.

```
i ← 0
n ← 힙 크기
while True:
    l ← 2i + 1
    r ← 2i + 2
    smallest ← i
    if l < n and heap[l] < heap[smallest]: smallest ← l
    if r < n and heap[r] < heap[smallest]: smallest ← r
    if smallest = i: break
    swap(heap[i], heap[smallest])
    i ← smallest
```

핵심 변경점은 두 가지이다.
- 매 반복마다 `smallest`를 새로 계산해 "현재 노드와 두 자식 중 최솟값"을 선택한다. 이 단계가 결함 D-2(둘 중 더 작은 쪽 선택)를 해결한다.
- swap 후 `i ← smallest`로 이동하고, 다음 반복에서 `l, r`을 새로 계산한다. 이 단계가 결함 D-1(`childrenIdx` 미갱신)을 해결한다.

**개선 4: 완화식 일관성** (결함 F 해결)

꺼낸 정점의 거리 `d`를 명시적으로 사용한다.

```ts
const [u, d] = pq.pop();
if (d > dist[u]) continue;
for (const [v, w] of adj[u]) {
  if (d + w < dist[v]) {
    dist[v] = d + w;
    pq.push([v, dist[v]]);
  }
}
```

---

### 개선 후 복잡도

| 단계 | 비용 |
|------|------|
| 인접 리스트 구성 | $O(V + E)$ |
| 각 정점 1회 꺼냄, stale 항목 추가 | 합 $O(E)$ 항목 |
| 힙 push/pop 연산당 | $O(\log V)$ |
| **합계** | $O((V + E) \log V)$ |

제약 $V \leq 10^5,\ E \leq 2 \cdot 10^5$ 에서 약 $3 \times 10^5 \times 17 \approx 5 \times 10^6$ 연산이며, 가이드에서 제시한 목표 복잡도 안에 든다. 성능 테스트(V=10^4, E≈5×10^4, 100ms 이내)도 통과 가능 범위이다.

---

## 재분석 (2026-05-26)

### 코드 변경 사항

이전 분석 이후 솔루션 파일에 다음 두 가지 수정이 들어왔다.

1. 우선순위 큐에 시작 정점 push 추가
   ```ts
   priorityQ.push([src, 0]);
   ```
2. `result` 배열 초기화에서 인덱스 `k === 0`이면 0, 그 외 `Infinity`로 채움
   ```ts
   const result = Array.from({ length: n }, (v, k) => {
     if (k === 0) return 0;
     return Number.POSITIVE_INFINITY;
   });
   ```

### 개선된 부분

- **결함 B 해결**: 초기 `priorityQ.push([src, 0])`이 추가되어 `while` 루프가 정상 진입한다. 시작 정점이 우선순위 큐에서 한 번 꺼내져 인접 간선 완화가 실제로 수행된다.
- **결함 A 부분 해결 (조건부)**: `src = 0`인 경우에 한해 `result[src] = 0`이 충족된다. 본문 결함 A의 의도("시작 정점 거리를 0으로 두기")가 그 경로에서만 우연히 만족된다.

### 남은 버그

#### 잔존 결함 A': `result` 초기화가 `src`가 아니라 인덱스 `0`에 종속

```ts
if (k === 0) return 0;
```

이 분기는 **`src`가 무엇이든 항상 `result[0] = 0`** 으로 만든다. 명세는 `result[src] = 0`을 요구한다. 두 표현은 `src = 0`일 때만 일치한다.

- 테스트 "간선이 전혀 없을 때 시작점만 0, 나머지 Infinity"의 호출은 `dijkstra(3, [], 1)`. 후술하듯 결함 C가 먼저 발동하여 결함 A'까지 도달하지 못하지만, 결함 C를 제거하면 `result = [0, Infinity, Infinity]`로 초기화된 채 `priorityQ.push([1, 0])`이 들어가고, 꺼낼 때 stale 검사 `0 > result[1] = Infinity`는 `false`라 인접 간선을 보러 가나 간선이 없어 그대로 종료, 최종 결과는 `[0, Infinity, Infinity]`로 잘못 반환된다.
- 테스트 "시작점이 마지막 정점"(`src = 2`)에서 실제 받은 값이 `[0, Infinity, Infinity]`인 점이 이 결함의 직접 증거이다.

**수정 방향**: `(v, k) => (k === src ? 0 : Number.POSITIVE_INFINITY)` 또는 분리해 `result.fill(Infinity); result[src] = 0;`.

#### 잔존 결함 C: `edges.length === 0` 분기

```ts
if (edges.length === 0) {
  return [src, src, Number.POSITIVE_INFINITY];
}
```

여전히 길이 3 고정 배열을 반환한다. 테스트 결과로 재확인된다.
- `dijkstra(1, [], 0)` → 기대 `[0]`, 받음 `[0, 0, Infinity]`.
- `dijkstra(3, [], 1)` → 기대 `[Infinity, 0, Infinity]`, 받음 `[1, 1, Infinity]`.

**수정 방향**: 본 분기 자체를 삭제한다. 결함 A'까지 함께 고치면 `edges = []` 케이스는 메인 로직만으로 자연 처리된다.

#### 잔존 결함 D: PriorityQueue.pop 힙 다운

- D-1 (`childrenIdx` 미갱신)과 D-2 (자식 둘 중 더 작은 쪽 미선택)는 코드에 그대로 남아 있다.
- 재실행한 `bun test` 출력이 세 번째 실패 이후 진전 없이 멈춘 점은 해당 결함이 무한 루프 또는 매우 긴 잘못된 다운을 유발하고 있음을 강하게 시사한다. (테스트 러너 출력이 "시작점이 마지막 정점" 이후 추가 결과를 내지 않은 상태에서 process가 외부 신호로 종료되어야 했다.)

**수정 방향**: 표준 절차로 교체한다. 본문 "개선 3"의 의사코드를 그대로 사용한다.

#### 잔존 결함 E, F

- E: `edges.filter` 기반 인접 간선 탐색이 그대로다. 정확성에는 영향이 없으나, 성능 테스트(V=10^4, E≈5·10^4)에서 결함 D를 고친 뒤에도 100ms 초과 위험이 있다.
- F: 완화식이 `result[edge[0]]`을 참조하는 코드 구조 그대로다. 정확성에는 직접 영향이 없으나 의도가 흐리다.

### 테스트 결과 (재실행)

확인된 실패 항목과 받은 값:

| 테스트 | 기대 | 받음 | 원인 |
|--------|------|------|------|
| 단일 정점, 자기 자신까지의 거리는 0 | `[0]` | `[0, 0, Infinity]` | 결함 C |
| 간선이 전혀 없을 때 시작점만 0, 나머지 Infinity | `[Infinity, 0, Infinity]` | `[1, 1, Infinity]` | 결함 C |
| 시작점이 마지막 정점 | `[1, 2, 0]` | `[0, Infinity, Infinity]` | 결함 A' (+ E의 영향은 없음) |
| 그 이후 테스트 | — | 진행 중단 | 결함 D로 인한 추정 무한 루프 |

전체 13개 테스트 중 통과한 테스트는 확인되지 않았다. 즉 이번 수정으로 알고리즘이 동작 가능한 상태에 한 발 다가갔으나, 여전히 0건 통과 상태이다.

### 후속 수정 우선순위

1. 결함 D (힙 다운) — 다른 모든 시나리오가 이 위에서 돌아간다. 가장 먼저 고쳐야 한다.
2. 결함 A' — `src` 사용으로 정정.
3. 결함 C — 분기 자체 제거.
4. 결함 E — 인접 리스트 도입. 성능 테스트 통과를 위해 필요.
5. 결함 F — 완화식 일관성 정리.

---

## 재분석 2회 (2026-05-26)

### 코드 변경 사항

이전 재분석 이후 다음 세 가지가 수정되었다.

1. `edges.length === 0` 조기 반환 분기를 통째로 제거 — 결함 C 해결.
2. `result` 초기화 분기를 `k === 0`에서 `k === src`로 정정 — 결함 A' 해결.
3. `PriorityQueue.pop`의 힙 다운 루프 끝에 `childrenIdx = this.searchChildren(parentIdx)`를 추가 — 결함 D-1 해결.

### 개선된 부분 — 테스트 결과로 본 효과

`bun test src/shortest-path/dijkstra/dijkstra.test.ts` 재실행 결과:

```
12 pass
1 fail
Ran 13 tests across 1 file. [1.59s]
```

- 정확성 관련 12개 테스트 전부 통과. 단일 정점, 도달 불가, 다중 간선, 가중치 0, 셀프 루프, 큰 가중치, 시작점이 마지막 정점, 완전 그래프(V=5) 케이스가 모두 올바른 거리 배열을 반환한다.
- 무한 루프로 멈추던 현상이 사라졌다. 결함 D-1 수정으로 힙 다운이 자식 인덱스를 따라 정상적으로 내려간다.

### 남은 버그

#### 잔존 결함 D-2: 자식 둘 중 더 작은 쪽 미선택

`pop`의 힙 다운은 여전히 오른쪽 자식을 먼저 검사하고 그것이 부모보다 작으면 즉시 오른쪽과 swap한다.

```ts
if (오른쪽 자식 존재 && values[오른쪽] < values[parentIdx]) {
  // 오른쪽과 swap, parentIdx ← 오른쪽
} else if (왼쪽 자식 존재 && values[왼쪽] < values[parentIdx]) {
  // 왼쪽과 swap, parentIdx ← 왼쪽
}
```

표준 절차는 "두 자식 중 더 작은 쪽을 골라 부모와 비교, 그 결과로 swap 여부 결정"이다. 현재 구현은 다음 상태에서 힙 invariant를 깨뜨린다.

- 부모 키 = $10$, 왼쪽 자식 키 = $1$, 오른쪽 자식 키 = $5$.
- 오른쪽 자식 $5 < 10$이라 오른쪽과 swap. 결과 배열의 키: 부모 $5$, 왼쪽 $1$, 오른쪽 $10$.
- 부모 $5 >$ 왼쪽 $1$ → min-heap invariant 파괴.

현재 테스트 셋의 그래프 형태에서는 이 시나리오가 실제로 잘못된 출력을 만들지 않은 것으로 보이지만, 보다 다양한 입력에서는 잘못된 최단 거리가 산출될 잠재적 결함이다.

**수정 방향**: 본문 "개선 3"의 의사코드처럼 한 변수 `smallest`를 두고 두 자식과 부모 중 최솟값을 결정한 뒤 한 번만 swap한다.

#### 잔존 결함 E: `edges.filter` (성능 테스트 실패의 직접 원인)

성능 테스트 결과:
- 기대: 100ms 미만
- 받음: **1572.92ms** (약 15.7배 초과)

```ts
const adjacentEdges = edges.filter((edge) => edge[0] === distanceU[0]);
```

정점 확장마다 전체 `edges`(길이 $E$)를 선형 스캔한다. 정점 확장 횟수는 lazy deletion 환경에서 최대 $O(E)$이므로, 인접 탐색 부분만의 총 비용은 $O(E^2)$이다. V=10^4, E≈5·10^4 시나리오에서 약 $(5 \times 10^4)^2 / V \approx 2.5 \times 10^8$ 정도의 비교가 일어나며, 측정된 1.5초 수준의 실행 시간과 부합한다.

**수정 방향**: 함수 시작부에서 인접 리스트 `adj: [number, number][][]`를 한 번만 구성한다(구성 비용 $O(V + E)$). 이후 정점 $u$ 확장 시 `adj[u]`만 순회한다. 전체 인접 탐색 비용이 $O(V + E)$로 떨어져 성능 테스트가 통과 가능한 영역에 들어간다.

#### 잔존 결함 F: 완화식의 일관성

완화 시 `distanceU[1]` 대신 `result[edge[0]]`을 더하는 구조는 그대로다. stale 검사가 직전에 두 값을 같게 보장하므로 정확성에는 영향이 없으나, 의도가 명확하지 않아 차후 수정 시 미세 버그 표면이다.

### 테스트 결과 표 (재실행 2회차)

| 카테고리 | 통과 | 실패 |
|---------|------|------|
| 기본 동작 (4건) | 4 | 0 |
| 엣지 케이스 (5건) | 5 | 0 |
| 바운더리 테스트 (3건) | 3 | 0 |
| 성능 테스트 (1건) | 0 | 1 (1572.92ms) |

### 후속 수정 우선순위 (재정렬)

1. 결함 E — 성능 테스트 통과를 위해 인접 리스트 도입. 가장 큰 잔여 이슈이다.
2. 결함 D-2 — 자식 둘 중 더 작은 쪽 선택으로 정정. 현 테스트에서는 우연히 표면화되지 않았지만 잠재 결함이다.
3. 결함 F — 완화식 가독성 정리.

---

## 재분석 3회 (2026-05-26)

### 코드 변경 사항

1. 인접 리스트 `adjacentList: [number, number][][]`를 도입하고, 메인 루프의 인접 탐색을 `edges.filter` 대신 `adjacentList[distanceU[0]]` 순회로 교체했다.
2. `pop`의 힙 다운에서 자식 검사 순서를 "오른쪽 → 왼쪽"에서 "왼쪽 → 오른쪽"으로 바꿨다.

### 개선된 부분

- **결함 E 부분 해결**: 인접 탐색 자체는 인접 리스트로 바뀌어 정점당 $O(|N(u)|)$로 떨어졌다. 성능 테스트 실행 시간이 1572.92ms에서 약 12.05ms로 측정되어 100ms 미만의 영역에 들어갔다. (다만 다른 결함으로 인해 TypeError가 발생해 해당 테스트는 실패 처리됨.)

### 새로 도입된 결함

#### 결함 G: 인접 리스트 sparse 초기화 — `for ... of undefined` TypeError (회귀)

```ts
const adjacentList: [number, number][][] = [];

edges.map((edge) => {
  if (adjacentList[edge[0]]) {
    adjacentList[edge[0]]!.push([edge[1], edge[2]]);
  } else {
    adjacentList[edge[0]] = [[edge[1], edge[2]]];
  }
});
// ...
for (let edge of adjacentList[distanceU[0]!]!) { ... }
```

`adjacentList`는 길이 0의 배열로 시작하고, **출발 정점이 한 번도 등장한 적 없는 정점에 대해서는 키 자체가 존재하지 않는다**. 따라서 다음 두 부류의 정점에서 `adjacentList[u]`는 `undefined`다.

- 인접 간선이 없는 말단 정점(예: 선형 그래프 0→1→2→3 에서 정점 3).
- `edges = []`인 그래프의 모든 정점.
- 도달 불가 정점이라도 일단 큐에 들어가는 경우는 없으니 안전하지만, src 자체가 위 두 부류일 수 있다.

`for ... of undefined`는 TypeError를 던지므로 다음 테스트들이 전부 런타임 오류로 실패했다.

```
TypeError: undefined is not an object (evaluating 'adjacentList[distanceU[0]]')
  at dijkstra (.../dijkstra.ts:43:22)
```

이로 인해 직전 회차에서 통과하던 정확성 테스트 9건이 회귀했다.

**수정 방향**: 함수 시작부에서 길이 $n$의 빈 배열을 미리 채워 sparse 접근을 막는다.

```ts
const adjacentList: [number, number][][] = Array.from({ length: n }, () => []);
for (const [u, v, w] of edges) {
  adjacentList[u]!.push([v, w]);
}
```

또는 메인 루프에서 `adjacentList[u] ?? []`로 옵셔널 접근한다. 전자가 인접 리스트의 형식적 정의("정점마다 인접 정점 목록을 가진 길이 $n$의 배열")와 일치하므로 권장된다.

#### 잔존 결함 D-2 (검사 순서만 바뀜)

`pop` 내부 비교 순서가 "오른쪽 → 왼쪽"에서 "왼쪽 → 오른쪽"으로 교체되었지만, **여전히 "두 자식 중 더 작은 쪽"을 선택하지 않는다**. 첫 번째로 검사한 자식이 부모보다 작으면 즉시 그쪽과 swap하므로, 이전과 대칭되는 실패 케이스가 만들어진다.

- 부모 $10$, 왼쪽 $5$, 오른쪽 $1$ → 왼쪽 $5 < 10$이라 왼쪽과 swap → 부모 $5$, 왼쪽 $10$, 오른쪽 $1$. 부모 $5 >$ 오른쪽 $1$ → min-heap invariant 파괴.

수정 방향은 직전 회차와 동일하다(자식 둘과 부모 중 최솟값을 결정한 뒤 한 번만 swap).

#### 잔존 결함 F

완화식의 `result[distanceU[0]]` 참조는 그대로다.

### 테스트 결과 (3회차)

```
3 pass
10 fail
Ran 13 tests across 1 file. [45.00ms]
```

| 카테고리 | 통과 | 실패 | 실패 원인 |
|---------|------|------|----------|
| 기본 동작 (4건) | 1 | 3 | 결함 G (TypeError) |
| 엣지 케이스 (5건) | 1 | 4 | 결함 G |
| 바운더리 테스트 (3건) | 1 | 2 | 결함 G |
| 성능 테스트 (1건) | 0 | 1 | 결함 G (간선이 없는 정점 접근 시 TypeError) |

직전 회차 대비 정확성 통과 수가 12 → 3으로 줄어든 회귀이다. 다만 인접 탐색 시간은 정상 동작 시 약 12ms로 측정되어, 결함 G만 정정하면 성능 테스트도 자연스럽게 통과할 가능성이 크다.

### 후속 수정 우선순위 (재정렬)

1. **결함 G** — 인접 리스트를 `Array.from({ length: n }, () => [])`로 사전 채우기. 가장 시급한 회귀 차단.
2. 결함 D-2 — 자식 둘 중 더 작은 쪽 선택으로 정정. 잠재 결함.
3. 결함 F — 완화식 가독성 정리.

---

## 재분석 4회 (2026-05-26)

### 코드 변경 사항

`adjacentList` 초기화를 길이 $n$의 빈 배열들로 사전 채우는 방식으로 교체했다.

```ts
const adjacentList: [number, number][][] = Array.from(
  { length: n },
  () => [],
);
```

### 개선된 부분 — 전 테스트 통과

`bun test` 결과:

```
13 pass
0 fail
Ran 13 tests across 1 file. [48.00ms]
```

- **결함 G 해결**: 모든 정점에 대해 `adjacentList[u]`가 정상 배열을 가리키므로 `for ... of`가 TypeError 없이 빈 순회로 처리된다.
- 정확성 테스트 12건이 다시 통과 상태로 복귀했다.
- **성능 테스트 통과**: 전체 13건 실행에 48ms. V=10^4, E≈5·10^4 그래프에 대해 100ms 미만의 영역에서 동작함이 확인되었다. 결함 E의 알고리즘적 해결 + 결함 G 정정으로 성능 목표를 달성했다.

### 잔존 (잠재) 결함

#### 결함 D-2: 자식 둘 중 더 작은 쪽 미선택 (정확성 잠재 위험)

`PriorityQueue.pop`의 힙 다운은 여전히 한 번에 한쪽 자식만 검사한다. 현재 테스트 셋에서는 잘못된 출력으로 이어지지 않았지만, 다음과 같은 입력에서 min-heap invariant가 깨진다.

- 부모 키 $10$, 왼쪽 자식 $5$, 오른쪽 자식 $1$.
- 왼쪽 $5 < 10$이라 즉시 왼쪽과 swap → 부모 $5$, 왼쪽 $10$, 오른쪽 $1$. 부모 $5 >$ 오른쪽 $1$ → invariant 파괴.

다른 테스트가 추가되거나 입력 분포가 달라지면 잘못된 최단 거리로 이어질 수 있다.

**수정 방향**: 한 변수 `smallest`를 두고 두 자식과 부모 중 최솟값을 결정한 뒤 한 번만 swap한다.

#### 결함 F: 완화식의 일관성

완화식이 `result[distanceU[0]]`을 더해 갱신하는 구조는 그대로다. 정확성에는 영향이 없다.

#### 사소한 사항: `edges.map`의 죽은 분기

```ts
edges.map((edge) => {
  if (adjacentList[edge[0]]) {
    adjacentList[edge[0]]!.push([edge[1], edge[2]]);
  } else {
    adjacentList[edge[0]] = [[edge[1], edge[2]]];
  }
});
```

이제 `adjacentList`가 사전에 모두 빈 배열로 채워져 있으므로 `if` 분기만 항상 실행된다. `else` 분기는 도달 불가 코드이다. 또한 부수 효과 목적의 순회에는 `map`보다 `for...of`나 `forEach`가 의도 표현에 더 적합하다. 정확성/성능에는 영향이 없는 가독성 사항이다.

### 테스트 결과 표 (4회차)

| 카테고리 | 통과 | 실패 |
|---------|------|------|
| 기본 동작 (4건) | 4 | 0 |
| 엣지 케이스 (5건) | 5 | 0 |
| 바운더리 테스트 (3건) | 3 | 0 |
| 성능 테스트 (1건) | 1 | 0 |
| **합계** | **13** | **0** |

### 후속 정리(선택)

전 테스트가 통과한 상태이므로 더 이상 필수 수정 사항은 없다. 다음은 견고성과 가독성을 위한 선택적 항목이다.

1. 결함 D-2 — 잠재 결함 차단을 위해 표준 힙 다운 절차로 교체.
2. 결함 F — `distanceU[1]` 사용으로 완화식 정리.
3. `edges.map` 죽은 분기 제거.

---

## 재분석 5회 (2026-05-26)

### 코드 변경 사항

1. `result` → `distanceTable`, 메인 루프 내부의 자주 쓰는 인덱스를 `uIdx`, `vIdx`, `weight` 지역변수로 추출. 가독성 정리.
2. `edges.map`의 `if (adjacentList[edge[0]]) … else …` 죽은 분기 제거. 사전에 `Array.from({ length: n }, () => [])`로 채워두므로 항상 `push`만 하면 된다.
3. `PriorityQueue.pop`의 힙 다운을 "두 자식 중 더 작은 쪽을 골라 한 번만 swap" 형태로 변경. 결함 D-2를 의도적으로 정정하려 한 변경이다.

```ts
const minChildIdx =
  this.values[childrenIdx[0]!]! < this.values[childrenIdx[1]!]!
    ? childrenIdx[0]!
    : childrenIdx[1]!;
if (this.values[minChildIdx]! < this.values[parentIdx]!) {
  // swap with minChildIdx
}
```

### 개선된 부분

- **`edges.map` 정리**: 죽은 else 분기가 제거되어 인접 리스트 구성이 단순해졌다.
- **결함 F 해소(코드 형태)**: 완화식이 `distanceTable[uIdx] + weight`로 작성되어 의도가 명확해졌다. 명시적으로 `distanceU[1]`을 사용하는 것은 아니지만, stale 검사가 둘을 같게 보장하므로 정확성·가독성 모두 적정 상태이다.
- 테스트 결과 변동 없음: **13 pass / 0 fail, 75ms**.

### 새로 도입된 결함

#### 결함 H: 힙 다운에서 배열 객체를 `<`로 비교 (정확성 잠재 위험)

`PriorityQueue.values`의 원소는 `[정점, 거리]` 형태의 길이 2 배열이다. 새 힙 다운 코드는 거리 키가 아니라 **배열 객체 자체**를 `<` 연산자로 비교한다.

```ts
this.values[childrenIdx[0]!]! < this.values[childrenIdx[1]!]!
```

자바스크립트의 `<`는 양쪽 피연산자에 `ToPrimitive`를 적용한다. 배열은 `toString()` 결과인 쉼표 결합 문자열로 변환되어 **문자열 사전식 비교**가 이루어진다.

- 예 1: 왼쪽 자식 `[5, 10]`, 오른쪽 자식 `[2, 11]`. 거리 기준 최소는 왼쪽($10 < 11$). 그러나 `"5,10" < "2,11"`은 첫 문자 비교에서 `"5" > "2"`이므로 false. 결과적으로 `minChildIdx = childrenIdx[1]` (거리 $11$인 오른쪽)이 선택된다. 잘못된 자식 선택.
- 예 2: 오른쪽 자식이 힙 범위 바깥(`childrenIdx[1] >= values.length`)인 경우 `this.values[childrenIdx[1]!]`는 `undefined`. `array < undefined`는 양쪽이 모두 NaN으로 변환되어 결과가 false. `minChildIdx = childrenIdx[1]` = 범위 밖 인덱스. 이어지는 `this.values[minChildIdx]! < this.values[parentIdx]!` 비교도 `undefined < array` 형태라 NaN → false. `else` 분기로 `break`. 왼쪽 자식이 부모보다 작아도 swap이 일어나지 않아 invariant가 깨질 수 있다.

또한 같은 비교 패턴이 부모-최소자식 비교 `this.values[minChildIdx]! < this.values[parentIdx]!`에도 적용되어 같은 결함을 공유한다.

**왜 13개 테스트가 통과했는가**: 현재 입력들은 (a) 정점 인덱스 크기 자체가 거리 우선순위와 우연히 같은 방향으로 정렬되거나, (b) 잘못된 자식을 선택해도 lazy deletion이 stale 항목을 흡수하면서 최종 거리 배열이 동일해지는 경로로 흘렀거나, (c) 한쪽 자식만 존재하는 노드에서는 NaN 분기로 그냥 종료되는데 그 시점의 invariant 파괴가 결과에 영향을 못 미친 것으로 추정된다. 입력 분포가 바뀌면 잘못된 거리가 산출될 수 있는 잠재 결함이다.

**수정 방향**:

```ts
const leftDist = this.values[childrenIdx[0]!]![1]!;
const rightExists = childrenIdx[1]! < this.values.length;
const rightDist = rightExists ? this.values[childrenIdx[1]!]![1]! : Number.POSITIVE_INFINITY;
const minChildIdx = leftDist <= rightDist ? childrenIdx[0]! : childrenIdx[1]!;
if (this.values[minChildIdx]![1]! < this.values[parentIdx]![1]!) {
  // swap with minChildIdx
}
```

핵심은 두 가지이다.
- 비교 대상에서 **거리 키(`[1]`)만 꺼내** 숫자로 비교한다. 배열 객체나 정점 인덱스가 비교에 끼어들지 않도록 한다.
- 오른쪽 자식이 범위를 벗어났을 때를 명시적으로 처리한다(거리 $+\infty$로 간주해 항상 왼쪽이 선택되도록).

### 테스트 결과 표 (5회차)

| 카테고리 | 통과 | 실패 |
|---------|------|------|
| 기본 동작 (4건) | 4 | 0 |
| 엣지 케이스 (5건) | 5 | 0 |
| 바운더리 테스트 (3건) | 3 | 0 |
| 성능 테스트 (1건) | 1 | 0 |
| **합계** | **13** | **0** |

### 후속 정리(선택)

전 테스트가 통과 상태이므로 필수 수정은 없다. 잠재 결함 차단을 위한 선택 항목은 결함 H 하나로 좁혀졌다.

1. **결함 H** — 힙 다운의 자식/부모 비교를 거리 키(`[1]`) 기반 숫자 비교로 정정. 오른쪽 자식 부재 케이스 명시 처리.

---

## 재분석 6회 (2026-05-26)

### 코드 변경 사항

`PriorityQueue.pop`의 힙 다운에서 자식/부모 비교를 거리 키(`[1]`)만 꺼내는 숫자 비교로 정정했다.

```ts
const minChildIdx =
  this.values[childrenIdx[0]!]![1]! < this.values[childrenIdx[1]!]![1]!
    ? childrenIdx[0]!
    : childrenIdx[1]!;
if (this.values[minChildIdx]![1]! < this.values[parentIdx]![1]!) {
  // swap
}
```

### 개선된 부분

- **결함 H 일부 해결**: 두 자식의 거리 키만 비교하므로 배열 객체에 대한 문자열 사전식 비교 문제가 사라졌다. 직전 회차에서 잘못된 자식 선택으로 invariant가 깨질 수 있던 시나리오는 제거된다.

### 새로 도입된 결함

#### 결함 H': 오른쪽 자식이 범위 밖일 때 TypeError (회귀)

`childrenIdx[0]! < this.values.length`만 검사하고 진입하므로, **오른쪽 자식 `childrenIdx[1]!`이 힙 길이를 넘는 경우** `this.values[childrenIdx[1]!]`가 `undefined`이고, 그에 대한 `[1]` 접근에서 TypeError가 발생한다.

```
TypeError: undefined is not an object (evaluating 'this.values[childrenIdx[1]][1]')
  at pop (.../dijkstra.ts:111:69)
```

이 경로는 부모가 정확히 왼쪽 자식 하나만 가지는 상태(힙 크기가 짝수인 노드 위치)에서 발생한다. 예: 힙 크기 2일 때 루트의 자식은 인덱스 1만 존재하고 인덱스 2는 없음.

이로 인해 다음 테스트가 실패한다.

- 바운더리 테스트 > 완전 그래프 (V=5)
- 성능 테스트 > V=10^4, E≈5·10^4 그래프

5회차 통과 13건 중 2건이 회귀한 상태다.

**수정 방향**: 오른쪽 자식 인덱스가 범위 안에 있을 때만 그 쪽을 후보로 본다.

```ts
let minChildIdx = childrenIdx[0]!;
if (
  childrenIdx[1]! < this.values.length &&
  this.values[childrenIdx[1]!]![1]! < this.values[minChildIdx]![1]!
) {
  minChildIdx = childrenIdx[1]!;
}
if (this.values[minChildIdx]![1]! < this.values[parentIdx]![1]!) {
  // swap
}
```

표준 절차의 구체화이다. 오른쪽 자식 존재 여부를 한 단계로 분리해 처리한다.

#### 결함 F (가독성)

`distanceTable[uIdx] + weight`로 정리되어 코드 의도는 명확하지만, stale 검사 직후의 `distanceU[1]`을 직접 사용하는 형태가 가장 직관적이다. 정확성에는 영향 없음.

### 테스트 결과 (6회차)

```
11 pass
2 fail
Ran 13 tests across 1 file. [41.00ms]
```

| 카테고리 | 통과 | 실패 | 실패 원인 |
|---------|------|------|----------|
| 기본 동작 (4건) | 4 | 0 | — |
| 엣지 케이스 (5건) | 5 | 0 | — |
| 바운더리 테스트 (3건) | 2 | 1 | 결함 H' (V=5 완전 그래프) |
| 성능 테스트 (1건) | 0 | 1 | 결함 H' (V=10^4) |

직전 회차(13 pass) 대비 2건 회귀이다. 결함 H의 한 측면을 고치는 과정에서 다른 측면(범위 검사)을 빠뜨려 발생했다.

### 후속 수정 우선순위

1. **결함 H'** — 오른쪽 자식 인덱스의 범위 검사를 추가해 회귀 차단. 위 의사코드 그대로 적용 가능.
2. 결함 F — 선택적 가독성 정리.

---

## 재분석 7회 (2026-05-26)

### 코드 변경 사항

`PriorityQueue.pop`의 힙 다운에 오른쪽 자식 범위 검사가 분리 추가되었다.

```ts
let [childL, childR] = this.searchChildren(0);
while (childL! < this.values.length) {
  let minChildIdx: number;

  if (childR! > this.values.length - 1) {
    minChildIdx = childL!;
  } else {
    minChildIdx =
      this.values[childL!]![1]! < this.values[childR!]![1]!
        ? childL!
        : childR!;
  }

  if (this.values[minChildIdx]![1]! < this.values[parentIdx]![1]!) {
    // swap, parentIdx ← minChildIdx
  } else {
    break;
  }

  [childL, childR] = this.searchChildren(parentIdx);
}
```

핵심 변경점:
- 자식 인덱스를 `childL`, `childR`로 구조 분해.
- `childR > length - 1`(즉 `childR >= length`)인 경우 `minChildIdx`를 왼쪽 자식으로 고정.
- 그 외 경우에는 두 자식의 거리 키만 비교해 더 작은 쪽을 선택.

### 개선된 부분 — 결함 H' 해결

`bun test` 결과:

```
13 pass
0 fail
Ran 13 tests across 1 file. [46.00ms]
```

- 오른쪽 자식이 부재한 노드에서 `undefined.[1]` 접근으로 발생하던 TypeError가 사라졌다.
- 직전 회차에서 회귀하던 "완전 그래프(V=5)", "V=10^4 성능 테스트"가 모두 통과한다.
- 표준 힙 다운 절차(자식 둘 중 더 작은 쪽 선택 + 부모와 비교 후 단일 swap + 자식 인덱스 갱신)를 모두 만족한다.

### 잔존 결함

#### 결함 F (가독성 선택 사항)

완화식이 `distanceTable[uIdx] + weight`로 stale 검사 이후 동일 값을 참조하므로 정확성에는 영향이 없다. `distanceU[1]`를 명시적으로 사용하면 한 단계 더 직관적이지만, 현재 형태도 충분히 명확하다. 필수 수정은 아니다.

### 테스트 결과 표 (7회차)

| 카테고리 | 통과 | 실패 |
|---------|------|------|
| 기본 동작 (4건) | 4 | 0 |
| 엣지 케이스 (5건) | 5 | 0 |
| 바운더리 테스트 (3건) | 3 | 0 |
| 성능 테스트 (1건) | 1 | 0 |
| **합계** | **13** | **0** |

### 최종 상태 요약

알고리즘적으로는 표준 Dijkstra(min-heap + lazy deletion) 구현이 완성되었다. 처음 분석에서 식별한 결함 A~F와 그 과정에서 파생된 결함 G, H, H' 모두 정정되었다. 정확성·성능 모두 테스트 기준을 만족하며, 잔존 항목은 선택적 가독성 정리(결함 F) 한 가지뿐이다.

---

## 재분석 8회 (2026-05-26)

### 코드 변경 사항

메인 루프에서 `pop`의 반환값을 `u`로 받고, `distanceU = u[1]`, `uIdx = u[0]`로 분리한 뒤 완화식이 `distanceTable[uIdx] + weight` 대신 **`distanceU + weight`** 를 사용하도록 정리되었다.

```ts
const u = priorityQ.pop();
if (u instanceof Error) {
  break;
}

const distanceU = u[1]!;
const uIdx = u[0]!;
if (distanceU! > distanceTable[uIdx]!) {
  continue;
}

for (let edge of adjacentList[uIdx]!) {
  const vIdx = edge[0]!;
  const weight = edge[1]!;
  if (distanceTable[vIdx]! > distanceU! + weight) {
    distanceTable[vIdx] = distanceU! + weight;
    priorityQ.push([vIdx, distanceTable[vIdx]]);
  }
}
```

### 개선된 부분 — 결함 F 해결

- stale 검사를 통과한 시점의 `u[1]`(= 꺼낸 정점의 확정 거리)을 명시적으로 사용해 완화식이 표준 정의 $dist[v] \leftarrow \min(dist[v], dist[u] + w(u, v))$와 1:1로 대응된다.
- stale 검사 이후 `distanceTable[uIdx]`와 `distanceU`가 같은 값임은 보장되지만, 변수 의미가 명확해져 차후 수정 시 발생할 수 있는 미세 버그의 표면이 사라졌다.
- 테스트 결과 유지: **13 pass / 0 fail, 107ms**.

### 잔존 결함

없음. 처음 분석에서 식별한 결함 A~F와 도입 과정에서 파생된 결함 G, H, H' 모두 정정되었고, 가독성 측면의 마지막 잔존 항목이었던 결함 F도 이번 회차에서 해소되었다.

### 테스트 결과 표 (8회차)

| 카테고리 | 통과 | 실패 |
|---------|------|------|
| 기본 동작 (4건) | 4 | 0 |
| 엣지 케이스 (5건) | 5 | 0 |
| 바운더리 테스트 (3건) | 3 | 0 |
| 성능 테스트 (1건) | 1 | 0 |
| **합계** | **13** | **0** |

### 최종 상태

- **정확성**: 13/13 통과. 단일 정점·도달 불가·다중 간선·가중치 0·셀프 루프·큰 가중치·시작점이 마지막 정점·완전 그래프·역방향 간선 미사용 등 명세에서 요구하는 모든 케이스에 대해 올바른 거리 배열을 반환한다.
- **시간 복잡도**: 인접 리스트 사전 구성 $O(V + E)$, 힙 push/pop 연산 각 $O(\log V)$, 총 항목 수 $O(E)$로 전체 $O((V + E)\log V)$를 달성한다. V=10^4, E≈5·10^4 그래프에서 100ms 미만으로 동작함이 측정되었다.
- **공간 복잡도**: 인접 리스트 $O(V + E)$, 거리 배열 $O(V)$, 힙 $O(E)$로 전체 $O(V + E)$.
- **자료구조**: lazy deletion 패턴의 min-heap 우선순위 큐를 사용해 decrease-key 연산을 회피하면서 정점당 처리 1회를 보장한다. 힙 다운은 표준 절차(자식 둘 중 더 작은 쪽 선택 + 부모와의 단일 swap + 자식 인덱스 갱신 + 오른쪽 자식 범위 검사)를 모두 만족한다.

추가 정리·견고화의 여지는 다음과 같다(필수는 아님).

- `edges.map(...)`은 반환값을 쓰지 않는 부수 효과용 순회이므로 `for...of` 또는 `forEach`가 의도 표현에 더 적합하다.
- `pop`의 반환 타입에 `Error`를 섞기보다 `undefined` 반환으로 단순화하면 호출부의 `instanceof Error` 분기가 간단해진다(`while`의 `isEmpty` 검사로 이미 호출되지 않는 경로이므로 사실상 사문화된 분기다).

## 개인 정리

(이 영역은 사용자 본인이 작성하는 영역입니다.)
