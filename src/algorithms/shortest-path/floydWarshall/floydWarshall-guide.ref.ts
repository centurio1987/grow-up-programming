/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `floydWarshall.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑤ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **음수 사이클 판정은 이 함수의 직무가 아니다.** 문제가 음수 사이클이 없다고 못 박았고,
 * 그 약속이 깨지면 대각선 칸이 0 보다 작아진 채로 반환된다.
 */

/** 아직 이어지는 길을 못 찾은 칸에 넣어 두는 값. 어떤 유한한 거리보다 크다. */
export const INF = Number.POSITIVE_INFINITY;

export function floydWarshall(
  n: number,
  edges: [number, number, number][],
): number[][] {
  // ① 거리 행렬 — 자기 자신은 0, 나머지는 아직 모르는 값이다.
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => (u === v ? 0 : INF)),
  );

  // ② 간선을 옮겨 적는다 — 같은 방향 간선이 여럿이면 더 작은 가중치만 남긴다.
  for (const [u, v, w] of edges) {
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }

  for (let k = 0; k < n; k++) {
    const viaK = dist[k] as number[];
    for (let u = 0; u < n; u++) {
      const row = dist[u] as number[];
      const toK = row[k] as number;
      // ③ u 에서 k 로 가는 길이 없으면 k 를 경유하는 길도 없다 — 이 행은 건너뛴다.
      if (toK === INF) continue;
      for (let v = 0; v < n; v++) {
        // ④ k 를 경유하는 길의 길이 — 앞 토막과 뒤 토막을 더한다.
        const through = toK + (viaK[v] as number);
        // ⑤ 지금 적힌 값보다 짧으면 그 값으로 고친다.
        if (through < (row[v] as number)) row[v] = through;
      }
    }
  }

  return dist;
}
