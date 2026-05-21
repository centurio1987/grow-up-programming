# subtreeSumQuery 해설

## 성능 목표 예측

### 제약 표

| 항목 | 값 |
|------|-----|
| 정점 수 $n$ | $1 \leq n \leq 10^5$ |
| 연산 수 | 최대 $10^5$회 (update + querySubtree 합산) |
| 공간 | $O(n)$ |

### Naive 접근의 한계

부분 트리 합 질의를 가장 단순하게 구현하면 `querySubtree(u)` 호출 시 $u$를 루트로 하는 부분 트리를 DFS로 탐색하며 값을 직접 합산한다.

- `querySubtree`: $O(\text{subtree size}) \leq O(n)$
- `update`: $O(1)$ (배열 직접 갱신)
- 질의 $q$회: 총 $O(nq) = O(10^{10})$ → 시간 초과

### 목표 복잡도와 근거

| 연산 | 목표 복잡도 | 근거 |
|------|-------------|------|
| 전처리 (생성자) | $O(n \log n)$ | Euler Tour DFS + BIT 초기화 |
| `update` | $O(\log n)$ | BIT 점 갱신 |
| `querySubtree` | $O(\log n)$ | BIT 구간 합 |
| 공간 | $O(n)$ | BIT 배열 + Euler Tour 배열 |

BIT(Fenwick Tree)는 $O(n)$ 공간에 구간 합 질의와 점 갱신을 각각 $O(\log n)$에 처리한다. $n = 10^5$에서 $\log n \approx 17$이므로 연산당 17회 내외로 충분히 빠르다.

---

## 목표 함수

```ts
class SubtreeSumQuery {
  constructor(
    n: number,
    edges: [number, number][],
    root: number,
    values: number[]
  ): void

  update(node: number, value: number): void
  querySubtree(node: number): number
}
```

### 파라미터 표

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `n` | 정점의 수 | $1 \leq n \leq 10^5$ |
| `edges` | 무방향 간선 목록 $[u, v]$ | 길이 $n - 1$ |
| `root` | 트리의 루트 | $0 \leq \text{root} < n$ |
| `values` | 각 정점의 초기 값 | 길이 $n$ |
| `node` (update) | 갱신할 정점 | $0 \leq \text{node} < n$ |
| `value` (update) | 새로운 값 (교체, 누적 아님) | 정수 |
| `node` (querySubtree) | 부분 트리의 루트 | $0 \leq \text{node} < n$ |

### 반환값

- `update`: 반환 없음. 내부 BIT를 갱신한다.
- `querySubtree(u)`: 정점 $u$를 루트로 하는 부분 트리 내 모든 정점 값의 합.

### 엣지케이스

| 케이스 | 조건 | 기대 동작 |
|--------|------|-----------|
| 리프 노드 질의 | `u`의 자식 없음 | `values[u]`만 반환 |
| 루트 노드 질의 | `querySubtree(root)` | 모든 정점 값의 합 |
| 연속 update | `update(u, v1)`, `update(u, v2)` | 최신 `v2`만 반영 |
| 단일 정점 | $n=1$, `querySubtree(0)` | `values[0]` 반환 |

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

부분 트리 합을 직접 구하려면 DFS로 $u$의 모든 자손을 방문하며 값을 합산한다.

```
// naive querySubtree
function querySubtree_naive(u):
    total = values[u]
    for each child c of u:
        total += querySubtree_naive(c)
    return total
```

이 방법에서 시간이 폭발하는 이유:
- 최악의 경우(루트 질의) 모든 정점을 방문하여 $O(n)$.
- 질의 $q$회 시 $O(nq) = O(10^{10})$.
- `update`는 $O(1)$이지만 질의 비용이 너무 높다.

낭비의 본질: 같은 부분 트리 내 정점들을 질의마다 새로 탐색한다. 이 중복 탐색을 없애려면 부분 트리 정보를 **미리 구조화**해야 한다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: DFS 탐색 시 정점 $v$에 **진입 시각 $\text{in}[v]$** 와 **탈출 시각 $\text{out}[v]$** 를 부여하면, $v$의 부분 트리에 속하는 모든 정점의 진입 시각이 $[\text{in}[v], \text{out}[v]]$ 구간에 정확히 모인다.
- **관찰 2**: 위 관찰에 따라 부분 트리 합 질의는 **1차원 배열의 구간 합 질의**로 변환된다.
- **관찰 3**: BIT(Fenwick Tree)는 1차원 배열에서 점 갱신과 구간 합을 각각 $O(\log n)$에 처리하므로 이 구조에 딱 맞는다.

### 관찰을 형식화: 상태/구조 정의

**Euler Tour (DFS In/Out 타임스탬프)**:

DFS를 수행하며 전역 타이머를 관리한다. 정점 $v$에 처음 방문할 때 `timer++` 후 $\text{in}[v] = \text{timer}$를 기록하고, $v$의 모든 자손 방문을 마친 뒤 $\text{out}[v] = \text{timer}$를 기록한다.

**핵심 동치 관계**:

$$x \in \text{subtree}(v) \iff \text{in}[v] \leq \text{in}[x] \leq \text{out}[v]$$

이 동치 관계가 성립하는 이유: DFS는 $v$에 진입 후 $v$의 모든 자손을 남김없이 방문하고 탈출한다. 따라서 자손의 진입 시각은 반드시 $[\text{in}[v], \text{out}[v]]$ 내에 있다. 반대로 이 구간 밖의 정점은 $v$를 탈출한 뒤에 방문되었으므로 자손이 아니다.

**1차원 평탄화 배열**:

$$\text{flatVal}[\text{in}[v]] = \text{values}[v] \quad (\text{모든 } v)$$

이 정의가 이 형태여야 하는 이유: 다른 배열 순서(예: 임의 DFS 순서, 깊이 우선이 아닌 너비 우선)를 사용하면 부분 트리 정점들이 배열에서 연속된 구간을 점유하지 않아 구간 합으로 변환할 수 없다.

| 상태 변수 | 의미 |
|-----------|------|
| `in[v]` | $v$의 DFS 진입 시각 (1-indexed) |
| `out[v]` | $v$의 DFS 탈출 시각 |
| `curVal[v]` | 정점 $v$의 현재 값 (delta 계산용) |
| `bit[1..n]` | BIT 배열 |

### 점화식 또는 핵심 연산

**BIT 점 갱신 (`bitUpdate(i, delta)`)**:

$$\text{bit}[i] \mathrel{+}= \delta, \quad i \mathrel{+}= i \mathbin{\&} (-i) \quad (\text{while } i \leq n)$$

- $i \mathbin{\&} (-i)$: $i$의 최하위 set bit. BIT 내 $i$를 책임지는 구간 범위를 결정한다.
- $i$를 이 값만큼 증가시키면 $i$의 값 변화에 영향을 받는 상위 구간들을 순서대로 갱신한다.

**BIT 구간 합 (`bitQuery(i)`)** — 접두사 합 $\sum_{j=1}^{i}$:

$$s \mathrel{+}= \text{bit}[i], \quad i \mathrel{-}= i \mathbin{\&} (-i) \quad (\text{while } i > 0)$$

- $i \mathbin{\&} (-i)$만큼 감소시키면 $i$가 담당하는 구간을 순서대로 합산한다.

**update(node, value)**:

$$\delta = \text{value} - \text{curVal}[\text{node}]$$
$$\text{curVal}[\text{node}] \leftarrow \text{value}$$
$$\text{bitUpdate}(\text{in}[\text{node}], \delta)$$

- `curVal`로 이전 값을 추적하여 차분 $\delta$만 BIT에 반영한다. 이렇게 하면 BIT 내 절댓값이 아니라 변화량을 누적하는 방식으로 일관성을 유지한다.

**querySubtree(node)**:

$$\text{bitQuery}(\text{out}[\text{node}]) - \text{bitQuery}(\text{in}[\text{node}] - 1)$$

- $[\text{in}[v], \text{out}[v]]$ 구간의 합 = $[1, \text{out}[v]]$ 합 - $[1, \text{in}[v]-1]$ 합.

### 정당성 — 왜 이것이 옳은가

`querySubtree(v)`가 정확히 $\sum_{x \in \text{subtree}(v)} \text{values}[x]$를 반환함을 귀납적으로 보인다.

기저: 리프 노드 $v$의 경우, $\text{in}[v] = \text{out}[v]$이므로 구간 $[\text{in}[v], \text{out}[v]]$에는 $v$ 자신만 있다. `bitQuery(out[v]) - bitQuery(in[v]-1) = flatVal[in[v]] = values[v]`.

귀납: 내부 노드 $v$의 DFS 순서상 $[\text{in}[v], \text{out}[v]]$에는 $v$와 모든 자손이 포함된다 (Euler Tour 동치 관계). BIT는 이 구간의 합을 정확히 계산한다.

`update` 후의 정확성: $\delta = \text{new\_value} - \text{old\_value}$를 `in[node]` 위치에 더하면, `node`를 포함하는 모든 구간 질의 결과가 $\delta$만큼 변한다. `node`의 자손들의 `in` 값은 영향을 받지 않으므로 다른 부분 트리 질의는 그대로 유지된다.

`querySubtree(root)`의 경우: $\text{in}[\text{root}] = 1$, $\text{out}[\text{root}] = n$이므로 전체 구간 합 = 모든 정점 값의 합이 반환된다.

### 구현 디테일과 최적화

**반복적 DFS로 Euler Tour 구현**: 재귀 깊이가 $O(n)$에 달할 수 있으므로 반복적 DFS를 사용한다. 탈출 시각 기록을 위해 스택에 "탈출 마커"를 함께 넣는 방법이 일반적이다 (예: 음수 인덱스로 표시).

**BIT 1-indexed**: BIT는 1-indexed로 구현한다. `in[v]`를 1부터 시작하게 타이머를 설정해야 한다.

**update 시 delta 계산 필수**: `update(node, value)`에서 `curVal[node]`를 관리하지 않으면 BIT에 절댓값을 직접 쓰게 되어 중복 합산 오류가 발생한다. 예를 들어 `values[v] = 3`인 상태에서 `update(v, 5)`를 호출할 때 BIT에 5를 더하면 실제 값이 8이 되는 오류가 생긴다.

**함정 - in/out 범위 혼동**: `querySubtree`는 `bitQuery(out[node]) - bitQuery(in[node] - 1)`이다. `in[node]`로 빼면 `node` 자신이 제외되므로 반드시 `in[node] - 1`을 사용해야 한다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
class SubtreeSumQuery:
    in[0..n-1], out[0..n-1]   // Euler Tour 타임스탬프
    curVal[0..n-1]              // 각 정점의 현재 값 (delta 추적용)
    bit[1..n]                   // Fenwick Tree (1-indexed)

    constructor(n, edges, root, values):
        // 인접 리스트 구성
        adj[0..n-1] = []
        for each [u, v] in edges:
            adj[u].push(v), adj[v].push(u)

        // 반복적 DFS: Euler Tour 계산
        timer = 0
        stack = [(root, -1, false)]   // (정점, 부모, 탈출여부)
        while stack not empty:
            (v, par, leaving) = stack.pop()
            if leaving:
                out[v] = timer          // 불변식: in[v] <= out[v]
            else:
                in[v] = ++timer         // 불변식: in[root] = 1
                stack.push((v, par, true))          // 탈출 마커
                for u in adj[v] (역순, 부모 제외):
                    stack.push((u, v, false))

        // 초기 값으로 BIT 구성
        curVal[0..n-1] = values
        bit[1..n] = 0
        for v in 0..n-1:
            bitUpdate(in[v], values[v])

    bitUpdate(i, delta):           // BIT 점 갱신
        while i <= n:
            bit[i] += delta
            i += i & (-i)          // 불변식: i & (-i) = i의 최하위 set bit

    bitQuery(i):                   // BIT 접두사 합 [1..i]
        s = 0
        while i > 0:
            s += bit[i]
            i -= i & (-i)
        return s

    update(node, value):
        delta = value - curVal[node]   // 불변식: delta = 실제 변화량
        curVal[node] = value
        bitUpdate(in[node], delta)     // 불변식: in[node] 위치만 갱신

    querySubtree(node):
        // 불변식: [in[node], out[node]] = node 부분 트리의 flatVal 구간
        return bitQuery(out[node]) - bitQuery(in[node] - 1)
```

**핵심 불변식**: $x \in \text{subtree}(v) \iff \text{in}[v] \leq \text{in}[x] \leq \text{out}[v]$. 이 동치 관계로 인해 구간 합 $[\text{in}[v], \text{out}[v]]$이 정확히 부분 트리 합이 된다.

### Activity Diagram

```mermaid
flowchart TD
    A([생성자 호출]) --> B[인접 리스트 구성]
    B --> C[반복적 DFS\nin, out 타임스탬프 계산]
    C --> D[curVal 초기화\n= values 복사]
    D --> E[각 정점 초기 값을\nBIT에 삽입]
    E --> F([준비 완료])

    G([update node, value]) --> H[delta = value - curVal node]
    H --> I[curVal node = value]
    I --> J[bitUpdate in node, delta]

    K([querySubtree node]) --> L[bitQuery out node\n- bitQuery in node - 1]
    L --> M([부분 트리 합 반환])
```

**핵심 불변식**: `bit[i]`는 구간 $[i - \text{lowbit}(i) + 1, i]$에 속하는 `flatVal` 값들의 합을 저장하며, 이를 통해 접두사 합을 $O(\log n)$에 복원할 수 있다.
