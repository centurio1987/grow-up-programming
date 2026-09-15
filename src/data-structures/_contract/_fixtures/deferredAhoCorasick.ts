/**
 * 결함 fixture — `trie/ahoCorasick` 정본을 그대로 쓰되 **생성자는 받은 패턴 목록을 베껴 두기만 하고 첫 검색이 색인을 짓는** 구현.
 *
 * 대상 계약: `trie/ahoCorasick`.
 *
 * 불변 사실 52 ③(계약이 구성 시점을 정한다)이 막는 계열의 실물이고, `range-query/sparseTable` 의 `deferredSparseTable.ts` 와 같은
 * 모양이다. 생성자는 패턴 수에 비례하는 베끼기뿐이라 구성 상한 안이고, 첫 검색 한 번이 색인 전부를 지으며, 그 뒤 검색은 정본
 * 그대로다. 답은 전부 옳다(축1 통과). **호출열 평균으로는 정본과 같은 계급이고**(생성자 몫을 첫 검색이 대신 치른다) 단일 호출
 * 최대로만 걸린다 — 헤더 「연산 계약」의 `worst` 근거가 이 수치를 쓴다.
 *
 * 계측은 이 파일의 몫(베끼는 칸 하나에 1)에 안쪽 정본의 `__cost` 를 더한 것이다(§규약2 계측 단위).
 */

import { AhoCorasick } from "../../trie/ahoCorasick/_reference/ahoCorasick";

export class DeferredAhoCorasick {
  readonly #copy: string[];
  #inner: AhoCorasick | null = null;
  #own = 0;

  constructor(patterns: string[]) {
    this.#copy = new Array<string>(patterns.length);
    for (let i = 0; i < patterns.length; i++) {
      this.#own += 1;
      this.#copy[i] = patterns[i] as string;
    }
  }

  get __cost(): number {
    return this.#own + (this.#inner?.__cost ?? 0);
  }

  search(text: string): Map<string, number[]> {
    if (this.#inner === null) this.#inner = new AhoCorasick(this.#copy);
    return this.#inner.search(text);
  }
}
