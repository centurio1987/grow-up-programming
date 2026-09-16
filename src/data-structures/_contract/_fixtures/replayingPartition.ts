/**
 * 결함 fixture — 합치기 호출을 줄에 적어 두고, **되돌릴 때 마지막 호출을 지운 줄을 처음부터 다시
 * 합쳐** 분할을 새로 세우는 분리 집합.
 *
 * 대상 계약: `disjoint-set/disjointSetRollback`.
 *
 * `disjoint-set/unionFind` 정본(`../../disjoint-set/unionFind/_reference/unionFind.ts`)을 그대로 쓴다 —
 * 합치기·찾기·묻기는 그 정본이 하고, 이 파일은 되돌리기만 붙인다. **답은 전부 옳다**(축1 통과). 계약을
 * 모르는 쪽이 되돌리기를 붙이는 가장 곧은 길이고, 되돌리기 **한 호출**이 원소 수와 남은 합치기 수에
 * 비례한다.
 *
 * - **걸리는 것 — 되돌리기가 든 두 시나리오.** 되돌리기가 없는 시나리오 셋은 `unionFind` 정본의 값을
 *   그대로 내어 통과한다.
 * - 되돌리기가 없는 계약(`unionFind`)에서라면 이 파일은 정본과 같은 구현이다. 되돌리기라는 **한 행**이
 *   이 설계를 계약 밖으로 내보낸다는 것이 이 fixture 가 보이는 것이다.
 *
 * 계측은 안쪽 정본의 `__cost`(버린 정본의 몫까지 이어서)에 이 파일의 몫을 더한 것이다(§규약2 계측
 * 단위) — 되돌리기 한 번에 1, 새로 세우며 지나는 원소 하나에 1 이고, 줄에 적힌 합치기를 다시 부르는
 * 비용은 안쪽 정본이 센다.
 */

import { UnionFind } from "../../disjoint-set/unionFind/_reference/unionFind";

export class ReplayingPartition {
  readonly #n: number;
  #inner: UnionFind;
  /** 합치기 호출 순서대로의 인자. 범위 밖 인자로 던진 호출은 적지 않는다. */
  readonly #calls: [number, number][] = [];
  #own = 0;
  #carried = 0;

  constructor(n: number) {
    this.#inner = new UnionFind(n);
    this.#n = n;
  }

  get __cost(): number {
    return this.#carried + this.#inner.__cost + this.#own;
  }

  find(x: number): number {
    return this.#inner.find(x);
  }

  union(x: number, y: number): void {
    this.#inner.union(x, y);
    this.#calls.push([x, y]);
  }

  connected(x: number, y: number): boolean {
    return this.#inner.connected(x, y);
  }

  rollback(): boolean {
    this.#own += 1;
    if (this.#calls.length === 0) return false;
    this.#calls.pop();
    this.#carried += this.#inner.__cost;
    this.#own += this.#n;
    this.#inner = new UnionFind(this.#n);
    for (const [x, y] of this.#calls) this.#inner.union(x, y);
    return true;
  }
}
