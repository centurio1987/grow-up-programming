/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor.ts` 는 학습자 스텁이라
 * 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 —
 * 뿌리에서 한 번 따라가 깊이와 부모를 정하고, `2^k` 칸 위 조상 표를 만들고, 질의마다 깊이를
 * 맞춘 뒤 두 정점을 함께 올린다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. 스택 배열 하나로 옮기면
 * 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 깊이를 맞춘 뒤의 `u === v` 검사를 지우면 조상·자손 질의에서 답의 부모가 나온다.
 * - 단계 2 의 `k` 를 큰 쪽에서 작은 쪽으로 내려가지 않고 반대로 적으면 답보다 아래 정점이 남는다.
 * - `LOG` 를 상수로 크게 잡으면 답은 그대로이고 표만 커진다.
 */

/**
 * 정점 `n` 개짜리 트리와 뿌리, 그리고 정점 쌍 목록을 받아 쌍마다 최소 공통 조상을 돌려준다.
 * 정점은 자기 자신의 조상이기도 하므로 `u` 가 `v` 의 조상이면 답은 `u` 다.
 */
export function lowestCommonAncestor(
  n: number,
  edges: [number, number][],
  root: number,
  queries: [number, number][],
): number[] {
  // 표의 열 수. 가장 먼 조상이 `n - 1` 칸 위이므로 `2^(LOG-1)` 이 그 값을 덮으면 된다.
  const LOG = Math.floor(Math.log2(Math.max(n, 1))) + 1;

  // 간선 목록을 정점마다의 이웃 목록으로 옮긴다. 무방향이라 양쪽에 넣는다.
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }

  // 없는 조상은 뿌리 자신으로 둔다. 표를 만들 때도 질의할 때도 범위를 벗어나지 않는다.
  const depth: number[] = Array.from({ length: n }, () => 0);
  const anc: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: LOG }, () => root),
  );

  // 뿌리에서 한 번 따라가며 깊이와 부모를 정한다.
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const v of near[u] as number[]) {
      // ① 이미 지나온 정점은 자식이 아니다. 이웃 목록이 양방향이라 부모가 거기 들어 있다.
      if (seen[v]) continue;
      seen[v] = true;
      depth[v] = (depth[u] as number) + 1;
      (anc[v] as number[])[0] = u;
      stack.push(v);
    }
  }

  // ② `2^k` 칸 위 조상은 `2^(k-1)` 칸 위 조상의 `2^(k-1)` 칸 위 조상이다.
  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) {
      const mid = (anc[v] as number[])[k - 1] as number;
      (anc[v] as number[])[k] = (anc[mid] as number[])[k - 1] as number;
    }
  }

  /** 정점 둘의 최소 공통 조상. */
  function lca(a: number, b: number): number {
    let u = a;
    let v = b;
    if ((depth[u] as number) < (depth[v] as number)) {
      const swap = u;
      u = v;
      v = swap;
    }

    // ③ 깊이 차이를 이진수로 쪼개 켜진 자리만큼 깊은 쪽을 올린다.
    const gap = (depth[u] as number) - (depth[v] as number);
    for (let k = 0; k < LOG; k++) {
      if (((gap >> k) & 1) === 1) u = (anc[u] as number[])[k] as number;
    }
    // ④ 깊이를 맞춘 자리에서 둘이 같으면 한쪽이 다른 쪽의 조상이었다.
    if (u === v) return u;

    // ⑤ 두 조상이 갈라지는 자리에서만 둘을 함께 올린다. 큰 `k` 에서 작은 `k` 로 내려간다.
    for (let k = LOG - 1; k >= 0; k--) {
      const up = (anc[u] as number[])[k] as number;
      const vp = (anc[v] as number[])[k] as number;
      if (up !== vp) {
        u = up;
        v = vp;
      }
    }
    return (anc[u] as number[])[0] as number;
  }

  return queries.map(([u, v]) => lca(u, v));
}
