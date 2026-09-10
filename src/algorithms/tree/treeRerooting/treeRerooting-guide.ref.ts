/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/tree/treeRerooting/treeRerooting.ts` 는 학습자 스텁이라 본문에 실을 수
 * 없다. 가이드가 싣는 코드와 사이드카(`.proof.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일
 * 하나다.
 *
 * 원문자 라벨 ①~⑤ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. 실측으로 사슬 10,000 은
 * 통과하고 100,000 은 `RangeError` 를 던진다 — 그 경계는 실행마다 달라진다. 스택을 배열로
 * 옮기면 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 셋이
 * 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 답을 전파하는 반복문을 방문 순서의 뒤에서 앞으로 바꾸면 아직 안 정해진 부모의 값을 읽는다.
 * - `n - 2 * size[w]` 를 `n - size[w]` 로 바꾸면 가까워지는 정점을 빼지 않는다.
 * - `stack.pop()` 을 `stack.shift()` 로 바꾸면 방문 순서가 달라지고 **답은 그대로다.**
 */

export function treeRerooting(n: number, edges: [number, number][]): number[] {
  // ① 간선 목록을 정점마다의 이웃 목록으로 옮긴다. 무방향이라 양쪽에 넣는다.
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }

  const parent: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const size: number[] = Array.from({ length: n }, () => 1);

  // ② 기준 뿌리 0 에서 한 번 따라가며 방문 순서·부모·깊이를 정한다. 이미 지나온 정점은
  // 자식이 아니다 — 이웃 목록이 양방향이라 부모가 거기 들어 있다.
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [0];
  seen[0] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    for (const w of near[u] as number[]) {
      if (seen[w]) continue;
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
    }
  }

  // ③ 방문 순서의 뒤에서 앞으로 오면서 자식의 크기를 부모에 더한다. 자식이 언제나 부모보다
  // 뒤에 있으므로 부모 차례가 왔을 때 그 부분트리 크기가 이미 완성돼 있다.
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    size[p] = (size[p] as number) + (size[w] as number);
  }

  // ④ 기준 뿌리의 답은 깊이의 합이다. 뿌리에서 정점 v 까지의 거리가 곧 depth[v] 다.
  const answer: number[] = Array.from({ length: n }, () => 0);
  let atRoot = 0;
  for (let v = 0; v < n; v++) atRoot += depth[v] as number;
  answer[0] = atRoot;

  // ⑤ 방문 순서대로 부모의 답에서 자식의 답을 낸다. 자식 쪽 size[w] 개가 한 칸 가까워지고
  // 나머지 n - size[w] 개가 한 칸 멀어진다.
  for (let i = 1; i < order.length; i++) {
    const w = order[i] as number;
    const p = parent[w] as number;
    answer[w] = (answer[p] as number) + n - 2 * (size[w] as number);
  }

  return answer;
}
