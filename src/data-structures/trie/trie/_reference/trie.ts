/**
 * `trie/trie` 정본(규약2).
 *
 * 계약은 `../trie.ts` 헤더 한 곳이고, 그 계약은 `trie/ternarySearchTree` 의 계약과 **같다.** 이
 * 파일은 같은 계약을 다른 기법으로 지키는 구현이다 — 성격 전환의 산출물 넷 중 하나이고
 * (§규약1 「성격 전환은 이렇게 적는다」), 이름을 남겨 둔 이유가 바로 이 파일이 저쪽과 다르다는
 * 것이다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — *"마디 하나를 지나갈 때마다
 * 1"* 이고, **읽기와 쓰기를 따로 세지 않는다.** 뿌리를 뺀 마디 하나가 글자 자리 하나이므로
 * 이 단위가 곧 「지나간 글자 자리 수 + 1」이다. `__cost` 는 계약이 아니라 정본의 의무다
 * (불변 사실 23).
 *
 * **마디 하나가 글자 자리 하나이고, 다음 자리로 가는 길을 표에서 찾는다.** 삼분 정본이 자리마다
 * 그 자리에 쓰인 문자들 사이를 옆으로 견주며 움직이는 자리가 여기서는 **표를 한 번 찾는 일**
 * 이다. 그래서 낱말 하나를 따라가는 걸음이 정확히 낱말 길이 + 1 이고, 옆걸음이 없다.
 *
 * **표는 언어의 `Map` 이고, 한 번 찾기를 걸음 하나로 센다.** 코드 단위가 $\sigma$ 가짓수로
 * 유계이므로 크기 $\sigma$ 의 직접 주소 표로 바꿔도 걸음 수가 같고 자리만 더 쓴다. 그 교환은
 * 공간이라 계약이 보지 않는다(§규약1 「공간은 어느 계약에도 없다」). 계약의 검증 등급은 이
 * 파일이 아니라 계약 헤더의 판정에 서 있다.
 *
 * **지운 낱말의 가지를 떼어 낸다.** 삼분 정본은 마디를 남기고 부분 트리 낱말 수로 건너뛰는데,
 * 이 정본은 지운 끝에서 뿌리 쪽으로 올라가며 낱말도 자식도 없는 마디를 표에서 뺀다. 그래서
 * **남은 마디는 전부 어떤 낱말의 경로 위에 있고**, `startsWith` 가 마디를 찾은 것만으로 답이
 * 되고 `wordsWithPrefix` 가 찾아간 부분 트리를 전부 돌아도 답의 길이 합을 넘지 않는다. 두
 * 선택 다 계약을 지키고 계약이 둘을 가르지 못한다 — 계약이 말하는 상태는 담긴 낱말의 모음이지
 * 담는 모양이 아니다(불변 사실 79).
 */

// #region guide:core/types
interface Node {
  /** 다음 자리의 문자(코드 단위) → 그 자리의 마디. */
  children: Map<number, Node>;
  /** 뿌리에서 여기까지의 글자가 담긴 낱말인가. */
  ends: boolean;
}

function node(): Node {
  return { children: new Map(), ends: false };
}
// #endregion

// #region guide:core/class
export class Trie {
  /** 빈 경로. 빈 낱말은 뿌리의 `ends` 로 담긴다. */
  #root: Node = node();
  #count = 0;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  insert(word: string): void {
    let current = this.#root;
    this.__cost += 1;
    for (let at = 0; at < word.length; at++) {
      const code = word.charCodeAt(at);
      let next = current.children.get(code);
      if (next === undefined) {
        next = node();
        current.children.set(code, next);
      }
      current = next;
      this.__cost += 1;
    }
    if (current.ends) return;
    current.ends = true;
    this.#count += 1;
  }

  search(word: string): boolean {
    return this.#locate(word)?.ends === true;
  }

  startsWith(prefix: string): boolean {
    if (prefix.length === 0) return this.#count > 0;
    // 떼어 낸 가지가 없으므로 뿌리가 아닌 마디는 전부 어떤 낱말의 경로 위에 있다.
    return this.#locate(prefix) !== null;
  }

  delete(word: string): boolean {
    const path: Node[] = [this.#root];
    this.__cost += 1;
    let current = this.#root;
    for (let at = 0; at < word.length; at++) {
      const next = current.children.get(word.charCodeAt(at));
      if (next === undefined) return false;
      current = next;
      path.push(current);
      this.__cost += 1;
    }
    if (!current.ends) return false;
    current.ends = false;
    this.#count -= 1;

    // 지운 끝에서 뿌리 쪽으로 올라가며, 낱말도 자식도 없는 마디를 부모의 표에서 뺀다.
    for (let at = word.length; at > 0; at--) {
      const here = path[at] as Node;
      if (here.ends || here.children.size > 0) break;
      this.__cost += 1;
      (path[at - 1] as Node).children.delete(word.charCodeAt(at - 1));
    }
    return true;
  }

  wordsWithPrefix(prefix: string): string[] {
    const found: string[] = [];
    const at = this.#locate(prefix);
    if (at !== null) this.#collect(at, prefix, found);
    return found;
  }

  /** 접두사가 끝나는 마디. 없으면 `null`. 걸음은 접두사 길이 + 1 이다. */
  #locate(prefix: string): Node | null {
    let current = this.#root;
    this.__cost += 1;
    for (let at = 0; at < prefix.length; at++) {
      const next = current.children.get(prefix.charCodeAt(at));
      if (next === undefined) return null;
      current = next;
      this.__cost += 1;
    }
    return current;
  }

  /** 부분 트리의 낱말을 모은다. 떼어 낸 가지가 없으므로 지나는 마디가 전부 답에 쓰인다. */
  #collect(current: Node, path: string, out: string[]): void {
    this.__cost += 1;
    if (current.ends) out.push(path);
    for (const [code, child] of current.children) {
      this.#collect(child, path + String.fromCharCode(code), out);
    }
  }
}
// #endregion
