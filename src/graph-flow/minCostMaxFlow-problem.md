# 최소 비용 최대 유량 (Min-Cost Max-Flow, MCMF)

## 함수 인터페이스

```ts
export function minCostMaxFlow(
  n: number,
  edges: [number, number, number, number][],
  source: number,
  sink: number,
): { flow: number; cost: number };
```

## 제약 조건

- $2 \leq V \leq 200$
- $0 \leq E \leq 2 \cdot 10^3$
- $0 \leq c(u, v) \leq 10^4$
- $0 \leq a(u, v) \leq 10^4$
- $0 \leq s, t < V,\; s \neq t$
- 정점 번호는 $0 \ldots n-1$.

## 문제 상세

비용을 가진 유량 네트워크 $G = (V, E, c, a)$ 와 소스 $s$, 싱크 $t$ 가 주어진다. 여기서 $c(u, v)$ 는 용량, $a(u, v)$ 는 단위 유량당 비용이다.

최대 유량 $|f^*|$ 을 흘리는 유량 함수 $f$ 들 중에서 총 비용이 최소인 $f$ 를 찾는다.

유량의 총 비용:

$$\text{cost}(f) = \sum_{(u, v) \in E} a(u, v) \cdot f(u, v)$$

목적:

$$\text{minCostMaxFlow}(G, s, t) =
  \min_{\substack{f \text{ feasible}\\ |f| = |f^*|}} \text{cost}(f)$$

- `n`: 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
- `edges`: 방향 간선 목록 $[u, v, c, a]$
- `source`: 소스 $s$
- `sink`: 싱크 $t$

`{ flow, cost }` 형태로 최대 유량 값과 그때의 최소 비용을 반환한다.

## 예시

```ts
minCostMaxFlow(
  4,
  [
    [0, 1, 2, 1],
    [0, 2, 1, 2],
    [1, 2, 1, 1],
    [1, 3, 1, 3],
    [2, 3, 2, 1],
  ],
  0,
  3,
); // { flow: 3, cost: ... }

minCostMaxFlow(
  2,
  [[0, 1, 5, 2]],
  0,
  1,
); // { flow: 5, cost: 10 }

minCostMaxFlow(
  3,
  [
    [0, 1, 4, 0],
  ],
  0,
  2,
); // { flow: 0, cost: 0 }
```
