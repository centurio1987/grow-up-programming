/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/radixTree/radixTree.test.ts` 는 학습자가 채우는 파일을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 「성능」 케이스 둘은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스가 실제로
 * 확인하려던 것(조회 하나의 비용이 단어 개수가 아니라 문자열 길이로 눌린다)은 마지막 시험이
 * **결정론적 계수**로 대신 확인한다.
 */
import { expect, test } from "bun:test";
import { radixQueryOps } from "./radixTree-guide.alt.ts";
import { commonPrefixLength, RadixTree } from "./radixTree-guide.ref.ts";

test("삽입한 단어는 search 에서 참이다", () => {
  const tree = new RadixTree();
  tree.insert("apple");
  expect(tree.search("apple")).toBe(true);
});

test("삽입하지 않은 단어는 거짓이다", () => {
  const tree = new RadixTree();
  tree.insert("apple");
  expect(tree.search("banana")).toBe(false);
});

test("접두사는 search 에서 거짓, startsWith 에서 참이다", () => {
  const tree = new RadixTree();
  tree.insert("apple");
  expect(tree.search("app")).toBe(false);
  expect(tree.startsWith("app")).toBe(true);
});

test("라벨이 갈리는 경우 — apple 뒤에 app 을 담는다", () => {
  const tree = new RadixTree();
  tree.insert("apple");
  tree.insert("app");
  expect(tree.search("apple")).toBe(true);
  expect(tree.search("app")).toBe(true);
  expect(tree.search("appl")).toBe(false);
  expect(tree.startsWith("appl")).toBe(true);
});

test("공통 접두사로 갈린다 — apple 과 application 을 둘 다 찾는다", () => {
  const tree = new RadixTree();
  tree.insert("apple");
  tree.insert("application");
  expect(tree.search("apple")).toBe(true);
  expect(tree.search("application")).toBe(true);
  expect(tree.search("app")).toBe(false);
  expect(tree.startsWith("appli")).toBe(true);
});

test("같은 단어를 두 번 삽입해도 search 가 참이다", () => {
  const tree = new RadixTree();
  tree.insert("hello");
  tree.insert("hello");
  expect(tree.search("hello")).toBe(true);
});

test("빈 트리에서 두 조회가 모두 거짓이다", () => {
  const tree = new RadixTree();
  expect(tree.search("any")).toBe(false);
  expect(tree.startsWith("a")).toBe(false);
});

test("담긴 단어보다 긴 조회는 거짓이다", () => {
  const tree = new RadixTree();
  tree.insert("ab");
  expect(tree.search("abc")).toBe(false);
  expect(tree.startsWith("abc")).toBe(false);
});

test("없는 접두사에 startsWith 이 거짓이다", () => {
  const tree = new RadixTree();
  tree.insert("apple");
  expect(tree.startsWith("apx")).toBe(false);
});

test("단어와 완전히 같은 접두사도 startsWith 이 참이다", () => {
  const tree = new RadixTree();
  tree.insert("hello");
  expect(tree.startsWith("hello")).toBe(true);
});

test("트라이와의 차이가 드러나는 자리 — tester 뒤에 test", () => {
  const tree = new RadixTree();
  tree.insert("tester");
  tree.insert("test");
  expect(tree.search("tester")).toBe(true);
  expect(tree.search("test")).toBe(true);
  expect(tree.search("teste")).toBe(false);
  expect(tree.startsWith("teste")).toBe(true);
  expect(tree.startsWith("testers")).toBe(false);
});

test("길이 1 단어", () => {
  const tree = new RadixTree();
  tree.insert("a");
  expect(tree.search("a")).toBe(true);
  expect(tree.search("b")).toBe(false);
  expect(tree.startsWith("a")).toBe(true);
});

test("길이 1,000 단어", () => {
  const tree = new RadixTree();
  const word = "a".repeat(1000);
  tree.insert(word);
  expect(tree.search(word)).toBe(true);
  expect(tree.search("a".repeat(999))).toBe(false);
  expect(tree.startsWith("a".repeat(500))).toBe(true);
});

test("갈림이 여럿인 사전 — romane 무리 일곱", () => {
  const tree = new RadixTree();
  const words = [
    "romane",
    "romanus",
    "romulus",
    "rubens",
    "ruber",
    "rubicon",
    "rubicundus",
  ];
  for (const w of words) tree.insert(w);
  for (const w of words) expect(tree.search(w)).toBe(true);
  expect(tree.search("rom")).toBe(false);
  expect(tree.startsWith("rom")).toBe(true);
  expect(tree.startsWith("rubic")).toBe(true);
  expect(tree.startsWith("rz")).toBe(false);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 네 단어와 이 조회 다섯을 쓴다.
  const tree = new RadixTree();
  tree.insert("apple");
  tree.insert("application");
  tree.insert("app");
  tree.insert("appl");
  expect(tree.search("app")).toBe(true);
  expect(tree.search("appli")).toBe(false);
  expect(tree.startsWith("appli")).toBe(true);
  expect(tree.search("applied")).toBe(false);
  expect(tree.startsWith("bat")).toBe(false);
});

test("공통 접두사 길이는 어긋나는 첫 자리에서 멈춘다", () => {
  expect(commonPrefixLength("application", "apple")).toBe(4);
  expect(commonPrefixLength("apple", "apple")).toBe(5);
  expect(commonPrefixLength("bat", "apple")).toBe(0);
  expect(commonPrefixLength("", "apple")).toBe(0);
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
    const tree = new RadixTree();
    const list = new WordList();
    for (const [k, w] of all.entries()) {
      if (((mask >> (k % 8)) & 1) === 0) continue;
      tree.insert(w);
      list.insert(w);
    }
    for (const q of all) {
      expect(tree.search(q)).toBe(list.search(q));
      expect(tree.startsWith(q)).toBe(list.startsWith(q));
    }
  }
});

test("삽입 순서를 바꿔도 같은 답을 낸다", () => {
  const words = ["apple", "application", "app", "appl", "apricot", "banana"];
  const orders: string[][] = [
    [...words],
    [...words].reverse(),
    ["app", "appl", "apple", "application", "apricot", "banana"],
    ["banana", "apricot", "application", "apple", "appl", "app"],
  ];
  const queries = [
    "a",
    "ap",
    "app",
    "appl",
    "appli",
    "apple",
    "applied",
    "application",
    "apricot",
    "b",
    "banana",
    "bananas",
    "z",
  ];
  const base = orders[0] as string[];
  const gold = new RadixTree();
  for (const w of base) gold.insert(w);
  for (const order of orders.slice(1)) {
    const tree = new RadixTree();
    for (const w of order) tree.insert(w);
    for (const q of queries) {
      expect(tree.search(q)).toBe(gold.search(q));
      expect(tree.startsWith(q)).toBe(gold.startsWith(q));
    }
  }
});

test("제약 최댓값 — 길이 합 100,000 을 담고 조회한다", () => {
  const tree = new RadixTree();
  // 길이 100 짜리 단어 1,000 개. 길이 합이 정확히 100,000 이다.
  const words = Array.from(
    { length: 1000 },
    (_, i) => `word${String(i).padStart(96, "0")}`,
  );
  for (const w of words) tree.insert(w);
  expect(tree.search(words[0] as string)).toBe(true);
  expect(tree.search(words[999] as string)).toBe(true);
  expect(tree.search("word")).toBe(false);
  expect(tree.startsWith("word")).toBe(true);
  expect(tree.startsWith("wore")).toBe(false);
});

test("제약 최댓값 — 길이 100,000 짜리 단어 하나", () => {
  const tree = new RadixTree();
  const word = "a".repeat(100_000);
  tree.insert(word);
  expect(tree.search(word)).toBe(true);
  expect(tree.search(`${word}a`)).toBe(false);
  expect(tree.startsWith("a".repeat(99_999))).toBe(true);
});

test("조회 하나의 기본 연산이 단어 개수가 아니라 문자열 길이로 눌린다", () => {
  // 벽시계 대신 **결정론적 계수**를 센다. 원본 테스트의 「성능」 케이스가 확인하려던 것이
  // 이것이고, 계수는 `.alt.ts` 의 계측기가 낸다.
  //
  // **「사전이 커져도 값이 같다」는 이 구조에서 참이 아니다.** 갈림이 늘면 경로 위 노드가
  // 늘어 자식 맵 조회가 함께 는다(사전 10 개에 10 · 10,000 개에 13). 참인 것은 그 값이
  // **문자열 길이로만 눌린다**는 것이다 — 맵 조회 ≤ L · 글자 대조 ≤ L · 끝 표시 읽기 ≤ 1.
  const words = (n: number): string[] =>
    Array.from({ length: n }, (_, i) => `w${String(i).padStart(6, "0")}`);
  const query = "w000003";
  const cap = 2 * query.length + 1;
  const sizes = [10, 100, 1_000, 10_000];
  for (const n of sizes) {
    expect(radixQueryOps(words(n), [query])).toBeLessThanOrEqual(cap);
  }
  // 사전이 1,000 배로 커지는 동안 늘어난 값이 3 을 넘지 않는다.
  const small = radixQueryOps(words(10), [query]);
  const large = radixQueryOps(words(10_000), [query]);
  expect(large - small).toBeLessThanOrEqual(3);
  // 답은 사전 크기와 상관없이 같다.
  for (const n of [10, 10_000]) {
    const tree = new RadixTree();
    for (const w of words(n)) tree.insert(w);
    expect(tree.search(query)).toBe(true);
    expect(tree.search(`${query}x`)).toBe(false);
    expect(tree.startsWith("w0000")).toBe(true);
  }
});
