/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection.ts` 는 학습자
 * 스텁이라 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로**
 * 같은 절차다 — 간선 하나를 양쪽 이웃 목록에 한 번씩 넣고, 정점을 하나 꺼낼 때 **그 정점을
 * 표시하게 한 이웃 하나만 건너뛰고** 나머지 이웃을 확인한다. 이미 표시된 정점이 나오면
 * 그 정점까지 가는 길이 하나 더 있다는 뜻이라 사이클이다.
 *
 * **표시는 스택에 넣을 때 한다.** 꺼낼 때 표시하면 같은 정점이 스택에 두 번 들어갈 수 있고,
 * 그러면 「표시된 정점 수 = 스택에 넣은 횟수」가 성립하지 않는다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - `if (v === parent) continue;` 를 지우면 무향 간선을 되돌아가는 것까지 사이클로 읽는다.
 *   간선 하나짜리 그래프가 `true` 가 된다.
 * - `(nbr[v] as number[]).push(u);` 를 지우면 간선을 한쪽 목록에만 넣는다. 적힌 방향으로만
 *   갈 수 있게 되어 사이클을 지나쳐 버린다.
 */

/** 시작 정점에는 들어온 이웃이 없다. 정점 번호가 0 부터라 음수를 쓴다. */
const NO_PARENT = -1;

/**
 * 무향 그래프에 사이클이 있으면 `true`, 없으면 `false` 를 돌려준다.
 * 자기 자신을 잇는 간선 `[v, v]` 와 같은 정점 쌍을 두 번 잇는 간선도 사이클로 본다.
 */
export function undirectedCycleDetection(
  n: number,
  edges: [number, number][],
): boolean {
  // 무향 간선 하나는 양쪽에서 걸어갈 수 있다. 두 목록에 한 번씩 넣는다.
  const nbr: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }

  const visited: boolean[] = Array.from({ length: n }, () => false);
  // stack 과 from 은 같은 자리끼리 짝이다. from[i] 는 stack[i] 를 표시하게 한 이웃이다.
  const stack: number[] = [];
  const from: number[] = [];

  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    visited[s] = true;
    stack.push(s);
    from.push(NO_PARENT);

    while (stack.length > 0) {
      const u = stack.pop() as number;
      const parent = from.pop() as number;

      for (const v of nbr[u] as number[]) {
        // ① 지나온 이웃이다. 무향 간선은 양쪽 목록에 있어 되돌아가는 것이 사이클이 아니다.
        if (v === parent) continue;

        // ② 이미 표시된 정점이다. 그 정점까지 가는 길이 하나 더 있다는 뜻이라 사이클이다.
        if (visited[v]) return true;

        // ③ 처음 보는 정점이다. 표시하고 스택에 넣는다.
        visited[v] = true;
        stack.push(v);
        from.push(u);
      }
    }
  }

  return false;
}
