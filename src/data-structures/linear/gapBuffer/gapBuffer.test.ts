import { test, expect, describe } from "bun:test";
import { GapBuffer } from "./gapBuffer";

describe("GapBuffer", () => {
  describe("기본 동작", () => {
    test("문자를 삽입하면 getText에 반영된다", () => {
      const buf = new GapBuffer();
      buf.insert("H");
      buf.insert("i");
      expect(buf.getText()).toBe("Hi");
    });

    test("여러 문자 삽입 후 length가 정확하다", () => {
      const buf = new GapBuffer();
      "hello".split("").forEach((c) => buf.insert(c));
      expect(buf.length()).toBe(5);
    });

    test("delete는 커서 왼쪽 문자를 제거한다", () => {
      const buf = new GapBuffer();
      buf.insert("a");
      buf.insert("b");
      buf.insert("c");
      buf.delete();
      expect(buf.getText()).toBe("ab");
    });

    test("moveCursor 후 insert는 해당 위치에 문자를 삽입한다", () => {
      const buf = new GapBuffer();
      "abc".split("").forEach((c) => buf.insert(c));
      buf.moveCursor(1);
      buf.insert("X");
      expect(buf.getText()).toBe("aXbc");
    });

    test("getCursorPosition은 현재 커서 위치를 반환한다", () => {
      const buf = new GapBuffer();
      buf.insert("a");
      buf.insert("b");
      expect(buf.getCursorPosition()).toBe(2);
      buf.moveCursor(0);
      expect(buf.getCursorPosition()).toBe(0);
    });
  });

  describe("엣지 케이스", () => {
    test("빈 버퍼에서 delete는 아무것도 하지 않는다", () => {
      const buf = new GapBuffer();
      buf.delete();
      expect(buf.getText()).toBe("");
      expect(buf.length()).toBe(0);
    });

    test("커서가 맨 앞일 때 delete는 아무것도 하지 않는다", () => {
      const buf = new GapBuffer();
      "abc".split("").forEach((c) => buf.insert(c));
      buf.moveCursor(0);
      buf.delete();
      expect(buf.getText()).toBe("abc");
    });

    test("빈 버퍼의 getText는 빈 문자열을 반환한다", () => {
      const buf = new GapBuffer();
      expect(buf.getText()).toBe("");
    });

    test("moveCursor를 음수로 호출하면 0으로 클램프된다", () => {
      const buf = new GapBuffer();
      buf.insert("a");
      buf.moveCursor(-5);
      expect(buf.getCursorPosition()).toBe(0);
    });

    test("moveCursor를 length()보다 큰 값으로 호출하면 length()로 클램프된다", () => {
      const buf = new GapBuffer();
      buf.insert("a");
      buf.moveCursor(100);
      expect(buf.getCursorPosition()).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("단일 문자 삽입 후 삭제", () => {
      const buf = new GapBuffer();
      buf.insert("z");
      buf.delete();
      expect(buf.getText()).toBe("");
      expect(buf.length()).toBe(0);
    });

    test("초기 용량을 초과하면 버퍼가 자동으로 확장된다", () => {
      const buf = new GapBuffer(4);
      "0123456789".split("").forEach((c) => buf.insert(c));
      expect(buf.getText()).toBe("0123456789");
      expect(buf.length()).toBe(10);
    });

    test("커서를 가운데로 이동 후 삽입 → 삭제 반복", () => {
      const buf = new GapBuffer();
      "abcd".split("").forEach((c) => buf.insert(c));
      buf.moveCursor(2); // ab|cd
      buf.insert("X");  // abX|cd
      buf.delete();     // ab|cd
      expect(buf.getText()).toBe("abcd");
    });

    test("커서를 맨 끝으로 이동 후 getText가 올바르다", () => {
      const buf = new GapBuffer();
      "hello".split("").forEach((c) => buf.insert(c));
      buf.moveCursor(0);
      buf.moveCursor(5);
      expect(buf.getText()).toBe("hello");
    });
  });

  describe("성능", () => {
    test("10,000회 insert 연산이 100ms 이내에 완료된다", () => {
      const buf = new GapBuffer(16);
      const start = performance.now();
      for (let i = 0; i < 10_000; i++) buf.insert("x");
      const elapsed = performance.now() - start;
      expect(buf.length()).toBe(10_000);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
