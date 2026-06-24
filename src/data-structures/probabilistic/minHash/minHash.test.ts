import { test, expect, describe } from "bun:test";
import { MinHash } from "./minHash";

describe("MinHash", () => {
  describe("기본", () => {
    test("update 후 signature는 numHashes 길이의 배열을 반환한다", () => {
      const mh = new MinHash(128);
      mh.update(["a", "b", "c"]);
      const sig = mh.signature();
      expect(sig.length).toBe(128);
    });

    test("signature 값은 모두 유한한 양수다", () => {
      const mh = new MinHash(64);
      mh.update(["hello", "world"]);
      const sig = mh.signature();
      for (const v of sig) {
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }
    });

    test("동일한 집합은 동일한 서명을 생성한다", () => {
      const mh1 = new MinHash(64);
      const mh2 = new MinHash(64);
      mh1.update(["a", "b", "c"]);
      mh2.update(["a", "b", "c"]);
      expect(mh1.signature()).toEqual(mh2.signature());
    });

    test("집합의 순서가 달라도 같은 서명을 생성한다", () => {
      const mh1 = new MinHash(64);
      const mh2 = new MinHash(64);
      mh1.update(["a", "b", "c"]);
      mh2.update(["c", "a", "b"]);
      expect(mh1.signature()).toEqual(mh2.signature());
    });

    test("update를 여러 번 호출하면 마지막 집합의 서명으로 덮어쓴다", () => {
      const mh = new MinHash(64);
      mh.update(["x", "y", "z"]);
      const sig1 = mh.signature().slice();
      mh.update(["a", "b", "c"]);
      const sig2 = mh.signature();
      expect(sig1).not.toEqual(sig2);
    });
  });

  describe("Jaccard 유사도 추정", () => {
    test("완전히 동일한 집합의 추정 Jaccard는 1에 가깝다", () => {
      const mh1 = new MinHash(256);
      const mh2 = new MinHash(256);
      const set = Array.from({ length: 50 }, (_, i) => `word-${i}`);
      mh1.update(set);
      mh2.update(set);
      const estimated = MinHash.jaccard(mh1, mh2);
      expect(estimated).toBeGreaterThan(0.95);
    });

    test("완전히 다른 집합의 추정 Jaccard는 0에 가깝다", () => {
      const mh1 = new MinHash(256);
      const mh2 = new MinHash(256);
      const set1 = Array.from({ length: 50 }, (_, i) => `a-${i}`);
      const set2 = Array.from({ length: 50 }, (_, i) => `b-${i}`);
      mh1.update(set1);
      mh2.update(set2);
      const estimated = MinHash.jaccard(mh1, mh2);
      expect(estimated).toBeLessThan(0.1);
    });

    test("50% 겹치는 집합의 추정 Jaccard는 0.33 근방이다 (오차 ±0.1)", () => {
      // |A| = 100, |B| = 100, |A∩B| = 50
      // Jaccard = 50 / 150 ≈ 0.333
      const mh1 = new MinHash(256);
      const mh2 = new MinHash(256);
      const shared = Array.from({ length: 50 }, (_, i) => `shared-${i}`);
      const onlyA = Array.from({ length: 50 }, (_, i) => `a-${i}`);
      const onlyB = Array.from({ length: 50 }, (_, i) => `b-${i}`);
      mh1.update([...shared, ...onlyA]);
      mh2.update([...shared, ...onlyB]);
      const estimated = MinHash.jaccard(mh1, mh2);
      expect(estimated).toBeGreaterThan(0.23);
      expect(estimated).toBeLessThan(0.43);
    });

    test("jaccard 추정값은 [0, 1] 범위이다", () => {
      const mh1 = new MinHash(64);
      const mh2 = new MinHash(64);
      mh1.update(["a", "b"]);
      mh2.update(["c", "d"]);
      const j = MinHash.jaccard(mh1, mh2);
      expect(j).toBeGreaterThanOrEqual(0);
      expect(j).toBeLessThanOrEqual(1);
    });
  });

  describe("exact Jaccard 계산 (검증용)", () => {
    test("동일한 집합의 exact Jaccard는 1이다", () => {
      const s = new Set(["a", "b", "c"]);
      expect(MinHash.exact(s, s)).toBe(1);
    });

    test("교집합이 없는 집합의 exact Jaccard는 0이다", () => {
      const a = new Set(["a", "b"]);
      const b = new Set(["c", "d"]);
      expect(MinHash.exact(a, b)).toBe(0);
    });

    test("exact Jaccard 수식 검증: |A∩B|/|A∪B|", () => {
      const a = new Set(["a", "b", "c"]);
      const b = new Set(["b", "c", "d"]);
      // 교집합: {b, c} = 2, 합집합: {a, b, c, d} = 4
      expect(MinHash.exact(a, b)).toBeCloseTo(2 / 4, 5);
    });

    test("한쪽이 다른 쪽의 부분집합인 경우", () => {
      const a = new Set(["a", "b"]);
      const b = new Set(["a", "b", "c", "d"]);
      // 교집합: 2, 합집합: 4
      expect(MinHash.exact(a, b)).toBeCloseTo(0.5, 5);
    });
  });

  describe("엣지", () => {
    test("빈 집합으로 update 후 signature 호출 가능", () => {
      const mh = new MinHash(64);
      mh.update([]);
      const sig = mh.signature();
      expect(sig.length).toBe(64);
    });

    test("두 빈 집합의 exact Jaccard는 1이다 (빈 집합 ∩ 빈 집합 / 빈 집합 ∪ 빈 집합)", () => {
      // 관례: 두 빈 집합의 Jaccard는 1로 정의
      expect(MinHash.exact(new Set(), new Set())).toBe(1);
    });

    test("numHashes=1도 동작한다", () => {
      const mh = new MinHash(1);
      mh.update(["a", "b", "c"]);
      expect(mh.signature().length).toBe(1);
    });

    test("Set<string>을 Iterable로 전달할 수 있다", () => {
      const mh = new MinHash(64);
      const set = new Set(["x", "y", "z"]);
      expect(() => mh.update(set)).not.toThrow();
    });

    test("같은 numHashes로 만든 두 MinHash는 jaccard 계산이 가능하다", () => {
      const mh1 = new MinHash(32);
      const mh2 = new MinHash(32);
      mh1.update(["hello"]);
      mh2.update(["world"]);
      expect(() => MinHash.jaccard(mh1, mh2)).not.toThrow();
    });
  });

  describe("성능", () => {
    test("크기 10^4 집합 MinHash 계산이 200ms 이내 완료된다", () => {
      const mh = new MinHash(128);
      const bigSet = Array.from({ length: 10000 }, (_, i) => `token-${i}`);
      const start = Date.now();
      mh.update(bigSet);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(200);
    });

    test("10^3쌍의 Jaccard 추정이 100ms 이내 완료된다", () => {
      const pairs: [MinHash, MinHash][] = [];
      for (let i = 0; i < 1000; i++) {
        const a = new MinHash(64);
        const b = new MinHash(64);
        a.update([`a${i}`, `b${i}`]);
        b.update([`b${i}`, `c${i}`]);
        pairs.push([a, b]);
      }
      const start = Date.now();
      for (const [a, b] of pairs) {
        MinHash.jaccard(a, b);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });
});
