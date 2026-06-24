import { test, expect, describe } from "bun:test";
import { HashSet } from "./hashSet";

describe("HashSet", () => {
  describe("기본", () => {
    test("add 후 has는 true를 반환한다", () => {
      const set = new HashSet<string>();
      set.add("alice");
      expect(set.has("alice")).toBe(true);
    });

    test("없는 항목은 has가 false를 반환한다", () => {
      const set = new HashSet<string>();
      expect(set.has("unknown")).toBe(false);
    });

    test("delete 후 has는 false를 반환한다", () => {
      const set = new HashSet<string>();
      set.add("bob");
      expect(set.delete("bob")).toBe(true);
      expect(set.has("bob")).toBe(false);
    });

    test("delete는 없는 항목에 false를 반환한다", () => {
      const set = new HashSet<string>();
      expect(set.delete("nothing")).toBe(false);
    });

    test("size는 저장된 항목 수를 반환한다", () => {
      const set = new HashSet<string>();
      expect(set.size()).toBe(0);
      set.add("a");
      set.add("b");
      expect(set.size()).toBe(2);
      set.delete("a");
      expect(set.size()).toBe(1);
    });

    test("중복 add는 한 번만 저장된다", () => {
      const set = new HashSet<string>();
      set.add("dup");
      set.add("dup");
      set.add("dup");
      expect(set.size()).toBe(1);
    });

    test("values는 저장된 항목 배열을 반환한다", () => {
      const set = new HashSet<string>();
      set.add("x");
      set.add("y");
      set.add("z");
      const vals = set.values().sort();
      expect(vals).toEqual(["x", "y", "z"]);
    });
  });

  describe("집합 연산 — union (합집합)", () => {
    test("두 집합의 합집합을 반환한다", () => {
      const a = new HashSet<string>();
      a.add("alice");
      a.add("bob");

      const b = new HashSet<string>();
      b.add("bob");
      b.add("charlie");

      const result = a.union(b);
      const vals = result.values().sort();
      expect(vals).toEqual(["alice", "bob", "charlie"]);
    });

    test("한 집합이 빈 경우 합집합은 다른 집합과 같다", () => {
      const a = new HashSet<number>();
      a.add(1);
      a.add(2);

      const b = new HashSet<number>();
      const result = a.union(b);
      const vals = result.values().sort((x, y) => x - y);
      expect(vals).toEqual([1, 2]);
    });

    test("두 집합 모두 비어있으면 합집합도 비어있다", () => {
      const a = new HashSet<number>();
      const b = new HashSet<number>();
      const result = a.union(b);
      expect(result.size()).toBe(0);
    });

    test("합집합은 원본 집합을 변경하지 않는다", () => {
      const a = new HashSet<string>();
      a.add("a");
      const b = new HashSet<string>();
      b.add("b");
      a.union(b);
      expect(a.size()).toBe(1);
      expect(b.size()).toBe(1);
    });
  });

  describe("집합 연산 — intersection (교집합)", () => {
    test("두 집합의 공통 요소만 반환한다", () => {
      const alice = new HashSet<string>();
      alice.add("bob");
      alice.add("charlie");
      alice.add("dave");

      const bob = new HashSet<string>();
      bob.add("alice");
      bob.add("charlie");
      bob.add("eve");

      const common = alice.intersection(bob);
      expect(common.values()).toEqual(["charlie"]);
    });

    test("공통 요소가 없으면 빈 집합을 반환한다", () => {
      const a = new HashSet<number>();
      a.add(1);
      a.add(2);

      const b = new HashSet<number>();
      b.add(3);
      b.add(4);

      const result = a.intersection(b);
      expect(result.size()).toBe(0);
    });

    test("모든 요소가 공통이면 크기가 같은 집합을 반환한다", () => {
      const a = new HashSet<string>();
      a.add("x");
      a.add("y");

      const b = new HashSet<string>();
      b.add("x");
      b.add("y");

      const result = a.intersection(b);
      expect(result.size()).toBe(2);
    });

    test("교집합은 원본 집합을 변경하지 않는다", () => {
      const a = new HashSet<string>();
      a.add("a");
      a.add("b");
      const b = new HashSet<string>();
      b.add("b");
      a.intersection(b);
      expect(a.size()).toBe(2);
    });
  });

  describe("집합 연산 — difference (차집합)", () => {
    test("this에만 있는 요소를 반환한다", () => {
      const me = new HashSet<string>();
      me.add("alice");
      me.add("bob");
      me.add("charlie");

      const other = new HashSet<string>();
      other.add("bob");
      other.add("dave");

      const result = me.difference(other);
      const vals = result.values().sort();
      expect(vals).toEqual(["alice", "charlie"]);
    });

    test("other가 this의 부분집합이면 차집합에 나머지 요소가 남는다", () => {
      const a = new HashSet<number>();
      a.add(1);
      a.add(2);
      a.add(3);

      const b = new HashSet<number>();
      b.add(1);

      const result = a.difference(b);
      const vals = result.values().sort((x, y) => x - y);
      expect(vals).toEqual([2, 3]);
    });

    test("other가 this와 동일하면 차집합은 빈 집합이다", () => {
      const a = new HashSet<string>();
      a.add("x");
      a.add("y");

      const b = new HashSet<string>();
      b.add("x");
      b.add("y");

      const result = a.difference(b);
      expect(result.size()).toBe(0);
    });

    test("차집합은 원본 집합을 변경하지 않는다", () => {
      const a = new HashSet<string>();
      a.add("a");
      a.add("b");
      const b = new HashSet<string>();
      b.add("a");
      a.difference(b);
      expect(a.size()).toBe(2);
    });
  });

  describe("리사이징", () => {
    test("많은 항목 삽입 후 모든 항목이 유지된다", () => {
      const set = new HashSet<number>(4);
      for (let i = 0; i < 100; i++) {
        set.add(i);
      }
      expect(set.size()).toBe(100);
      for (let i = 0; i < 100; i++) {
        expect(set.has(i)).toBe(true);
      }
    });
  });

  describe("엣지", () => {
    test("빈 집합에서 values는 빈 배열을 반환한다", () => {
      const set = new HashSet<string>();
      expect(set.values()).toEqual([]);
    });

    test("모든 항목 삭제 후 size는 0이다", () => {
      const set = new HashSet<string>();
      set.add("a");
      set.add("b");
      set.delete("a");
      set.delete("b");
      expect(set.size()).toBe(0);
      expect(set.values()).toEqual([]);
    });

    test("숫자 항목도 올바르게 동작한다", () => {
      const set = new HashSet<number>();
      set.add(0);
      set.add(-1);
      set.add(999);
      expect(set.has(0)).toBe(true);
      expect(set.has(-1)).toBe(true);
      expect(set.has(999)).toBe(true);
      expect(set.has(1)).toBe(false);
    });
  });

  describe("성능", () => {
    test("10^5 add/has 100ms 이내", () => {
      const set = new HashSet<string>();
      const N = 100_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        set.add(`user${i}`);
      }
      for (let i = 0; i < N; i++) {
        expect(set.has(`user${i}`)).toBe(true);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 교집합 계산이 200ms 이내", () => {
      const a = new HashSet<number>();
      const b = new HashSet<number>();
      const N = 100_000;
      for (let i = 0; i < N; i++) {
        a.add(i);
      }
      for (let i = N / 2; i < N + N / 2; i++) {
        b.add(i);
      }
      const start = performance.now();
      const result = a.intersection(b);
      const elapsed = performance.now() - start;
      expect(result.size()).toBe(N / 2);
      expect(elapsed).toBeLessThan(200);
    });
  });
});
