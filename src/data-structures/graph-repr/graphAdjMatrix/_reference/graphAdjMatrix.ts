/**
 * `graph-repr/graphAdjMatrix` 정본(규약2).
 *
 * 계약은 `../graphAdjMatrix.ts` 헤더 한 곳이다(규약1). 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다. 정점 수 곱하기 정점 수의 칸을 한 줄로 펴서
 * 있음 표시와 무게를 적는 것이 여기 쓴 방식이지만, 칸마다 「그 간선이 이웃 배열의 몇 번째에
 * 있는가」를 적고 이웃 배열을 함께 드는 구현도 여덟 행을 전부 지킨다(그 구현은 `neighbors` 가
 * 계약보다 빨라 축3에서 계급 아래로 걸린다 — 계약 위반이 아니다. 불변 사실 49).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"칸 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를 따로
 * 세지 않고**, 언어 런타임이 배열을 잡는 비용도 세지 않는다(§규약2 계측 단위). 갱신 · 쌍 질의는
 * 칸 하나(무방향이면 둘)를 지나고, `neighbors` 는 행 하나의 칸 n 개를 지난다. 생성자는 칸 n² 개를
 * 비워 두는 몫을 한 번에 더한다 — 런타임이 새 배열을 0 으로 채워 주므로 실제로 도는 반복은 없지만,
 * 계약이 그 준비를 `O(n^2)` 으로 허용한 자리를 계측에도 남긴다. 생성자 행은 축3이 재지 않는다.
 * `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **무게와 있음 표시를 따로 든다.** 무게에 `NaN` 을 포함한 아무 수나 받으므로 무게 칸의 어떤 값도
 * 「간선이 없다」의 표지로 쓸 수 없다. 표시를 따로 두면 헤더 불변식 1번이 두 칸을 함께 고치지 않은
 * 구현을 잡는 자리가 된다.
 */

// #region guide:core
export class GraphAdjMatrix {
  readonly #n: number;
  readonly #directed: boolean;
  /** 칸 `u * n + v` 가 1 이면 u→v 간선이 있다. */
  readonly #present: Uint8Array;
  readonly #weights: Float64Array;

  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */
  __cost = 0;

  constructor(n: number, directed = false) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `정점 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#n = n;
    this.#directed = directed;
    this.#present = new Uint8Array(n * n);
    this.#weights = new Float64Array(n * n);
    this.__cost += n * n + 1;
  }

  addEdge(u: number, v: number, weight = 1): void {
    this.#check(u);
    this.#check(v);
    this.#put(u, v, weight);
    if (!this.#directed) this.#put(v, u, weight);
  }

  removeEdge(u: number, v: number): void {
    this.#check(u);
    this.#check(v);
    this.__cost += 1;
    this.#present[this.#cell(u, v)] = 0;
    if (!this.#directed) {
      this.__cost += 1;
      this.#present[this.#cell(v, u)] = 0;
    }
  }

  hasEdge(u: number, v: number): boolean {
    this.#check(u);
    this.#check(v);
    this.__cost += 1;
    return this.#present[this.#cell(u, v)] === 1;
  }

  weight(u: number, v: number): number | null {
    this.#check(u);
    this.#check(v);
    this.__cost += 1;
    const at = this.#cell(u, v);
    return this.#present[at] === 1 ? (this.#weights[at] as number) : null;
  }

  neighbors(u: number): number[] {
    this.#check(u);
    const found: number[] = [];
    this.__cost += 1;
    // 행 하나를 끝까지 지난다. 계약이 이 행을 `O(n)` 으로 허용한 자리다.
    for (let v = 0; v < this.#n; v++) {
      this.__cost += 1;
      if (this.#present[this.#cell(u, v)] === 1) found.push(v);
    }
    return found;
  }

  vertexCount(): number {
    this.__cost += 1;
    return this.#n;
  }

  #put(u: number, v: number, weight: number): void {
    this.__cost += 1;
    const at = this.#cell(u, v);
    this.#present[at] = 1;
    this.#weights[at] = weight;
  }

  #cell(u: number, v: number): number {
    return u * this.#n + v;
  }

  #check(vertex: number): void {
    if (!Number.isInteger(vertex) || vertex < 0 || vertex >= this.#n) {
      throw new RangeError(
        `정점 번호는 [0, ${this.#n}) 안의 정수여야 한다 — 받은 값은 ${vertex} 이다`,
      );
    }
  }
}
// #endregion
