/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/convexHullTrick/convexHullTrick.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 「성능」 케이스의
 * 벽시계 단언(`500ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 같은 입력의
 * 값 대조와 껍질 크기 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { ConvexHullTrick, isCovered } from "./convexHullTrick-guide.ref.ts";

/** 직선 목록을 등록한 자료구조를 만든다. */
const build = (lines: [number, number][]): ConvexHullTrick => {
  const cht = new ConvexHullTrick();
  for (const [m, b] of lines) cht.addLine(m, b);
  return cht;
};

/** 등록한 직선을 전부 계산해 최솟값을 내는 대조군. */
const brute = (lines: [number, number][], x: number): number =>
  Math.min(...lines.map(([m, b]) => m * x + b));

test("두 직선의 최솟값 질의", () => {
  const cht = build([
    [1, 0],
    [2, -5],
  ]);
  expect(cht.query(0)).toBe(-5);
  expect(cht.query(10)).toBe(10);
  expect(cht.query(5)).toBe(5);
});

test("세 직선 — 가운데 직선이 담당 구간을 가지는 경우", () => {
  const cht = build([
    [0, 10],
    [1, 0],
    [2, -10],
  ]);
  expect(cht.query(0)).toBe(-10);
  expect(cht.query(-100)).toBe(-210);
  expect(cht.query(100)).toBe(10);
});

test("단일 직선만 등록 — 그 직선의 값", () => {
  const cht = build([[3, 7]]);
  expect(cht.query(0)).toBe(7);
  expect(cht.query(10)).toBe(37);
  expect(cht.query(-5)).toBe(-8);
});

test("같은 기울기 두 직선 — 절편이 작은 쪽만 남는다", () => {
  const cht = build([
    [2, 10],
    [2, 5],
  ]);
  expect(cht.query(0)).toBe(5);
  expect(cht.query(100)).toBe(205);
  expect(cht.hull.length).toBe(1);
});

test("기울기 0 직선 — 상수 함수", () => {
  const cht = build([
    [0, 5],
    [1, 10],
  ]);
  expect(cht.query(0)).toBe(5);
  expect(cht.query(-100)).toBe(-90);
});

test("음수 기울기에서 양수 기울기 순서로 등록", () => {
  const cht = build([
    [-2, 0],
    [-1, 0],
    [1, 0],
    [2, 0],
  ]);
  expect(cht.query(10)).toBe(-20);
  expect(cht.query(-10)).toBe(-20);
  expect(cht.query(0)).toBe(0);
});

test("담당 구간을 잃은 직선 제거 — 가운데 직선이 어디서도 최솟값이 아니다", () => {
  const lines: [number, number][] = [
    [0, -100],
    [1, 0],
    [2, 100],
  ];
  const cht = build(lines);
  expect(cht.query(-1000)).toBe(-1900);
  expect(cht.query(0)).toBe(-100);
  expect(cht.query(1000)).toBe(-100);
  // 남은 직선은 (0,-100) 과 (2,100) 둘이고 (1,0) 은 담당 구간이 비었다.
  expect(cht.hull.map((l) => [l.m, l.b])).toEqual([
    [0, -100],
    [2, 100],
  ]);
});

test("성능 케이스와 같은 입력 — 직선 10,000 개와 질의 10,000 개의 값이 나온다", () => {
  const N = 10_000;
  const cht = new ConvexHullTrick();
  for (let i = 0; i < N; i++) cht.addLine(i, -i * i);
  // b = -m² 은 위로 볼록이라 하한 껍질에는 양 끝 둘만 남는다.
  expect(cht.hull.length).toBe(2);
  expect(cht.query(0)).toBe(-99_980_001);
  // x = 9,999 에서 두 직선의 값이 0 으로 같고, 그보다 크면 기울기 0 인 직선이 최솟값이다.
  expect(cht.query(9_999)).toBe(0);
  expect(cht.query(19_998)).toBe(0);
  expect(cht.query(-1)).toBe(-99_990_000);
});

test("전개가 쓰는 입력 — 직선 여섯 개의 껍질은 셋이고 답은 -3 · -8 · -8 이다", () => {
  const lines: [number, number][] = [
    [-2, 0],
    [-1, 5],
    [0, -1],
    [0, -3],
    [2, 0],
    [2, 7],
  ];
  const cht = build(lines);
  expect(cht.hull.map((l) => [l.m, l.b])).toEqual([
    [-2, 0],
    [0, -3],
    [2, 0],
  ]);
  expect(cht.query(0)).toBe(-3);
  expect(cht.query(-4)).toBe(-8);
  expect(cht.query(4)).toBe(-8);
});

test("전부 계산하는 방법과 값이 같다 — 직선 40 개 · 질의 -400…400 전수", () => {
  const lines: [number, number][] = [];
  for (let i = 0; i < 40; i++) lines.push([i - 20, (i * 48_271) % 65_537]);
  const cht = build(lines);
  let checked = 0;
  for (let x = -400; x <= 400; x++) {
    expect(cht.query(x)).toBe(brute(lines, x));
    checked++;
  }
  expect(checked).toBe(801);
});

test("본문 불변식이 드는 자리 — 껍질의 교점이 자리 순서로 감소한다", () => {
  const lines: [number, number][] = [];
  for (let i = 0; i < 64; i++) {
    const m = i - 32;
    lines.push([m, m * m]);
  }
  const cht = build(lines);
  // b = m² 은 아래로 볼록이라 64 개가 전부 남는다.
  expect(cht.hull.length).toBe(64);
  const cross: number[] = [];
  for (let k = 0; k + 1 < cht.hull.length; k++) {
    const a = cht.hull[k] as { m: number; b: number };
    const c = cht.hull[k + 1] as { m: number; b: number };
    cross.push((c.b - a.b) / (a.m - c.m));
  }
  for (let k = 0; k + 1 < cross.length; k++) {
    expect(cross[k] as number).toBeGreaterThan(cross[k + 1] as number);
  }
});

test("본문 수식 절이 드는 자리 — isCovered 는 세 점의 방향 판정과 부호만 다르다", () => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 12; i++) pts.push([i - 6, ((i * 7) % 11) - 5]);
  let checked = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      for (let k = j + 1; k < pts.length; k++) {
        const [m1, b1] = pts[i] as [number, number];
        const [m2, b2] = pts[j] as [number, number];
        const [m3, b3] = pts[k] as [number, number];
        const turn = (m2 - m1) * (b3 - b1) - (b2 - b1) * (m3 - m1);
        expect(
          isCovered({ m: m1, b: b1 }, { m: m2, b: b2 }, { m: m3, b: b3 }),
        ).toBe(-turn >= 0);
        checked++;
      }
    }
  }
  expect(checked).toBe(220);
});
