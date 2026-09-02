/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph-flow/isBipartite/isBipartite.ts` 는 학습자 스텁이라 본문에 실을
 * 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 정점마다
 * 「어느 쪽인가」를 두 값 중 하나로 적고, 정점 하나를 꺼낼 때 이웃의 쪽을 자기 쪽과 견준다.
 * 쪽이 같은 이웃이 하나라도 나오면 그 간선의 두 끝이 한 쪽에 함께 들어가므로 `false` 다.
 *
 * **표시가 두 값이라 지나온 이웃을 따로 기억하지 않는다.** 어떤 정점을 표시하게 한 이웃은
 * 정의상 반대쪽이라 ② 가 이미 넘어간다. 방문 여부만 적는 절차(무향 사이클 탐지)가 지나온
 * 이웃 하나를 건너뛰려고 배열을 하나 더 드는 것과 갈리는 자리다.
 *
 * **쪽은 스택에 넣을 때 적는다.** 꺼낼 때 적으면 같은 정점이 스택에 여러 번 들어가고,
 * 그때 「정점 하나가 정확히 한 번 꺼내진다」가 성립하지 않아 비용 식이 서지 않는다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - `const other = 1 - su;` 를 `const other = su;` 로 바꾸면 이웃에 같은 쪽을 적는다.
 *   간선 하나짜리 그래프가 `false` 가 된다.
 * - `side[s] = FIRST_SIDE;` 를 `side[s] = 1 - FIRST_SIDE;` 로 바꾸면 덩어리마다 반대쪽에서
 *   시작한다. 쪽 배열이 전부 뒤집히는데 반환값은 어느 입력에서도 그대로다.
 */

/** 아직 어느 쪽도 정하지 않은 정점. 쪽은 0 과 1 두 값이라 음수를 쓴다. */
const NO_SIDE = -1;

/** 덩어리의 첫 정점에 적는 쪽. 0 과 1 중 어느 것을 골라도 반환값이 같다. */
const FIRST_SIDE = 0;

/**
 * 무향 그래프가 이분 그래프이면 `true`, 아니면 `false` 를 돌려준다.
 * 간선이 없는 고립 정점은 어느 쪽에 넣어도 되고, 자기 자신을 잇는 간선 `[v, v]` 는
 * 두 끝이 같은 정점이라 어떤 나눔으로도 갈라지지 않는다.
 */
export function isBipartite(n: number, edges: [number, number][]): boolean {
  // 무향 간선 하나는 양쪽에서 걸어갈 수 있다. 두 목록에 한 번씩 넣는다.
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }

  const side: number[] = Array.from({ length: n }, () => NO_SIDE);
  const stack: number[] = [];

  for (let s = 0; s < n; s++) {
    if (side[s] !== NO_SIDE) continue;
    side[s] = FIRST_SIDE;
    stack.push(s);

    while (stack.length > 0) {
      const u = stack.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;

      for (const v of nbr[u] as number[]) {
        // ① 쪽이 같다. 이 간선의 두 끝이 한 쪽에 함께 들어가므로 이분이 아니다.
        if (side[v] === su) return false;

        // ② 이미 반대쪽이다. 이 간선의 두 끝이 서로 다른 쪽에 있으므로 넘어간다.
        if (side[v] !== NO_SIDE) continue;

        // ③ 아직 쪽이 없다. 반대쪽을 적고 스택에 넣는다.
        side[v] = other;
        stack.push(v);
      }
    }
  }

  return true;
}
