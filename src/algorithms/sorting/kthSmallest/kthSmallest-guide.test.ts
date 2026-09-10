/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/kthSmallest/kthSmallest.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 원본의 두 케이스는 그대로 옮기지 않았다.
 * - 「N=100,000 을 100ms 이내」는 벽시계라 실행마다 값이 달라 판정이 안 된다.
 * - 「무작위 입력에서 정렬 기준값과 일치한다」는 `Math.random` 을 쓴다. 같은 직무를 **고정
 *   씨앗 생성기**로 옮겨 담아, 실패했을 때 그 입력을 다시 만들 수 있게 했다.
 */
import { expect, test } from "bun:test";
import { kthSmallest } from "./kthSmallest-guide.ref.ts";

/** `[배열, k, 기대값]`. 원본 테스트의 케이스와 문제 문서의 예시가 같은 것들이다. */
const CASES: [number[], number, number][] = [
  [[3, 1, 2], 1, 1],
  [[3, 1, 2], 2, 2],
  [[3, 1, 2], 3, 3],
  [[7, 10, 4, 3, 20, 15], 3, 7],
  [[7, 10, 4, 3, 20, 15], 4, 10],
  [[-5, 0, 5, -10, 10], 1, -10],
  [[2, 1, 2, 1, 3, 1], 4, 2],
  // 바운더리 — 길이·값 범위·k 양끝
  [[42], 1, 42],
  [[10, 5], 1, 5],
  [[10, 5], 2, 10],
  [[7, 10, 4, 3, 20, 15], 1, 3],
  [[7, 10, 4, 3, 20, 15], 6, 20],
  [[1_000_000_000, -1_000_000_000, 0], 2, 0],
  // 엣지 — 중복·음수·전부 동일
  [[5, 5, 5, 5], 1, 5],
  [[5, 5, 5, 5], 3, 5],
  [[5, 5, 5, 5], 4, 5],
  [[1, 1, 2], 2, 1],
  [[-1, -5, -3], 2, -3],
];

for (const [input, k, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)} k=${k}`, () => {
    // 정본은 입력을 제자리에서 고친다. 사본을 넘겨 케이스 배열을 지킨다.
    expect(kthSmallest([...input], k)).toBe(want);
  });
}

test("본문이 인용한 최악 입력도 답은 정확하다", () => {
  // perf.worst 가 드는 입력. 느린 것과 틀린 것은 다른 문제다.
  expect(kthSmallest([2, 6, 4, 0, 1, 3, 5, 7], 8)).toBe(7);
  expect(kthSmallest([2, 5, 0, 1, 3, 4], 6)).toBe(5);
});

test("고정 씨앗 난수 200 벌에서 정렬 기준값과 일치한다", () => {
  // 선형 합동 생성기. 씨앗이 고정이라 실패한 입력을 그대로 다시 만들 수 있다.
  let seed = 20260902;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed;
  };
  for (let trial = 0; trial < 200; trial++) {
    const n = 1 + (next() % 50);
    const A = Array.from({ length: n }, () => (next() % 21) - 10);
    const sorted = [...A].sort((a, b) => a - b);
    const k = 1 + (next() % n);
    expect(kthSmallest([...A], k)).toBe(sorted[k - 1] as number);
  }
});
