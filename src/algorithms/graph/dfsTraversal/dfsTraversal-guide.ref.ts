/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/dfsTraversal/dfsTraversal.ts` 는 학습자 스텁이라 본문에 실을 수
 * 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 간선 목록을
 * 이웃 목록으로 바꾸고, 목록마다 번호 오름차순으로 정렬한 뒤, 스택에서 정점을 꺼내며 처음
 * 꺼낸 정점만 결과에 넣는다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. 스택 배열 하나로
 * 옮기면 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 두 자리가
 * 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - `list.sort(...)` 한 줄을 지우면 이웃 목록이 입력 순서 그대로 남는다.
 * - 내림차순 반복문 한 줄을 오름차순으로 바꾸면 큰 번호부터 결과에 들어간다.
 */

/**
 * 무향 그래프에서 `start` 부터 깊이 우선으로 정점을 **처음 방문한 순서**.
 * 이웃이 여럿이면 번호가 작은 쪽을 먼저 방문하고, 도달할 수 없는 정점은 결과에 넣지 않는다.
 */
export function dfsTraversal(
  n: number,
  edges: [number, number][],
  start: number,
): number[] {
  // 간선 목록을 이웃 목록으로 바꾼다. 무향이라 양쪽 정점에 다 넣는다.
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }

  // 목록마다 번호 오름차순으로 정렬한다. 이 순서가 곧 방문 우선순위다.
  for (const list of adj) list.sort((a, b) => a - b);

  // `visited` 는 결과에 이미 넣었는가를 담는다. 스택에 넣을 때가 아니라 꺼낼 때 본다.
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack: number[] = [start];

  while (stack.length > 0) {
    const node = stack.pop() as number;

    // ② 이미 결과에 들어간 정점 — 스택에 두 번 들어갔던 것이라 그대로 버린다.
    if (visited[node] === true) continue;

    // ① 처음 꺼내는 정점 — 방문 표시를 하고 결과에 넣는다.
    visited[node] = true;
    order.push(node);

    // 스택은 나중에 넣은 것을 먼저 꺼낸다. 작은 번호를 먼저 꺼내려면 큰 번호부터 넣는다.
    const list = adj[node] as number[];
    for (let i = list.length - 1; i >= 0; i--) stack.push(list[i] as number);
  }

  return order;
}
