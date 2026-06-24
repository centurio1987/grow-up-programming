import { test, expect, describe } from "bun:test";
import { VanEmdeBoasTree } from "./vanEmdeBoasTree";

describe("VanEmdeBoasTree", () => {
  describe("기본 삽입 및 탐색", () => {
    test("insert 후 has는 true를 반환한다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(5);
      expect(veb.has(5)).toBe(true);
    });

    test("존재하지 않는 값에 has는 false를 반환한다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(5);
      expect(veb.has(10)).toBe(false);
    });

    test("빈 트리에서 has는 false를 반환한다", () => {
      const veb = new VanEmdeBoasTree(16);
      expect(veb.has(0)).toBe(false);
    });

    test("여러 값을 삽입한 후 모두 탐색 가능하다", () => {
      const veb = new VanEmdeBoasTree(64);
      const values = [0, 7, 15, 31, 42, 55, 63];
      for (const v of values) veb.insert(v);
      for (const v of values) expect(veb.has(v)).toBe(true);
    });

    test("경계값 0을 삽입하고 탐색할 수 있다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(0);
      expect(veb.has(0)).toBe(true);
    });

    test("경계값 U-1을 삽입하고 탐색할 수 있다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(15);
      expect(veb.has(15)).toBe(true);
    });
  });

  describe("min / max", () => {
    test("빈 트리의 min은 undefined이다", () => {
      const veb = new VanEmdeBoasTree(16);
      expect(veb.min()).toBeUndefined();
    });

    test("빈 트리의 max는 undefined이다", () => {
      const veb = new VanEmdeBoasTree(16);
      expect(veb.max()).toBeUndefined();
    });

    test("단일 원소 삽입 후 min과 max가 그 값이다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(7);
      expect(veb.min()).toBe(7);
      expect(veb.max()).toBe(7);
    });

    test("여러 원소 삽입 후 min이 최솟값을 반환한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [10, 3, 25, 7, 42]) veb.insert(v);
      expect(veb.min()).toBe(3);
    });

    test("여러 원소 삽입 후 max가 최댓값을 반환한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [10, 3, 25, 7, 42]) veb.insert(v);
      expect(veb.max()).toBe(42);
    });

    test("0을 포함하는 경우 min이 0이다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(0);
      veb.insert(5);
      veb.insert(10);
      expect(veb.min()).toBe(0);
    });
  });

  describe("delete", () => {
    test("존재하는 값 삭제 후 has는 false를 반환한다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(5);
      veb.delete(5);
      expect(veb.has(5)).toBe(false);
    });

    test("삭제 후 다른 값들은 여전히 존재한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [1, 5, 10, 15, 20]) veb.insert(v);
      veb.delete(5);
      expect(veb.has(5)).toBe(false);
      for (const v of [1, 10, 15, 20]) expect(veb.has(v)).toBe(true);
    });

    test("최솟값 삭제 후 min이 업데이트된다", () => {
      const veb = new VanEmdeBoasTree(32);
      for (const v of [3, 7, 15, 20]) veb.insert(v);
      veb.delete(3);
      expect(veb.min()).toBe(7);
    });

    test("최댓값 삭제 후 max가 업데이트된다", () => {
      const veb = new VanEmdeBoasTree(32);
      for (const v of [3, 7, 15, 20]) veb.insert(v);
      veb.delete(20);
      expect(veb.max()).toBe(15);
    });

    test("단일 원소 삭제 후 트리는 비어있다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(5);
      veb.delete(5);
      expect(veb.min()).toBeUndefined();
      expect(veb.max()).toBeUndefined();
    });

    test("0 삭제 후 min이 업데이트된다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(0);
      veb.insert(7);
      veb.delete(0);
      expect(veb.min()).toBe(7);
      expect(veb.has(0)).toBe(false);
    });
  });

  describe("successor", () => {
    test("값보다 큰 가장 작은 원소를 반환한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [5, 10, 15, 20, 25]) veb.insert(v);
      expect(veb.successor(10)).toBe(15);
    });

    test("최댓값의 successor는 undefined이다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [5, 10, 15]) veb.insert(v);
      expect(veb.successor(15)).toBeUndefined();
    });

    test("없는 값의 successor도 올바르게 반환한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [5, 10, 20]) veb.insert(v);
      expect(veb.successor(7)).toBe(10);
    });

    test("빈 트리의 successor는 undefined이다", () => {
      const veb = new VanEmdeBoasTree(16);
      expect(veb.successor(5)).toBeUndefined();
    });

    test("단일 원소 트리에서 그 원소보다 작은 값의 successor는 그 원소이다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(10);
      expect(veb.successor(5)).toBe(10);
    });

    test("successor 체인이 올바르다", () => {
      const veb = new VanEmdeBoasTree(32);
      for (const v of [1, 5, 9, 13, 17]) veb.insert(v);
      expect(veb.successor(1)).toBe(5);
      expect(veb.successor(5)).toBe(9);
      expect(veb.successor(9)).toBe(13);
      expect(veb.successor(13)).toBe(17);
      expect(veb.successor(17)).toBeUndefined();
    });

    test("0의 successor를 찾을 수 있다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(0);
      veb.insert(7);
      expect(veb.successor(0)).toBe(7);
    });
  });

  describe("predecessor", () => {
    test("값보다 작은 가장 큰 원소를 반환한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [5, 10, 15, 20, 25]) veb.insert(v);
      expect(veb.predecessor(15)).toBe(10);
    });

    test("최솟값의 predecessor는 undefined이다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [5, 10, 15]) veb.insert(v);
      expect(veb.predecessor(5)).toBeUndefined();
    });

    test("없는 값의 predecessor도 올바르게 반환한다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [5, 10, 20]) veb.insert(v);
      expect(veb.predecessor(13)).toBe(10);
    });

    test("빈 트리의 predecessor는 undefined이다", () => {
      const veb = new VanEmdeBoasTree(16);
      expect(veb.predecessor(5)).toBeUndefined();
    });

    test("predecessor 체인이 올바르다", () => {
      const veb = new VanEmdeBoasTree(32);
      for (const v of [2, 6, 10, 14, 18]) veb.insert(v);
      expect(veb.predecessor(18)).toBe(14);
      expect(veb.predecessor(14)).toBe(10);
      expect(veb.predecessor(10)).toBe(6);
      expect(veb.predecessor(6)).toBe(2);
      expect(veb.predecessor(2)).toBeUndefined();
    });
  });

  describe("복합 연산", () => {
    test("insert → delete → insert 순환이 올바르게 동작한다", () => {
      const veb = new VanEmdeBoasTree(32);
      veb.insert(10);
      veb.delete(10);
      veb.insert(10);
      expect(veb.has(10)).toBe(true);
      expect(veb.min()).toBe(10);
    });

    test("successor와 predecessor가 서로 역관계이다", () => {
      const veb = new VanEmdeBoasTree(64);
      for (const v of [3, 9, 17, 31, 47]) veb.insert(v);
      const s = veb.successor(9);
      if (s !== undefined) {
        expect(veb.predecessor(s)).toBe(9);
      }
    });

    test("삭제 후 successor가 업데이트된다", () => {
      const veb = new VanEmdeBoasTree(32);
      for (const v of [5, 10, 15]) veb.insert(v);
      veb.delete(10);
      expect(veb.successor(5)).toBe(15);
    });

    test("대량 삽입 후 min/max가 올바르다", () => {
      const veb = new VanEmdeBoasTree(256);
      const values = [100, 50, 200, 1, 255, 128, 75];
      for (const v of values) veb.insert(v);
      expect(veb.min()).toBe(Math.min(...values));
      expect(veb.max()).toBe(Math.max(...values));
    });
  });

  describe("엣지", () => {
    test("U=2일 때 0과 1을 저장한다", () => {
      const veb = new VanEmdeBoasTree(2);
      veb.insert(0);
      veb.insert(1);
      expect(veb.has(0)).toBe(true);
      expect(veb.has(1)).toBe(true);
      expect(veb.min()).toBe(0);
      expect(veb.max()).toBe(1);
    });

    test("U=4일 때 기본 동작이 올바르다", () => {
      const veb = new VanEmdeBoasTree(4);
      veb.insert(2);
      veb.insert(0);
      expect(veb.min()).toBe(0);
      expect(veb.successor(0)).toBe(2);
      expect(veb.predecessor(2)).toBe(0);
    });

    test("U=256일 때 전체 범위를 사용한다", () => {
      const veb = new VanEmdeBoasTree(256);
      veb.insert(0);
      veb.insert(128);
      veb.insert(255);
      expect(veb.min()).toBe(0);
      expect(veb.max()).toBe(255);
      expect(veb.successor(0)).toBe(128);
      expect(veb.successor(128)).toBe(255);
    });

    test("중복 삽입은 무시된다", () => {
      const veb = new VanEmdeBoasTree(16);
      veb.insert(5);
      veb.insert(5);
      expect(veb.min()).toBe(5);
      expect(veb.max()).toBe(5);
      expect(veb.successor(5)).toBeUndefined();
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + has가 100ms 이내에 완료된다 (U=2^16)", () => {
      const veb = new VanEmdeBoasTree(65536);
      const n = 10_000;
      const start = Date.now();
      for (let i = 0; i < n; i++) veb.insert(i);
      for (let i = 0; i < n; i++) expect(veb.has(i)).toBe(true);
      expect(Date.now() - start).toBeLessThan(100);
    });

    test("n=10^4 successor 질의가 100ms 이내에 완료된다 (U=2^16)", () => {
      const veb = new VanEmdeBoasTree(65536);
      const n = 10_000;
      for (let i = 0; i < n; i++) veb.insert(i * 2);
      const start = Date.now();
      for (let i = 0; i < n - 1; i++) {
        const s = veb.successor(i * 2);
        expect(s).toBe(i * 2 + 2);
      }
      expect(Date.now() - start).toBeLessThan(100);
    });
  });
});
