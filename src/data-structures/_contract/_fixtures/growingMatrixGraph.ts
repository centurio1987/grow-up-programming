/**
 * 결함 fixture — 정점 수 곱하기 정점 수의 칸에 무게를 적고, 정점이 늘면 칸을 늘리는 그래프.
 *
 * `graph-repr/graphAdjList` 계약 앞에 세운다. **값은 한 자리도 틀리지 않는다** — 칸마다 간선이
 * 있는지와 무게를 적어 두고 번호가 조밀하므로 일곱 행의 의미를 전부 지킨다. 어기는 것은 두 행의
 * 비용이다.
 *
 * - `neighbors(u)` 가 u 의 행을 끝까지 훑는다. 차수가 2 인 정점에서도 정점 수에 비례한다.
 * - `addVertex()` 가 칸이 모자라면 두 배 크기로 새로 잡고 옛 칸을 전부 옮긴다. 옮기는 칸 수가 정점
 *   수의 제곱이라, 두 배로 늘려도 상각 몫이 정점 수에 비례한다.
 *
 * `addEdge`·`removeEdge` 는 칸 하나를 읽고 쓰므로 상수다 — 계약이 차수로 적은 상한보다 **빠르고**,
 * 차수를 키운 시나리오에서 계급 아래로 걸리지만 그것은 위반이 아니다(불변 사실 49).
 *
 * 이 모양이 `graph-repr/graphAdjMatrix` 계약의 자명한 구현이다. **그 계약을 지키는 구현이 이 계약을
 * 못 지킨다**는 반례(두 계약이 서로 담지 않는다의 한쪽)의 실물이 이 파일이다.
 *
 * 계측 단위는 §규약2 와 같다 — 칸이나 이웃 항목 하나를 지나갈 때마다 1.
 */

export class GrowingMatrixGraph {
  readonly #directed: boolean;
  #capacity = 0;
  #vertices = 0;
  #edges = 0;
  #present = new Uint8Array(0);
  #weights = new Float64Array(0);

  __cost = 0;

  constructor(directed = false) {
    this.#directed = directed;
    this.__cost += 1;
  }

  addVertex(): number {
    this.__cost += 1;
    if (this.#vertices === this.#capacity) this.#grow();
    this.#vertices += 1;
    return this.#vertices - 1;
  }

  addEdge(u: number, v: number, weight = 1): void {
    this.#check(u);
    this.#check(v);
    this.__cost += 1;
    if (this.#present[this.#cell(u, v)] === 0) this.#edges += 1;
    this.#set(u, v, weight);
    if (!this.#directed) this.#set(v, u, weight);
  }

  removeEdge(u: number, v: number): void {
    this.#check(u);
    this.#check(v);
    this.__cost += 1;
    if (this.#present[this.#cell(u, v)] === 0) return;
    this.#present[this.#cell(u, v)] = 0;
    if (!this.#directed) this.#present[this.#cell(v, u)] = 0;
    this.#edges -= 1;
  }

  neighbors(u: number): Array<{ vertex: number; weight: number }> {
    this.#check(u);
    const found: Array<{ vertex: number; weight: number }> = [];
    this.__cost += 1;
    // 행 하나를 끝까지 훑는다. 이 줄이 차수가 아니라 정점 수에 비례하는 자리다.
    for (let v = 0; v < this.#vertices; v++) {
      this.__cost += 1;
      const at = this.#cell(u, v);
      if (this.#present[at] === 1) {
        found.push({ vertex: v, weight: this.#weights[at] as number });
      }
    }
    return found;
  }

  vertexCount(): number {
    this.__cost += 1;
    return this.#vertices;
  }

  edgeCount(): number {
    this.__cost += 1;
    return this.#edges;
  }

  #grow(): void {
    const next = Math.max(1, this.#capacity * 2);
    const present = new Uint8Array(next * next);
    const weights = new Float64Array(next * next);
    for (let u = 0; u < this.#vertices; u++) {
      for (let v = 0; v < this.#vertices; v++) {
        this.__cost += 1;
        present[u * next + v] = this.#present[this.#cell(u, v)] as number;
        weights[u * next + v] = this.#weights[this.#cell(u, v)] as number;
      }
    }
    this.#present = present;
    this.#weights = weights;
    this.#capacity = next;
  }

  #set(u: number, v: number, weight: number): void {
    const at = this.#cell(u, v);
    this.#present[at] = 1;
    this.#weights[at] = weight;
  }

  #cell(u: number, v: number): number {
    return u * this.#capacity + v;
  }

  #check(vertex: number): void {
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= this.#vertices) {
      throw new RangeError(
        `정점 번호는 [0, ${this.#vertices}) 안의 정수여야 한다 — 받은 값은 ${vertex} 이다`,
      );
    }
  }
}
