/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/binary-search/searchInRotatedSortedArray/searchInRotatedSortedArray.test.ts`
 * 는 학습자가 채우는 파일을 가져오므로 그대로 재사용하지 않는다. **케이스만** 옮겨 정본에
 * 다시 건다. 벽시계를 재는 성능 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 *
 * **원본의 기대값 하나가 사실과 달라 옮기면서 고쳤다.** `[7 1 2 3 4 5 6]` 에서 5 는 인덱스
 * 5 에 있는데 원본은 4 를 기대한다(`searchInRotatedSortedArray.test.ts` 의
 * 「두 번째 위치에서 회전된 배열」). 스텁이 늘 던지는 상태라 아무도 그 줄을 실행해 본 적이 없다.
 */
import { expect, test } from "bun:test";
import { searchInRotatedSortedArray } from "./searchInRotatedSortedArray-guide.ref.ts";

const ROTATED = [4, 5, 6, 7, 0, 1, 2];

const CASES: [number[], number, number][] = [
  // 기본 동작 — 회전된 배열에서 탐색
  [ROTATED, 0, 4],
  [ROTATED, 3, -1],
  [ROTATED, 4, 0],
  [ROTATED, 2, 6],
  [ROTATED, 7, 3],
  // 회전되지 않은 정렬 배열
  [[1, 2, 3, 4, 5], 3, 2],
  [[1, 2, 3, 4, 5], 6, -1],
  // 엣지 케이스
  [[1], 1, 0],
  [[1], 0, -1],
  [[3, 1], 3, 0],
  [[3, 1], 1, 1],
  // 음수가 섞인 회전 배열 — 정렬은 [-5 -3 -1 2 4 6] 이다
  [[2, 4, 6, -5, -3, -1], -3, 4],
  [[2, 4, 6, -5, -3, -1], 6, 2],
  // 끊긴 자리의 앞뒤
  [ROTATED, 7, 3],
  [ROTATED, 0, 4],
  // 거의 끝에서 회전된 배열
  [[2, 3, 4, 5, 6, 7, 1], 1, 6],
  [[2, 3, 4, 5, 6, 7, 1], 2, 0],
  // 두 번째 자리에서 회전된 배열
  [[7, 1, 2, 3, 4, 5, 6], 7, 0],
  [[7, 1, 2, 3, 4, 5, 6], 5, 5],
];

for (const [A, target, want] of CASES) {
  test(`정본 — ${JSON.stringify(A)} 에서 ${target}`, () => {
    expect(searchInRotatedSortedArray(A, target)).toBe(want);
  });
}

test("모든 회전과 모든 target 에서 답이 맞는다", () => {
  // 길이 1~9 는 전수로 확인할 수 있다. 값 사이에 빈틈을 두어 없는 값도 함께 넣는다.
  for (let n = 1; n <= 9; n++) {
    const S = Array.from({ length: n }, (_, i) => i * 2);
    for (let k = 0; k < n; k++) {
      const A = [...S.slice(k), ...S.slice(0, k)];
      for (let target = -1; target <= 2 * n; target++) {
        expect(searchInRotatedSortedArray(A, target)).toBe(A.indexOf(target));
      }
    }
  }
});

test("본문 전개가 쓰는 스물한 칸에서 답과 자취가 맞는다", () => {
  const S = Array.from({ length: 21 }, (_, i) => i);
  const A = [...S.slice(17), ...S.slice(0, 17)];
  expect(A).toEqual([
    17, 18, 19, 20, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  ]);
  expect(searchInRotatedSortedArray(A, 2)).toBe(6);
  expect(searchInRotatedSortedArray(A, 17)).toBe(0);
  expect(searchInRotatedSortedArray(A, 16)).toBe(20);
  expect(searchInRotatedSortedArray(A, 21)).toBe(-1);
});

test("큰 배열에서도 인덱스가 정확하다", () => {
  // 성능이 아니라 정확성을 본다. N = 10^6 에서 반복은 20 바퀴를 넘지 않는다.
  const N = 1_000_000;
  const pivot = N / 2;
  const A = new Array<number>(N);
  for (let i = 0; i < N; i++) A[i] = (i + pivot) % N;
  expect(searchInRotatedSortedArray(A, 0)).toBe(pivot);
  expect(searchInRotatedSortedArray(A, pivot)).toBe(0);
  expect(searchInRotatedSortedArray(A, N - 1)).toBe(pivot - 1);
  expect(searchInRotatedSortedArray(A, N)).toBe(-1);
  expect(searchInRotatedSortedArray(A, -1)).toBe(-1);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./searchInRotatedSortedArray-guide.sim.ts");
  const { simStepsFromRef, WALK, HIT, MISS } = await import(
    "./searchInRotatedSortedArray-guide.fig.tsx"
  );
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.descent.steps)).toEqual(plain(want.descent));
  expect(plain(sim.miss.steps)).toEqual(plain(want.miss));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.descent.result).toBe(
    String(searchInRotatedSortedArray([...WALK], HIT)),
  );
  expect(sim.miss.result).toBe(
    String(searchInRotatedSortedArray([...WALK], MISS)),
  );
});
