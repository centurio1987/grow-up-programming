/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/connectedComponents/connectedComponents.ts` 는 학습자 스텁이라
 * 절차가 비어 있다. 여기서 세우는 절차는 하나다 — 간선 목록을 이웃 목록으로 바꾸고, 정점
 * 번호 오름차순으로 **아직 성분 번호가 없는 정점**에서만 너비 우선 탐색을 시작하며,
 * **성분 번호 배열 하나를 성분 사이에서 그대로 유지**한다.
 *
 * 마지막 통과가 정점 번호 오름차순이라 성분 안이 정렬된 채로 나오고, 성분 번호를 붙인
 * 순서가 곧 시작점 번호 오름차순이라 성분끼리의 순서도 계약과 같다. 정렬 호출이 없다.
 */

/**
 * 무향 그래프의 연결 성분. 성분 안의 정점은 오름차순이고, 성분끼리는 각 성분의 최소 정점
 * 번호 오름차순이다.
 */
export function connectedComponents(
  n: number,
  edges: [number, number][],
): number[][] {
  // 간선 목록을 이웃 목록으로 바꾼다. 무향이라 양쪽 정점에 다 넣는다.
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }

  // `-1` 은 "아직 어느 성분에도 안 들어갔다" 를 뜻한다. 방문 표시를 따로 두지 않는다.
  const comp: number[] = Array.from({ length: n }, () => -1);
  let count = 0;

  for (let s = 0; s < n; s++) {
    // ② 이미 성분 번호가 있는 정점 — 새 탐색을 시작하지 않는다.
    if (comp[s] !== -1) continue;

    // ① 새 성분의 시작점 — 번호 `count` 를 붙이고 큐에 넣는다.
    comp[s] = count;
    const queue: number[] = [s];
    let head = 0;

    while (head < queue.length) {
      const node = queue[head++] as number;

      for (const next of adj[node] as number[]) {
        // ④ 이미 성분 번호가 있는 이웃 — 그대로 둔다.
        if ((comp[next] as number) !== -1) continue;

        // ③ 처음 만나는 이웃 — 같은 번호를 적고 큐 뒤에 넣는다.
        comp[next] = count;
        queue.push(next);
      }
    }

    count++;
  }

  // 정점 번호 오름차순으로 담는다. 그래서 성분 안이 정렬된 채로 나온다.
  const out: number[][] = Array.from({ length: count }, () => []);
  for (let v = 0; v < n; v++) (out[comp[v] as number] as number[]).push(v);
  return out;
}
