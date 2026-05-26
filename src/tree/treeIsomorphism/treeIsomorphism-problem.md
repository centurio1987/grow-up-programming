# 트리 동형 판정 (Tree Isomorphism)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export function treeIsomorphism(
  n: number,
  edges1: [number, number][],
  edges2: [number, number][]
): boolean;
```

## 제약 조건

- $1 \leq n \leq 10^5$ (각 트리의 정점 수)
- `edges1`, `edges2` 의 길이는 각각 $n - 1$
- 각 간선 $[u, v]$ 는 $0 \leq u, v < n$, $u \neq v$
- `edges1`, `edges2` 는 각각 $n$ 개의 정점을 가지는 **연결된 무방향 트리** 를 형성한다

## 문제 상세

같은 정점 수 $n$ 을 가진 두 무방향 트리 $T_1 = (V_1, E_1)$, $T_2 = (V_2, E_2)$ 가 주어진다. 두 트리가 **동형(isomorphic)** 인지를 판정하라.

즉, 정점 사이의 일대일 대응 (전단사) $\phi : V_1 \to V_2$ 가 존재하여 임의의 두 정점 $u, v \in V_1$ 에 대해

$$\{u, v\} \in E_1 \iff \{\phi(u), \phi(v)\} \in E_2$$

를 만족하는지를 결정한다. 그러한 $\phi$ 가 존재하면 `true` 를, 그렇지 않으면 `false` 를 반환한다.

$$\exists\, \phi : V_1 \to V_2 \text{ bijection s.t. } \{u, v\} \in E_1 \Leftrightarrow \{\phi(u), \phi(v)\} \in E_2$$

## 예시

다음 두 트리를 생각하자.

```
  T1:        0            T2:        2
            / \                      / \
           1   2                    0   1
           |                            |
           3                            3
```

- `n = 4`
- `edges1 = [[0, 1], [0, 2], [1, 3]]`
- `edges2 = [[2, 0], [2, 1], [1, 3]]`

정점 매핑 $\phi = \{0 \to 2,\ 1 \to 1,\ 2 \to 0,\ 3 \to 3\}$ 가 인접 관계를 보존하므로 두 트리는 동형이며, 함수는 `true` 를 반환한다.

```ts
// 같은 구조
treeIsomorphism(4, [[0, 1], [0, 2], [1, 3]], [[2, 0], [2, 1], [1, 3]]);  // true

// 경로 그래프 (선형) vs 별 그래프 (스타) — 동형 아님
treeIsomorphism(4, [[0, 1], [1, 2], [2, 3]], [[0, 1], [0, 2], [0, 3]]);  // false

// 단일 정점
treeIsomorphism(1, [], []);                                              // true
```
