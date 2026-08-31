/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/tree/treeDiameter/treeDiameter.ts` 는 학습자 스텁이라 본문에 실을 수
 * 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 아무 정점에서
 * 한 번 재서 가장 먼 정점을 찾고, 그 정점에서 한 번 더 재서 나온 최댓값을 답으로 낸다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. 스택 배열 하나로 옮기면
 * 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 둘째 탐색의 출발점을 첫 탐색이 찾은 정점 대신 0 으로 되돌리면, 첫 탐색의 최댓값이 그대로
 *   답이 되어 지름보다 작은 값이 나온다.
 * - 더 먼 정점을 찾았을 때 기록을 갱신하는 줄의 부등호를 뒤집으면 가장 가까운 정점이 남는다.
 */

/**
 * 정점 `n` 개와 가중치 무방향 간선 목록을 받아 트리 지름(두 정점 사이 경로 길이의 최댓값)을
 * 돌려준다. 정점이 하나뿐이면 간선이 없으므로 `0` 이다.
 */
export function treeDiameter(
  n: number,
  edges: [number, number, number][],
): number {
  // 간선 목록을 정점마다의 이웃 목록으로 옮긴다. 무방향이라 양쪽에 넣는다.
  const near: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    (near[u] as [number, number][]).push([v, w]);
    (near[v] as [number, number][]).push([u, w]);
  }

  /** `start` 에서 가장 먼 정점과 그 거리. */
  function farthest(start: number): [number, number] {
    const dist: number[] = Array.from({ length: n }, () => -1);
    const stack: number[] = [start];
    dist[start] = 0;
    let best = start;

    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (const [v, w] of near[u] as [number, number][]) {
        // ① 거리를 이미 정한 정점은 건너뛴다. 트리라 그것이 온 자리 하나뿐이다.
        if ((dist[v] as number) >= 0) continue;
        dist[v] = (dist[u] as number) + w;
        stack.push(v);
        // ② 지금까지 가장 먼 것보다 멀면 그 정점으로 기록을 옮긴다.
        if ((dist[v] as number) > (dist[best] as number)) best = v;
      }
    }
    return [best, dist[best] as number];
  }

  // ③ 아무 정점에서 가장 먼 곳은 지름의 한쪽 끝이다.
  const [a] = farthest(0);
  // ④ 그 끝에서 가장 먼 곳까지가 지름이다.
  const [, diameter] = farthest(a);
  return diameter;
}
