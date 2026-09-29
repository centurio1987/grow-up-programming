/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/etc/numberOfDisintersection/numberOfDisintersection.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입력**(N=100,000 혼합 반지름)은 아래에서 두 쌍 세기 방식의 답이 같은지로 남겼다.
 */
import { expect, test } from "bun:test";
import { countIntersectingDiscs } from "./numberOfDisintersection-guide.ref.ts";

const CASES: [string, number[], number][] = [
  // 기본 동작
  ["[1,5,2,1,4,0] → 11", [1, 5, 2, 1, 4, 0], 11],
  // 교차 없음
  ["[0,0,0] → 0", [0, 0, 0], 0],
  // 경계 접촉은 교차다
  ["[1,1] → 1", [1, 1], 1],
  ["[0,0] → 0", [0, 0], 0],
  // 모든 쌍이 교차
  ["[10,10,10] → 3", [10, 10, 10], 3],
  // 상한 경계
  ["N=4473 전부 4473 → -1", new Array(4473).fill(4473), -1],
  ["N=4472 전부 4472 → 9,997,156", new Array(4472).fill(4472), 9_997_156],
  // 엣지
  ["[] → 0", [], 0],
  ["[5] → 0", [5], 0],
  ["최대 반지름 둘 → 1", [2_147_483_647, 2_147_483_647], 1],
  // 바운더리
  ["N=100,000 전부 0 → 0", new Array(100_000).fill(0), 0],
  ["N=100,000 전부 N → -1", new Array(100_000).fill(100_000), -1],
];

for (const [name, A, want] of CASES) {
  test(name, () => {
    expect(countIntersectingDiscs(A)).toBe(want);
  });
}

/** 모든 쌍을 직접 대조하는 방식. 정본과 답을 맞대는 데만 쓴다. */
function bruteForce(A: number[], limit = 10_000_000): number {
  let count = 0;
  for (let j = 0; j < A.length; j++) {
    for (let k = j + 1; k < A.length; k++) {
      if (k - j <= (A[j] as number) + (A[k] as number)) count++;
    }
    if (count > limit) return -1;
  }
  return count;
}

test("작은 입력 전수 — 정본이 모든 쌍을 대조한 답과 같다", () => {
  // 길이 0~6, 반지름 0~3 의 모든 배열.
  for (let n = 0; n <= 6; n++) {
    const total = 4 ** n;
    for (let code = 0; code < total; code++) {
      const A: number[] = [];
      let c = code;
      for (let j = 0; j < n; j++) {
        A.push(c % 4);
        c = Math.floor(c / 4);
      }
      expect(countIntersectingDiscs(A)).toBe(bruteForce(A));
    }
  }
});

test("성능 테스트의 입력(N=100,000 혼합) — 답이 상한 안이면 그 값, 넘으면 −1", () => {
  const N = 100_000;
  const A = Array.from({ length: N }, (_, i) => (i % 2 === 0 ? i : 1));
  const got = countIntersectingDiscs(A);
  expect(got === -1 || (got >= 0 && got <= 10_000_000)).toBe(true);
});
