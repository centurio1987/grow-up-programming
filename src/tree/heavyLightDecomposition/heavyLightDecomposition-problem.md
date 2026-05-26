# Heavy-Light Decomposition (HLD) — 경로 합 질의

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class HeavyLightDecomposition {
  constructor(
    n: number,
    edges: [number, number][],
    root: number,
    values: number[]
  );
  update(node: number, value: number): void;
  queryPath(u: number, v: number): number;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$ (정점의 수)
- `edges` 의 길이는 $n - 1$
- 각 간선 $[u, v]$ 는 $0 \leq u, v < n$, $u \neq v$
- `edges` 가 주어진 그래프는 $n$ 개의 정점을 가지는 **연결된 트리** 를 형성한다
- $0 \leq \text{root} < n$
- `values` 의 길이는 $n$, 각 원소는 정수 (음수 가능)
- `update`, `queryPath` 의 인자 정점 인덱스는 $0 \leq \text{node}, u, v < n$

## 문제 상세

$n$ 개의 정점과 $n - 1$ 개의 간선으로 이루어진 루트 트리가 주어진다. 루트 정점은 `root` 이며, 각 정점에 값 $v_i$ 가 부여된다. 다음 두 연산을 지원하는 자료구조를 구현하라.

1. **update(node, value)** — 정점 $u$ 의 값을 $\text{value}$ 로 갱신한다.
2. **queryPath(u, v)** — 두 정점 $u, v$ 사이 경로 상 모든 정점 값의 합을 반환한다.

경로 $u \leadsto v$ 상의 정점 집합을 $P(u, v)$ 라 하면

$$\text{queryPath}(u, v) = \sum_{x \in P(u, v)} v_x$$

### 메서드 명세

- `new HeavyLightDecomposition(n, edges, root, values)` — 크기 $n$ 의 트리를 주어진 간선 목록과 루트, 초기 값으로 생성한다.
- `update(node, value)` — 정점 `node` 의 값을 `value` 로 갱신한다. 반환값은 없다.
- `queryPath(u, v)` — 두 정점 사이 경로의 정점 값 합을 반환한다.

## 예시

다음과 같은 트리를 생각하자 (`root = 0`).

```
        0
       / \
      1   2
     / \   \
    3   4   5
```

```ts
const hld = new HeavyLightDecomposition(
  6,
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
  0,
  [1, 2, 3, 4, 5, 6]
);

hld.queryPath(3, 4);    // 3 -> 1 -> 4 = 4 + 2 + 5 = 11
hld.queryPath(3, 5);    // 3 -> 1 -> 0 -> 2 -> 5 = 4 + 2 + 1 + 3 + 6 = 16
hld.queryPath(5, 5);    // 6

hld.update(1, 10);      // 정점 1의 값을 10으로 갱신
hld.queryPath(3, 4);    // 4 + 10 + 5 = 19
```
