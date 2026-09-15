/**
 * 결함 fixture — `range-query/segmentTree` 정본(자리 하나 바꾸기 · 임의 구간 접기)에 **구간 갱신을 자리
 * 하나씩의 바꾸기로 풀어** 붙인 구현.
 *
 * 대상 계약: `range-query/segmentTreeLazy`.
 *
 * `docs/ORD-006-conventions.md` B19 표의 `segmentTree` ↔ `segmentTreeLazy` 행 — 「단일 갱신만 하는 구현은 구간
 * 갱신이 $O(k\log n)$ 이다」 — 의 실물이다. 답은 전부 옳다(축1 통과). 폭 `k` 의 구간 갱신이 자리마다 그 자리
 * 값을 묻고(`query(i, i + 1)`) 새 값으로 바꾸므로(`update`) 로그 두 번씩 `k` 번이다. 질의는 정본 그대로라
 * 로그다 — **걸리는 것은 갱신 시나리오 하나다.**
 *
 * 계측은 안쪽 정본의 `__cost` 에 이 파일의 몫(자리 하나에 1 · `act` 호출 하나에 1)을 더한 것이다(§규약2
 * 계측 단위).
 */

import { SegmentTree } from "../../range-query/segmentTree/_reference/segmentTree";

export class PointwiseLazyRangeFold {
  readonly #inner: SegmentTree;
  readonly #act: (update: number, value: number, count: number) => number;
  #own = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
    act: (update: number, value: number, count: number) => number,
    _compose: (later: number, earlier: number) => number,
  ) {
    this.#inner = new SegmentTree(values, combine, identity);
    this.#act = act;
  }

  get __cost(): number {
    return this.#inner.__cost + this.#own;
  }

  apply(from: number, to: number, update: number): void {
    // 범위 검사는 안쪽 정본의 질의에 맡긴다 — 같은 경계 규칙이다.
    this.#inner.query(from, to);
    for (let at = from; at < to; at++) {
      this.#own += 2;
      const value = this.#inner.query(at, at + 1);
      this.#inner.update(at, this.#act(update, value, 1));
    }
  }

  query(from: number, to: number): number {
    return this.#inner.query(from, to);
  }
}
