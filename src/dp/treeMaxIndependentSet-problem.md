# 트리 최대 가중 독립집합 (Tree Maximum Weighted Independent Set)

## 함수 인터페이스

```ts
export function treeMaxIndependentSet(
  n: number,
  edges: [number, number][],
  weights: number[],
): number;
```

## 제약 조건

- $1 \leq n \leq 10^5$ (노드 개수)
- $-10^4 \leq weights[i] \leq 10^4$
- $edges$ 의 길이는 $n - 1$, 그래프는 연결된 무방향 트리
- 노드 번호는 $0$ 부터 $n-1$ 까지의 정수, 루트는 $0$

## 문제 상세

노드 개수 $n$, 간선 목록 $edges$, 노드 가중치 $weights$ 로 표현된 트리가 주어진다.

**어떤 두 인접 노드도 동시에 선택하지 않는** 부분집합(독립집합) 중, 가중치 합이 최대인 집합의 합을 구해 반환하라.

가중치가 음수일 수 있으므로, 노드를 하나도 선택하지 않는 것이 최적일 수도 있다(이 경우 합은 $0$).

## 예시

```ts
treeMaxIndependentSet(1, [], [5]);
// 5  (단일 노드)

treeMaxIndependentSet(1, [], [-3]);
// 0  (음수면 선택하지 않음)

treeMaxIndependentSet(
  3,
  [[0, 1], [0, 2]],
  [1, 2, 3],
);
// 5  (1, 2 선택)

treeMaxIndependentSet(
  5,
  [[0, 1], [0, 2], [1, 3], [1, 4]],
  [3, 2, 4, 5, 6],
);
// 18  (0, 3, 4, 2 선택? 0과 1 인접: 0 선택 시 1 제외; 0+3+4+2=15. 1 선택 시 0,3,4 제외 → 2+2=4. 최적: 0(3)+2(4)+3(5)+4(6)=18)
```
