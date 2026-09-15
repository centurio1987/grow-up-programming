/**
 * 결함 fixture — 간선을 한 줄로 늘어놓은 그래프.
 *
 * `graph-repr/graphAdjList` 계약 앞에 세운다. **값은 한 자리도 틀리지 않는다.** 간선마다
 * (시작 · 끝 · 무게)를 배열 셋의 같은 자리에 담고, 무엇을 묻든 그 줄을 처음부터 끝까지 본다.
 * 어기는 것은 차수로 적힌 세 행의 비용이다 — 셋 다 차수가 아니라 **간선 수**에 비례한다.
 *
 * - `addEdge` — 같은 간선이 있는지 줄 전체를 훑는다.
 * - `removeEdge` — 같은 자리를 찾느라 줄 전체를 훑는다.
 * - `neighbors(u)` — u 에 닿은 간선을 고르느라 줄 전체를 훑는다.
 *
 * **차수를 키운 시나리오(별)는 통과한다.** 별에서는 간선 수가 곧 가운데 정점의 차수라 두 값이
 * 같이 자라기 때문이다. 이 fixture 를 잡는 것은 차수를 상수로 누른 쪽(고리)이고, 헤더
 * 필요충분조건의 「간선 수에 비례하면 간선을 한 줄로 늘어놓은 목록이다」의 실물이 이 파일이다.
 *
 * 계약 스위트의 참조 모델(`graphAdjList.contract.ts`)이 같은 모양이다 — 축1은 의미만 보므로 모델로는
 * 충분하고, 축3에 세우면 결함이 된다.
 *
 * 계측 단위는 §규약2 와 같다 — 간선 항목 하나를 지나갈 때마다 1.
 */

export class EdgeListGraph {
  readonly #directed: boolean;
  #vertices = 0;
  readonly #from: number[] = [];
  readonly #to: number[] = [];
  readonly #weight: number[] = [];

  __cost = 0;

  constructor(directed = false) {
    this.#directed = directed;
    this.__cost += 1;
  }

  addVertex(): number {
    this.__cost += 1;
    this.#vertices += 1;
    return this.#vertices - 1;
  }

  addEdge(u: number, v: number, weight = 1): void {
    this.#check(u);
    this.#check(v);
    const at = this.#find(u, v);
    if (at >= 0) {
      this.#weight[at] = weight;
      return;
    }
    this.#from.push(u);
    this.#to.push(v);
    this.#weight.push(weight);
  }

  removeEdge(u: number, v: number): void {
    this.#check(u);
    this.#check(v);
    const at = this.#find(u, v);
    if (at < 0) return;
    const last = this.#from.length - 1;
    this.#from[at] = this.#from[last] as number;
    this.#to[at] = this.#to[last] as number;
    this.#weight[at] = this.#weight[last] as number;
    this.#from.pop();
    this.#to.pop();
    this.#weight.pop();
  }

  neighbors(u: number): Array<{ vertex: number; weight: number }> {
    this.#check(u);
    const found: Array<{ vertex: number; weight: number }> = [];
    this.__cost += 1;
    for (let i = 0; i < this.#from.length; i++) {
      this.__cost += 1;
      const from = this.#from[i] as number;
      const to = this.#to[i] as number;
      const weight = this.#weight[i] as number;
      if (from === u) found.push({ vertex: to, weight });
      else if (!this.#directed && to === u)
        found.push({ vertex: from, weight });
    }
    return found;
  }

  vertexCount(): number {
    this.__cost += 1;
    return this.#vertices;
  }

  edgeCount(): number {
    this.__cost += 1;
    return this.#from.length;
  }

  /** u→v(무방향이면 u–v) 간선이 놓인 자리. 줄 전체를 앞에서부터 본다. */
  #find(u: number, v: number): number {
    this.__cost += 1;
    for (let i = 0; i < this.#from.length; i++) {
      this.__cost += 1;
      const from = this.#from[i];
      const to = this.#to[i];
      if (from === u && to === v) return i;
      if (!this.#directed && from === v && to === u) return i;
    }
    return -1;
  }

  #check(vertex: number): void {
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= this.#vertices) {
      throw new RangeError(
        `정점 번호는 [0, ${this.#vertices}) 안의 정수여야 한다 — 받은 값은 ${vertex} 이다`,
      );
    }
  }
}
