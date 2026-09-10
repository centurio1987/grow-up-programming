/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/dfsAllPaths/dfsAllPaths.ts` 는 학습자 스텁이라 본문에 실을 수
 * 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 간선 목록을
 * 이웃 목록으로 바꾸면서 자기 루프를 빼고 같은 이웃을 한 번만 담은 뒤, 번호 오름차순으로
 * 정렬하고, 재귀 한 겹마다 표시를 켜고 되돌아가는 자리에서 그 표시를 지운다.
 *
 * **재귀를 쓴다.** 형제 편 `dfsTraversal` 은 정점 100,000 개가 한 줄로 이어질 수 있어 반복문
 * 으로 옮겼지만, 여기서는 한 경로가 같은 정점을 두 번 담지 못하므로 호출 깊이가 정점 수를
 * 넘지 못하고 그 정점 수의 상한이 1,000 이다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - `onPath[u] = false;` 를 지우면 표시가 남아 다음 경로가 만들어지지 않는다.
 * - `path.slice()` 를 `path` 로 바꾸면 결과가 전부 같은 배열을 가리킨다.
 * - `sets.map(...)` 의 정렬을 지우면 결과의 사전식 순서가 어긋난다.
 */

/**
 * 방향 그래프에서 `source` 부터 `target` 까지 같은 정점을 두 번 담지 않는 **모든 단순 경로**.
 * 경로들은 사전식 순서로 나오고, 경로가 하나도 없으면 빈 배열이다.
 */
export function dfsAllPaths(
  n: number,
  edges: [number, number][],
  source: number,
  target: number,
): number[][] {
  // 자기 루프는 단순 경로에 쓸 수 없고, 같은 이웃이 여러 번 있어도 정점 나열은 하나다.
  const sets: Set<number>[] = Array.from(
    { length: n },
    () => new Set<number>(),
  );
  for (const [u, v] of edges) {
    if (u === v) continue;
    (sets[u] as Set<number>).add(v);
  }

  // 이웃을 번호 오름차순으로 둔다. 이 순서가 그대로 결과의 사전식 순서가 된다.
  const adj: number[][] = sets.map((s) => [...s].sort((a, b) => a - b));

  // `onPath[v]` 는 정점 `v` 가 **지금 만들고 있는 경로 안에** 있는가다.
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];

  const walk = (u: number): void => {
    // 진입 — 표시를 켜고 경로 끝에 붙인다.
    onPath[u] = true;
    path.push(u);

    if (u === target) {
      // ① 도착 정점이다 — 지금 경로를 복사해 담고 여기서 더 내려가지 않는다.
      result.push(path.slice());
    } else {
      for (const v of adj[u] as number[]) {
        // ② 지금 경로 안에 있는 정점이다 — 다시 담으면 단순 경로가 아니다.
        if (onPath[v] === true) continue;

        // ③ 아직 경로에 없는 정점이다 — 한 칸 내려간다.
        walk(v);
      }
    }

    // 되돌아가는 자리 — 켠 표시를 지우고 경로 끝에서 뺀다. 진입과 정확히 짝을 이룬다.
    onPath[u] = false;
    path.pop();
  };

  walk(source);
  return result;
}
