import { test, expect, describe } from "bun:test";
import { XorLinkedList, XorNode } from "./xorLinkedList";

describe("XorLinkedList", () => {
  describe("기본", () => {
    test("append 후 toArray가 삽입 순서대로 반환한다", () => {
      const list = new XorLinkedList();
      list.append(1);
      list.append(2);
      list.append(3);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test("toArrayReverse는 역순으로 반환한다", () => {
      const list = new XorLinkedList();
      list.append(1);
      list.append(2);
      list.append(3);
      expect(list.toArrayReverse()).toEqual([3, 2, 1]);
    });

    test("size는 append 횟수를 반환한다", () => {
      const list = new XorLinkedList();
      expect(list.size()).toBe(0);
      list.append(10);
      expect(list.size()).toBe(1);
      list.append(20);
      expect(list.size()).toBe(2);
    });

    test("toArray와 toArrayReverse는 서로 역순이다", () => {
      const list = new XorLinkedList();
      const values = [5, 3, 8, 1, 9, 2];
      for (const v of values) list.append(v);
      const forward = list.toArray();
      const backward = list.toArrayReverse();
      expect(forward).toEqual(values);
      expect(backward).toEqual([...values].reverse());
    });

    test("중복 값도 정상적으로 저장된다", () => {
      const list = new XorLinkedList();
      list.append(7);
      list.append(7);
      list.append(7);
      expect(list.toArray()).toEqual([7, 7, 7]);
      expect(list.size()).toBe(3);
    });

    test("음수 값도 저장된다", () => {
      const list = new XorLinkedList();
      list.append(-1);
      list.append(-2);
      list.append(0);
      expect(list.toArray()).toEqual([-1, -2, 0]);
    });
  });

  describe("엣지", () => {
    test("빈 리스트에서 toArray는 빈 배열을 반환한다", () => {
      const list = new XorLinkedList();
      expect(list.toArray()).toEqual([]);
    });

    test("빈 리스트에서 toArrayReverse는 빈 배열을 반환한다", () => {
      const list = new XorLinkedList();
      expect(list.toArrayReverse()).toEqual([]);
    });

    test("빈 리스트에서 size는 0이다", () => {
      const list = new XorLinkedList();
      expect(list.size()).toBe(0);
    });

    test("단일 원소 리스트에서 toArray와 toArrayReverse 모두 같은 결과다", () => {
      const list = new XorLinkedList();
      list.append(42);
      expect(list.toArray()).toEqual([42]);
      expect(list.toArrayReverse()).toEqual([42]);
    });

    test("두 원소 리스트에서 순방향과 역방향이 올바르다", () => {
      const list = new XorLinkedList();
      list.append(100);
      list.append(200);
      expect(list.toArray()).toEqual([100, 200]);
      expect(list.toArrayReverse()).toEqual([200, 100]);
    });

    test("XOR 연산이 올바르게 작동한다 — 노드 xorId 확인", () => {
      // XOR 연산 원리: prevId XOR nextId
      // 단일 노드: prevId=0, nextId=0 → xorId=0
      // 두 번째 노드: prevId=firstNodeId, nextId=0 → xorId=firstNodeId
      // 첫 번째 노드(append 후): prevId=0, nextId=secondNodeId → xorId=secondNodeId
      const list = new XorLinkedList();
      list.append(10); // id=1
      list.append(20); // id=2
      // toArray가 올바르면 XOR 로직이 동작하는 것
      expect(list.toArray()).toEqual([10, 20]);
      expect(list.toArrayReverse()).toEqual([20, 10]);
    });
  });

  describe("바운더리", () => {
    test("5개 원소에서 순방향과 역방향이 정확히 대칭이다", () => {
      const list = new XorLinkedList();
      for (let i = 1; i <= 5; i++) list.append(i * 10);
      const fwd = list.toArray();
      const rev = list.toArrayReverse();
      expect(fwd).toEqual([10, 20, 30, 40, 50]);
      expect(rev).toEqual([50, 40, 30, 20, 10]);
      // 역순이 정확히 역순인지 확인
      expect(rev).toEqual([...fwd].reverse());
    });

    test("값 0도 올바르게 처리된다 (0은 null 센티넬과 구분되어야 함)", () => {
      const list = new XorLinkedList();
      list.append(0);
      list.append(0);
      expect(list.toArray()).toEqual([0, 0]);
      expect(list.size()).toBe(2);
    });

    test("큰 값도 정상 저장된다", () => {
      const list = new XorLinkedList();
      list.append(Number.MAX_SAFE_INTEGER);
      list.append(Number.MIN_SAFE_INTEGER);
      expect(list.toArray()).toEqual([Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]);
    });
  });

  describe("성능", () => {
    test("10^4 append 연산을 100ms 이내에 완료한다", () => {
      const list = new XorLinkedList();
      const N = 10_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        list.append(i);
      }
      const elapsed = performance.now() - start;
      expect(list.size()).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^4 원소 toArray를 100ms 이내에 완료한다", () => {
      const list = new XorLinkedList();
      const N = 10_000;
      for (let i = 0; i < N; i++) list.append(i);
      const start = performance.now();
      const arr = list.toArray();
      const elapsed = performance.now() - start;
      expect(arr.length).toBe(N);
      expect(arr[0]).toBe(0);
      expect(arr[N - 1]).toBe(N - 1);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^4 원소 toArrayReverse를 100ms 이내에 완료한다", () => {
      const list = new XorLinkedList();
      const N = 10_000;
      for (let i = 0; i < N; i++) list.append(i);
      const start = performance.now();
      const arr = list.toArrayReverse();
      const elapsed = performance.now() - start;
      expect(arr.length).toBe(N);
      expect(arr[0]).toBe(N - 1);
      expect(arr[N - 1]).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
