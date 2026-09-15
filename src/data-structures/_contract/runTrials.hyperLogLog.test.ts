/**
 * 통계 판정 자기시험 — `probabilistic/hyperLogLog` 의 확률 문장 판정(`../probabilistic/hyperLogLog/hyperLogLog.contract.ts` 의
 * `hyperLogLogTrials`)을 fixture 에 돌린다. 러너는 `./runTrials.ts`, 한계는 `./judgeTrials.ts`.
 *
 * **축1 결정적 쪽 · 축3 자기시험은 `./runContract.hyperLogLog.test.ts` 에 그대로 있다.** 이 파일은 워커를 띄우는 판정만 모았다 —
 * CI 의 `trials` 모드가 이 이름(`runTrials.`)으로 고른다(`tools/ci.ts`).
 *
 * **fixture 주소 등록(원칙 B 하네스 변경 명세 H3).** 팩토리 함수는 워커 경계를 못 넘으므로 fixture 를 모듈 주소 + export 이름으로
 * 적는다 — 아래 `FIXTURES`.
 *
 * 보는 것은 셋이다. 모양 이름은 (ε, δ) 이고 한계는 (0.3, 0.3) T 16 · k 15, (0.1, 0.1) T 56 · k 21 이다.
 *
 * 1. **잡아야 할 것을 잡는다.** `ZeroSketch`(늘 0)는 시행마다 네 추정이 전부 벗어나 먼저 차는 (0.3, 0.3) 에서 걸린다.
 *    `CallCountSketch`(넣은 호출 수)는 무작위가 없어 합이 늘 같다 — (0.3, 0.3) 은 원소가 하나인 인스턴스만 맞아 14.5(한계 15 아래),
 *    (0.1, 0.1) 에서 걸린다. `FixedPrecisionSketch`(늘 자리 16 개)는 (0.3, 0.3) 을 해상도 아래로 지나고 (0.1, 0.1) 에서 걸린다.
 *    `OverRateErrorSketch`(벗어날 확률 min(0.5, 6δ) — **경계 밖 구현**)도 (0.1, 0.1) 에서만 걸린다.
 * 2. **부당하게 떨어뜨리지 않는다.** `WholeRunErrorSketch`(실행마다 동전 하나로 확률 δ 로 **모든** 추정을 함께 틀림 — 확률 문장은
 *    지킴)가 통과한다. 이 구현이 떨어질 확률은 P(Bin(16, 0.3) > 15) + P(Bin(56, 0.1) > 21) 로 [보장] 상한 합 7.31 × 10^−7 보다 작다.
 * 3. **해시를 고정한 구현은 통과한다 — 검사 못 하는 의무.** `FixedHashSketch` 는 계약을 어기는데(헤더 「확률의 출처」) 뽑을 무작위가
 *    없어 시행끼리 달라지는 것이 입력뿐이고, 판정은 정본과 같은 모양으로 통과한다.
 *
 * **[경험] 반복.** 수치(띄운 워커 수 · 합 S 의 범위 · 반복 수)는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」 표에
 * 적었다. 떨어지는 fixture 는 한계를 넘는 즉시 새 워커를 띄우지 않으므로 워커 수가 T 보다 작다.
 */

import { describe, expect, test } from "bun:test";
import {
  cardinalityInput,
  hyperLogLogTrials,
} from "../probabilistic/hyperLogLog/hyperLogLog.contract";
import { exceededShapes, fixtureTarget, runTrials } from "./runTrials";

/** H3 — fixture 주소 등록. */
const FIXTURES = {
  zero: fixtureTarget("zeroSketch", "ZeroSketch"),
  callCount: fixtureTarget("callCountSketch", "CallCountSketch"),
  fixedPrecision: fixtureTarget("fixedPrecisionSketch", "FixedPrecisionSketch"),
  overRate: fixtureTarget("overRateErrorSketch", "OverRateErrorSketch"),
  wholeRun: fixtureTarget("wholeRunErrorSketch", "WholeRunErrorSketch"),
  fixedHash: fixtureTarget("fixedHashSketch", "FixedHashSketch"),
} as const;

const LIGHT = "(ε, δ) = (0.3, 0.3) · 추정이 ε·n 넘게 벗어남";
const HEAVY = "(ε, δ) = (0.1, 0.1) · 추정이 ε·n 넘게 벗어남";

/** 워커 생존 감시에서 따라 나오는 시험 한도. 비용 판정이 아니다. */
const TIMEOUT = 900_000;

describe("HyperLogLog 통계 판정 — 입력은 seed · 시행 번호 · 모양만으로 정해진다", () => {
  test("같은 세 값이면 같은 입력이고, 시행 번호가 다르면 다른 원소다", () => {
    const a = cardinalityInput(0.1, 0.1, 1, 3, 1);
    const b = cardinalityInput(0.1, 0.1, 1, 3, 1);
    const c = cardinalityInput(0.1, 0.1, 1, 4, 1);
    expect(a).toEqual(b);
    expect(a.instances[0]?.items[0]).not.toBe(c.instances[0]?.items[0]);
    expect(a.instances).toHaveLength(4);
  });
});

describe("HyperLogLog 통계 판정 — 잡아야 할 구현을 잡는다", () => {
  test(
    "추정이 늘 0 인 구현은 (0.3, 0.3) 에서 걸린다",
    async () => {
      const verdict = await runTrials(hyperLogLogTrials, FIXTURES.zero);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toContain(LIGHT);
    },
    TIMEOUT,
  );

  test(
    "넣은 호출 수를 세는 구현은 (0.1, 0.1) 에서만 걸린다 — (0.3, 0.3) 은 원소가 하나인 인스턴스만 맞아 합이 14.5 로 한계 15 아래다",
    async () => {
      const verdict = await runTrials(hyperLogLogTrials, FIXTURES.callCount);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );

  test(
    "자리 수를 고정한 구현은 (0.1, 0.1) 에서만 걸린다",
    async () => {
      const verdict = await runTrials(
        hyperLogLogTrials,
        FIXTURES.fixedPrecision,
      );
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );

  test(
    "벗어날 확률이 min(0.5, 6δ) 인 경계 밖 구현은 (0.1, 0.1) 에서만 걸린다",
    async () => {
      const verdict = await runTrials(hyperLogLogTrials, FIXTURES.overRate);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );
});

describe("HyperLogLog 통계 판정 — 계약을 지키는 구현을 부당하게 떨어뜨리지 않는다", () => {
  test(
    "실행마다 동전 하나로 모든 추정을 함께 틀리는 구현은 통과한다",
    async () => {
      const verdict = await runTrials(hyperLogLogTrials, FIXTURES.wholeRun);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
      expect(verdict.workers).toBe(56);
    },
    TIMEOUT,
  );
});

describe("HyperLogLog 통계 판정 — 검사 못 하는 의무", () => {
  test(
    "해시 상수를 고정한 구현은 계약을 어기는데 통과한다",
    async () => {
      const verdict = await runTrials(hyperLogLogTrials, FIXTURES.fixedHash);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
    },
    TIMEOUT,
  );
});
