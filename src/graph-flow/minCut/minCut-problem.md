# 최소 컷 (Minimum s-t Cut)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function minCut(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { cut: number };
```

## 제약 조건

- $2 \leq V \leq 500$
- $0 \leq E \leq 10^4$
- $0 \leq c(u, v) \leq 10^6$
- $0 \leq s, t < V,\; s \neq t$
- 정점 번호는 $0 \ldots n-1$.

## 문제 상세

유량 네트워크 $G = (V, E, c)$ 와 소스 $s$, 싱크 $t$ 가 주어졌을 때, $s$ 와 $t$ 를 분리하는 정점 분할 $(S, T)$ 의 컷 용량을 최소화한다.

컷의 정의:

$$S \cup T = V,\; S \cap T = \emptyset,\; s \in S,\; t \in T$$

컷 용량:

$$c(S, T) = \sum_{(u, v) \in E,\; u \in S,\; v \in T} c(u, v)$$

$$\text{minCut}(G, s, t) = \min_{(S, T) \text{ s-t cut}} c(S, T)$$

최대 유량 최소 컷 정리 (Max-Flow Min-Cut Theorem):

$$\max_{f \text{ feasible}} |f| = \min_{(S, T) \text{ s-t cut}} c(S, T)$$

- `n`: 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
- `edges`: 방향 간선 목록 $[u, v, c]$
- `source`: 소스 $s$
- `sink`: 싱크 $t$

`{ cut }` 형태로 최소 컷 용량을 반환한다.

## 예시

```ts
minCut(
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
); // { cut: 5 }

minCut(
  2,
  [[0, 1, 10]],
  0,
  1,
); // { cut: 10 }

minCut(
  3,
  [
    [0, 1, 5],
  ],
  0,
  2,
); // { cut: 0 }  (소스에서 싱크로 가는 경로 없음)
```
