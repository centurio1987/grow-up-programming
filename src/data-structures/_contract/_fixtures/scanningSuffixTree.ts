/**
 * 결함 fixture — 트리를 제대로 짓고도 질의에서 원문을 훑는 접미사 트리.
 *
 * 위 fixture(`rootedSuffixTree.ts`)와 **반대쪽에서 걸린다.** 구성은 정본 그대로라 구성
 * 시나리오를 전부 통과하고, 질의만 트리를 내려가는 대신 원문을 앞에서부터 훑는다. 답은
 * 옳으므로 축1·축2를 통과한다.
 *
 * 이 fixture 가 겨누는 것은 이 계약의 중심 문장이다 — *"질의 비용이 색인 크기에 기대지
 * 않는다"*. 그 문장을 빼면 `trie/suffixArray` 의 계약에 담기므로, 이 자리가 두 구조를
 * 가르는 자리이기도 하다.
 */

import { SuffixTree } from "../../trie/suffixTree/_reference/suffixTree";

export class ScanningSuffixTree {
  #s: string;
  #inner: SuffixTree;
  #carried = 0;

  constructor(s: string) {
    this.#s = s;
    this.#inner = new SuffixTree(s);
  }

  get __cost(): number {
    return this.#carried + this.#inner.__cost;
  }

  longestRepeatedSubstring(): string {
    return this.#inner.longestRepeatedSubstring();
  }

  contains(pattern: string): boolean {
    return this.#scan(pattern, true).length > 0;
  }

  count(pattern: string): number {
    return this.#scan(pattern, false).length;
  }

  findAll(pattern: string): number[] {
    return this.#scan(pattern, false);
  }

  /** 원문을 앞에서부터 훑는다. 답은 같고 비용만 다르다. */
  #scan(pattern: string, stopAtFirst: boolean): number[] {
    const s = this.#s;
    const found: number[] = [];
    for (let i = 0; i <= s.length - pattern.length; i++) {
      this.#carried += 1;
      let j = 0;
      while (
        j < pattern.length &&
        s.charCodeAt(i + j) === pattern.charCodeAt(j)
      )
        j += 1;
      if (j === pattern.length) {
        found.push(i);
        if (stopAtFirst) return found;
      }
    }
    return found;
  }
}
