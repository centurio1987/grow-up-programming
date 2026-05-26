# Bellman-Ford 최단 경로 (음수 사이클 검출 포함)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function bellmanFord(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; hasNegativeCycle: boolean };
```

## 제약 조건

- $1 \leq V \leq 500$
- $0 \leq E \leq V \cdot (V - 1)$
- $-10^9 \leq w(u, v) \leq 10^9$
- $0 \leq s < V$

## 문제 상세

가중치가 음수일 수 있는 방향 그래프 $G = (V, E)$ 가 주어진다. 시작 정점 $s$ 로부터 모든 정점 $v$ 까지의 최단 거리 $d(s, v)$ 를 **Bellman-Ford 알고리즘** 으로 구하라.

또한 $s$ 에서 도달 가능한 **음수 사이클** 의 존재 여부를 함께 판정해 반환한다.

### 입출력

- 정점 번호는 $0$ 부터 $n - 1$.
- `edges` 의 각 원소는 $[u, v, w]$ 형태이며 가중치 $w$ (음수 허용) 의 방향 간선 $u \to v$ 를 나타낸다.
- 반환값은 `{ dist, hasNegativeCycle }` 객체.
  - `dist[v]` 는 $s \to v$ 의 최단 거리. 도달할 수 없으면 `Infinity`.
  - $s$ 에서 도달 가능한 음수 사이클이 존재하면 `hasNegativeCycle = true`, 그렇지 않으면 `false`.

## 예시

```ts
// 음수 간선이 있지만 음수 사이클은 없음
const e1: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 5],
  [1, 2, -3],
  [2, 3, 4],
];
bellmanFord(4, e1, 0);
// { dist: [0, 4, 1, 5], hasNegativeCycle: false }

// 음수 사이클: 0 -> 1 -> 2 -> 0 의 합이 음수
const e2: [number, number, number][] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];
bellmanFord(3, e2, 0).hasNegativeCycle; // true
```
