# 트리 지름 (Tree Diameter)

## 함수 인터페이스

```ts
export function treeDiameter(
  n: number,
  edges: [number, number, number][]
): number;
```

## 제약 조건

- $1 \leq n \leq 10^5$ (정점의 수)
- `edges` 의 길이는 $n - 1$
- 각 간선 $[u, v, w]$ 는 $0 \leq u, v < n$, $u \neq v$, $w \geq 0$
- `edges` 가 주어진 그래프는 $n$ 개의 정점을 가지는 **연결된 트리** 를 형성한다

## 문제 상세

$n$ 개의 정점과 $n - 1$ 개의 가중치 간선으로 이루어진 트리가 주어진다. 트리의 **지름(diameter)** 은 두 정점 사이를 잇는 경로의 가중치 합 중 최댓값이다.

정점 집합을 $V = \{0, 1, \ldots, n-1\}$, 두 정점 $u, v$ 사이의 경로 거리(경로 상 간선 가중치의 합)를 $\text{dist}(u, v)$ 라 정의하면

$$\text{treeDiameter}(T) = \max_{u, v \in V} \text{dist}(u, v)$$

위 값을 계산해 반환하라.

## 예시

다음과 같은 가중치 트리를 생각하자.

```
        0
       /1\3
      1   2
   2 /     \5
    3       4
```

- `n = 5`
- `edges = [[0, 1, 1], [0, 2, 3], [1, 3, 2], [2, 4, 5]]`

가능한 경로 가중치:
- $\text{dist}(3, 4) = 2 + 1 + 3 + 5 = 11$
- $\text{dist}(3, 0) = 2 + 1 = 3$
- $\text{dist}(4, 0) = 5 + 3 = 8$

따라서 `treeDiameter(5, edges)` 의 반환값은 `11`.

```ts
treeDiameter(1, []);                            // 0
treeDiameter(2, [[0, 1, 7]]);                   // 7
treeDiameter(5, [
  [0, 1, 1],
  [0, 2, 3],
  [1, 3, 2],
  [2, 4, 5],
]);                                             // 11
```
