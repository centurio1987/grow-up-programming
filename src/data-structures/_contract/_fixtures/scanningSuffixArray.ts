/**
 * 결함 fixture — 색인을 제대로 짓고도 질의에서 원문을 훑는 접미사 배열.
 *
 * 위 fixture(`sortedSuffixArray.ts`)와 **반대쪽에서 걸린다.** 구성은 정본 그대로라 구성
 * 시나리오를 전부 통과하고, `range` 만 이분 탐색 대신 순위를 0 부터 밟아 내려간다. 답은
 * 옳으므로 축1·축2를 통과한다.
 *
 * 이 fixture 가 겨누는 것은 필요충분조건의 비용 조건 뒷문장이다 — *"질의가 색인 크기에
 * 선형이면 색인을 지어 놓고도 원문을 훑는 것"*. 정렬된 순서를 들고 있으면서 그 순서를
 * 쓰지 않으면 색인은 자리만 차지한다.
 *
 * 구성부를 다시 적지 않고 정본을 그대로 감싼 이유는, 시나리오가 무엇을 **혼자** 잡는지가
 * 이 fixture 의 목적이기 때문이다. 구성까지 따로 쓰면 실패가 어디서 왔는지가 흐려진다.
 */

import { SuffixArray } from "../../trie/suffixArray/_reference/suffixArray";

export class ScanningSuffixArray {
  #s: string;
  #inner: SuffixArray;
  #carried = 0;

  constructor(s: string) {
    this.#s = s;
    this.#inner = new SuffixArray(s);
  }

  get __cost(): number {
    return this.#carried + this.#inner.__cost;
  }

  at(rank: number): number | null {
    return this.#inner.at(rank);
  }

  rankOf(start: number): number | null {
    return this.#inner.rankOf(start);
  }

  longestRepeatedSubstring(): string {
    return this.#inner.longestRepeatedSubstring();
  }

  /** 순위를 앞에서부터 하나씩 밟는다. 답은 같고 비용만 다르다. */
  range(pattern: string): [number, number] {
    const n = this.#s.length;
    let lo = 0;
    while (lo < n && this.#compare(this.#inner.at(lo) as number, pattern) < 0)
      lo += 1;
    let hi = lo;
    while (hi < n && this.#compare(this.#inner.at(hi) as number, pattern) === 0)
      hi += 1;
    return [lo, hi];
  }

  #compare(start: number, pattern: string): number {
    const s = this.#s;
    for (let j = 0; j < pattern.length; j++) {
      this.#carried += 1;
      if (start + j >= s.length) return -1;
      const a = s.charCodeAt(start + j);
      const b = pattern.charCodeAt(j);
      if (a !== b) return a < b ? -1 : 1;
    }
    return 0;
  }
}
