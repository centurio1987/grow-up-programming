/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/binary-search/ternarySearch/ternarySearch.test.ts` 는 학습자가 채우는
 * 파일을 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 성능 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 */
import { expect, test } from "bun:test";
import { ternarySearch } from "./ternarySearch-guide.ref.ts";

/** [이름, f, lo, hi, epsilon, 최솟점] */
const CASES: [string, (x: number) => number, number, number, number, number][] =
  [
    // 기본 동작 — 표준 단봉 함수
    ["(x-3)² + 5 · [-10, 10]", (x) => (x - 3) ** 2 + 5, -10, 10, 1e-9, 3],
    ["x² · [-100, 100]", (x) => x * x, -100, 100, 1e-9, 0],
    ["(x+7)² · [-20, 20]", (x) => (x + 7) ** 2, -20, 20, 1e-9, -7],
    ["(x-1.5)² + 2 · [0, 10]", (x) => (x - 1.5) ** 2 + 2, 0, 10, 1e-9, 1.5],
    // 다른 모양의 단봉 함수 — 미분 불가능한 자리가 있어도 된다
    ["|x-2| · [-10, 10]", (x) => Math.abs(x - 2), -10, 10, 1e-9, 2],
    [
      "x⁴ - 4x³ + 6x² · [-5, 5]",
      (x) => x ** 4 - 4 * x ** 3 + 6 * x * x,
      -5,
      5,
      1e-9,
      0,
    ],
    // 엣지 케이스 — 최솟점이 구간 경계 근처
    ["(x-0.5)² · [0, 100]", (x) => (x - 0.5) ** 2, 0, 100, 1e-9, 0.5],
    ["(x-99.5)² · [0, 100]", (x) => (x - 99.5) ** 2, 0, 100, 1e-9, 99.5],
    // 바운더리 — 구간이 매우 좁거나 넓은 경우
    [
      "(x-3)² + 5 · [2.999, 3.001]",
      (x) => (x - 3) ** 2 + 5,
      2.999,
      3.001,
      1e-12,
      3,
    ],
    [
      "(x-3)² + 5 · [-10^6, 10^6]",
      (x) => (x - 3) ** 2 + 5,
      -1_000_000,
      1_000_000,
      1e-9,
      3,
    ],
    // 음수 영역만 포함하는 구간
    ["(x+50)² · [-100, -1]", (x) => (x + 50) ** 2, -100, -1, 1e-9, -50],
  ];

for (const [name, f, lo, hi, eps, star] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(ternarySearch(f, lo, hi, eps)).toBeCloseTo(star, 6);
  });
}

test("ε 가 크면 그만큼만 보장한다", () => {
  // 원본 테스트의 「epsilon=1e-3 일 때 결과는 최솟점에 대해 약 1e-2 이내」 케이스.
  const f = (x: number) => (x - 3) ** 2 + 5;
  expect(Math.abs(ternarySearch(f, -10, 10, 1e-3) - 3)).toBeLessThan(1e-2);
});

test("반환값은 마지막 구간의 중점이고 오차는 ε/2 를 넘지 않는다", () => {
  // 전개가 쓰는 입력. 본문의 T8 이 내미는 값과 같은 자리다.
  const f = (x: number) => (x - 2) ** 2;
  const x = ternarySearch(f, 0, 9, 1);
  expect(x).toBeCloseTo(1.8765, 4);
  expect(Math.abs(x - 2)).toBeLessThanOrEqual(0.5);
});

test("시작할 때 이미 ε 이하면 반복에 들어가지 않는다", () => {
  // f 를 한 번도 부르지 않고 중점이 그대로 나온다.
  let calls = 0;
  const f = (x: number) => {
    calls++;
    return (x - 2) ** 2;
  };
  expect(ternarySearch(f, 1, 1 + 1e-7, 1e-6)).toBeCloseTo(1 + 5e-8, 12);
  expect(calls).toBe(0);
});

test("f 호출 수는 f 의 모양이 아니라 L 과 ε 만 따라간다", () => {
  // perf.worst 가 세는 관계. 같은 구간·같은 ε 이면 어떤 단봉 함수든 호출 수가 같다.
  const count = (f: (x: number) => number): number => {
    let calls = 0;
    ternarySearch(
      (x) => {
        calls++;
        return f(x);
      },
      0,
      9,
      1e-6,
    );
    return calls;
  };
  const shapes: ((x: number) => number)[] = [
    (x) => (x - 2) ** 2,
    (x) => Math.abs(x - 2),
    (x) => (x - 2) ** 4,
    (x) => Math.exp(x - 2) + Math.exp(2 - x),
  ];
  const counts = shapes.map(count);
  expect(new Set(counts).size).toBe(1);
  expect(counts[0]).toBe(80);
});
