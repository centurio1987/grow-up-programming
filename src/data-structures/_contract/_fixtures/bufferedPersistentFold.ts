/**
 * 결함 fixture — `range-query/persistentSegmentTree` 정본을 그대로 쓰되 **갱신을 적어만 두었다가 그 버전(이나 그 버전을
 * 바탕으로 한 버전)을 처음 물을 때 한꺼번에 짓는** 구현.
 *
 * 대상 계약: `range-query/persistentSegmentTree`.
 *
 * 두 행 `worst` 의 근거다(헤더 「연산 계약」 — `range-query/segmentTreeLazy` 의 `bufferedLazyRangeFold` 와 같은 자리).
 * 갱신은 번호를 매기고 (바탕 버전, 자리, 값)을 적기만 해 상수다. 질의가 오면 그 버전에서 이미 지은 조상까지 거슬러
 * 올라가 쌓인 갱신을 오래된 것부터 정본에 넘긴다. 갱신 하나가 정본에서 한 번씩만 지어지므로 **호출열 평균은 정본과 같은
 * 계급**이고, 쌓인 사슬을 처음 묻는 한 호출이 사슬 길이 × 로그다. 답은 전부 옳다(축1 통과).
 *
 * 스위트에서는 질의 시나리오 하나에서만 걸린다. 계측은 안쪽 정본의 `__cost` 에 이 파일의 몫(적기 · 거슬러 오르기 한 번에
 * 1)을 더한 것이다(§규약2 계측 단위).
 */

import { PersistentSegmentTree } from "../../range-query/persistentSegmentTree/_reference/persistentSegmentTree";

export class BufferedPersistentFold {
  readonly #inner: PersistentSegmentTree;
  readonly #size: number;
  /** 버전 `v` 가 정본에서 받은 번호. 아직 안 지었으면 -1. */
  readonly #built: number[] = [0];
  readonly #parent: number[] = [-1];
  readonly #slot: number[] = [-1];
  readonly #value: number[] = [0];
  #own = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#inner = new PersistentSegmentTree(values, combine, identity);
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
    this.#own += 1;
    this.#built.push(-1);
    this.#parent.push(version);
    this.#slot.push(i);
    this.#value.push(value);
    return this.#built.length - 1;
  }

  query(version: number, from: number, to: number): number {
    this.#checkVersion(version);
    const pending: number[] = [];
    for (let at = version; (this.#built[at] as number) < 0; ) {
      this.#own += 1;
      pending.push(at);
      at = this.#parent[at] as number;
    }
    for (let k = pending.length - 1; k >= 0; k--) {
      const at = pending[k] as number;
      const base = this.#built[this.#parent[at] as number] as number;
      this.#built[at] = this.#inner.update(
        base,
        this.#slot[at] as number,
        this.#value[at] as number,
      );
    }
    return this.#inner.query(this.#built[version] as number, from, to);
  }

  #checkVersion(version: number): void {
    if (
      !Number.isInteger(version) ||
      version < 0 ||
      version >= this.#built.length
    ) {
      throw new RangeError(`없는 버전 ${version}`);
    }
  }
}
