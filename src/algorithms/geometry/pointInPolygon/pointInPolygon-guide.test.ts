/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/pointInPolygon/pointInPolygon.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 「성능」 케이스는 두 가지를 손봤다. ① 벽시계 판정을 뺐다 — 실행마다 값이 달라 판정이 안
 * 된다. ② 원본이 `Math.cos` 로 만든 실수 좌표를 **반올림해 정수로** 바꿨다. 이 절차는 판정을
 * 큰 정수로 되재는데 `BigInt` 는 정수만 받고, 문제의 제약도 좌표를 정수로 정한다. 그 케이스가
 * 실제로 묻는 것(꼭짓점 10 만 개짜리 원에서 한가운데는 내부, 바깥 점은 외부)은 그대로 둔다.
 */
import { expect, test } from "bun:test";
import {
  type Point,
  pointInPolygon,
  sideOf,
} from "./pointInPolygon-guide.ref.ts";

const SQUARE10: Point[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];
const SQUARE4: Point[] = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];
const L_SHAPE: Point[] = [
  [0, 0],
  [4, 0],
  [4, 2],
  [2, 2],
  [2, 4],
  [0, 4],
];
const TRIANGLE: Point[] = [
  [0, 0],
  [6, 0],
  [3, 6],
];

test("정사각형 중심 — 내부", () => {
  expect(pointInPolygon([5, 5], SQUARE10)).toBe(true);
});

test("정사각형 바깥 — 외부", () => {
  expect(pointInPolygon([15, 5], SQUARE10)).toBe(false);
});

test("정사각형 바로 위쪽 — 외부", () => {
  expect(pointInPolygon([5, 11], SQUARE10)).toBe(false);
});

test("정사각형 바로 아래쪽 — 외부", () => {
  expect(pointInPolygon([5, -1], SQUARE10)).toBe(false);
});

test("L자 — 좌하단 내부", () => {
  expect(pointInPolygon([1, 1], L_SHAPE)).toBe(true);
});

test("L자 — 오목한 자리는 외부", () => {
  expect(pointInPolygon([3, 3], L_SHAPE)).toBe(false);
});

test("L자 — 위쪽 좁은 부분 내부", () => {
  expect(pointInPolygon([1, 3], L_SHAPE)).toBe(true);
});

test("변 위 — 내부로 본다", () => {
  expect(pointInPolygon([2, 0], SQUARE4)).toBe(true);
});

test("꼭짓점 위 — 내부로 본다", () => {
  expect(pointInPolygon([0, 0], SQUARE4)).toBe(true);
});

test("반대쪽 꼭짓점 위 — 내부로 본다", () => {
  expect(pointInPolygon([4, 4], SQUARE4)).toBe(true);
});

test("위쪽 변 위 — 내부로 본다", () => {
  expect(pointInPolygon([2, 4], SQUARE4)).toBe(true);
});

test("삼각형 안쪽 — 내부", () => {
  expect(pointInPolygon([3, 2], TRIANGLE)).toBe(true);
});

test("삼각형 오른쪽 바깥 — 외부", () => {
  expect(pointInPolygon([5, 5], TRIANGLE)).toBe(false);
});

test("삼각형 변 위 — 내부로 본다", () => {
  expect(pointInPolygon([3, 0], TRIANGLE)).toBe(true);
});

test("꼭짓점 셋짜리 다각형도 그대로 동작한다", () => {
  const tri: Point[] = [
    [0, 0],
    [2, 0],
    [1, 2],
  ];
  expect(pointInPolygon([1, 1], tri)).toBe(true);
  expect(pointInPolygon([5, 5], tri)).toBe(false);
});

test("좌표 ±10^9 에서도 정확하다", () => {
  const big: Point[] = [
    [-1_000_000_000, -1_000_000_000],
    [1_000_000_000, -1_000_000_000],
    [1_000_000_000, 1_000_000_000],
    [-1_000_000_000, 1_000_000_000],
  ];
  expect(pointInPolygon([0, 0], big)).toBe(true);
  expect(pointInPolygon([2_000_000_000, 0], big)).toBe(false);
});

test("성능 케이스의 다각형 — 꼭짓점 10 만 개에서 한가운데와 바깥", () => {
  // 원본 테스트의 「성능」 케이스와 같은 다각형이다. 좌표만 반올림해 정수로 바꿨다.
  const total = 100_000;
  const polygon: Point[] = new Array(total);
  for (let at = 0; at < total; at++) {
    const t = (2 * Math.PI * at) / total;
    polygon[at] = [
      Math.round(Math.cos(t) * 1_000_000),
      Math.round(Math.sin(t) * 1_000_000),
    ];
  }
  expect(pointInPolygon([0, 0], polygon)).toBe(true);
  expect(pointInPolygon([2_000_000, 0], polygon)).toBe(false);
});

test("본문 전개가 쓰는 질의 셋", () => {
  // `deep.build`·`deep.walk`·`.sim.ts`·`.alt.ts` 가 모두 이 L 자와 이 세 점을 쓴다.
  expect(pointInPolygon([1, 1], L_SHAPE)).toBe(true);
  expect(pointInPolygon([3, 3], L_SHAPE)).toBe(false);
  expect(pointInPolygon([2, 3], L_SHAPE)).toBe(true);
});

test("L 자 안팎을 직사각형 둘로 따로 판정한 답과 전부 같다", () => {
  /**
   * 정본과 무관한 판정. 닫힌 L 자 영역은 닫힌 직사각형 둘의 합집합과 같다 —
   * `0 ≤ x ≤ 4 · 0 ≤ y ≤ 2` 와 `0 ≤ x ≤ 2 · 0 ≤ y ≤ 4`.
   */
  const byRectangles = (p: Point): boolean =>
    (p[0] >= 0 && p[0] <= 4 && p[1] >= 0 && p[1] <= 2) ||
    (p[0] >= 0 && p[0] <= 2 && p[1] >= 0 && p[1] <= 4);
  let checked = 0;
  for (let x = -3; x <= 7; x++) {
    for (let y = -3; y <= 7; y++) {
      expect(pointInPolygon([x, y], L_SHAPE)).toBe(byRectangles([x, y]));
      checked++;
    }
  }
  expect(checked).toBe(121);
});

test("꼭짓점 순서를 뒤집거나 돌려도 답이 같다", () => {
  const rotated: Point[] = [
    [4, 2],
    [2, 2],
    [2, 4],
    [0, 4],
    [0, 0],
    [4, 0],
  ];
  const reversed = [...L_SHAPE].reverse();
  for (let x = -2; x <= 6; x++) {
    for (let y = -2; y <= 6; y++) {
      const want = pointInPolygon([x, y], L_SHAPE);
      expect(pointInPolygon([x, y], rotated)).toBe(want);
      expect(pointInPolygon([x, y], reversed)).toBe(want);
    }
  }
});

test("교점의 x 를 나눗셈으로 구하면 틀리는 배치에서 정본이 맞는다", () => {
  const polygon: Point[] = [
    [0, 0],
    [999_999_997, 1_000_000_000],
    [1_000_000_000, 0],
  ];
  const p: Point = [333_333_332, 333_333_333];
  // 배정밀도 나눗셈은 교점의 x 를 333,333,332 로 내고 질의 점의 x 와 같다고 본다.
  const quotient = (p[1] * 999_999_997) / 1_000_000_000;
  expect(quotient).toBe(333_333_332);
  // 곱만 쓰는 판정은 그 자리가 10 억분의 1 만큼 오른쪽임을 정확히 낸다.
  expect(sideOf([0, 0], [999_999_997, 1_000_000_000], p)).toBe(1);
  expect(pointInPolygon(p, polygon)).toBe(false);
});

test("배정밀도 곱만으로는 부호가 어긋나는 배치", () => {
  const o: Point = [0, 0];
  const a: Point = [999_999_000, 999_999_041];
  const p: Point = [48_780_439, 48_780_441];
  const approx = (a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]);
  expect(approx).toBe(0);
  expect(sideOf(o, a, p)).toBe(1);
  expect(pointInPolygon(p, [o, a, [1_000_000_000, 0]])).toBe(false);
});

test("변 위와 꼭짓점 위가 전부 내부로 잡힌다", () => {
  // 변의 가운데가 정수 좌표로 떨어지게 짝수만 쓴다. 이 절차는 정수 좌표를 받는다.
  const polygon: Point[] = [
    [0, 0],
    [6, 0],
    [6, 4],
    [4, 4],
    [4, 6],
    [0, 6],
  ];
  for (let at = 0; at < polygon.length; at++) {
    const a = polygon[at] as Point;
    const b = polygon[(at + 1) % polygon.length] as Point;
    expect(pointInPolygon(a, polygon)).toBe(true);
    const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    expect(pointInPolygon(mid, polygon)).toBe(true);
  }
});

test("꼭짓점 높이를 지나는 반직선에서도 홀짝이 어긋나지 않는다", () => {
  // 톱니 다각형은 꼭짓점 높이가 촘촘해서, 반개구간 규약이 깨지면 곧바로 답이 갈린다.
  const teeth = 6;
  const polygon: Point[] = [];
  for (let at = 0; at < teeth; at++) {
    polygon.push([2 * at, at]);
    polygon.push([2 * at + 1, at + 3]);
  }
  polygon.push([2 * teeth, teeth]);
  polygon.push([2 * teeth, -1]);
  polygon.push([0, -1]);

  /** 넘는 변을 세는 것과 무관하게, 왼쪽 바깥의 점은 언제나 외부다. */
  for (let y = -2; y <= teeth + 4; y++) {
    expect(pointInPolygon([-1, y], polygon)).toBe(false);
    expect(pointInPolygon([2 * teeth + 1, y], polygon)).toBe(false);
  }
  // 바닥 띠 안의 점은 언제나 내부다.
  for (let x = 0; x <= 2 * teeth; x++) {
    expect(pointInPolygon([x, -1], polygon)).toBe(true);
    expect(pointInPolygon([x, 0], polygon)).toBe(true);
  }
});
