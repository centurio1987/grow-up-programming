/**
 * 결함 fixture — 간선을 넣을 때마다 그래프 전체로 순서를 지어 보는 비순환 방향 그래프.
 *
 * `graph-repr/dag` 계약 앞에 세운다. **값은 한 자리도 틀리지 않는다.** 정점마다 나가는 간선의 끝을
 * 배열에 담는 것까지는 정본과 같고, 새 간선 u→v 를 판정하는 방법만 다르다 — 간선을 먼저 넣어 보고,
 * 모든 정점과 모든 간선을 한 번씩 지나며 순서를 지어 정점이 전부 나오지 않으면 사이클이라 보고 되뺀다.
 * 사이클 판정을 위상 정렬 한 번으로 바꾸는 흔한 첫 시도다.
 *
 * 어기는 것은 `addEdge` 행의 비용이다. 상한은 새 간선이 **닿는 부분** k(u, v) 인데 이 구현은 그 부분이
 * 두 정점뿐이어도 정점 수 + 간선 수에 비례한다. 헤더 필요충분조건의 「넣을 때마다 그래프 전체를 다시 훑어
 * 사이클을 찾는 구현」의 실물이 이 파일이다.
 *
 * **사슬의 끝을 잇는 시나리오(k = n)는 통과한다.** 거기서는 닿는 부분이 곧 그래프 전체라 두 값이 같이
 * 자란다. 이 fixture 를 잡는 것은 떨어진 쌍을 잇는 쪽(k 가 상수)이다. `addEdge` 상한을 그래프 크기로
 * 적었다면 이 구현은 계약을 지킨다 — 그 선택이 사람이 확인할 자리다(`docs/ORD-006-conventions.md`
 * 「A군 비순환 방향 그래프」).
 *
 * 계측 단위는 §규약2 와 같다 — 정점 하나 또는 간선 하나를 지나갈 때마다 1.
 */

export class FullScanDag {
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
    targets.push(v);
    if (this.#order().length < this.#out.length) {
      targets.pop();
      return false;
    }
    this.#edges += 1;
    return true;
  }

  topologicalOrder(): number[] {
    return this.#order();
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

  /** 모든 정점과 간선을 한 번씩 지나며 짓는 순서. 사이클에 걸린 정점은 나오지 않는다. */
  #order(): number[] {
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
}
