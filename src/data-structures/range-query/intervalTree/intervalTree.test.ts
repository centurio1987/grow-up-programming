import { test, expect, describe } from "bun:test";
import { IntervalTree } from "./intervalTree";

describe("IntervalTree", () => {
  describe("기본 — 삽입 및 크기", () => {
    test("빈 트리 크기는 0", () => {
      const tree = new IntervalTree();
      expect(tree.size()).toBe(0);
    });

    test("삽입 후 크기 증가", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      expect(tree.size()).toBe(1);
      tree.insert(3, 8);
      expect(tree.size()).toBe(2);
      tree.insert(10, 15);
      expect(tree.size()).toBe(3);
    });
  });

  describe("stabQuery — 점 포함 구간 검색", () => {
    test("점을 포함하는 구간 반환", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(3, 8);
      tree.insert(10, 15);

      const result = tree.stabQuery(4);
      const sorted = result.sort(([a], [b]) => a - b);
      expect(sorted).toEqual([[1, 5], [3, 8]]);
    });

    test("경계값 포함 (inclusive)", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(5, 10);

      // point=5는 두 구간 모두 포함
      const result = tree.stabQuery(5);
      expect(result.length).toBe(2);

      // point=1은 첫 구간만
      const r2 = tree.stabQuery(1);
      expect(r2).toEqual([[1, 5]]);

      // point=10은 두 번째 구간만
      const r3 = tree.stabQuery(10);
      expect(r3).toEqual([[5, 10]]);
    });

    test("포함하는 구간 없으면 빈 배열", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(10, 15);

      expect(tree.stabQuery(7)).toEqual([]);
      expect(tree.stabQuery(0)).toEqual([]);
      expect(tree.stabQuery(16)).toEqual([]);
    });

    test("단일 구간 트리에서 점 질의", () => {
      const tree = new IntervalTree();
      tree.insert(3, 7);

      expect(tree.stabQuery(3)).toEqual([[3, 7]]);
      expect(tree.stabQuery(5)).toEqual([[3, 7]]);
      expect(tree.stabQuery(7)).toEqual([[3, 7]]);
      expect(tree.stabQuery(2)).toEqual([]);
      expect(tree.stabQuery(8)).toEqual([]);
    });

    test("모든 구간이 점을 포함하는 경우", () => {
      const tree = new IntervalTree();
      tree.insert(1, 10);
      tree.insert(2, 9);
      tree.insert(3, 8);
      tree.insert(4, 7);

      const result = tree.stabQuery(5);
      expect(result.length).toBe(4);
    });
  });

  describe("overlapQuery — 구간 겹침 검색 (회의실 충돌)", () => {
    test("겹치는 구간 반환", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);   // 예약 A
      tree.insert(4, 8);   // 예약 B — A와 겹침
      tree.insert(10, 15); // 예약 C — 분리됨

      // [3, 6]과 겹치는 예약
      const result = tree.overlapQuery(3, 6);
      const sorted = result.sort(([a], [b]) => a - b);
      expect(sorted).toEqual([[1, 5], [4, 8]]);
    });

    test("완전히 포함된 구간도 겹침으로 판정", () => {
      const tree = new IntervalTree();
      tree.insert(2, 8); // 큰 구간
      tree.insert(3, 5); // 내부 구간

      // [4, 4]는 두 구간 모두와 겹침
      const result = tree.overlapQuery(4, 4);
      expect(result.length).toBe(2);
    });

    test("경계만 닿아도 겹침", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(5, 10);

      const r1 = tree.overlapQuery(5, 5);
      expect(r1.length).toBe(2); // 두 구간 모두 점 5에서 닿음

      const r2 = tree.overlapQuery(1, 1);
      expect(r2.length).toBe(1); // [1,5]만
    });

    test("겹치지 않는 구간은 제외", () => {
      const tree = new IntervalTree();
      tree.insert(1, 3);
      tree.insert(7, 10);

      // [4, 6]은 두 구간 모두와 겹치지 않음
      expect(tree.overlapQuery(4, 6)).toEqual([]);
    });

    test("질의 구간이 저장된 구간을 완전히 포함", () => {
      const tree = new IntervalTree();
      tree.insert(3, 5);
      tree.insert(6, 8);

      const result = tree.overlapQuery(1, 10); // 모든 구간과 겹침
      expect(result.length).toBe(2);
    });

    test("여러 구간 중 일부만 겹침", () => {
      const tree = new IntervalTree();
      tree.insert(1, 2);
      tree.insert(5, 7);
      tree.insert(10, 12);
      tree.insert(15, 20);

      const result = tree.overlapQuery(6, 11);
      const sorted = result.sort(([a], [b]) => a - b);
      expect(sorted).toEqual([[5, 7], [10, 12]]);
    });
  });

  describe("delete — 삭제", () => {
    test("존재하는 구간 삭제 후 크기 감소", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(3, 8);
      expect(tree.size()).toBe(2);

      const deleted = tree.delete(1, 5);
      expect(deleted).toBe(true);
      expect(tree.size()).toBe(1);
    });

    test("삭제 후 질의에서 제외", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(3, 8);

      tree.delete(1, 5);
      const result = tree.stabQuery(4);
      expect(result).toEqual([[3, 8]]);
    });

    test("존재하지 않는 구간 삭제 시 false 반환", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);

      expect(tree.delete(2, 6)).toBe(false); // 없는 구간
      expect(tree.size()).toBe(1); // 크기 변화 없음
    });

    test("모든 구간 삭제 후 빈 트리", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.insert(3, 8);
      tree.insert(10, 15);

      tree.delete(1, 5);
      tree.delete(3, 8);
      tree.delete(10, 15);

      expect(tree.size()).toBe(0);
      expect(tree.stabQuery(4)).toEqual([]);
      expect(tree.overlapQuery(0, 20)).toEqual([]);
    });

    test("삭제 후 재삽입", () => {
      const tree = new IntervalTree();
      tree.insert(1, 5);
      tree.delete(1, 5);
      tree.insert(1, 5);

      expect(tree.size()).toBe(1);
      expect(tree.stabQuery(3)).toEqual([[1, 5]]);
    });
  });

  describe("엣지", () => {
    test("길이 0인 구간 (점 구간)", () => {
      const tree = new IntervalTree();
      tree.insert(5, 5); // 점 구간

      expect(tree.stabQuery(5)).toEqual([[5, 5]]);
      expect(tree.stabQuery(4)).toEqual([]);
      expect(tree.overlapQuery(5, 5)).toEqual([[5, 5]]);
    });

    test("음수 구간", () => {
      const tree = new IntervalTree();
      tree.insert(-10, -5);
      tree.insert(-3, 2);

      expect(tree.stabQuery(-7)).toEqual([[-10, -5]]);
      expect(tree.stabQuery(0)).toEqual([[-3, 2]]);
      expect(tree.stabQuery(-5)).toEqual([[-10, -5]]);
    });

    test("동일 low 값을 가진 여러 구간", () => {
      const tree = new IntervalTree();
      tree.insert(3, 5);
      tree.insert(3, 8);
      tree.insert(3, 10);

      const result = tree.stabQuery(4);
      expect(result.length).toBe(3);
    });

    test("대량 삽입 후 질의 정확도", () => {
      const tree = new IntervalTree();
      const intervals: Array<[number, number]> = [];

      for (let i = 0; i < 100; i++) {
        const low = i * 2;
        const high = low + 3;
        tree.insert(low, high);
        intervals.push([low, high]);
      }

      // point=5는 [4,7]과 [5,8] 두 구간을 포함해야 함
      const result = tree.stabQuery(5);
      const expected = intervals.filter(([l, h]) => l <= 5 && 5 <= h);
      expect(result.length).toBe(expected.length);
    });
  });

  describe("성능", () => {
    test("n=10^4 insert + 10^3 stabQuery 100ms 이내", () => {
      const tree = new IntervalTree();
      const start = performance.now();

      for (let i = 0; i < 10_000; i++) {
        const low = Math.floor(Math.random() * 1_000_000);
        tree.insert(low, low + Math.floor(Math.random() * 1000));
      }

      for (let i = 0; i < 1_000; i++) {
        tree.stabQuery(Math.floor(Math.random() * 1_000_000));
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("n=10^4 insert + 10^3 overlapQuery 100ms 이내", () => {
      const tree = new IntervalTree();
      const start = performance.now();

      for (let i = 0; i < 10_000; i++) {
        const low = Math.floor(Math.random() * 1_000_000);
        tree.insert(low, low + Math.floor(Math.random() * 1000));
      }

      for (let i = 0; i < 1_000; i++) {
        const low = Math.floor(Math.random() * 1_000_000);
        tree.overlapQuery(low, low + Math.floor(Math.random() * 500));
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
