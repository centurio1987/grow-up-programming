# 부분 트리 합 질의

## 한 줄 요약

> 트리의 정점 값을 갱신하거나, 특정 정점을 뿌리로 하는 부분 트리 전체 정점 값의 합을 반환하는 자료구조를 구현한다.

## 스토리

대형 소매 체인의 본사 분석팀은 전국 지점 네트워크를 트리 구조로 관리한다. 본점 아래에 지역 본부가 있고, 지역 본부 아래에 지점들이 달려 있는 식이다. 각 지점과 본부에는 해당 월의 매출 실적이 기록된다.

팀은 두 가지 요청을 수시로 받는다. 하나는 "특정 지점의 실적이 갱신됐습니다"라는 업데이트 요청이고, 다른 하나는 "이 지역 본부 산하 전체 매출 합계를 알려주세요"라는 집계 요청이다.

지점 수가 수만 개에 달하고 갱신과 집계가 섞여서 수천 건씩 들어오므로, 매번 처음부터 다시 더하는 방식으로는 시간이 너무 걸린다.

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

- `n` — 정점 수
- `edges` — 무방향 간선 목록. 각 원소 `[u, v]`는 정점 `u`와 `v`를 잇는 간선 (0-based 인덱스)
- `root` — 루트 정점 번호 (0-based)
- `values` — 정점별 초기 값. `values[i]`는 정점 `i`의 초기 값 (음수 가능)
- `update(node, value)` — 정점 `node`의 값을 `value`로 갱신. 반환값 없음
- `querySubtree(node)` — 정점 `node`를 루트로 하는 부분 트리의 모든 정점 값의 합을 반환

## 제약 조건

- $1 \leq N \leq 10^5$ (정점 수)
- `edges`의 길이는 $N - 1$, 주어진 그래프는 연결된 트리를 형성한다
- 각 간선 $[u, v]$에 대해 $0 \leq u, v < N$, $u \neq v$ (0-based)
- $0 \leq \text{root} < N$
- `values`의 길이는 $N$, 각 원소는 정수 (음수 가능)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

정점 `node`의 부분 트리는 `node` 자신과 `node`의 모든 자손 정점으로 구성된다. `querySubtree(node)`는 이 집합에 속하는 모든 정점의 값을 합산해 반환한다.

리프 정점에 대한 `querySubtree`는 해당 정점의 값 하나만 반환한다.

`update(node, value)`는 정점 `node`의 값을 `value`로 교체한다. 이전 값은 버린다.

## 예시

```ts
//        0(1)
//       /    \
//      1(2)   2(3)
//     / \      \
//    3(4) 4(5)  5(6)

const sst = new SubtreeSumQuery(
  6,
  [[0,1],[0,2],[1,3],[1,4],[2,5]],
  0,
  [1, 2, 3, 4, 5, 6]
);

sst.querySubtree(0); // 21 — 전체 트리: 1+2+3+4+5+6
sst.querySubtree(1); // 11 — 정점 1의 부분 트리: 2+4+5
sst.querySubtree(2); //  9 — 정점 2의 부분 트리: 3+6
sst.querySubtree(3); //  4 — 리프 정점: 값 4만

sst.update(4, 10);   // 정점 4의 값을 5에서 10으로 갱신

sst.querySubtree(1); // 16 — 정점 1의 부분 트리: 2+4+10
sst.querySubtree(0); // 26 — 전체 트리: 1+2+3+4+10+6

// 경계: 단일 정점 트리
const single = new SubtreeSumQuery(1, [], 0, [42]);
single.querySubtree(0); // 42
single.update(0, 0);
single.querySubtree(0); // 0

// 경계: 음수 값
const neg = new SubtreeSumQuery(3, [[0,1],[0,2]], 0, [-1,-2,-3]);
neg.querySubtree(0); // -6
neg.querySubtree(1); // -2
```
