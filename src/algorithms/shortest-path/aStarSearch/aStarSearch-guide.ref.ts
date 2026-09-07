/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/shortest-path/aStarSearch/aStarSearch.ts` 와 **같은 절차**다 — 간선
 * 목록을 이웃 목록으로 바꾸고, 시작 정점을 우선순위 큐에 넣은 뒤 **키가 가장 작은 항목을
 * 꺼내며** 비용 배열을 고쳐 적는다. 다익스트라와 갈리는 자리는 큐에 넣는 키 하나다 — 지금까지
 * 쓴 비용에 남은 비용의 추정값을 더한 값을 키로 쓴다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * 원본과 다른 자리는 셋이다.
 *
 * 1. 원본은 학습자 스텁이라 본문이 없다. 이 파일이 그 자리를 채운다.
 * 2. 큐 항목이 정점 번호 하나가 아니라 **셋**이다 — 정점 · 넣을 때의 비용 · 키. 넣을 때의
 *    비용을 함께 싣지 않으면 꺼낸 항목이 뒤처진 기록인지 판정할 때 추정 함수를 한 번 더
 *    불러야 한다.
 * 3. 완화한 값에 `ng` 라는 이름을 붙여 한 줄로 적는다. 이름을 세워야 「어느 줄이 불변식을
 *    지키는가」를 한 줄로 가리킬 수 있다.
 *
 * **계수를 세거나 힙 내부를 들여다보는 자리는 여기 두지 않는다.** 그런 사본은
 * `aStarSearch-guide.proof.ts` 가 따로 갖는다 — 이 파일은 가이드가 싣는 코드와 글자 그대로
 * 같아야 한다.
 */

/** 간선 하나 — `[u, v, w]` 는 가중치 `w` 인 방향 간선 `u → v` 다. */
export type Edge = [number, number, number];

/**
 * 가중치가 음수가 아닌 방향 그래프에서 `src` 로부터 `goal` 까지의 최소 비용.
 *
 * `h(v)` 는 `v` 에서 `goal` 까지 남은 비용의 추정값이고 실제 최소 비용을 넘지 않는다고
 * 가정한다. 도달할 수 없으면 `Infinity` 이고 `src === goal` 이면 `0` 이다.
 */
export function aStarSearch(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
): number {
  // ① 시작값 — 아직 아무 경로도 못 찾았으므로 전부 `Infinity` 이고 시작 정점만 `0` 이다.
  const g: number[] = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  g[src] = 0;
  const open = new MinHeap();
  open.push(src, 0, h(src));

  // ② 큐에 남은 항목이 있는가 — 없으면 목표까지 이어지는 경로가 없다.
  while (open.size() > 0) {
    const [u, gu] = open.pop() as [number, number, number];

    // ③ 목표를 꺼냈는가 — 처음 꺼내는 그 순간의 비용이 곧 답이다.
    if (u === goal) return gu;

    // ④ 뒤처진 기록인가 — 넣을 때의 비용이 지금 적힌 값보다 크면 그 항목은 버린다.
    if (gu > (g[u] as number)) continue;

    for (const [v, w] of adj[u] as [number, number][]) {
      const ng = gu + w;
      // ⑤ 완화 — 지금 적힌 값보다 작을 때만 고쳐 적고 `ng + h(v)` 를 키로 넣는다.
      if (ng < (g[v] as number)) {
        g[v] = ng;
        open.push(v, ng, ng + h(v));
      }
    }
  }

  return Number.POSITIVE_INFINITY;
}

/**
 * 키가 가장 작은 항목을 먼저 내주는 이진 힙.
 *
 * 배열 하나로 완전 이진 트리를 담는다 — 자리 `i` 의 두 자식은 `2i+1`·`2i+2` 이고 부모는
 * `(i-1)/2` 의 몫이다. 넣을 때는 마지막 자리에 두고 부모보다 작은 동안 올리고, 꺼낼 때는
 * 뿌리를 마지막 항목으로 덮은 뒤 자식 중 작은 쪽과 견주며 내린다. 한 항목은 정점 번호 ·
 * 넣을 때의 비용 · 키 셋으로 이루어진다.
 */
class MinHeap {
  private items: [number, number, number][] = [];

  size(): number {
    return this.items.length;
  }

  push(node: number, cost: number, key: number): void {
    this.items.push([node, cost, key]);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.key(i) >= this.key(parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): [number, number, number] | undefined {
    const top = this.items[0];
    const last = this.items.pop();
    if (top === undefined || last === undefined) return undefined;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < this.items.length && this.key(left) < this.key(small)) {
          small = left;
        }
        if (right < this.items.length && this.key(right) < this.key(small)) {
          small = right;
        }
        if (small === i) break;
        this.swap(i, small);
        i = small;
      }
    }
    return top;
  }

  private key(i: number): number {
    return (this.items[i] as [number, number, number])[2];
  }

  private swap(a: number, b: number): void {
    const t = this.items[a] as [number, number, number];
    this.items[a] = this.items[b] as [number, number, number];
    this.items[b] = t;
  }
}
