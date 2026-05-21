# Lowest Common Ancestor (LCA)

## 함수 인터페이스

```ts
export function lowestCommonAncestor(
  n: number,
  edges: [number, number][],
  root: number,
  queries: [number, number][]
): number[];
```

## 제약 조건

- $1 \leq n \leq 10^5$ (정점의 수)
- `edges` 의 길이는 $n - 1$
- 각 간선 $[u, v]$ 는 $0 \leq u, v < n$, $u \neq v$
- `edges` 가 주어진 그래프는 $n$ 개의 정점을 가지는 **연결된 트리** 를 형성한다
- $0 \leq \text{root} < n$
- 각 질의 $[u, v]$ 는 $0 \leq u, v < n$

## 문제 상세

$n$ 개의 정점과 $n - 1$ 개의 간선으로 이루어진 루트 트리가 주어진다. 루트 정점은 `root` 이다.

두 정점 $u, v$ 의 **최소 공통 조상 (Lowest Common Ancestor, LCA)** 이란 $u$ 와 $v$ 를 모두 자손으로 갖는 정점 중 가장 깊은 (루트로부터 가장 먼) 정점을 말한다. 정점 $x$ 자신도 $x$ 의 조상으로 간주한다.

정점 $x$ 의 조상 집합을 $\text{anc}(x)$ 라 하면

$$\text{lca}(u, v) = \arg\max_{x \in \text{anc}(u) \cap \text{anc}(v)} \text{depth}(x)$$

각 질의 $[u, v]$ 에 대해 $\text{lca}(u, v)$ 를 계산해 결과 배열로 반환한다.

## 예시

다음과 같은 트리를 생각하자 (`root = 0`).

```
        0
       / \
      1   2
     / \   \
    3   4   5
```

- `edges = [[0,1], [0,2], [1,3], [1,4], [2,5]]`
- `queries = [[3, 4], [3, 5], [4, 2], [5, 5]]`

| query | LCA |
| --- | --- |
| $(3, 4)$ | 1 |
| $(3, 5)$ | 0 |
| $(4, 2)$ | 0 |
| $(5, 5)$ | 5 |

반환값은 `[1, 0, 0, 5]`.
