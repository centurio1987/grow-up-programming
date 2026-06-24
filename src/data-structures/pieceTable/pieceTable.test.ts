import { test, expect, describe } from "bun:test";
import { PieceTable } from "./pieceTable";

describe("PieceTable", () => {
  describe("기본 동작", () => {
    test("초기 텍스트가 getText에 반영된다", () => {
      const pt = new PieceTable("hello");
      expect(pt.getText()).toBe("hello");
      expect(pt.length()).toBe(5);
    });

    test("맨 끝에 텍스트를 삽입한다", () => {
      const pt = new PieceTable("hello");
      pt.insert(5, " world");
      expect(pt.getText()).toBe("hello world");
    });

    test("맨 앞에 텍스트를 삽입한다", () => {
      const pt = new PieceTable("world");
      pt.insert(0, "hello ");
      expect(pt.getText()).toBe("hello world");
    });

    test("중간에 텍스트를 삽입한다", () => {
      const pt = new PieceTable("helloworld");
      pt.insert(5, " ");
      expect(pt.getText()).toBe("hello world");
    });

    test("텍스트를 삭제한다", () => {
      const pt = new PieceTable("hello world");
      pt.delete(5, 6);
      expect(pt.getText()).toBe("hello");
    });

    test("삽입 후 삭제하면 올바른 텍스트가 남는다", () => {
      const pt = new PieceTable("abcdef");
      pt.insert(3, "XYZ");
      pt.delete(3, 3);
      expect(pt.getText()).toBe("abcdef");
    });
  });

  describe("엣지 케이스", () => {
    test("빈 문자열로 초기화하면 getText는 빈 문자열을 반환한다", () => {
      const pt = new PieceTable();
      expect(pt.getText()).toBe("");
      expect(pt.length()).toBe(0);
    });

    test("빈 PieceTable에 텍스트를 삽입한다", () => {
      const pt = new PieceTable();
      pt.insert(0, "hello");
      expect(pt.getText()).toBe("hello");
    });

    test("전체 텍스트를 삭제하면 빈 문자열이 된다", () => {
      const pt = new PieceTable("hello");
      pt.delete(0, 5);
      expect(pt.getText()).toBe("");
      expect(pt.length()).toBe(0);
    });

    test("단일 문자를 삭제한다", () => {
      const pt = new PieceTable("abc");
      pt.delete(1, 1);
      expect(pt.getText()).toBe("ac");
    });

    test("맨 앞 문자를 삭제한다", () => {
      const pt = new PieceTable("hello");
      pt.delete(0, 1);
      expect(pt.getText()).toBe("ello");
    });

    test("빈 문자열을 삽입해도 텍스트가 변하지 않는다", () => {
      const pt = new PieceTable("hello");
      pt.insert(2, "");
      expect(pt.getText()).toBe("hello");
    });
  });

  describe("바운더리", () => {
    test("연속 삽입 후 텍스트가 올바르다", () => {
      const pt = new PieceTable("ac");
      pt.insert(1, "b");
      expect(pt.getText()).toBe("abc");
    });

    test("여러 번 삽입·삭제를 반복해도 일관성이 유지된다", () => {
      const pt = new PieceTable("The quick brown fox");
      pt.insert(9, "very ");
      pt.delete(0, 4);
      pt.insert(0, "A ");
      expect(pt.getText()).toBe("A quick very brown fox");
    });

    test("조각 경계에 걸친 삭제를 처리한다", () => {
      const pt = new PieceTable("hello");
      pt.insert(5, " world");  // 두 조각 생성
      pt.delete(3, 5);         // "lo wo" 삭제 → 조각 경계 걸침
      expect(pt.getText()).toBe("helrld");
    });

    test("length()는 삽입·삭제 후 getText().length와 일치한다", () => {
      const pt = new PieceTable("hello world");
      pt.insert(5, "!!!");
      pt.delete(0, 2);
      expect(pt.length()).toBe(pt.getText().length);
    });
  });

  describe("성능", () => {
    test("1,000회 insert 연산이 100ms 이내에 완료된다", () => {
      const pt = new PieceTable("x".repeat(1000));
      const start = performance.now();
      for (let i = 0; i < 1_000; i++) {
        pt.insert(i, "a");
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("대용량 텍스트의 getText가 100ms 이내에 완료된다", () => {
      const original = "x".repeat(100_000);
      const pt = new PieceTable(original);
      pt.insert(50_000, "MIDDLE");
      const start = performance.now();
      const text = pt.getText();
      const elapsed = performance.now() - start;
      expect(text.length).toBe(100_006);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
