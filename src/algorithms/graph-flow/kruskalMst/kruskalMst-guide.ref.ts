/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph-flow/kruskalMst/kruskalMst.ts` 는 학습자 스텁이라 본문에 실을
 * 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 간선을
 * 가중치 오름차순으로 놓고 하나씩 보면서, 두 끝점이 서로 다른 덩어리에 있을 때만 고른다.
 *
 * **입력 배열을 정렬하지 않는다.** 학습자 스텁은 `edges.sort(...)` 로 인자를 그 자리에서
 * 정렬해 호출한 쪽의 배열 순서를 바꿔 놓는다. 같은 목록을 다른 알고리즘에도 넘기는 자리에서
 * 그 부작용이 답을 바꾸므로 사본을 만들어 정렬한다 — `.test.ts` 가 그것을 건다.
 *
 * **`find` 를 반복문으로 적었다.** 재귀로 적으면 호출 깊이가 대표 트리의 높이가 되는데,
 * 높이를 낮게 유지하는 것이 이 절차가 하는 일 중 하나라 그 성질에 코드의 안전성을 기대는
 * 모양이 된다. 두 바퀴로 나누면 뿌리를 먼저 찾고(첫 바퀴) 지나온 정점을 그 뿌리에 바로
 * 붙이는 것(둘째 바퀴)이 각각 눈에 보이기도 한다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 대표가 같을 때 건너뛰는 줄을 지우면 사이클을 만드는 간선까지 골라 합계가 달라진다.
 * - 정렬 호출만 지우면 입력에 적힌 순서 그대로 보게 되어 가벼운 간선 우선이 없어진다.
 * - 마지막 줄의 삼항식을 합계로 바꾸면 연결되지 않은 그래프에 부분 합계를 답한다.
 */

/**
 * 정점 `n` 개와 무방향 가중치 간선 목록을 받아 최소 신장 트리의 가중치 합을 돌려준다.
 * 모든 정점을 잇는 트리를 만들 수 없으면 `-1` 이다. 정점이 하나뿐이면 간선 없이 `0` 이다.
 */
export function kruskalMst(
  n: number,
  edges: [number, number, number][],
): number {
  // 가중치 오름차순 사본. 인자로 받은 배열은 건드리지 않는다.
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);

  // 정점마다 자기 덩어리의 대표를 가리킨다. 처음에는 저마다 혼자다.
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  // 대표가 이끄는 덩어리의 높이 상한. 붙이는 방향을 정하는 데만 쓴다.
  const rank: number[] = Array.from({ length: n }, () => 0);

  let total = 0;
  let picked = 0;

  for (const [u, v, w] of sorted) {
    const ru = find(u, parent);
    const rv = find(v, parent);

    // ② 두 끝점의 대표가 같으면 이미 이어져 있다. 이 간선은 사이클을 만들므로 건너뛴다.
    if (ru === rv) continue;

    // ① 대표가 다르면 두 덩어리를 하나로 합치고 이 간선을 고른다.
    if ((rank[ru] as number) > (rank[rv] as number)) {
      // ③ 높이가 다르면 낮은 쪽을 높은 쪽에 붙인다. 전체 높이가 그대로다.
      parent[rv] = ru;
    } else {
      parent[ru] = rv;
      // ④ 높이가 같을 때만 한쪽이 하나 자란다.
      if (rank[ru] === rank[rv]) rank[rv] = (rank[rv] as number) + 1;
    }
    total += w;
    picked++;

    // ⑤ 고른 간선이 n-1 개가 되면 남은 간선은 볼 필요가 없다.
    if (picked === n - 1) return total;
  }

  // ⑥ 간선을 다 보고도 n-1 개를 못 채웠으면 모든 정점을 잇는 트리가 없다.
  return picked === n - 1 ? total : -1;
}

/**
 * `x` 가 속한 덩어리의 대표를 돌려준다. 돌려주면서 `x` 부터 대표까지의 정점을 전부 대표에
 * 바로 붙인다 — 다음에 같은 자리를 물으면 한 칸만 읽는다.
 */
function find(x: number, parent: number[]): number {
  let root = x;
  while (parent[root] !== root) root = parent[root] as number;

  let cur = x;
  while (parent[cur] !== root) {
    const next = parent[cur] as number;
    parent[cur] = root;
    cur = next;
  }
  return root;
}
