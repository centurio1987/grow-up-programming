/**
 * 결함 fixture — 낱말을 표 하나에 담는 문자열 집합.
 *
 * 낱말이 있는지 묻는 일만 보면 이보다 나은 것이 없다. `insert`·`search`·`delete` 가 낱말
 * 길이에만 기대고 `size` 는 상수다. **답은 전부 옳으므로** 축1·축2를 통과한다.
 *
 * 무너지는 자리는 **접두사**다. 표는 낱말을 통째로 열쇠로 삼으므로 "이 접두사로 시작하는
 * 것"을 물으면 담긴 낱말을 전부 봐야 한다. 명세의 필요충분조건이 *"낱말들이 접두사에 따라
 * 묶여 있어야 한다"* 로 시작하는 이유가 이 fixture 다.
 */

export class MapWordSet {
  #words = new Map<string, true>();

  __cost = 0;

  insert(word: string): void {
    this.__cost += 1;
    this.#words.set(word, true);
  }

  search(word: string): boolean {
    this.__cost += 1;
    return this.#words.has(word);
  }

  delete(word: string): boolean {
    this.__cost += 1;
    return this.#words.delete(word);
  }

  size(): number {
    this.__cost += 1;
    return this.#words.size;
  }

  startsWith(prefix: string): boolean {
    for (const word of this.#words.keys()) {
      this.__cost += 1;
      if (word.startsWith(prefix)) return true;
    }
    return false;
  }

  wordsWithPrefix(prefix: string): string[] {
    const found: string[] = [];
    for (const word of this.#words.keys()) {
      this.__cost += 1;
      if (word.startsWith(prefix)) found.push(word);
    }
    return found;
  }
}
