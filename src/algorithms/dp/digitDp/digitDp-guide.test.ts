/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/digitDp/digitDp.test.ts` 는 학습자 스텁을 가져오므로 그대로 재사용할
 * 수 없다. **케이스만** 옮겨 정본에 다시 건다. 「성능」 케이스의 벽시계 단언(`100ms 이내`)은
 * 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { digitDp } from "./digitDp-guide.ref.ts";

const CASES: [number, number, number][] = [
  // 기본
  [20, 2, 3],
  [10, 1, 2],
  [9, 5, 1],
  [100, 10, 9],
  // 엣지
  [100, 0, 0],
  [99, 20, 0],
  [1, 1, 1],
  [1, 2, 0],
  [9, 9, 1],
  [99, 18, 1],
  // 바운더리
  [999, 27, 1],
  [1000, 1, 4],
  // 문제 예시
  [9, 5, 1],
  [100, 1, 3],
  [999, 28, 0],
];

for (const [N, K, want] of CASES) {
  test(`정본 — digitDp(${N}, ${K}) = ${want}`, () => {
    expect(digitDp(N, K)).toBe(want);
  });
}

test("성능 케이스와 같은 입력 — N = 10^15 · K = 50 에서 값이 나온다", () => {
  expect(digitDp(10 ** 15, 50)).toBe(10_614_794_989_443);
});

test("전개가 쓰는 입력 — N = 194 · K = 10 은 19 다", () => {
  expect(digitDp(194, 10)).toBe(19);
  // 전개가 갈래를 나누는 두 자리. 자유 쪽이 9 개, tight 쪽이 10 개다.
  expect(digitDp(99, 10)).toBe(9);
  expect(digitDp(194, 10) - digitDp(99, 10)).toBe(10);
});

test("하나씩 세는 방법과 값이 같다 — N ≤ 400 · K ≤ 20 전수", () => {
  const bySum = (x: number): number => {
    let s = 0;
    let v = x;
    while (v > 0) {
      s += v % 10;
      v = Math.floor(v / 10);
    }
    return s;
  };
  let checked = 0;
  for (let N = 1; N <= 400; N++) {
    for (let K = 0; K <= 20; K++) {
      let want = 0;
      for (let x = 1; x <= N; x++) if (bySum(x) === K) want++;
      expect(digitDp(N, K)).toBe(want);
      checked++;
    }
  }
  expect(checked).toBe(400 * 21);
});

test("본문 불변식이 드는 자리 — 자리 수 × 9 를 넘는 K · K = 0 · 한 자리 수", () => {
  expect(digitDp(999, 28)).toBe(0);
  expect(digitDp(10 ** 15, 135)).toBe(1);
  expect(digitDp(1, 0)).toBe(0);
  expect(digitDp(9, 0)).toBe(0);
  for (let K = 1; K <= 9; K++) expect(digitDp(9, K)).toBe(1);
});

test("본문 수식 절이 드는 자리 — N = 10^15 의 답은 W(15, K) 에 [K = 1] 을 더한 것이다", () => {
  // 자유 자리 15 개를 합 K 로 채우는 방법 수. 표로 낸다.
  const W = (m: number, t: number): number => {
    let row = [1, ...new Array<number>(t).fill(0)];
    for (let i = 0; i < m; i++) {
      const next = new Array<number>(t + 1).fill(0);
      for (let s = 0; s <= t; s++)
        for (let x = 0; x <= 9 && x <= s; x++)
          next[s] = (next[s] as number) + (row[s - x] as number);
      row = next;
    }
    return row[t] as number;
  };
  for (const K of [1, 2, 10, 50, 67, 100, 135]) {
    expect(digitDp(10 ** 15, K)).toBe(W(15, K) + (K === 1 ? 1 : 0));
  }
  // 합을 전부 더하면 15 자리 문자열의 개수다.
  let all = 0;
  for (let K = 0; K <= 135; K++) all += W(15, K);
  expect(all).toBe(10 ** 15);
});
