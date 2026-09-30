/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `bridgesInGraph.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 규모의 상한이 `V ≤ 10^5` 인데 정점 10 만 개짜리 사슬을 재귀로 내려가면
 * 자바스크립트 호출 스택이 먼저 한계에 이른다. 그래서 호출 스택을 배열 셋으로 직접 들고 있다.
 *
 * **내려온 간선을 정점 번호가 아니라 간선 번호로 건너뛴다.** 같은 두 정점을 잇는 간선이 둘일 때
 * 정점 번호로 건너뛰면 둘째 간선까지 함께 건너뛰어져, 다리가 아닌 간선이 다리로 적힌다.
 */

export function bridgesInGraph(
  n: number,
  edges: [number, number][],
): [number, number][] {
  // ① 이웃 목록 — 무향 간선이라 간선 하나를 두 끝의 목록에 넣고, 그 간선의 번호를 같은 자리에 적는다.
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  for (let e = 0; e < edges.length; e++) {
    const [u, v] = edges[e] as [number, number];
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(e);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(e);
  }

  // ② 정점마다 적는 칸 — 발견 순서 `disc`, 부분트리가 되돌아가는 간선으로 이르는 가장 이른
  // 발견 순서 `low`, 그리고 찾은 다리를 모을 `found`.
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const found: [number, number][] = [];
  let timer = 0;

  // ③ 호출 스택 — `stackV` 가 지금 보고 있는 정점, `stackI` 가 그 정점의 이웃 목록에서 다음에
  // 읽을 자리, `stackE` 가 그 정점으로 내려올 때 탄 간선 번호다. 뿌리의 칸에는 `-1` 을 넣는다.
  const stackV: number[] = [];
  const stackI: number[] = [];
  const stackE: number[] = [];
  const enter = (v: number, edge: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    stackV.push(v);
    stackI.push(0);
    stackE.push(edge);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    enter(root, -1);

    while (stackV.length > 0) {
      const v = stackV[stackV.length - 1] as number;
      const i = stackI[stackI.length - 1] as number;
      const nbrs = to[v] as number[];

      if (i < nbrs.length) {
        stackI[stackI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        const e = (via[v] as number[])[i] as number;
        if (e === (stackE[stackE.length - 1] as number)) {
          // ④ 내려온 간선 — 방금 타고 내려온 간선을 거꾸로 본 것이라 건너뛴다.
          continue;
        }
        if (disc[w] === -1) {
          // ⑤ 처음 보는 이웃 — 나무 간선이다. 그 정점으로 내려간다.
          enter(w, e);
        } else {
          // ⑥ 이미 들어갔던 정점 — 조상이면 그 발견 순서까지 되돌아갈 수 있다.
          low[v] = Math.min(low[v] as number, disc[w] as number);
        }
        continue;
      }

      // ⑦ 이웃을 다 본 정점 — 호출 스택에서 빼고, 자기 `low` 를 부모에게 넘긴다.
      stackV.pop();
      stackI.pop();
      const edge = stackE.pop() as number;
      if (edge !== -1) {
        const p = stackV[stackV.length - 1] as number;
        low[p] = Math.min(low[p] as number, low[v] as number);
        // ⑧ 내려온 나무 간선의 판정 — 자식의 부분트리가 부모에도 그 위에도 못 가면 다리다.
        if ((low[v] as number) > (disc[p] as number)) {
          found.push(p < v ? [p, v] : [v, p]);
        }
      }
    }
  }

  // ⑨ 답의 차례를 맞춘다. 앞 번호로 세우고 같으면 뒤 번호로 세운다.
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return found;
}
