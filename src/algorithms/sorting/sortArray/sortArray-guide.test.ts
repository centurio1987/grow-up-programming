/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/sortArray/sortArray.test.ts` 는 학습자가 채우는 파일을
 * 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 성능 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 그 자리는 「큰 입력에서도 값이 정확한가」로 바꿔 둔다.
 */
import { expect, test } from "bun:test";
import { sortArray } from "./sortArray-guide.ref.ts";

const CASES: [number[], number[]][] = [
  // 기본 동작
  [
    [3, 1, 4, 1, 5, 9, 2, 6],
    [1, 1, 2, 3, 4, 5, 6, 9],
  ],
  [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  ],
  [
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
  ],
  // 엣지 케이스
  [
    [-3, 1, -4, 1, -5, 9, -2, 6],
    [-5, -4, -3, -2, 1, 1, 6, 9],
  ],
  [
    [2, 2, 2, 1, 1, 1, 3, 3],
    [1, 1, 1, 2, 2, 2, 3, 3],
  ],
  [
    [7, 7, 7, 7],
    [7, 7, 7, 7],
  ],
  // 바운더리
  [[42], [42]],
  [
    [1_000_000_000, -1_000_000_000, 0],
    [-1_000_000_000, 0, 1_000_000_000],
  ],
  // 문제 문서가 명시한 빈 입력. 원본 테스트에는 없지만 계약에 있다.
  [[], []],
];

for (const [input, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)}`, () => {
    expect(sortArray(input)).toEqual(want);
  });
}

test("입력 배열을 바꾸지 않고 다른 배열을 돌려준다", () => {
  // 문제의 계약이다 — 「반환 배열은 A 와 다른 새 배열이어야 한다」.
  const A = [5, 2, 4, 1, 2, 6];
  const before = [...A];
  const out = sortArray(A);
  expect(A).toEqual(before);
  expect(out).not.toBe(A);

  // 칸이 하나뿐일 때도 같다. 여기가 조용히 어긋나기 쉬운 자리다.
  const one = [42];
  expect(sortArray(one)).not.toBe(one);
});

test("전개가 쓰는 입력에서 본문이 적은 값이 나온다", () => {
  expect(sortArray([5, 2, 4, 1, 2, 6])).toEqual([1, 2, 2, 4, 5, 6]);
});

test("최악을 만드는 입력에서도 답은 정확하다", () => {
  // perf.worst 가 세는 입력. 비교가 많은 것과 답이 틀린 것은 다른 문제다.
  expect(sortArray([0, 4, 2, 6, 1, 5, 3, 7])).toEqual([
    0, 1, 2, 3, 4, 5, 6, 7,
  ]);
});

test("큰 입력에서도 값이 정확하다", () => {
  // 성능이 아니라 정확성을 본다. 벽시계는 실행마다 달라 판정에 쓰지 않는다.
  const N = 100_000;
  const A = new Array<number>(N);
  for (let i = 0; i < N; i++) A[i] = ((i * 37) % N) - 50_000;

  const out = sortArray(A);
  expect(out.length).toBe(N);
  for (let i = 1; i < N; i++) {
    expect(out[i] as number).toBeGreaterThanOrEqual(out[i - 1] as number);
  }
  // (37i mod N) 는 0 … N-1 의 재배열이므로 정렬 결과가 등차수열이다.
  expect(out[0]).toBe(-50_000);
  expect(out[N - 1]).toBe(49_999);
});
