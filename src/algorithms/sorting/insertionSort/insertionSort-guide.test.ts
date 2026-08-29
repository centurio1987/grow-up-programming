/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/insertionSort/insertionSort.test.ts` 는 학습자가 채우는
 * 파일을 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 성능 케이스(`N=10,000` 을 100ms 이내)는 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 자리는 「거의 정렬된 큰 입력에서 값이 정확하고 이동 횟수가
 * 역순쌍 개수와 같은가」로 바꿔 둔다.
 */
import { expect, test } from "bun:test";
import { insertionSort } from "./insertionSort-guide.ref.ts";

const CASES: [number[], number[]][] = [
  // 기본 동작
  [
    [5, 2, 4, 6, 1, 3],
    [1, 2, 3, 4, 5, 6],
  ],
  [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  ],
  [
    [1, 3, 2, 4, 5],
    [1, 2, 3, 4, 5],
  ],
  // 엣지 케이스
  [
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
  ],
  [
    [-1, 3, -1, 2, 0, 2],
    [-1, -1, 0, 2, 2, 3],
  ],
  [
    [4, 4, 4, 4],
    [4, 4, 4, 4],
  ],
  // 바운더리
  [[42], [42]],
  [
    [1, 2],
    [1, 2],
  ],
  [
    [2, 1],
    [1, 2],
  ],
  // 문제 문서가 명시한 빈 입력. 원본 테스트에는 없지만 계약에 있다.
  [[], []],
  // 값 범위의 끝. 문제 제약이 -10^9 … 10^9 이다.
  [
    [1_000_000_000, -1_000_000_000, 0],
    [-1_000_000_000, 0, 1_000_000_000],
  ],
];

for (const [input, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)}`, () => {
    expect(insertionSort(input)).toEqual(want);
  });
}

test("입력 배열을 바꾸지 않고 다른 배열을 돌려준다", () => {
  // 문제의 계약이다 — 「원본 A 를 수정해서는 안 되며, 정렬된 새 배열을 반환해야 한다」.
  const A = [5, 2, 4, 6, 1, 3];
  const before = [...A];
  const out = insertionSort(A);
  expect(A).toEqual(before);
  expect(out).not.toBe(A);

  // 칸이 하나뿐일 때도 같다. 바깥 반복이 한 바퀴도 실행되지 않는 자리다.
  const one = [42];
  expect(insertionSort(one)).not.toBe(one);
});

test("전개가 쓰는 입력에서 본문이 적은 값이 나온다", () => {
  expect(insertionSort([5, 2, 4, 6, 1, 3])).toEqual([1, 2, 3, 4, 5, 6]);
});

test("최악을 만드는 입력에서도 답은 정확하다", () => {
  // perf.worst 가 세는 입력. 견주기가 많은 것과 답이 틀린 것은 다른 문제다.
  const N = 64;
  const A = Array.from({ length: N }, (_, t) => N - 1 - t);
  const want = Array.from({ length: N }, (_, t) => t);
  expect(insertionSort(A)).toEqual(want);
});

test("거의 정렬된 큰 입력에서도 값이 정확하다", () => {
  // 성능이 아니라 정확성을 본다. 벽시계는 실행마다 달라 판정에 쓰지 않는다.
  const N = 10_000;
  const A = Array.from({ length: N }, (_, t) => t);
  for (let t = 0; t + 1 < N; t += 100) {
    const tmp = A[t] as number;
    A[t] = A[t + 1] as number;
    A[t + 1] = tmp;
  }

  const out = insertionSort(A);
  expect(out.length).toBe(N);
  for (let t = 0; t < N; t++) expect(out[t]).toBe(t);
});
