import { test, expect, describe } from "bun:test";
import { HuffmanTree } from "./huffmanTree";

function freqMap(text: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const ch of text) {
    map.set(ch, (map.get(ch) ?? 0) + 1);
  }
  return map;
}

describe("HuffmanTree", () => {
  describe("기본", () => {
    test("단일 문자 종류: 인코딩/디코딩이 왕복된다", () => {
      const text = "aaaa";
      const tree = new HuffmanTree(freqMap(text));
      const encoded = tree.encode(text);
      expect(tree.decode(encoded)).toBe(text);
    });

    test("두 문자: encode 후 decode하면 원본과 같다", () => {
      const text = "aabb";
      const tree = new HuffmanTree(freqMap(text));
      const encoded = tree.encode(text);
      expect(tree.decode(encoded)).toBe(text);
    });

    test("다양한 문자열 인코딩/디코딩 왕복", () => {
      const text = "abracadabra";
      const tree = new HuffmanTree(freqMap(text));
      const encoded = tree.encode(text);
      expect(tree.decode(encoded)).toBe(text);
    });

    test("codeTable에 모든 문자가 포함된다", () => {
      const text = "hello world";
      const tree = new HuffmanTree(freqMap(text));
      const table = tree.codeTable();
      const uniqueChars = new Set(text);
      for (const ch of uniqueChars) {
        expect(table.has(ch)).toBe(true);
      }
    });

    test("빈도 높은 문자가 더 짧거나 같은 코드를 가진다", () => {
      // 'a'가 'b'보다 훨씬 많음
      const text = "aaaaaaaaab";
      const tree = new HuffmanTree(freqMap(text));
      const table = tree.codeTable();
      const codeA = table.get("a")!;
      const codeB = table.get("b")!;
      expect(codeA.length).toBeLessThanOrEqual(codeB.length);
    });

    test("인코딩 결과는 '0'과 '1'만 포함한다", () => {
      const text = "hello";
      const tree = new HuffmanTree(freqMap(text));
      const encoded = tree.encode(text);
      expect(/^[01]*$/.test(encoded)).toBe(true);
    });

    test("compressionRatio가 1.0 이하 (압축 효과 있음)", () => {
      // 편향된 빈도 → 높은 압축률
      const text = "a".repeat(100) + "b".repeat(10) + "c".repeat(1);
      const tree = new HuffmanTree(freqMap(text));
      expect(tree.compressionRatio(text)).toBeLessThan(1.0);
    });

    test("균등 빈도 2문자의 코드 길이는 각각 1비트", () => {
      const freq = new Map([["a", 1], ["b", 1]]);
      const tree = new HuffmanTree(freq);
      const table = tree.codeTable();
      expect(table.get("a")!.length).toBe(1);
      expect(table.get("b")!.length).toBe(1);
    });

    test("각 문자의 코드가 다른 코드의 접두사가 아니다 (prefix-free)", () => {
      const text = "abcdef";
      const tree = new HuffmanTree(freqMap(text));
      const table = tree.codeTable();
      const codes = Array.from(table.values());
      for (let i = 0; i < codes.length; i++) {
        for (let j = 0; j < codes.length; j++) {
          if (i === j) continue;
          expect(codes[j]!.startsWith(codes[i]!)).toBe(false);
        }
      }
    });
  });

  describe("엣지", () => {
    test("빈 문자열 인코딩은 빈 문자열을 반환한다", () => {
      const freq = new Map([["a", 1]]);
      const tree = new HuffmanTree(freq);
      expect(tree.encode("")).toBe("");
    });

    test("빈 frequencies Map은 에러를 던진다", () => {
      expect(() => new HuffmanTree(new Map())).toThrow();
    });

    test("frequencies에 없는 문자 인코딩 시 에러를 던진다", () => {
      const freq = new Map([["a", 5], ["b", 3]]);
      const tree = new HuffmanTree(freq);
      expect(() => tree.encode("abc")).toThrow();
    });

    test("단일 문자 종류 트리: 디코딩이 올바르게 동작한다", () => {
      const freq = new Map([["x", 7]]);
      const tree = new HuffmanTree(freq);
      const encoded = tree.encode("xxx");
      expect(tree.decode(encoded)).toBe("xxx");
    });

    test("compressionRatio는 양수 값을 반환한다", () => {
      const text = "abcd";
      const tree = new HuffmanTree(freqMap(text));
      expect(tree.compressionRatio(text)).toBeGreaterThan(0);
    });
  });

  describe("성능", () => {
    test("10000자 문자열 인코딩/디코딩이 100ms 이내에 완료된다", () => {
      const chars = "abcdefghijklmnopqrstuvwxyz";
      let text = "";
      for (let i = 0; i < 10000; i++) {
        text += chars[i % chars.length];
      }
      const tree = new HuffmanTree(freqMap(text));
      const start = Date.now();
      const encoded = tree.encode(text);
      const decoded = tree.decode(encoded);
      expect(Date.now() - start).toBeLessThan(100);
      expect(decoded).toBe(text);
    });

    test("26개 문자 균등 빈도 트리 구성이 10ms 이내에 완료된다", () => {
      const freq = new Map<string, number>();
      for (let i = 0; i < 26; i++) {
        freq.set(String.fromCharCode(97 + i), i + 1);
      }
      const start = Date.now();
      new HuffmanTree(freq);
      expect(Date.now() - start).toBeLessThan(10);
    });
  });
});
