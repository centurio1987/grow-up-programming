/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/countingSort/countingSort.test.ts` 는 학습자가 채우는
 * 파일을 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 성능 케이스(`N=100,000` 을 100ms 이내)는 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 자리는 「제약 상한 크기의 입력에서 값이 정확하고 다중집합이
 * 보존되는가」로 바꿔 두었고, 입력도 난수 대신 생성식으로 만든다.
 */
import { expect, test } from "bun:test";
import { countingSort } from "./countingSort-guide.ref.ts";

const CASES: [number[], number[]][] = [
  // 기본 동작
  [
    [4, 2, 2, 8, 3, 3, 1],
    [1, 2, 2, 3, 3, 4, 8],
  ],
  [
    [0, 1, 2, 3, 4, 5],
    [0, 1, 2, 3, 4, 5],
  ],
  [
    [5, 4, 3, 2, 1, 0],
    [0, 1, 2, 3, 4, 5],
  ],
  // 엣지 케이스
  [
    [3, 3, 3, 1, 1, 2],
    [1, 1, 2, 3, 3, 3],
  ],
  [
    [7, 7, 7],
    [7, 7, 7],
  ],
  [
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ],
  // 바운더리
  [[5], [5]],
  [
    [1000, 0, 500, 1000, 0],
    [0, 0, 500, 1000, 1000],
  ],
  // 문제 문서가 명시한 빈 입력. 원본 테스트에는 없지만 계약에 있다.
  [[], []],
  // 전개가 쓰는 입력.
  [
    [3, 1, 3, 0, 5, 1, 3],
    [0, 1, 1, 3, 3, 3, 5],
  ],
];

for (const [input, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)}`, () => {
    expect(countingSort(input)).toEqual(want);
  });
}

test("입력 배열을 바꾸지 않고 다른 배열을 돌려준다", () => {
  // 문제의 계약이다 — 「`A` 의 모든 원소를 오름차순으로 정렬한 새 배열」을 반환한다.
  const A = [3, 1, 3, 0, 5, 1, 3];
  const before = [...A];
  const out = countingSort(A);
  expect(A).toEqual(before);
  expect(out).not.toBe(A);

  // 칸이 하나뿐일 때도 같다.
  const one = [5];
  expect(countingSort(one)).not.toBe(one);
});

test("키 값 공간의 양 끝을 모두 담는다", () => {
  // 값 1000 이 자기 자리를 가져야 한다. `count` 를 1000 칸으로 잡으면 여기서 걸린다.
  const A = [1000, 0, 1000, 0, 1000];
  expect(countingSort(A)).toEqual([0, 0, 1000, 1000, 1000]);
});

test("제약 상한 크기의 입력에서도 값이 정확하다", () => {
  // 성능이 아니라 정확성을 본다. 벽시계는 실행마다 달라 판정에 쓰지 않고, 입력도 난수 대신
  // 생성식으로 만들어 실행마다 같은 배열이 되게 한다.
  const N = 100_000;
  const A = Array.from({ length: N }, (_, t) => (t * 37) % 1001);

  const out = countingSort(A);
  expect(out.length).toBe(N);
  for (let t = 1; t < N; t++) {
    expect(out[t] as number).toBeGreaterThanOrEqual(out[t - 1] as number);
  }

  // 다중집합이 보존되는가 — 값마다의 개수가 입력과 같아야 한다.
  const before = new Array<number>(1001).fill(0);
  const after = new Array<number>(1001).fill(0);
  for (const v of A) before[v] = (before[v] as number) + 1;
  for (const v of out) after[v] = (after[v] as number) + 1;
  expect(after).toEqual(before);
});
