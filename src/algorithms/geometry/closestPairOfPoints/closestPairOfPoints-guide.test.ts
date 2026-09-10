/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/closestPairOfPoints/closestPairOfPoints.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 「성능」 케이스에서 벽시계 판정을 뺐다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스가
 * 실제로 묻는 것(점 5 만 개를 받아도 답이 나오는가, 그리고 전부 대조와 같은 답인가)은
 * 그대로 두고, 같은 입력의 작은 판을 전부 대조와 맞대어 확인한다.
 */
import { expect, test } from "bun:test";
import {
  closestPairOfPoints,
  type Point,
  solve,
} from "./closestPairOfPoints-guide.ref.ts";

/** 전부 대조. 정본과 다른 경로로 같은 답을 낸다. */
function bruteForce(points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i] as Point;
      const b = points[j] as Point;
      const dx = a[0] - b[0];
      const dy = a[1] - b[1];
      const d = dx * dx + dy * dy;
      if (d < best) best = d;
    }
  }
  return Math.sqrt(best);
}

test("두 점만 있는 경우 — 그 거리 반환", () => {
  const points: Point[] = [
    [0, 0],
    [3, 4],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(5, 9);
});

test("여러 점 중 가까운 쌍 발견", () => {
  const points: Point[] = [
    [0, 0],
    [10, 10],
    [1, 1],
    [5, 5],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(Math.SQRT2, 9);
});

test("축에 정렬된 가까운 쌍", () => {
  const points: Point[] = [
    [0, 0],
    [100, 0],
    [200, 0],
    [201, 0],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(1, 9);
});

test("동일 좌표의 점이 포함된 경우 — 거리 0", () => {
  const points: Point[] = [
    [1, 2],
    [3, 4],
    [1, 2],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(0, 9);
});

test("y축 방향으로 가까운 쌍", () => {
  const points: Point[] = [
    [0, 0],
    [10, 100],
    [10, 101],
    [50, 50],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(1, 9);
});

test("대각선으로 가까운 쌍", () => {
  const points: Point[] = [
    [0, 0],
    [3, 3],
    [3, 4],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(1, 9);
});

test("띠를 가로지르는 쌍이 정답인 경우", () => {
  const points: Point[] = [
    [0, 0],
    [10, 0],
    [11, 0],
    [21, 0],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(1, 9);
});

test("최소 입력 n=2", () => {
  const points: Point[] = [
    [0, 0],
    [1, 0],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(1, 9);
});

test("큰 좌표 ±10^9 — 어긋남 없이 정확", () => {
  const points: Point[] = [
    [-1_000_000_000, -1_000_000_000],
    [1_000_000_000, 1_000_000_000],
    [999_999_999, 1_000_000_000],
  ];
  expect(closestPairOfPoints(points)).toBeCloseTo(1, 9);
});

test("점 50,000 개 — 답이 나오고 전부 대조와 같다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 생성식이다. 벽시계 판정만 뺐다.
  const total = 50_000;
  const points: Point[] = new Array(total);
  let seed = 12_345;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let at = 0; at < total; at++) {
    points[at] = [next() % 1_000_000, next() % 1_000_000];
  }
  const answer = closestPairOfPoints(points);
  expect(answer).toBeGreaterThanOrEqual(0);
  // 같은 생성식의 작은 판을 전부 대조와 맞댄다. 5 만 개를 전부 대조하면 12 억 쌍이다.
  expect(closestPairOfPoints(points.slice(0, 2_000))).toBeCloseTo(
    bruteForce(points.slice(0, 2_000)),
    9,
  );
});

test("본문 전개가 쓰는 점 여덟 개와 그 답", () => {
  // `deep.build`·`deep.walk`·`.sim.ts`·`.alt.ts` 가 모두 이 입력을 쓴다.
  const walk: Point[] = [
    [0, 0],
    [2, 6],
    [3, 1],
    [4, 8],
    [5, 2],
    [6, 5],
    [8, 3],
    [9, 7],
  ];
  expect(solve(walk).best).toBe(5);
  expect(closestPairOfPoints(walk)).toBe(Math.sqrt(5));
  expect(closestPairOfPoints(walk)).toBeCloseTo(bruteForce(walk), 9);
});

test("재귀가 올려 보내는 목록은 그 구간을 y 오름차순으로 담는다", () => {
  const walk: Point[] = [
    [0, 0],
    [2, 6],
    [3, 1],
    [4, 8],
    [5, 2],
    [6, 5],
    [8, 3],
    [9, 7],
  ];
  const out = solve(walk);
  expect(out.byY.length).toBe(walk.length);
  for (let at = 1; at < out.byY.length; at++) {
    expect((out.byY[at - 1] as Point)[1]).toBeLessThanOrEqual(
      (out.byY[at] as Point)[1],
    );
  }
});

test("점 순서를 바꿔도 답이 같다", () => {
  const walk: Point[] = [
    [0, 0],
    [2, 6],
    [3, 1],
    [4, 8],
    [5, 2],
    [6, 5],
    [8, 3],
    [9, 7],
  ];
  expect(closestPairOfPoints([...walk].reverse())).toBe(
    closestPairOfPoints(walk),
  );
});

test("여러 모양의 배치에서 전부 대조와 같은 답을 낸다", () => {
  const column: Point[] = Array.from(
    { length: 200 },
    (_, at) => [0, at] as Point,
  );
  const row: Point[] = Array.from({ length: 200 }, (_, at) => [at, 0] as Point);
  const lattice: Point[] = [];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) lattice.push([x, y]);
  }
  const same: Point[] = Array.from({ length: 64 }, () => [7, 7] as Point);
  for (const points of [column, row, lattice, same]) {
    expect(closestPairOfPoints(points)).toBeCloseTo(bruteForce(points), 9);
  }
});
