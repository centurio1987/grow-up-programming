/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/bit-manipulation/binaryGap/binaryGap.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 부분은 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입력**(1 부터 1,000,000 까지)은 아래에서 정의대로 센 값과 같은지로 남겼다.
 */
import { expect, test } from "bun:test";
import { binaryGap } from "./binaryGap-guide.ref.ts";

const CASES: [string, number, number][] = [
  // 기본 동작
  ["9 (1001) → 2", 9, 2],
  ["529 (1000010001) → 4", 529, 4],
  ["20 (10100) → 1", 20, 1],
  ["1041 (10000010001) → 5", 1041, 5],
  // 엣지
  ["15 (1111) → 0", 15, 0],
  ["32 (100000) → 0", 32, 0],
  ["1 (1) → 0", 1, 0],
  ["6 (110) → 0", 6, 0],
  ["2^30 + 1 → 29", 2 ** 30 + 1, 29],
  // 바운더리
  ["최댓값 2,147,483,647 → 0", 2_147_483_647, 0],
  // 가이드 전개 입력
  ["322 (101000010) → 4", 322, 4],
];

for (const [name, n, want] of CASES) {
  test(name, () => {
    expect(binaryGap(n)).toBe(want);
  });
}

/** 정의 그대로 — 이진 문자열을 1 로 잘라 양 끝 조각을 버리고 가장 긴 조각의 길이. */
function byDefinition(n: number): number {
  const pieces = n.toString(2).split("1");
  let best = 0;
  for (let k = 1; k < pieces.length - 1; k++) {
    best = Math.max(best, (pieces[k] as string).length);
  }
  return best;
}

test("성능 테스트의 입력(1 ~ 1,000,000) — 정본이 정의대로 센 값과 같다", () => {
  for (let n = 1; n <= 1_000_000; n++) {
    if (binaryGap(n) !== byDefinition(n)) {
      expect(binaryGap(n)).toBe(byDefinition(n));
    }
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./binaryGap-guide.sim.ts");
  const { simStepsFromRef, WALK } = await import("./binaryGap-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.scan.steps)).toEqual(plain(simStepsFromRef().scan));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.scan.result).toBe(String(binaryGap(WALK)));
});
