# DAG 최단 경로 (DAG Shortest Path)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function dagShortestPath(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[];
```

## 제약 조건

- $1 \leq V \leq 10^5$
- $0 \leq E \leq 2 \cdot 10^5$
- $-10^9 \leq w(u, v) \leq 10^9$
- $0 \leq s < V$
- 입력 그래프는 DAG (사이클 없음)

## 문제 상세

사이클이 없는 방향 그래프 (DAG) $G = (V, E)$ 가 주어진다. 시작 정점 $s$ 로부터 모든 정점 $v$ 까지의 최단 거리 $d(s, v)$ 를 구하라.

가중치는 음수도 허용된다 (DAG 이므로 음수 사이클이 존재할 수 없다).

### 입출력

- 정점 번호는 $0$ 부터 $n - 1$.
- `edges` 의 각 원소는 $[u, v, w]$ 형태이며 가중치 $w$ (음수 허용) 의 방향 간선 $u \to v$ 를 나타낸다.
- 반환값은 길이 $V$ 의 배열. 인덱스 $v$ 에는 $s \to v$ 의 최단 거리가 들어가며, 도달할 수 없는 정점은 `Infinity`.

## 예시

```ts
// DAG: 0 -> 1 -> 3, 0 -> 2 -> 3, 음수 간선 포함
const edges: [number, number, number][] = [
  [0, 1, 2],
  [0, 2, 4],
  [1, 2, -3],
  [1, 3, 5],
  [2, 3, 1],
];
dagShortestPath(4, edges, 0);
// [0, 2, -1, 0]

// 도달 불가능한 정점은 Infinity
dagShortestPath(3, [[0, 1, 1]], 0);
// [0, 1, Infinity]
```
