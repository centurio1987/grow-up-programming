# Union-Find 해설

## 성능 목표 예측

| 제약 항목 | 값 |
|-----------|-----|
| 원소 수 $n$ | $\leq 10^5$ |
| 질의 수 $q$ | $\leq 10^5$ |
| 원소 인덱스 | 0-기반: $0 \leq x < n$ |

**naive 접근의 문제점**: 집합을 단순 배열로 표현하면 `union` 후 한 집합의 모든 원소에 새 대표를 업데이트해야 하여 최악 $O(n)$이다. 인접 리스트 그래프로 연결성을 확인하면 BFS/DFS로 $O(n + m)$이 필요하다. $q$번의 `union`과 `find`가 섞인 연산에서 총 $O(qn) = O(10^{10})$ → 시간 초과.

**목표 복잡도**: 세 연산 모두 분할 상환 $O(\alpha(n))$. 역 아커만 함수 $\alpha(n) \leq 4$ for $n \leq 10^{600}$이므로 사실상 $O(1)$이다. 전체 $q$회 연산에 $O(q\alpha(n)) \approx O(q)$.

**공간 복잡도**: $O(n)$. `parent`와 `rank` 배열 두 개만 유지한다.

---

## 목표 함수

```ts
class UnionFind {
  constructor(n: number): UnionFind
  find(x: number): number
  union(x: number, y: number): void
  connected(x: number, y: number): boolean
}
```

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `n` | 원소 개수 | $1 \leq n \leq 10^5$ |
| `x`, `y` | 원소 인덱스 | $0 \leq x, y < n$ |

**반환값**: `find(x)`는 $x$가 속한 집합의 대표 원소를 반환한다. 대표는 이후 `union` 호출에 의해 바뀔 수 있다. `connected(x, y)`는 $\text{find}(x) = \text{find}(y)$이면 `true`이다.

**엣지케이스**:
1. 초기 상태에서 `connected(x, y)` ($x \neq y$) → `false` (모든 원소가 독립).
2. `union(x, x)` → 이미 같은 집합. 아무 변화 없음.
3. `find(x)` when $x$ is root → `parent[x] == x`이므로 즉시 반환.
4. `union(x, y)` 반복 → 같은 집합이면 추가 연산 없음.
5. 여러 번 `union` 후 `find(x)` → 경로 압축으로 이후 호출이 더 빠르다.

---

## 핵심 아이디어

**핵심 아이디어**: "트리로 집합을 표현하고, 경로 압축과 랭크 합치기를 함께 쓰면 연산당 비용이 사실상 $O(1)$에 수렴한다."

여러 원소가 같은 그룹에 속하는지 판단하고 그룹을 합치는 연산이 반복될 때, 각 집합을 루트가 대표인 트리로 표현한다. 단순한 트리는 편향될 수 있으므로 두 가지 최적화를 추가한다. 첫째, `find` 시 경로 위 모든 노드를 루트에 직접 연결(경로 압축). 둘째, `union` 시 작은 트리를 큰 트리 아래에 붙임(랭크 합치기). 이 두 최적화의 시너지로 임의의 $q$번 연산 총 비용이 $O(q \alpha(n))$, 즉 사실상 선형이 된다.

**풀이 구조**
1. `parent[i] = i`, `rank[i] = 0`으로 초기화한다(각 원소가 독립된 집합)
2. `find(x)`: parent 체인을 따라 루트를 찾으면서 경로 위 모든 노드를 루트에 직접 연결한다
3. `union(x, y)`: 두 루트를 찾고, 랭크가 낮은 쪽을 높은 쪽 아래에 붙인다
4. `connected(x, y)`: `find(x) == find(y)` 여부로 판단한다

**조건**: 집합 병합(`union`)과 같은 집합 여부 확인(`find`)이 반복되지만, 집합 분리(split/cut)는 없는 상황

**대표 예시**: 그래프 연결 컴포넌트 관리
$10^5$개의 노드와 $10^5$개의 간선으로 이루어진 그래프에서 간선을 하나씩 추가하면서 "두 노드가 같은 연결 컴포넌트에 속하는가?"를 확인할 때, BFS/DFS로는 질의마다 $O(n)$이지만 Union-Find로는 전체 $q$번 연산이 사실상 $O(q)$에 처리된다. Kruskal 최소 신장 트리 알고리즘의 핵심 자료구조이기도 하다.

**언제 쓰나**
그래프 연결성, 클러스터링, 사이클 감지 등 집합 병합과 소속 확인이 반복되는 문제라면 Union-Find를 가장 먼저 고려한다. 간선 삭제가 필요하다면 Link-Cut Tree로 전환해야 한다.

---

### 원형 아이디어와 naive 접근

$n$개의 원소를 초기에 $n$개의 독립된 집합으로 시작하여, `union` 연산으로 집합을 합치고 `find`로 대표 원소를 반환하는 자료구조가 필요하다. 가장 단순한 방법은 각 원소의 대표를 직접 `id[x]`에 저장하는 것이다.

```
union(x, y): 모든 원소를 순회하며 id[y]를 id[x]로 바꿈 → O(n)
find(x): id[x] 반환 → O(1)
```

$q$번의 `union` 호출 시 총 $O(qn) = O(10^{10})$.

**폭발 지점**: 대표를 직접 유지하면 `union`이 $O(n)$이다. 트리 구조로 집합을 표현하면 `union`은 $O(1)$이 되지만 트리가 편향되면 `find`가 $O(n)$이 된다. 두 문제를 동시에 해결해야 한다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: 각 집합을 루트가 대표인 트리로 표현하면 `union`이 $O(1)$(두 루트를 연결)이고 `find`는 루트까지 올라가는 경로의 길이만큼이다. 문제는 트리가 편향될 수 있다는 것이다.
- **관찰 2**: 항상 "작은 트리를 큰 트리 아래에" 붙이면(랭크/크기 기준 합치기) 트리 높이가 $O(\log n)$을 넘지 않는다. 이것만으로 `find`가 $O(\log n)$이 된다.
- **관찰 3**: `find(x)` 호출 시 $x$에서 루트까지 경로를 따라가면서, 경로 위의 모든 노드를 직접 루트에 연결(경로 압축)하면 이후 `find` 호출이 $O(1)$에 가까워진다. 두 최적화를 함께 사용하면 분할 상환 $O(\alpha(n))$이 달성된다.

### 관찰을 형식화: 상태/구조 정의

두 배열을 유지한다:

$$\text{parent}[x] = \begin{cases} x & \text{if } x \text{는 대표(루트)} \\ \text{x의 부모} & \text{otherwise} \end{cases}$$

$$\text{rank}[x] = x \text{를 루트로 하는 서브트리의 높이 상한}$$

초기값: $\text{parent}[i] = i$, $\text{rank}[i] = 0$ for all $i \in [0, n)$.

이 형태여야 하는 근거: `find(x)`는 `parent` 체인을 따라 루트를 찾고, 경로 압축으로 경로 위 노드들의 `parent`를 루트로 직접 연결한다. `rank`는 두 루트를 합칠 때 낮은 랭크 트리를 높은 랭크 트리 아래에 붙이는 기준으로 사용된다.

### 점화식 또는 핵심 연산

**find(x)** — 경로 압축:

$$\text{find}(x) = \begin{cases}
x & \text{if } \text{parent}[x] = x \\
\text{parent}[x] \leftarrow \text{find}(\text{parent}[x]); \; \text{parent}[x] & \text{otherwise}
\end{cases}$$

재귀 호출 후 `parent[x]`를 루트로 직접 갱신한다. 이후 `find(x)` 호출 시 한 번의 비교만으로 루트를 반환한다.

**union(x, y)** — 랭크 기준 합치기:

$$r_x = \text{find}(x), \; r_y = \text{find}(y)$$
$$\text{if } r_x = r_y: \text{ return} \quad (\text{이미 같은 집합})$$
$$\text{if } \text{rank}[r_x] < \text{rank}[r_y]: \text{swap}(r_x, r_y)$$
$$\text{parent}[r_y] \leftarrow r_x$$
$$\text{if } \text{rank}[r_x] = \text{rank}[r_y]: \text{rank}[r_x] \mathrel{+}= 1$$

**connected(x, y)**:
$$\text{connected}(x, y) = (\text{find}(x) = \text{find}(y))$$

**분할 상환 $O(\alpha(n))$ 직관**: 경로 압축은 이후 `find`의 비용을 줄이고, 랭크 합치기는 트리의 최대 깊이를 $O(\log n)$으로 제한한다. 두 최적화의 상호작용으로 임의의 $q$번 연산 합이 $O(q \alpha(n))$임이 Tarjan(1975)에 의해 증명되었다. $\alpha(n) \leq 4$이므로 사실상 $O(q)$이다.

### 정당성 — 왜 이것이 옳은가

**find 정확성**: 경로 압축은 루트 이전의 모든 노드를 루트에 직접 연결한다. 이는 대표 원소를 바꾸지 않으므로 `find(x)`의 반환값은 압축 전후에 동일하다.

**union 정확성**: 두 루트를 연결하면 두 집합이 하나로 합쳐진다. 랭크가 높은 루트 아래에 낮은 랭크를 붙이므로 합친 트리의 높이가 최대 1 증가한다(같은 랭크일 때만).

**불변식**: 임의 시점에서 $\text{parent}[\text{root}] = \text{root}$이고, $\text{rank}[\text{root}]$는 해당 트리의 (경로 압축 전) 높이 상한이다.

**까다로운 케이스**: 경로 압축 재귀 구현은 스택 깊이가 $O(\log n)$을 넘지 않으나, 매우 깊은 트리에서는 스택 오버플로 위험이 있다. 반복 구현(iterative two-pass)을 사용하면 안전하다. `union(x, x)`: `find(x) == find(x)`이므로 return하여 안전하다.

### 구현 디테일과 최적화

**크기 기반 합치기(Union by Size)**: 랭크 대신 서브트리 크기를 기준으로 합치는 방법도 $O(\alpha(n))$을 달성한다. `size[root]`를 유지하고 작은 쪽을 큰 쪽 아래에 붙인다.

**반복 경로 압축**: 재귀 없이 두 번의 패스로 구현한다. 1패스: 루트를 찾고, 2패스: 경로 위 모든 노드의 `parent`를 루트로 갱신.

**함정**: `union` 시 `find(x)`와 `find(y)`를 별도로 호출해야 한다. `find(x)`와 `find(y)` 호출 결과가 같으면 이미 같은 집합이므로 아무것도 하지 않아야 한다. 이를 생략하면 루트에 자기 자신을 부모로 연결하는 오류가 발생할 수 있다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
class UnionFind(n):
    parent = [0, 1, 2, ..., n-1]   // 초기: 각자가 자신의 루트
    rank   = [0, 0, ..., 0]        // 초기 랭크 0
    // 불변식: parent[root] = root, rank[root] = 해당 트리 높이 상한

find(x) → number:
    if parent[x] != x:
        parent[x] = find(parent[x])   // 경로 압축: 루트를 직접 연결
    return parent[x]

union(x, y):
    rx = find(x)                       // x의 대표
    ry = find(y)                       // y의 대표
    if rx == ry: return                // 이미 같은 집합, 변화 없음
    if rank[rx] < rank[ry]:
        swap(rx, ry)                   // rx가 항상 더 높거나 같은 랭크
    parent[ry] = rx                    // 낮은 랭크 트리를 높은 쪽 아래로
    if rank[rx] == rank[ry]:
        rank[rx]++                     // 같은 랭크일 때만 높이 증가

connected(x, y) → boolean:
    return find(x) == find(y)
```

### Activity Diagram

```mermaid
flowchart TD
    A([find: x]) --> B{parent[x] == x?}
    B -- Yes → x가 루트 --> C([return x])
    B -- No → 루트 아님 --> D["parent[x] = find(parent[x])"]
    D --> E([return parent[x]])

    F([union: x, y]) --> G["rx=find(x), ry=find(y)"]
    G --> H{rx == ry?}
    H -- Yes → 이미 같은 집합 --> I([return, 변화 없음])
    H -- No --> J{rank[rx] >= rank[ry]?}
    J -- No → rx 랭크 낮음 --> K["swap(rx, ry)"]
    K --> L["parent[ry] = rx"]
    J -- Yes --> L
    L --> M{rank[rx] == rank[ry]?}
    M -- Yes → 높이 증가 --> N["rank[rx]++"]
    N --> O([done])
    M -- No --> O

    P([connected: x, y]) --> Q["find(x) == find(y)?"]
    Q --> R([return true 또는 false])
```

**핵심 불변식**: `parent[root] = root`이 모든 연산 전후에 성립하며, `rank[x]`는 경로 압축 이전 기준의 트리 높이 상한이다. 경로 압축과 랭크 기준 합치기를 함께 사용함으로써 분할 상환 $O(\alpha(n))$이 보장되며, 이는 $n \leq 10^5$ 범위에서 사실상 $O(1)$이다.
