/**
 * 결함 fixture — 낱말을 사전순 배열에 담는 문자열 집합.
 *
 * 위 fixture(`mapWordSet.ts`)와 **반대쪽에서 걸린다.** 사전순으로 두면 어떤 접두사로
 * 시작하는 낱말들이 **연속 구간**을 이루므로 접두사 질의가 이분 탐색 두 번으로 끝난다.
 * 대신 넣고 지우는 일이 배열의 뒤를 통째로 민다.
 *
 * **이 fixture 가 하나 더 보이는 것이 있다.** 이것은 `search` 에서도 계약을 어긴다 —
 * 이분 탐색이라 $O(m \log n)$ 이고 계약은 $O(m)$ 이다. 그런데 **축3이 그것을 잡지 못한다.**
 * 크기가 4배 오를 때 로그 인수가 바꾸는 비율이 1.2 배뿐이라 허용 구간 안이기 때문이다
 * (§규약2 「로그 인수는 축3의 해상도 아래에 있다」). 계약을 실제로 어기는 구현을 축3이
 * 통과시키는 자리이고, 그 사실을 `runContract.test.ts` 가 고정한다.
 */

export class SortedWordSet {
  #words: string[] = [];

  __cost = 0;

  /** 사전순으로 `word` 가 들어갈 자리. 이분 탐색이라 담긴 수에 log 로 기댄다. */
  #seek(word: string): number {
    let lo = 0;
    let hi = this.#words.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      this.__cost += 1;
      if ((this.#words[mid] as string) < word) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  insert(word: string): void {
    const at = this.#seek(word);
    if (this.#words[at] === word) return;
    // 뒤를 전부 민다. 여기가 이 fixture 의 결함이 사는 자리다.
    this.__cost += this.#words.length - at + 1;
    this.#words.splice(at, 0, word);
  }

  search(word: string): boolean {
    return this.#words[this.#seek(word)] === word;
  }

  delete(word: string): boolean {
    const at = this.#seek(word);
    if (this.#words[at] !== word) return false;
    this.__cost += this.#words.length - at;
    this.#words.splice(at, 1);
    return true;
  }

  startsWith(prefix: string): boolean {
    const at = this.#seek(prefix);
    const found = this.#words[at];
    return found !== undefined && found.startsWith(prefix);
  }

  wordsWithPrefix(prefix: string): string[] {
    const found: string[] = [];
    for (let at = this.#seek(prefix); at < this.#words.length; at++) {
      this.__cost += 1;
      const word = this.#words[at] as string;
      if (!word.startsWith(prefix)) break;
      found.push(word);
    }
    return found;
  }

  size(): number {
    this.__cost += 1;
    return this.#words.length;
  }
}
