/**
 * 통계 판정 자기시험 — `probabilistic/countMinSketch` 의 확률 문장 판정(`../probabilistic/countMinSketch/countMinSketch.contract.ts`
 * 의 `countMinSketchTrials`)을 fixture 에 돌린다. 러너는 `./runTrials.ts`, 한계는 `./judgeTrials.ts`.
 *
 * **축1 결정적 쪽 · 축3 자기시험은 `./runContract.countMinSketch.test.ts` 에 그대로 있다.** 이 파일은 워커를 띄우는 판정만 모았다 —
 * CI 의 `trials` 모드가 이 이름(`runTrials.`)으로 고른다(`tools/ci.ts`). fixture 는 모듈 주소 + export 이름으로 적는다(H3).
 *
 * 모양은 (ε, δ) = (0.1, 0.1)(T 16 · k 11)과 (0.1, 0.01)(T 320 · k 17)이다. 보는 것은 둘이다.
 *
 * 1. **잡아야 할 것을 잡는다.** `TotalSumSketch`(어느 원소든 총증분)는 시행마다 몫이 1 이라 (0.1, 0.1) 에서 걸린다.
 *    `SingleRowSketch`(줄 하나 — δ 를 읽지 않음)는 (0.1, 0.1) 을 해상도 아래로 지나고 (0.1, 0.01) 에서 걸린다.
 *    `OverRateOvercountSketch`(한계를 넘을 확률 min(0.5, 8δ) — **경계 밖 구현**)도 (0.1, 0.01) 에서만 걸린다.
 * 2. **부당하게 떨어뜨리지 않는다.** `WholeRunOvercountSketch`(실행마다 동전 하나로 확률 δ 로 **모든** 원소의 추정이 한계를 넘음 —
 *    확률 문장은 지킴)가 통과한다. 이 구현이 떨어질 확률은 P(Bin(16, 0.1) > 11) + P(Bin(320, 0.01) > 17) 로 [보장] 상한 합
 *    4.62 × 10^−7 보다 작다.
 *
 * 해시를 고정한 구현은 이 계약에서 따로 돌리지 않았다 — `probabilistic/bloomFilter` · `probabilistic/hyperLogLog` 의 자기시험이 보인
 * 모양(뽑을 무작위가 없어 입력만 달라지고 통과한다)과 같다. **[경험] 반복** 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 */

import { describe, expect, test } from "bun:test";
import {
  countMinSketchTrials,
  frequencyInput,
} from "../probabilistic/countMinSketch/countMinSketch.contract";
import { exceededShapes, fixtureTarget, runTrials } from "./runTrials";

/** H3 — fixture 주소 등록. */
const FIXTURES = {
  totalSum: fixtureTarget("totalSumSketch", "TotalSumSketch"),
  singleRow: fixtureTarget("singleRowSketch", "SingleRowSketch"),
  overRate: fixtureTarget("overRateOvercountSketch", "OverRateOvercountSketch"),
  wholeRun: fixtureTarget("wholeRunOvercountSketch", "WholeRunOvercountSketch"),
} as const;

const LIGHT = "(ε, δ) = (0.1, 0.1) · 추정이 ε·N 을 넘음";
const HEAVY = "(ε, δ) = (0.1, 0.01) · 추정이 ε·N 을 넘음";

/** 워커 생존 감시에서 따라 나오는 시험 한도. 비용 판정이 아니다. */
const TIMEOUT = 1_800_000;

describe("CountMinSketch 통계 판정 — 입력은 seed · 시행 번호 · 모양만으로 정해진다", () => {
  test("같은 세 값이면 같은 입력이고, 시행 번호가 다르면 다른 원소다", () => {
    const a = frequencyInput(0.1, 1, 5, 1);
    expect(a).toEqual(frequencyInput(0.1, 1, 5, 1));
    expect(a.absent[0]).not.toBe(frequencyInput(0.1, 1, 6, 1).absent[0]);
    // 무거운 원소 3 개 × 두 번 + 가벼운 원소 20 개, 총증분 44.
    expect(a.updates).toHaveLength(26);
    expect(a.updates.reduce((sum, [, count]) => sum + count, 0)).toBe(44);
  });
});

describe("CountMinSketch 통계 판정 — 잡아야 할 구현을 잡는다", () => {
  test(
    "증분 전체의 합을 돌려주는 구현은 (0.1, 0.1) 에서 걸린다",
    async () => {
      const verdict = await runTrials(countMinSketchTrials, FIXTURES.totalSum);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toContain(LIGHT);
    },
    TIMEOUT,
  );

  test(
    "줄을 하나만 두는 구현은 (0.1, 0.01) 에서만 걸린다",
    async () => {
      const verdict = await runTrials(countMinSketchTrials, FIXTURES.singleRow);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );

  test(
    "한계를 넘을 확률이 min(0.5, 8δ) 인 경계 밖 구현은 (0.1, 0.01) 에서만 걸린다",
    async () => {
      const verdict = await runTrials(countMinSketchTrials, FIXTURES.overRate);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );
});

describe("CountMinSketch 통계 판정 — 계약을 지키는 구현을 부당하게 떨어뜨리지 않는다", () => {
  test(
    "실행마다 동전 하나로 모든 원소의 추정이 한계를 넘는 구현은 통과한다",
    async () => {
      const verdict = await runTrials(countMinSketchTrials, FIXTURES.wholeRun);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
      expect(verdict.workers).toBe(320);
    },
    TIMEOUT,
  );
});
