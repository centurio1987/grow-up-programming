/**
 * 결함 fixture — `range-query/segmentTree` 정본을 **제자리에서 고치고 버전 번호만 세는** 구현.
 *
 * 대상 계약: `range-query/persistentSegmentTree`.
 *
 * 불변 사실 67 의 판별 절차(`docs/ORD-006-conventions.md` 「공간 제약이 계약에 들어오는 자리」) 셋째 걸음의 실물이다 —
 * **옛 버전을 들고 있지 않는 구현을 축1이 갈라내는가.** 갱신은 바탕 버전 번호를 검사만 하고 하나뿐인 수열을 고치며,
 * 질의는 버전 번호를 검사만 하고 지금 수열을 접는다. 버전이 한 줄로만 쌓이고 늘 마지막 버전을 묻는 호출자에게는 답이
 * 옳다. 계측은 안쪽 정본 그대로라 **축3 두 시나리오를 정본과 같은 계급으로 통과하고 걸리는 축이 축1 하나다.**
 *
 * `range-query/segmentTree` 계약을 지키는 구현이 이쪽 계약을 못 지킨다는 반례이기도 하다(헤더 「목적」).
 */

import { SegmentTree } from "../../range-query/segmentTree/_reference/segmentTree";

export class LatestOnlyPersistentFold {
  readonly #inner: SegmentTree;
  #versions = 1;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#inner = new SegmentTree(values, combine, identity);
  }

  get __cost(): number {
    return this.#inner.__cost;
  }

  update(version: number, i: number, value: number): number {
    this.#check(version);
    this.#inner.update(i, value);
    this.#versions += 1;
    return this.#versions - 1;
  }

  query(version: number, from: number, to: number): number {
    this.#check(version);
    return this.#inner.query(from, to);
  }

  #check(version: number): void {
    if (
      !Number.isInteger(version) ||
      version < 0 ||
      version >= this.#versions
    ) {
      throw new RangeError(`없는 버전 ${version}`);
    }
  }
}
