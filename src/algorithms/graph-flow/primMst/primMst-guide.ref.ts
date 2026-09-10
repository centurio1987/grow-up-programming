/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph-flow/primMst/primMst.ts` 는 학습자 스텁이라 본문에 실을 수 없다.
 * 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 정점 하나에서
 * 시작해, 트리 밖 정점 중 트리와 가장 가볍게 이어지는 것을 최소 힙에서 꺼내 하나씩 넣는다.
 *
 * **자기 루프와 평행 간선을 거르는 줄을 두지 않는다.** 자기 루프 `[v, v, w]` 는 `adj[v]` 에
 * 자기 자신을 두 번 적지만, `v` 가 트리에 든 뒤에야 그 목록을 보므로 `④` 의 조건이 거짓이
 * 되어 후보로 들어가지 않는다. 평행 간선은 둘 다 후보로 들어가고 가벼운 쪽이 먼저 나온 뒤
 * 무거운 쪽이 `③` 에서 걸러진다. 두 자리 다 이미 있는 갈래가 처리하므로 줄을 더하면 그
 * 줄은 한 번도 참이 되지 않는다 — 본문 「멈춤」이 값으로 확인한다.
 *
 * **힙을 반복문으로 적었다.** 재귀로 적으면 호출 깊이가 힙의 높이가 되는데, 높이가 작다는
 * 것이 이 절차가 값으로 확인하는 성질이라 그 성질에 코드의 안전성을 기대는 모양이 된다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 시작 정점을 적는 줄을 바꾸면 다른 정점에서 시작한 판이 된다.
 * - 이미 트리에 든 정점을 걸러 내는 줄을 지우면 같은 정점을 두 번 세어 합계가 작아진다.
 * - 마지막 줄의 삼항식을 합계로 바꾸면 이어지지 않은 그래프에 부분 합계를 답한다.
 */

/** 간선 하나 — `[u, v, w]` 는 정점 `u` 와 `v` 를 잇는 가중치 `w` 의 무방향 간선이다. */
export type Edge = [number, number, number];

/**
 * 정점 `n` 개와 무방향 가중치 간선 목록을 받아 최소 신장 트리의 가중치 합을 돌려준다.
 * 모든 정점을 잇는 트리를 만들 수 없으면 `-1` 이다. 정점이 하나뿐이면 간선 없이 `0` 이다.
 */
export function primMst(n: number, edges: Edge[]): number {
  // 간선 목록을 이웃 목록으로 바꾼다. 무방향이라 양쪽에 적는다.
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
  }

  // 트리에 이미 들어간 정점 표시. 처음에는 아무도 안 들어가 있다.
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const pq = new MinHeap();

  // ① 시작값 — 정점 0 을 비용 0 으로 넣는다. 트리의 첫 정점은 값을 치르지 않는다.
  pq.push(0, 0);

  let total = 0;
  let joined = 0;

  // ② 큐에 후보가 남아 있는가 — 없으면 더 넣을 정점이 없다.
  while (pq.size() > 0) {
    const [u, w] = pq.pop() as [number, number];

    // ③ 이미 트리에 든 정점이면 이 항목은 지나간 후보다. 버린다.
    if (inTree[u] === true) continue;

    inTree[u] = true;
    total += w;
    joined++;

    // ⑤ 정점을 다 넣었으면 큐에 남은 후보는 볼 필요가 없다.
    if (joined === n) return total;

    for (const [v, ew] of adj[u] as [number, number][]) {
      // ④ 트리 밖 정점만 후보로 넣는다. 트리 안끼리 잇는 간선은 후보가 아니다.
      if (inTree[v] !== true) pq.push(v, ew);
    }
  }

  // ⑥ 큐가 비었는데 정점을 다 못 넣었으면 시작 정점의 덩어리가 전부가 아니다.
  return joined === n ? total : -1;
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
