/**
 * `trie/suffixTree` 정본(규약2).
 *
 * 계약은 `../suffixTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**
 * 이고, 계약이 허용하는 유일한 구현이 아니다. 접미사 링크로 한 번에 훑어 짓는 계열
 * (Ukkonen)도 이 계약을 지킨다 — 그쪽은 $O(n)$ 이라 계약보다 빠르고, 그래서 축3의 성장
 * 계급 판정에서는 이 계약의 정본이 될 수 없다(§규약2).
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드나 칸 하나를 지나가거나 문자 하나를 견줄 때마다
 * 1"* 이다 — **읽기와 쓰기를 따로 세지 않는다.** 축3은 절대 카운트가 아니라 성장률을 보므로
 * 상수 배수가 판정에 들어오지 않기 때문이다(§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의
 * 의무다(불변 사실 23).
 *
 * 구성은 두 단계다. ① 접미사를 사전순으로 늘어놓고 이웃끼리의 공통 접두사 길이를 구한다.
 * ② 그 둘을 왼쪽에서 오른쪽으로 훑으며 트리를 쌓는다. ②가 $O(n)$ 이므로 전체 비용은 ①이
 * 정하고, ①의 순위 배가가 $\Theta(n \log n)$ 이다.
 *
 * `trie/suffixArray` 의 정본과 ①이 같은 방법을 쓴다. **코드를 나눠 쓰지 않는 이유는 계약이
 * 둘이기 때문이다** — 한쪽 정본을 고치면 다른 쪽이 따라 바뀌는 관계를 만들면, 서로 다른 두
 * 계약이 한 구현에 묶여 각자의 계약 스위트가 상대를 검사하게 된다.
 */

/**
 * 트리의 노드.
 *
 * 간선 라벨을 문자열로 들고 있지 않고 `(start, 부모 깊이, 이 노드 깊이)` 로 가리킨다.
 * 라벨을 문자열로 떼어 두면 라벨 길이의 합이 $\Theta(n^2)$ 이 될 수 있다.
 */
// #region guide:core/types
interface Node {
  /** 뿌리에서 이 노드까지의 **문자 수**. 간선 길이의 합이다. */
  depth: number;
  /** 이 노드의 경로 문자열이 나타나는 자리 하나. 간선 라벨을 원문에서 읽는 데 쓴다. */
  start: number;
  /** 간선의 첫 문자(코드 단위) → 자식. */
  children: Map<number, Node>;
  /** 이 노드에서 끝나는 접미사의 시작 위치. 없으면 -1. */
  ends: number;
  /** 서브트리에 담긴 접미사 시작 위치의 수. 곧 이 노드 경로 문자열의 출현 횟수다. */
  occurrences: number;
}

// #endregion

// #region guide:core/class
export class SuffixTree {
  #s: string;
  #root: Node = {
    depth: 0,
    start: 0,
    children: new Map(),
    ends: -1,
    occurrences: 0,
  };

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(s: string) {
    this.#s = s;
    this.#build();
  }

  contains(pattern: string): boolean {
    return this.#locus(pattern) !== null;
  }

  count(pattern: string): number {
    const node = this.#locus(pattern);
    return node === null ? 0 : node.occurrences;
  }

  findAll(pattern: string): number[] {
    const node = this.#locus(pattern);
    if (node === null) return [];
    const found: number[] = [];
    const stack: Node[] = [node];
    while (stack.length > 0) {
      const current = stack.pop() as Node;
      this.__cost += 1;
      if (current.ends >= 0) found.push(current.ends);
      for (const child of current.children.values()) stack.push(child);
    }
    return found;
  }

  /** 자식이 둘 이상이거나 스스로 접미사 끝이면서 자식이 있는 노드 중 가장 깊은 것의 경로. */
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

  /**
   * 패턴을 따라 내려가 그 패턴이 끝나는 노드를 찾는다. 없으면 `null`.
   *
   * 뿌리에서 시작해 **패턴의 문자만큼만** 내려가므로 비용이 $O(m)$ 이다. 색인한 문자열의
   * 길이가 여기 들어오지 않는 것이 이 구조의 계약이다. 패턴이 간선 한가운데에서 끝나면
   * 그 간선의 아래쪽 노드를 돌려준다 — 그 노드의 서브트리가 곧 패턴의 출현 자리 전부다.
   */
  #locus(pattern: string): Node | null {
    let node = this.#root;
    let matched = 0;
    while (matched < pattern.length) {
      this.__cost += 1;
      const child = node.children.get(pattern.charCodeAt(matched));
      if (child === undefined) return null;
      // 간선 라벨은 원문의 `[start + node.depth, start + child.depth)` 구간이다.
      for (
        let at = node.depth;
        at < child.depth && matched < pattern.length;
        at += 1, matched += 1
      ) {
        this.__cost += 1;
        if (
          this.#s.charCodeAt(child.start + at) !== pattern.charCodeAt(matched)
        )
          return null;
      }
      node = child;
    }
    return node;
  }

  /**
   * 사전순으로 늘어놓은 접미사와 이웃끼리의 공통 접두사 길이로 트리를 쌓는다.
   *
   * 접미사를 사전순으로 하나씩 넣으면 **직전에 넣은 접미사와 겹치는 만큼은 이미 만들어져
   * 있다.** 그 길이가 곧 이웃 공통 접두사이므로, 뿌리로 돌아가지 않고 지금 경로에서 그
   * 깊이까지만 되감으면 된다. 되감기의 총량이 쌓기의 총량을 넘지 않아 전체가 $O(n)$ 이다.
   */
  #build(): void {
    const s = this.#s;
    const n = s.length;
    // 뿌리의 경로 문자열은 빈 문자열이고, 빈 문자열은 마지막 자리 n 에서도 시작한다.
    // 잎이 담는 것은 접미사의 시작 `0..n-1` 뿐이라 그 한 자리를 뿌리가 직접 든다.
    this.#root.ends = n;
    if (n === 0) {
      this.#countOccurrences();
      return;
    }

    const sa = this.#sortSuffixes();
    const lcp = this.#neighborLcp(sa);

    // 뿌리에서 지금 자리까지의 경로. 깊이가 증가하는 순서로 쌓인다.
    const path: Node[] = [this.#root];
    for (let k = 0; k < n; k++) {
      this.__cost += 1;
      const shared = k === 0 ? 0 : (lcp[k] as number);

      // ① 겹치는 깊이보다 깊은 노드를 경로에서 떼어 낸다.
      let detached: Node | null = null;
      while ((path[path.length - 1] as Node).depth > shared) {
        this.__cost += 1;
        detached = path.pop() as Node;
      }

      // ② 떼어 낸 자리가 간선 한가운데면 그 자리에 노드를 새로 끼운다.
      const parent = path[path.length - 1] as Node;
      if (detached !== null && parent.depth < shared) {
        const middle: Node = {
          depth: shared,
          start: detached.start,
          children: new Map([
            [s.charCodeAt(detached.start + shared), detached],
          ]),
          ends: -1,
          occurrences: 0,
        };
        parent.children.set(
          s.charCodeAt(detached.start + parent.depth),
          middle,
        );
        path.push(middle);
      }

      // ③ 새 접미사의 잎을 붙인다.
      const top = path[path.length - 1] as Node;
      const start = sa[k] as number;
      const leaf: Node = {
        depth: n - start,
        start,
        children: new Map(),
        ends: start,
        occurrences: 0,
      };
      top.children.set(s.charCodeAt(start + top.depth), leaf);
      path.push(leaf);
    }

    this.#countOccurrences();
  }

  /**
   * 서브트리의 접미사 수를 아래에서 위로 모은다.
   *
   * 재귀를 쓰지 않는다 — 같은 문자가 반복되는 입력에서 트리가 깊이 n 의 사슬이 되므로
   * 호출 스택이 넘친다.
   */
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
      const node = order[i] as Node;
      this.__cost += 1;
      let total = node.ends >= 0 ? 1 : 0;
      for (const child of node.children.values()) total += child.occurrences;
      node.occurrences = total;
    }
  }

  /** 순위 배가. 회차마다 순위 쌍을 정수 키로 보고 세어 담는다. */
  #sortSuffixes(): number[] {
    const n = this.#s.length;
    let sa = this.#byFirstChar();
    let rank = this.#classify(
      sa,
      (a, b) => this.#s.charCodeAt(a) === this.#s.charCodeAt(b),
    );

    for (let k = 1; k < n; k *= 2) {
      if ((rank[sa[n - 1] as number] as number) === n - 1) break;
      const bySecond: number[] = [];
      for (let i = n - k; i < n; i++) bySecond.push(i);
      for (const start of sa) {
        this.__cost += 1;
        if (start >= k) bySecond.push(start - k);
      }
      sa = this.#countingSort(bySecond, (i) => rank[i] as number, n);
      // 순위 쌍을 하나의 정수로 합치지 않는다. 합치면 키가 $n^2$ 규모가 되어 $n$ 이 $10^8$
      // 근처에서 배정밀도 정수 한계를 넘고, 그 순간 순서가 조용히 깨진다. 쌍을 쌍인 채로 견준다.
      const previous = rank;
      const second = (i: number): number =>
        i + k < n ? (previous[i + k] as number) : -1;
      rank = this.#classify(
        sa,
        (a, b) => previous[a] === previous[b] && second(a) === second(b),
      );
    }
    return sa;
  }

  #byFirstChar(): number[] {
    const n = this.#s.length;
    const seen = new Set<number>();
    for (let i = 0; i < n; i++) {
      this.__cost += 1;
      seen.add(this.#s.charCodeAt(i));
    }
    const codes = [...seen].sort((a, b) => a - b);
    this.__cost += codes.length;
    const narrow = new Map<number, number>();
    codes.forEach((code, index) => {
      narrow.set(code, index);
    });
    const items: number[] = [];
    for (let i = 0; i < n; i++) items.push(i);
    return this.#countingSort(
      items,
      (i) => narrow.get(this.#s.charCodeAt(i)) as number,
      codes.length,
    );
  }

  #countingSort(
    items: readonly number[],
    keyOf: (item: number) => number,
    keys: number,
  ): number[] {
    const count = new Array<number>(keys).fill(0);
    for (const item of items) {
      this.__cost += 1;
      count[keyOf(item)] = (count[keyOf(item)] as number) + 1;
    }
    let sum = 0;
    for (let key = 0; key < keys; key++) {
      this.__cost += 1;
      const here = count[key] as number;
      count[key] = sum;
      sum += here;
    }
    const out = new Array<number>(items.length);
    for (const item of items) {
      this.__cost += 1;
      const key = keyOf(item);
      out[count[key] as number] = item;
      count[key] = (count[key] as number) + 1;
    }
    return out;
  }

  #classify(
    sa: readonly number[],
    same: (a: number, b: number) => boolean,
  ): number[] {
    const rank = new Array<number>(this.#s.length).fill(0);
    let next = 0;
    let previous: number | null = null;
    for (const start of sa) {
      this.__cost += 1;
      if (previous !== null && !same(previous, start)) next += 1;
      rank[start] = next;
      previous = start;
    }
    return rank;
  }

  /** 순서에서 이웃한 두 접미사의 최장 공통 접두사 길이(Kasai). */
  #neighborLcp(sa: readonly number[]): number[] {
    const s = this.#s;
    const n = s.length;
    const rank = new Array<number>(n).fill(0);
    sa.forEach((start, at) => {
      rank[start] = at;
    });
    const lcp = new Array<number>(n).fill(0);
    let h = 0;
    for (let i = 0; i < n; i++) {
      this.__cost += 1;
      const r = rank[i] as number;
      if (r === 0) {
        h = 0;
        continue;
      }
      const j = sa[r - 1] as number;
      while (
        i + h < n &&
        j + h < n &&
        s.charCodeAt(i + h) === s.charCodeAt(j + h)
      ) {
        this.__cost += 1;
        h += 1;
      }
      lcp[r] = h;
      if (h > 0) h -= 1;
    }
    return lcp;
  }
}
// #endregion
