/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/longestIncreasingSubsequence/longestIncreasingSubsequence.test.ts`
 * 는 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * **원본에 없던 케이스 셋을 더 걸었다.** ① 입력 배열을 변형하지 않는가 ② 부분 수열을 전부
 * 만들어 검사하는 정의대로의 풀이와 작은 입력 전수에서 답이 같은가 ③ 제약 상한 규모.
 */
import { expect, test } from "bun:test";
import { longestIncreasingSubsequence } from "./longestIncreasingSubsequence-guide.ref.ts";

const CASES: [string, number[], number][] = [
  ["문제 예시 하나", [10, 9, 2, 5, 3, 7, 101, 18], 4],
  ["문제 예시 둘", [0, 1, 0, 3, 2, 3], 4],
  ["문제 예시 셋", [1, 3, 6, 7, 9, 4, 10, 5, 6], 6],
  ["같은 값만 넷 — 엄격 증가가 안 된다", [7, 7, 7, 7], 1],
  ["엄격 감소 다섯", [5, 4, 3, 2, 1], 1],
  ["음수만 있는 엄격 증가", [-3, -2, -1, 0], 4],
  ["원소 하나", [42], 1],
  ["빈 배열", [], 0],
  ["원소 둘 · 증가", [1, 2], 2],
  ["원소 둘 · 같음", [2, 2], 1],
  ["원소 둘 · 감소", [2, 1], 1],
  ["가중치 상한 부근", [-1_000_000_000, 0, 1_000_000_000], 3],
];

for (const [name, a, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(longestIncreasingSubsequence(a)).toBe(want);
  });
}

test("입력 배열을 변형하지 않는다", () => {
  const a = [10, 9, 2, 5, 3, 7, 101, 18];
  const snapshot = JSON.stringify(a);
  longestIncreasingSubsequence(a);
  expect(JSON.stringify(a)).toBe(snapshot);
});

test("작은 입력 전수에서 정의대로의 풀이와 답이 같다", () => {
  // 값이 0~2 인 길이 1~7 짜리 배열을 전수로 만들어, 부분 수열을 전부 검사하는 풀이와 맞춘다.
  const naive = (a: number[]): number => {
    let best = 0;
    for (let mask = 0; mask < 1 << a.length; mask++) {
      let last = Number.NEGATIVE_INFINITY;
      let len = 0;
      let ok = true;
      for (let i = 0; i < a.length; i++) {
        if ((mask & (1 << i)) === 0) continue;
        if ((a[i] as number) <= last) {
          ok = false;
          break;
        }
        last = a[i] as number;
        len++;
      }
      if (ok && len > best) best = len;
    }
    return best;
  };
  let checked = 0;
  for (let n = 1; n <= 7; n++) {
    for (let code = 0; code < 3 ** n; code++) {
      const a: number[] = [];
      let rest = code;
      for (let i = 0; i < n; i++) {
        a.push(rest % 3);
        rest = Math.floor(rest / 3);
      }
      expect(longestIncreasingSubsequence(a)).toBe(naive(a));
      checked++;
    }
  }
  expect(checked).toBe(3 + 9 + 27 + 81 + 243 + 729 + 2_187);
});

test("제약 상한 규모의 증가 수열에서 답이 나온다", () => {
  const n = 100_000;
  const a: number[] = [];
  for (let i = 0; i < n; i++) a.push(i);
  expect(longestIncreasingSubsequence(a)).toBe(n);
});

test("제약 상한 규모의 감소 수열에서 답이 1 이다", () => {
  const n = 100_000;
  const a: number[] = [];
  for (let i = 0; i < n; i++) a.push(n - i);
  expect(longestIncreasingSubsequence(a)).toBe(1);
});
