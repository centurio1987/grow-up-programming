/**
 * `graph-repr/dag` 정본(규약2).
 *
 * 계약은 `../dag.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고,
 * 계약이 허용하는 유일한 구현이 아니다. 정점마다 나가는 간선의 끝을 배열에 담고, 새 간선 u→v 를
 * 넣을 때 v 에서 간선을 따라 가며 u 에 닿는지 보는 것이 여기 쓴 방식이다. 들어오는 간선을 담고
 * u 에서 거슬러 v 를 찾는 구현도 여섯 행을 전부 지킨다(탐침 — 한 호출 비용이 헤더의 k(u, v) 의 1.5 배 이하).
 * 정점 순서를 들고 다니며 어긋난 부분만 다시 매기는 구현(Pearce-Kelly)은 다시 매길 정점을 정렬하는 몫만큼
 * 로그 인수를 넘는다 — 축3 해상도 아래다(헤더 「`addEdge` 상한을 k 로 적은 것은 고른 것이다」).
 *
 * **이 정본의 `addEdge` 가 k(u, v) 안에 드는 이유.** 같은 간선을 찾느라 훑는 u 의 나가는 간선은 u 가 닿는 부분 A 에 들므로
 * 닿는 간선이고, 사이클을 찾느라 꺼내는 정점과 지나가는 간선은 v 에서 갈 수 있는 부분이라 A 안이다. 그래서 한 호출이
 * 2 + |A| + 2 × (닿는 간선 수) ≤ 2k + 2 를 넘지 않는다. 탐침(두 시나리오 · 무작위 네 작업 · 두 사슬 잇기)에서 비용/k 는
 * 최대 1.50 이었다(k = 2 에서 비용 3).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"정점 하나 또는 간선 하나를 지나갈 때마다 1"* 이다 — **읽기와
 * 쓰기를 따로 세지 않고**, 언어 런타임이 배열을 다시 잡는 비용도 세지 않는다(§규약2 계측 단위).
 * 같은 간선을 찾느라 훑은 항목, 사이클을 찾느라 꺼낸 정점과 지나간 간선, 순서를 짓느라 지나간 정점과
 * 간선이 그 단위다. 항목을 하나도 지나가지 않는 호출(`addVertex`·`vertexCount`·`edgeCount`, 빈
 * 배열을 훑는 찾기)도 1 을 더한다 — 판정이 계측값 0 을 성장률로 나누지 못하기 때문이고
 * (`_contract/judge.ts` 의 `judgeGrowth`), 상수 배수는 판정에 안 들어오므로 이 선택이 어느 행의
 * 판정도 바꾸지 않는다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **지나간 표시를 정점 수만큼 새로 잡지 않는다.** 찾기마다 표시 배열을 새로 만들면 그 호출이 닿는
 * 부분이 작아도 정점 수가 든다 — 헤더 필요충분조건이 그 구현을 적는다. 지나간 정점을 목록에 적어
 * 두었다가 찾기가 끝나면 그 자리의 표시만 되돌린다. 되돌리는 걸음은 지나간 정점 수와 같으므로 따로
 * 세지 않는다.
 */

// #region guide:core
export class DAG {
  /** 정점마다 나가는 간선의 끝. */
  readonly #out: number[][] = [];
  /** 한 번의 찾기 동안만 켜지는 「지나갔다」 표시. 찾기가 끝나면 전부 꺼져 있다. */
  readonly #seen: boolean[] = [];
  #edges = 0;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor() {
    this.__cost += 1;
  }

  addVertex(): number {
    this.__cost += 1;
    this.#out.push([]);
    this.#seen.push(false);
    return this.#out.length - 1;
  }

  addEdge(u: number, v: number): boolean {
    this.#check(u);
    this.#check(v);
    // 이미 있는 간선이다. 받아들인 것으로 답하고 아무것도 바꾸지 않는다.
    if (this.#has(u, v)) return true;
    // v 에서 간선을 따라 u 에 닿으면 u→v 가 사이클을 닫는다. u === v 도 여기서 걸린다.
    if (this.#reaches(v, u)) return false;
    this.__cost += 1;
    this.#outOf(u).push(v);
    this.#edges += 1;
    return true;
  }

  topologicalOrder(): number[] {
    const vertices = this.#out.length;
    // 정점마다 아직 순서에 안 넣은 앞 정점의 수. 0 이 되면 그 정점을 넣어도 된다.
    const waiting: number[] = new Array(vertices).fill(0);
    this.__cost += 1;
    for (const targets of this.#out) {
      this.__cost += 1;
      for (const target of targets) {
        this.__cost += 1;
        waiting[target] = (waiting[target] as number) + 1;
      }
    }
    const ready: number[] = [];
    for (let vertex = 0; vertex < vertices; vertex++) {
      if (waiting[vertex] === 0) ready.push(vertex);
    }
    // 새 배열에 담아 돌려준다. 돌려준 것을 고쳐도 그래프가 바뀌지 않는다는 행이다.
    const order: number[] = [];
    while (ready.length > 0) {
      const vertex = ready.pop() as number;
      this.__cost += 1;
      order.push(vertex);
      for (const target of this.#outOf(vertex)) {
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

  /** `from` 에서 나가는 간선 가운데 `to` 로 가는 것이 있는가. 나가는 간선을 앞에서부터 하나씩 지나간다. */
  #has(from: number, to: number): boolean {
    this.__cost += 1;
    for (const target of this.#outOf(from)) {
      this.__cost += 1;
      if (target === to) return true;
    }
    return false;
  }

  /** `from` 에서 간선을 따라 `goal` 에 닿는가. 지나간 정점만 표시하고, 끝나면 그 표시를 되돌린다. */
  #reaches(from: number, goal: number): boolean {
    const passed: number[] = [from];
    const pending: number[] = [from];
    this.#seen[from] = true;
    let found = false;
    while (pending.length > 0) {
      const vertex = pending.pop() as number;
      this.__cost += 1;
      if (vertex === goal) {
        found = true;
        break;
      }
      for (const target of this.#outOf(vertex)) {
        this.__cost += 1;
        if (this.#seen[target]) continue;
        this.#seen[target] = true;
        passed.push(target);
        pending.push(target);
      }
    }
    for (const vertex of passed) this.#seen[vertex] = false;
    return found;
  }

  #outOf(vertex: number): number[] {
    return this.#out[vertex] as number[];
  }
}
// #endregion
