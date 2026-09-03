/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/matrixChainMultiplication/matrixChainMultiplication.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 *
 * **원본의 기댓값 하나를 그대로 옮기지 않았다.** `matrixChainMultiplication.test.ts:50-51`
 * 이 `[1,1,1,1,1]` 의 답을 `0` 으로 적었는데, 그 입력은 1×1 행렬 넷이라 곱셈이 세 번
 * 일어나고 한 번마다 `1·1·1 = 1` 이므로 답이 `3` 이다. 여기서는 `3` 으로 건다 —
 * **원본은 이 카드의 범위 밖이라 고치지 않고 보고에만 적는다.**
 */
import { expect, test } from "bun:test";
import { matrixChainMultiplication } from "./matrixChainMultiplication-guide.ref.ts";

const CASES: [number[], number][] = [
  // 기본
  [[10, 20, 30, 40, 30], 30_000],
  [[40, 20, 30, 10, 30], 26_000],
  [[1, 2, 3, 4], 18],
  // 엣지
  [[10, 20], 0],
  [[5, 10, 3], 150],
  [[5, 5, 5, 5], 250],
  [[2, 3, 4, 2, 5], 56],
  // 바운더리
  [[10], 0],
  [[500, 500, 500], 125_000_000],
  // 원본 :50-51 은 0 으로 적혀 있다. 실제 답은 3 이다.
  [[1, 1, 1, 1, 1], 3],
];

for (const [dims, want] of CASES) {
  test(`정본 — matrixChainMultiplication([${dims.join(", ")}]) = ${want}`, () => {
    expect(matrixChainMultiplication(dims)).toBe(want);
  });
}

test("성능 케이스와 같은 입력 — n=100 에서 답이 나온다", () => {
  const dims = Array.from({ length: 101 }, (_, i) => ((i * 13) % 50) + 1);
  expect(matrixChainMultiplication(dims)).toBe(61_701);
});

test("전개가 쓰는 입력 — dims=[10,30,5,60,10] 은 5000 이다", () => {
  expect(matrixChainMultiplication([10, 30, 5, 60, 10])).toBe(5_000);
  // 문제 예시의 앞 네 칸. 전개 입력의 접두다.
  expect(matrixChainMultiplication([10, 30, 5, 60])).toBe(4_500);
  expect(matrixChainMultiplication([10, 30, 5])).toBe(1_500);
});

test("본문 불변식이 드는 자리 — 길이 1 구간은 0 이고 길이 2 구간은 후보가 하나다", () => {
  expect(matrixChainMultiplication([7])).toBe(0);
  expect(matrixChainMultiplication([7, 9])).toBe(0);
  expect(matrixChainMultiplication([7, 9, 4])).toBe(7 * 9 * 4);
});

test("본문 비용 절이 드는 자리 — 차원이 전부 상한 500 이고 n=100 이면 답이 안전 정수 안쪽이다", () => {
  const dims = new Array<number>(101).fill(500);
  const answer = matrixChainMultiplication(dims);
  expect(answer).toBe(12_375_000_000);
  expect(answer).toBeLessThan(Number.MAX_SAFE_INTEGER);
});
