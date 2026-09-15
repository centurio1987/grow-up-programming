/**
 * 결함 fixture — **살아 있는 구조 하나를 버전 사이로 옮겨 다니는** 구현.
 *
 * 대상 계약: `range-query/persistentSegmentTree`.
 *
 * `range-query/segmentTree` 정본 하나를 지금 가리키는 버전의 수열로 들고, 버전마다 (바탕 버전, 자리, 바탕에서의 값,
 * 이 버전의 값)을 적어 둔다. 다른 버전을 갱신하거나 물으려면 버전 나무에서 지금 버전부터 그 버전까지 길을 따라 걸으며
 * 거슬러 오를 때는 바탕의 값을, 내려갈 때는 이 버전의 값을 안쪽 구조에 다시 쓴다. 옛 버전이 전부 남고 답이 전부 옳다
 * (축1 통과). **한 걸음의 비용이 두 버전의 거리 × 로그**라, 가까운 버전을 이어 쓰는 호출자에게는 정본과 같은 계급이고
 * 먼 버전을 번갈아 쓰는 호출자에게는 사슬 길이에 비례한다.
 *
 * 걸리는 것은 두 시나리오 모두다 — 둘 다 첫 버전과 사슬 끝을 번갈아 가리킨다.
 *
 * 계측은 안쪽 정본의 `__cost` 에 이 파일의 몫(길 위의 버전 하나에 1)을 더한 것이다(§규약2 계측 단위).
 */

import { SegmentTree } from "../../range-query/segmentTree/_reference/segmentTree";

export class RerootingPersistentFold {
  readonly #inner: SegmentTree;
  readonly #size: number;
  readonly #parent: number[] = [-1];
  readonly #depth: number[] = [0];
  readonly #slot: number[] = [-1];
  readonly #before: number[] = [0];
  readonly #after: number[] = [0];
  /** 안쪽 구조가 지금 들고 있는 버전. */
  #at = 0;
  #own = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#inner = new SegmentTree(values, combine, identity);
    this.#size = values.length;
  }

  get __cost(): number {
    return this.#inner.__cost + this.#own;
  }

  update(version: number, i: number, value: number): number {
    this.#checkVersion(version);
    if (!Number.isInteger(i) || i < 0 || i >= this.#size) {
      throw new RangeError(`범위 밖 자리 ${i}`);
    }
    this.#moveTo(version);
    const before = this.#inner.query(i, i + 1);
    this.#inner.update(i, value);
    this.#parent.push(version);
    this.#depth.push((this.#depth[version] as number) + 1);
    this.#slot.push(i);
    this.#before.push(before);
    this.#after.push(value);
    this.#at = this.#parent.length - 1;
    return this.#at;
  }

  query(version: number, from: number, to: number): number {
    this.#checkVersion(version);
    this.#moveTo(version);
    return this.#inner.query(from, to);
  }

  #moveTo(target: number): void {
    let up = this.#at;
    let down = target;
    const descend: number[] = [];
    while ((this.#depth[up] as number) > (this.#depth[down] as number)) {
      this.#undo(up);
      up = this.#parent[up] as number;
    }
    while ((this.#depth[down] as number) > (this.#depth[up] as number)) {
      this.#own += 1;
      descend.push(down);
      down = this.#parent[down] as number;
    }
    while (up !== down) {
      this.#undo(up);
      up = this.#parent[up] as number;
      this.#own += 1;
      descend.push(down);
      down = this.#parent[down] as number;
    }
    for (let k = descend.length - 1; k >= 0; k--) {
      const at = descend[k] as number;
      this.#inner.update(this.#slot[at] as number, this.#after[at] as number);
    }
    this.#at = target;
  }

  #undo(version: number): void {
    this.#own += 1;
    this.#inner.update(
      this.#slot[version] as number,
      this.#before[version] as number,
    );
  }

  #checkVersion(version: number): void {
    if (
      !Number.isInteger(version) ||
      version < 0 ||
      version >= this.#parent.length
    ) {
      throw new RangeError(`없는 버전 ${version}`);
    }
  }
}
