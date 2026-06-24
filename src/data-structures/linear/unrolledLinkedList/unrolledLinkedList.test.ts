import { test, expect, describe } from "bun:test";
import { UnrolledLinkedList } from "./unrolledLinkedList";

describe("UnrolledLinkedList", () => {
  describe("기본 동작", () => {
    test("push 후 size가 증가한다", () => {
      const list = new UnrolledLinkedList<number>();
      list.push(1);
      list.push(2);
      list.push(3);
      expect(list.size()).toBe(3);
    });

    test("push한 순서대로 get으로 조회된다", () => {
      const list = new UnrolledLinkedList<number>();
      list.push(10);
      list.push(20);
      list.push(30);
      expect(list.get(0)).toBe(10);
      expect(list.get(1)).toBe(20);
      expect(list.get(2)).toBe(30);
    });

    test("pop은 마지막 원소를 반환하고 size를 줄인다", () => {
      const list = new UnrolledLinkedList<number>();
      list.push(1);
      list.push(2);
      list.push(3);
      expect(list.pop()).toBe(3);
      expect(list.size()).toBe(2);
      expect(list.pop()).toBe(2);
      expect(list.size()).toBe(1);
    });

    test("toArray는 삽입 순서와 동일한 배열을 반환한다", () => {
      const list = new UnrolledLinkedList<string>();
      list.push("a");
      list.push("b");
      list.push("c");
      expect(list.toArray()).toEqual(["a", "b", "c"]);
    });
  });

  describe("엣지 케이스", () => {
    test("빈 리스트에서 pop은 undefined를 반환한다", () => {
      const list = new UnrolledLinkedList<number>();
      expect(list.pop()).toBeUndefined();
    });

    test("빈 리스트에서 get은 undefined를 반환한다", () => {
      const list = new UnrolledLinkedList<number>();
      expect(list.get(0)).toBeUndefined();
    });

    test("범위를 벗어난 인덱스로 get하면 undefined를 반환한다", () => {
      const list = new UnrolledLinkedList<number>();
      list.push(1);
      list.push(2);
      expect(list.get(5)).toBeUndefined();
    });

    test("빈 리스트의 toArray는 빈 배열을 반환한다", () => {
      const list = new UnrolledLinkedList<number>();
      expect(list.toArray()).toEqual([]);
    });
  });

  describe("바운더리", () => {
    test("단일 원소 push 후 pop", () => {
      const list = new UnrolledLinkedList<number>();
      list.push(42);
      expect(list.pop()).toBe(42);
      expect(list.size()).toBe(0);
    });

    test("chunkSize를 초과해도 원소를 올바르게 저장한다", () => {
      const chunkSize = 4;
      const list = new UnrolledLinkedList<number>(chunkSize);
      const count = 13;
      for (let i = 0; i < count; i++) {
        list.push(i);
      }
      expect(list.size()).toBe(count);
      expect(list.toArray()).toEqual(Array.from({ length: count }, (_, i) => i));
    });

    test("청크 경계에 걸친 원소를 get으로 올바르게 조회한다", () => {
      const list = new UnrolledLinkedList<number>(4);
      for (let i = 0; i < 9; i++) list.push(i * 10);
      expect(list.get(4)).toBe(40);
      expect(list.get(8)).toBe(80);
    });

    test("청크 경계에서 pop 후 이전 청크가 tail이 된다", () => {
      const list = new UnrolledLinkedList<number>(3);
      list.push(1);
      list.push(2);
      list.push(3);
      list.push(4);
      list.pop();
      expect(list.size()).toBe(3);
      expect(list.pop()).toBe(3);
    });
  });

  describe("성능", () => {
    test("10,000개 push·get 연산이 100ms 이내에 완료된다", () => {
      const list = new UnrolledLinkedList<number>(32);
      const N = 10_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) list.push(i);
      for (let i = 0; i < N; i++) list.get(i);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
