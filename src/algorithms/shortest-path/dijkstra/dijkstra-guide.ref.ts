/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/shortest-path/dijkstra/dijkstra.ts` 와 **같은 절차**다 — 간선 목록을
 * 이웃 목록으로 바꾸고, 시작 정점을 우선순위 큐에 넣은 뒤 **키가 가장 작은 항목을 꺼내며**
 * 거리 배열을 고쳐 적는다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 *
 * 원본과 다른 자리는 셋이다.
 *
 * 1. 원본은 배열을 만들 때 `src` 칸만 `0` 으로 갈라 적는다. 여기서는 전부 `Infinity` 로
 *    만든 뒤 `dist[src]` 만 따로 적는다 — 시작값이 두 줄로 갈려야 전개 T1 이 그대로 옮겨진다.
 * 2. 원본의 `PriorityQueue` 는 빈 큐에서 `pop()` 이 `Error` 를 돌려주고 호출부가 그것을
 *    `instanceof` 로 가른다. 여기서는 `size()` 가 반복 조건을 지므로 그 갈래가 없다.
 * 3. 완화한 값에 `nd` 라는 이름을 붙여 한 줄로 적는다. 원본은 같은 식을 조건과 대입 두 곳에
 *    각각 쓴다 — 이름을 세워야 「어느 줄이 불변식을 지키는가」를 한 줄로 가리킬 수 있다.
 *
 * **계수를 세거나 힙 내부를 들여다보는 자리는 여기 두지 않는다.** 그런 사본은
 * `dijkstra-guide.proof.ts` 가 따로 갖는다 — 이 파일은 가이드가 싣는 코드와 글자 그대로
 * 같아야 한다.
 */

/** 간선 하나 — `[u, v, w]` 는 가중치 `w` 인 방향 간선 `u → v` 다. */
export type Edge = [number, number, number];

/**
 * 가중치가 음수가 아닌 방향 그래프에서 `src` 로부터 각 정점까지의 최소 비용.
 * 도달할 수 없는 정점은 `Infinity` 이고 `src` 자신은 `0` 이다.
 */
export function dijkstra(n: number, edges: Edge[], src: number): number[] {
  // ① 시작값 — 아직 아무 경로도 못 찾았으므로 전부 `Infinity` 이고 시작 정점만 `0` 이다.
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  dist[src] = 0;
  const pq = new MinHeap();
  pq.push(src, 0);

  // ② 큐에 남은 항목이 있는가 — 없으면 더 고칠 거리가 없다.
  while (pq.size() > 0) {
    const [u, d] = pq.pop() as [number, number];

    // ③ 뒤처진 기록인가 — 꺼낸 키가 지금 적힌 거리보다 크면 그 항목은 버린다.
    if (d > (dist[u] as number)) continue;

    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      // ④ 완화 — 지금 적힌 거리보다 작을 때만 고쳐 적고 큐에 넣는다.
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        pq.push(v, nd);
      }
    }
  }

  return dist;
}

/**
 * 키가 가장 작은 항목을 먼저 내주는 이진 힙.
 *
 * 배열 하나로 완전 이진 트리를 담는다 — 자리 `i` 의 두 자식은 `2i+1`·`2i+2` 이고 부모는
 * `(i-1)/2` 의 몫이다. 넣을 때는 마지막 자리에 두고 부모보다 작은 동안 올리고, 꺼낼 때는
 * 뿌리를 마지막 항목으로 덮은 뒤 자식 중 작은 쪽과 견주며 내린다.
 */
class MinHeap {
  private items: [number, number][] = [];

  size(): number {
    return this.items.length;
  }

  push(node: number, key: number): void {
    this.items.push([node, key]);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.key(i) >= this.key(parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): [number, number] | undefined {
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
    return (this.items[i] as [number, number])[1];
  }

  private swap(a: number, b: number): void {
    const t = this.items[a] as [number, number];
    this.items[a] = this.items[b] as [number, number];
    this.items[b] = t;
  }
}
