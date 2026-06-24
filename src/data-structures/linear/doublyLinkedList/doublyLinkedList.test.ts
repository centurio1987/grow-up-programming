import { test, expect, describe } from "bun:test";
import { DoublyLinkedList } from "./doublyLinkedList";

describe("DoublyLinkedList", () => {
  describe("기본", () => {
    test("append로 추가된 순서대로 toArray에 나타난다", () => {
      const list = new DoublyLinkedList<number>();
      list.append(1);
      list.append(2);
      list.append(3);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test("prepend는 맨 앞에 추가된다", () => {
      const list = new DoublyLinkedList<number>();
      list.append(2);
      list.prepend(1);
      list.prepend(0);
      expect(list.toArray()).toEqual([0, 1, 2]);
    });

    test("insertAfter는 해당 노드 뒤에 삽입한다", () => {
      const list = new DoublyLinkedList<number>();
      const n1 = list.append(1);
      const n3 = list.append(3);
      list.insertAfter(n1, 2);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    test("remove는 노드를 리스트에서 제거한다", () => {
      const list = new DoublyLinkedList<number>();
      const n1 = list.append(1);
      const n2 = list.append(2);
      list.append(3);
      list.remove(n2);
      expect(list.toArray()).toEqual([1, 3]);
    });

    test("size는 현재 노드 개수를 반환한다", () => {
      const list = new DoublyLinkedList<number>();
      expect(list.size()).toBe(0);
      list.append(1);
      list.append(2);
      expect(list.size()).toBe(2);
      list.remove(list.prepend(0));
      expect(list.size()).toBe(2);
    });
  });

  describe("엣지", () => {
    test("빈 리스트의 toArray는 빈 배열을 반환한다", () => {
      const list = new DoublyLinkedList<number>();
      expect(list.toArray()).toEqual([]);
    });

    test("헤드 노드를 remove하면 다음 노드가 헤드가 된다", () => {
      const list = new DoublyLinkedList<number>();
      const head = list.append(1);
      list.append(2);
      list.remove(head);
      expect(list.toArray()).toEqual([2]);
    });

    test("테일 노드를 remove하면 이전 노드가 테일이 된다", () => {
      const list = new DoublyLinkedList<number>();
      list.append(1);
      const tail = list.append(2);
      list.remove(tail);
      expect(list.toArray()).toEqual([1]);
    });

    test("단일 노드를 remove하면 빈 리스트가 된다", () => {
      const list = new DoublyLinkedList<number>();
      const n = list.append(42);
      list.remove(n);
      expect(list.toArray()).toEqual([]);
      expect(list.size()).toBe(0);
    });

    test("insertAfter가 반환한 노드는 즉시 remove 가능하다", () => {
      const list = new DoublyLinkedList<number>();
      const n1 = list.append(1);
      list.append(3);
      const n2 = list.insertAfter(n1, 2);
      list.remove(n2);
      expect(list.toArray()).toEqual([1, 3]);
    });
  });

  describe("바운더리", () => {
    test("prev / next 포인터 일관성 — 3개 노드", () => {
      const list = new DoublyLinkedList<number>();
      const n1 = list.append(1);
      const n2 = list.append(2);
      const n3 = list.append(3);
      expect(n1.prev).toBeNull();
      expect(n1.next?.value).toBe(2);
      expect(n2.prev?.value).toBe(1);
      expect(n2.next?.value).toBe(3);
      expect(n3.prev?.value).toBe(2);
      expect(n3.next).toBeNull();
    });
  });

  describe("성능", () => {
    test("10^5 append + 모두 remove를 100ms 이내에 처리한다", () => {
      const list = new DoublyLinkedList<number>();
      const N = 100_000;
      const nodes = [];
      const start = performance.now();
      for (let i = 0; i < N; i++) nodes.push(list.append(i));
      for (const n of nodes) list.remove(n);
      expect(performance.now() - start).toBeLessThan(100);
      expect(list.size()).toBe(0);
    });
  });
});
