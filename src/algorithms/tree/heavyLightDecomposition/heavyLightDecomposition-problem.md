# 경로 값 합 질의

## 한 줄 요약

> 트리의 정점들에 값을 부여하고, 정점 값을 갱신하거나 두 정점 사이 경로 위 모든 정점 값의 합을 반환하는 자료구조를 구현한다.

## 스토리

왕국의 도로 관리청은 전국의 도시를 잇는 간선 도로망을 운영하고 있다. 도로망은 사이클 없이 모든 도시를 연결하는 구조이며, 수도에서 출발해 어느 도시든 유일한 경로로 도달할 수 있다.

각 도시에는 유지보수 비용 지수가 매겨져 있다. 담당자는 두 가지 업무를 처리한다. 첫째, 특정 도시의 비용 지수가 바뀌면 기록을 갱신한다. 둘째, 두 도시를 잇는 경로 전체의 비용 지수 합계를 요청받으면 즉시 계산해 보고한다.

도시 수가 최대 10만 개에 달하고 갱신·조회 요청이 빈번하게 들어오므로, 느린 순차 탐색으로는 처리가 불가능하다. 빠르게 응답할 수 있는 자료구조가 필요하다.

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

- `n` — 정점 수
- `edges` — 무방향 간선 목록. 각 원소 `[u, v]`는 정점 `u`와 `v`를 잇는 간선 (0-based 인덱스)
- `root` — 루트 정점 번호 (0-based)
- `values` — 정점별 초기 값. `values[i]`는 정점 `i`의 초기 값 (음수 가능)
- `update(node, value)` — 정점 `node`의 값을 `value`로 갱신. 반환값 없음
- `queryPath(u, v)` — 정점 `u`에서 `v`까지 경로 위 모든 정점 값의 합을 반환

## 제약 조건

- $1 \leq N \leq 10^5$ (정점 수)
- `edges`의 길이는 $N - 1$, 주어진 그래프는 연결된 트리를 형성한다
- 각 간선 $[u, v]$에 대해 $0 \leq u, v < N$, $u \neq v$ (0-based)
- $0 \leq \text{root} < N$
- `values`의 길이는 $N$, 각 원소는 정수 (음수 가능)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

`update(node, value)`는 정점 `node`의 값을 `value`로 교체한다. 이전 값은 버린다.

`queryPath(u, v)`는 `u`에서 `v`로 가는 트리 위의 유일한 경로 위에 있는 모든 정점(경로 양 끝 포함)의 값을 합산해 반환한다.

두 정점이 같은 경우(`u == v`)에는 해당 정점 값 하나만 반환한다.

경로는 방향에 무관하다. `queryPath(u, v)`와 `queryPath(v, u)`는 항상 같은 값을 반환한다.

## 예시

```ts
//        0(1)
//       /    \
//      1(2)   2(3)
//     / \      \
//    3(4) 4(5)  5(6)

const hld = new HeavyLightDecomposition(
  6,
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
  0,
  [1, 2, 3, 4, 5, 6]
);

hld.queryPath(3, 4);  // 11 — 경로 3→1→4: 값 4 + 2 + 5
hld.queryPath(3, 5);  // 16 — 경로 3→1→0→2→5: 값 4 + 2 + 1 + 3 + 6
hld.queryPath(5, 5);  // 6  — 경로 5→5: 값 6 (단일 정점)
hld.queryPath(0, 5);  // 10 — 경로 0→2→5: 값 1 + 3 + 6

hld.update(1, 10);    // 정점 1의 값을 2에서 10으로 갱신

hld.queryPath(3, 4);  // 19 — 경로 3→1→4: 값 4 + 10 + 5
hld.queryPath(3, 5);  // 24 — 경로 3→1→0→2→5: 값 4 + 10 + 1 + 3 + 6

// 경계: 단일 정점 트리
const single = new HeavyLightDecomposition(1, [], 0, [42]);
single.queryPath(0, 0); // 42
single.update(0, 99);
single.queryPath(0, 0); // 99

// 경계: 체인 트리 (선형)
const chain = new HeavyLightDecomposition(
  4,
  [[0, 1], [1, 2], [2, 3]],
  0,
  [1, 2, 3, 4]
);
chain.queryPath(0, 3); // 10 — 경로 위 모든 정점 합
chain.queryPath(1, 2); // 5  — 경로 1→2: 값 2 + 3
```
