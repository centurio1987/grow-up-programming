/**
 * `trie/radixTree` 정본(규약2).
 *
 * 계약은 `../radixTree.ts` 헤더 한 곳이고, 그 계약은 `trie/ternarySearchTree` 의 계약과
 * **같다.** 이 파일은 같은 계약을 **자식이 하나뿐인 자리를 에지 하나로 접는** 기법으로 지키는
 * 구현이다 — 성격 전환의 산출물 넷 중 하나다(§규약1 「성격 전환은 이렇게 적는다」).
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"마디 하나에 들어설 때마다
 * 1, 에지 위의 글자 자리 하나를 지나갈 때마다 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.**
 * 쪼개기·합치기처럼 걸음 없이 이음만 바꾸는 일은 한 번에 1 이다. `__cost` 는 계약이 아니라
 * 정본의 의무다(불변 사실 23).
 *
 * **에지의 글자를 새로 만들지 않고 이미 담긴 문자열의 구간으로 든다.** 이 파일의 요지가 여기다.
 * 에지 하나는 `(source, from, to)` — `source` 의 `from` 번째부터 `to` 번째 앞까지의 글자다.
 * 두 가지를 지킨다.
 *
 * 1. `source.slice(0, to)` 가 뿌리에서 그 마디까지의 경로 글자 전부다.
 * 2. `from` 이 부모 마디까지의 경로 길이다.
 *
 * 그러면 **쪼개기와 합치기가 수 몇 개를 바꾸는 일로 끝난다.** 가운데 자리 k 에서 쪼갤 때 앞
 * 조각은 `(source, from, from + k)` 이고 뒤 조각은 같은 `source` 의 `from` 만 옮긴다. 자식 하나뿐인
 * 마디를 그 자식과 합칠 때는 자식의 `from` 을 부모의 `from` 으로 당긴다 — 1 번 덕분에 자식의
 * `source` 가 부모 에지의 글자도 같은 자리에 들고 있기 때문이다. 넣은 낱말이 나중에 지워져도
 * 그 문자열은 에지가 가리키는 동안 남는다. 그것은 공간이고 계약이 보지 않는다.
 *
 * **꼬리를 문자열로 잘라 새로 만들면 계약을 어긴다**(`../radixTree.ts` 헤더). 쪼갤 때 딸린 꼬리의
 * 길이는 넣는 낱말의 길이 m 과 무관하다 — 긴 낱말 하나가 선 자리에 그 첫 글자만 넣으면 꼬리
 * 전부를 옮긴다. 그 구현이 `src/data-structures/_contract/_fixtures/copySplitRadixTree.ts` 이고
 * 실측은 `src/data-structures/_contract/runContract.radixTree.test.ts` 에 있다.
 *
 * **지운 뒤에도 접힌 모양을 지킨다.** 뿌리가 아닌 마디는 낱말이 끝나거나 자식이 둘 이상이다.
 * 그래서 남은 마디가 전부 어떤 낱말의 경로 위에 있고, `wordsWithPrefix` 가 부분 트리를 돌 때
 * 지나는 마디 수가 답의 낱말 수 w 에 대해 2w + 1 을 넘지 않는다 — 낱말이 끝나지 않는 마디는
 * 갈래가 둘 이상이라 잎보다 적고, 출발 마디 하나만 그 규칙 밖이다.
 */

// #region guide:core/types
interface Node {
  /** 이 마디로 들어오는 에지의 글자는 `source.slice(from, to)` 다. 복사하지 않는다. */
  source: string;
  from: number;
  to: number;
  /** 자식 에지의 첫 문자(코드 단위) → 자식 마디. */
  children: Map<number, Node>;
  /** 뿌리에서 여기까지의 글자가 담긴 낱말인가. */
  ends: boolean;
}

function edge(source: string, from: number, to: number): Node {
  return { source, from, to, children: new Map(), ends: false };
}

/** 접두사를 따라간 결과. `inside` 가 참이면 접두사가 `node` 로 들어오는 에지 가운데서 끝났다. */
interface Place {
  node: Node;
  inside: boolean;
}
// #endregion

// #region guide:core/class
export class RadixTree {
  /** 빈 경로. 빈 낱말은 뿌리의 `ends` 로 담긴다. */
  #root: Node = edge("", 0, 0);
  #count = 0;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  insert(word: string): void {
    let current = this.#root;
    let at = 0;
    this.__cost += 1;
    while (at < word.length) {
      const code = word.charCodeAt(at);
      const child = current.children.get(code);
      if (child === undefined) {
        this.__cost += 1;
        const leaf = edge(word, at, word.length);
        leaf.ends = true;
        current.children.set(code, leaf);
        this.#count += 1;
        return;
      }
      const matched = this.#match(child, word, at);
      this.__cost += 1;
      if (matched === child.to - child.from) {
        current = child;
        at += matched;
        continue;
      }
      // 에지 가운데서 갈렸다. 앞 조각을 새 마디로 세우고 원래 마디를 그 아래로 내린다.
      const middle = this.#split(current, child, matched);
      at += matched;
      if (at === word.length) {
        middle.ends = true;
      } else {
        const leaf = edge(word, at, word.length);
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
    // 뿌리가 아닌 마디는 전부 어떤 낱말의 경로 위에 있다(파일 헤더).
    return this.#locate(prefix) !== null;
  }

  delete(word: string): boolean {
    let parent: Node | null = null;
    let current = this.#root;
    let at = 0;
    this.__cost += 1;
    while (at < word.length) {
      const child = current.children.get(word.charCodeAt(at));
      if (child === undefined) return false;
      const length = child.to - child.from;
      if (this.#match(child, word, at) !== length) return false;
      this.__cost += 1;
      parent = current;
      current = child;
      at += length;
    }
    if (!current.ends) return false;
    current.ends = false;
    this.#count -= 1;

    if (parent === null) return true; // 빈 낱말 — 뿌리는 접지 않는다.
    if (current.children.size === 0) {
      parent.children.delete(current.source.charCodeAt(current.from));
      this.__cost += 1;
      // 떼어 낸 뒤 부모가 낱말 없이 자식 하나만 남았으면 부모를 그 자식과 합친다.
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
    if (place !== null) this.#collect(place.node, found);
    return found;
  }

  /** 에지 `child` 의 글자와 `word` 의 `at` 번째부터를 견주어 맞은 글자 수를 돌려준다. */
  #match(child: Node, word: string, at: number): number {
    const length = child.to - child.from;
    let matched = 0;
    while (
      matched < length &&
      at + matched < word.length &&
      child.source.charCodeAt(child.from + matched) ===
        word.charCodeAt(at + matched)
    ) {
      this.__cost += 1;
      matched += 1;
    }
    return matched;
  }

  /**
   * `parent` 아래의 에지 `child` 를 앞에서 `k` 글자 자리에서 쪼갠다. 새로 선 가운데 마디를
   * 돌려준다. **글자를 옮기지 않는다** — 수 셋을 바꾼다.
   */
  #split(parent: Node, child: Node, k: number): Node {
    this.__cost += 1;
    const middle = edge(child.source, child.from, child.from + k);
    child.from += k;
    middle.children.set(child.source.charCodeAt(child.from), child);
    parent.children.set(middle.source.charCodeAt(middle.from), middle);
    return middle;
  }

  /**
   * 낱말이 끝나지 않고 자식이 하나뿐인 `here` 를 그 자식과 합친다. 자식의 `from` 을 `here` 의
   * `from` 으로 당기고 `here` 의 부모 자리에 자식을 건다. **글자를 옮기지 않는다.**
   *
   * 부모를 따로 들고 있지 않으므로 `here` 의 자리를 비우는 대신 **자식의 내용을 `here` 로
   * 끌어 올린다** — 부모의 표가 가리키는 객체가 그대로이므로 부모를 찾을 필요가 없다.
   */
  #absorb(here: Node): void {
    this.__cost += 1;
    const [only] = here.children.values();
    if (only === undefined) return;
    here.source = only.source;
    here.to = only.to;
    here.ends = only.ends;
    here.children = only.children;
  }

  /** 접두사를 따라간다. 접두사가 어느 마디에도 닿지 않으면 `null`. */
  #locate(prefix: string): Place | null {
    let current = this.#root;
    let at = 0;
    this.__cost += 1;
    while (at < prefix.length) {
      const child = current.children.get(prefix.charCodeAt(at));
      if (child === undefined) return null;
      const length = child.to - child.from;
      const matched = this.#match(child, prefix, at);
      this.__cost += 1;
      if (at + matched === prefix.length)
        return { node: child, inside: matched < length };
      if (matched < length) return null;
      current = child;
      at += length;
    }
    return { node: current, inside: false };
  }

  /** 부분 트리의 낱말을 모은다. 낱말 하나는 끝 마디의 `source` 앞부분이다(파일 헤더 1 번). */
  #collect(current: Node, out: string[]): void {
    this.__cost += 1;
    if (current.ends) out.push(current.source.slice(0, current.to));
    for (const child of current.children.values()) this.#collect(child, out);
  }
}
// #endregion
