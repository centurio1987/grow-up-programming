# SPFA (Shortest Path Faster Algorithm)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function spfa(
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
- $s$ 에서 도달 가능한 음수 사이클이 없다.

## 문제 상세

음수 간선을 포함할 수 있는 방향 그래프 $G = (V, E)$ 가 주어진다. 시작 정점 $s$ 로부터 모든 정점 $v$ 까지의 최단 거리 $d(s, v)$ 를 **SPFA (Shortest Path Faster Algorithm)** 로 구하라.

SPFA 는 Bellman-Ford 의 큐 기반 최적화 알고리즘이다. $s$ 에서 도달 가능한 음수 사이클은 존재하지 않는다고 가정한다 (검출이 필요하면 Bellman-Ford 를 사용한다).

### 입출력

- 정점 번호는 $0$ 부터 $n - 1$.
- `edges` 의 각 원소는 $[u, v, w]$ 형태이며 가중치 $w$ (음수 허용) 의 방향 간선 $u \to v$ 를 나타낸다.
- 반환값은 길이 $V$ 의 배열. 인덱스 $v$ 에는 $s \to v$ 의 최단 거리가 들어가며, 도달할 수 없는 정점은 `Infinity`.

## 예시

```ts
// 음수 간선이 있지만 음수 사이클은 없음
const edges: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 5],
  [1, 2, -3],
  [2, 3, 4],
];
spfa(4, edges, 0);
// [0, 4, 1, 5]

// 도달 불가능한 정점은 Infinity
spfa(3, [[0, 1, 2]], 0);
// [0, 2, Infinity]
```
