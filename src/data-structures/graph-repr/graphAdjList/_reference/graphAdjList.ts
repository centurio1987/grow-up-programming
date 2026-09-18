/**
 * `graph-repr/graphAdjList` 정본(규약2).
 *
 * 계약은 `../graphAdjList.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 정점마다 이웃 번호와 무게를 배열 한 쌍에
 * 담는 것이 여기 쓴 방식이지만, 이웃 항목을 마디로 이어 두는 구현도, 정점마다 이웃을 사전으로 드는
 * 구현도 일곱 행을 전부 지킨다(뒤엣것은 `addEdge`·`removeEdge` 가 계약보다 빨라 축3에서 계급
 * 아래로 걸린다 — 계약 위반이 아니다. 불변 사실 49).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"이웃 항목 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를
 * 따로 세지 않고**, 언어 런타임이 배열을 다시 잡는 비용도 세지 않는다(§규약2 계측 단위). 같은
 * 간선을 찾느라 훑은 항목, `neighbors` 가 옮겨 담은 항목이 그 단위다. 항목을 하나도 지나가지 않는
 * 호출(`addVertex`, 빈 배열을 훑는 찾기)도 1 을 더한다 — 판정이 계측값
 * 0 을 성장률로 나누지 못하기 때문이고(`_contract/judge.ts` 의 `judgeGrowth`), 상수 배수는 판정에
 * 안 들어오므로 이 선택이 어느 행의 판정도 바꾸지 않는다. `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 *
 * **지운 자리는 마지막 항목으로 메운다.** 계약이 `neighbors` 의 순서를 정하지 않으므로 허용되고,
 * 뒤를 당기지 않으니 찾은 뒤의 몫이 상수다. 무방향 간선은 두 끝에 한 항목씩 있으므로 지우기와
 * 무게 바꾸기가 두 배열을 함께 고친다 — 헤더 불변식 2번이 한쪽만 고친 구현을 잡는 자리다.
 */

// #region guide:core
export class GraphAdjList {
  readonly #directed: boolean;
  /** 정점마다 이웃 번호. 같은 자리의 `#weights` 가 그 간선의 무게다. */
  readonly #targets: number[][] = [];
  readonly #weights: number[][] = [];

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(directed = false) {
    this.#directed = directed;
    this.__cost += 1;
  }

  addVertex(): number {
    this.__cost += 1;
    this.#targets.push([]);
    this.#weights.push([]);
    return this.#targets.length - 1;
  }

  addEdge(u: number, v: number, weight = 1): void {
    this.#check(u);
    this.#check(v);
    const at = this.#find(u, v);
    if (at >= 0) {
      // 이미 있는 간선이다. 무게만 바꾸고 간선 수는 그대로 둔다.
      this.#weightsOf(u)[at] = weight;
      if (!this.#directed && u !== v) {
        this.#weightsOf(v)[this.#find(v, u)] = weight;
      }
      return;
    }
    this.#append(u, v, weight);
    // 제자리 간선은 무방향이어도 한 항목이다 — 두 끝이 같은 배열이라 두 번 담으면 두 번 보인다.
    if (!this.#directed && u !== v) this.#append(v, u, weight);
  }

  removeEdge(u: number, v: number): void {
    this.#check(u);
    this.#check(v);
    const at = this.#find(u, v);
    if (at < 0) return;
    this.#take(u, at);
    if (!this.#directed && u !== v) this.#take(v, this.#find(v, u));
  }

  neighbors(u: number): Array<{ vertex: number; weight: number }> {
    this.#check(u);
    const targets = this.#targetsOf(u);
    const weights = this.#weightsOf(u);
    this.__cost += 1;
    // 새 배열 · 새 항목으로 옮겨 담는다. 돌려준 것을 고쳐도 그래프가 바뀌지 않는다는 행이다.
    const found: Array<{ vertex: number; weight: number }> = [];
    for (let i = 0; i < targets.length; i++) {
      this.__cost += 1;
      found.push({
        vertex: targets[i] as number,
        weight: weights[i] as number,
      });
    }
    return found;
  }

  #check(vertex: number): void {
    if (
      !Number.isInteger(vertex) ||
      vertex < 0 ||
      vertex >= this.#targets.length
    ) {
      throw new RangeError(
        `정점 번호는 [0, ${this.#targets.length}) 안의 정수여야 한다 — 받은 값은 ${vertex} 이다`,
      );
    }
  }

  /** `from` 의 이웃 가운데 `to` 가 놓인 자리. 없으면 -1. 이웃을 앞에서부터 하나씩 지나간다. */
  #find(from: number, to: number): number {
    const targets = this.#targetsOf(from);
    this.__cost += 1;
    for (let i = 0; i < targets.length; i++) {
      this.__cost += 1;
      if (targets[i] === to) return i;
    }
    return -1;
  }

  #append(from: number, to: number, weight: number): void {
    this.__cost += 1;
    this.#targetsOf(from).push(to);
    this.#weightsOf(from).push(weight);
  }

  /** `at` 자리의 항목을 빼고 마지막 항목으로 메운다. */
  #take(from: number, at: number): void {
    const targets = this.#targetsOf(from);
    const weights = this.#weightsOf(from);
    const last = targets.length - 1;
    this.__cost += 1;
    targets[at] = targets[last] as number;
    weights[at] = weights[last] as number;
    targets.pop();
    weights.pop();
  }

  #targetsOf(vertex: number): number[] {
    return this.#targets[vertex] as number[];
  }

  #weightsOf(vertex: number): number[] {
    return this.#weights[vertex] as number[];
  }
}
// #endregion
