# Floyd-Warshall 모든 쌍 최단 경로

## 함수 인터페이스

```ts
export function floydWarshall(
  n: number,
  edges: [number, number, number][],
): number[][];
```

## 제약 조건

- $1 \leq V \leq 500$
- $0 \leq E \leq V \cdot (V - 1)$
- $-10^6 \leq w(u, v) \leq 10^6$
- 음수 사이클은 존재하지 않는다.

## 문제 상세

가중치 방향 그래프 $G = (V, E)$ 가 주어진다. 모든 정점 쌍 $(u, v)$ 에 대한 최단 거리 $d(u, v)$ 를 **Floyd-Warshall 알고리즘** 으로 구하라.

가중치는 음수도 허용되지만 음수 사이클은 없다고 가정한다. 동일한 정점 쌍에 다중 간선이 존재하면 더 작은 가중치를 사용한다.

### 입출력

- 정점 번호는 $0$ 부터 $n - 1$.
- `edges` 의 각 원소는 $[u, v, w]$ 형태이며 가중치 $w$ (음수 허용) 의 방향 간선 $u \to v$ 를 나타낸다.
- 반환값은 크기 $V \times V$ 의 2 차원 배열 $D$. $D[u][v]$ 는 $u \to v$ 의 최단 거리이며 도달할 수 없는 경로는 `Infinity`. 또한 $D[v][v] = 0$.

## 예시

```ts
const edges: [number, number, number][] = [
  [0, 1, 3],
  [1, 2, 2],
  [0, 2, 10],
  [2, 0, 4],
];
floydWarshall(3, edges);
// [
//   [0, 3, 5],
//   [6, 0, 2],
//   [4, 7, 0],
// ]

// 도달 불가능 쌍은 Infinity
floydWarshall(3, [[0, 1, 1]]);
// [
//   [0,        1,        Infinity],
//   [Infinity, 0,        Infinity],
//   [Infinity, Infinity, 0       ],
// ]
```
