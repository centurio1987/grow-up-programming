/**
 * 결함 fixture — 마디마다 「어느 덩어리인가」를 적어 두고, 바뀔 때마다 다시 적는 숲.
 *
 * `tree/linkCutTree` 계약이 든 반례 둘 중 **뒤쪽**이다. `ScanningForest` 와 정확히
 * 반대편에 선다 — 연결 판정이 상수이고 갱신이 마디 수에 비례한다.
 *
 * **`link` 는 이 fixture 를 걸지 못한다.** 작은 쪽을 다시 적으므로 한 마디가 다시 적히는
 * 횟수가 덩어리 크기가 두 배씩 될 때마다 한 번이고, 그래서 넣기의 시퀀스 평균이 로그 안에
 * 든다. 자명한 구현이라고 해서 모든 행에서 걸리는 것은 아니라는 자리다.
 *
 * **`cut` 에서 걸린다.** 간선을 빼면 어느 쪽이 작은지 미리 알 수 없고, 알아내려면 한쪽을
 * 끝까지 훑어야 한다. 훑은 김에 번호를 새로 적으므로 비용이 그 덩어리 크기에 비례하고,
 * 같은 간선을 뺐다 넣었다 되풀이하면 상각으로도 갚지 못한다 — **빼기는 크기를 반으로
 * 나누는 일이라 「두 배가 될 때까지 기다린다」는 논증이 서지 않는다.**
 */

export class RelabelingForest {
  readonly #n: number;
  /** 마디가 속한 덩어리 번호. */
  readonly #label: number[];
  /** 덩어리 번호마다 그 구성원. 비면 죽은 번호다. */
  readonly #members: Map<number, Set<number>>;
  /** `edges[u]` 는 `u` 에 붙은 마디들. 다시 적기가 이것을 밟는다. */
  readonly #adjacent: Set<number>[];
  #nextLabel: number;

  __cost = 0;

  constructor(n: number) {
    this.#n = n;
    this.#label = Array.from({ length: n }, (_, id) => id);
    this.#members = new Map();
    for (let id = 0; id < n; id++) this.#members.set(id, new Set([id]));
    this.#adjacent = Array.from({ length: n }, () => new Set<number>());
    this.#nextLabel = n;
  }

  link(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    const left = this.#label[u] as number;
    const right = this.#label[v] as number;
    this.__cost += 1;
    if (left === right) return false;

    const leftSide = this.#members.get(left) as Set<number>;
    const rightSide = this.#members.get(right) as Set<number>;
    // 작은 쪽을 다시 적는다. 이것이 넣기를 상각 로그 안에 두는 자리다.
    const [small, smallLabel, big, bigLabel] =
      leftSide.size <= rightSide.size
        ? ([leftSide, left, rightSide, right] as const)
        : ([rightSide, right, leftSide, left] as const);

    for (const id of small) {
      this.__cost += 1;
      this.#label[id] = bigLabel;
      big.add(id);
    }
    this.#members.delete(smallLabel);
    (this.#adjacent[u] as Set<number>).add(v);
    (this.#adjacent[v] as Set<number>).add(u);
    return true;
  }

  cut(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    if (u === v) return false;
    this.__cost += 1;
    if (!(this.#adjacent[u] as Set<number>).has(v)) return false;

    (this.#adjacent[u] as Set<number>).delete(v);
    (this.#adjacent[v] as Set<number>).delete(u);

    // `u` 쪽에 남은 것을 훑어 새 번호로 다시 적는다. 어느 쪽이 작은지 모르므로 고를 수
    // 없고, 훑는 비용이 그 덩어리 크기에 비례한다.
    const fresh = this.#nextLabel++;
    const moved = new Set<number>();
    const pending: number[] = [u];
    moved.add(u);
    while (pending.length > 0) {
      const at = pending.pop() as number;
      this.__cost += 1;
      for (const next of this.#adjacent[at] as Set<number>) {
        if (!moved.has(next)) {
          moved.add(next);
          pending.push(next);
        }
      }
    }

    const old = this.#members.get(this.#label[u] as number) as Set<number>;
    for (const id of moved) {
      this.#label[id] = fresh;
      old.delete(id);
    }
    this.#members.set(fresh, moved);
    return true;
  }

  connected(u: number, v: number): boolean {
    this.#bounds(u);
    this.#bounds(v);
    this.__cost += 1;
    return this.#label[u] === this.#label[v];
  }

  #bounds(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#n) {
      throw new RangeError(
        `마디 번호는 [0, ${this.#n}) 안이어야 한다 — 받은 값은 ${index} 다`,
      );
    }
  }
}
