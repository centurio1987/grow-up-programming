/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/bestTimeToBuyAndSellStockK/bestTimeToBuyAndSellStockK.test.ts` 는
 * 학습자가 채우는 파일을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시
 * 건다. 벽시계를 재는 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 케이스의 **입출력**(N=1,000 · k=100 에서의 반환값)은 거래 집합을 전부 만드는 방식으로는
 * 대조가 불가능한 규모라, 거래 상한을 `⌊N/2⌋` 로 올려도 답이 같은지로 대신 확인한다.
 */
import { expect, test } from "bun:test";
import { bestTimeToBuyAndSellStockK } from "./bestTimeToBuyAndSellStockK-guide.ref.ts";

const CASES: [number, number[], number][] = [
  // 기본
  [2, [2, 4, 1, 5], 6],
  [2, [3, 2, 6, 5, 0, 3], 7],
  [1, [7, 1, 5, 3, 6, 4], 5],
  [2, [2, 4, 1], 2],
  // 엣지
  [0, [1, 2, 3], 0],
  [0, [1, 5, 3, 8], 0],
  [2, [5, 4, 3, 2, 1], 0],
  [3, [5, 4, 3, 2, 1], 0],
  [100, [1, 2, 3, 4, 5], 4],
  [3, [5, 5, 5, 5], 0],
  // 바운더리
  [2, [5], 0],
  [1, [1, 10], 9],
  [100, [0, 10_000], 10_000],
  [2, [], 0],
];

for (const [k, prices, want] of CASES) {
  test(`정본 — k=${k} [${prices.join(" ")}]`, () => {
    expect(bestTimeToBuyAndSellStockK(k, prices)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(bestTimeToBuyAndSellStockK(2, [2, 6, 3, 9, 5, 7])).toBe(10);
});

test("전개 입력은 거래 상한마다 답이 갈린다", () => {
  const prices = [2, 6, 3, 9, 5, 7];
  expect(
    [1, 2, 3, 4, 5].map((k) => bestTimeToBuyAndSellStockK(k, prices)),
  ).toEqual([7, 10, 12, 12, 12]);
});

/**
 * 거래 집합을 전부 만들어 보는 방식. 매수일과 매도일을 `i < j` 로 고르고 다음 매수일을 `j`
 * 보다 뒤에서 고른다 — 매도일과 다음 매수일이 같은 거래 짝은 하나로 합쳐도 이익이 같으므로
 * 이렇게 제한해도 최적을 놓치지 않는다.
 */
function byEnumerating(k: number, prices: number[]): number {
  const n = prices.length;
  let best = 0;
  const walk = (start: number, left: number, acc: number): void => {
    best = Math.max(best, acc);
    if (left === 0) return;
    for (let i = start; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        walk(
          j + 1,
          left - 1,
          acc + (prices[j] as number) - (prices[i] as number),
        );
      }
    }
  };
  walk(0, k, 0);
  return best;
}

test("작은 입력 전수에서 거래 집합을 전부 만드는 방식과 같은 답을 낸다", () => {
  // 길이 1~7, 값 0..11 을 규칙으로 만든 입력에 거래 상한 0~3 을 건다.
  for (let n = 1; n <= 7; n++) {
    for (let seed = 0; seed < 200; seed++) {
      const prices = Array.from(
        { length: n },
        (_, j) => ((seed + 1) * (j + 3) * 37) % 12,
      );
      for (let k = 0; k <= 3; k++) {
        expect(bestTimeToBuyAndSellStockK(k, prices)).toBe(
          byEnumerating(k, prices),
        );
      }
    }
  }
});

test("거래 상한을 ⌊N/2⌋ 보다 크게 잡아도 답이 안 커진다", () => {
  for (let n = 2; n <= 12; n++) {
    for (let seed = 0; seed < 120; seed++) {
      const prices = Array.from(
        { length: n },
        (_, j) => ((seed + 5) * (j + 2) * 41) % 9,
      );
      const half = Math.floor(n / 2);
      expect(bestTimeToBuyAndSellStockK(half, prices)).toBe(
        bestTimeToBuyAndSellStockK(n, prices),
      );
    }
  }
});

test("가격이 두 값 사이를 번갈아 오가면 ⌊N/2⌋ 번을 다 쓴다", () => {
  for (const n of [4, 6, 8, 10, 12]) {
    const prices = Array.from({ length: n }, (_, j) =>
      j % 2 === 0 ? 0 : 10_000,
    );
    const half = Math.floor(n / 2);
    expect(bestTimeToBuyAndSellStockK(half, prices)).toBe(half * 10_000);
    expect(bestTimeToBuyAndSellStockK(half - 1, prices)).toBe(
      (half - 1) * 10_000,
    );
  }
});

test("제약 최댓값에서 거래 상한만 올려도 답이 같다", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  const n = 1_000;
  const prices = Array.from({ length: n }, (_, j) => (j * 7) % 100);
  const at100 = bestTimeToBuyAndSellStockK(100, prices);
  expect(at100).toBe(bestTimeToBuyAndSellStockK(500, prices));
  expect(at100).toBeGreaterThan(0);
});

test("거래 상한이 0 이거나 날이 하나뿐이면 특례 없이 0 이 나온다", () => {
  expect(bestTimeToBuyAndSellStockK(0, [1, 100, 2, 200])).toBe(0);
  expect(bestTimeToBuyAndSellStockK(100, [7])).toBe(0);
});
