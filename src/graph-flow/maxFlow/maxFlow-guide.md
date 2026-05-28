# maxFlow 해설

## 성능 목표 예측

| 항목 | 값 |
|------|----|
| 정점 V | $2 \leq V \leq 500$ |
| 간선 E | $0 \leq E \leq 10^4$ |
| 용량 c | $0 \leq c \leq 10^6$ |

**naive 접근의 문제점:**
가장 단순한 방법은 임의의 $s \to t$ 경로를 찾아 유량을 흘리는 Ford-Fulkerson이다.
DFS로 경로를 찾으면 반복 횟수가 최대 $|f^*|$ (최대 유량 값)이 되어,
$c = 10^6$이고 많은 간선이 있으면 $|f^*| = O(V \cdot c) = O(5 \times 10^8)$ 반복 → 시간 초과.

BFS로 최단 경로를 찾는 Edmonds-Karp는 $O(V \cdot E^2) = O(500 \times 10^8) = O(5 \times 10^{10})$ → 너무 느리다.

**목표 복잡도:** $O(V^2 \cdot E)$ (Dinic's 알고리즘), $O(V + E)$ 공간.

**근거:** Dinic's는 $O(V^2 \cdot E) = O(500^2 \times 10^4) = O(2.5 \times 10^9)$이 이론적 상한이지만, 실제 BFS 라운드 수와 차단 유량 소진 속도는 이론값보다 훨씬 빠르다. 단위 용량 그래프에서는 $O(E\sqrt{V})$가 보장된다.

**공간 복잡도:** 잔여 그래프를 인접 리스트로 $O(V + E)$, 레벨 배열 $O(V)$, 현재 간선 포인터 $O(V)$. 2D 행렬 없이 관리 가능하다.

---

## 목표 함수

```ts
maxFlow(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number
): { flow: number }
```

| 매개변수 | 의미 | 제약 |
|----------|------|------|
| `n` | 정점 개수 $V$ (인덱스: $0 \ldots n-1$) | $2 \leq n \leq 500$ |
| `edges` | 방향 간선 `[u, v, c]` (용량 $c$) | $E \leq 10^4$ |
| `source` | 소스 $s$ | $s \neq t$ |
| `sink` | 싱크 $t$ | $s \neq t$ |
| 반환값 | `{ flow }`: $s \to t$ 최대 유량 | — |

**엣지케이스:**

1. **간선 없음:** $s \to t$ 경로가 없으므로 `{ flow: 0 }`.
2. **$s$에서 $t$로의 직접 경로가 없음:** BFS에서 $t$에 도달 불가 → `{ flow: 0 }`.
3. **병렬 간선(같은 $u \to v$ 방향 여러 개):** 각각을 별개의 간선으로 잔여 그래프에 추가한다. 역방향 간선도 각각 별개로 관리해야 한다.
4. **source == sink (문제 제약상 불가하나 방어 처리):** 유량 정의상 0으로 처리 권장.
5. **최대 용량 경우:** $c = 10^6$, $E = 10^4$이면 이론적 최대 유량은 $5 \times 10^8$ 수준. `number` 타입으로 충분하다.

---

## 핵심 아이디어

**핵심 아이디어**: "BFS로 레이어 그래프를 만들고 그 안의 차단 유량을 DFS로 한 번에 소진한다 — 역방향 간선이 실수를 교정할 자유도를 제공한다."

Ford-Fulkerson은 임의 경로로 유량을 흘려 반복 횟수가 최대 유량 값에 비례한다. Dinic's는 BFS로 소스에서 싱크까지의 최단 경로 레이어 그래프를 구성하고, 그 안의 모든 증가 경로(차단 유량)를 DFS로 소진한다. 한 BFS 라운드가 끝나면 잔여 그래프에서 최단 경로 길이가 반드시 늘어나므로 BFS 라운드 수가 최대 $O(V)$회로 제한되고, 역방향 간선이 잘못된 경로 선택을 되돌릴 수 있게 해 전역 최적이 보장된다.

**풀이 구조**
1. 각 간선 $(u, v, c)$마다 정방향(용량 $c$)과 역방향(용량 0) 쌍을 잔여 그래프에 추가한다.
2. BFS로 $s$에서 각 정점까지의 레벨(`level`)을 계산한다. $t$에 도달 불가이면 종료한다.
3. 현재 간선 포인터 `iter`를 초기화하고 DFS로 차단 유량을 소진한다.
4. 유량이 0이 되면 다시 BFS로 돌아간다.
5. 모든 차단 유량을 소진하면 `totalFlow`를 반환한다.

**조건**: 방향 그래프이고 소스 $s \neq$ 싱크 $t$여야 한다. 역방향 간선의 `rev` 인덱스가 서로를 정확히 가리켜야 용량 갱신이 올바르게 동작한다.

**대표 예시**: 파이프 네트워크의 최대 처리량
정수장($s$)에서 각 가정($t$)까지 파이프망으로 보낼 수 있는 최대 수량을 구하는 문제다. 잔여 그래프와 역방향 간선이 "흐름을 되돌려 더 나은 경로를 탐색"하는 자유도를 주고, Dinic's의 레이어 구조가 이를 $O(V^2 E)$에 처리한다.

**언제 쓰나**
"소스에서 싱크로 흘릴 수 있는 최대 유량을 구하라"는 문제에서 사용한다. Ford-Fulkerson이 용량에 비례해 느려질 때, 또는 Edmonds-Karp가 $O(VE^2)$로 느릴 때 Dinic's가 표준 선택이다.

---

### 원형 아이디어와 naive 접근

유량 문제를 가장 단순하게 생각하면: $s$에서 $t$로의 경로를 하나 찾아, 그 경로의 병목 용량만큼 유량을 흘리고 반복한다.

```
naive (Ford-Fulkerson, DFS):
  totalFlow = 0
  while there exists a path s→t in residual graph:
    path = DFS(s, t)
    bottleneck = min capacity on path
    send bottleneck units along path
    totalFlow += bottleneck
  return totalFlow
```

**폭발 지점:** DFS는 임의의 경로를 찾으므로, 각 반복에서 단 1단위의 유량만 흘릴 수 있는 경우가 생긴다. 용량이 큰 그래프에서 반복 횟수 = 최대 유량 값 = $O(|f^*|)$가 되어 $O(10^8)$ 이상의 반복이 발생한다.

**근본 낭비:** 매 반복에서 같은 구조의 경로를 하나씩 처리하는 비효율. 비슷한 길이의 여러 경로를 한꺼번에 처리하지 못한다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1 (잔여 그래프의 필요성):** 한 번 흘린 유량을 나중에 "취소"할 수 있어야 더 큰 유량 경로를 발견할 수 있다. 역방향 간선이 이 자유도를 제공한다. 역방향 간선이 없으면 탐욕적으로 선택한 경로가 최적이 아닐 때 교정이 불가능하다.

- **관찰 2 (BFS 최단 경로의 장점):** BFS로 가장 짧은 $s \to t$ 경로를 찾으면, 한 경로를 처리할 때마다 잔여 그래프에서의 최단 경로 길이가 단조 증가한다. 이것이 Edmonds-Karp의 핵심이며 총 반복 횟수를 $O(V \cdot E)$로 제한한다.

- **관찰 3 (레이어 그래프 + 차단 유량):** 같은 레이어(최단 거리)의 모든 증가 경로를 한 번의 DFS 라운드에서 동시에 소진하면, BFS 라운드 수를 $O(V)$에서 실질적으로 훨씬 줄일 수 있다. 이것이 Dinic's 알고리즘의 핵심이다.

### 관찰을 형식화: 상태/구조 정의

**잔여 그래프 표현:**
각 원래 간선 $(u \to v, c)$에 대해 두 항목을 인접 리스트에 추가한다.
- 정방향: `{to: v, cap: c, rev: idx}` — `rev`는 역방향 간선의 인덱스
- 역방향: `{to: u, cap: 0, rev: idx}` — 초기 역용량 0

`cap`은 현재 잔여 용량(초기값에서 흘린 유량을 뺀 값)을 나타낸다.
정방향·역방향을 쌍으로 관리해 역방향 갱신을 $O(1)$에 수행한다.

**레벨 배열:**
- `level[v]`: BFS에서 $s$로부터 $v$까지의 최단 거리(레이어). $-1$이면 아직 도달 불가.

**현재 간선 포인터:**
- `iter[u]`: 정점 $u$에서 DFS가 다음에 시도할 간선의 인덱스.

`iter`를 사용하는 이유: DFS 중 한 번 실패한 간선을 재시도하면 $O(V \cdot E)$의 비용이 라운드당 추가된다. `iter`는 단조 증가하므로 이미 실패한 간선을 건너뛰어 라운드당 총 비용을 $O(V \cdot E)$에서 $O(E)$로 줄인다.

### 점화식 또는 핵심 연산

**BFS 레벨 할당:**

$$
\text{level}[v] = \text{level}[u] + 1 \quad \text{단, } \text{level}[v] = -1 \text{이고 } \text{cap}(u \to v) > 0
$$

- $\text{cap}(u \to v) > 0$: 잔여 용량이 있는 간선만 따라간다. 포화된 간선($\text{cap} = 0$)은 탐색 불가.

**DFS 차단 유량 탐색:**

$$
d = \text{DFS}(v, t, \min(\text{pushed}, \text{cap}(u \to v)))
$$

$$
\text{if } d > 0: \quad \text{cap}(u \to v) \mathrel{-}= d, \quad \text{cap}(v \to u) \mathrel{+}= d
$$

- `pushed`: 현재 경로에서 흘릴 수 있는 유량의 상한 (경로 위 최소 잔여 용량).
- `min(pushed, cap)`: 현재 간선이 병목이 될 경우 유량을 제한한다.
- 역방향 갱신 `cap(v→u) += d`: 이후 이 유량을 취소할 수 있는 역방향 경로를 열어둔다.

**레이어 조건:**

$$
\text{DFS 진행 조건}: \text{level}[v] = \text{level}[u] + 1
$$

- 레이어 조건을 벗어난 간선은 탐색하지 않아 최단 경로만 따른다.

### 정당성 — 왜 이것이 옳은가

**Dinic's의 정확성:** BFS 라운드마다 레이어 그래프를 구성하고, DFS로 그 안의 차단 유량(blocking flow)을 모두 소진한다. 차단 유량 소진 후 잔여 그래프의 최단 $s \to t$ 경로 길이가 최소 1 증가한다 (레이어 그래프의 성질). 따라서 BFS 라운드 수는 최대 $V - 1$회이다.

**역방향 간선의 정당성:** 역방향 간선을 따라 유량을 흘리는 것은 "기존에 흘린 유량의 일부를 취소"하는 것과 동치이다. 이 자유도가 없으면 탐욕적 경로 선택의 실수를 교정할 수 없다.

**까다로운 케이스:**
- 용량 0인 역방향 간선을 BFS에서 탐색하지 않음: `cap > 0` 조건으로 방지.
- $s$와 $t$가 분리된 경우: BFS에서 `level[t] == -1`이면 즉시 종료.
- `iter[u]`가 소진된 경우: DFS가 0을 반환하고 상위 호출에서 `iter[u]++`로 다음 간선을 시도한다.

### 구현 디테일과 최적화

- **`iter` 초기화 시점:** 매 BFS 라운드 시작 시 `iter[u] = 0`으로 초기화한다. 이전 라운드에서 소진된 간선은 새 레이어 그래프에서 다시 유효할 수 있으므로 초기화가 필요하다.

- **DFS 루프 구조:** `while iter[u] < len(graph[u])`로 간선을 순서대로 시도한다. 실패 시 `iter[u]++`로 넘어간다. 성공 시 즉시 반환해 불필요한 탐색을 피한다.

- **함정 — 역방향 간선 인덱스 불일치:** `addEdge(u, v, c)` 시 역방향 간선의 `rev` 인덱스가 서로를 가리켜야 한다. 간선 추가 순서가 중요하다. 정방향 추가 전에 `len(graph[v])`를 기록하고, 역방향 추가 후 `len(graph[u]) - 1`을 역방향의 `rev`로 사용한다.

- **함정 — `cap > 0` 조건 누락:** BFS와 DFS 모두 `cap > 0`인 간선만 탐색해야 한다. 이 조건이 없으면 포화된 간선을 통해 레이어를 할당하거나 유량 0의 경로를 탐색해 무한 루프가 발생할 수 있다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
// 잔여 그래프: graph[u][i] = {to, cap, rev}
// cap: 현재 잔여 용량 (불변식: cap ≥ 0)

function maxFlow(n, edges, s, t):
    graph[0..n-1] = []
    for (u, v, c) in edges:
        addEdge(u, v, c)               // 정방향 + 역방향 쌍 추가

    totalFlow = 0
    while BFS(s, t):                   // 불변식: BFS 성공 → level[t] ≥ 0
        iter[0..n-1] = 0               // 불변식: iter[u] = 다음 시도할 간선 인덱스
        while True:
            f = DFS(s, t, INF)
            if f == 0: break           // 차단 유량 소진
            totalFlow += f             // 불변식: totalFlow ≤ 실제 최대 유량

    return totalFlow

function addEdge(u, v, c):
    graph[u].push({to: v, cap: c,   rev: len(graph[v])})    // 정방향
    graph[v].push({to: u, cap: 0,   rev: len(graph[u])-1})  // 역방향

function BFS(s, t):
    level[0..n-1] = -1                 // 불변식: level[v] = s에서의 최단 거리
    level[s] = 0
    queue = [s]
    while queue not empty:
        u = dequeue(queue)
        for edge in graph[u]:
            if edge.cap > 0 and level[edge.to] == -1:
                level[edge.to] = level[u] + 1
                enqueue(queue, edge.to)
    return level[t] != -1             // t에 도달 가능한가?

function DFS(u, t, pushed):
    if u == t: return pushed           // 불변식: pushed = 경로 위 최소 잔여 용량
    while iter[u] < len(graph[u]):
        edge = graph[u][iter[u]]
        v = edge.to
        if edge.cap > 0 and level[v] == level[u] + 1:
            d = DFS(v, t, min(pushed, edge.cap))
            if d > 0:
                edge.cap -= d          // 불변식: cap 감소 후 비음수 유지
                graph[v][edge.rev].cap += d  // 역방향 용량 증가
                return d
        iter[u]++                      // 실패한 간선 건너뜀 (단조 증가)
    return 0

// 핵심 불변식:
//   level[t] = s→t BFS 최단 거리 (각 BFS 후).
//   DFS 중 level[v] == level[u]+1 경로만 탐색 → 최단 경로 보장.
//   iter[u]는 단조 증가 → 같은 라운드에서 실패 간선 재탐색 없음.
```

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B["잔여 그래프 구성\n(정방향 cap=c, 역방향 cap=0 쌍)"]
    B --> C["totalFlow = 0"]
    C --> D{BFS(s,t)\nlevel[t] ≥ 0?}
    D -- No(도달 불가) --> Z([return totalFlow])
    D -- Yes --> E["iter[0..n-1] = 0"]
    E --> F["f = DFS(s, t, INF)"]
    F --> G{f > 0?}
    G -- Yes --> H["totalFlow += f"]
    H --> F
    G -- No(차단 유량 소진) --> D

    subgraph BFS_sub["BFS (레벨 그래프 구축)"]
        B1["level[s]=0, queue=[s]\n나머지 level=-1"]
        B1 --> B2["u = dequeue()"]
        B2 --> B3["edge ∈ graph[u]:\ncap>0 and level[to]==-1\n→ level[to]=level[u]+1, enqueue"]
        B3 --> B4{queue\n비어 있는가?}
        B4 -- No --> B2
        B4 -- Yes --> B5{level[t] != -1?}
        B5 -- Yes --> B6([BFS 성공])
        B5 -- No --> B7([BFS 실패])
    end

    subgraph DFS_sub["DFS (차단 유량)"]
        D1{u == t?}
        D1 -- Yes --> D2(["return pushed"])
        D1 -- No --> D3{"iter[u]번째 간선:\ncap>0 and level[v]==level[u]+1?"}
        D3 -- Yes --> D4["d = DFS(v, t, min(pushed,cap))"]
        D4 --> D5{d > 0?}
        D5 -- Yes --> D6["cap -= d\nrev.cap += d\nreturn d"]
        D5 -- No --> D7["iter[u]++"]
        D7 --> D3
        D3 -- No(간선 소진) --> D8(["return 0"])
    end
```

**핵심 불변식:** BFS 이후 `level[t]`는 현재 잔여 그래프에서 $s \to t$ 최단 거리를 나타내며, DFS는 `level[v] == level[u]+1`인 간선만 따라간다. `iter[u]`의 단조 증가로 인해 각 차단 유량 라운드의 총 DFS 비용은 $O(V \cdot E)$이 아닌 $O(E)$로 제한된다.
