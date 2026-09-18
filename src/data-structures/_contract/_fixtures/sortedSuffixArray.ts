/**
 * 결함 fixture — 접미사를 통째로 견주어 정렬하는 접미사 배열.
 *
 * 진단이 지적한 그 구현이다(`ORDER.md:59`). 접미사 n 개를 언어 내장 정렬에 넘기고, 비교
 * 하나가 두 접미사를 앞에서부터 문자 단위로 견준다. 순서는 **옳다** — 그래서 축1·축2를
 * 전부 통과하고 축3만이 잡는다.
 *
 * **한 시나리오로는 잡히지 않는다.** 비교 하나의 비용이 두 접미사의 공통 접두사 길이인데,
 * 그 길이는 입력에 따라 극과 극이다. 무작위 문자열에서는 평균 상수라 전체가 $O(n\log n)$ 이고
 * **계약을 지킨다.** 같은 문자가 반복되면 비교마다 $\Theta(n)$ 문자를 읽어 $\Theta(n^2\log n)$ 이
 * 된다. 적대성이 계약이 아니라 구현에 대해 정의된다는 것의 사례다(불변 사실 24).
 */

export class SortedSuffixArray {
  #s: string;
  #sa: number[];
  #rank: number[];

  __cost = 0;

  constructor(s: string) {
    this.#s = s;
    this.#sa = Array.from({ length: s.length }, (_, i) => i).sort((a, b) =>
      this.#compareSuffixes(a, b),
    );
    this.#rank = new Array<number>(s.length).fill(0);
    this.#sa.forEach((start, rank) => {
      this.__cost += 1;
      this.#rank[start] = rank;
    });
  }

  at(rank: number): number | null {
    if (!Number.isInteger(rank) || rank < 0 || rank >= this.#sa.length)
      return null;
    this.__cost += 1;
    return this.#sa[rank] as number;
  }

  rankOf(start: number): number | null {
    if (!Number.isInteger(start) || start < 0 || start >= this.#rank.length)
      return null;
    this.__cost += 1;
    return this.#rank[start] as number;
  }

  range(pattern: string): [number, number] {
    return [this.#seek(pattern, 0), this.#seek(pattern, 1)];
  }

  /** 이웃한 접미사끼리 앞에서부터 견주어 가장 긴 겹침을 찾는다. */
  longestRepeatedSubstring(): string {
    let best = 0;
    let at = 0;
    for (let k = 1; k < this.#sa.length; k++) {
      this.__cost += 1;
      const a = this.#sa[k - 1] as number;
      const b = this.#sa[k] as number;
      let h = 0;
      while (
        a + h < this.#s.length &&
        b + h < this.#s.length &&
        this.#s.charCodeAt(a + h) === this.#s.charCodeAt(b + h)
      ) {
        this.__cost += 1;
        h += 1;
      }
      if (h > best) {
        best = h;
        at = a;
      }
    }
    this.__cost += best;
    return this.#s.slice(at, at + best);
  }

  /** 두 접미사를 앞에서부터 문자 단위로 견준다. 여기가 이 fixture 의 결함이 사는 자리다. */
  #compareSuffixes(a: number, b: number): number {
    const s = this.#s;
    const limit = s.length - Math.max(a, b);
    for (let j = 0; j < limit; j++) {
      this.__cost += 1;
      const x = s.charCodeAt(a + j);
      const y = s.charCodeAt(b + j);
      if (x !== y) return x < y ? -1 : 1;
    }
    return a > b ? -1 : 1;
  }

  #seek(pattern: string, after: number): number {
    let lo = 0;
    let hi = this.#sa.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.#compare(this.#sa[mid] as number, pattern) < after) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  #compare(start: number, pattern: string): number {
    const s = this.#s;
    for (let j = 0; j < pattern.length; j++) {
      this.__cost += 1;
      if (start + j >= s.length) return -1;
      const a = s.charCodeAt(start + j);
      const b = pattern.charCodeAt(j);
      if (a !== b) return a < b ? -1 : 1;
    }
    return 0;
  }
}
