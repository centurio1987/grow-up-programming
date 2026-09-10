/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/binary-search/parametricBinarySearch/parametricBinarySearch.test.ts` 는
 * 학습자가 채우는 파일을 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시
 * 건다. 벽시계를 재는 성능 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 자리는 같은 크기 입력의 **정확한 반환값**으로 대신한다.
 */
import { expect, test } from "bun:test";
import {
  feasible,
  parametricBinarySearch,
} from "./parametricBinarySearch-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 문제 예시
  [[7, 2, 5, 10, 8], 2, 18],
  [[1, 2, 3, 4, 5], 2, 9],
  [[1, 4, 4], 3, 4],
  [[1, 2, 3, 4, 5], 1, 15],
  [[1, 2, 3, 4, 5], 5, 5],
  [[7], 1, 7],
  // 엣지 케이스
  [[0, 0, 0, 0], 2, 0],
  [[5, 5, 5, 5, 5], 5, 5],
  [[5, 5, 5, 5, 5], 1, 25],
  [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3, 21],
  // 바운더리
  [[3, 1, 4, 1, 5, 9, 2, 6], 8, 9],
  [[3, 1, 4, 1, 5, 9, 2, 6], 1, 31],
  [[1, 1, 1, 1_000_000], 2, 1_000_000],
  [[3, 5], 2, 5],
];

for (const [A, K, want] of CASES) {
  test(`정본 — ${JSON.stringify(A)} 를 ${K} 묶음으로`, () => {
    expect(parametricBinarySearch(A, K)).toBe(want);
  });
}

test("반환값은 후보 구간 안에서 판정이 참이 되는 가장 작은 값이다", () => {
  // 불변식 절이 세우는 성질 — 답에서는 참이고 답보다 1 작은 값에서는 거짓이다.
  // **후보 구간 안에서만** 그렇다. `m < max(A)` 에서는 탐욕 판정이 뜻을 잃는다 —
  // 어떤 묶음도 그 큰 값 하나를 담지 못하는데 참이 나올 수 있다(멈춤 절이 그 자리다).
  for (const [A, K] of CASES.map(([A, K]) => [A, K] as [number[], number])) {
    const answer = parametricBinarySearch(A, K);
    expect(feasible(A, K, answer)).toBe(true);
    if (answer > Math.max(...A)) {
      expect(feasible(A, K, answer - 1)).toBe(false);
    }
  }
});

test("K = 1 이면 전체 합, K = N 이면 최댓값이다", () => {
  const A = [3, 1, 4, 1, 5, 9, 2, 6];
  expect(parametricBinarySearch(A, 1)).toBe(A.reduce((a, b) => a + b, 0));
  expect(parametricBinarySearch(A, A.length)).toBe(Math.max(...A));
});

test("N = 100,000 입력에서도 반환값이 정확하다", () => {
  // 원본 테스트가 벽시계로 재던 자리. 같은 입력의 **값**을 고정해 판정한다.
  const N = 100_000;
  const A = new Array<number>(N);
  for (let i = 0; i < N; i++) A[i] = (i * 37) % 1_000_000;
  const answer = parametricBinarySearch(A, 100);
  expect(answer).toBe(471_963_500);
  expect(feasible(A, 100, answer)).toBe(true);
  expect(feasible(A, 100, answer - 1)).toBe(false);
});
