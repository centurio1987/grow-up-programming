import { test, expect, describe } from "bun:test";
import { HashMapOpenAddressing } from "./hashMapOpenAddressing";

describe("HashMapOpenAddressing", () => {
  describe("기본", () => {
    test("set 후 get은 값을 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      map.set("hello", 42);
      expect(map.get("hello")).toBe(42);
    });

    test("없는 키는 undefined를 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      expect(map.get("missing")).toBeUndefined();
    });

    test("has는 키 존재 여부를 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      map.set("x", 10);
      expect(map.has("x")).toBe(true);
      expect(map.has("y")).toBe(false);
    });

    test("delete 후 get은 undefined를 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      map.set("foo", 99);
      expect(map.delete("foo")).toBe(true);
      expect(map.get("foo")).toBeUndefined();
      expect(map.has("foo")).toBe(false);
    });

    test("delete는 없는 키에 false를 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      expect(map.delete("nonexistent")).toBe(false);
    });

    test("size는 저장된 항목 수를 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      expect(map.size()).toBe(0);
      map.set("a", 1);
      map.set("b", 2);
      expect(map.size()).toBe(2);
      map.delete("a");
      expect(map.size()).toBe(1);
    });

    test("같은 키에 set 두 번 시 값을 덮어쓴다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      map.set("key", 1);
      map.set("key", 99);
      expect(map.get("key")).toBe(99);
      expect(map.size()).toBe(1);
    });
  });

  describe("충돌 처리 (선형 탐사)", () => {
    test("충돌 발생 시 다음 빈 슬롯에 저장되고 올바르게 조회된다", () => {
      // capacity=4로 강제 충돌 유발
      const map = new HashMapOpenAddressing<string, number>(4);
      map.set("ab", 1);
      map.set("ba", 2);
      expect(map.get("ab")).toBe(1);
      expect(map.get("ba")).toBe(2);
    });

    test("tombstone이 있어도 이후 키를 올바르게 탐색한다", () => {
      const map = new HashMapOpenAddressing<string, number>(8);
      // 세 키가 같은 해시 → 선형 탐사로 연속 배치
      map.set("key0", 0);
      map.set("key1", 1);
      map.set("key2", 2);
      // 중간 삭제 → tombstone
      map.delete("key1");
      // key2는 tombstone을 건너뛰어 탐색
      expect(map.get("key2")).toBe(2);
      expect(map.get("key0")).toBe(0);
    });

    test("삭제 후 재삽입된 키를 tombstone 슬롯에 올바르게 배치한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      map.set("temp", 1);
      map.delete("temp");
      map.set("temp", 2);
      expect(map.get("temp")).toBe(2);
      expect(map.size()).toBe(1);
    });

    test("여러 충돌 후 삭제해도 나머지 키가 정상 동작한다", () => {
      const map = new HashMapOpenAddressing<string, number>(4);
      map.set("a", 10);
      map.set("b", 20);
      map.set("c", 30);
      map.delete("a");
      map.delete("b");
      expect(map.get("c")).toBe(30);
      expect(map.size()).toBe(1);
    });
  });

  describe("리사이징", () => {
    test("load factor 0.5 초과 시 자동 확장되어 모든 데이터가 유지된다", () => {
      const map = new HashMapOpenAddressing<string, number>(4);
      // 4 * 0.5 = 2 항목 삽입 시 리사이징 발생
      for (let i = 0; i < 20; i++) {
        map.set(`k${i}`, i);
      }
      expect(map.size()).toBe(20);
      for (let i = 0; i < 20; i++) {
        expect(map.get(`k${i}`)).toBe(i);
      }
    });

    test("리사이징 후 새로 삽입한 키도 올바르게 동작한다", () => {
      const map = new HashMapOpenAddressing<number, string>(2);
      for (let i = 0; i < 10; i++) {
        map.set(i, `val${i}`);
      }
      map.set(999, "new");
      expect(map.get(999)).toBe("new");
      expect(map.size()).toBe(11);
    });

    test("리사이징 시 tombstone은 재해시에서 제외된다", () => {
      const map = new HashMapOpenAddressing<string, number>(4);
      map.set("a", 1);
      map.set("b", 2);
      map.delete("a");
      // 이 시점에서 리사이징 발생 가능
      map.set("c", 3);
      map.set("d", 4);
      expect(map.get("b")).toBe(2);
      expect(map.get("c")).toBe(3);
      expect(map.get("d")).toBe(4);
      expect(map.has("a")).toBe(false);
    });
  });

  describe("엣지", () => {
    test("빈 맵에서 get은 undefined를 반환한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      expect(map.get("anything")).toBeUndefined();
    });

    test("숫자 키도 올바르게 동작한다", () => {
      const map = new HashMapOpenAddressing<number, string>();
      map.set(0, "zero");
      map.set(1, "one");
      map.set(-1, "neg");
      expect(map.get(0)).toBe("zero");
      expect(map.get(1)).toBe("one");
      expect(map.get(-1)).toBe("neg");
    });

    test("모든 항목 삭제 후 size는 0이다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      map.set("a", 1);
      map.set("b", 2);
      map.delete("a");
      map.delete("b");
      expect(map.size()).toBe(0);
    });

    test("연속 삽입-삭제-삽입 반복이 올바르게 동작한다", () => {
      const map = new HashMapOpenAddressing<string, number>();
      for (let round = 0; round < 5; round++) {
        map.set("key", round);
        expect(map.get("key")).toBe(round);
        map.delete("key");
        expect(map.has("key")).toBe(false);
      }
      expect(map.size()).toBe(0);
    });
  });

  describe("성능", () => {
    test("10^5 set/get 100ms 이내", () => {
      const map = new HashMapOpenAddressing<string, number>();
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
      const map = new HashMapOpenAddressing<string, number>();
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
