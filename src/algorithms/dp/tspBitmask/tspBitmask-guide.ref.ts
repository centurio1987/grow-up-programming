/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `tspBitmask.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는 코드와
 * 사이드카(`.proof.ts` · `.alt.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑦ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **방문 집합은 32 비트 정수 하나다.** 자바스크립트의 비트 연산이 피연산자를 32 비트로
 * 자르므로 도시 수가 31 을 넘으면 `FULL` 이 뜻을 잃는다. 그 한계와 메모리 한계 중 어느 쪽이
 * 먼저 걸리는지는 본문 「이 방법이 기대는 전제」가 실측으로 낸다.
 *
 * **마지막 반복이 `last = 0` 부터인 것은 도시가 하나뿐인 입력 때문이다.** 도시가 둘 이상이면
 * 그 자리의 값이 언제나 INF 라 답에 영향을 주지 않는다 — 본문 「짚고 가기」가 값으로 보인다.
 */

/** 아직 이르는 접두 경로가 없는 칸의 값. 어떤 유한한 순회 비용보다 크다. */
export const INF = Number.POSITIVE_INFINITY;

export function tspBitmask(dist: number[][]): number {
  const n = dist.length;
  // 모든 도시를 방문한 방문 집합. 자리 i 가 1 이면 도시 i 를 방문했다는 뜻이다.
  const FULL = (1 << n) - 1;
  // ① DP 테이블 — dp[mask * n + v] 가 dp[mask][v] 다. 한 줄로 펴서 한 번에 잡는다.
  const dp = new Float64Array((FULL + 1) * n).fill(INF);
  // ② 출발 칸 — 도시 0 만 방문했고 지금 도시가 0 이며 비용이 0 이다.
  dp[1 * n + 0] = 0;

  for (let mask = 1; mask <= FULL; mask++) {
    for (let v = 0; v < n; v++) {
      // ③ 지금 도시가 방문 집합 밖이면 그 칸에 이르는 경로는 없다.
      if ((mask & (1 << v)) === 0) continue;
      const cur = dp[mask * n + v] as number;
      // ④ 값이 INF 인 칸(이르는 경로가 아직 없는 칸)에서는 전이를 만들지 않는다.
      if (cur === INF) continue;
      const row = dist[v] as number[];
      for (let u = 0; u < n; u++) {
        // ⑤ 이미 방문한 도시로는 가지 않는다.
        if ((mask & (1 << u)) !== 0) continue;
        const next = mask | (1 << u);
        const at = next * n + u;
        const cand = cur + (row[u] as number);
        // ⑥ 같은 칸에 더 작은 비용으로 이르렀으면 그 값으로 바꾼다.
        if (cand < (dp[at] as number)) dp[at] = cand;
      }
    }
  }

  let answer = INF;
  for (let last = 0; last < n; last++) {
    const back = dist[last] as number[];
    // ⑦ 마지막 도시에서 도시 0 으로 돌아오는 비용까지 더한 것이 순회 하나의 비용이다.
    const cand = (dp[FULL * n + last] as number) + (back[0] as number);
    if (cand < answer) answer = cand;
  }
  return answer;
}
