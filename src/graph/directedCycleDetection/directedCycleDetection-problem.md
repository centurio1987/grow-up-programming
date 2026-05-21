# Directed Cycle Detection (유향 그래프 사이클 탐지)

## 함수 인터페이스

```ts
export function directedCycleDetection(
  n: number,
  edges: [number, number][],
): boolean;
```

## 제약 조건

- $1 \leq V \leq 10^{5}$ (여기서 $V = n$, 정점 번호는 $0 \ldots n-1$)
- $0 \leq E \leq 10^{5}$ (여기서 $E$ 는 `edges` 의 길이)
- `edges` 의 각 원소 $[u, v]$ 는 $u \to v$ 인 유향 간선

## 문제 상세

유향 그래프 $G = (V, E)$ 에 **사이클이 존재하는지 여부** 를 판별한다.

사이클이 존재하면 `true`, 존재하지 않으면 `false` 를 반환한다.

## 예시

| `n` | `edges` | 반환값 | 설명 |
| --- | --- | --- | --- |
| 3 | `[[0,1], [1,2], [2,0]]` | `true` | $0 \to 1 \to 2 \to 0$ |
| 3 | `[[0,1], [1,2]]` | `false` | DAG |
| 4 | `[[0,1], [1,2], [2,3], [3,1]]` | `true` | $1 \to 2 \to 3 \to 1$ |
| 1 | `[[0,0]]` | `true` | 자기 루프 |
| 2 | `[]` | `false` | 간선 없음 |
