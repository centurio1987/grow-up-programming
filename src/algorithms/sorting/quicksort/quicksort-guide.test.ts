/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/quicksort/quicksort.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 두 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 */
import { expect, test } from "bun:test";
import { quickSort } from "./quicksort-guide.ref.ts";

const CASES: [number[], number[]][] = [
  [
    [5, 2, 3, 1],
    [1, 2, 3, 5],
  ],
  [
    [5, 1, 1, 2, 0, 0],
    [0, 0, 1, 1, 2, 5],
  ],
  [[], []],
  [[1], [1]],
  [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
  ],
  [
    [5, 4, 3, 2, 1],
    [1, 2, 3, 4, 5],
  ],
  [
    [2, 2, 2, 2, 2],
    [2, 2, 2, 2, 2],
  ],
  [
    [-10, 5, -3, 0, 8, -1],
    [-10, -3, -1, 0, 5, 8],
  ],
];

for (const [input, want] of CASES) {
  test(`정본 — ${JSON.stringify(input)}`, () => {
    expect(quickSort([...input])).toEqual(want);
  });
}

test("본문이 인용한 최악 입력도 정렬은 정확하다", () => {
  // perf.worst 가 드는 입력 둘 — 만든 입력과 순열 전수에서 처음 만난 최악. 느린 것과 틀린 것은 다른 문제다.
  expect(quickSort([2, 6, 4, 0, 1, 3, 5, 7])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  expect(quickSort([0, 3, 5, 7, 1, 4, 2, 6])).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
});

test("입력 배열을 제자리에서 고치고 같은 배열을 돌려준다", () => {
  // 과제의 조건이다 — 새 배열을 잡지 않는다.
  const nums = [5, 2, 3, 1];
  const out = quickSort(nums);
  expect(out).toBe(nums);
  expect(nums).toEqual([1, 2, 3, 5]);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본과 걸음마다 대조한 기록에서 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면
 * 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./quicksort-guide.sim.ts");
  const { simStepsFromRef } = await import("./quicksort-guide.fig.tsx");
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.partition.steps)).toEqual(plain(want.partition));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.partition.result).toBe(`[${quickSort([5, 2, 3, 1]).join(", ")}]`);
});
