import { test, expect, describe } from "bun:test";
import { SinglyLinkedList, ListNode } from "./singlyLinkedList";

describe("SinglyLinkedList", () => {
  describe("기본", () => {
    test("append로 값을 추가하면 toArray에서 순서대로 반환된다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(1);
      list.append(2);
      list.append(3);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test("prepend로 값을 추가하면 맨 앞에 삽입된다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(2);
      list.append(3);
      list.prepend(1);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test("removeFirst는 맨 앞 값을 제거하고 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(10);
      list.append(20);
      const removed = list.removeFirst();
      expect(removed).toBe(10);
      expect(list.toArray()).toEqual([20]);
    });

    test("find는 값이 있는 노드를 반환한다", () => {
      const list = new SinglyLinkedList<string>();
      list.append("a");
      list.append("b");
      list.append("c");
      const node = list.find("b");
      expect(node).not.toBeNull();
      expect(node?.value).toBe("b");
    });

    test("find는 없는 값에 대해 null을 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(1);
      list.append(2);
      expect(list.find(99)).toBeNull();
    });

    test("size는 현재 노드 개수를 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      expect(list.size()).toBe(0);
      list.append(1);
      list.append(2);
      expect(list.size()).toBe(2);
      list.removeFirst();
      expect(list.size()).toBe(1);
    });

    test("append와 prepend를 혼합해도 순서가 올바르다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(3);
      list.prepend(2);
      list.prepend(1);
      list.append(4);
      expect(list.toArray()).toEqual([1, 2, 3, 4]);
    });

    test("append가 반환하는 노드는 ListNode 인스턴스이다", () => {
      const list = new SinglyLinkedList<number>();
      const node = list.append(42);
      expect(node).toBeInstanceOf(ListNode);
      expect(node.value).toBe(42);
    });

    test("prepend가 반환하는 노드는 ListNode 인스턴스이다", () => {
      const list = new SinglyLinkedList<number>();
      const node = list.prepend(7);
      expect(node).toBeInstanceOf(ListNode);
      expect(node.value).toBe(7);
    });
  });

  describe("엣지", () => {
    test("빈 리스트에서 removeFirst는 undefined를 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      expect(list.removeFirst()).toBeUndefined();
    });

    test("빈 리스트에서 find는 null을 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      expect(list.find(1)).toBeNull();
    });

    test("빈 리스트에서 toArray는 빈 배열을 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      expect(list.toArray()).toEqual([]);
    });

    test("단일 원소 리스트에서 removeFirst 후 리스트는 비어있다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(42);
      list.removeFirst();
      expect(list.size()).toBe(0);
      expect(list.toArray()).toEqual([]);
    });

    test("단일 원소 리스트에서 removeFirst 후 append가 정상 동작한다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(1);
      list.removeFirst();
      list.append(2);
      expect(list.toArray()).toEqual([2]);
      expect(list.size()).toBe(1);
    });

    test("중복된 값이 있을 때 find는 첫 번째 노드를 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(5);
      list.append(5);
      list.append(5);
      const node = list.find(5);
      expect(node).not.toBeNull();
      // 첫 번째 노드의 next도 같은 값을 가짐
      expect(node?.next?.value).toBe(5);
    });

    test("모든 노드를 removeFirst로 제거하면 size는 0이 된다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(1);
      list.append(2);
      list.append(3);
      list.removeFirst();
      list.removeFirst();
      list.removeFirst();
      expect(list.size()).toBe(0);
      expect(list.toArray()).toEqual([]);
    });

    test("removeFirst 후 다시 append해도 tail이 올바르게 유지된다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(1);
      list.append(2);
      list.removeFirst();
      list.removeFirst();
      list.append(3);
      list.append(4);
      expect(list.toArray()).toEqual([3, 4]);
    });
  });

  describe("바운더리", () => {
    test("단일 원소 리스트의 prepend 후 toArray는 두 원소를 반환한다", () => {
      const list = new SinglyLinkedList<number>();
      list.append(2);
      list.prepend(1);
      expect(list.toArray()).toEqual([1, 2]);
      expect(list.size()).toBe(2);
    });

    test("문자열 타입에서도 올바르게 동작한다", () => {
      const list = new SinglyLinkedList<string>();
      list.append("hello");
      list.append("world");
      expect(list.toArray()).toEqual(["hello", "world"]);
      expect(list.find("hello")?.value).toBe("hello");
    });

    test("객체 타입에서도 올바르게 동작한다", () => {
      const list = new SinglyLinkedList<{ id: number }>();
      const a = { id: 1 };
      const b = { id: 2 };
      list.append(a);
      list.append(b);
      expect(list.find(a)?.value).toBe(a);
      expect(list.find({ id: 1 })).toBeNull(); // 참조 비교
    });
  });

  describe("성능", () => {
    test("10^5 append 연산을 100ms 이내에 완료한다", () => {
      const list = new SinglyLinkedList<number>();
      const N = 100_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        list.append(i);
      }
      const elapsed = performance.now() - start;
      expect(list.size()).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 prepend 연산을 100ms 이내에 완료한다", () => {
      const list = new SinglyLinkedList<number>();
      const N = 100_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        list.prepend(i);
      }
      const elapsed = performance.now() - start;
      expect(list.size()).toBe(N);
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 removeFirst 연산을 100ms 이내에 완료한다", () => {
      const list = new SinglyLinkedList<number>();
      const N = 100_000;
      for (let i = 0; i < N; i++) {
        list.append(i);
      }
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        list.removeFirst();
      }
      const elapsed = performance.now() - start;
      expect(list.size()).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
