/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `articulationPoints.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 `V ≤ 10^5` 인데 정점 10 만 개짜리 사슬을 재귀로 내려가면
 * 자바스크립트 호출 스택이 먼저 끝난다. 그래서 호출 스택을 배열 셋으로 직접 들고 있다.
 */

export function articulationPoints(
  n: number,
  edges: [number, number][],
): number[] {
  // ① 이웃 목록 — 무향 간선이라 양쪽 정점에 서로를 넣는다. 두 끝이 같은 간선은 담지 않는다.
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }

  // ② 정점마다 적는 칸 — 진입 시각 `disc`, 거슬러 도달하는 최소 진입 시각 `low`,
  // 그리고 단절점으로 판정됐는지를 적는 `cut`.
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const cut: boolean[] = Array.from({ length: n }, () => false);
  let timer = 0;

  // ③ 호출 스택 — `callV` 가 지금 보고 있는 정점, `callI` 가 그 정점의 이웃 목록에서 다음에
  // 읽을 자리, `callP` 가 그 정점의 부모다. 뿌리의 부모 자리에는 `-1` 을 넣는다.
  const callV: number[] = [];
  const callI: number[] = [];
  const callP: number[] = [];
  const enter = (v: number, parent: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    callV.push(v);
    callI.push(0);
    callP.push(parent);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    let rootKids = 0;
    enter(root, -1);

    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];

      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        if (disc[w] === -1) {
          // ④ 처음 보는 이웃 — 나무 간선이다. 그 정점으로 내려간다.
          if (v === root) rootKids++;
          enter(w, v);
        } else if (w !== (callP[callP.length - 1] as number)) {
          // ⑤ 이미 들어갔던 정점 — 되돌아가는 간선이다. 그 진입 시각까지 도달할 수 있다.
          low[v] = Math.min(low[v] as number, disc[w] as number);
        } else {
          // ⑥ 부모 방향 — 되돌아가는 간선이 아니므로 아무것도 하지 않는다.
        }
        continue;
      }

      // ⑦ 이웃을 다 본 정점 — 호출 스택에서 빼고, 자기 `low` 를 부모에게 전달한다.
      callV.pop();
      callI.pop();
      const parent = callP.pop() as number;
      if (parent !== -1) {
        low[parent] = Math.min(low[parent] as number, low[v] as number);
        // ⑧ 뿌리가 아닌 부모의 판정 — 자식이 부모 위로 못 가면 그 부모가 단절점이다.
        if (parent !== root && (low[v] as number) >= (disc[parent] as number)) {
          cut[parent] = true;
        }
      }
    }

    // ⑨ 뿌리의 판정 — 나무 자식이 둘 이상이면 뿌리가 단절점이다.
    if (rootKids >= 2) cut[root] = true;
  }

  const result: number[] = [];
  for (let v = 0; v < n; v++) if (cut[v]) result.push(v);
  return result;
}
