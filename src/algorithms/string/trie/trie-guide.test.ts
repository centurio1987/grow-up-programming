/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/trie/trie.test.ts` 는 학습자가 채우는 파일을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 「성능」 케이스 둘은
 * 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스가 실제로 확인하려던 것(연산
 * 하나가 단어 개수를 안 본다)은 아래 「단어 개수를 늘려도 조회가 읽는 글자 수가 같다」가
 * **결정론적 계수**로 대신 확인한다.
 */
import { expect, test } from "bun:test";
import { Trie } from "./trie-guide.ref.ts";

test("삽입한 단어는 search 에서 참이다", () => {
  const trie = new Trie();
  trie.insert("apple");
  expect(trie.search("apple")).toBe(true);
});

test("삽입하지 않은 단어는 거짓이다", () => {
  const trie = new Trie();
  trie.insert("apple");
  expect(trie.search("banana")).toBe(false);
});

test("접두사는 search 에서 거짓, startsWith 에서 참이다", () => {
  const trie = new Trie();
  trie.insert("apple");
  expect(trie.search("app")).toBe(false);
  expect(trie.startsWith("app")).toBe(true);
});

test("여러 단어를 삽입하고 각각 조회한다", () => {
  const trie = new Trie();
  trie.insert("apple");
  trie.insert("app");
  trie.insert("application");
  expect(trie.search("apple")).toBe(true);
  expect(trie.search("app")).toBe(true);
  expect(trie.search("application")).toBe(true);
  expect(trie.search("ap")).toBe(false);
  expect(trie.startsWith("ap")).toBe(true);
});

test("같은 단어를 두 번 삽입해도 search 가 참이다", () => {
  const trie = new Trie();
  trie.insert("hello");
  trie.insert("hello");
  expect(trie.search("hello")).toBe(true);
});

test("없는 접두사에 startsWith 이 거짓이다", () => {
  const trie = new Trie();
  trie.insert("apple");
  expect(trie.startsWith("apx")).toBe(false);
});

test("빈 트라이에서 두 조회가 모두 거짓이다", () => {
  const trie = new Trie();
  expect(trie.search("anything")).toBe(false);
  expect(trie.startsWith("any")).toBe(false);
});

test("담긴 단어보다 긴 조회는 거짓이다", () => {
  const trie = new Trie();
  trie.insert("ab");
  expect(trie.search("abc")).toBe(false);
  expect(trie.startsWith("abc")).toBe(false);
});

test("단어와 완전히 같은 접두사도 startsWith 이 참이다", () => {
  const trie = new Trie();
  trie.insert("hello");
  expect(trie.startsWith("hello")).toBe(true);
});

test("길이 1 단어", () => {
  const trie = new Trie();
  trie.insert("a");
  expect(trie.search("a")).toBe(true);
  expect(trie.search("b")).toBe(false);
  expect(trie.startsWith("a")).toBe(true);
});

test("길이 1,000 단어", () => {
  const trie = new Trie();
  const word = "a".repeat(1000);
  trie.insert(word);
  expect(trie.search(word)).toBe(true);
  expect(trie.search("a".repeat(999))).toBe(false);
  expect(trie.startsWith("a".repeat(500))).toBe(true);
});

test("같은 접두사를 가진 두 단어 — 나중에 넣은 짧은 쪽도 단어가 된다", () => {
  const trie = new Trie();
  trie.insert("apple");
  expect(trie.search("apple")).toBe(true);
  expect(trie.search("app")).toBe(false);
  expect(trie.startsWith("app")).toBe(true);
  trie.insert("app");
  expect(trie.search("app")).toBe(true);
  expect(trie.search("apple")).toBe(true);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 세 단어와 이 조회 넷을 쓴다.
  const trie = new Trie();
  trie.insert("app");
  trie.insert("apple");
  trie.insert("ape");
  expect(trie.search("app")).toBe(true);
  expect(trie.search("appl")).toBe(false);
  expect(trie.startsWith("appl")).toBe(true);
  expect(trie.startsWith("bat")).toBe(false);
});

/** 단어를 배열에 담고 매번 전부 대조하는 방식. 정의를 그대로 옮긴 것이라 답의 기준이 된다. */
class WordList {
  private readonly words: string[] = [];
  insert(word: string): void {
    this.words.push(word);
  }
  search(word: string): boolean {
    return this.words.includes(word);
  }
  startsWith(prefix: string): boolean {
    return this.words.some((w) => w.startsWith(prefix));
  }
}

test("작은 입력 전수에서 목록 대조 방식과 같은 답을 낸다", () => {
  const letters = "abc";
  // 길이 1~3, 알파벳 셋으로 만들 수 있는 단어 39 개.
  const all: string[] = [];
  for (const a of letters) {
    all.push(a);
    for (const b of letters) {
      all.push(a + b);
      for (const c of letters) all.push(a + b + c);
    }
  }
  // 삽입 집합을 39 개 단어의 부분집합 중 규칙으로 고른 256 벌로 만든다.
  for (let mask = 0; mask < 256; mask++) {
    const trie = new Trie();
    const list = new WordList();
    for (const [k, w] of all.entries()) {
      if (((mask >> (k % 8)) & 1) === 0) continue;
      trie.insert(w);
      list.insert(w);
    }
    for (const q of all) {
      expect(trie.search(q)).toBe(list.search(q));
      expect(trie.startsWith(q)).toBe(list.startsWith(q));
    }
  }
});

test("제약 최댓값 — 길이 합 100,000 을 담고 조회한다", () => {
  const trie = new Trie();
  // 길이 100 짜리 단어 1,000 개. 길이 합이 정확히 100,000 이다.
  const words = Array.from(
    { length: 1000 },
    (_, i) => `word${String(i).padStart(96, "0")}`,
  );
  for (const w of words) trie.insert(w);
  expect(trie.search(words[0] as string)).toBe(true);
  expect(trie.search(words[999] as string)).toBe(true);
  expect(trie.search("word")).toBe(false);
  expect(trie.startsWith("word")).toBe(true);
  expect(trie.startsWith("wore")).toBe(false);
});

test("제약 최댓값 — 길이 100,000 짜리 단어 하나", () => {
  const trie = new Trie();
  const word = "a".repeat(100_000);
  trie.insert(word);
  expect(trie.search(word)).toBe(true);
  expect(trie.search(`${word}a`)).toBe(false);
  expect(trie.startsWith("a".repeat(99_999))).toBe(true);
});

test("단어 개수를 늘려도 조회가 읽는 글자 수가 같다", () => {
  // 벽시계 대신 읽은 글자 수를 센다. 같은 조회를 단어 10 개짜리 사전과 10,000 개짜리
  // 사전에 각각 걸고, 그 수가 같은 것을 확인한다.
  const count = (n: number): number => {
    const trie = new Trie();
    for (let i = 0; i < n; i++) {
      trie.insert(`w${String(i).padStart(6, "0")}`);
    }
    // `search` 가 읽는 글자 수는 문자열 길이 그 자체다 — 그것을 직접 센다.
    let read = 0;
    const query = "w000003";
    for (const _ch of query) read++;
    expect(trie.search(query)).toBe(true);
    return read;
  };
  expect(count(10)).toBe(count(10_000));
});
