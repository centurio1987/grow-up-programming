/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/missingInteger/missingInteger.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는 케이스는 옮기지
 * 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의 **입출력**(N=100,000 에서 홀수 자리에
 * 음수를 둔 배열의 답)은 아래에 그대로 남겼다.
 */
import { expect, test } from "bun:test";
import { missingInteger } from "./missingInteger-guide.ref.ts";

const CASES: [string, number[], number][] = [
  // 기본 동작 — 문제 예시
  ["[1,3,6,4,1,2]", [1, 3, 6, 4, 1, 2], 5],
  ["[1,2,3]", [1, 2, 3], 4],
  ["[-1,-3]", [-1, -3], 1],
  // 1이 없는 경우
  ["[2,3,4]", [2, 3, 4], 1],
  // 중복 포함
  ["[1,1,1,1]", [1, 1, 1, 1], 2],
  ["[1,2,2,3,3]", [1, 2, 2, 3, 3], 4],
  // 음수·0 혼합
  ["[0,-1,1,2]", [0, -1, 1, 2], 3],
  ["[-1000000,1000000]", [-1_000_000, 1_000_000], 1],
  // 엣지 케이스 — N=1
  ["[1]", [1], 2],
  ["[2]", [2], 1],
  ["[-5]", [-5], 1],
];

for (const [name, A, want] of CASES) {
  test(`정본 — ${name} → ${want}`, () => {
    const copy = [...A];
    expect(missingInteger(copy)).toBe(want);
    // 입력을 바꾸지 않는다 — 본문의 「경쟁 설계와의 대조」가 기대는 성질이다.
    expect(copy).toEqual(A);
  });
}

test("정본 — 1~100,000 완전 집합 → 100,001", () => {
  const A = Array.from({ length: 100_000 }, (_, i) => i + 1);
  expect(missingInteger(A)).toBe(100_001);
});

test("정본 — N=100,000, 짝수 자리 i+1 · 홀수 자리 −(i+1) → 2", () => {
  const A = Array.from({ length: 100_000 }, (_, i) =>
    i % 2 === 0 ? i + 1 : -(i + 1),
  );
  // 양수는 1 · 3 · 5 … 뿐이라 2 가 빠진다.
  expect(missingInteger(A)).toBe(2);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./missingInteger-guide.sim.ts");
  const { simStepsFromRef, WALK, FULL } = await import(
    "./missingInteger-guide.fig.tsx"
  );
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  const want = simStepsFromRef();
  expect(plain(sim.markA.steps)).toEqual(plain(want.markA));
  expect(plain(sim.fullB.steps)).toEqual(plain(want.fullB));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.markA.result).toBe(String(missingInteger([...WALK])));
  expect(sim.fullB.result).toBe(String(missingInteger([...FULL])));
});
