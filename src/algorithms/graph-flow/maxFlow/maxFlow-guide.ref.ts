/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 디닉(Dinic) 절차다 — 잔여 그래프를 만들고, 라운드마다 BFS 로 레벨을 매긴 뒤 그 레벨을
 * 한 칸씩 올라가는 간선만 따라 DFS 로 증가 경로를 소진한다. `iter` 배열이 라운드 안에서
 * 「다음에 볼 간선」을 기억해, 이미 실패한 간선을 다시 보지 않는다.
 *
 * 원본 `src/algorithms/graph-flow/maxFlow/maxFlow.ts` 는 학습자 스텁이라 비교 대상이 아니다.
 * 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * **`link` 가 두 자리를 따로 기억하는 이유**는 자기 루프 때문이다. `u === v` 면 정방향과
 * 역방향이 같은 목록에 들어가므로, 짝의 자리를 「지금 길이」로 적으면 정방향이 자기 자신을
 * 가리킨다. 자리를 push 직전에 각각 읽어 두면 자기 루프에서도 짝이 맞는다.
 */

/** 잔여 그래프의 간선 하나. `rev` 는 짝이 되는 간선이 상대 목록에서 놓인 자리다. */
interface Edge {
  to: number;
  cap: number;
  rev: number;
}

/**
 * 유량 네트워크에서 `source` 로부터 `sink` 로 보낼 수 있는 최대 유량.
 *
 * `edges` 의 원소 `[u, v, c]` 는 `u` 에서 `v` 로 향하는 용량 `c` 의 방향 간선이다.
 */
export function maxFlow(
  n: number,
  edges: [number, number, number][],
  source: number,
  sink: number,
): { flow: number } {
  if (source === sink) return { flow: 0 };

  // 잔여 그래프. 원래 간선 하나가 정방향(잔여 `c`)과 역방향(잔여 0) 두 항목이 된다.
  const graph: Edge[][] = Array.from({ length: n }, () => []);
  const link = (u: number, v: number, c: number): void => {
    const out = graph[u] as Edge[];
    const back = graph[v] as Edge[];
    const iOut = out.length;
    out.push({ to: v, cap: c, rev: 0 });
    const iBack = back.length;
    back.push({ to: u, cap: 0, rev: iOut });
    (out[iOut] as Edge).rev = iBack;
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
      for (const e of graph[u] as Edge[]) {
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
    const list = graph[u] as Edge[];
    for (
      ;
      (iter[u] as number) < list.length;
      iter[u] = (iter[u] as number) + 1
    ) {
      const e = list[iter[u] as number] as Edge;
      // ② 잔여 용량이 있고 레벨이 정확히 한 칸 큰 간선 — 그 간선으로 내려간다.
      if (e.cap > 0 && (level[e.to] as number) === (level[u] as number) + 1) {
        const d = dfs(e.to, Math.min(pushed, e.cap));
        // ④ 아래에서 양수가 올라왔다 — 짝지은 두 잔여 용량을 갱신하고 그대로 올려보낸다.
        if (d > 0) {
          const back = (graph[e.to] as Edge[])[e.rev] as Edge;
          e.cap -= d;
          back.cap += d;
          return d;
        }
      }
      // ⑤ 조건에 안 맞거나 0 이 올라왔다 — `iter[u]` 를 한 칸 옮겨 다음 간선을 본다.
    }
    return 0;
  }

  let total = 0;
  for (;;) {
    bfs();
    // ⑥ BFS 가 싱크에 레벨을 못 적었다 — 증가 경로가 없으므로 반복을 끝낸다.
    if ((level[sink] as number) === -1) return { flow: total };
    iter.fill(0);
    for (;;) {
      const f = dfs(source, Number.POSITIVE_INFINITY);
      if (f === 0) break;
      total += f;
    }
  }
}
