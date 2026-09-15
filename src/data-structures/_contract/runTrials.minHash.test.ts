/**
 * 통계 판정 자기시험 — `probabilistic/minHash` 의 확률 문장 판정(`../probabilistic/minHash/minHash.contract.ts` 의 `minHashTrials`)을
 * fixture 에 돌린다. 러너는 `./runTrials.ts`, 한계는 `./judgeTrials.ts`.
 *
 * **축1 결정적 쪽 · 축3 자기시험은 `./runContract.minHash.test.ts` 에 그대로 있다.** 이 파일은 워커를 띄우는 판정만 모았다 — CI 의
 * `trials` 모드가 이 이름(`runTrials.`)으로 고른다(`tools/ci.ts`). fixture 는 모듈 주소 + export 이름으로 적는다(H3).
 *
 * 모양은 (ε, δ) = (0.1, 0.1)(T 24 · k 13)과 (0.1, 0.05)(T 96 · k 20)이다. 보는 것은 둘이다.
 *
 * 1. **잡아야 할 것을 잡는다.** `AlwaysOneSimilarity`(늘 1)는 참 닮음이 0.9 아래인 짝마다 벗어나 걸린다. `FixedSizeMinHash`(늘 서명
 *    칸 8 개)는 (0.1, 0.1) 을 해상도 아래로 지나고 (0.1, 0.05) 에서 걸린다. `OverRateErrorSimilarity`(벗어날 확률 min(0.3, 8δ) —
 *    **경계 밖 구현**)도 (0.1, 0.05) 에서만 걸린다.
 * 2. **부당하게 떨어뜨리지 않는다.** `WholeRunErrorSimilarity`(실행마다 동전 하나로 확률 δ 로 **모든** 짝을 함께 틀림 — 확률 문장은
 *    지킴)가 통과한다. 이 구현이 떨어질 확률은 P(Bin(24, 0.1) > 13) + P(Bin(96, 0.05) > 20) 이하로 [보장] 상한 합 9.03 × 10^−7 보다 작다.
 *
 * 해시를 고정한 구현은 이 계약에서 따로 돌리지 않았다 — `probabilistic/hyperLogLog` 자기시험이 보인 모양과 같다. **[경험] 반복** 수치는
 * `docs/ORD-006-conventions.md` 의 `S24` 절.
 */

import { describe, expect, test } from "bun:test";
import {
  minHashTrials,
  similarityInput,
} from "../probabilistic/minHash/minHash.contract";
import { exceededShapes, fixtureTarget, runTrials } from "./runTrials";

/** H3 — fixture 주소 등록. */
const FIXTURES = {
  alwaysOne: fixtureTarget("alwaysOneSimilarity", "AlwaysOneSimilarity"),
  fixedSize: fixtureTarget("fixedSizeMinHash", "FixedSizeMinHash"),
  overRate: fixtureTarget("overRateErrorSimilarity", "OverRateErrorSimilarity"),
  wholeRun: fixtureTarget("wholeRunErrorSimilarity", "WholeRunErrorSimilarity"),
} as const;

const HEAVY = "(ε, δ) = (0.1, 0.05) · 닮음이 ε 넘게 벗어남";

/** 워커 생존 감시에서 따라 나오는 시험 한도. 비용 판정이 아니다. */
const TIMEOUT = 1_800_000;

describe("MinHash 통계 판정 — 입력은 seed · 시행 번호 · 모양만으로 정해진다", () => {
  test("같은 세 값이면 같은 입력이고, 두 쪽의 서로 다른 원소 수가 교집합 · 합집합과 맞는다", () => {
    const a = similarityInput(0.1, 0.05, 1, 2, 1);
    expect(a).toEqual(similarityInput(0.1, 0.05, 1, 2, 1));
    for (const { mine, other, union, common } of a.pairs) {
      const left = new Set(mine);
      const right = new Set(other);
      const shared = [...left].filter((item) => right.has(item)).length;
      expect([shared, new Set([...left, ...right]).size]).toEqual([
        common,
        union,
      ]);
    }
  });
});

describe("MinHash 통계 판정 — 잡아야 할 구현을 잡는다", () => {
  test(
    "닮음이 늘 1 인 구현은 걸린다",
    async () => {
      const verdict = await runTrials(minHashTrials, FIXTURES.alwaysOne);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict).length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );

  test(
    "서명 칸 수를 고정한 구현은 (0.1, 0.05) 에서만 걸린다",
    async () => {
      const verdict = await runTrials(minHashTrials, FIXTURES.fixedSize);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );

  test(
    "벗어날 확률이 min(0.3, 8δ) 인 경계 밖 구현은 (0.1, 0.05) 에서만 걸린다",
    async () => {
      const verdict = await runTrials(minHashTrials, FIXTURES.overRate);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );
});

describe("MinHash 통계 판정 — 계약을 지키는 구현을 부당하게 떨어뜨리지 않는다", () => {
  test(
    "실행마다 동전 하나로 모든 짝을 함께 틀리는 구현은 통과한다",
    async () => {
      const verdict = await runTrials(minHashTrials, FIXTURES.wholeRun);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
      expect(verdict.workers).toBe(96);
    },
    TIMEOUT,
  );
});
