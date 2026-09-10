/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 최대 유량 최소 컷 정리를 그대로 절차로 옮긴 것이다 — 잔여 그래프에 디닉(Dinic) 절차로
 * 유량을 다 흘린 뒤, **반복을 끝낸 그 BFS 가 적어 둔 `level`** 을 소스 쪽 무리로 읽고 원래
 * 간선 중 소스 쪽에서 싱크 쪽으로 향하는 것의 용량만 더한다.
 *
 * 원본 `src/algorithms/graph-flow/minCut/minCut.ts` 는 학습자 스텁이라 비교 대상이 아니다.
 * 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **유량 값을 누적하지 않는다.** 반환 계약이 컷 용량 하나뿐이고, 컷 용량은 마지막 `level` 과
 * 원래 간선 목록만으로 정해진다. 유량과 컷이 같은 값이라는 것은 이 절차의 정확성 근거이지
 * 계산 경로가 아니다.
 *
 * 원문자 라벨 ①~⑦ 은 본문 전개가 그대로 인용한다(P4).
 */

/** 잔여 그래프의 간선 하나. `rev` 는 짝이 되는 간선이 상대 목록에서 놓인 자리다. */
interface ResidualEdge {
  to: number;
  cap: number;
  rev: number;
}

/**
 * 유량 네트워크에서 `source` 와 `sink` 를 갈라 놓는 최소 컷의 용량.
 *
 * `edges` 의 원소 `[u, v, c]` 는 `u` 에서 `v` 로 향하는 용량 `c` 의 방향 간선이다.
 */
export function minCut(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { cut: number } {
  if (source === sink) return { cut: 0 };

  // 잔여 그래프. 원래 간선 하나가 정방향(잔여 `c`)과 역방향(잔여 0) 두 항목이 된다.
  const graph: ResidualEdge[][] = Array.from({ length: n }, () => []);
  const link = (u: number, v: number, c: number): void => {
    const out = graph[u] as ResidualEdge[];
    const back = graph[v] as ResidualEdge[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as ResidualEdge).rev = iBack;
  };
  for (const [u, v, c] of edges) link(u, v, c);

  // `level[v]` 는 지금 잔여 그래프에서 소스부터 `v` 까지의 최단 간선 수다. `-1` 은 도달 못 함.
  const level: number[] = Array.from({ length: n }, () => -1);
  // `iter[v]` 는 이 라운드에서 `v` 의 목록 중 다음에 볼 자리다. 라운드 안에서 뒤로만 간다.
  const iter: number[] = Array.from({ length: n }, () => 0);

  function bfs(): void {
    level.fill(-1);
    level[source] = 0;
    const queue: number[] = [source];
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++] as number;
      for (const e of graph[u] as ResidualEdge[]) {
        // ① 잔여 용량이 있고 아직 레벨이 없는 정점 — 레벨을 적고 큐 뒤에 넣는다.
        if (e.cap > 0 && (level[e.to] as number) === -1) {
          level[e.to] = (level[u] as number) + 1;
          queue.push(e.to);
        }
      }
    }
  }

  function dfs(u: number, pushed: number): number {
    // ③ 싱크에 도착했다 — 여기까지의 병목값을 그대로 올려보낸다.
    if (u === sink) return pushed;
    const list = graph[u] as ResidualEdge[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as ResidualEdge;
      // ② 잔여 용량이 있고 레벨이 정확히 한 칸 큰 간선 — 그 간선으로 내려간다.
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        // ④ 아래에서 양수가 올라왔다 — 짝지은 두 잔여 용량을 갱신하고 그대로 올려보낸다.
        if (d > 0) {
          const back = (graph[e.to] as ResidualEdge[])[e.rev] as ResidualEdge;
          e.cap -= d;
          back.cap += d;
          return d;
        }
      }
      // ⑤ 조건에 안 맞거나 0 이 올라왔다 — `iter[u]` 를 한 칸 옮겨 다음 간선을 본다.
    }
    return 0;
  }

  for (;;) {
    bfs();
    // ⑥ BFS 가 싱크에 레벨을 못 적었다 — 더 보낼 것이 없으므로 반복을 끝낸다.
    if ((level[sink] as number) === -1) break;
    iter.fill(0);
    for (;;) {
      if (dfs(source, Number.POSITIVE_INFINITY) === 0) break;
    }
  }

  // 반복을 끝낸 BFS 가 레벨을 적어 둔 정점이 곧 소스 쪽 무리다. 새로 탐색하지 않는다.
  let cut = 0;
  for (const [u, v, c] of edges) {
    // ⑦ 소스 쪽에서 싱크 쪽으로 건너가는 원래 간선 — 그 용량만 더한다.
    if ((level[u] as number) !== -1 && (level[v] as number) === -1) cut += c;
  }
  return { cut };
}
