/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/medianFromDataStream/medianFromDataStream.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`medianFromDataStream-guide.ref.ts`)에 다시 건다.
 *
 * 벽시계를 재는 케이스(`N=100,000` 을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { streamValue } from "./medianFromDataStream-guide.alt.ts";
import { MedianFinder } from "./medianFromDataStream-guide.ref.ts";

/** 수를 차례로 넣으면서 매번 물어본 답. */
function answers(values: number[]): number[] {
  const mf = new MedianFinder();
  return values.map((v) => {
    mf.addNum(v);
    return mf.findMedian();
  });
}

/** 정의 그대로 정렬해서 고른 답. */
function byDefinition(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  if (n % 2 === 1) return s[(n - 1) / 2] as number;
  return ((s[n / 2 - 1] as number) + (s[n / 2] as number)) / 2;
}

const CASES: [string, number[], number[]][] = [
  ["한 개 → 중앙값은 자기 자신", [1], [1]],
  ["두 개 → 두 값의 평균", [1, 2], [1, 1.5]],
  ["세 개 → 가운데 값", [1, 2, 3], [1, 1.5, 2]],
  ["순서대로 1 … 5 를 넣으며 추적", [1, 2, 3, 4, 5], [1, 1.5, 2, 2.5, 3]],
  ["역순으로 5 … 1 을 넣으며 추적", [5, 4, 3, 2, 1], [5, 4.5, 4, 3.5, 3]],
  ["중복 원소", [2, 2, 2, 2], [2, 2, 2, 2]],
  ["음수와 양수 혼합", [-1, -2, -3, 0], [-1, -1.5, -2, -1.5]],
  [
    "최솟값과 최댓값 경계",
    [-1_000_000_000, 1_000_000_000],
    [-1_000_000_000, 0],
  ],
  ["음수만 들어온 경우", [-5, -10], [-5, -7.5]],
  ["본문 전개가 쓰는 고정 입력", [5, 15, 1, 3, 5], [5, 10, 5, 4, 5]],
];

for (const [name, input, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(answers(input)).toEqual(want);
  });
}

test("어떤 길이에서도 정의대로 고른 답과 같다", () => {
  const values: number[] = [];
  const mf = new MedianFinder();
  for (let i = 0; i < 300; i++) {
    values.push(streamValue(i));
    mf.addNum(values[i] as number);
    expect(mf.findMedian()).toBe(byDefinition(values));
  }
});

test("전부 같은 값이 만 개 들어와도 그 값이 답이다", () => {
  const mf = new MedianFinder();
  for (let i = 0; i < 10_000; i++) mf.addNum(42);
  expect(mf.findMedian()).toBe(42);
});

test("값의 양 끝을 번갈아 넣어도 답이 정확하다", () => {
  const mf = new MedianFinder();
  const values: number[] = [];
  for (let i = 0; i < 1_000; i++) {
    const v = i % 2 === 0 ? -1_000_000_000 + i : 1_000_000_000 - i;
    values.push(v);
    mf.addNum(v);
  }
  expect(mf.findMedian()).toBe(byDefinition(values));
});

test("N = 100,000 을 넣어도 정의대로 고른 답과 같다", () => {
  const mf = new MedianFinder();
  const values: number[] = [];
  for (let i = 0; i < 100_000; i++) {
    const v = streamValue(i);
    values.push(v);
    mf.addNum(v);
  }
  expect(mf.findMedian()).toBe(byDefinition(values));
});
