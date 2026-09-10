/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/rotatingCalipersDiameter/rotatingCalipersDiameter.test.ts`
 * 는 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(점 10 만 개를 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 지키던 것은 **점이 많아도 절차가 끝난다**는 것이라
 * 반환값과 껍질 크기로 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 방향 판정
 * 횟수로 진다.
 *
 * 원본은 `toBeCloseTo` 로 재는데 이 정본은 큰 정수로 답을 내므로 **정확히 같은지**를 본다.
 * 큰 좌표 케이스의 `4e18` 은 배정밀도로도 정확히 표현되는 값이라 그 자리도 등호로 걸린다.
 *
 * **원본에 없던 케이스 여섯을 더 걸었다.** ① 작은 격자 전수에서 모든 쌍을 잰 답과 같은가
 * ② 점 순서를 바꿔도 답이 같은가 ③ 지름의 두 끝점이 껍질 위인가 ④ far 가 걸음마다 그 변에서
 * 가장 먼 꼭짓점인가 ⑤ far 가 뒤로 가지 않는가 ⑥ 배정밀도가 못 담는 규모에서도 큰 정수 답이
 * 정확한가.
 */
import { expect, test } from "bun:test";
import {
  convexHull,
  diameterSquared,
  farther,
  type Point,
  rotatingCalipersDiameter,
  squared,
} from "./rotatingCalipersDiameter-guide.ref.ts";

/** 모든 쌍을 재는 방법. 작은 입력 대조에만 쓴다. */
function 전부대조(points: Point[]): bigint {
  let best = 0n;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = squared(points[i] as Point, points[j] as Point);
      if (d > best) best = d;
    }
  }
  return best;
}

/** 변 `a→b` 를 밑변으로 삼은 삼각형 넓이의 2 배. */
function 넓이2배(a: Point, b: Point, c: Point): bigint {
  return (
    BigInt(b[0] - a[0]) * BigInt(c[1] - a[1]) -
    BigInt(b[1] - a[1]) * BigInt(c[0] - a[0])
  );
}

const CASES: [string, Point[], number][] = [
  [
    "두 점만 — 그 사이 제곱 거리",
    [
      [0, 0],
      [3, 4],
    ],
    25,
  ],
  [
    "정사각형 — 대각선 제곱 거리",
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    2,
  ],
  [
    "4x6 직사각형 — 대각선^2 = 52",
    [
      [0, 0],
      [4, 0],
      [4, 6],
      [0, 6],
    ],
    52,
  ],
  [
    "삼각형 — 가장 긴 변의 제곱",
    [
      [0, 0],
      [6, 0],
      [3, 4],
    ],
    36,
  ],
  [
    "내부에 점이 많아도 외곽 두 점이 답",
    [
      [0, 0],
      [10, 0],
      [5, 5],
      [4, 3],
      [6, 2],
    ],
    100,
  ],
  [
    "공선 점들 — 양 끝점 사이",
    [
      [0, 0],
      [2, 0],
      [5, 0],
      [9, 0],
    ],
    81,
  ],
  [
    "중복 점 포함 — 정상 동작",
    [
      [0, 0],
      [0, 0],
      [3, 4],
    ],
    25,
  ],
  [
    "동일 좌표 두 점 — 0",
    [
      [7, 7],
      [7, 7],
    ],
    0,
  ],
  [
    "최소 입력 n=2",
    [
      [0, 0],
      [1, 0],
    ],
    1,
  ],
  [
    "큰 좌표 ±10^9 — 제곱 거리 정확",
    [
      [-1_000_000_000, 0],
      [1_000_000_000, 0],
      [0, 0],
    ],
    4e18,
  ],
];

for (const [name, points, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(rotatingCalipersDiameter(points)).toBe(want);
  });
}

test("점 10 만 개 — 원본의 벽시계 케이스가 지키던 것을 반환값으로 다시 건다", () => {
  const N = 100_000;
  const points: Point[] = new Array(N);
  let seed = 42;
  const rnd = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed;
  };
  for (let i = 0; i < N; i++) {
    points[i] = [rnd() % 1_000_000, rnd() % 1_000_000];
  }
  const d2 = diameterSquared(points);
  const hull = convexHull(points);
  expect(d2).toBeGreaterThan(0n);
  // 껍질 위 두 점 사이의 값이므로 껍질 안에서 다시 재도 같은 값이 나온다.
  expect(d2).toBe(전부대조(hull));
  expect(hull.length).toBeLessThan(N);
});

test("작은 격자 전수 — 모든 쌍을 잰 답과 같다", () => {
  const grid: Point[] = [];
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) grid.push([x, y]);
  }
  let checked = 0;
  for (let mask = 1; mask < 1 << grid.length; mask++) {
    let c = 0;
    for (let b = mask; b; b >>= 1) c += b & 1;
    if (c > 5) continue;
    const points: Point[] = [];
    for (let i = 0; i < grid.length; i++) {
      if (mask & (1 << i)) points.push(grid[i] as Point);
    }
    checked++;
    expect(diameterSquared(points)).toBe(전부대조(points));
  }
  expect(checked).toBe(6884);
});

test("점 순서를 바꿔도 답이 같다", () => {
  const points: Point[] = [
    [0, 0],
    [6, 0],
    [8, 3],
    [6, 6],
    [2, 7],
    [0, 4],
    [3, 3],
    [5, 2],
  ];
  const base = diameterSquared(points);
  expect(base).toBe(73n);
  const orders = [
    [7, 6, 5, 4, 3, 2, 1, 0],
    [3, 0, 6, 1, 7, 4, 2, 5],
    [5, 2, 7, 0, 4, 6, 1, 3],
  ];
  for (const perm of orders) {
    expect(diameterSquared(perm.map((i) => points[i] as Point))).toBe(base);
  }
});

test("지름의 두 끝점은 언제나 껍질 위에 있다", () => {
  let seed = 20_260_908;
  const rnd = (m: number): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed % m;
  };
  let 확인한_쌍 = 0;
  for (let t = 0; t < 400; t++) {
    const points: Point[] = Array.from(
      { length: 3 + rnd(8) },
      () => [rnd(12), rnd(12)] as Point,
    );
    const best = diameterSquared(points);
    const 껍질 = new Set(convexHull(points).map((p) => `${p[0]},${p[1]}`));
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i] as Point;
        const b = points[j] as Point;
        if (squared(a, b) !== best || best === 0n) continue;
        확인한_쌍++;
        expect(껍질.has(`${a[0]},${a[1]}`)).toBe(true);
        expect(껍질.has(`${b[0]},${b[1]}`)).toBe(true);
      }
    }
  }
  expect(확인한_쌍).toBeGreaterThan(0);
});

test("far 는 걸음마다 그 변에서 가장 먼 꼭짓점이고 뒤로 가지 않는다", () => {
  let seed = 7;
  const rnd = (m: number): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed % m;
  };
  let 걸음 = 0;
  for (let t = 0; t < 300; t++) {
    const points: Point[] = Array.from(
      { length: 3 + rnd(10) },
      () => [rnd(20), rnd(20)] as Point,
    );
    const hull = convexHull(points);
    const k = hull.length;
    if (k < 3) continue;
    let far = 1;
    for (let i = 0; i < k; i++) {
      const a = hull[i] as Point;
      const b = hull[(i + 1) % k] as Point;
      const before = far;
      let 전진 = 0;
      while (farther(a, b, hull[far] as Point, hull[(far + 1) % k] as Point)) {
        far = (far + 1) % k;
        전진++;
      }
      걸음++;
      const 값 = hull.map((c) => 넓이2배(a, b, c));
      const 최대 = 값.reduce((p, c) => (c > p ? c : p));
      expect(값[far]).toBe(최대);
      expect((far - before + k) % k).toBe(전진);
    }
  }
  expect(걸음).toBeGreaterThan(0);
});

test("배정밀도가 못 담는 규모에서도 큰 정수 답이 정확하다", () => {
  const C = 1_000_000_000;
  const points: Point[] = [
    [-C, 0],
    [C, 1],
    [0, C],
  ];
  const d2 = diameterSquared(points);
  expect(d2).toBe(4_000_000_000_000_000_001n);
  expect(d2 > 9_007_199_254_740_992n).toBe(true);
  // 배정밀도로 옮기면 이 값은 담기지 않는다. 고른 쌍이 옳다는 것이 정본이 지는 몫이다.
  expect(BigInt(Number(d2))).toBe(4_000_000_000_000_000_000n);
});
