# 최대 유량 (Maximum Flow)

## 함수 인터페이스

```ts
export function maxFlow(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { flow: number };
```

## 제약 조건

- $2 \leq V \leq 500$
- $0 \leq E \leq 10^4$
- $0 \leq c(u, v) \leq 10^6$
- $0 \leq s, t < V,\; s \neq t$
- 정점 번호는 $0 \ldots n-1$.

## 문제 상세

유량 네트워크 $G = (V, E, c)$ 와 소스 $s$, 싱크 $t$ 가 주어졌을 때, 다음 조건을 만족하는 유량 함수 $f: E \to \mathbb{R}_{\geq 0}$ 의 총 유량을 최대화한다.

- 용량 제약: $\;0 \leq f(u, v) \leq c(u, v)$
- 유량 보존: $\;\forall v \in V \setminus \{s, t\},\;
  \sum_{u} f(u, v) = \sum_{w} f(v, w)$

총 유량의 정의:

$$|f| = \sum_{v: (s, v) \in E} f(s, v) - \sum_{u: (u, s) \in E} f(u, s)$$

$$\text{maxFlow}(G, s, t) = \max_{f \text{ feasible}} |f|$$

- `n`: 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
- `edges`: 방향 간선 목록 $[u, v, c]$
- `source`: 소스 $s$
- `sink`: 싱크 $t$

`{ flow }` 형태로 소스에서 싱크로의 최대 유량을 반환한다.

## 예시

```ts
maxFlow(
  4,
  [
    [0, 1, 3],
    [0, 2, 2],
    [1, 2, 1],
    [1, 3, 2],
    [2, 3, 3],
  ],
  0,
  3,
); // { flow: 5 }

maxFlow(
  2,
  [[0, 1, 10]],
  0,
  1,
); // { flow: 10 }

maxFlow(
  3,
  [
    [0, 1, 5],
  ],
  0,
  2,
); // { flow: 0 }  (소스에서 싱크로 가는 경로 없음)
```
