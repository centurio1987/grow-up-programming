import { test, expect, describe } from "bun:test";
import { HashMapChaining } from "./hashMapChaining";

describe("HashMapChaining", () => {
  describe("기본", () => {
    test("set 후 get은 값을 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("apple", 1);
      expect(map.get("apple")).toBe(1);
    });

    test("없는 키는 undefined를 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      expect(map.get("missing")).toBeUndefined();
    });

    test("has는 키 존재 여부를 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("x", 10);
      expect(map.has("x")).toBe(true);
      expect(map.has("y")).toBe(false);
    });

    test("delete 후 get은 undefined를 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("foo", 42);
      expect(map.delete("foo")).toBe(true);
      expect(map.get("foo")).toBeUndefined();
    });

    test("delete는 없는 키에 false를 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      expect(map.delete("nonexistent")).toBe(false);
    });

    test("size는 저장된 항목 수를 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      expect(map.size()).toBe(0);
      map.set("a", 1);
      map.set("b", 2);
      expect(map.size()).toBe(2);
      map.delete("a");
      expect(map.size()).toBe(1);
    });

    test("keys는 모든 키 배열을 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3);
      const keys = map.keys().sort();
      expect(keys).toEqual(["a", "b", "c"]);
    });

    test("values는 모든 값 배열을 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("a", 10);
      map.set("b", 20);
      const values = map.values().sort((a, b) => a - b);
      expect(values).toEqual([10, 20]);
    });
  });

  describe("충돌 처리", () => {
    test("다양한 키를 많이 삽입해도 모든 값을 올바르게 조회한다", () => {
      const map = new HashMapChaining<string, number>(4);
      const entries: Array<[string, number]> = [];
      for (let i = 0; i < 20; i++) {
        entries.push([`key${i}`, i * 10]);
      }
      for (const [k, v] of entries) {
        map.set(k, v);
      }
      for (const [k, v] of entries) {
        expect(map.get(k)).toBe(v);
      }
    });

    test("동일 해시가 충돌해도 각각의 키-값을 올바르게 반환한다", () => {
      // capacity=2로 강제 충돌
      const map = new HashMapChaining<string, string>(2);
      map.set("ab", "first");
      map.set("ba", "second");
      expect(map.get("ab")).toBe("first");
      expect(map.get("ba")).toBe("second");
    });

    test("충돌한 키를 삭제해도 같은 버킷의 다른 키는 유지된다", () => {
      const map = new HashMapChaining<string, number>(2);
      map.set("ab", 1);
      map.set("ba", 2);
      map.delete("ab");
      expect(map.get("ab")).toBeUndefined();
      expect(map.get("ba")).toBe(2);
    });
  });

  describe("리사이징", () => {
    test("load factor 0.75 초과 시 자동 확장되어 모든 데이터가 유지된다", () => {
      const map = new HashMapChaining<string, number>(4);
      // 4 * 0.75 = 3 항목 삽입 시 리사이징 발생
      for (let i = 0; i < 20; i++) {
        map.set(`k${i}`, i);
      }
      expect(map.size()).toBe(20);
      for (let i = 0; i < 20; i++) {
        expect(map.get(`k${i}`)).toBe(i);
      }
    });

    test("리사이징 후 새로 삽입한 키도 올바르게 동작한다", () => {
      const map = new HashMapChaining<number, string>(2);
      for (let i = 0; i < 10; i++) {
        map.set(i, `val${i}`);
      }
      map.set(999, "new");
      expect(map.get(999)).toBe("new");
      expect(map.size()).toBe(11);
    });
  });

  describe("엣지", () => {
    test("빈 맵에서 get은 undefined를 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      expect(map.get("anything")).toBeUndefined();
    });

    test("같은 키에 set 두 번 시 값을 덮어쓴다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("key", 1);
      map.set("key", 99);
      expect(map.get("key")).toBe(99);
      expect(map.size()).toBe(1);
    });

    test("숫자 키도 올바르게 동작한다", () => {
      const map = new HashMapChaining<number, string>();
      map.set(0, "zero");
      map.set(1, "one");
      map.set(-1, "neg");
      expect(map.get(0)).toBe("zero");
      expect(map.get(1)).toBe("one");
      expect(map.get(-1)).toBe("neg");
    });

    test("객체 키도 참조 기반으로 동작한다", () => {
      const map = new HashMapChaining<object, string>();
      const key1 = { id: 1 };
      const key2 = { id: 1 };
      map.set(key1, "a");
      map.set(key2, "b");
      expect(map.get(key1)).toBe("a");
      expect(map.get(key2)).toBe("b");
      expect(map.size()).toBe(2);
    });

    test("빈 맵에서 keys와 values는 빈 배열을 반환한다", () => {
      const map = new HashMapChaining<string, number>();
      expect(map.keys()).toEqual([]);
      expect(map.values()).toEqual([]);
    });

    test("모든 항목 삭제 후 size는 0이다", () => {
      const map = new HashMapChaining<string, number>();
      map.set("a", 1);
      map.set("b", 2);
      map.delete("a");
      map.delete("b");
      expect(map.size()).toBe(0);
      expect(map.keys()).toEqual([]);
    });
  });

  describe("성능", () => {
    test("10^5 set/get 100ms 이내", () => {
      const map = new HashMapChaining<string, number>();
      const N = 100_000;
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        map.set(`key${i}`, i);
      }
      for (let i = 0; i < N; i++) {
        expect(map.get(`key${i}`)).toBe(i);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("10^5 has 호출이 100ms 이내", () => {
      const map = new HashMapChaining<string, number>();
      const N = 100_000;
      for (let i = 0; i < N; i++) {
        map.set(`k${i}`, i);
      }
      const start = performance.now();
      for (let i = 0; i < N; i++) {
        expect(map.has(`k${i}`)).toBe(true);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
