import { test, expect, describe } from "bun:test";
import { bentleyOttmann, type Segment } from "./bentleyOttmann";

describe("bentleyOttmann", () => {
  // 기본 동작
  describe("기본 동작", () => {
    test("교차 없는 두 선분 — 0", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [1, 0],
        ],
        [
          [0, 5],
          [1, 5],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(0);
    });

    test("X자 두 선분 — 1", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [4, 4],
        ],
        [
          [0, 4],
          [4, 0],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(1);
    });

    test("3개 선분이 한 점에서 만남 — 쌍 단위 3", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [4, 4],
        ],
        [
          [0, 4],
          [4, 0],
        ],
        [
          [2, 0],
          [2, 4],
        ],
      ];
      // 모두 (2,2)에서 만남. (1,2), (1,3), (2,3) → 3쌍
      expect(bentleyOttmann(segs)).toBe(3);
    });

    test("격자 — 가로 2개와 세로 2개 → 4 교차", () => {
      const segs: Segment[] = [
        [
          [0, 1],
          [10, 1],
        ],
        [
          [0, 3],
          [10, 3],
        ],
        [
          [2, 0],
          [2, 5],
        ],
        [
          [5, 0],
          [5, 5],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(4);
    });
  });

  // 엣지 케이스
  describe("엣지 케이스", () => {
    test("끝점 공유 (L자) — 1", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [1, 0],
        ],
        [
          [1, 0],
          [1, 1],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(1);
    });

    test("공선 겹침 — 1", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [4, 0],
        ],
        [
          [2, 0],
          [6, 0],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(1);
    });

    test("선분 1개 — 0", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [1, 1],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(0);
    });

    test("선분 0개 — 0", () => {
      expect(bentleyOttmann([])).toBe(0);
    });

    test("모두 평행하고 분리됨 — 0", () => {
      const segs: Segment[] = [
        [
          [0, 0],
          [10, 0],
        ],
        [
          [0, 2],
          [10, 2],
        ],
        [
          [0, 4],
          [10, 4],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(0);
    });
  });

  // 바운더리
  describe("바운더리", () => {
    test("큰 좌표 ±10^9 — 정상 작동", () => {
      const segs: Segment[] = [
        [
          [-1_000_000_000, -1_000_000_000],
          [1_000_000_000, 1_000_000_000],
        ],
        [
          [-1_000_000_000, 1_000_000_000],
          [1_000_000_000, -1_000_000_000],
        ],
      ];
      expect(bentleyOttmann(segs)).toBe(1);
    });
  });

  // 성능 — O((n+k) log n)
  describe("성능", () => {
    test("n=10,000 분리 평행 선분 — 100ms 이내", () => {
      const N = 10_000;
      const segs: Segment[] = new Array(N);
      // 서로 겹치지 않게 y만 다르게 평행 배치 → 교차 0
      for (let i = 0; i < N; i++) {
        segs[i] = [
          [0, i],
          [1, i],
        ];
      }

      const start = performance.now();
      const cnt = bentleyOttmann(segs);
      const elapsed = performance.now() - start;

      expect(cnt).toBe(0);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
