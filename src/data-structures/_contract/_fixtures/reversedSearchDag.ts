/**
 * 결함 fixture — 사이클을 찾는 방향을 거꾸로 짠 비순환 방향 그래프.
 *
 * `graph-repr/dag` 계약 앞에 세운다. 정본과 표현 · 비용이 같고 **판정의 방향 하나만 다르다.** 새 간선
 * u→v 가 사이클을 닫는지 물을 때 「v 에서 u 에 닿는가」가 아니라 「u 에서 v 에 닿는가」를 본다. 물려받은
 * 가이드가 「헷갈리기 쉬운 포인트 첫 번째」로 든 실수 그대로다(`graph-repr/dag/dag-guide.mdx`).
 *
 * 틀리는 자리가 둘이다.
 *
 * - **사이클을 받아들인다.** 0→1→2 뒤의 2→0 은 2 에서 0 에 못 닿으므로 받아들인다.
 * - **지름길을 거부한다.** 0→1→2 뒤의 0→2 는 0 에서 2 에 닿으므로 사이클로 읽는다.
 * - 제자리 간선은 거부한다 — u 에서 u 에는 늘 닿는다.
 *
 * **이것은 비용이 아니라 의미의 결함이다** — 축1이 경계에서 잡는다. 사이클이 한 번 들어오면 순서에서
 * 그 사이클의 정점이 빠지므로 축2의 불변식(순서의 길이 ↔ 정점 수)도 잡는다. 축3에서 걸리는 자리는
 * 결함의 결과다 — 사슬의 끝을 처음에 잇는 간선을 받아들여 버리므로 뒤 호출이 같은 간선을 찾기만 하고
 * 계급 아래로 떨어진다. 계약 위반이 비용에 있지 않다.
 *
 * 계측 단위는 §규약2 와 같다 — 정점 하나 또는 간선 하나를 지나갈 때마다 1.
 */

export class ReversedSearchDag {
  readonly #out: number[][] = [];
  #edges = 0;

  __cost = 0;

  constructor() {
    this.__cost += 1;
  }

  addVertex(): number {
    this.__cost += 1;
    this.#out.push([]);
    return this.#out.length - 1;
  }

  addEdge(u: number, v: number): boolean {
    this.#check(u);
    this.#check(v);
    const targets = this.#out[u] as number[];
    this.__cost += 1;
    for (const target of targets) {
      this.__cost += 1;
      if (target === v) return true;
    }
    // 방향이 거꾸로다 — u 에서 v 에 이미 닿으면 사이클로 본다.
    if (this.#reaches(u, v)) return false;
    targets.push(v);
    this.#edges += 1;
    return true;
  }

  topologicalOrder(): number[] {
    const waiting: number[] = new Array(this.#out.length).fill(0);
    this.__cost += 1;
    for (const targets of this.#out) {
      this.__cost += 1;
      for (const target of targets) {
        this.__cost += 1;
        waiting[target] = (waiting[target] as number) + 1;
      }
    }
    const ready: number[] = [];
    for (let vertex = 0; vertex < this.#out.length; vertex++) {
      if (waiting[vertex] === 0) ready.push(vertex);
    }
    const order: number[] = [];
    while (ready.length > 0) {
      const vertex = ready.pop() as number;
      this.__cost += 1;
      order.push(vertex);
      for (const target of this.#out[vertex] as number[]) {
        this.__cost += 1;
        const left = (waiting[target] as number) - 1;
        waiting[target] = left;
        if (left === 0) ready.push(target);
      }
    }
    return order;
  }

  vertexCount(): number {
    this.__cost += 1;
    return this.#out.length;
  }

  edgeCount(): number {
    this.__cost += 1;
    return this.#edges;
  }

  #check(vertex: number): void {
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= this.#out.length) {
      throw new RangeError(
        `정점 번호는 [0, ${this.#out.length}) 안의 정수여야 한다 — 받은 값은 ${vertex} 이다`,
      );
    }
  }

  #reaches(from: number, goal: number): boolean {
    const seen = new Set<number>([from]);
    const pending = [from];
    while (pending.length > 0) {
      const vertex = pending.pop() as number;
      this.__cost += 1;
      if (vertex === goal) return true;
      for (const target of this.#out[vertex] as number[]) {
        this.__cost += 1;
        if (seen.has(target)) continue;
        seen.add(target);
        pending.push(target);
      }
    }
    return false;
  }
}
