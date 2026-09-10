/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `maxBipartiteMatching.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가
 * 싣는 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일
 * 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓴다.** `augment` 가 자기를 다시 부르는 깊이는 왼쪽 정점 수를 넘지 못하고
 * (`seen` 이 오른쪽 정점을 한 번씩만 통과시키므로 재배정 사슬이 길어야 `L` 칸이다),
 * 제약이 `L ≤ 10^3` 이라 호출 자리가 1,000 개를 안 넘는다.
 */

export function maxBipartiteMatching(
  left: number,
  right: number,
  edges: [number, number][],
): number {
  // ① 이웃 목록 — 왼쪽 정점마다 이을 수 있는 오른쪽 정점 번호를 모은다. 중복 간선은
  // 그대로 담는다. 같은 자리를 두 번 읽어도 `seen` 이 둘째 읽기를 걸러 낸다.
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);

  // ② 짝 표와 방문 표 — `matchR[v]` 는 오른쪽 정점 `v` 에 이어진 왼쪽 정점 번호이고 `-1`
  // 이 빈자리다. `seen[v]` 는 지금 실행 중인 탐색 하나가 `v` 를 이미 본 적이 있는가다.
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const seen: boolean[] = Array.from({ length: right }, () => false);

  // ③ 증대 경로 탐색 — `u` 에서 시작해 빈 오른쪽 정점에 도달하면 참을 돌려준다.
  const augment = (u: number): boolean => {
    for (const v of adj[u] as number[]) {
      // ④ 이번 탐색이 이미 본 오른쪽 정점이라 다시 보지 않는다.
      if (seen[v] === true) continue;
      seen[v] = true;
      // ⑤ 빈자리면 바로 잇고, ⑥ 짝이 있으면 그 짝을 다른 자리로 옮길 수 있는지 본다.
      if ((matchR[v] as number) === -1 || augment(matchR[v] as number)) {
        // ⑦ 경로 위의 간선을 뒤집는다 — `v` 의 짝이 `u` 가 된다.
        matchR[v] = u;
        return true;
      }
    }
    // ⑧ 어느 이웃으로도 증대 경로가 없다.
    return false;
  };

  let size = 0;
  for (let u = 0; u < left; u++) {
    // ⑨ 왼쪽 정점 하나마다 방문 표를 새로 채운다. 탐색끼리 표를 나눠 쓰면 안 된다.
    seen.fill(false);
    if (augment(u)) size++;
  }
  return size;
}
