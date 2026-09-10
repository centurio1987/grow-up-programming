/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow.ts` 와 **같은 계약**이다 —
 * 정점 수 · 간선 목록 · 소스 · 싱크를 받아 최대 유량과 그 유량에서의 최소 총비용을 낸다.
 * 절차는 라운드 반복이다. 라운드마다 잔여 그래프에서 단위 비용 합이 가장 작은 소스→싱크
 * 경로를 찾고, 그 경로의 병목만큼 보낸다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * 최단 경로를 구하는 자리는 **완화 큐**(값이 줄어든 정점만 다시 넣는 벨만-포드)다. 다익스트라가
 * 아니다 — 역방향 항목의 단위 비용이 음수라 「꺼낸 값이 확정」이라는 전제가 성립하지 않는다.
 * 그 자리를 다익스트라로 바꾸려면 잠재값으로 비용을 다시 매겨야 하고, 그 유도는 「수식 정의와
 * 유도」 절이 진다.
 *
 * 원본과 다른 자리는 둘이다.
 *
 * 1. 원본은 학습자 스텁이라 본문이 없다. 이 파일이 그 자리를 채운다.
 * 2. 경로를 거슬러 올라갈 수 있게 정점마다 **직전 정점과 그 항목의 자리** 둘을 적어 둔다.
 *    정점만 적으면 두 정점 사이에 항목이 여럿일 때 어느 것을 지나왔는지 알 수 없다.
 *
 * **계수를 세거나 잔여 그래프를 밖으로 내주는 자리는 여기 두지 않는다.** 그런 사본은
 * `minCostMaxFlow-guide.proof.ts` 가 따로 갖는다 — 이 파일은 가이드가 싣는 코드와 글자
 * 그대로 같아야 한다.
 */

/** 간선 하나 — `[u, v, cap, cost]` 는 용량 `cap` · 단위 비용 `cost` 인 방향 간선 `u → v` 다. */
export type FlowEdge = [number, number, number, number];

/** 잔여 그래프의 항목 하나. `rev` 는 짝이 되는 반대 방향 항목이 놓인 자리다. */
interface Arc {
  to: number;
  cap: number;
  cost: number;
  rev: number;
}

/**
 * 최대 유량과 그 유량에서의 최소 총비용.
 *
 * 원래 간선의 단위 비용은 음수가 아니라고 가정한다. 소스에서 싱크로 가는 경로가 없으면
 * `{ flow: 0, cost: 0 }` 이다.
 */
export function minCostMaxFlow(
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
): { flow: number; cost: number } {
  // ① 간선 하나를 두 항목으로 나눠 담는다 — 역방향 항목은 용량 0 에 단위 비용이 반대 부호다.
  const graph: Arc[][] = Array.from({ length: n }, () => []);
  for (const [u, v, cap, cost] of edges) {
    const from = graph[u] as Arc[];
    const to = graph[v] as Arc[];
    from.push({ to: v, cap, cost, rev: to.length });
    to.push({ to: u, cap: 0, cost: -cost, rev: from.length - 1 });
  }

  let flow = 0;
  let cost = 0;

  // ② 라운드 — 싱크에 이르는 경로가 있는 동안 되풀이한다.
  for (;;) {
    const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
    const waiting = Array.from({ length: n }, () => false);
    const fromV = Array.from({ length: n }, () => -1);
    const fromE = Array.from({ length: n }, () => -1);
    dist[source] = 0;
    const queue: number[] = [source];
    waiting[source] = true;

    // ③ 완화 큐 — 값이 줄어든 정점만 다시 넣는다. 음수 비용 항목도 그대로 다룬다.
    while (queue.length > 0) {
      const u = queue.shift() as number;
      waiting[u] = false;
      const arcs = graph[u] as Arc[];
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i] as Arc;
        const next = (dist[u] as number) + arc.cost;
        if (arc.cap > 0 && next < (dist[arc.to] as number)) {
          dist[arc.to] = next;
          fromV[arc.to] = u;
          fromE[arc.to] = i;
          if (!waiting[arc.to]) {
            queue.push(arc.to);
            waiting[arc.to] = true;
          }
        }
      }
    }

    // ④ 싱크의 값이 그대로면 더 보낼 경로가 없다 — 그때의 유량이 최대 유량이다.
    if ((dist[sink] as number) === Number.POSITIVE_INFINITY) break;

    // ⑤ 경로를 거슬러 올라가며 잔여 용량이 가장 작은 항목을 찾는다.
    let push = Number.POSITIVE_INFINITY;
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      push = Math.min(push, (arcs[fromE[v] as number] as Arc).cap);
    }

    // ⑥ 그만큼 정방향 항목에서 덜고 짝이 되는 역방향 항목에 더한다.
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      arc.cap -= push;
      ((graph[v] as Arc[])[arc.rev] as Arc).cap += push;
    }

    flow += push;
    cost += push * (dist[sink] as number);
  }

  return { flow, cost };
}
