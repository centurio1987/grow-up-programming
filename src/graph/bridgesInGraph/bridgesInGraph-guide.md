# bridgesInGraph 해설

## 성능 목표 예측

| 제약 | 값 |
|------|----|
| 정점 수 $V$ | $1 \leq V \leq 10^5$ |
| 간선 수 $E$ | $0 \leq E \leq 10^5$ |
| 정점 번호 | $0 \ldots n-1$ |
| 그래프 종류 | 무향 |

**naive 접근의 비용**: 각 간선 $(u, v)$를 제거한 뒤 연결 성분 수가 늘어나는지 BFS/DFS로 확인한다.
$E$개 간선 × 탐색 $O(V + E)$ = $O(E(V + E))$.
$V = E = 10^5$이면 $10^{10}$ 연산 → 시간 초과.

**목표**: DFS 한 번으로 모든 다리를 동시에 찾는다. 시간 $O(V + E)$, 공간 $O(V + E)$.
$V + E \leq 2 \times 10^5$이므로 수백만 연산으로 통과 가능.

**공간 트레이드오프**: 인접 리스트(공간 $O(V + E)$). 인접 행렬은 $O(V^2) = 10^{10}$ 바이트로 불가.

---

## 목표 함수

```ts
function bridgesInGraph(n: number, edges: [number, number][]): [number, number][]
```

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `n` | 정점 수 | $1 \leq n \leq 10^5$ |
| `edges` | 무향 간선 목록 `[u, v]` | $0 \leq E \leq 10^5$ |
| 반환 | 다리 간선 배열. 각 원소 `[u,v]`는 $u < v$로 정규화, 전체 사전순 정렬 | — |

**엣지케이스**

1. **간선 없음**: 다리 없음 → `[]`.
2. **트리** ($E = V - 1$): 모든 간선이 다리. 어떤 간선을 제거해도 두 성분으로 분리된다.
3. **사이클 내 간선**: 사이클 안의 간선은 다리가 아니다. 제거해도 사이클의 다른 경로로 연결 유지.
4. **다중 간선** $(u, v)$가 두 개 이상: 하나를 제거해도 나머지로 연결이 유지되므로 다리가 아니다. → 간선 인덱스 기반 부모 추적 필요.

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

가장 단순한 방법:

```
bridges = []
for (u, v) in edges:
  G' = G에서 간선 (u,v)를 제거
  if connected_components(G') > connected_components(G):
    bridges.append([u, v])
```

간선마다 BFS/DFS $O(V + E)$를 실행하므로 전체 $O(E(V + E)) = O(10^{10})$ → 시간 초과.

문제의 근원: 간선을 제거할 때마다 그래프 전체를 다시 탐색한다. DFS 탐색 중 쌓인 정보를 활용하지 않는다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: DFS 트리에서 트리 간선 $(u, c)$(단 $u$가 $c$의 부모)가 다리인지 판별하려면, $c$의 서브트리가 $u$ 또는 $u$의 조상으로 우회하는 경로(back edge)를 가지는지만 확인하면 된다.
- **관찰 2**: $c$의 서브트리에서 back edge로 올라갈 수 있는 가장 오래된 조상의 발견 시각을 $\text{low}(c)$로 정의하면, $\text{low}(c) > \text{disc}(u)$는 "$c$의 서브트리에서 $u$ 또는 그 위로 우회하는 경로가 전혀 없다"는 의미이다.
- **관찰 3**: $\text{low}$ 값은 DFS 진행 중 재귀적으로 계산할 수 있으므로, DFS 한 번으로 모든 간선에 대해 동시에 판별이 가능하다.

### 관찰을 형식화: 상태/구조 정의

두 값을 정의한다.

$$\text{disc}(v) = \text{DFS에서 } v \text{를 처음 방문한 타임스탬프}$$

$$\text{low}(v) = \min\!\left(\text{disc}(v),\;
  \min_{(v,\,w)\,\in\,\text{back edge}} \text{disc}(w),\;
  \min_{(v,\,c)\,\in\,\text{tree edge}} \text{low}(c)\right)$$

$\text{low}(v)$의 직관: "$v$의 서브트리에서 back edge를 통해 올라갈 수 있는 가장 오래된 조상의 타임스탬프."

왜 이 형태인가? 서브트리의 "우회 가능성"을 단 하나의 스칼라로 요약하기 위해서이다. 이 스칼라가 작을수록 서브트리가 더 높은 조상과 연결되어 있다.

다리 판정:

$$\text{bridge}(u, c) \iff \text{low}(c) > \text{disc}(u)$$

단절점과의 차이 비교:

| 구분 | 조건 | 등호 포함? |
|------|------|-----------|
| 단절점 | $\text{low}(c) \geq \text{disc}(v)$ | 포함 |
| 다리 | $\text{low}(c) > \text{disc}(u)$ | 미포함 |

단절점에서 등호를 포함하는 이유: $\text{low}(c) = \text{disc}(v)$이면 $c$의 서브트리가 back edge로 정확히 $v$에 닿는다. $v$를 제거하면 이 back edge도 사라진다 → 단절.
다리에서 등호를 제외하는 이유: $\text{low}(c) = \text{disc}(u)$이면 $c$의 서브트리가 $u$ 자신으로 back edge를 가진다 → $(u, c)$ 간선을 제거해도 $c$는 이 back edge를 통해 $u$에 연결된다 → 다리가 아님.

### 점화식 또는 핵심 연산

DFS(v, parentEdgeIdx)에서 $\text{low}(v)$ 갱신:

1. 초기화: $\text{disc}(v) \leftarrow \text{low}(v) \leftarrow \text{timer}$, $\text{timer}$++
2. 인접 $[w, \text{eidx}]$에 대해:
   - $\text{eidx} = \text{parentEdgeIdx}$이면 스킵 (부모 방향 간선, 다중 간선 대응)
   - $w$ 미방문이면 DFS$(w, \text{eidx})$ 후:
     - $\text{low}(v) \leftarrow \min(\text{low}(v),\, \text{low}(w))$
     - $\text{low}(w) > \text{disc}(v)$이면 $(v, w)$는 다리
   - $w$ 방문됨(back edge)이면: $\text{low}(v) \leftarrow \min(\text{low}(v),\, \text{disc}(w))$

각 항의 의미:
- 트리 간선에서 $\text{low}(w)$를 $v$로 전파: 자식 서브트리의 "우회 가능성"을 부모가 이어받음
- back edge에서 $\text{disc}(w)$를 사용: 방문된 정점 $w$의 발견 시각이 현재 서브트리의 새로운 "도달 가능 최솟값" 후보

### 정당성 — 왜 이것이 옳은가

$\text{low}(c) > \text{disc}(u)$이면, $c$의 서브트리에서 $\text{disc}$ 값이 $\text{disc}(u)$ 이하인 정점으로 가는 back edge가 전혀 없다. 즉, $c$의 서브트리에서 $u$나 그 조상에 도달하는 다른 경로가 없다. 따라서 $(u, c)$ 간선은 $u$와 $c$를 잇는 유일한 경로이고, 이를 제거하면 연결 성분이 증가한다 → 다리.

$\text{low}(c) = \text{disc}(u)$인 경우: $c$의 서브트리에서 $u$로 back edge가 존재한다. $(u, c)$를 제거해도 이 back edge로 $c$의 서브트리와 $u$가 여전히 연결 → 다리가 아님.

$\text{low}(c) < \text{disc}(u)$인 경우: $c$의 서브트리에서 $u$의 조상으로 back edge가 존재한다. $(u, c)$를 제거해도 우회 경로 존재 → 다리가 아님.

### 구현 디테일과 최적화

**다중 간선 처리 — 핵심 함정**: 부모 방향 간선을 "부모 정점 번호 $\text{parent}$"로 스킵하면, $(u, v)$ 간선이 두 개 이상 있을 때 두 번째 간선을 back edge로 잘못 처리한다. $\text{low}(v)$가 $\text{disc}(u)$로 갱신되어 다리 판정이 오류가 된다. 해결책: **간선 인덱스**를 인접 리스트에 저장하고, 온 방향의 간선 인덱스($\text{parentEdgeIdx}$)와 정확히 일치하는 간선만 스킵한다.

**결과 정규화**: 간선 $(v, w)$에서 $v > w$인 경우를 $[w, v]$로 바꿔 정규화하고, 전체를 사전순으로 정렬해야 출력 형식을 만족한다.

**재귀 깊이**: $V = 10^5$인 선형 그래프에서 재귀 깊이가 $10^5$에 달할 수 있다. 런타임에 따라 명시적 스택으로 전환이 필요할 수 있다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
timer = 0
disc[0..n-1] = -1              -- 불변식: -1은 미방문
low[0..n-1]  = -1
bridges = []

function dfs(v, parentEdgeIdx):
  disc[v] = low[v] = timer++   -- 불변식: disc[v]는 방문 순서; 이후 불변

  for [w, eidx] in adj[v]:
    if eidx == parentEdgeIdx:  -- 부모 방향 간선 스킵 (다중 간선 대응)
      continue

    if disc[w] == -1:          -- 트리 간선
      dfs(w, eidx)
      low[v] = min(low[v], low[w])  -- 자식 서브트리의 reach 전파

      if low[w] > disc[v]:          -- 불변식: w의 서브트리는 v 위로 못 올라감
        u = min(v, w); c = max(v, w)
        bridges.push([u, c])        -- 정규화하여 저장

    else:                      -- back edge
      low[v] = min(low[v], disc[w])  -- 도달 가능한 조상의 최소 disc 갱신

function bridgesInGraph(n, edges):
  adj[0..n-1] = 빈 리스트
  for i, [u, v] in enumerate(edges):
    adj[u].push([v, i])
    adj[v].push([u, i])         -- 무향: 양방향, 인덱스 함께 저장

  for v in 0..n-1:
    if disc[v] == -1: dfs(v, -1)

  bridges.sort()                -- 사전순 정렬
  return bridges
```

**핵심 불변식:**
$\text{low}(v)$는 $v$의 서브트리에서 back edge로 도달 가능한 가장 작은 $\text{disc}$ 값이다. $\text{eidx}$ 기반 부모 간선 스킵으로 다중 간선 환경에서도 이 불변식이 정확히 유지된다.

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B["인접 리스트 구성\n(간선 인덱스 포함)"]
    B --> C["disc/low = -1\ntimer = 0\nbridges = []"]
    C --> D[v = 0]
    D --> E{v < n?}
    E -- No --> K["bridges 사전순 정렬 후 반환"]
    E -- Yes --> F{"disc[v] == -1?"}
    F -- No --> J[v++] --> E
    F -- Yes --> G["DFS(v, -1)"]
    G --> J

    subgraph DFS["DFS(v, parentEdgeIdx)"]
        D1["disc[v]=low[v]=timer++"]
        D1 --> D2["인접 [w, eidx] 순회"]
        D2 --> D3{"eidx == parentEdgeIdx?"}
        D3 -- "Yes (부모 방향 스킵)" --> D2
        D3 -- No --> D4{"disc[w] == -1?"}
        D4 -- "Yes (트리 간선)" --> D5["DFS(w, eidx)\nlow[v]=min(low[v], low[w])"]
        D5 --> D6{"low[w] > disc[v]?"}
        D6 -- Yes --> D7["bridges에 [min(v,w), max(v,w)] 추가"] --> D2
        D6 -- No --> D2
        D4 -- "No (back edge)" --> D8["low[v]=min(low[v], disc[w])"] --> D2
        D2 -- "모두 처리" --> D9([반환])
    end
```
