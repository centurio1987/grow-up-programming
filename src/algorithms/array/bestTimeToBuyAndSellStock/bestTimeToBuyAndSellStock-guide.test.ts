/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/bestTimeToBuyAndSellStock/bestTimeToBuyAndSellStock.test.ts` 는
 * 학습자가 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시
 * 건다. 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(N=100,000 에서의 반환값)은 모든 쌍을 세는 방식과 대조해 확인한다.
 */
import { expect, test } from "bun:test";
import { bestTimeToBuyAndSellStock } from "./bestTimeToBuyAndSellStock-guide.ref.ts";

const CASES: [number[], number][] = [
  // 기본
  [[7, 1, 5, 3, 6, 4], 5],
  [[1, 2, 3, 4, 5], 4],
  [[2, 4, 1, 7], 6],
  // 엣지
  [[7, 6, 4, 3, 1], 0],
  [[5, 5, 5, 5], 0],
  [[5, 4, 3, 2, 1], 0],
  [[0, 10], 10],
  // 바운더리
  [[5], 0],
  [[1, 2], 1],
  [[2, 1], 0],
  [[0, 10000], 10000],
];

for (const [prices, want] of CASES) {
  test(`정본 — [${prices.join(" ")}]`, () => {
    expect(bestTimeToBuyAndSellStock(prices)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(bestTimeToBuyAndSellStock([7, 2, 5, 1, 6, 3])).toBe(5);
});

/** 모든 `(i, j)` 쌍의 이익을 각각 만드는 방식. 정의를 그대로 옮긴 것이라 기준이 된다. */
function byAllPairs(prices: number[]): number {
  let best = 0;
  for (let i = 0; i < prices.length; i++) {
    for (let j = i; j < prices.length; j++) {
      best = Math.max(best, (prices[j] as number) - (prices[i] as number));
    }
  }
  return best;
}

test("작은 입력 전수에서 모든 쌍을 세는 방식과 같은 답을 낸다", () => {
  // 길이 1~7, 값 0..9 를 규칙으로 만든 입력 2,800 개.
  for (let n = 1; n <= 7; n++) {
    for (let seed = 0; seed < 400; seed++) {
      const prices = Array.from(
        { length: n },
        (_, k) => ((seed + 1) * (k + 3) * 37) % 10,
      );
      expect(bestTimeToBuyAndSellStock(prices)).toBe(byAllPairs(prices));
    }
  }
});

test("제약 최댓값에서 모든 쌍을 세는 방식과 같은 답을 낸다", () => {
  const N = 100_000;
  const prices = Array.from({ length: N }, (_, i) => (i * 37) % 10_001);
  expect(bestTimeToBuyAndSellStock(prices)).toBe(byAllPairs(prices));
});

test("제약 최댓값의 성능 케이스가 같은 값을 낸다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const N = 100_000;
  expect(
    bestTimeToBuyAndSellStock(Array.from({ length: N }, (_, i) => i)),
  ).toBe(N - 1);
});

test("가격이 계속 낮아지면 거래를 하지 않고 0 을 낸다", () => {
  expect(bestTimeToBuyAndSellStock([9, 7, 5, 3, 1])).toBe(0);
});

test("답이 마지막 날에서 만들어지지 않아도 찾아낸다", () => {
  // 마지막 날의 이익(3)과 답(8)이 다른 입력이다.
  expect(bestTimeToBuyAndSellStock([10, 1, 9, 0, 3])).toBe(8);
});

test("최저가가 갱신돼도 앞에서 만든 이익이 사라지지 않는다", () => {
  // 칸 3 에서 최저가가 1 에서 0 으로 내려가지만 답은 그 앞에서 만들어진 8 이다.
  expect(bestTimeToBuyAndSellStock([10, 1, 9, 0, 1])).toBe(8);
});
