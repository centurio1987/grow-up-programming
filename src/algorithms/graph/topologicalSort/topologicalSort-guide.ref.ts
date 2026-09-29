/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/topologicalSort/topologicalSort.ts` 는 학습자 스텁이라 본문에
 * 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 —
 * 간선 목록을 「나가는 목록」 `next` 와 「진입 차수」 `indegree` 둘로 옮기고, 진입 차수가 0 인
 * 정점을 큐에 담고, 큐에서 꺼낼 때마다 도착 정점의 진입 차수를 하나씩 줄인다.
 *
 * **재귀를 쓰지 않는다.** 정점이 한 줄로 10 만 개 이어진 입력이 들어올 수 있어서, 재귀로 적으면
 * 호출 깊이가 그대로 정점 수가 된다. 큐 배열 하나로 옮기면 깊이가 배열 길이가 되어 그 제한을
 * 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 큐에 담는 조건 `indegree[v] === 0` 을 `indegree[v] <= 1` 로 바꾸면 진입 차수가 아직 남은
 *   정점이 큐에 들어간다. 처음 후보를 담는 줄은 `for` 로 시작해서 같은 정규식에 안 걸린다.
 * - `indegree[v]` 를 늘리는 줄에서 `v` 를 `u` 로 바꾸면 들어오는 간선 대신 나가는 간선을
 *   센다.
 */

/**
 * 유향 그래프의 정점을 모든 간선 `[u, v]` 에 대해 `u` 가 `v` 보다 앞에 오도록 나열한다.
 * 사이클이 있어 그런 나열이 없으면 `null` 을 돌려준다. 유효한 나열이 여럿이면 그중 하나다.
 */
export function topologicalSort(
  n: number,
  edges: [number, number][],
): number[] | null {
  // 간선 목록을 둘로 옮긴다 — 정점마다 나가는 간선의 도착 정점 목록과, 진입 차수.
  const next: number[][] = Array.from({ length: n }, () => []);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [u, v] of edges) {
    (next[u] as number[]).push(v);
    indegree[v] = (indegree[v] as number) + 1;
  }

  // 진입 차수가 0 인 정점이 맨 앞에 놓아도 되는 정점이다. 번호가 작은 것부터 담는다.
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);

  const order: number[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    head++;
    order.push(u);

    for (const v of next[u] as number[]) {
      indegree[v] = (indegree[v] as number) - 1;

      // ① 진입 차수가 0 이 된 그 순간에 큐에 담는다.
      // ② 아직 0 이 아니면 담지 않는다. 남은 간선이 이 정점의 진입 차수를 다시 줄여 줄 것이다.
      if (indegree[v] === 0) queue.push(v);
    }
  }

  // ③ 정점이 전부 결과에 들어갔으면 그것이 위상 순서다.
  // ④ 하나라도 남았으면 남은 정점들이 사이클을 이루고 있다.
  return order.length === n ? order : null;
}
