import { test, expect, describe } from "bun:test";
import { PersistentSegmentTree } from "./persistentSegmentTree";

describe("PersistentSegmentTree", () => {
  describe("기본", () => {
    test("초기 버전(0)이 생성된다", () => {
      const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
      expect(tree.versionCount()).toBe(1);
    });

    test("초기 버전의 구간 합이 올바르다 — 전체 구간", () => {
      const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
      expect(tree.query(0, 0, 4)).toBe(15);
    });

    test("초기 버전의 구간 합이 올바르다 — 부분 구간", () => {
      const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
      expect(tree.query(0, 1, 3)).toBe(9); // 2+3+4
    });

    test("초기 버전의 단일 원소 질의가 올바르다", () => {
      const tree = new PersistentSegmentTree([10, 20, 30]);
      expect(tree.query(0, 0, 0)).toBe(10);
      expect(tree.query(0, 1, 1)).toBe(20);
      expect(tree.query(0, 2, 2)).toBe(30);
    });

    test("update가 새 버전 번호를 반환한다", () => {
      const tree = new PersistentSegmentTree([1, 2, 3]);
      const v1 = tree.update(0, 1, 10);
      expect(v1).toBe(1);
    });

    test("update 후 버전 수가 증가한다", () => {
      const tree = new PersistentSegmentTree([1, 2, 3]);
      tree.update(0, 1, 10);
      expect(tree.versionCount()).toBe(2);
    });
  });

  describe("버전 분리 (영속성)", () => {
    test("update 후 새 버전에 변경이 반영된다", () => {
      const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
      const v1 = tree.update(0, 2, 100); // index 2를 100으로 변경
      expect(tree.query(v1, 0, 4)).toBe(112); // 1+2+100+4+5
    });

    test("update 후 원래 버전(0)은 변경되지 않는다", () => {
      const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
      tree.update(0, 2, 100);
      expect(tree.query(0, 0, 4)).toBe(15); // 여전히 1+2+3+4+5
    });

    test("여러 버전이 독립적으로 유지된다", () => {
      const tree = new PersistentSegmentTree([0, 0, 0, 0]);
      const v1 = tree.update(0, 0, 1);  // [1, 0, 0, 0]
      const v2 = tree.update(v1, 1, 2); // [1, 2, 0, 0]
      const v3 = tree.update(v2, 2, 3); // [1, 2, 3, 0]

      expect(tree.query(0, 0, 3)).toBe(0);  // 버전 0: 0+0+0+0
      expect(tree.query(v1, 0, 3)).toBe(1); // 버전 1: 1+0+0+0
      expect(tree.query(v2, 0, 3)).toBe(3); // 버전 2: 1+2+0+0
      expect(tree.query(v3, 0, 3)).toBe(6); // 버전 3: 1+2+3+0
    });

    test("과거 버전을 기반으로 새 버전을 만들 수 있다 (분기)", () => {
      const tree = new PersistentSegmentTree([1, 2, 3]);
      const v1 = tree.update(0, 0, 10); // [10, 2, 3]
      const v2a = tree.update(v1, 1, 20); // [10, 20, 3]
      const v2b = tree.update(v1, 2, 30); // [10, 2, 30]

      expect(tree.query(v2a, 0, 2)).toBe(33); // 10+20+3
      expect(tree.query(v2b, 0, 2)).toBe(42); // 10+2+30
      // v1은 변경 없음
      expect(tree.query(v1, 0, 2)).toBe(15); // 10+2+3
    });

    test("버전 0(원본)을 직접 기반으로 복수 분기 생성", () => {
      const tree = new PersistentSegmentTree([5, 5, 5]);
      const vA = tree.update(0, 0, 1); // [1, 5, 5]
      const vB = tree.update(0, 1, 2); // [5, 2, 5]
      const vC = tree.update(0, 2, 3); // [5, 5, 3]

      expect(tree.query(vA, 0, 2)).toBe(11); // 1+5+5
      expect(tree.query(vB, 0, 2)).toBe(12); // 5+2+5
      expect(tree.query(vC, 0, 2)).toBe(13); // 5+5+3
    });
  });

  describe("구간 질의", () => {
    test("시작 인덱스 == 끝 인덱스 (단일 원소)", () => {
      const tree = new PersistentSegmentTree([10, 20, 30, 40]);
      expect(tree.query(0, 2, 2)).toBe(30);
    });

    test("전체 구간 질의", () => {
      const arr = [1, 3, 5, 7, 9];
      const tree = new PersistentSegmentTree(arr);
      expect(tree.query(0, 0, 4)).toBe(25);
    });

    test("왼쪽 절반 구간", () => {
      const tree = new PersistentSegmentTree([2, 4, 6, 8, 10]);
      expect(tree.query(0, 0, 1)).toBe(6); // 2+4
    });

    test("오른쪽 절반 구간", () => {
      const tree = new PersistentSegmentTree([2, 4, 6, 8, 10]);
      expect(tree.query(0, 3, 4)).toBe(18); // 8+10
    });

    test("update 후 올바른 구간 합", () => {
      const tree = new PersistentSegmentTree([1, 2, 3, 4, 5]);
      const v1 = tree.update(0, 0, 100);
      expect(tree.query(v1, 0, 2)).toBe(105); // 100+2+3
      expect(tree.query(v1, 1, 4)).toBe(14);  // 2+3+4+5
    });

    test("음수 값도 처리한다", () => {
      const tree = new PersistentSegmentTree([-3, -1, 0, 1, 3]);
      expect(tree.query(0, 0, 4)).toBe(0);
      expect(tree.query(0, 0, 1)).toBe(-4);
    });

    test("음수로 update 후 구간 합", () => {
      const tree = new PersistentSegmentTree([1, 2, 3]);
      const v1 = tree.update(0, 1, -5);
      expect(tree.query(v1, 0, 2)).toBe(-1); // 1+(-5)+3
    });
  });

  describe("엣지", () => {
    test("단일 원소 배열 처리", () => {
      const tree = new PersistentSegmentTree([42]);
      expect(tree.query(0, 0, 0)).toBe(42);
      const v1 = tree.update(0, 0, 100);
      expect(tree.query(v1, 0, 0)).toBe(100);
      expect(tree.query(0, 0, 0)).toBe(42); // 원본 불변
    });

    test("0으로 초기화된 배열", () => {
      const tree = new PersistentSegmentTree([0, 0, 0, 0, 0]);
      expect(tree.query(0, 0, 4)).toBe(0);
      const v1 = tree.update(0, 2, 5);
      expect(tree.query(v1, 0, 4)).toBe(5);
    });

    test("같은 인덱스에 여러 번 update — 각 버전이 독립 유지", () => {
      const tree = new PersistentSegmentTree([1, 1, 1]);
      const v1 = tree.update(0, 1, 10);
      const v2 = tree.update(v1, 1, 20);
      const v3 = tree.update(v2, 1, 30);

      expect(tree.query(0, 0, 2)).toBe(3);
      expect(tree.query(v1, 1, 1)).toBe(10);
      expect(tree.query(v2, 1, 1)).toBe(20);
      expect(tree.query(v3, 1, 1)).toBe(30);
    });

    test("대용량 배열 초기 구성", () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i + 1);
      const tree = new PersistentSegmentTree(arr);
      // 1 + 2 + ... + 1000 = 500500
      expect(tree.query(0, 0, 999)).toBe(500500);
    });

    test("versionCount가 update 횟수만큼 증가한다", () => {
      const tree = new PersistentSegmentTree([1, 2, 3]);
      expect(tree.versionCount()).toBe(1);
      tree.update(0, 0, 10);
      expect(tree.versionCount()).toBe(2);
      tree.update(0, 1, 20);
      expect(tree.versionCount()).toBe(3);
    });
  });

  describe("성능", () => {
    test("n=10^4 초기 구성 + 10^3 update + 10^3 query 100ms 이내", () => {
      const N = 10000;
      const arr = Array.from({ length: N }, () => Math.floor(Math.random() * 100));

      const start = performance.now();
      const tree = new PersistentSegmentTree(arr);

      let lastVersion = 0;
      for (let i = 0; i < 1000; i++) {
        const idx = Math.floor(Math.random() * N);
        lastVersion = tree.update(lastVersion, idx, Math.floor(Math.random() * 1000));
      }

      for (let i = 0; i < 1000; i++) {
        const l = Math.floor(Math.random() * N);
        const r = Math.floor(Math.random() * N);
        if (l <= r) {
          tree.query(lastVersion, l, r);
        }
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    test("버전 분기 — 동일 버전에서 1000번 update 후 각 버전 query", () => {
      const tree = new PersistentSegmentTree([0, 0, 0, 0, 0]);
      const versions: number[] = [0];

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        const v = tree.update(0, i % 5, i);
        versions.push(v);
      }

      // 각 버전의 단일 원소 질의
      for (const v of versions) {
        tree.query(v, 0, 4);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
