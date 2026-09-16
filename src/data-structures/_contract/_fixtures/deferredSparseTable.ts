/**
 * 결함 fixture — `range-query/sparseTable` 정본을 그대로 쓰되 **생성자는 받은 수열을 베껴 두기만 하고 첫 질의가 표를 짓는** 구현.
 *
 * 대상 계약: `range-query/sparseTable`.
 *
 * 불변 사실 52 ③(계약이 구성 시점을 정한다)이 막는 계열의 실물이다. 생성자는 자리 수에 비례하는 베끼기뿐이라 구성 상한
 * `O(n log n)` 안이고, 첫 질의 한 번이 표 전부를 지어 자리 수 × 층 수이며, 그 뒤 질의는 정본 그대로 상수다. 답은 전부 옳다(축1
 * 통과). **호출열 평균으로는 정본과 같은 계급이고**(생성자 몫을 첫 질의가 대신 치른다) 단일 호출 최대로만 걸린다 — 헤더 「연산
 * 계약」의 `worst` 근거 둘째 문단이 이 수치를 쓴다.
 *
 * 스위트에서는 질의 시나리오 하나에서만 걸린다. 계측은 이 파일의 몫(베끼는 자리 하나에 1)에 안쪽 정본의 `__cost` 를 더한 것이다
 * (§규약2 계측 단위).
 */

import { SparseTable } from "../../range-query/sparseTable/_reference/sparseTable";

export class DeferredSparseTable {
  readonly #copy: number[];
  readonly #combine: (a: number, b: number) => number;
  readonly #identity: number;
  #inner: SparseTable | null = null;
  #own = 0;

  constructor(
    values: number[],
    combine: (a: number, b: number) => number,
    identity: number,
  ) {
    this.#combine = combine;
    this.#identity = identity;
    this.#copy = new Array<number>(values.length);
    for (let i = 0; i < values.length; i++) {
      this.#own += 1;
      this.#copy[i] = values[i] as number;
    }
  }

  get __cost(): number {
    return this.#own + (this.#inner?.__cost ?? 0);
  }

  query(from: number, to: number): number {
    if (this.#inner === null) {
      this.#inner = new SparseTable(this.#copy, this.#combine, this.#identity);
    }
    return this.#inner.query(from, to);
  }
}
