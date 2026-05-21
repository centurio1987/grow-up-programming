# Connected Components (연결 성분)

## 함수 인터페이스

```ts
export function connectedComponents(
  n: number,
  edges: [number, number][],
): number[][];
```

## 제약 조건

- $1 \leq V \leq 10^{5}$ (여기서 $V = n$, 정점 번호는 $0 \ldots n-1$)
- $0 \leq E \leq 10^{5}$ (여기서 $E$ 는 `edges` 의 길이)
- `edges` 는 무향 간선 목록

## 문제 상세

무향 그래프 $G = (V, E)$ 에서 서로 연결된 정점들의 집합인 **연결 성분(connected component)** 을 모두 찾는다.

두 정점 $u, v$ 가 같은 연결 성분에 속한다는 것은, $u$ 와 $v$ 를 연결하는 경로가 존재한다는 것과 동치이다. 연결 성분은 다음 동치 관계에 의한 동치류(equivalence class)이다:

$$u \sim v \iff \exists \text{ path from } u \text{ to } v \text{ in } G$$

반환 형식:

- 각 성분 내부의 정점들은 오름차순 정렬한다.
- 성분 자체는 각 성분의 첫 원소(즉, 최소 정점 번호) 기준으로 오름차순 정렬한다.

## 예시

다음과 같은 그래프를 생각하자.

```
    0 --- 1     3 --- 4     6
          |     |
          2     5
```

- `n = 7`
- `edges = [[0,1], [1,2], [3,4], [3,5]]`

연결 성분은 $\{0, 1, 2\}$, $\{3, 4, 5\}$, $\{6\}$ 의 세 개이다.

반환값은 `[[0, 1, 2], [3, 4, 5], [6]]`.
