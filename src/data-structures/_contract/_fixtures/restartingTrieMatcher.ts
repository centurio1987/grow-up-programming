/**
 * 결함 fixture — 패턴을 트라이 하나에 담고, 검색은 **텍스트의 자리마다 뿌리부터** 문자를 따라 내려가며 끝나는 패턴을 적는 구현.
 *
 * 대상 계약: `trie/ahoCorasick`.
 *
 * 실패 쪽 상태가 없는 설계다 — `trie/trie` 계약을 지키는 구조를 그대로 두고 자리마다 다시 내려간다. 답은 전부 옳다(축1 통과).
 * 구성은 패턴 목록 크기에 비례하고, 검색은 **자리마다 트라이 깊이만큼** 걸어 패턴 수에는 기대지 않는다 — 그래서 패턴 수를 키우는
 * 시나리오(텍스트 64 자 · 패턴 깊이 15)는 통과하고, 텍스트 `a^n` 에 길이 √n 짜리 패턴을 두는 두 시나리오에서 n·√n 으로 걸린다.
 *
 * 계측은 §규약2 계측 단위 — 패턴 목록의 칸 하나 · 상태 하나를 지나갈 때 1, 시작 자리 하나를 해 볼 때 1, 돌려줄 자리 하나를 적을
 * 때 1. 어느 시나리오에서 걸리는지는 `_contract/runContract.ahoCorasick.test.ts` 가 고정한다.
 */

interface Node {
  readonly next: Map<number, Node>;
  word: string | null;
}

export class RestartingTrieMatcher {
  readonly #root: Node = { next: new Map(), word: null };
  __cost = 0;

  constructor(patterns: string[]) {
    for (const word of patterns) {
      this.__cost += 1;
      let node = this.#root;
      for (let i = 0; i < word.length; i++) {
        this.__cost += 1;
        const code = word.charCodeAt(i);
        let child = node.next.get(code);
        if (child === undefined) {
          child = { next: new Map(), word: null };
          node.next.set(code, child);
        }
        node = child;
      }
      node.word = word;
    }
  }

  search(text: string): Map<string, number[]> {
    const found = new Map<string, number[]>();
    for (let start = 0; start <= text.length; start++) {
      this.__cost += 1;
      let node: Node | undefined = this.#root;
      let at = start;
      while (node !== undefined) {
        if (node.word !== null) {
          this.__cost += 1;
          const starts = found.get(node.word);
          if (starts === undefined) found.set(node.word, [start]);
          else starts.push(start);
        }
        if (at === text.length) break;
        this.__cost += 1;
        node = node.next.get(text.charCodeAt(at));
        at++;
      }
    }
    return found;
  }
}
