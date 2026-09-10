/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `bridgesInGraph.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 `V <= 10^5` 라 정점 10 만 개짜리 사슬이 들어올 수 있는데,
 * 재귀로 내려가면 자바스크립트 호출 스택이 먼저 한계에 이른다. 그래서 호출 스택에 해당하는
 * 것을 배열 셋으로 직접 만든다.
 *
 * **내려올 때 쓴 간선을 정점 번호가 아니라 간선 번호로 가린다.** 같은 두 정점을 잇는 간선이
 * 둘일 때 정점 번호로 가리면 둘째 간선까지 함께 가려져, 다리가 아닌 간선이 다리로 적힌다.
 */

export function bridgesInGraph(
  n: number,
  edges: [number, number][],
): [number, number][] {
  // ① 이웃 자리 — 방향이 없으니 간선 하나를 두 정점에 나눠 담고, 쓴 번호를 나란히 적어 둔다.
  const to: number[][] = Array.from({ length: n }, () => []);
  const via: number[][] = Array.from({ length: n }, () => []);
  for (let e = 0; e < edges.length; e++) {
    const [u, v] = edges[e] as [number, number];
    (to[u] as number[]).push(v);
    (via[u] as number[]).push(e);
    (to[v] as number[]).push(u);
    (via[v] as number[]).push(e);
  }

  // ② 정점마다의 두 칸 — 들어간 차례 `disc`, 거슬러 오를 수 있는 가장 위 차례 `low`.
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const found: [number, number][] = [];
  let timer = 0;

  // ③ 재귀를 대신하는 배열 셋 — `stackV` 는 머물러 있는 정점, `stackI` 는 그 정점에서 다음에
  // 볼 이웃 자리, `stackE` 는 거기로 내려올 때 탄 간선 번호다. 탐색을 시작한 정점은 `-1` 이다.
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
          // ④ 방금 타고 내려온 그 간선이다. 위로 오르는 길이 아니므로 그냥 넘어간다.
          continue;
        }
        if (disc[w] === -1) {
          // ⑤ 아직 안 들어간 이웃이다. 이 간선이 나무에 들어가고 탐색이 그리로 내려간다.
          enter(w, e);
        } else {
          // ⑥ 이미 들어간 정점이다. 나무에 못 든 간선이라 그 정점의 차례까지 오를 수 있다.
          low[v] = Math.min(low[v] as number, disc[w] as number);
        }
        continue;
      }

      // ⑦ 이웃 자리를 다 쓴 정점이다. 배열 셋에서 내리고 자기 `low` 를 부모 칸에 합친다.
      stackV.pop();
      stackI.pop();
      const edge = stackE.pop() as number;
      if (edge !== -1) {
        const p = stackV[stackV.length - 1] as number;
        low[p] = Math.min(low[p] as number, low[v] as number);
        // ⑧ 자식 쪽이 부모 위로 못 오르면 방금 타고 온 나무 간선이 다리다.
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
