/**
 * 통계 판정 자기시험 — `probabilistic/bloomFilter` 의 확률 문장 판정(`../probabilistic/bloomFilter/bloomFilter.contract.ts` 의
 * `bloomFilterTrials`)을 fixture 에 돌린다. 러너는 `./runTrials.ts`, 한계는 `./judgeTrials.ts`.
 *
 * **축1 결정적 쪽 · 축3 · 확률의 출처 자기시험은 `./runContract.bloomFilter.test.ts` 에 그대로 있다.** 이 파일은 워커를 띄우는
 * 판정만 모았다 — CI 의 `trials` 모드가 이 이름(`runTrials.`)으로 고른다(`tools/ci.ts`). fixture 는 모듈 주소 + export 이름으로
 * 적는다(H3 — `fixtureTarget`).
 *
 * 모양은 용량 128 · ε 0.1(T 16 · k 11)과 용량 128 · ε 0.001(T 312 · k 7)이다. 보는 것은 셋이다.
 *
 * 1. **잡아야 할 것을 잡는다.** `AlwaysYesFilter`(늘 참)는 시행마다 몫이 1 이라 ε 0.1 에서 걸린다. `FixedWidthBloomFilter`(ε 를
 *    읽지 않음)는 ε 0.1 을 해상도 아래로 지나고 ε 0.001 에서 걸린다. `OverRateFilter`(참일 확률 min(0.5, 32ε) — **경계 밖 구현**)도
 *    ε 0.001 에서만 걸린다.
 * 2. **부당하게 떨어뜨리지 않는다.** `WholeRunRateFilter`(실행마다 동전 하나로 확률 ε 로 넣지 않은 원소 **전부**에 참 — 확률 문장은
 *    지킴)가 통과한다. 이 구현이 떨어질 확률은 P(Bin(16, 0.1) > 11) + P(Bin(312, 0.001) > 7) 로 [보장] 상한 합 3.83 × 10^−7 보다 작다.
 * 3. **해시를 고정한 구현은 통과한다 — 검사 못 하는 의무.** `FixedSeedBloomFilter` 는 계약을 어기는데(불변 사실 62) 판정을 통과한다.
 *
 * **[경험] 반복.** 수치(띄운 워커 수 · 합 S 의 범위 · 반복 수)는 `docs/ORD-006-conventions.md` 의 `S24` 절 「fixture 수치」 표.
 */

import { describe, expect, test } from "bun:test";
import {
  bloomFilterTrials,
  membershipInput,
} from "../probabilistic/bloomFilter/bloomFilter.contract";
import { exceededShapes, fixtureTarget, runTrials } from "./runTrials";

/** H3 — fixture 주소 등록. */
const FIXTURES = {
  alwaysYes: fixtureTarget("alwaysYesFilter", "AlwaysYesFilter"),
  fixedWidth: fixtureTarget("fixedWidthBloomFilter", "FixedWidthBloomFilter"),
  overRate: fixtureTarget("overRateFilter", "OverRateFilter"),
  wholeRun: fixtureTarget("wholeRunRateFilter", "WholeRunRateFilter"),
  fixedSeed: fixtureTarget("fixedSeedBloomFilter", "FixedSeedBloomFilter"),
} as const;

const LIGHT = "용량 128 · ε 0.1 · 넣지 않은 원소에 참";
const HEAVY = "용량 128 · ε 0.001 · 넣지 않은 원소에 참";

/** 워커 생존 감시에서 따라 나오는 시험 한도. 비용 판정이 아니다. */
const TIMEOUT = 1_800_000;

describe("BloomFilter 통계 판정 — 입력은 seed · 시행 번호 · 모양만으로 정해진다", () => {
  test("같은 세 값이면 같은 입력이고, 시행 번호가 다르면 다른 원소다", () => {
    const a = membershipInput(128, 1, 7, 1);
    expect(a).toEqual(membershipInput(128, 1, 7, 1));
    expect(a.added[0]).not.toBe(membershipInput(128, 1, 8, 1).added[0]);
    expect([a.added.length, a.absent.length]).toEqual([128, 64]);
  });
});

describe("BloomFilter 통계 판정 — 잡아야 할 구현을 잡는다", () => {
  test(
    "has 가 늘 참인 구현은 ε 0.1 에서 걸린다",
    async () => {
      const verdict = await runTrials(bloomFilterTrials, FIXTURES.alwaysYes);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toContain(LIGHT);
    },
    TIMEOUT,
  );

  test(
    "ε 를 읽지 않고 크기를 정하는 구현은 ε 0.001 에서만 걸린다",
    async () => {
      const verdict = await runTrials(bloomFilterTrials, FIXTURES.fixedWidth);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );

  test(
    "참일 확률이 min(0.5, 32ε) 인 경계 밖 구현은 ε 0.001 에서만 걸린다",
    async () => {
      const verdict = await runTrials(bloomFilterTrials, FIXTURES.overRate);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict)).toEqual([HEAVY]);
    },
    TIMEOUT,
  );
});

describe("BloomFilter 통계 판정 — 계약을 지키는 구현을 부당하게 떨어뜨리지 않는다", () => {
  test(
    "실행마다 동전 하나로 넣지 않은 원소 전부에 참을 내는 구현은 통과한다",
    async () => {
      const verdict = await runTrials(bloomFilterTrials, FIXTURES.wholeRun);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
      expect(verdict.workers).toBe(312);
    },
    TIMEOUT,
  );
});

describe("BloomFilter 통계 판정 — 검사 못 하는 의무", () => {
  test(
    "해시 상수를 고정한 구현은 계약을 어기는데 통과한다",
    async () => {
      const verdict = await runTrials(bloomFilterTrials, FIXTURES.fixedSeed);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
    },
    TIMEOUT,
  );
});
