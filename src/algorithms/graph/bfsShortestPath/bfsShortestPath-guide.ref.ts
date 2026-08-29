/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/bfsShortestPath/bfsShortestPath.ts` 와 **같은 절차**다 — 간선
 * 목록을 이웃 목록으로 바꾸고, 출발 정점을 큐에 넣은 뒤 **앞에서 꺼내 뒤에 넣으며** 거리를
 * 한 칸씩 채운다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * 원본과 다른 자리는 하나다. 원본은 고정 크기 배열에 `head`·`tail` 두 첨자를 모듈러로
 * 순환시키는 `CircularQueue` 클래스를 쓰고, 여기서는 **배열 하나와 읽는 자리 `head`** 를
 * 쓴다. 정점 하나가 큐에 최대 한 번만 들어가므로 배열이 `n` 칸을 넘지 않고, 꺼낸 자리를
 * 다시 쓸 일이 없어서 순환이 필요 없다.
 */

/**
 * 무가중치 무향 그래프에서 `source` 로부터 각 정점까지의 최단 간선 수.
 * 도달할 수 없는 정점은 `-1` 이고 `source` 자신은 `0` 이다.
 */
export function bfsShortestPath(
  n: number,
  edges: [number, number][],
  source: number,
): number[] {
  // `-1` 은 "아직 거리가 없다" 를 뜻한다. 방문 표시를 따로 두지 않고 이 값이 겸한다.
  const dist: number[] = Array.from({ length: n }, () => -1);

  // 간선 목록을 이웃 목록으로 바꾼다. 무향이라 양쪽 정점에 다 넣는다.
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }

  // 큐는 배열 하나와 읽는 자리 `head` 다. `head` 는 뒤로만 나아간다.
  const queue: number[] = [source];
  let head = 0;
  dist[source] = 0;

  while (head < queue.length) {
    const node = queue[head++] as number;

    for (const next of adj[node] as number[]) {
      // ② 이미 거리가 정해진 정점 — 지금 온 길이 더 짧을 수 없으므로 그대로 둔다.
      if ((dist[next] as number) !== -1) continue;

      // ① 처음 만나는 정점 — 거리를 적고 큐 뒤에 넣는다.
      dist[next] = (dist[node] as number) + 1;
      queue.push(next);
    }
  }

  return dist;
}
