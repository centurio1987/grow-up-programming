import { test, expect, describe } from "bun:test";
import { DynamicArray } from "./dynamicArray";

describe("DynamicArray", () => {
  describe("기본", () => {
    test("push 후 get으로 원소를 조회할 수 있다", () => {
      const arr = new DynamicArray<number>();
      arr.push(10);
      arr.push(20);
      arr.push(30);
      expect(arr.get(0)).toBe(10);
      expect(arr.get(1)).toBe(20);
      expect(arr.get(2)).toBe(30);
    });

    test("push 후 size가 증가한다", () => {
      const arr = new DynamicArray<number>();
      expect(arr.size()).toBe(0);
      arr.push(1);
      expect(arr.size()).toBe(1);
      arr.push(2);
      expect(arr.size()).toBe(2);
    });

    test("pop은 마지막 원소를 제거하고 반환한다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      arr.push(3);
      expect(arr.pop()).toBe(3);
      expect(arr.size()).toBe(2);
      expect(arr.pop()).toBe(2);
      expect(arr.size()).toBe(1);
    });

    test("set으로 원소를 교체할 수 있다", () => {
      const arr = new DynamicArray<string>();
      arr.push("a");
      arr.push("b");
      arr.push("c");
      arr.set(1, "B");
      expect(arr.get(1)).toBe("B");
      expect(arr.toArray()).toEqual(["a", "B", "c"]);
    });

    test("toArray는 원소 복사본을 반환한다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      arr.push(3);
      expect(arr.toArray()).toEqual([1, 2, 3]);
    });

    test("초기 capacity는 4이다", () => {
      const arr = new DynamicArray<number>();
      expect(arr.capacity()).toBe(4);
    });

    test("capacity 초과 시 2배로 확장된다", () => {
      const arr = new DynamicArray<number>();
      // 초기 capacity=4이므로 5번째 push에서 확장
      for (let i = 0; i < 4; i++) arr.push(i);
      expect(arr.capacity()).toBe(4);
      arr.push(4);
      expect(arr.capacity()).toBe(8);
    });

    test("size가 capacity의 1/4 이하로 줄면 capacity가 절반으로 축소된다", () => {
      const arr = new DynamicArray<number>();
      // capacity=8 상태 만들기: 5개 push → capacity 8
      for (let i = 0; i < 5; i++) arr.push(i);
      expect(arr.capacity()).toBe(8);
      // pop을 반복해서 size가 2(= 8/4) 이하가 되도록
      arr.pop(); // size=4
      arr.pop(); // size=3
      arr.pop(); // size=2 → 2 <= 8/4=2, 하지만 capacity>4이므로 축소 → 4
      expect(arr.capacity()).toBe(4);
    });
  });

  describe("엣지", () => {
    test("빈 배열에서 pop은 undefined를 반환한다", () => {
      const arr = new DynamicArray<number>();
      expect(arr.pop()).toBeUndefined();
    });

    test("범위를 벗어난 get은 undefined를 반환한다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      expect(arr.get(-1)).toBeUndefined();
      expect(arr.get(1)).toBeUndefined();
      expect(arr.get(100)).toBeUndefined();
    });

    test("범위를 벗어난 set은 아무것도 하지 않는다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.set(-1, 99);
      arr.set(1, 99);
      expect(arr.toArray()).toEqual([1]);
    });

    test("pop 후 push하면 size가 올바르다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      arr.pop();
      arr.push(3);
      expect(arr.size()).toBe(2);
      expect(arr.toArray()).toEqual([1, 3]);
    });

    test("toArray는 원본과 독립된 배열을 반환한다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      const copy = arr.toArray();
      copy[0] = 999;
      expect(arr.get(0)).toBe(1); // 원본은 변하지 않아야 함
    });

    test("capacity는 항상 4 이상이다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.pop();
      expect(arr.capacity()).toBeGreaterThanOrEqual(4);
    });

    test("모든 원소를 pop한 후 다시 push해도 정상 동작한다", () => {
      const arr = new DynamicArray<number>();
      arr.push(1);
      arr.push(2);
      arr.pop();
      arr.pop();
      expect(arr.size()).toBe(0);
      arr.push(42);
      expect(arr.get(0)).toBe(42);
      expect(arr.size()).toBe(1);
    });
  });

  describe("바운더리", () => {
    test("단일 원소에서 pop 후 size는 0이다", () => {
      const arr = new DynamicArray<number>();
      arr.push(7);
      arr.pop();
      expect(arr.size()).toBe(0);
      expect(arr.toArray()).toEqual([]);
    });

    test("capacity 경계에서 정확히 더블링이 발생한다", () => {
      const arr = new DynamicArray<number>();
      // capacity=4 → push 4개까지는 4 유지
      for (let i = 0; i < 4; i++) arr.push(i);
      expect(arr.capacity()).toBe(4);
      // push 1개 더 → capacity=8
      arr.push(4);
      expect(arr.capacity()).toBe(8);
      // push 4개 더 (총 9개) → capacity=16
      for (let i = 0; i < 4; i++) arr.push(i + 10);
      expect(arr.capacity()).toBe(16);
    });

    test("문자열 타입에서도 올바르게 동작한다", () => {
      const arr = new DynamicArray<string>();
      arr.push("hello");
      arr.push("world");
      expect(arr.get(0)).toBe("hello");
      expect(arr.get(1)).toBe("world");
      expect(arr.toArray()).toEqual(["hello", "world"]);
    });

    test("객체 타입에서도 참조가 유지된다", () => {
      const arr = new DynamicArray<{ id: number }>();
      const obj = { id: 1 };
      arr.push(obj);
      expect(arr.get(0)).toBe(obj); // 참조 동일성
    });
  });

  describe("성능", () => {
    test("10^5 push 연산을 100ms 이내에 완료한다 (amortized O(1))", () => {
      const arr = new DynamicArray<number>();
      const N = 100_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        arr.push(i);
      }
      const elapsed = performance.now() - start;
      expect(arr.size()).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 push 후 10^5 pop을 100ms 이내에 완료한다", () => {
      const arr = new DynamicArray<number>();
      const N = 100_000;
      for (let i = 0; i < N; i++) arr.push(i);
      const start = performance.now();
      for (let i = 0; i < N; i++) arr.pop();
      const elapsed = performance.now() - start;
      expect(arr.size()).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 get 연산을 100ms 이내에 완료한다 (O(1))", () => {
      const arr = new DynamicArray<number>();
      const N = 100_000;
      for (let i = 0; i < N; i++) arr.push(i);
      const start = performance.now();
      let sum = 0;
      for (let i = 0; i < N; i++) {
        sum += arr.get(i) ?? 0;
      }
      const elapsed = performance.now() - start;
      expect(sum).toBe((N * (N - 1)) / 2);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
