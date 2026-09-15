/**
 * 통계 판정 자기시험 — `probabilistic/cuckooFilter` 의 확률 문장 판정(`../probabilistic/cuckooFilter/cuckooFilter.contract.ts` 의
 * `cuckooFilterTrials`)을 fixture 에 돌린다. 러너는 `./runTrials.ts`, 한계는 `./judgeTrials.ts`.
 *
 * **축1 결정적 쪽 · 축3 · 반례의 자리 자기시험은 `./runContract.cuckooFilter.test.ts` 에 그대로 있다.** 이 파일은 워커를 띄우는 판정만
 * 모았다 — CI 의 `trials` 모드가 이 이름(`runTrials.`)으로 고른다(`tools/ci.ts`). fixture 는 모듈 주소 + export 이름으로 적는다(H3).
 *
 * 모양은 용량 128 · ε 0.1(T 16 · k 11)과 용량 128 · ε 0.01(T 16 · k 6)이고 모양마다 판정 셋이다. 보는 것은 셋이다.
 *
 * 1. **잡아야 할 것을 잡는다.** `AlwaysYesCuckooFilter`(늘 참) · `PretendDeletingBloomFilter`(지우는 척)는 몫이 1 인 판정이 있어
 *    걸리고, `ClearingBloomFilter`(비트를 끈다)는 결정적 위반으로 걸린다. `OverRateCuckooFilter`(참일 확률 min(0.5, 48ε) — **경계 밖
 *    구현**)는 ε 0.01 의 판정 셋에서만 걸린다.
 * 2. **부당하게 떨어뜨리지 않는다.** `WholeRunRateCuckooFilter`(실행마다 동전 하나로 확률 ε 로 사본 없는 원소의 `has` · `delete` 를 **전부**
 *    참 — 확률 문장 둘은 지킴)가 통과한다.
 * 3. **자명한 구현은 두 계약의 통계 판정을 통과한다.** `CountingBloomFilter` 가 이 계약과 `probabilistic/bloomFilter` 의 통계 판정을
 *    둘 다 통과한다(불변 사실 54 의 셋째 줄 — 블룸 필터 쪽은 워커 312 개).
 *
 * **[경험] 반복** 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 */

import { describe, expect, test } from "bun:test";
import { bloomFilterTrials } from "../probabilistic/bloomFilter/bloomFilter.contract";
import {
  cuckooFilterTrials,
  cuckooInput,
} from "../probabilistic/cuckooFilter/cuckooFilter.contract";
import { exceededShapes, fixtureTarget, runTrials } from "./runTrials";

/** H3 — fixture 주소 등록. */
const FIXTURES = {
  alwaysYes: fixtureTarget("alwaysYesCuckooFilter", "AlwaysYesCuckooFilter"),
  pretend: fixtureTarget(
    "nonDeletingBloomFilter",
    "PretendDeletingBloomFilter",
  ),
  clearing: fixtureTarget("nonDeletingBloomFilter", "ClearingBloomFilter"),
  overRate: fixtureTarget("overRateCuckooFilter", "OverRateCuckooFilter"),
  wholeRun: fixtureTarget(
    "wholeRunRateCuckooFilter",
    "WholeRunRateCuckooFilter",
  ),
  counting: fixtureTarget("countingBloomFilter", "CountingBloomFilter"),
} as const;

const SMALL = "용량 128 · ε 0.01";

/** 워커 생존 감시에서 따라 나오는 시험 한도. 비용 판정이 아니다. */
const TIMEOUT = 1_800_000;

describe("CuckooFilter 통계 판정 — 입력은 seed · 시행 번호 · 모양만으로 정해진다", () => {
  test("같은 세 값이면 같은 입력이고, 지우는 차례는 넣는 원소 번호의 순열이다", () => {
    const a = cuckooInput(128, 1, 3, 1);
    expect(a).toEqual(cuckooInput(128, 1, 3, 1));
    expect([...a.deleteOrder].sort((x, y) => x - y)).toEqual(
      a.distinct.map((_, i) => i),
    );
    expect([a.distinct.length, a.extra, a.fill.length]).toEqual([112, 16, 128]);
  });
});

describe("CuckooFilter 통계 판정 — 잡아야 할 구현을 잡는다", () => {
  test(
    "늘 참인 구현은 걸린다",
    async () => {
      const verdict = await runTrials(cuckooFilterTrials, FIXTURES.alwaysYes);
      expect(verdict.ok).toBe(false);
      expect(exceededShapes(verdict).length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );

  test(
    "지우는 척 참만 돌려주는 비트 배열은 다 지운 필터에서 걸린다",
    async () => {
      const verdict = await runTrials(cuckooFilterTrials, FIXTURES.pretend);
      expect(verdict.ok).toBe(false);
      expect(
        exceededShapes(verdict).some((name) =>
          name.endsWith("다 지운 필터의 참"),
        ),
      ).toBe(true);
    },
    TIMEOUT,
  );

  test(
    "비트를 끄는 비트 배열은 결정적 위반으로 걸린다",
    async () => {
      const verdict = await runTrials(cuckooFilterTrials, FIXTURES.clearing);
      expect(verdict.ok).toBe(false);
      expect(verdict.reason).toContain("결정적 문장 위반");
    },
    TIMEOUT,
  );

  test(
    "참일 확률이 min(0.5, 48ε) 인 경계 밖 구현은 ε 0.01 의 판정에서만 걸린다",
    async () => {
      const verdict = await runTrials(cuckooFilterTrials, FIXTURES.overRate);
      expect(verdict.ok).toBe(false);
      const caught = exceededShapes(verdict);
      expect(caught.length).toBeGreaterThan(0);
      expect(caught.every((name) => name.startsWith(SMALL))).toBe(true);
    },
    TIMEOUT,
  );
});

describe("CuckooFilter 통계 판정 — 계약을 지키는 구현을 부당하게 떨어뜨리지 않는다", () => {
  test(
    "실행마다 동전 하나로 사본 없는 원소의 답을 전부 함께 틀리는 구현은 통과한다",
    async () => {
      const verdict = await runTrials(cuckooFilterTrials, FIXTURES.wholeRun);
      expect(verdict.ok ? "" : verdict.reason).toBe("");
      expect(verdict.workers).toBe(16);
    },
    TIMEOUT,
  );

  test(
    "칸마다 수를 세는 블룸 필터는 이 계약과 블룸 필터 계약의 통계 판정을 둘 다 통과한다",
    async () => {
      const mine = await runTrials(cuckooFilterTrials, FIXTURES.counting);
      expect(mine.ok ? "" : mine.reason).toBe("");
      const bloom = await runTrials(bloomFilterTrials, FIXTURES.counting);
      expect(bloom.ok ? "" : bloom.reason).toBe("");
    },
    TIMEOUT,
  );
});
