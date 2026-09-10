/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/segmentsIntersect/segmentsIntersect.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를
 * 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(같은 두 선분을 10 만 번 물었을 때의 반환값)은 아래에서 따로 확인한다.
 */
import { expect, test } from "bun:test";
import {
  type Point,
  type Segment,
  segmentsIntersect,
  sideOf,
} from "./segmentsIntersect-guide.ref.ts";

test("교차하는 X자 — true", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [2, 2],
      ],
      [
        [0, 2],
        [2, 0],
      ],
    ),
  ).toBe(true);
});

test("평행하고 분리됨 — false", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [2, 1],
      ],
    ),
  ).toBe(false);
});

test("공선이지만 서로 떨어져 있음 — false", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [1, 1],
      ],
      [
        [2, 2],
        [3, 3],
      ],
    ),
  ).toBe(false);
});

test("사선과 수직선 — true", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [4, 4],
      ],
      [
        [2, 0],
        [2, 4],
      ],
    ),
  ).toBe(true);
});

test("끝점끼리 닿는 경우 — true (L자)", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [1, 0],
      ],
      [
        [1, 0],
        [1, 1],
      ],
    ),
  ).toBe(true);
});

test("한 선분의 끝점이 다른 선분 위 — true (T자)", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [4, 0],
      ],
      [
        [2, 0],
        [2, 3],
      ],
    ),
  ).toBe(true);
});

test("공선이면서 겹치는 경우 — true", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [3, 0],
      ],
      [
        [2, 0],
        [5, 0],
      ],
    ),
  ).toBe(true);
});

test("공선이면서 끝점만 닿는 경우 — true", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [2, 0],
      ],
      [
        [2, 0],
        [4, 0],
      ],
    ),
  ).toBe(true);
});

test("공선이지만 분리됨 — false", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [1, 0],
      ],
      [
        [2, 0],
        [3, 0],
      ],
    ),
  ).toBe(false);
});

test("교차할 것 같지만 한쪽이 짧아 닿지 않음 — false", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [10, 10],
      ],
      [
        [5, 0],
        [5, 4],
      ],
    ),
  ).toBe(false);
});

test("길이 0 선분(점)이 다른 선분 위 — true", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [4, 0],
      ],
      [
        [2, 0],
        [2, 0],
      ],
    ),
  ).toBe(true);
});

test("두 점이 같은 위치 — true", () => {
  expect(
    segmentsIntersect(
      [
        [3, 3],
        [3, 3],
      ],
      [
        [3, 3],
        [3, 3],
      ],
    ),
  ).toBe(true);
});

test("두 점이 다른 위치 — false", () => {
  expect(
    segmentsIntersect(
      [
        [0, 0],
        [0, 0],
      ],
      [
        [1, 1],
        [1, 1],
      ],
    ),
  ).toBe(false);
});

test("큰 좌표 ±10^9 — 자릿수를 넘겨도 정확하다", () => {
  expect(
    segmentsIntersect(
      [
        [-1_000_000_000, -1_000_000_000],
        [1_000_000_000, 1_000_000_000],
      ],
      [
        [-1_000_000_000, 1_000_000_000],
        [1_000_000_000, -1_000_000_000],
      ],
    ),
  ).toBe(true);
});

test("성능 케이스의 두 선분 — 10 만 번 물어도 같은 답", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const s1: Segment = [
    [0, 0],
    [10, 10],
  ];
  const s2: Segment = [
    [0, 10],
    [10, 0],
  ];
  let trues = 0;
  for (let at = 0; at < 100_000; at++) {
    if (segmentsIntersect(s1, s2)) trues++;
  }
  expect(trues).toBe(100_000);
});

test("본문 전개가 쓰는 세 쌍", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 선분 넷을 쓴다.
  const a: Segment = [
    [0, 0],
    [6, 4],
  ];
  const b: Segment = [
    [0, 4],
    [6, 0],
  ];
  const c: Segment = [
    [2, 0],
    [2, 1],
  ];
  const d: Segment = [
    [3, 2],
    [9, 6],
  ];
  expect(segmentsIntersect(a, b)).toBe(true);
  expect(segmentsIntersect(a, c)).toBe(false);
  expect(segmentsIntersect(a, d)).toBe(true);
  // 불변식 절이 쓰는 네 번째 쌍 — `p3` 자리의 끝점 검사만으로 참이 된다.
  expect(segmentsIntersect(b, d)).toBe(true);
});

test("좌표가 상한에 붙으면 배정밀도 곱만으로는 부호가 어긋난다", () => {
  const o: Point = [0, 0];
  const a: Point = [999_999_000, 999_999_041];
  const c: Point = [48_780_439, 48_780_441];
  // 배정밀도로 재면 두 곱이 같은 값으로 반올림돼 0 이 된다.
  const approx = (a[0] - o[0]) * (c[1] - o[1]) - (a[1] - o[1]) * (c[0] - o[0]);
  expect(approx).toBe(0);
  // 정본은 큰 정수로 되재서 1 을 낸다 — 점 `c` 는 그 직선 위가 아니다.
  expect(sideOf(o, a, c)).toBe(1);
  expect(segmentsIntersect([o, a], [c, c])).toBe(false);
});

test("답은 두 선분의 순서와 끝점의 순서에 딸리지 않는다", () => {
  let seed = 20_260_904;
  const rnd = (): number => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed;
  };
  const pick = (): Point => [rnd() % 9, rnd() % 9];
  for (let round = 0; round < 2_000; round++) {
    const p1 = pick();
    const p2 = pick();
    const p3 = pick();
    const p4 = pick();
    const want = segmentsIntersect([p1, p2], [p3, p4]);
    expect(segmentsIntersect([p3, p4], [p1, p2])).toBe(want);
    expect(segmentsIntersect([p2, p1], [p3, p4])).toBe(want);
    expect(segmentsIntersect([p1, p2], [p4, p3])).toBe(want);
  }
});

test("작은 격자 전수에서 촘촘히 훑은 답과 같다", () => {
  /** 두 선분 위의 유리수 점을 촘촘히 찍어 같은 점이 나오는지 본다. */
  const shares = (s1: Segment, s2: Segment): boolean => {
    const STEP = 720; // 0..6 격자에서 교점의 분모를 전부 담는 배수
    const on = (s: Segment): Set<string> => {
      const out = new Set<string>();
      const [a, b] = s;
      for (let k = 0; k <= STEP; k++) {
        out.add(
          `${(a[0] * (STEP - k) + b[0] * k) / STEP},${
            (a[1] * (STEP - k) + b[1] * k) / STEP
          }`,
        );
      }
      return out;
    };
    const first = on(s1);
    for (const point of on(s2)) {
      if (first.has(point)) return true;
    }
    return false;
  };

  let seed = 7;
  const rnd = (): number => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed;
  };
  const pick = (): Point => [rnd() % 5, rnd() % 5];
  let checked = 0;
  for (let round = 0; round < 400; round++) {
    const s1: Segment = [pick(), pick()];
    const s2: Segment = [pick(), pick()];
    // 촘촘히 찍는 방식은 `true` 를 놓칠 수 있어도 `true` 를 지어내지는 않는다.
    if (shares(s1, s2)) {
      expect(segmentsIntersect(s1, s2)).toBe(true);
      checked++;
    }
  }
  expect(checked).toBeGreaterThan(100);
});
