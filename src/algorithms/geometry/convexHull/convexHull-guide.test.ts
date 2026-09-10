/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/geometry/convexHull/convexHull.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 「성능」
 * 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**(같은
 * 의사난수로 만든 점 10 만 개에서의 반환값)은 아래에서 꼭짓점 수와 좌표로 따로 확인한다.
 */
import { expect, test } from "bun:test";
import { convexHull, type Point } from "./convexHull-guide.ref.ts";

/** 꼭짓점 집합을 순환 순서와 상관없이 견주기 위한 키. */
const asSet = (hull: Point[]): Set<string> =>
  new Set(hull.map((p) => `${p[0]},${p[1]}`));

/** 부호 있는 넓이의 두 배. 양수면 반시계 방향이다. */
function twiceSignedArea(hull: Point[]): number {
  let area = 0;
  for (let at = 0; at < hull.length; at++) {
    const a = hull[at];
    const b = hull[(at + 1) % hull.length];
    if (a === undefined || b === undefined) continue;
    area += a[0] * b[1] - a[1] * b[0];
  }
  return area;
}

test("사각형 네 점 — 반시계 방향으로 네 꼭짓점", () => {
  const hull = convexHull([
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]);
  expect(hull.length).toBe(4);
  expect(asSet(hull)).toEqual(new Set(["0,0", "1,0", "1,1", "0,1"]));
});

test("삼각형 안에 점이 하나 — 바깥 세 점만", () => {
  const hull = convexHull([
    [0, 0],
    [4, 0],
    [2, 3],
    [2, 1],
  ]);
  expect(hull.length).toBe(3);
  expect(asSet(hull)).toEqual(new Set(["0,0", "4,0", "2,3"]));
});

test("반시계 방향 순서를 지킨다", () => {
  const hull = convexHull([
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ]);
  expect(twiceSignedArea(hull)).toBeGreaterThan(0);
});

test("한 직선 위의 점들 — 양 끝점 둘만", () => {
  const hull = convexHull([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  expect(hull.length).toBe(2);
  expect(asSet(hull)).toEqual(new Set(["0,0", "3,0"]));
});

test("같은 좌표가 섞여도 답에 한 번만 담긴다", () => {
  const hull = convexHull([
    [0, 0],
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ]);
  expect(hull.length).toBe(4);
});

test("변 위의 공선 중간 점은 꼭짓점이 아니다", () => {
  const hull = convexHull([
    [0, 0],
    [2, 0],
    [4, 0],
    [4, 4],
    [0, 4],
  ]);
  expect(hull.length).toBe(4);
  expect(asSet(hull)).toEqual(new Set(["0,0", "4,0", "4,4", "0,4"]));
});

test("점이 하나 — 그 점 하나만", () => {
  const hull = convexHull([[3, 7]]);
  expect(hull).toEqual([[3, 7]]);
});

test("점이 둘 — 둘 다", () => {
  const hull = convexHull([
    [0, 0],
    [1, 1],
  ]);
  expect(hull.length).toBe(2);
});

test("좌표 상한 ±10^9 — 네 모서리만 남는다", () => {
  const hull = convexHull([
    [-1_000_000_000, -1_000_000_000],
    [1_000_000_000, -1_000_000_000],
    [1_000_000_000, 1_000_000_000],
    [-1_000_000_000, 1_000_000_000],
    [0, 0],
  ]);
  expect(hull.length).toBe(4);
  expect(twiceSignedArea(hull)).toBeGreaterThan(0);
});

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 점 여덟 개를 쓴다.
  const hull = convexHull([
    [3, 2],
    [6, 0],
    [0, 0],
    [3, 4],
    [6, 3],
    [0, 3],
    [3, 0],
    [6, 0],
  ]);
  expect(hull).toEqual([
    [0, 0],
    [6, 0],
    [6, 3],
    [3, 4],
    [0, 3],
  ]);
});

test("좌표가 상한에 붙어 있어도 아주 얕은 꼭짓점을 놓치지 않는다", () => {
  // 세 번째 멈춤이 다루는 입력. 배정밀도 곱만으로는 (999999999, 999999998) 이 빠진다.
  const hull = convexHull([
    [0, 0],
    [999_999_999, 999_999_998],
    [1_000_000_000, 999_999_999],
    [0, 1],
  ]);
  expect(hull).toEqual([
    [0, 0],
    [999_999_999, 999_999_998],
    [1_000_000_000, 999_999_999],
    [0, 1],
  ]);
});

/** 정의를 그대로 옮긴 판정. 느리지만 기준이 된다. */
function hullByDefinition(points: Point[]): Set<string> {
  const uniq: Point[] = [];
  const seen = new Set<string>();
  for (const p of points) {
    const key = `${p[0]},${p[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(p);
  }
  if (uniq.length <= 2) return new Set(uniq.map((p) => `${p[0]},${p[1]}`));

  const cross = (o: Point, a: Point, b: Point): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  // 꼭짓점 = 자기를 뺀 나머지 점 전부를 어떤 직선의 한쪽(경계 포함)에 둘 수 있는 점.
  const out = new Set<string>();
  for (const v of uniq) {
    let isVertex = false;
    for (const w of uniq) {
      if (w === v) continue;
      let leftOrOn = true;
      let strictLeft = false;
      for (const other of uniq) {
        if (other === v || other === w) continue;
        const s = cross(v, w, other);
        if (s < 0) {
          leftOrOn = false;
          break;
        }
        if (s > 0) strictLeft = true;
      }
      // 나머지가 전부 왼쪽에 있고 그중 하나는 직선 밖이면 v–w 가 껍질의 변이다.
      if (leftOrOn && strictLeft) {
        isVertex = true;
        break;
      }
    }
    if (isVertex) out.add(`${v[0]},${v[1]}`);
  }
  return out;
}

test("작은 격자 전수에서 정의를 그대로 옮긴 판정과 같은 답을 낸다", () => {
  let seed = 20_260_904;
  const rnd = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed;
  };
  for (let round = 0; round < 400; round++) {
    const count = 3 + (rnd() % 8);
    const points: Point[] = [];
    for (let at = 0; at < count; at++) {
      points.push([rnd() % 5, rnd() % 5]);
    }
    const got = convexHull(points);
    const want = hullByDefinition(points);
    // 세 점 이상이면 정의 쪽과 꼭짓점 집합이 같아야 한다.
    if (want.size >= 3) {
      expect(asSet(got)).toEqual(want);
      expect(twiceSignedArea(got)).toBeGreaterThan(0);
    }
  }
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const total = 100_000;
  const points: Point[] = new Array(total);
  let seed = 1;
  const rnd = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed;
  };
  for (let at = 0; at < total; at++) {
    points[at] = [rnd() % 200_000, rnd() % 200_000];
  }
  const hull = convexHull(points);
  expect(hull.length).toBe(25);
  expect(hull[0]).toEqual([0, 2176]);
  expect(hull.at(-1)).toEqual([0, 152_704]);
  expect(twiceSignedArea(hull)).toBeGreaterThan(0);
});

test("답의 꼭짓점은 이웃 셋마다 왼쪽으로만 꺾인다", () => {
  const points: Point[] = [];
  for (let at = 0; at < 400; at++) {
    const x = Math.round(1_000_000 * Math.cos((at * 2 * Math.PI) / 400));
    const y = Math.round(1_000_000 * Math.sin((at * 2 * Math.PI) / 400));
    points.push([x, y]);
  }
  const hull = convexHull(points);
  expect(hull.length).toBeGreaterThanOrEqual(3);
  for (let at = 0; at < hull.length; at++) {
    const o = hull[at];
    const a = hull[(at + 1) % hull.length];
    const b = hull[(at + 2) % hull.length];
    if (o === undefined || a === undefined || b === undefined) continue;
    const s = (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    expect(s).toBeGreaterThan(0);
  }
});
