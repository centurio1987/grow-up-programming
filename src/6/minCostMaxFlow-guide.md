# minCostMaxFlow 해설

## 성능 목표 예측

| 항목 | 값 |
|------|----|
| 정점 V | $2 \leq V \leq 200$ |
| 간선 E | $0 \leq E \leq 2 \times 10^3$ |
| 용량 c | $0 \leq c \leq 10^4$ |
| 단위 비용 a | $0 \leq a \leq 10^4$ |

**naive 접근의 문제점:**
최대 유량을 달성하는 모든 유량 함수 $f$를 열거하고 비용이 최소인 것을 찾으면,
경우의 수가 지수적으로 많아 $O(c^E)$ 수준으로 폭발한다.

단순 최대 유량(Dinic's)으로 유량을 먼저 최대화한 뒤 비용을 최소화하려 해도,
유량 경로 선택이 비용과 독립적이지 않으므로 별도 최적화 단계가 필요하다.

**목표 복잡도:** $O(|f^*| \cdot (V + E))$ (SPFA 기반 SSP), $O(V + E)$ 공간.

**근거:** SPFA(Bellman-Ford 변형)로 최단 비용 경로를 찾는 비용이 $O(V \cdot E) = O(200 \times 2000) = 4 \times 10^5$ per 반복이고,
실제 증가 반복 횟수가 수십~수백 회 수준이면 충분히 통과 가능하다.
역방향 간선의 비용이 음수이므로 Dijkstra 직접 사용은 불가하다.

**공간 복잡도:** 잔여 그래프 인접 리스트 $O(V + E)$, 거리/방문 배열 $O(V)$. 1D 구조로 충분하다.

---

## 목표 함수

```ts
minCostMaxFlow(
  n: number,
  edges: [number, number, number, number][],
  source: number,
  sink: number
): { flow: number; cost: number }
```

| 매개변수 | 의미 | 제약 |
|----------|------|------|
| `n` | 정점 개수 $V$ (인덱스: $0 \ldots n-1$) | $2 \leq n \leq 200$ |
| `edges` | 방향 간선 `[u, v, c, a]` (용량 $c$, 단위 비용 $a$) | $E \leq 2 \times 10^3$ |
| `source` | 소스 $s$ | $s \neq t$ |
| `sink` | 싱크 $t$ | $s \neq t$ |
| 반환값 | `{ flow, cost }`: 최대 유량 값과 그 최소 비용 | — |

**엣지케이스:**

1. **$s \to t$ 경로 없음:** SPFA가 즉시 실패 → `{ flow: 0, cost: 0 }`.
2. **비용 0 간선:** 최단 비용 경로에서 우선 선택되므로 `cost = 0`이어도 정상.
3. **역방향 간선의 음수 비용:** 정방향 `cost = +a`, 역방향 `cost = -a`. Dijkstra 직접 적용 불가. SPFA는 음수 가중치 처리 가능하다.
4. **용량 0 간선:** 유량을 흘릴 수 없으므로 SPFA 탐색에서 제외된다.
5. **최대 입력:** $|f^*| \leq V \cdot c \leq 200 \times 10^4 = 2 \times 10^6$. 반복마다 병목 이상의 유량을 흘리므로 실제 반복 횟수는 훨씬 적다.

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

유량 최대화만 생각하면 Dinic's를 쓰면 되지만, 여기에 비용 최소화 조건이 추가된다.
가장 단순한 접근: 최대 유량을 먼저 달성하는 모든 방법을 열거하고 최소 비용을 찾는다.

```
naive:
  for each feasible flow f with |f| = |f*|:
    minCost = min(minCost, cost(f))
  return minCost
```

유량 함수의 수는 지수적으로 많으므로 열거 불가능하다. 또한 유량 경로를 임의 순서로 선택하면 나중에 비용을 최소화할 기회를 잃는다.

**낭비의 정체:** 비용을 고려하지 않고 유량을 흘리면, 나중에 비싼 경로로만 흘릴 수 있는 상황이 될 수 있다. 매 단계에서 가장 저렴한 경로를 선택해야 전체 비용이 최소화된다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1 (SSP 원리):** 매 단계에서 잔여 그래프의 최소 비용 $s \to t$ 경로를 따라 유량을 흘리면, 전체적으로 최소 비용 최대 유량이 달성된다. 이것이 SSP(Successive Shortest Paths) 알고리즘의 핵심이다.

- **관찰 2 (교환 논증):** 최단이 아닌 경로를 선택했다고 하면, 그 선택을 최단 경로로 교체했을 때 유량이 줄지 않으면서 비용이 감소한다. 따라서 매 단계 최단 경로 선택이 전역 최적을 보장한다.

- **관찰 3 (역방향 간선의 음수 비용):** 정방향 간선의 비용이 $+a$이면, 역방향 간선의 비용은 $-a$이어야 한다. 유량을 되돌리면 원래 지불한 비용 $a$를 환급받기 때문이다. 이 음수 비용이 SPFA를 필요로 하는 이유이다.

### 관찰을 형식화: 상태/구조 정의

**잔여 그래프 표현:**
각 원래 간선 $(u \to v, c, a)$에 대해:
- 정방향: `{to: v, cap: c, cost: +a, rev: idx}`
- 역방향: `{to: u, cap: 0, cost: -a, rev: idx}`

역방향 비용이 $-a$인 이유: 역방향으로 유량을 흘리는 것은 정방향 유량을 $a$씩 환급받는 것과 동치이다. 비용이 $+a$가 되면 "되돌리는 비용이 추가된다"는 의미가 되어 잘못된 모델이다.

**SPFA 거리/경로 배열:**
- `dist[v]`: $s$에서 $v$까지의 현재 최단 비용 거리. 초기값 $\infty$, `dist[s] = 0`.
- `prevV[v]`, `prevE[v]`: 경로 역추적을 위한 이전 정점과 이전 간선 인덱스.
- `inQueue[v]`: SPFA 큐에 들어 있는지 여부 (재삽입 방지).

`prevV/prevE` 두 배열이 모두 필요한 이유: `prevV`만으로는 어떤 간선을 통해 왔는지 알 수 없어 병렬 간선에서 잔여 용량 갱신이 불가능하다.

### 점화식 또는 핵심 연산

**SPFA 완화 조건:**

$$
\text{if } \text{cap}(u \to v) > 0 \;\land\; \text{dist}[u] + \text{cost}(u \to v) < \text{dist}[v]:
\quad \text{dist}[v] = \text{dist}[u] + \text{cost}(u \to v)
$$

- $\text{cap}(u \to v) > 0$: 잔여 용량이 있는 간선만 사용 가능.
- $\text{dist}[u] + \text{cost}$: 경로 비용 합산. 음수 비용 간선 포함 시 일반 Dijkstra의 단순 완화로는 처리 불가.

**경로 발견 후 유량 갱신:**

$$
\delta = \min_{e \in \text{path}} \text{cap}(e)
$$

$$
\forall e \in \text{path}: \quad \text{cap}(e) \mathrel{-}= \delta, \quad \text{cap}(\text{rev}(e)) \mathrel{+}= \delta
$$

$$
\text{totalFlow} \mathrel{+}= \delta, \quad \text{totalCost} \mathrel{+}= \delta \times \text{dist}[t]
$$

- $\delta$: 경로 위 최소 잔여 용량(병목). 이만큼의 유량을 한 번에 흘린다.
- $\delta \times \text{dist}[t]$: 이번 단계에서 추가되는 비용. `dist[t]`는 경로의 단위 유량당 비용이다.

### 정당성 — 왜 이것이 옳은가

**SSP의 최적성(LP 쌍대성 기반):** 선형 프로그래밍의 이중성에 의해, 유량 문제의 최소 비용 해는 최단 경로를 순서대로 처리하는 것과 동치이다. 직관적으로는 다음과 같다: 매 단계에서 최단 비용 경로를 선택하지 않았다면 더 짧은 경로가 존재하므로, 두 경로의 유량을 교환하면 비용이 감소하거나 같아진다. 이를 반복하면 SSP 해가 최적임이 확인된다.

**까다로운 케이스:**
- 역방향 간선의 음수 비용: SPFA는 큐에서 꺼낸 정점에서 완화가 가능하면 다시 삽입하므로 음수 비용도 올바르게 처리한다. 단, 음수 사이클이 있으면 무한 루프 발생 — 문제 제약상 음수 비용 원래 간선이 없으므로 음수 사이클도 없다.
- 병목 $\delta > 1$: 경로를 여러 단위로 동시에 흘려 반복 횟수를 줄인다. 비용은 $\delta \times \text{dist}[t]$로 선형 비례하므로 최적성은 유지된다.

### 구현 디테일과 최적화

- **SPFA vs Dijkstra:** 음수 비용 역방향 간선이 존재하므로 Dijkstra 직접 사용 불가. Johnson 포텐셜(potential)로 음수 가중치를 제거 후 Dijkstra를 사용하면 $O(E \log V)$ per 반복이 가능하지만 구현이 복잡하다. SPFA는 $O(V \cdot E)$ worst case이지만 대부분의 경우 훨씬 빠르다.

- **병목 $\delta$ 계산:** 경로를 역추적하면서 `min(delta, cap)`을 반복 적용한다. 역추적은 `prevV/prevE` 배열로 $t$에서 $s$로 거슬러 올라간다.

- **함정 — `inQueue` 배열 누락:** SPFA에서 같은 정점을 큐에 중복 삽입하면 비용이 $O(V^2 \cdot E)$로 증가한다. `inQueue`로 현재 큐에 있는 정점의 재삽입을 막아야 한다.

- **함정 — 역방향 간선 비용 부호 오류:** 역방향 비용을 $+a$로 설정하면 유량을 되돌릴 때 비용이 추가되어 최적성이 깨진다. 반드시 $-a$여야 한다.

- **함정 — `totalCost += delta * dist[t]`에서 `dist[t]`가 경로 총 비용임을 망각:** `dist[t]`는 이 경로로 1단위 유량을 흘릴 때의 비용이다. $\delta$ 단위를 흘리므로 곱셈이 필요하다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
NIL = -1

function minCostMaxFlow(n, edges, s, t):
    // 1. 잔여 그래프 구성 (정방향 + 역방향 쌍)
    graph[0..n-1] = []
    for (u, v, c, a) in edges:
        addEdge(u, v, c, a)            // 불변식: 정방향과 역방향이 rev 인덱스로 연결됨

    totalFlow = 0
    totalCost = 0

    // 2. SSP 반복
    while True:
        (found, dist, prevV, prevE) = SPFA(n, s, t, graph)
        if not found: break            // 더 이상 증가 경로 없음

        // 병목 계산
        delta = INF
        v = t
        while v != s:                  // 불변식: prevV로 경로 역추적 가능
            e = prevE[v]
            delta = min(delta, graph[prevV[v]][e].cap)
            v = prevV[v]

        // 유량 갱신
        v = t
        while v != s:
            e = prevE[v]
            graph[prevV[v]][e].cap -= delta              // 불변식: cap ≥ 0 유지
            graph[v][graph[prevV[v]][e].rev].cap += delta // 역방향 용량 증가
            v = prevV[v]

        totalFlow += delta                               // 불변식: totalFlow는 누적 최대 유량
        totalCost += delta * dist[t]                     // 불변식: totalCost는 누적 최소 비용

    return { flow: totalFlow, cost: totalCost }

function addEdge(u, v, c, a):
    graph[u].push({to: v, cap: c, cost: +a, rev: len(graph[v])})
    graph[v].push({to: u, cap: 0, cost: -a, rev: len(graph[u])-1})
    // 불변식: 역방향 비용 = -a (유량 환급 의미)

function SPFA(n, s, t, graph):
    dist[0..n-1] = INF;  dist[s] = 0  // 불변식: dist[v] = 현재 최단 비용 거리
    inQueue[0..n-1] = false
    prevV[0..n-1] = NIL;  prevE[0..n-1] = NIL
    queue = [s];  inQueue[s] = true

    while queue not empty:
        u = dequeue(queue)
        inQueue[u] = false

        for i, edge in enumerate(graph[u]):
            if edge.cap > 0 and dist[u] + edge.cost < dist[edge.to]:
                dist[edge.to] = dist[u] + edge.cost
                prevV[edge.to] = u                 // 불변식: 역추적 경로 갱신
                prevE[edge.to] = i
                if not inQueue[edge.to]:
                    enqueue(queue, edge.to)
                    inQueue[edge.to] = true

    return (dist[t] != INF, dist, prevV, prevE)

// 핵심 불변식:
//   SPFA 종료 후 dist[v] = s→v 최단 비용 (잔여 cap>0 간선만 사용).
//   역방향 간선 cost = -a → 음수 비용 가능 → SPFA 필수, Dijkstra 불가.
//   각 SSP 반복 후 totalCost는 현재까지 흘린 유량의 최소 비용을 정확히 반영.
```

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B["잔여 그래프 구성\n정방향 cost=+a\n역방향 cost=-a"]
    B --> C["totalFlow=0, totalCost=0"]
    C --> D["SPFA(s→t 최단 비용 경로)"]
    D --> E{dist[t] < INF?\n(경로 존재?)}
    E -- No --> Z(["return { flow, cost }"])
    E -- Yes --> F["경로 역추적\n병목 δ = min(잔여 용량)"]
    F --> G["경로 따라 유량 δ 흘리기\n정방향 cap -= δ\n역방향 cap += δ"]
    G --> H["totalFlow += δ\ntotalCost += δ × dist[t]"]
    H --> D

    subgraph SPFA_sub["SPFA (최단 비용 경로 탐색)"]
        S1["dist[s]=0, 나머지=INF\nqueue=[s], inQueue[s]=true"]
        S1 --> S2["u = dequeue()\ninQueue[u] = false"]
        S2 --> S3["edge ∈ graph[u] 순회\ncap>0 and dist[u]+cost < dist[to]?"]
        S3 -- Yes --> S4["dist[to] 갱신\nprevV/prevE 기록\n미큐 상태면 enqueue"]
        S4 --> S3
        S3 -- No(다음 간선 또는 완료) --> S5{queue\n비어 있는가?}
        S5 -- No --> S2
        S5 -- Yes --> S6{dist[t] < INF?}
        S6 -- Yes --> S7(["경로 존재"])
        S6 -- No --> S8(["경로 없음"])
    end
```

**핵심 불변식:** 각 SSP 반복 종료 후, 역방향 간선의 비용이 $-a$로 설정되어 있으므로 SPFA가 음수 비용을 올바르게 처리한다. `totalCost += delta * dist[t]`에서 `dist[t]`는 이번 경로로 1단위 유량을 흘릴 때의 비용이며, 이를 $\delta$ 단위에 곱해 누적한다. 매 반복에서 최단 비용 경로를 선택하므로 전체 비용이 최소임이 보장된다.
