/**
 * 결함 fixture — 순서의 다음 정점을 매번 정점 전체에서 다시 찾는 비순환 방향 그래프.
 *
 * `graph-repr/dag` 계약 앞에 세운다. **값은 한 자리도 틀리지 않는다.** 표현과 `addEdge` 는 정본과 같고
 * `topologicalOrder` 하나만 다르다 — 정점마다 들어오는 간선 수를 센 뒤, 순서에 넣을 다음 정점을
 * 번호 0 부터 끝까지 훑어 「아직 안 넣었고 기다리는 앞 정점이 없는 것」으로 찾는다. 넣을 수 있는
 * 정점을 따로 모아 두지 않는 흔한 첫 시도다.
 *
 * 어기는 것은 `topologicalOrder` 행의 비용이다. 상한은 정점 수 + 간선 수인데 이 구현은 정점 하나를
 * 넣을 때마다 정점 전체를 훑어 정점 수의 제곱에 비례한다. 헤더 필요충분조건의 「순서의 다음 정점을 매번
 * 정점 전체에서 다시 찾는 구현」의 실물이 이 파일이다.
 *
 * 계측 단위는 §규약2 와 같다 — 정점 하나 또는 간선 하나를 지나갈 때마다 1.
 */

export class RescanningOrderDag {
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
    if (this.#reaches(v, u)) return false;
    targets.push(v);
    this.#edges += 1;
    return true;
  }

  topologicalOrder(): number[] {
    const vertices = this.#out.length;
    const waiting: number[] = new Array(vertices).fill(0);
    this.__cost += 1;
    for (const targets of this.#out) {
      this.__cost += 1;
      for (const target of targets) {
        this.__cost += 1;
        waiting[target] = (waiting[target] as number) + 1;
      }
    }
    const placed: boolean[] = new Array(vertices).fill(false);
    const order: number[] = [];
    while (order.length < vertices) {
      let next = -1;
      for (let vertex = 0; vertex < vertices; vertex++) {
        this.__cost += 1;
        if (!placed[vertex] && waiting[vertex] === 0) {
          next = vertex;
          break;
        }
      }
      if (next < 0) break;
      placed[next] = true;
      order.push(next);
      for (const target of this.#out[next] as number[]) {
        this.__cost += 1;
        waiting[target] = (waiting[target] as number) - 1;
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
