import { test, expect, describe } from "bun:test";
import { Multiset } from "./multiset";

describe("Multiset", () => {
  describe("기본", () => {
    test("숫자 원소 삽입 후 정렬 순서를 유지한다", () => {
      const ms = new Multiset<number>();
      ms.add(3);
      ms.add(1);
      ms.add(2);
      expect(ms.toArray()).toEqual([1, 2, 3]);
    });

    test("중복 원소를 허용하며 size에 포함된다", () => {
      const ms = new Multiset<number>();
      ms.add(5);
      ms.add(5);
      ms.add(5);
      expect(ms.size()).toBe(3);
      expect(ms.count(5)).toBe(3);
    });

    test("has — 존재하는 원소는 true 반환", () => {
      const ms = new Multiset<number>();
      ms.add(10);
      expect(ms.has(10)).toBe(true);
      expect(ms.has(99)).toBe(false);
    });

    test("delete — 하나만 제거한다", () => {
      const ms = new Multiset<number>();
      ms.add(4);
      ms.add(4);
      ms.add(4);
      const removed = ms.delete(4);
      expect(removed).toBe(true);
      expect(ms.count(4)).toBe(2);
      expect(ms.size()).toBe(2);
    });

    test("delete — 없는 원소 삭제 시 false 반환", () => {
      const ms = new Multiset<number>();
      ms.add(1);
      expect(ms.delete(99)).toBe(false);
    });

    test("deleteAll — 해당 원소 모두 제거 후 개수 반환", () => {
      const ms = new Multiset<number>();
      ms.add(7);
      ms.add(7);
      ms.add(7);
      ms.add(8);
      const cnt = ms.deleteAll(7);
      expect(cnt).toBe(3);
      expect(ms.has(7)).toBe(false);
      expect(ms.size()).toBe(1);
    });

    test("min / max 반환", () => {
      const ms = new Multiset<number>();
      ms.add(5);
      ms.add(1);
      ms.add(9);
      ms.add(3);
      expect(ms.min()).toBe(1);
      expect(ms.max()).toBe(9);
    });
  });

  describe("특수 기능", () => {
    test("커스텀 comparator — 내림차순 정렬", () => {
      const ms = new Multiset<number>((a, b) => b - a);
      ms.add(1);
      ms.add(3);
      ms.add(2);
      expect(ms.toArray()).toEqual([3, 2, 1]);
    });

    test("문자열 멀티셋", () => {
      const ms = new Multiset<string>();
      ms.add("banana");
      ms.add("apple");
      ms.add("apple");
      ms.add("cherry");
      expect(ms.toArray()).toEqual(["apple", "apple", "banana", "cherry"]);
      expect(ms.count("apple")).toBe(2);
    });

    test("슬라이딩 윈도우 중앙값 시뮬레이션 — lower/upper 두 Multiset 활용", () => {
      // 스트림: [1, 3, -1, -3, 5, 3, 6, 7], 윈도우 크기 3
      // 중앙값: [1, -1, -1, 3, 5, 6]
      const nums = [1, 3, -1, -3, 5, 3, 6, 7];
      const k = 3;
      const lower = new Multiset<number>(); // 작은 절반 (내림차순으로 max가 중앙)
      const upper = new Multiset<number>(); // 큰 절반 (오름차순으로 min이 중앙)
      const results: number[] = [];

      const rebalance = () => {
        // lower가 더 크면 upper로 이동
        while (lower.size() > upper.size() + 1) {
          const val = lower.max()!;
          lower.delete(val);
          upper.add(val);
        }
        // upper가 더 크면 lower로 이동
        while (upper.size() > lower.size()) {
          const val = upper.min()!;
          upper.delete(val);
          lower.add(val);
        }
      };

      const addNum = (n: number) => {
        if (lower.size() === 0 || n <= lower.max()!) {
          lower.add(n);
        } else {
          upper.add(n);
        }
        rebalance();
      };

      const removeNum = (n: number) => {
        if (lower.has(n)) {
          lower.delete(n);
        } else {
          upper.delete(n);
        }
        rebalance();
      };

      const getMedian = (): number => {
        return lower.max()!;
      };

      for (let i = 0; i < nums.length; i++) {
        addNum(nums[i]!);
        if (i >= k) {
          removeNum(nums[i - k]!);
        }
        if (i >= k - 1) {
          results.push(getMedian());
        }
      }

      expect(results).toEqual([1, -1, -1, 3, 5, 6]);
    });

    test("같은 값 여러 번 deleteAll — 없는 원소는 0 반환", () => {
      const ms = new Multiset<number>();
      ms.add(1);
      expect(ms.deleteAll(99)).toBe(0);
    });
  });

  describe("엣지", () => {
    test("빈 컬렉션 — min/max는 undefined", () => {
      const ms = new Multiset<number>();
      expect(ms.min()).toBeUndefined();
      expect(ms.max()).toBeUndefined();
      expect(ms.size()).toBe(0);
      expect(ms.toArray()).toEqual([]);
    });

    test("단일 원소 삽입/삭제 후 다시 빈 상태", () => {
      const ms = new Multiset<number>();
      ms.add(42);
      ms.delete(42);
      expect(ms.size()).toBe(0);
      expect(ms.has(42)).toBe(false);
      expect(ms.min()).toBeUndefined();
    });

    test("음수 포함 정렬", () => {
      const ms = new Multiset<number>();
      [-5, 0, -10, 3, -5].forEach((v) => ms.add(v));
      expect(ms.toArray()).toEqual([-10, -5, -5, 0, 3]);
      expect(ms.min()).toBe(-10);
      expect(ms.max()).toBe(3);
    });

    test("count — 존재하지 않는 원소는 0 반환", () => {
      const ms = new Multiset<number>();
      expect(ms.count(100)).toBe(0);
    });
  });

  describe("성능", () => {
    test("n=10^4 add/delete/count 연산 100ms 이내", () => {
      const ms = new Multiset<number>();
      const n = 10_000;
      const start = performance.now();

      for (let i = 0; i < n; i++) {
        ms.add(Math.floor(Math.random() * n));
      }
      for (let i = 0; i < n / 2; i++) {
        ms.delete(Math.floor(Math.random() * n));
      }
      for (let i = 0; i < n / 4; i++) {
        ms.count(Math.floor(Math.random() * n));
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
