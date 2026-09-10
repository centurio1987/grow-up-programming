/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/string/trie/trie.ts` 는 학습자가 채우는 자리라 가이드가 그대로 인용할
 * 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와 재실행
 * 시험(`*.test.ts`)과 경쟁 설계 계측(`*.alt.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 줄을
 * 각각 하나씩 바꾼다 — 삽입에서 자식을 찾는 줄, 삽입에서 다음 노드로 옮기는 줄, 조회에서
 * 끝 표시를 함께 보는 줄. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 식들을 주석에 다시
 * 적지 않는다. 같은 이유로 `nodeAt` 은 노드를 옮기는 자리를 다른 이름으로 적는다.
 *
 * **재귀를 쓰지 않는다.** 제약이 문자열 길이를 100,000 까지 허용해서, 글자마다 한 겹씩
 * 쌓이는 재귀는 그 규모에서 호출 스택이 넘친다. 그 값은 `*.proof.ts` 가 실행으로 낸다.
 */

/** 트라이의 노드 하나. 자기 글자를 들고 있지 않다 — 글자는 부모에서 이 노드로 오는 간선이다. */
class TrieNode {
  /** 글자 하나 → 그 글자로 이어지는 자식 노드. */
  readonly children = new Map<string, TrieNode>();
  /** 뿌리에서 이 노드까지의 경로 문자열이 삽입된 단어이면 참. */
  end = false;
}

/**
 * 소문자 영문 단어를 담고, **정확히 그 단어가 있는가**(`search`)와 **그 문자열로 시작하는
 * 단어가 있는가**(`startsWith`)를 각각 답하는 접두사 트리.
 *
 * 세 연산 모두 받은 문자열의 길이에만 비례한다 — 담긴 단어의 개수를 보지 않는다.
 */
export class Trie {
  private readonly root = new TrieNode();

  /** `word` 를 담는다. 이미 있는 경로는 다시 만들지 않고 그대로 이어 쓴다. */
  insert(word: string): void {
    // ① 뿌리에서 출발한다. 뿌리는 빈 문자열에 해당하는 노드다.
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      // ② 그 글자로 가는 자식이 없을 때만 새 노드를 만든다.
      if (next === undefined) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    // ③ 마지막 노드에 단어 끝 표시를 남긴다. 같은 단어를 다시 넣어도 결과가 같다.
    node.end = true;
  }

  /** `word` 가 삽입된 적이 있으면 참. */
  search(word: string): boolean {
    const node = this.nodeAt(word);
    // ④ 경로가 있고 그 끝에 단어 끝 표시도 있어야 한다.
    return node !== null ? node.end : false;
  }

  /** `prefix` 로 시작하는 단어가 하나라도 삽입돼 있으면 참. */
  startsWith(prefix: string): boolean {
    // ⑤ 경로가 있기만 하면 된다. 끝 표시는 보지 않는다.
    return this.nodeAt(prefix) !== null;
  }

  /** `s` 의 글자를 순서대로 따라간 노드. 도중에 자식이 없으면 `null`. */
  private nodeAt(s: string): TrieNode | null {
    let node = this.root;
    for (const ch of s) {
      const child = node.children.get(ch);
      // ⑥ 그 글자로 가는 자식이 없으면 이 문자열은 담긴 어떤 단어의 접두사도 아니다.
      if (child === undefined) return null;
      node = child;
    }
    return node;
  }
}
