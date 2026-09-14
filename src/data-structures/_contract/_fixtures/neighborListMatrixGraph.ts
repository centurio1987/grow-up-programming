/**
 * 결함 fixture — 정점 수가 고정된 그래프를 정점마다 이웃 배열로 드는 구현.
 *
 * `graph-repr/graphAdjMatrix` 계약 앞에 세운다. **값은 한 자리도 틀리지 않는다** — 여덟 행의 의미를
 * 전부 지킨다. 어기는 것은 쌍을 다루는 네 행의 비용이다. 쌍 (u, v) 를 다루려면 u 의 이웃 배열에서
 * v 를 찾아야 하므로 `addEdge` · `removeEdge` · `hasEdge` · `weight` 가 전부 **u 의 차수**에 비례한다.
 *
 * `neighbors` 는 반대로 계약보다 **빠르다** — 차수에 비례한다. 계약이 그 행을 `O(n)` 으로 허용했을
 * 뿐 요구하지 않았으므로 위반이 아니고, 차수가 n 인 가운데 정점을 함께 묻는 시나리오에서는 최대
 * 비용이 n 을 따라가 통과한다.
 *
 * 이 모양이 `graph-repr/graphAdjList` 계약의 자명한 구현이다. 「공간이 존재 이유」 판별 절차의 셋째
 * 걸음(`docs/ORD-006-conventions.md:3037-3040` — 제약이 비용이면 축3이 갈라내는가)을 이 계약에서
 * 실제로 돌린 실물이 이 파일이다. 갈라냈으므로 이 계약은 B15 처분이 아니라 따로 선다.
 *
 * 계측 단위는 §규약2 와 같다 — 이웃 항목 하나를 지나갈 때마다 1.
 */

export class NeighborListMatrixGraph {
  readonly #n: number;
  readonly #directed: boolean;
  readonly #targets: number[][];
  readonly #weights: number[][];

  __cost = 0;

  constructor(n: number, directed = false) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `정점 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#n = n;
    this.#directed = directed;
    this.#targets = Array.from({ length: n }, () => []);
    this.#weights = Array.from({ length: n }, () => []);
    this.__cost += n + 1;
  }

  addEdge(u: number, v: number, weight = 1): void {
    this.#check(u);
    this.#check(v);
    this.#put(u, v, weight);
    if (!this.#directed && u !== v) this.#put(v, u, weight);
  }

  removeEdge(u: number, v: number): void {
    this.#check(u);
    this.#check(v);
    this.#take(u, v);
    if (!this.#directed && u !== v) this.#take(v, u);
  }

  hasEdge(u: number, v: number): boolean {
    this.#check(u);
    this.#check(v);
    return this.#find(u, v) >= 0;
  }

  weight(u: number, v: number): number | null {
    this.#check(u);
    this.#check(v);
    const at = this.#find(u, v);
    return at < 0 ? null : ((this.#weights[u] as number[])[at] as number);
  }

  neighbors(u: number): number[] {
    this.#check(u);
    const targets = this.#targets[u] as number[];
    this.__cost += 1 + targets.length;
    return [...targets];
  }

  vertexCount(): number {
    this.__cost += 1;
    return this.#n;
  }

  /** 이웃 배열을 앞에서부터 지나며 `to` 를 찾는다. 이 줄이 차수에 비례하는 자리다. */
  #find(from: number, to: number): number {
    const targets = this.#targets[from] as number[];
    this.__cost += 1;
    for (let i = 0; i < targets.length; i++) {
      this.__cost += 1;
      if (targets[i] === to) return i;
    }
    return -1;
  }

  #put(from: number, to: number, weight: number): void {
    const at = this.#find(from, to);
    if (at >= 0) {
      (this.#weights[from] as number[])[at] = weight;
      return;
    }
    (this.#targets[from] as number[]).push(to);
    (this.#weights[from] as number[]).push(weight);
  }

  #take(from: number, to: number): void {
    const at = this.#find(from, to);
    if (at < 0) return;
    const targets = this.#targets[from] as number[];
    const weights = this.#weights[from] as number[];
    const last = targets.length - 1;
    targets[at] = targets[last] as number;
    weights[at] = weights[last] as number;
    targets.pop();
    weights.pop();
  }

  #check(vertex: number): void {
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= this.#n) {
      throw new RangeError(
        `정점 번호는 [0, ${this.#n}) 안의 정수여야 한다 — 받은 값은 ${vertex} 이다`,
      );
    }
  }
}
