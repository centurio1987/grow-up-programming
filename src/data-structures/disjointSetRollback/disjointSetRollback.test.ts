import { test, expect, describe } from "bun:test";
import { DisjointSetRollback } from "./disjointSetRollback";

describe("DisjointSetRollback", () => {
  describe("기본", () => {
    test("초기 상태 — n개 노드가 각각 독립 집합", () => {
      const ds = new DisjointSetRollback(5);
      expect(ds.groupCount()).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(ds.find(i)).toBe(i);
      }
    });

    test("union — 두 노드를 합친다", () => {
      const ds = new DisjointSetRollback(4);
      expect(ds.union(0, 1)).toBe(true);
      expect(ds.same(0, 1)).toBe(true);
      expect(ds.groupCount()).toBe(3);
    });

    test("union — 이미 같은 집합이면 false 반환", () => {
      const ds = new DisjointSetRollback(4);
      ds.union(0, 1);
      expect(ds.union(0, 1)).toBe(false);
      expect(ds.groupCount()).toBe(3);
    });

    test("같은 집합 여부 확인", () => {
      const ds = new DisjointSetRollback(5);
      ds.union(0, 1);
      ds.union(2, 3);
      expect(ds.same(0, 1)).toBe(true);
      expect(ds.same(2, 3)).toBe(true);
      expect(ds.same(0, 2)).toBe(false);
      expect(ds.same(0, 4)).toBe(false);
    });

    test("union 연쇄 — 집합이 점진적으로 합쳐진다", () => {
      const ds = new DisjointSetRollback(5);
      ds.union(0, 1);
      ds.union(1, 2);
      ds.union(2, 3);
      expect(ds.same(0, 3)).toBe(true);
      expect(ds.groupCount()).toBe(2);
    });
  });

  describe("특수 기능", () => {
    test("rollback — 마지막 union 하나를 되돌린다", () => {
      const ds = new DisjointSetRollback(4);
      ds.union(0, 1);
      ds.union(2, 3);
      ds.rollback(); // union(2,3) 취소
      expect(ds.same(2, 3)).toBe(false);
      expect(ds.same(0, 1)).toBe(true);
      expect(ds.groupCount()).toBe(3);
    });

    test("rollback — 여러 번 되돌리기", () => {
      const ds = new DisjointSetRollback(5);
      ds.union(0, 1);
      ds.union(1, 2);
      ds.union(3, 4);
      ds.rollback(); // union(3,4) 취소
      ds.rollback(); // union(1,2) 취소
      expect(ds.same(0, 1)).toBe(true);
      expect(ds.same(1, 2)).toBe(false);
      expect(ds.same(3, 4)).toBe(false);
      expect(ds.groupCount()).toBe(4);
    });

    test("snapshot — 버전 번호를 반환한다", () => {
      const ds = new DisjointSetRollback(5);
      const v0 = ds.snapshot();
      ds.union(0, 1);
      ds.union(1, 2);
      const v1 = ds.snapshot();
      expect(v1).toBeGreaterThan(v0);
    });

    test("restore — 특정 버전으로 복원한다", () => {
      const ds = new DisjointSetRollback(5);
      const v0 = ds.snapshot(); // 초기 상태

      ds.union(0, 1);
      ds.union(2, 3);
      const v1 = ds.snapshot(); // 0-1, 2-3 합친 상태

      ds.union(1, 2); // 0-1-2-3 연결

      // v1으로 복원
      ds.restore(v1);
      expect(ds.same(0, 1)).toBe(true);
      expect(ds.same(2, 3)).toBe(true);
      expect(ds.same(0, 2)).toBe(false);
      expect(ds.groupCount()).toBe(3);

      // v0으로 복원
      ds.restore(v0);
      expect(ds.same(0, 1)).toBe(false);
      expect(ds.groupCount()).toBe(5);
    });

    test("restore 후 새로운 union — 분기 가능", () => {
      const ds = new DisjointSetRollback(6);
      ds.union(0, 1);
      const v = ds.snapshot();

      ds.union(2, 3); // 경로 A
      expect(ds.same(2, 3)).toBe(true);

      ds.restore(v);
      ds.union(4, 5); // 경로 B (A와 독립)
      expect(ds.same(2, 3)).toBe(false);
      expect(ds.same(4, 5)).toBe(true);
    });

    test("오프라인 그래프 쿼리 시뮬레이션", () => {
      // 노드 5개, 간선이 추가/제거되며 연결성 쿼리
      const ds = new DisjointSetRollback(5);
      // 타임라인:
      // t=1: 0-1 연결
      // t=2: 1-2 연결, 쿼리: 0과 2 연결?
      // t=3: 1-2 해제 (rollback), 쿼리: 0과 2 연결?
      ds.union(0, 1);
      ds.union(1, 2);
      expect(ds.same(0, 2)).toBe(true); // t=2
      ds.rollback(); // 1-2 해제
      expect(ds.same(0, 2)).toBe(false); // t=3
      expect(ds.same(0, 1)).toBe(true);  // 0-1은 유지
    });
  });

  describe("엣지", () => {
    test("n=1 — 단일 노드는 자기 자신이 루트", () => {
      const ds = new DisjointSetRollback(1);
      expect(ds.find(0)).toBe(0);
      expect(ds.groupCount()).toBe(1);
    });

    test("rollback 이후 같은 쌍 다시 union 가능", () => {
      const ds = new DisjointSetRollback(3);
      ds.union(0, 1);
      ds.rollback();
      expect(ds.union(0, 1)).toBe(true); // 다시 합칠 수 있어야 함
      expect(ds.same(0, 1)).toBe(true);
    });

    test("전체 노드를 하나로 합친 후 groupCount=1", () => {
      const n = 6;
      const ds = new DisjointSetRollback(n);
      for (let i = 0; i < n - 1; i++) {
        ds.union(i, i + 1);
      }
      expect(ds.groupCount()).toBe(1);
      for (let i = 0; i < n; i++) {
        expect(ds.same(0, i)).toBe(true);
      }
    });
  });

  describe("성능", () => {
    test("n=10^4 union/rollback/find 연산 100ms 이내", () => {
      const n = 10_000;
      const ds = new DisjointSetRollback(n);
      const start = performance.now();

      // n/2 union
      for (let i = 0; i < n / 2; i++) {
        ds.union(i, i + 1 < n ? i + 1 : 0);
      }
      // 스냅샷 후 추가 union
      const v = ds.snapshot();
      for (let i = n / 2; i < n - 1; i++) {
        ds.union(i, i + 1);
      }
      // restore
      ds.restore(v);
      // find
      for (let i = 0; i < n; i++) {
        ds.find(i);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
