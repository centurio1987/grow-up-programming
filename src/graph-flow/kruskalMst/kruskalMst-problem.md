# Kruskal 최소 신장 트리 (희소 그래프)

## 함수 인터페이스

```ts
export function kruskalMst(
  n: number,
  edges: [number, number, number][],
): number;
```

## 제약 조건

- $1 \leq V \leq 10^5$
- $0 \leq E \leq 2 \cdot 10^5$
- $0 \leq w(u, v) \leq 10^9$
- 정점 번호는 $0 \ldots n-1$.

## 문제 상세

가중치 무방향 연결 그래프 $G = (V, E, w)$ 가 주어졌을 때, 모든 정점을 포함하면서 간선 가중치 합이 최소인 트리 $T \subseteq E$ 를 구한다.

최소 신장 트리의 가중치 합 정의:

$$W(T) = \sum_{(u, v) \in T} w(u, v)$$

$$\text{kruskalMst}(G) = \min_{T \in \mathcal{T}(G)} W(T)$$

여기서 $\mathcal{T}(G)$ 는 $G$ 의 모든 신장 트리의 집합이다.

- `n`: 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
- `edges`: 간선 목록 $[u, v, w]$ (무방향)

최소 신장 트리의 가중치 합을 반환한다. 그래프가 연결되지 않아 신장 트리를 구성할 수 없으면 $-1$ 을 반환한다.

## 예시

```ts
kruskalMst(4, [
  [0, 1, 1],
  [1, 2, 2],
  [2, 3, 3],
  [0, 3, 10],
]); // 6   (1 + 2 + 3)

kruskalMst(3, [
  [0, 1, 5],
]); // -1  (정점 2가 분리됨)

kruskalMst(1, []); // 0   (정점이 1개인 경우)
```
