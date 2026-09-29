/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/binary-search/binarySearch/binarySearch.test.ts` 는 학습자가 채우는
 * 파일을 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 성능 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 */
import { expect, test } from "bun:test";
import { binarySearch } from "./binarySearch-guide.ref.ts";

const CASES: [number[], number, number][] = [
  // 기본 동작
  [[1, 3, 5, 7, 9, 11], 7, 3],
  [[1, 3, 5, 7, 9, 11], 1, 0],
  [[1, 3, 5, 7, 9, 11], 11, 5],
  [[1, 3, 5, 7, 9, 11], 4, -1],
  [[1, 3, 5, 7, 9, 11], -10, -1],
  [[1, 3, 5, 7, 9, 11], 100, -1],
  // 엣지 케이스
  [[], 1, -1],
  [[42], 42, 0],
  [[42], 7, -1],
  [[-10, -5, 0, 5, 10], -5, 1],
  [[-10, -5, 0, 5, 10], 0, 2],
  // 바운더리
  [[1, 2], 1, 0],
  [[1, 2], 2, 1],
  [[1, 2], 3, -1],
  [[-2147483648, -1, 0, 1, 2147483647], -2147483648, 0],
  [[-2147483648, -1, 0, 1, 2147483647], 2147483647, 4],
];

for (const [A, target, want] of CASES) {
  test(`정본 — ${JSON.stringify(A)} 에서 ${target}`, () => {
    expect(binarySearch(A, target)).toBe(want);
  });
}

test("본문이 드는 최악 입력에서도 답은 정확하다", () => {
  // perf.worst 가 세는 입력. 비교가 많은 것과 답이 틀린 것은 다른 문제다.
  const A = [1, 3, 5, 7, 9, 11];
  expect(A.map((v) => binarySearch(A, v))).toEqual([0, 1, 2, 3, 4, 5]);
  expect(binarySearch(A, 12)).toBe(-1);
});

test("큰 배열에서도 인덱스가 정확하다", () => {
  // 성능이 아니라 정확성을 본다. N = 10^6 에서 비교는 20 번 이하다.
  const N = 1_000_000;
  const A = new Array<number>(N);
  for (let i = 0; i < N; i++) A[i] = i * 2;
  expect(binarySearch(A, 0)).toBe(0);
  expect(binarySearch(A, 999_998)).toBe(499_999);
  expect(binarySearch(A, 1_999_998)).toBe(N - 1);
  expect(binarySearch(A, 999_999)).toBe(-1);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./binarySearch-guide.sim.ts");
  const { simStepsFromRef } = await import("./binarySearch-guide.fig.tsx");
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.probe.steps)).toEqual(plain(want.probe));
  expect(plain(sim.miss.steps)).toEqual(plain(want.miss));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  const A = [1, 3, 5, 7, 9, 11];
  expect(sim.probe.result).toBe(String(binarySearch(A, 7)));
  expect(sim.miss.result).toBe(String(binarySearch(A, 4)));
});
