# topologicalSort 해설

## 성능 목표 예측

| 제약 | 값 |
|------|----|
| 정점 수 $V$ | $1 \leq V \leq 10^5$ |
| 간선 수 $E$ | $0 \leq E \leq 10^5$ |
| 정점 번호 | $0 \ldots n-1$ |
| 그래프 종류 | 유향 (DAG이면 위상 정렬 존재, 사이클이면 null) |

**naive 접근의 비용**: 모든 순열 $\sigma: V \to \{0, \ldots, n-1\}$을 열거해 조건 $\forall (u,v) \in E: \sigma(u) < \sigma(v)$를 만족하는 것을 찾는다.
순열 수 $n!$ → $n = 10$만 돼도 $3.6 \times 10^6$, $n = 20$이면 $2.4 \times 10^{18}$ → 완전 불가.

조금 나은 방법: DFS로 후위 순서(post-order)를 기록해 역순 정렬한다.
$O(V + E)$ — 이것이 최선.

**목표**: Kahn's Algorithm(BFS 기반) 또는 DFS 후위 역순으로 $O(V + E)$ 안에 위상 정렬 또는 null을 반환한다.
$V + E \leq 2 \times 10^5$으로 충분히 빠르다.

**공간 트레이드오프**: 인접 리스트 $O(V + E)$ + inDegree 배열 $O(V)$ + 큐 $O(V)$.

---

## 목표 함수

```ts
function topologicalSort(n: number, edges: [number, number][]): number[] | null
```

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `n` | 정점 수 | $1 \leq n \leq 10^5$ |
| `edges` | 유향 간선 `[u, v]` ($u \to v$) 목록 | $0 \leq E \leq 10^5$ |
| 반환 | 유효한 위상 정렬 배열(복수 답 가능); 사이클 존재 시 `null` | — |

**엣지케이스**

1. **간선 없음**: 모든 정점의 진입차수가 0. 임의의 순서가 유효. 예: `[0, 1, ..., n-1]`.
2. **단방향 체인** $0 \to 1 \to 2$: 유일한 위상 정렬 `[0, 1, 2]`.
3. **사이클 존재**: null 반환. 사이클 내 정점들은 서로를 기다려 큐에 들어가지 못한다.
4. **다수의 유효 답**: 테스트는 검증 함수(validity checker)로 확인한다.

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

"모든 간선 $(u, v)$에 대해 $u$가 $v$보다 앞에 오는 순열"을 직접 구성하려면, 어떤 정점이 "먼저 올 수 있는가"를 따져야 한다.

가장 단순한 접근:

```
result = []
while result.length < n:
  찾기: 다른 모든 정점보다 먼저 올 수 있는 정점 v
  (= 결과에 아직 포함되지 않은 정점 중 진입차수가 0인 정점)
  result.append(v)
  v를 그래프에서 제거 (v에서 나가는 간선 삭제)
```

각 반복에서 "진입차수 0인 정점 찾기"에 $O(V)$를 쓰면 전체 $O(V^2)$ → $V = 10^5$이면 $10^{10}$ → 시간 초과.

문제의 근원: 매번 전체 정점을 스캔하면서 진입차수 0인 정점을 찾는다. 이미 알고 있는 "0이 될 정점" 목록을 유지하지 않는다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: 어떤 정점 $v$의 진입차수가 0이라는 것은, $v$가 "선행 조건 없이 처리 가능"하다는 의미이다. 이런 정점들을 큐로 관리하면 매번 $O(V)$ 탐색 없이 $O(1)$로 가져올 수 있다.
- **관찰 2**: 정점 $u$를 처리하고 나면(결과에 추가하면), $u$에서 나가는 간선 $(u, v)$를 "제거"한다. 이를 $\text{inDegree}[v]$를 1 감소시키는 것으로 구현한다. $\text{inDegree}[v] = 0$이 되는 순간 $v$를 큐에 넣는다.
- **관찰 3**: 처리된 정점 수가 $n$보다 작으면 처리되지 못한 정점들이 있다. 이들은 진입차수가 항상 $\geq 1$이었다는 뜻이고, 이는 곧 사이클의 존재를 의미한다.

### 관찰을 형식화: 상태/구조 정의

상태:

$$\text{inDegree}[v] = \text{간선 집합 } E \text{에서 } v \text{로 들어오는 간선 수}$$

처리 진행 중 $\text{inDegree}[v]$의 동적 의미:

$$\text{inDegree}[v]_{\text{현재}} = \text{아직 결과에 추가되지 않은 } v \text{의 선행 정점 수}$$

이 값이 0이 되는 순간 $v$의 모든 선행 조건이 충족된 것이므로 $v$를 결과에 추가할 수 있다.

왜 큐인가? FIFO 큐는 "이미 처리 가능해진 정점"들을 순서대로 꺼낸다. 위상 정렬의 답이 유일하지 않을 수 있으므로, 큐에서 꺼내는 순서가 하나의 유효한 위상 정렬을 결정한다. (우선순위 큐를 쓰면 사전순 최소 위상 정렬을 얻는다.)

### 점화식 또는 핵심 연산

초기화:

$$\text{inDegree}[v] = |\{u : (u, v) \in E\}| \quad \forall v \in V$$

처리 규칙 (정점 $u$를 결과에 추가할 때):

$$\forall (u, v) \in E: \quad \text{inDegree}[v] \leftarrow \text{inDegree}[v] - 1$$
$$\text{if } \text{inDegree}[v] = 0: \quad \text{큐에 } v \text{ 삽입}$$

사이클 판별:

$$\text{result.length} < n \iff \text{사이클 존재}$$

각 항의 의미:
- $\text{inDegree}[v]$를 $-1$: 간선 $(u, v)$를 "제거"하는 효과. $u$가 이미 정렬됐으므로 $v$는 이 의존성이 해소됨.
- $\text{inDegree}[v] = 0$: 더 이상 기다릴 선행 정점이 없다. 즉시 큐에 삽입 가능.
- 처리 수 $< n$: 일부 정점이 진입차수가 0이 되지 못했다는 뜻 = 사이클 내 정점이 서로를 기다림.

### 정당성 — 왜 이것이 옳은가

**완전성**: 그래프가 DAG라면, 위상 정렬이 반드시 존재하므로 Kahn's Algorithm은 항상 $n$개의 정점을 처리한다. 귀납적으로: 임의의 DAG에는 진입차수 0인 정점이 반드시 하나 이상 존재한다. 그 정점을 처리하고 나면, 남은 그래프도 DAG이므로 같은 논리가 반복 적용된다.

**정확성**: 큐에서 꺼낸 정점 $u$는, 이미 모든 선행 정점이 결과에 추가된 상태이다($\text{inDegree}[u] = 0$). 따라서 $u$ 이전에 처리된 정점들이 모두 $u$의 선행 정점이므로 위상 정렬 조건 $\sigma(u) < \sigma(v)$가 만족된다.

**사이클 탐지**: 사이클 $v_0 \to v_1 \to \cdots \to v_k = v_0$에서 각 정점의 진입차수는 사이클 내 간선 때문에 항상 $\geq 1$이다. 따라서 이 정점들은 큐에 절대 들어가지 못하고, `result.length < n`으로 사이클을 판별한다.

까다로운 케이스: 자기 루프 $(v, v)$. $\text{inDegree}[v] \geq 1$이 유지되어 큐에 들어가지 못함 → null 반환.

### 구현 디테일과 최적화

**inDegree 초기화 시점**: 간선 목록을 읽으며 즉시 `inDegree[v]++`하고, 초기에 0인 정점을 큐에 넣는다. 이 두 단계가 뒤섞이면 오류가 발생한다.

**inDegree[v]의 의미 변화 함정**: 처리 진행 중 `inDegree[v]`는 "원래 진입차수"가 아니라 "아직 처리되지 않은 선행 정점 수"로 의미가 바뀐다. 이 동적 의미를 혼동하면 잘못된 판별이 발생한다.

**큐 vs 스택**: DFS 후위 역순을 사용하는 방법도 $O(V + E)$이지만, 사이클 탐지를 위해 directedCycleDetection과 유사한 GRAY/BLACK 색 처리가 추가된다. Kahn's Algorithm은 사이클 탐지와 위상 정렬을 동시에 처리해 구현이 단순하다.

**다수의 유효 답**: 큐 대신 우선순위 큐(min-heap)를 쓰면 사전순 최소 위상 정렬을 얻는다. 일반 큐는 임의의 유효한 위상 정렬을 반환한다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
function topologicalSort(n, edges):
  adj[0..n-1]      = 빈 리스트
  inDegree[0..n-1] = 0          -- 불변식: 초기값 = 원래 진입차수

  for [u, v] in edges:
    adj[u].push(v)
    inDegree[v]++               -- v로 들어오는 간선 카운트

  queue = []
  for v in 0..n-1:
    if inDegree[v] == 0:
      queue.push(v)             -- 선행 조건 없는 정점 즉시 처리 가능

  result = []
  while queue is not empty:
    u = queue.shift()           -- 불변식: u는 현재 처리 가능한 정점 (inDegree = 0)
    result.push(u)

    for v in adj[u]:
      inDegree[v]--             -- 불변식: inDegree는 "아직 처리 안 된 선행 정점 수"
      if inDegree[v] == 0:
        queue.push(v)           -- 의존성 해소 → 즉시 큐에 삽입

  if result.length < n:
    return null                 -- 일부 정점이 큐에 못 들어감 = 사이클 존재
  return result
```

**핵심 불변식:**
`inDegree[v]`는 처리 진행 중 "아직 결과 배열에 추가되지 않은 $v$의 선행 정점 수"를 의미한다. 이 값이 0이 되는 순간이 $v$를 결과에 추가할 수 있는 최초이자 유일한 적기이다.

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B["인접 리스트 구성\ninDegree 계산"]
    B --> C["inDegree==0인 정점 → 큐"]
    C --> D{큐 비어있나?}
    D -- No --> E["u = 큐에서 꺼냄\n(inDegree[u]=0, 처리 가능)\nresult에 추가"]
    E --> F["u의 이웃 v 순회:\ninDegree[v]--"]
    F --> G{"inDegree[v] == 0?"}
    G -- "Yes (의존성 해소)" --> H["큐에 v 삽입"] --> F
    G -- No --> F
    F -- "모두 처리" --> D
    D -- Yes --> I{"result.length == n?"}
    I -- "Yes (모든 정점 처리)" --> J([result 반환])
    I -- "No (사이클 존재)" --> K([null 반환])
```
