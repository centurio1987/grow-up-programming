/**
 * 결함 fixture — 서로 다른 패턴만 들고, 검색마다 **패턴 하나씩** 텍스트의 모든 자리를 문자 단위로 견주는 구현.
 *
 * 대상 계약: `trie/ahoCorasick`.
 *
 * 자명한 구현이다 — 배열 하나와 문자 비교만 쓴다. 답은 전부 옳다(축1 통과). 생성자는 패턴 목록을 한 번 읽어 같은 문자열을
 * 접으므로 목록 크기에 비례해 구성 행을 지키고, **검색이 패턴 수 × 텍스트 길이**라 이 계약의 중심(검색이 패턴 집합 크기에
 * 기대지 않는다)을 어긴다. 텍스트 길이 끝의 두 시나리오에서도 패턴 `a^d b` · `a^d` 가 자리마다 d 문자를 견줘 걸린다.
 *
 * 계측은 §규약2 계측 단위 — 패턴 목록의 칸 하나를 읽을 때 1, 문자 한 쌍을 견줄 때 1, 시작 자리 하나를 해 볼 때 1, 돌려줄 자리
 * 하나를 적을 때 1. 어느 시나리오에서 걸리는지는 `_contract/runContract.ahoCorasick.test.ts` 가 고정한다.
 */

export class PatternwiseScanMatcher {
  readonly #words: string[] = [];
  __cost = 0;

  constructor(patterns: string[]) {
    const seen = new Set<string>();
    for (const word of patterns) {
      this.__cost += 1;
      if (seen.has(word)) continue;
      seen.add(word);
      this.#words.push(word);
    }
  }

  search(text: string): Map<string, number[]> {
    const found = new Map<string, number[]>();
    for (const word of this.#words) {
      for (let i = 0; i + word.length <= text.length; i++) {
        this.__cost += 1;
        let j = 0;
        while (j < word.length) {
          this.__cost += 1;
          if (text.charCodeAt(i + j) !== word.charCodeAt(j)) break;
          j++;
        }
        if (j < word.length) continue;
        this.__cost += 1;
        const starts = found.get(word);
        if (starts === undefined) found.set(word, [i]);
        else starts.push(i);
      }
    }
    return found;
  }
}
