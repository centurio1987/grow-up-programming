/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/polygonArea/polygonArea.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 「성능」 케이스는 두 가지를 손봤다. ① 벽시계 판정을 뺐다 — 실행마다 값이 달라 판정이 안
 * 된다. ② 원본이 `Math.cos` 로 만든 실수 좌표를 **반올림해 정수로** 바꿨다. 이 절차는 넓이의
 * 2 배를 큰 정수로 누적하는데 `BigInt` 는 정수만 받고, 문제의 제약도 좌표를 정수로 정한다.
 * 그 케이스가 실제로 묻는 것(꼭짓점 10 만 개짜리 원의 넓이가 반지름의 제곱에 원주율을 곱한
 * 값에 가깝다)은 그대로 둔다.
 */
import { expect, test } from "bun:test";
import {
  type Point,
  polygonArea,
  shoelaceTwice,
} from "./polygonArea-guide.ref.ts";

const UNIT: Point[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
const RECT: Point[] = [
  [0, 0],
  [4, 0],
  [4, 6],
  [0, 6],
];
const TRIANGLE: Point[] = [
  [0, 0],
  [4, 0],
  [0, 3],
];
const L_SHAPE: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];

test("단위 정사각형 — 넓이 1", () => {
  expect(polygonArea(UNIT)).toBeCloseTo(1, 9);
});

test("4x6 직사각형 — 넓이 24", () => {
  expect(polygonArea(RECT)).toBeCloseTo(24, 9);
});

test("직각삼각형 (밑변 4, 높이 3) — 넓이 6", () => {
  expect(polygonArea(TRIANGLE)).toBeCloseTo(6, 9);
});

test("오목 다각형 (L 자) — 넓이 12", () => {
  expect(polygonArea(L_SHAPE)).toBeCloseTo(12, 9);
});

test("시계 방향 입력 — 같은 양의 넓이", () => {
  const cw: Point[] = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
  ];
  expect(polygonArea(cw)).toBeCloseTo(1, 9);
});

test("반시계 방향 입력 — 같은 양의 넓이", () => {
  expect(polygonArea(UNIT)).toBeCloseTo(1, 9);
});

test("음의 좌표 다각형 — 같은 넓이", () => {
  const shifted: Point[] = [
    [-5, -5],
    [-4, -5],
    [-4, -4],
    [-5, -4],
  ];
  expect(polygonArea(shifted)).toBeCloseTo(1, 9);
});

test("공선 꼭짓점이 포함된 경우 — 넓이 같음", () => {
  const sq: Point[] = [
    [0, 0],
    [2, 0],
    [4, 0],
    [4, 4],
    [0, 4],
  ];
  expect(polygonArea(sq)).toBeCloseTo(16, 9);
});

test("최소 다각형 (n=3) — 정확한 넓이", () => {
  const tri: Point[] = [
    [0, 0],
    [1, 0],
    [0, 1],
  ];
  expect(polygonArea(tri)).toBeCloseTo(0.5, 9);
});

test("꼭짓점이 모두 한 직선 위 — 넓이 0", () => {
  const line: Point[] = [
    [0, 0],
    [1, 0],
    [2, 0],
  ];
  expect(polygonArea(line)).toBeCloseTo(0, 9);
});

test("큰 좌표 ±10^9 — 어긋남 없이 정확", () => {
  const big: Point[] = [
    [-1_000_000_000, -1_000_000_000],
    [1_000_000_000, -1_000_000_000],
    [1_000_000_000, 1_000_000_000],
    [-1_000_000_000, 1_000_000_000],
  ];
  // 변 길이 2×10^9, 넓이 4×10^18. 2 배 넓이는 정수 8×10^18 로 정확히 나온다.
  expect(shoelaceTwice(big)).toBe(8_000_000_000_000_000_000n);
  expect(polygonArea(big)).toBeCloseTo(4e18, -9);
});

test("성능 케이스의 다각형 — 꼭짓점 10 만 개짜리 원", () => {
  // 원본 테스트의 「성능」 케이스와 같은 다각형이다. 좌표만 반올림해 정수로 바꿨다.
  const total = 100_000;
  const polygon: Point[] = new Array(total);
  for (let at = 0; at < total; at++) {
    const t = (2 * Math.PI * at) / total;
    polygon[at] = [
      Math.round(Math.cos(t) * 1000),
      Math.round(Math.sin(t) * 1000),
    ];
  }
  // 좌표를 정수로 반올림했으므로 원 자체의 넓이와 정확히 같지는 않다. 2 배 넓이는 정수다.
  expect(shoelaceTwice(polygon)).toBe(6_283_320n);
  expect(polygonArea(polygon)).toBe(3_141_660);
  // 반지름 1000 인 원의 넓이는 원주율 곱하기 10^6 이고, 그 값과의 차가 100 보다 작다.
  expect(Math.abs(polygonArea(polygon) - Math.PI * 1_000_000)).toBeLessThan(
    100,
  );
});

test("본문 전개가 쓰는 L 자와 그 2 배 넓이", () => {
  // `deep.build`·`deep.walk`·`.sim.ts`·`.alt.ts` 가 모두 이 L 자를 쓴다.
  expect(shoelaceTwice(L_SHAPE)).toBe(24n);
  expect(polygonArea(L_SHAPE)).toBe(12);
  expect(shoelaceTwice([...L_SHAPE].reverse())).toBe(-24n);
  expect(polygonArea([...L_SHAPE].reverse())).toBe(12);
});

test("2 배 넓이는 언제나 정수이고, 홀수일 수 있다", () => {
  const tri: Point[] = [
    [0, 0],
    [1, 0],
    [0, 1],
  ];
  expect(shoelaceTwice(tri)).toBe(1n);
  // 2 로 나누는 것은 지수만 1 줄이므로 홀수여도 배정밀도가 정확히 담는다.
  expect(polygonArea(tri)).toBe(0.5);
});

test("꼭짓점 순서를 돌려 놓아도 답이 같다", () => {
  const rotated: Point[] = [
    [4, 2],
    [2, 2],
    [2, 4],
    [0, 4],
    [0, 0],
    [4, 0],
  ];
  expect(polygonArea(rotated)).toBe(polygonArea(L_SHAPE));
});

test("평행이동해도 넓이가 같다 — 기준점이 다각형 밖이어도 된다", () => {
  for (const shift of [10, 1000, 500_000_000]) {
    const moved = L_SHAPE.map(([x, y]) => [x + shift, y + shift] as Point);
    expect(polygonArea(moved)).toBe(12);
  }
});

test("직사각형 둘로 나눠 따로 잰 넓이와 같다", () => {
  /**
   * 정본과 무관한 판정. 닫힌 L 자 영역은 직사각형 둘의 합집합이고 그 둘은 겹치지 않는다 —
   * `0 ≤ x ≤ 4 · 0 ≤ y ≤ 2` 와 `0 ≤ x ≤ 2 · 2 ≤ y ≤ 4`.
   */
  expect(polygonArea(L_SHAPE)).toBe(4 * 2 + 2 * 2);
});

test("사다리꼴 식으로 잰 2 배 넓이와 같다", () => {
  /**
   * 정본과 다른 산술 경로. 닫힌 고리에서 `Σ (x_a − x_b)(y_a + y_b)` 는 신발끈 합과 같다 —
   * `x_a y_a` 항이 고리를 한 바퀴 따라가며 짝을 지어 사라지기 때문이다.
   */
  const byTrapezoid = (polygon: Point[]): bigint => {
    let sum = 0n;
    for (let at = 0; at < polygon.length; at++) {
      const a = polygon[at] as Point;
      const b = polygon[(at + 1) % polygon.length] as Point;
      sum += (BigInt(a[0]) - BigInt(b[0])) * (BigInt(a[1]) + BigInt(b[1]));
    }
    return sum;
  };
  const cases: Point[][] = [
    UNIT,
    RECT,
    TRIANGLE,
    L_SHAPE,
    [...L_SHAPE].reverse(),
    [
      [-1_000_000_000, -1_000_000_000],
      [1_000_000_000, -1_000_000_000],
      [1_000_000_000, 1_000_000_000],
      [-1_000_000_000, 1_000_000_000],
    ],
  ];
  for (const polygon of cases) {
    expect(byTrapezoid(polygon)).toBe(shoelaceTwice(polygon));
  }
});
