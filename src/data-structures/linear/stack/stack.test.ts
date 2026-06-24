import { test, expect, describe } from "bun:test";
import { Stack } from "./stack";

describe("Stack", () => {
  describe("기본", () => {
    test("push 후 peek은 마지막 원소를 반환한다", () => {
      const s = new Stack<number>();
      s.push(1);
      s.push(2);
      expect(s.peek()).toBe(2);
    });

    test("pop은 LIFO 순서로 반환한다", () => {
      const s = new Stack<number>();
      s.push(1);
      s.push(2);
      s.push(3);
      expect(s.pop()).toBe(3);
      expect(s.pop()).toBe(2);
      expect(s.pop()).toBe(1);
    });

    test("size는 현재 원소 개수를 반환한다", () => {
      const s = new Stack<string>();
      expect(s.size()).toBe(0);
      s.push("a");
      s.push("b");
      expect(s.size()).toBe(2);
      s.pop();
      expect(s.size()).toBe(1);
    });
  });

  describe("엣지", () => {
    test("빈 스택에서 pop은 undefined를 반환한다", () => {
      const s = new Stack<number>();
      expect(s.pop()).toBeUndefined();
    });

    test("빈 스택에서 peek은 undefined를 반환한다", () => {
      const s = new Stack<number>();
      expect(s.peek()).toBeUndefined();
    });

    test("isEmpty는 비었을 때 true를 반환한다", () => {
      const s = new Stack<number>();
      expect(s.isEmpty()).toBe(true);
      s.push(1);
      expect(s.isEmpty()).toBe(false);
      s.pop();
      expect(s.isEmpty()).toBe(true);
    });

    test("pop 후에도 peek은 새로운 맨 위 원소를 반환한다", () => {
      const s = new Stack<number>();
      s.push(10);
      s.push(20);
      s.pop();
      expect(s.peek()).toBe(10);
    });
  });

  describe("바운더리", () => {
    test("제네릭 타입 — 문자열 스택", () => {
      const s = new Stack<string>();
      s.push("hello");
      s.push("world");
      expect(s.pop()).toBe("world");
      expect(s.pop()).toBe("hello");
    });

    test("단일 원소 push/pop", () => {
      const s = new Stack<number>();
      s.push(42);
      expect(s.size()).toBe(1);
      expect(s.pop()).toBe(42);
      expect(s.isEmpty()).toBe(true);
    });
  });

  describe("성능", () => {
    test("10^6 push/pop을 200ms 이내에 처리한다", () => {
      const s = new Stack<number>();
      const N = 1_000_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) s.push(i);
      for (let i = 0; i < N; i++) s.pop();
      expect(performance.now() - start).toBeLessThan(200);
      expect(s.isEmpty()).toBe(true);
    });
  });
});
