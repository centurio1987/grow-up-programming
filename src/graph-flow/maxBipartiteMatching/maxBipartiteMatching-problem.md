# 최대 이분 매칭 (Maximum Bipartite Matching)

## 함수 인터페이스

```ts
export function maxBipartiteMatching(
  left: number,
  right: number,
  edges: [number, number][],
): number;
```

## 제약 조건

- $1 \leq L, R \leq 10^3$
- $0 \leq E \leq L \cdot R$
- 간선의 첫 번째 원소 $u$ 는 왼쪽 정점 ($0 \leq u < L$), 두 번째 원소 $v$ 는 오른쪽 정점 ($0 \leq v < R$).

## 문제 상세

이분 그래프 $G = (L \cup R, E)$ 가 주어졌을 때, 어떤 두 간선도 공통 정점을 공유하지 않는 간선 부분집합 $M \subseteq E$ 중 크기가 최대인 매칭의 크기 $|M|$ 을 구한다.

매칭의 정의:

$$M \subseteq E \text{ s.t. } \forall e_1, e_2 \in M,\; e_1 \neq e_2 \Rightarrow e_1 \cap e_2 = \emptyset$$

$$\text{maxBipartiteMatching}(G) = \max_{M \text{ matching}} |M|$$

- `left`: 왼쪽 정점의 개수 $L$
- `right`: 오른쪽 정점의 개수 $R$
- `edges`: 간선 목록 $[u, v]$

최대 매칭의 크기 $|M|$ 을 반환한다.

## 예시

```ts
maxBipartiteMatching(3, 3, [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 2],
]); // 3   (0-1, 1-0, 2-2)

maxBipartiteMatching(2, 2, [
  [0, 0],
  [1, 0],
]); // 1   (오른쪽 0 은 한 번만 매칭 가능)

maxBipartiteMatching(3, 3, []); // 0
```
