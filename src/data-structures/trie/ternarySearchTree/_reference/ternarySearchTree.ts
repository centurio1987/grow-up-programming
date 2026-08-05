/**
 * `trie/ternarySearchTree` 정본(규약2).
 *
 * 계약은 `../ternarySearchTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현
 * **하나**이고, 계약이 허용하는 유일한 구현이 아니다 — 자식을 표로 들고 있는 구현도 같은
 * 계약을 지킨다. **계약이 이 표현을 지목하지 못한다는 것이 이 구조의 판정이었다**(헤더 첫
 * 문단). 그래서 정본을 삼분 표현으로 두는 것은 계약이 시킨 일이 아니라, 이름이 가리키는
 * 표현을 실물로 남겨 가이드가 그것을 다룰 수 있게 하려는 것이다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 *"노드 하나를 지나갈 때마다 1"* 이다 — **읽기와 쓰기를
 * 따로 세지 않는다**(§규약2 계측 단위). `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * 자식 셋의 뜻이 서로 다르다. 왼쪽·오른쪽은 **같은 자리의 다른 문자**로 가고, 가운데만
 * **다음 자리**로 간다. 그래서 낱말 하나를 따라가는 동안 가운데 링크를 정확히 m 번 지나고,
 * 자리마다 그 자리에 실제로 쓰인 문자들 사이를 견주며 옆으로 움직인다.
 *
 * **옆으로 움직이는 몫을 감추지 않는다.** 이 구현의 좌우 링크는 **균형을 잡지 않는 이진
 * 탐색 트리**다 — 회전이 없으므로 문자가 정렬된 순서로 들어오면 그 자리의 사슬이 한 줄이
 * 된다. 자리마다 최악 걸음이 그 자리에 쓰인 문자 가짓수만큼이고, 그것이 코드 단위 가짓수
 * $\sigma$ 로 유계다. **계약의 `worst O(m)` 은 $\sigma$ 를 상수로 접은 모형 위의 값**이고
 * (계약 헤더 맨 앞), 이 정본도 그 모형 위에서만 그 상한이다. 축3이 재는 것은 **담긴 낱말
 * 수 n 에 대한 성장**이므로 이 몫은 거기 들어오지 않는다.
 *
 * **`insert` 는 트리를 두 번 훑는다.** 먼저 `search` 로 이미 있는지 보고, 없을 때만 `#put`
 * 으로 다시 내려가며 `words` 를 올린다. 한 번에 끝내는 구현도 있지만 그러면 「이미 있으면
 * 아무것도 하지 않는다」를 되돌리는 일이 `#put` 안으로 들어온다. 상수 배수를 내주고 두
 * 갈래를 갈라 둔 선택이고, 실측의 절대값(연산당 24.81)에 그 두 번이 들어 있다.
 */

// #region guide:core/types
interface Node {
  /** 이 노드가 맡은 문자(코드 단위). */
  code: number;
  /** 같은 자리의 더 작은 문자. */
  left: Node | null;
  /** 다음 자리. 이 링크만 낱말을 한 글자 전진시킨다. */
  mid: Node | null;
  /** 같은 자리의 더 큰 문자. */
  right: Node | null;
  /** 여기서 끝나는 낱말이 있는가. */
  ends: boolean;
  /** 이 노드를 뿌리로 하는 부분 트리에 담긴 낱말 수. 지운 자리를 건너뛰는 데 쓴다. */
  words: number;
}

function node(code: number): Node {
  return { code, left: null, mid: null, right: null, ends: false, words: 0 };
}

// #endregion

// #region guide:core/class
export class TernarySearchTree {
  #root: Node | null = null;
  /** 빈 낱말은 문자가 없어 트리에 자리가 없다. 따로 든다. */
  #hasEmpty = false;
  #count = 0;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  insert(word: string): void {
    if (this.search(word)) return;
    if (word.length === 0) {
      this.#hasEmpty = true;
      this.#count += 1;
      return;
    }
    this.#root = this.#put(this.#root, word, 0);
    this.#count += 1;
  }

  search(word: string): boolean {
    if (word.length === 0) return this.#hasEmpty;
    const found = this.#locate(word);
    return found !== null && found.ends;
  }

  startsWith(prefix: string): boolean {
    if (prefix.length === 0) return this.#count > 0;
    const found = this.#locate(prefix);
    if (found === null) return false;
    return found.ends || (found.mid !== null && found.mid.words > 0);
  }

  delete(word: string): boolean {
    if (!this.search(word)) return false;
    if (word.length === 0) {
      this.#hasEmpty = false;
      this.#count -= 1;
      return true;
    }
    this.#unset(this.#root, word, 0);
    this.#count -= 1;
    return true;
  }

  wordsWithPrefix(prefix: string): string[] {
    const found: string[] = [];
    if (prefix.length === 0) {
      if (this.#hasEmpty) found.push("");
      this.#collect(this.#root, "", found);
      return found;
    }
    const at = this.#locate(prefix);
    if (at === null) return found;
    if (at.ends) found.push(prefix);
    this.#collect(at.mid, prefix, found);
    return found;
  }

  size(): number {
    this.__cost += 1;
    return this.#count;
  }

  /**
   * 접두사가 끝나는 노드. 없으면 `null`.
   *
   * 가운데 링크만 자리를 전진시키므로 이 걸음의 수는 **접두사 길이 + 자리마다 옆으로
   * 움직인 횟수**다. 옆으로 움직이는 횟수는 그 자리에 쓰인 문자 가짓수에 기대고, 그
   * 가짓수는 언어가 정한 코드 단위 수로 유계라 담긴 낱말 수 n 이 들어오지 않는다.
   */
  #locate(word: string): Node | null {
    let current = this.#root;
    let at = 0;
    while (current !== null) {
      this.__cost += 1;
      const code = word.charCodeAt(at);
      if (code < current.code) current = current.left;
      else if (code > current.code) current = current.right;
      else if (at + 1 === word.length) return current;
      else {
        current = current.mid;
        at += 1;
      }
    }
    return null;
  }

  /** 낱말을 넣으며 지나간 노드마다 부분 트리 낱말 수를 하나 올린다. */
  #put(current: Node | null, word: string, at: number): Node {
    const code = word.charCodeAt(at);
    const here = current ?? node(code);
    this.__cost += 1;
    here.words += 1;
    if (code < here.code) here.left = this.#put(here.left, word, at);
    else if (code > here.code) here.right = this.#put(here.right, word, at);
    else if (at + 1 === word.length) here.ends = true;
    else here.mid = this.#put(here.mid, word, at + 1);
    return here;
  }

  /**
   * 낱말 표시를 지우고 지나간 노드마다 부분 트리 낱말 수를 하나 내린다.
   *
   * 노드를 실제로 떼어 내지는 않는다. 계약이 공간을 말하지 않으므로 그래도 계약을 지키고,
   * 낱말 수가 0 이 된 부분 트리는 `#collect` 가 건너뛰므로 훑기 비용에도 들어오지 않는다.
   * **공간은 남는다** — 그 사실은 계약이 아니라 가이드가 다룬다.
   */
  #unset(current: Node | null, word: string, at: number): void {
    if (current === null) return;
    this.__cost += 1;
    const code = word.charCodeAt(at);
    if (code < current.code) {
      current.words -= 1;
      this.#unset(current.left, word, at);
    } else if (code > current.code) {
      current.words -= 1;
      this.#unset(current.right, word, at);
    } else {
      current.words -= 1;
      if (at + 1 === word.length) current.ends = false;
      else this.#unset(current.mid, word, at + 1);
    }
  }

  /** 부분 트리의 낱말을 모은다. 낱말이 하나도 없는 가지는 지나가지 않는다. */
  #collect(current: Node | null, prefix: string, out: string[]): void {
    if (current === null || current.words === 0) return;
    this.__cost += 1;
    this.#collect(current.left, prefix, out);
    const here = prefix + String.fromCharCode(current.code);
    if (current.ends) out.push(here);
    this.#collect(current.mid, here, out);
    this.#collect(current.right, prefix, out);
  }
}
// #endregion
