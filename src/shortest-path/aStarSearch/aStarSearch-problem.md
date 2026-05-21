# A* 탐색 (A* Search)

## 함수 인터페이스

```ts
export function aStarSearch(
  n: number,
  edges: [number, number, number][],
  src: number,
  goal: number,
  h: (v: number) => number,
): number;
```

## 제약 조건

- $1 \leq V \leq 10^5$
- $0 \leq E \leq 2 \cdot 10^5$
- $0 \leq w(u, v) \leq 10^9$
- $0 \leq h(v) \leq d(v, t)$ (admissible)
- $0 \leq s, t < V$

## 문제 상세

가중치가 음수가 아닌 방향 그래프 $G = (V, E)$ 가 주어진다. 시작 정점 $s$ 로부터 목표 정점 $t$ 까지의 최단 경로 비용을 **A\* 탐색** 으로 구하라.

A\* 탐색은 각 정점 $v$ 에 대해 추정 함수

$$f(v) = g(v) + h(v)$$

를 사용한다. 여기서 $g(v)$ 는 현재까지 발견한 $s \to v$ 의 실제 거리, $h(v)$ 는 $v \to t$ 의 휴리스틱 추정 비용이다.

휴리스틱 $h$ 는 admissible 하다고 가정한다 (즉, 실제 최단 거리를 절대 초과하지 않는다). $h \equiv 0$ 이면 일반 Dijkstra 와 동일하다.

### 입출력

- 정점 번호는 $0$ 부터 $n - 1$.
- `edges` 의 각 원소는 $[u, v, w]$ 형태이며 가중치 $w$ 인 방향 간선 $u \to v$ 를 나타낸다.
- 반환값은 $s \to t$ 의 최단 경로 비용. $t$ 에 도달할 수 없으면 `Infinity` 를 반환한다.

## 예시

```ts
// 정점 5개, 0 -> 4 로 가는 최단 경로
const edges: [number, number, number][] = [
  [0, 1, 1],
  [0, 2, 4],
  [1, 2, 2],
  [1, 3, 5],
  [2, 3, 1],
  [3, 4, 3],
];
aStarSearch(5, edges, 0, 4, () => 0); // 7  (0 -> 1 -> 2 -> 3 -> 4)

// 도달 불가능
aStarSearch(3, [[0, 1, 2]], 0, 2, () => 0); // Infinity
```
