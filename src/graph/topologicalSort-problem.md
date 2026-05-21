# Topological Sort (위상 정렬)

## 함수 인터페이스

```ts
export function topologicalSort(
  n: number,
  edges: [number, number][],
): number[] | null;
```

## 제약 조건

- $1 \leq V \leq 10^{5}$ (여기서 $V = n$, 정점 번호는 $0 \ldots n-1$)
- $0 \leq E \leq 10^{5}$ (여기서 $E$ 는 `edges` 의 길이)
- `edges` 의 각 원소 $[u, v]$ 는 $u \to v$ 인 유향 간선

## 문제 상세

유향 비순환 그래프(DAG)의 정점들을 모든 간선 $(u, v)$ 에 대해 $u$ 가 $v$ 보다 앞에 오도록 일렬로 나열한다.

위상 정렬 $\sigma: V \to \{0, 1, \ldots, n-1\}$ 은 다음 조건을 만족하는 순열이다:

$$\forall (u, v) \in E,\quad \sigma(u) < \sigma(v)$$

그래프에 사이클이 존재하면 위상 정렬은 존재하지 않으므로 `null` 을 반환한다.

다수의 유효한 위상 정렬이 존재할 수 있으므로, 테스트는 검증 함수(validity check)를 사용한다.

## 예시

다음과 같은 DAG 를 생각하자.

```
    0 -> 1 -> 3
    |    ^
    v    |
    2 ---+
```

- `n = 4`
- `edges = [[0,1], [0,2], [2,1], [1,3]]`

가능한 위상 정렬: `[0, 2, 1, 3]` 등.

사이클이 있는 경우:

- `n = 3`, `edges = [[0,1], [1,2], [2,0]]` → 반환값은 `null`.

빈 그래프:

- `n = 3`, `edges = []` → `[0, 1, 2]` 같이 임의의 순열이 유효하다.
