/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `spfa.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는 코드와
 * 사이드카(`.proof.ts` · `.alt.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑥ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **음수 사이클 판정은 이 함수의 직무가 아니다.** 문제가 「`src` 에서 도달 가능한 음수
 * 사이클은 없다」를 보장하고, 그 보장이 없으면 아래 `while` 이 끝나지 않는다.
 */

export type Edge = [number, number, number];

export function spfa(n: number, edges: Edge[], src: number): number[] {
  // ① 이웃 목록 — 간선 목록을 꼬리 정점별로 모은다. 꺼낸 정점의 간선만 읽으려면 필요하다.
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  // ② 시작값 — 아직 아무 경로도 찾지 못했으므로 전부 `Infinity` 이고 시작 정점만 `0` 이다.
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;

  // ③ 대기열 — 값이 줄어든 정점만 담는다. `inQueue` 는 같은 정점이 두 벌 들어가는 것을 막고,
  // `head` 는 다음에 꺼낼 자리를 가리켜 배열 앞을 지우지 않게 한다.
  const inQueue: boolean[] = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let head = 0;

  while (head < queue.length) {
    // ④ 꺼내기 — 꺼낸 그 자리에서 표시를 내린다. 이웃을 처리하는 동안 이 정점의 값이 다시
    // 줄어들면 그때 다시 담겨야 한다.
    const u = queue[head++] as number;
    inQueue[u] = false;

    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;
      // ⑤ 완화 — 지금 적힌 값보다 작을 때만 고쳐 적는다.
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        // ⑥ 다시 담기 — 값이 줄었으니 이 정점에서 나가는 간선을 다시 읽어야 한다.
        if (!inQueue[v]) {
          inQueue[v] = true;
          queue.push(v);
        }
      }
    }
  }

  return dist;
}
