/**
 * 결함 fixture — 에지 글자를 문자열로 들고, 쪼개고 합칠 때 새 문자열을 만드는 기수 트리.
 *
 * `src/data-structures/trie/radixTree/_reference/radixTree.ts` 와 **쪼개기·합치기 두 자리만
 * 다르다.** 정본은 에지를 이미 담긴 문자열의 구간으로 들어 두 일을 수 몇 개로 끝내고, 이것은
 * `slice` 와 이어 붙이기로 새 문자열을 만든다. **답은 전부 옳으므로** 축1·축2를 통과한다.
 *
 * 무너지는 자리는 **쪼개질 에지가 길 때**다. 쪼개기가 옮기는 글자 수는 원래 에지의 길이이고 그
 * 길이는 넣는 낱말의 길이 m 과 무관하다 — 길이 L 인 낱말 하나가 선 자리에 그 첫 글자 하나를
 * 넣으면 m = 1 인데 L 글자를 옮긴다. 지워서 다시 합칠 때도 같다. 그래서 이것은 계약의
 * `insert` · `delete` 행(`worst O(m)`)을 **어긴다**(`src/data-structures/trie/ternarySearchTree/ternarySearchTree.ts`
 * 헤더 연산 계약 표).
 *
 * **계약 스위트의 축3이 이것을 잡지 못한다.** 스위트 시나리오의 낱말 길이가 8 로 고정이라 에지도
 * 8 글자를 넘지 않고, 옮기는 글자 수가 상수로 눌린다. 실측과 그 자리를 겨누는 시나리오는
 * `src/data-structures/_contract/runContract.radixTree.test.ts` 에 있다.
 *
 * 계측 단위는 정본과 같다 — 마디 하나에 들어설 때 1, 에지 글자 하나를 견줄 때 1. 여기에 **새로
 * 만든 문자열의 글자 수**를 더한다. 그 글자를 하나씩 옮기는 것이 이 구현이 실제로 하는 일이다.
 */

interface CopyNode {
  label: string;
  children: Map<number, CopyNode>;
  ends: boolean;
}

function labelled(label: string): CopyNode {
  return { label, children: new Map(), ends: false };
}

export class CopySplitRadixTree {
  #root: CopyNode = labelled("");
  #count = 0;

  __cost = 0;

  insert(word: string): void {
    let current = this.#root;
    let at = 0;
    this.__cost += 1;
    while (at < word.length) {
      const code = word.charCodeAt(at);
      const child = current.children.get(code);
      if (child === undefined) {
        const leaf = labelled(this.#copy(word, at, word.length));
        leaf.ends = true;
        current.children.set(code, leaf);
        this.#count += 1;
        return;
      }
      const matched = this.#match(child, word, at);
      this.__cost += 1;
      if (matched === child.label.length) {
        current = child;
        at += matched;
        continue;
      }
      // 앞 조각과 꼬리를 둘 다 새 문자열로 만든다. 꼬리 길이만큼 옮긴다.
      const middle = labelled(this.#copy(child.label, 0, matched));
      child.label = this.#copy(child.label, matched, child.label.length);
      middle.children.set(child.label.charCodeAt(0), child);
      current.children.set(code, middle);
      at += matched;
      if (at === word.length) {
        middle.ends = true;
      } else {
        const leaf = labelled(this.#copy(word, at, word.length));
        leaf.ends = true;
        middle.children.set(word.charCodeAt(at), leaf);
      }
      this.#count += 1;
      return;
    }
    if (current.ends) return;
    current.ends = true;
    this.#count += 1;
  }

  search(word: string): boolean {
    const place = this.#locate(word);
    return place !== null && !place.inside && place.node.ends;
  }

  startsWith(prefix: string): boolean {
    if (prefix.length === 0) return this.#count > 0;
    return this.#locate(prefix) !== null;
  }

  delete(word: string): boolean {
    let parent: CopyNode | null = null;
    let current = this.#root;
    let at = 0;
    this.__cost += 1;
    while (at < word.length) {
      const child = current.children.get(word.charCodeAt(at));
      if (child === undefined) return false;
      if (this.#match(child, word, at) !== child.label.length) return false;
      this.__cost += 1;
      parent = current;
      current = child;
      at += child.label.length;
    }
    if (!current.ends) return false;
    current.ends = false;
    this.#count -= 1;

    if (parent === null) return true;
    if (current.children.size === 0) {
      parent.children.delete(current.label.charCodeAt(0));
      this.__cost += 1;
      if (parent !== this.#root && !parent.ends && parent.children.size === 1) {
        this.#absorb(parent);
      }
    } else if (current.children.size === 1) {
      this.#absorb(current);
    }
    return true;
  }

  wordsWithPrefix(prefix: string): string[] {
    const found: string[] = [];
    const place = this.#locate(prefix);
    if (place === null) return found;
    const reached = place.inside
      ? prefix.slice(0, place.at) + place.node.label
      : prefix;
    this.#collect(place.node, reached, found);
    return found;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  /** `source` 의 구간을 새 문자열로 만든다. 옮긴 글자 수를 센다. */
  #copy(source: string, from: number, to: number): string {
    this.__cost += to - from;
    let out = "";
    for (let at = from; at < to; at++) out += source[at];
    return out;
  }

  #match(child: CopyNode, word: string, at: number): number {
    let matched = 0;
    while (
      matched < child.label.length &&
      at + matched < word.length &&
      child.label.charCodeAt(matched) === word.charCodeAt(at + matched)
    ) {
      this.__cost += 1;
      matched += 1;
    }
    return matched;
  }

  /** 낱말이 끝나지 않고 자식이 하나뿐인 마디를 그 자식과 합친다. 두 글자를 이어 새로 만든다. */
  #absorb(here: CopyNode): void {
    const [only] = here.children.values();
    if (only === undefined) return;
    const joined = here.label + only.label;
    here.label = this.#copy(joined, 0, joined.length);
    here.ends = only.ends;
    here.children = only.children;
  }

  /** `at` 은 접두사가 `node` 로 들어오는 에지 앞까지 소비한 글자 수다. */
  #locate(
    prefix: string,
  ): { node: CopyNode; inside: boolean; at: number } | null {
    let current = this.#root;
    let at = 0;
    this.__cost += 1;
    while (at < prefix.length) {
      const child = current.children.get(prefix.charCodeAt(at));
      if (child === undefined) return null;
      const matched = this.#match(child, prefix, at);
      this.__cost += 1;
      if (at + matched === prefix.length)
        return { node: child, inside: matched < child.label.length, at };
      if (matched < child.label.length) return null;
      current = child;
      at += child.label.length;
    }
    return { node: current, inside: false, at };
  }

  #collect(current: CopyNode, path: string, out: string[]): void {
    this.__cost += 1;
    if (current.ends) out.push(path);
    for (const child of current.children.values())
      this.#collect(child, path + child.label, out);
  }
}
