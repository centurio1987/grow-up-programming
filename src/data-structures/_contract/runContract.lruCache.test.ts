/**
 * 하네스 자기시험 — `hash/lruCache` 계약(용량이 정해진 사전 · T3-03).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 통과시키는지가 아니라 **계약을 어긴
 * 구현을 실제로 떨어뜨리는지**, 그리고 **어느 축이 떨어뜨리는지**를 고정한다. 파일을 따로 둔 이유는
 * `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 106·255).
 *
 * **결함 다섯이 두 축으로 갈린다.** 셋은 축1을 통과하고 축3의 서로 다른 행에서 걸리며, 둘은 축3을
 * 걸리지 않거나 재지 않고 축1이 잡는다. 뒤의 둘이 헤더 「목적」의 두 판정 — 용량이 관측되는 경계라서
 * 계약에 들어온다 · 맞은 `get` 이 쓰기라는 것이 관측되는 약속이다 — 의 실물이다.
 */

import { describe, expect, test } from "bun:test";
import { LRUCache as Reference } from "../hash/lruCache/_reference/lruCache";
import {
  CacheSite,
  type LRUCacheContract,
  lruCacheContract,
} from "../hash/lruCache/lruCache.contract";
import { ReadBlindCache } from "./_fixtures/readBlindCache";
import { RecencyArrayCache } from "./_fixtures/recencyArrayCache";
import { RemainderSlotCache } from "./_fixtures/remainderSlotCache";
import { StampScanningCache } from "./_fixtures/stampScanningCache";
import { UnboundedCache } from "./_fixtures/unboundedCache";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = LRUCacheContract<number, number> & { __cost: number };
type Make = (capacity: number, spread: (key: number) => number) => Measured;

const identity = (key: number): number => key;

function site(make: Make): CostSource<CacheSite> {
  return {
    kind: "self-reported",
    make: () => new CacheSite((capacity) => make(capacity, identity)),
  };
}

const reference = site((capacity, spread) => new Reference(capacity, spread));
const recencyArray = site(
  (capacity, spread) => new RecencyArrayCache(capacity, spread),
);
const stampScanning = site(
  (capacity, spread) => new StampScanningCache(capacity, spread),
);
const remainderSlot = site(
  (capacity, spread) => new RemainderSlotCache(capacity, spread),
);
const unbounded = site(
  (capacity, spread) => new UnboundedCache(capacity, spread),
);

function labelOf(scenario: CostScenario<CacheSite>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function outcomes(cost: CostSource<CacheSite>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of lruCacheContract.scenarios) {
    result[labelOf(scenario)] = judgeScenario(cost, scenario, "complexity").ok;
  }
  return result;
}

function statsOf(cost: CostSource<CacheSite>, label: string): number[] {
  const chosen = lruCacheContract.scenarios.find(
    (scenario) => labelOf(scenario) === label,
  );
  if (!chosen) throw new Error(`시나리오를 못 찾았다: ${label}`);
  return judgeScenario(cost, chosen, "complexity").points.map(
    (point) => point.stat,
  );
}

/** 축1 경계 케이스에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(
  make: (capacity: number) => LRUCacheContract<number, number>,
): string | null {
  const byName = new Map(
    lruCacheContract.ops.map((op) => [op.name, op] as const),
  );
  for (const edge of lruCacheContract.edges) {
    const impl = new CacheSite(make);
    const model = lruCacheContract.model();
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!Object.is(observed, expected)) {
        return `${edge.name} / ${index}번째 ${step.op} — 관측 ${observed} / 모델 ${expected}`;
      }
    }
  }
  return null;
}

/** 소수 첫째 자리까지. */
function tenths(value: number): number {
  return Math.round(value * 10) / 10;
}

const PUT = "put";
const PUT_ADVERSARIAL = "put (적대적)";
const GET = "get";
const GET_ADVERSARIAL = "get (적대적)";

describe("축3 — 용량이 정해진 사전 계약", () => {
  test("정본이 네 시나리오를 전부 통과한다", () => {
    expect(outcomes(reference)).toEqual({
      [PUT]: true,
      [PUT_ADVERSARIAL]: true,
      [GET]: true,
      [GET_ADVERSARIAL]: true,
    });
  }, 60_000);

  /**
   * **자명한 구현 셋이 서로 다른 행에서 걸린다**(헤더 「검증 등급」). 사용 순서를 배열에 두면 두 행이
   * 다, 쓴 시각을 훑으면 밀어내는 `put` 하나가, 칸을 나머지로 정하면 적대적 키 둘이 걸린다. 셋 다
   * 결정론적이라 반복 단위 열의 중앙값이 곧 그 값이다.
   */
  test("사용 순서를 배열에 두는 캐시는 네 시나리오 전부에서 걸린다", () => {
    expect(outcomes(recencyArray)).toEqual({
      [PUT]: false,
      [PUT_ADVERSARIAL]: false,
      [GET]: false,
      [GET_ADVERSARIAL]: false,
    });
    expect(statsOf(recencyArray, PUT)).toEqual([1025, 4097, 16385]);
    expect(statsOf(recencyArray, GET)).toEqual([513, 2049, 8193]);
  }, 60_000);

  test("쓴 시각을 훑어 밀어내는 캐시는 put 둘에서만 걸리고 get 은 통과한다", () => {
    expect(outcomes(stampScanning)).toEqual({
      [PUT]: false,
      [PUT_ADVERSARIAL]: false,
      [GET]: true,
      [GET_ADVERSARIAL]: true,
    });
    expect(statsOf(stampScanning, PUT)).toEqual([1025, 4097, 16385]);
    expect(statsOf(stampScanning, GET)).toEqual([1, 1, 1]);
  }, 60_000);

  test("칸을 나머지로 정하는 캐시는 적대적 키 둘에서만 걸린다", () => {
    expect(outcomes(remainderSlot)).toEqual({
      [PUT]: true,
      [PUT_ADVERSARIAL]: false,
      [GET]: true,
      [GET_ADVERSARIAL]: false,
    });
    expect(statsOf(remainderSlot, PUT)).toEqual([7, 7, 7]);
    expect(statsOf(remainderSlot, GET)).toEqual([3, 3, 3]);
    // 호출 평균이 1,541.5 보다 정확히 1/n 크다(1,541.5009… · 6,149.5002… · 24,581.5000…). 한 자리로 본다.
    expect(statsOf(remainderSlot, PUT_ADVERSARIAL).map(tenths)).toEqual([
      1541.5, 6149.5, 24581.5,
    ]);
    expect(statsOf(remainderSlot, GET_ADVERSARIAL).map(tenths)).toEqual([
      770.5, 3074.5, 12290.5,
    ]);
  }, 60_000);

  /**
   * **용량을 무시하는 구현은 축3을 전부 통과한다.** 두 행의 시간 상한을 지키면서 경계의 의미만
   * 어긴다 — 그 자리는 아래 축1 묶음이 잡는다(불변 사실 67 · T5-01 절차 ③).
   */
  test("아무것도 밀어내지 않는 캐시는 네 시나리오를 전부 통과한다", () => {
    expect(outcomes(unbounded)).toEqual({
      [PUT]: true,
      [PUT_ADVERSARIAL]: true,
      [GET]: true,
      [GET_ADVERSARIAL]: true,
    });
    expect(statsOf(unbounded, PUT)).toEqual([1, 1, 1]);
  }, 60_000);
});

describe("축1 — 용량과 「쓴다」의 정의가 관측된다", () => {
  test("정본과 축3 결함 셋은 경계 케이스를 전부 통과한다", () => {
    for (const make of [
      (capacity: number) => new Reference<number, number>(capacity, identity),
      (capacity: number) =>
        new RecencyArrayCache<number, number>(capacity, identity),
      (capacity: number) =>
        new StampScanningCache<number, number>(capacity, identity),
      (capacity: number) =>
        new RemainderSlotCache<number, number>(capacity, identity),
    ]) {
      expect(firstBehaviorSplit(make)).toBeNull();
    }
  });

  test("용량을 무시하는 캐시는 가득 찬 뒤 밀려났어야 할 키에서 갈린다", () => {
    expect(
      firstBehaviorSplit(
        (capacity) => new UnboundedCache<number, number>(capacity, identity),
      ),
    ).toBe(
      "가득 찬 뒤 새 키를 넣으면 가장 오래 안 쓴 키가 밀려난다 / 5번째 get — 관측 10 / 모델 null",
    );
  });

  test("맞은 get 을 쓰기로 치지 않는 캐시는 다음 밀어내기에서 갈린다", () => {
    expect(
      firstBehaviorSplit(
        (capacity) => new ReadBlindCache<number, number>(capacity, identity),
      ),
    ).toBe(
      "맞은 get 은 그 키를 가장 최근으로 올린다 / 6번째 get — 관측 20 / 모델 null",
    );
  });

  /**
   * **무작위 시퀀스가 이 계약의 갈림 자리를 실제로 지난다.** 용량 4 · 키 8 에서 seed 1 로 500 회를
   * 뽑으면 밀어내기 78 · 맞은 `get` 72 · 빗나간 `get` 94 가 나온다 — 좁게 잡은 이유다
   * (`lruCache.contract.ts` 머리말). 연산이 셋뿐이라 거절되는 `reset` 이 163 회로 삼분의 일을 차지하고
   * 그 호출은 상태를 안 바꾼다. 남는 337 회가 갈림 자리를 지나기에 충분해 연산 목록을 손대지 않았다.
   */
  test("seed 1 · 500 회 무작위 시퀀스가 밀어내기 · 맞은 get · 거절되는 reset 을 함께 지난다", () => {
    const rng = rngFrom(1);
    const model = lruCacheContract.model();
    let evictions = 0;
    let hits = 0;
    let misses = 0;
    let rejected = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        lruCacheContract.ops[Math.floor(rng() * lruCacheContract.ops.length)];
      if (op === undefined) throw new Error("연산 목록이 비었다");
      const arg = op.arg(rng);
      if (op.name === "put") {
        const [key] = arg as [number, number];
        if (!model.entries.has(key) && model.entries.size === model.capacity) {
          evictions += 1;
        }
      }
      const observed = op.onModel(model, arg);
      if (op.name === "get") {
        if (observed === null) misses += 1;
        else hits += 1;
      }
      if (op.name === "reset" && observed === "RangeError") rejected += 1;
    }
    expect({ evictions, hits, misses, rejected }).toEqual({
      evictions: 78,
      hits: 72,
      misses: 94,
      rejected: 163,
    });
  });
});
