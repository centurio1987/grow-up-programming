/**
 * 결함 fixture — **바뀐 자리 하나만 적어 두고, 물을 때 조상 버전을 거슬러 그 버전의 수열을 다시 모으는** 구현.
 *
 * 대상 계약: `range-query/persistentSegmentTree`.
 *
 * 자명한 구현이다(헤더 「검증 등급」의 첫째 반례). 버전마다 (바탕 버전, 자리, 값) 셋만 들어 갱신이 상수이고 옛 버전이
 * 전부 남는다. 질의는 그 버전에서 첫 버전까지 거슬러 올라가 쌓인 갱신을 모으고, 구간의 자리를 첫 버전 값으로 채운 뒤
 * 모은 갱신을 오래된 것부터 덮어 쓰고, 왼쪽부터 접는다 — **사슬 길이 + 구간 폭**이다. 답은 전부 옳다(축1 통과).
 *
 * 걸리는 것은 질의 시나리오 하나다. 갱신 시나리오는 상수로 통과한다.
 *
 * 세는 단위는 §규약2 계측 단위 그대로다 — 거슬러 오르는 버전 하나 · 채우는 자리 하나 · 덮어 쓰는 갱신 하나에 1,
 * 주입된 결합 한 번에 1.
 */

export class ReplayingPersistentFold {
  readonly #base: number[];
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  /** 버전 `v` 의 바탕 버전. 첫 버전은 -1. */
  readonly #parent: number[] = [-1];
  readonly #slot: number[] = [-1];
  readonly #value: number[] = [0];

  __cost = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#combine = combine;
    this.#identity = identity;
    this.#base = new Array<number>(values.length);
    for (let i = 0; i < values.length; i++) {
      this.__cost += 1;
      this.#base[i] = values[i] as number;
    }
  }

  update(version: number, i: number, value: number): number {
    this.#checkVersion(version);
    if (!Number.isInteger(i) || i < 0 || i >= this.#base.length) {
      throw new RangeError(`범위 밖 자리 ${i}`);
    }
    this.__cost += 1;
    this.#parent.push(version);
    this.#slot.push(i);
    this.#value.push(value);
    return this.#parent.length - 1;
  }

  query(version: number, from: number, to: number): number {
    this.#checkVersion(version);
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to > this.#base.length ||
      from > to
    ) {
      throw new RangeError(`범위 밖 구간 [${from}, ${to})`);
    }
    const trail: number[] = [];
    for (let at = version; at > 0; at = this.#parent[at] as number) {
      this.__cost += 1;
      trail.push(at);
    }
    const window = new Array<number>(to - from);
    for (let at = from; at < to; at++) {
      this.__cost += 1;
      window[at - from] = this.#base[at] as number;
    }
    for (let k = trail.length - 1; k >= 0; k--) {
      this.__cost += 1;
      const at = trail[k] as number;
      const slot = this.#slot[at] as number;
      if (slot >= from && slot < to)
        window[slot - from] = this.#value[at] as number;
    }
    let acc = this.#identity;
    for (const value of window) {
      this.__cost += 1;
      acc = this.#combine(acc, value);
    }
    return acc;
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
