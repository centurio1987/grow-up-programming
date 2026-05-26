# 부분 트리 합 질의 (Subtree Sum Query)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class SubtreeSumQuery {
  constructor(
    n: number,
    edges: [number, number][],
    root: number,
    values: number[]
  );
  update(node: number, value: number): void;
  querySubtree(node: number): number;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$ (정점의 수)
- `edges` 의 길이는 $n - 1$
- 각 간선 $[u, v]$ 는 $0 \leq u, v < n$, $u \neq v$
- `edges` 가 주어진 그래프는 $n$ 개의 정점을 가지는 **연결된 트리** 를 형성한다
- $0 \leq \text{root} < n$
- `values` 의 길이는 $n$, 각 원소는 정수 (음수 가능)
- `update`, `querySubtree` 의 정점 인덱스는 $0 \leq \text{node} < n$

## 문제 상세

$n$ 개의 정점과 $n - 1$ 개의 간선으로 이루어진 루트 트리가 주어진다. 루트 정점은 `root` 이며, 각 정점에는 초기 값 $v_i$ 가 부여된다. 다음 두 연산을 지원하는 자료구조를 구현하라.

1. **update(node, value)** — 정점 $u$ 의 값을 $\text{value}$ 로 갱신한다.
2. **querySubtree(node)** — 정점 $u$ 를 루트로 하는 부분 트리의 모든 정점 값의 합을 반환한다.

정점 $u$ 의 부분 트리 정점 집합을 $T(u)$ 라 하면

$$\text{querySubtree}(u) = \sum_{x \in T(u)} v_x$$

### 메서드 명세

- `new SubtreeSumQuery(n, edges, root, values)` — 트리와 초기 값으로 자료구조를 생성한다.
- `update(node, value)` — 정점 `node` 의 값을 `value` 로 갱신한다. 반환값은 없다.
- `querySubtree(node)` — 정점 `node` 를 루트로 하는 부분 트리의 값 합을 반환한다.

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
const sst = new SubtreeSumQuery(
  6,
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
  0,
  [1, 2, 3, 4, 5, 6]
);

sst.querySubtree(0);    // 1 + 2 + 3 + 4 + 5 + 6 = 21
sst.querySubtree(1);    // 2 + 4 + 5 = 11
sst.querySubtree(2);    // 3 + 6 = 9
sst.querySubtree(3);    // 4

sst.update(4, 10);      // 정점 4의 값을 10으로 갱신
sst.querySubtree(1);    // 2 + 4 + 10 = 16
sst.querySubtree(0);    // 1 + 2 + 3 + 4 + 10 + 6 = 26
```
