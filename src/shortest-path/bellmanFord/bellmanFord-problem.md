# Bellman-Ford 최단 경로

## 한 줄 요약

> 함수는 음수 간선을 포함할 수 있는 그래프와 시작 정점을 받아 각 정점까지의 최단 거리 배열과 음수 사이클 존재 여부를 반환한다.

## 스토리

금융 분석가 민호는 여러 나라의 환율 데이터로 환전 경로를 계산하는 시스템을 만들고 있다. 일부 환전 경로는 수수료가 붙어 비용이 추가되지만, 특정 프로모션 경로는 오히려 마이너스 비용, 즉 이득이 발생한다.

문제는 어떤 환전 경로를 순환하면 돌 때마다 계속 이득이 생기는 "무한 차익거래" 경로가 생길 수 있다는 점이다. 이런 경우 최단 비용이 무한히 작아지므로 최단 경로 자체가 의미 없어진다.

민호는 두 가지를 동시에 알아야 한다. 첫째, 그런 무한 차익거래 경로가 존재하는지 여부. 둘째, 그런 경로가 없다면 시작점에서 각 환전처까지의 실제 최솟값. 두 정보를 함께 반환하는 함수가 필요하다.

## 함수 인터페이스

```ts
export function bellmanFord(
  n: number,
  edges: [number, number, number][],
  src: number,
): { dist: number[]; hasNegativeCycle: boolean };
```

- `n` — 정점 수. 정점 번호는 $0$부터 $n - 1$.
- `edges` — 방향 간선 목록. 각 원소는 $[u, v, w]$ 형태이며 가중치 $w$ (음수 허용)인 방향 간선 $u \to v$.
- `src` — 시작 정점 번호.
- 반환 — `{ dist, hasNegativeCycle }` 객체.
  - `dist[v]` — $\text{src} \to v$의 최단 거리. 도달할 수 없으면 `Infinity`.
  - `hasNegativeCycle` — $\text{src}$에서 도달 가능한 음수 사이클이 존재하면 `true`, 그렇지 않으면 `false`. `src`에서 도달할 수 없는 음수 사이클은 `false`로 판정한다.

## 제약 조건

- $1 \leq V \leq 500$ (정점 수)
- $0 \leq E \leq V \cdot (V - 1)$ (간선 수)
- $-10^9 \leq w(u, v) \leq 10^9$ (가중치; 음수 허용)
- $0 \leq \text{src} < V$
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

음수 가중치를 포함할 수 있는 방향 그래프 $G = (V, E)$가 주어진다. 시작 정점 $\text{src}$에서 모든 정점 $v$까지의 최단 거리 $d(\text{src}, v)$를 구하라.

최단 거리는 경로 위 간선 가중치의 합이 최소인 경로 비용으로 정의된다. 음수 사이클이 없을 때만 최단 거리가 유한하게 정의된다.

- $\text{src}$에서 도달 가능한 음수 사이클이 있으면 `hasNegativeCycle`을 `true`로 반환한다.
- `src` 자신까지의 거리는 $0$이다.
- 도달할 수 없는 정점의 거리는 `Infinity`다.
- 음수 셀프 루프(자기 자신을 향하는 음수 간선)도 음수 사이클로 처리한다.

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
// — 0→2 최단: 0→1→2 = 1 (직접 간선 5보다 짧음)

// src에서 도달 가능한 음수 사이클
const e2: [number, number, number][] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];
bellmanFord(3, e2, 0).hasNegativeCycle; // true — 0→1→2→0 합계 = -1

// src에서 도달할 수 없는 음수 사이클은 false
const e3: [number, number, number][] = [
  [1, 2, 1],
  [2, 1, -5],
];
bellmanFord(3, e3, 0).hasNegativeCycle; // false — 1↔2 사이클은 0에서 도달 불가

// 간선이 없는 그래프
bellmanFord(3, [], 1);
// { dist: [Infinity, 0, Infinity], hasNegativeCycle: false }
```
