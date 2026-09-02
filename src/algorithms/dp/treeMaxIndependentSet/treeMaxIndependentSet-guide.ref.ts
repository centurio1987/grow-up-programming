/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet.ts` 가 요구하는
 * 것과 **같은 계약**이다 — 노드 수 · 무방향 간선 목록 · 노드별 가중치를 받아, 어떤 두
 * 인접 노드도 함께 담지 않는 부분집합 중 가중치 합의 최댓값을 돌려준다. 빈 집합도
 * 후보라 답은 0 아래로 안 내려간다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * 가중 트리에서 인접한 두 노드를 함께 고르지 않는 부분집합의 최대 가중치 합.
 *
 * 노드마다 값 두 개(`dp0` 안 고른다 · `dp1` 고른다)를 두고, 너비 우선으로 정한 방문
 * 순서를 **뒤에서부터** 읽어 자식의 값을 부모에 더한다. 순서를 뒤집으면 자식이 부모보다
 * 먼저 오므로, 부모를 처리할 때 자식의 두 값이 이미 확정돼 있다.
 */
export function treeMaxIndependentSet(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
  // 이웃 목록 — 무방향이라 간선 하나를 양쪽 노드의 목록에 넣는다.
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }

  // ① 자식을 하나도 안 더한 시점의 시작값.
  //    안 고르면 자기 가중치가 안 들어가고, 고르면 자기 가중치만 들어가 있다.
  const dp0 = new Array<number>(n).fill(0);
  const dp1 = [...weights];

  // 뿌리 0 에서 너비 우선으로 방문 순서와 부모를 정한다.
  const order = new Array<number>(n).fill(0);
  const parent = new Array<number>(n).fill(-1);
  let tail = 1;
  for (let head = 0; head < tail; head++) {
    const v = order[head] as number;
    for (const u of adj[v] as number[]) {
      // ② 부모 쪽 간선은 건너뛴다 — 그쪽은 이미 지나온 자리다.
      if (u === parent[v]) continue;
      parent[u] = v;
      // ③ 자식을 순서 배열의 뒤에 붙인다.
      order[tail] = u;
      tail++;
    }
  }

  // 순서를 뒤에서부터 읽으면 자식이 부모보다 먼저 온다.
  for (let k = n - 1; k >= 1; k--) {
    const v = order[k] as number;
    const p = parent[v] as number;
    // ④ 부모를 안 고르면 자식은 두 값 중 큰 쪽을 쓴다.
    dp0[p] = (dp0[p] as number) + Math.max(dp0[v] as number, dp1[v] as number);
    // ⑤ 부모를 고르면 자식은 안 고르는 값만 쓸 수 있다.
    dp1[p] = (dp1[p] as number) + (dp0[v] as number);
  }

  // ⑥ 빈 집합도 독립집합이라 dp0[0] 이 0 아래로 안 내려간다.
  return Math.max(dp0[0] as number, dp1[0] as number);
}
