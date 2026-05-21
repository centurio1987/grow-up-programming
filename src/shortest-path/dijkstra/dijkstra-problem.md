# Dijkstra 최단 경로

## 함수 인터페이스

```ts
export function dijkstra(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[];
```

## 제약 조건

- $1 \leq V \leq 10^5$
- $0 \leq E \leq 2 \cdot 10^5$
- $0 \leq w(u, v) \leq 10^9$
- $0 \leq s < V$

## 문제 상세

가중치가 음수가 아닌 방향 그래프 $G = (V, E)$ 가 주어진다. 시작 정점 $s$ 로부터 모든 정점 $v$ 까지의 최단 거리 $d(s, v)$ 를 **Dijkstra 알고리즘** 으로 구하라.

거리 함수의 정의는 다음과 같다:

$$d(s, v) = \min_{P \in \mathcal{P}(s, v)} \sum_{(u, w) \in P} w(u, w)$$

여기서 $\mathcal{P}(s, v)$ 는 $s \to v$ 경로의 집합이며, $v$ 에 도달할 수 없는 경우 $d(s, v) = \infty$ 이다.

### 입출력

- 정점 번호는 $0$ 부터 $n - 1$.
- `edges` 의 각 원소는 $[u, v, w]$ 형태이며 가중치 $w \geq 0$ 의 방향 간선 $u \to v$ 를 나타낸다.
- 반환값은 길이 $V$ 의 배열. 인덱스 $v$ 에는 $s \to v$ 의 최단 거리가 들어가며, 도달할 수 없는 정점은 `Infinity`.

## 예시

```ts
const edges: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 1],
  [2, 1, 2],
  [1, 3, 1],
  [2, 3, 5],
];
dijkstra(4, edges, 0);
// [0, 3, 1, 4]   (0 -> 2 -> 1 -> 3 의 비용 4)

// 도달 불가능한 정점은 Infinity
dijkstra(3, [[0, 1, 2]], 0);
// [0, 2, Infinity]
```
