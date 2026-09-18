/**
 * 결함 fixture — 접미사를 하나씩 뿌리부터 내려가며 넣는 접미사 트리.
 *
 * 진단이 지적한 그 구현이다(`ORDER.md:60`). 트리 모양은 **옳다** — 그래서 축1·축2를 전부
 * 통과하고 축3만이 잡는다. 무너지는 자리는 넣는 자리를 찾는 방법이다. 접미사 하나를 넣을
 * 때마다 뿌리로 돌아가므로, 이미 넣은 것과 겹치는 만큼을 매번 다시 내려간다.
 *
 * **한 시나리오로는 잡히지 않는다.** 무작위 문자열에서는 겹치는 길이가 평균 $O(\log n)$ 이라
 * 전체가 $O(n\log n)$ 이고 **계약을 지킨다.** 같은 문자가 반복되면 i 번째 접미사가 i 만큼
 * 내려가 $\Theta(n^2)$ 이 된다(불변 사실 24).
 */

interface Node {
  depth: number;
  start: number;
  children: Map<number, Node>;
  ends: number;
  occurrences: number;
}

function node(depth: number, start: number, ends: number): Node {
  return { depth, start, children: new Map(), ends, occurrences: 0 };
}

export class RootedSuffixTree {
  #s: string;
  #root: Node = node(0, 0, 0);

  __cost = 0;

  constructor(s: string) {
    this.#s = s;
    this.#root.ends = s.length;
    for (let start = 0; start < s.length; start++) this.#insert(start);
    this.#countOccurrences();
  }

  contains(pattern: string): boolean {
    return this.#locus(pattern) !== null;
  }

  count(pattern: string): number {
    const found = this.#locus(pattern);
    return found === null ? 0 : found.occurrences;
  }

  findAll(pattern: string): number[] {
    const found = this.#locus(pattern);
    if (found === null) return [];
    const out: number[] = [];
    const stack: Node[] = [found];
    while (stack.length > 0) {
      const current = stack.pop() as Node;
      this.__cost += 1;
      if (current.ends >= 0) out.push(current.ends);
      for (const child of current.children.values()) stack.push(child);
    }
    return out;
  }

  longestRepeatedSubstring(): string {
    let best: Node | null = null;
    const stack: Node[] = [this.#root];
    while (stack.length > 0) {
      const current = stack.pop() as Node;
      this.__cost += 1;
      if (
        current.depth > 0 &&
        current.occurrences >= 2 &&
        (best === null || current.depth > best.depth)
      )
        best = current;
      for (const child of current.children.values()) stack.push(child);
    }
    if (best === null) return "";
    this.__cost += best.depth;
    return this.#s.slice(best.start, best.start + best.depth);
  }

  /** 뿌리에서 다시 내려가며 접미사 하나를 넣는다. 여기가 이 fixture 의 결함이 사는 자리다. */
  #insert(start: number): void {
    const s = this.#s;
    const n = s.length;
    let current = this.#root;
    let at = start;

    for (;;) {
      if (at >= n) {
        current.ends = start;
        return;
      }
      const child = current.children.get(s.charCodeAt(at));
      if (child === undefined) {
        current.children.set(
          s.charCodeAt(at),
          node(current.depth + (n - at), start, start),
        );
        return;
      }

      let along = current.depth;
      while (
        along < child.depth &&
        at < n &&
        s.charCodeAt(child.start + along) === s.charCodeAt(at)
      ) {
        this.__cost += 1;
        along += 1;
        at += 1;
      }
      if (along === child.depth) {
        current = child;
        continue;
      }

      const middle = node(along, child.start, -1);
      middle.children.set(s.charCodeAt(child.start + along), child);
      current.children.set(s.charCodeAt(child.start + current.depth), middle);
      if (at >= n) middle.ends = start;
      else
        middle.children.set(
          s.charCodeAt(at),
          node(middle.depth + (n - at), start, start),
        );
      return;
    }
  }

  #locus(pattern: string): Node | null {
    let current = this.#root;
    let matched = 0;
    while (matched < pattern.length) {
      this.__cost += 1;
      const child = current.children.get(pattern.charCodeAt(matched));
      if (child === undefined) return null;
      for (
        let along = current.depth;
        along < child.depth && matched < pattern.length;
        along += 1, matched += 1
      ) {
        this.__cost += 1;
        if (
          this.#s.charCodeAt(child.start + along) !==
          pattern.charCodeAt(matched)
        )
          return null;
      }
      current = child;
    }
    return current;
  }

  #countOccurrences(): void {
    const order: Node[] = [];
    const stack: Node[] = [this.#root];
    while (stack.length > 0) {
      const current = stack.pop() as Node;
      this.__cost += 1;
      order.push(current);
      for (const child of current.children.values()) stack.push(child);
    }
    for (let i = order.length - 1; i >= 0; i--) {
      const current = order[i] as Node;
      this.__cost += 1;
      let total = current.ends >= 0 ? 1 : 0;
      for (const child of current.children.values()) total += child.occurrences;
      current.occurrences = total;
    }
  }
}
