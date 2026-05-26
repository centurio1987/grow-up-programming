# 이분 그래프 판정 (Bipartite Check)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 중급 |

## 함수 인터페이스

```ts
export function isBipartite(
  n: number,
  edges: [number, number][],
): boolean;
```

## 제약 조건

- $1 \leq V \leq 10^5$
- $0 \leq E \leq 2 \cdot 10^5$
- 그래프가 연결되어 있지 않을 수 있다 (모든 컴포넌트에 대해 판정).
- 정점 번호는 $0 \ldots n-1$.

## 문제 상세

무방향 그래프 $G = (V, E)$ 가 이분 그래프인지 판정한다. 이분 그래프란, 정점 집합을 서로소인 두 부분 $A, B$ 로 분할하여 모든 간선이 $A$ 와 $B$ 사이를 잇도록 만들 수 있는 그래프이다:

$$\exists\, (A, B): V = A \cup B,\; A \cap B = \emptyset,
  \;\forall (u, v) \in E,\; (u \in A \land v \in B) \lor (u \in B \land v \in A)$$

동치 조건: $G$ 가 홀수 길이의 사이클을 포함하지 않는다.

- `n`: 정점의 개수 $V$ (정점은 $0 \ldots n-1$)
- `edges`: 간선 목록 $[u, v]$ (무방향)

이분 그래프이면 `true`, 아니면 `false` 를 반환한다.

## 예시

```ts
isBipartite(4, [[0, 1], [1, 2], [2, 3], [3, 0]]); // true  (사이클 길이 4, 짝수)
isBipartite(3, [[0, 1], [1, 2], [2, 0]]);         // false (사이클 길이 3, 홀수)
isBipartite(5, [[0, 1], [2, 3]]);                 // true  (연결되지 않은 그래프)
isBipartite(1, []);                               // true  (간선 없음)
```
