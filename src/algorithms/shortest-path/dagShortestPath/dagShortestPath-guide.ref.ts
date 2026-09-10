/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/shortest-path/dagShortestPath/dagShortestPath.ts` 는 학습자 스텁이라
 * 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 —
 * 간선 목록을 「나가는 간선 목록」과 「들어오는 간선 수」 둘로 옮기고, 들어오는 간선이 없는
 * 정점부터 한 줄을 만든 다음, 그 줄의 순서대로 각 정점의 나가는 간선을 한 번씩 완화한다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. 줄을 배열 하나로 만들면
 * 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * **줄을 담는 배열이 처리 목록을 겸한다.** `order` 에 뒤로 붙이면서 앞에서부터 읽으므로
 * 큐를 따로 두지 않는다. `for (let i = 0; i < order.length; i++)` 의 길이는 반복 도중 늘어난다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 줄 뒤에 붙이는 조건 `remaining[v] === 0` 을 `<= 1` 로 바꾸면 선행 정점이 아직 남은 정점이
 *   줄에 들어간다. 앞자리를 놓는 줄은 `for` 로 시작해서 같은 정규식에 안 걸린다.
 * - `for (let i = 0; i < order.length; i++)` 의 길이를 미리 붙잡아 두면 줄이 앞자리에서 멈춘다.
 * - `dist[u]` 가 `Infinity` 인 정점을 건너뛰는 줄은 통째로 지울 수 있다.
 */

/** 간선 하나 — `[u, v, w]` 는 가중치 `w` 인 방향 간선 `u → v` 다. `w` 는 음수일 수 있다. */
export type Edge = [number, number, number];

/**
 * 사이클이 없는 방향 그래프에서 `src` 로부터 각 정점까지의 최소 비용.
 * 갈 수 있는 길이 하나도 없는 정점은 `Infinity` 이고 `src` 자신은 `0` 이다.
 */
export function dagShortestPath(
  n: number,
  edges: Edge[],
  src: number,
): number[] {
  // 간선 목록을 둘로 옮긴다 — 정점마다 나가는 간선 목록과, 들어오는 간선 수.
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  const remaining: number[] = Array.from({ length: n }, () => 0);
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    remaining[v] = (remaining[v] as number) + 1;
  }

  // ① 들어오는 간선이 없는 정점이 줄의 앞자리다. 번호가 작은 것부터 놓는다.
  const order: number[] = [];
  for (let v = 0; v < n; v++) if (remaining[v] === 0) order.push(v);

  // 만들고 있는 줄이 곧 다음에 처리할 목록이다. 길이가 반복 도중에 늘어난다.
  for (let i = 0; i < order.length; i++) {
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      remaining[v] = (remaining[v] as number) - 1;
      // ② 남은 선행 정점이 0 이 된 그 순간에 줄의 뒤에 붙인다.
      if (remaining[v] === 0) order.push(v);
    }
  }

  // ③ 시작값 — 시작 정점만 0 이고 나머지는 아직 갈 길을 못 찾았다.
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;

  for (const u of order) {
    // ④ 갈 길을 못 찾은 정점에서 나가는 간선은 아무 값도 못 고친다.
    if (dist[u] === Number.POSITIVE_INFINITY) continue;

    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;
      // ⑤ 지금 적힌 값보다 작을 때만 고쳐 적는다.
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }

  return dist;
}
