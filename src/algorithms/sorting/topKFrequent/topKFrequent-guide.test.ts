/**
 * 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/topKFrequent/topKFrequent.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**
 * (N=100,000 에서 답의 개수와 값)은 아래에 결정론적 입력으로 남겼다.
 */
import { expect, test } from "bun:test";
import { topKFrequent } from "./topKFrequent-guide.ref.ts";

/** 답의 순서까지 정해지는 케이스. 등장 횟수가 전부 다르거나 순서가 보장되는 것들이다. */
const EXACT: [string, number[], number, number[]][] = [
  ["[1 1 1 2 2 3] · k=2", [1, 1, 1, 2, 2, 3], 2, [1, 2]],
  ["k=1 — 값이 하나뿐", [1], 1, [1]],
  ["등장 횟수 내림차순", [4, 4, 4, 4, 2, 2, 2, 1, 1, 3], 3, [4, 2, 1]],
  ["음수가 섞인 배열", [-1, -1, -1, 2, 2, 0], 2, [-1, 2]],
  ["전부 같은 값 · k=1", [7, 7, 7, 7], 1, [7]],
  ["가장 짧은 배열", [42], 1, [42]],
  [
    "값의 범위 경계",
    [1_000_000_000, 1_000_000_000, -1_000_000_000],
    1,
    [1_000_000_000],
  ],
  ["전개가 쓰는 입력", [4, 4, 4, 2, 2, 1, 1, 3, 5], 3, [4, 2, 1]],
];

for (const [name, A, k, want] of EXACT) {
  test(`정본 — ${name}`, () => {
    expect(topKFrequent([...A], k)).toEqual(want);
  });
}

test("등장 횟수가 전부 같으면 셋 다 담긴다", () => {
  const got = topKFrequent([1, 2, 3], 3);
  expect(got.slice().sort((a, b) => a - b)).toEqual([1, 2, 3]);
});

test("k = 서로 다른 값의 개수 — 첫 자리만 정해진다", () => {
  const got = topKFrequent([1, 1, 2, 3], 3);
  expect(got[0]).toBe(1);
  expect(got.slice(1).sort((a, b) => a - b)).toEqual([2, 3]);
});

test("N=100,000 에서 답의 개수와 값", () => {
  // 값 j 의 등장 횟수를 1 + (j mod 3) 으로 두고 자리를 (7919 i) mod N 으로 옮긴 입력.
  // 등장 횟수가 3 인 값이 16,666 개라, 그중 열 개를 답하면 전부 등장 횟수 3 이다.
  const N = 100_000;
  const flat: number[] = [];
  for (let j = 0; flat.length < N; j++) {
    const f = 1 + (j % 3);
    for (let t = 0; t < f && flat.length < N; t++) flat.push(j);
  }
  const A = Array.from({ length: N }, (_, i) => flat[(i * 7919) % N] as number);

  const got = topKFrequent(A, 10);
  expect(got.length).toBe(10);

  const freq = new Map<number, number>();
  for (const v of A) freq.set(v, (freq.get(v) ?? 0) + 1);
  for (const v of got) expect(freq.get(v)).toBe(3);
});

test("답의 등장 횟수는 답에 없는 어떤 값보다도 적지 않다", () => {
  const A = [5, 5, 3, 3, 3, 9, 1, 1, 1, 1, 8, 8];
  const k = 2;
  const got = topKFrequent([...A], k);
  const freq = new Map<number, number>();
  for (const v of A) freq.set(v, (freq.get(v) ?? 0) + 1);
  const inside = got.map((v) => freq.get(v) ?? 0);
  const outside = [...freq.entries()]
    .filter(([v]) => !got.includes(v))
    .map(([, f]) => f);
  expect(Math.min(...inside)).toBeGreaterThanOrEqual(Math.max(...outside));
  expect(got).toEqual([1, 3]);
});
