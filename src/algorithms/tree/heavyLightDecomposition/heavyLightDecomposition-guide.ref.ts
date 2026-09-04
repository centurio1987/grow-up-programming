/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition.ts` 는 학습자
 * 스텁이라 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은
 * 절차다 — 뿌리에서 한 번 따라가 부모·깊이·부분트리 크기를 정하고, 자식 중 부분트리가 가장 큰
 * 것을 무거운 자식으로 골라 사슬을 만들고, 사슬 순서대로 자리 번호를 붙인 기저 배열 위에
 * 펜윅 트리를 세운다. 질의는 그 배열의 구간 합 몇 개를 더한 것이다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. 스택 배열 둘로 옮기면
 * 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - `headDepth` 의 본문을 정점 자신의 깊이로 바꾸면 경로 밖 정점이 합에 들어간다.
 * - 무거운 자식을 크기 대신 처음 만난 자식으로 고르면 **답은 그대로이고 구간 수만 늘어난다.**
 */

/**
 * 뿌리가 정해진 트리의 정점마다 값을 두고, 정점 하나의 값 교체와 두 정점 사이 경로 위 값 합을
 * 각각 처리한다. 경로는 방향과 무관하고 양 끝 정점을 포함한다.
 */
export class HeavyLightDecomposition {
  private readonly n: number;
  private readonly parent: number[];
  private readonly depth: number[];
  private readonly head: number[];
  private readonly pos: number[];
  private readonly val: number[];
  private readonly bit: number[];

  constructor(
    n: number,
    edges: [number, number][],
    root: number,
    values: number[],
  ) {
    this.n = n;

    // 간선 목록을 정점마다의 이웃 목록으로 옮긴다. 무방향이라 양쪽에 넣는다.
    const near: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      (near[a] as number[]).push(b);
      (near[b] as number[]).push(a);
    }

    const parent: number[] = Array.from({ length: n }, () => root);
    const depth: number[] = Array.from({ length: n }, () => 0);
    const size: number[] = Array.from({ length: n }, () => 1);
    const heavy: number[] = Array.from({ length: n }, () => -1);

    // 1차 순회 — 뿌리에서 한 번 따라가며 부모와 깊이를 정하고 방문 순서를 적어 둔다.
    const order: number[] = [];
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const stack: number[] = [root];
    seen[root] = true;
    while (stack.length > 0) {
      const u = stack.pop() as number;
      order.push(u);
      for (const w of near[u] as number[]) {
        // ① 이미 지나온 정점은 자식이 아니다. 이웃 목록이 양방향이라 부모가 거기 들어 있다.
        if (seen[w]) continue;
        seen[w] = true;
        parent[w] = u;
        depth[w] = (depth[u] as number) + 1;
        stack.push(w);
      }
    }

    // 방문 순서의 뒤에서 앞으로 오면서 자식의 크기를 부모에 더한다. 자식이 언제나 부모보다
    // 뒤에 있으므로, 부모 차례가 왔을 때 그 부분트리 크기가 이미 완성돼 있다.
    for (let i = order.length - 1; i >= 1; i--) {
      const w = order[i] as number;
      const p = parent[w] as number;
      size[p] = (size[p] as number) + (size[w] as number);
    }

    // `best[p]` 는 `p` 의 자식 중 지금까지 본 가장 큰 부분트리 크기다.
    const best: number[] = Array.from({ length: n }, () => 0);
    for (const w of order) {
      if (w === root) continue;
      const p = parent[w] as number;
      const sw = size[w] as number;
      // ② 자식 중 부분트리가 가장 큰 것 하나를 무거운 자식으로 삼는다.
      if (sw > (best[p] as number)) {
        best[p] = sw;
        heavy[p] = w;
      }
    }

    // 2차 순회 — 사슬 머리에서 무거운 자식을 끝까지 따라가며 자리 번호를 붙인다.
    const head: number[] = Array.from({ length: n }, () => root);
    const pos: number[] = Array.from({ length: n }, () => 0);
    let timer = 0;
    const tops: number[] = [root];
    while (tops.length > 0) {
      const top = tops.pop() as number;
      let w = top;
      while (w !== -1) {
        // ③ 무거운 자식은 부모의 사슬 머리를 물려받고, 가벼운 자식이 새 사슬의 머리가 된다.
        head[w] = top;
        pos[w] = timer;
        timer += 1;
        const pw = parent[w] as number;
        const hw = heavy[w] as number;
        for (const c of near[w] as number[]) {
          if (c === pw || c === hw) continue;
          tops.push(c);
        }
        w = hw;
      }
    }

    // 자리 번호대로 늘어놓은 기저 배열 위에 펜윅 트리를 세운다. 칸마다 값을 넣고 한 번
    // 차례로 읽으면서 자기를 담는 마디에 더하면 전체가 `n` 칸 접근으로 완성된다.
    const val: number[] = Array.from({ length: n }, () => 0);
    const bit: number[] = Array.from({ length: n + 1 }, () => 0);
    for (let w = 0; w < n; w++) {
      const x = values[w] as number;
      val[w] = x;
      bit[(pos[w] as number) + 1] = x;
    }
    for (let i = 1; i <= n; i++) {
      const j = i + (i & -i);
      if (j <= n) bit[j] = (bit[j] as number) + (bit[i] as number);
    }

    this.parent = parent;
    this.depth = depth;
    this.head = head;
    this.pos = pos;
    this.val = val;
    this.bit = bit;
  }

  /** 정점 `node` 의 값을 `value` 로 교체한다. */
  update(node: number, value: number): void {
    const delta = value - (this.val[node] as number);
    this.val[node] = value;
    // ⑥ 켜진 가장 낮은 자리를 더해 가며 이 칸을 담고 있는 마디를 전부 고친다.
    for (let i = (this.pos[node] as number) + 1; i <= this.n; i += i & -i) {
      this.bit[i] = (this.bit[i] as number) + delta;
    }
  }

  /** `u` 에서 `v` 까지 경로 위 정점 값의 합. 양 끝을 포함한다. */
  queryPath(u0: number, v0: number): number {
    let u = u0;
    let v = v0;
    let total = 0;
    while ((this.head[u] as number) !== (this.head[v] as number)) {
      // ④ 사슬 머리가 더 깊은 쪽을 고른다. 그쪽 구간이 통째로 경로 위에 있다.
      if (this.headDepth(u) < this.headDepth(v)) {
        const t = u;
        u = v;
        v = t;
      }
      const h = this.head[u] as number;
      total += this.range(this.pos[h] as number, this.pos[u] as number);
      u = this.parent[h] as number;
    }
    // ⑤ 사슬 머리가 같아지면 남은 것은 자리 번호 두 개 사이의 한 구간이다.
    const lo = Math.min(this.pos[u] as number, this.pos[v] as number);
    const hi = Math.max(this.pos[u] as number, this.pos[v] as number);
    return total + this.range(lo, hi);
  }

  /** 정점 `x` 가 속한 사슬 머리의 깊이. */
  private headDepth(x: number): number {
    return this.depth[this.head[x] as number] as number;
  }

  /** 기저 배열 `[0, i)` 의 합. */
  private prefix(i: number): number {
    let s = 0;
    for (let k = i; k > 0; k -= k & -k) s += this.bit[k] as number;
    return s;
  }

  /** 기저 배열 `[l, r]` 의 합. */
  private range(l: number, r: number): number {
    return this.prefix(r + 1) - this.prefix(l);
  }
}
