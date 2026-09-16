/**
 * 결함 fixture — 구간 갱신을 줄에 쌓아 두기만 하다가 **질의가 오면 쌓인 것을 한꺼번에**
 * `range-query/segmentTreeLazy` 정본에 적용하는 구현.
 *
 * 대상 계약: `range-query/segmentTreeLazy`.
 *
 * 정본(`../../range-query/segmentTreeLazy/_reference/segmentTreeLazy.ts`)을 그대로 쓰고 갱신만 미룬다. 자명한
 * 구현이 아니고 **답은 전부 옳다**(축1 통과 — 질의가 먼저 비우므로 밖에서 보이는 상태가 정본과 같다).
 *
 * **이 fixture 는 계약이 두 행을 `worst` 로 적어 추가로 배제하는 계열을 재려고 지었다**(§규약1 「강한
 * 한정자의 근거는 추가로 배제되는 계열을 수치로 낸다」 · `_contract/_fixtures/flushingIntegerSet.ts` 와 같은
 * 모양). 쌓인 갱신 하나가 정본에 들어가는 일은 평생 한 번이므로 **호출열 전체의 평균은 정본과 같은 계급**이다.
 *
 * - **걸리는 것 — 갱신을 쌓아 둔 뒤 묻는 질의 시나리오.** 첫 질의 하나가 쌓인 n 개를 한꺼번에 적용한다.
 * - 갱신 시나리오는 통과한다(갱신 자체는 줄에 붙이기라 상수다).
 *
 * 계측은 정본의 `__cost` 에 이 파일이 줄에 붙인 횟수를 더한 것이다(§규약2 계측 단위 — 줄의 칸 하나에 1).
 */

import { SegmentTreeLazy } from "../../range-query/segmentTreeLazy/_reference/segmentTreeLazy";

export class BufferedLazyRangeFold {
  readonly #inner: SegmentTreeLazy;
  readonly #size: number;
  readonly #pending: [number, number, number][] = [];
  #own = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
    act: (update: number, value: number, count: number) => number,
    compose: (later: number, earlier: number) => number,
  ) {
    this.#inner = new SegmentTreeLazy(values, combine, identity, act, compose);
    this.#size = values.length;
  }

  get __cost(): number {
    return this.#inner.__cost + this.#own;
  }

  apply(from: number, to: number, update: number): void {
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > this.#size ||
      from > to
    ) {
      throw new RangeError(`구간 [${from}, ${to})`);
    }
    this.#own += 1;
    this.#pending.push([from, to, update]);
  }

  query(from: number, to: number): number {
    for (const [l, r, update] of this.#pending) this.#inner.apply(l, r, update);
    this.#pending.length = 0;
    return this.#inner.query(from, to);
  }
}
