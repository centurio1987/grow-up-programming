/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `bellmanFord.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는 코드와
 * 사이드카(`.proof.ts` · `.alt.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑥ 은 본문 전개가 그대로 인용한다(P4).
 */

export type Edge = [number, number, number];

export interface Result {
  dist: number[];
  hasNegativeCycle: boolean;
}

export function bellmanFord(n: number, edges: Edge[], src: number): Result {
  // ① 시작값 — 아직 아무 경로도 찾지 못했으므로 전부 `Infinity` 이고 시작 정점만 `0` 이다.
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;

  // ② 바퀴 — 간선 목록을 처음부터 끝까지 한 번 읽는 것이 바퀴 하나다. 많아야 `n` 바퀴다.
  for (let round = 1; round <= n; round++) {
    let changed = false;

    for (const [u, v, w] of edges) {
      // ③ 값이 없는 정점 — `dist[u]` 가 `Infinity` 면 `u` 까지 가는 경로를 아직 못 찾았다.
      if (dist[u] === Number.POSITIVE_INFINITY) continue;

      const nd = (dist[u] as number) + w;
      // ④ 완화 — 지금 적힌 값보다 작을 때만 고쳐 적고, 고쳤다는 사실을 남긴다.
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }

    // ⑤ 조기 종료 — 한 바퀴가 한 칸도 못 고치면 그 뒤 바퀴도 못 고친다.
    if (!changed) return { dist, hasNegativeCycle: false };

    // ⑥ 음수 사이클 — `n` 번째 바퀴가 아직도 값을 고치면 줄어드는 자리가 끝나지 않는다.
    if (round === n) return { dist, hasNegativeCycle: true };
  }

  return { dist, hasNegativeCycle: false };
}
