/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `treeIsomorphism.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는
 * 코드와 사이드카(`.proof.ts` · `.test.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑨ 는 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 제약이 `N <= 10^5` 라 정점 10 만 개짜리 사슬이 들어올 수 있는데,
 * 재귀로 내려가면 자바스크립트 호출 스택이 먼저 한계에 이른다. 그래서 뿌리에서 시작하는
 * 방문 차례를 배열 하나에 적어 두고 그 배열을 거꾸로 읽는다.
 *
 * **번호표를 두 트리가 함께 쓴다.** 트리마다 표를 따로 두면 같은 번호가 서로 다른 모양을
 * 가리키게 되어 번호끼리의 견주기가 뜻을 잃는다.
 *
 * **뿌리는 중심에서만 고른다.** 중심이 둘이면 둘 다 뿌리로 삼아 번호를 내고, 한쪽 트리의
 * 번호 가운데 다른 쪽 트리의 번호와 같은 것이 하나라도 있으면 동형이다.
 */

export type Edge = [number, number];

export function neighbors(n: number, edges: Edge[]): number[][] {
  // ① 무방향 간선 하나를 두 정점에 나눠 담는다. 간선 하나가 이웃 자리 둘을 만든다.
  const link: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (link[u] as number[]).push(v);
    (link[v] as number[]).push(u);
  }
  return link;
}

export function centers(n: number, link: number[][]): number[] {
  // ② 잎을 한 겹씩 벗긴다. 정점이 둘 이하로 줄면 그때 남은 것이 중심이다.
  if (n === 1) return [0];
  const left: number[] = link.map((row) => row.length);
  let layer: number[] = [];
  for (let v = 0; v < n; v++) if (left[v] === 1) layer.push(v);
  let alive = n;
  while (alive > 2) {
    const next: number[] = [];
    for (const v of layer) {
      left[v] = 0;
      alive--;
      for (const w of link[v] as number[]) {
        if ((left[w] as number) > 0) {
          left[w] = (left[w] as number) - 1;
          if (left[w] === 1) next.push(w);
        }
      }
    }
    layer = next;
  }
  return layer;
}

export function shapeCode(
  n: number,
  link: number[][],
  root: number,
  table: Map<string, number>,
): number {
  // ③ 뿌리에서 시작하는 방문 차례를 배열에 적는다. 부모를 함께 적어 되돌아가지 않는다.
  const parent: number[] = Array.from({ length: n }, () => -1);
  const order: number[] = [root];
  for (let i = 0; i < order.length; i++) {
    const v = order[i] as number;
    for (const w of link[v] as number[]) {
      if (w !== parent[v]) {
        parent[w] = v;
        order.push(w);
      }
    }
  }

  // ④ 그 배열을 거꾸로 읽으면 자식이 부모보다 항상 먼저 온다.
  const code: number[] = Array.from({ length: n }, () => -1);
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i] as number;
    const kids: number[] = [];
    for (const w of link[v] as number[]) {
      if (w !== parent[v]) kids.push(code[w] as number);
    }

    // ⑤ 자식 번호를 오름차순으로 세운다. 자식이 적힌 차례는 모양이 아니라 입력의 차례다.
    kids.sort((a, b) => a - b);

    // ⑥ 같은 자식 번호 목록에는 같은 번호를 준다. 처음 보는 목록이면 다음 번호를 새로 준다.
    const key = kids.join(",");
    let id = table.get(key);
    if (id === undefined) {
      id = table.size;
      table.set(key, id);
    }
    code[v] = id;
  }
  return code[root] as number;
}

export function treeIsomorphism(
  n: number,
  edges1: Edge[],
  edges2: Edge[],
): boolean {
  const link1 = neighbors(n, edges1);
  const link2 = neighbors(n, edges2);
  const root1 = centers(n, link1);
  const root2 = centers(n, link2);

  // ⑦ 중심 개수가 다르면 그 자리에서 비동형이다. 동형이면 중심이 중심으로 옮겨 가야 한다.
  if (root1.length !== root2.length) return false;

  // ⑧ 번호표 하나를 두 트리가 함께 쓴다.
  const table = new Map<string, number>();
  const code2 = root2.map((r) => shapeCode(n, link2, r, table));

  for (const r of root1) {
    // ⑨ 한쪽 중심의 번호가 다른 쪽 중심의 번호와 하나라도 같으면 동형이다.
    if (code2.includes(shapeCode(n, link1, r, table))) return true;
  }
  return false;
}
