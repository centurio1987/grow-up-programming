/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `stronglyConnectedComponents.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다.
 * 가이드가 싣는 코드와 사이드카(`.proof.ts` · `.alt.ts` · `.test.ts`)가 함께 부르는 구현은
 * 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑧ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 `V ≤ 10^5` 인데 정점 10 만 개짜리 사슬을 재귀로 내려가면
 * 자바스크립트 호출 스택이 먼저 끝난다. 그래서 호출 스택을 배열 둘로 직접 들고 있다.
 */

export function stronglyConnectedComponents(
  n: number,
  edges: [number, number][],
): number[][] {
  // ① 이웃 목록 — 간선 목록을 꼬리 정점별로 모은다. 방향 그래프라 한쪽으로만 넣는다.
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);

  // ② 정점마다 적는 칸 — 발견 시각 `disc`, 되돌아갈 수 있는 가장 작은 발견 시각 `low`,
  // 그리고 아직 무리가 안 정해진 채 `stack` 에 남아 있는지를 적는 `onStack`.
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const onStack: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const sccs: number[][] = [];
  let timer = 0;

  // ③ 호출 스택 — `callV` 가 지금 보고 있는 정점, `callI` 가 그 정점의 이웃 목록에서
  // 다음에 읽을 자리다. 정점에 처음 들어갈 때 하는 일은 어디서 들어오든 같아서 한데 묶었다.
  const callV: number[] = [];
  const callI: number[] = [];
  const enter = (v: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    stack.push(v);
    onStack[v] = true;
    callV.push(v);
    callI.push(0);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    enter(root);

    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];

      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        if (disc[w] === -1) {
          // ④ 처음 보는 이웃 — 그 정점으로 내려간다.
          enter(w);
        } else if (onStack[w]) {
          // ⑤ 아직 무리가 안 정해진 정점 — 그 정점의 발견 시각까지 되돌아갈 수 있다.
          low[v] = Math.min(low[v] as number, disc[w] as number);
        } else {
          // ⑥ 무리가 이미 정해진 정점 — 되돌아오는 길이 없으므로 아무것도 하지 않는다.
        }
        continue;
      }

      // ⑦ 이웃을 다 본 정점 — 호출 스택에서 빼고, 되돌아가는 값을 부모에게 전달한다.
      callV.pop();
      callI.pop();
      const parent = callV[callV.length - 1];
      if (parent !== undefined) {
        low[parent] = Math.min(low[parent] as number, low[v] as number);
      }

      if (low[v] === disc[v]) {
        // ⑧ 무리의 뿌리 — 스택에서 이 정점이 나올 때까지 빼내 한 무리로 묶는다.
        const group: number[] = [];
        while (true) {
          const w = stack.pop() as number;
          onStack[w] = false;
          group.push(w);
          if (w === v) break;
        }
        group.sort((a, b) => a - b);
        sccs.push(group);
      }
    }
  }

  return sccs.sort((a, b) => (a[0] as number) - (b[0] as number));
}
