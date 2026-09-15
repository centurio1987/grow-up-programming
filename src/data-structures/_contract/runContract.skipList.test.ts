/**
 * 하네스 자기시험 — `probabilistic/skipList` 계약(= `tree/treap` 계약의 성격 전환 · T5-04).
 *
 * `./runContract.test.ts` 와 같은 일을 한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실
 * 106·255). 고정하는 것은 넷이다.
 *
 * 1. **같은 객체** — 성격 전환이 스위트를 복사하지 않았다는 것(§규약1 「성격 전환은 이렇게 적는다」 규칙 2).
 * 2. **이 이름의 흔한 결함이 스위트에서 걸리는 자리** — 층을 고르게 뽑기 · 윗끝 4 는 걸리고, 윗끝 16(물려받은 설계)은 사다리
 *    아래라 통과한다(불변 사실 231).
 * 3. **씨앗을 고정한 층** — 스위트는 통과시키고, 층의 수열을 되짚은 입력에서 선형이다(불변 사실 232 · 44).
 * 4. **머리부터 다시 훑는 지우기** — 스위트의 구멍. 지우기 시나리오가 늘 최솟값을 지워 통과하고, 무작위 차례의 지우기에서
 *    선형이다(불변 사실 233).
 *
 * **무작위를 쓰는 구현의 수치는 단언하지 않는다**(§「무작위를 쓰는 정본과 재현성」 규칙 3·5). 판정 깃발은 40 회 반복에서 한
 * 번도 갈리지 않은 것만 고정했고(불변 사실 238), 비용은 계급이 갈리는 큰 여백(담긴 수의 8 분의 1 이상 대 64 미만)으로만 적는다.
 * 결정론적인 fixture(씨앗 고정)의 수치는 그대로 고정한다.
 */

import { describe, expect, test } from "bun:test";
import { SkipList } from "../probabilistic/skipList/_reference/skipList";
import {
  type SkipListContract,
  skipListContract,
} from "../probabilistic/skipList/skipList.contract";
import { treapContract } from "../tree/treap/treap.contract";
import {
  cappedLevels,
  LevelRuleSkipList,
  seededHeightSequence,
  seededLevels,
  uniformLevels,
} from "./_fixtures/levelRuleSkipList";
import { judgeScenario } from "./runContract";

type Measured = SkipListContract<number> & { __cost: number };

/** 스위트 일곱 시나리오의 판정 깃발. `o` 통과 · `X` 걸림, 순서는 `treap.contract.ts` 의 `scenarios` 순서다. */
function flags(make: () => Measured): string {
  return skipListContract.scenarios
    .map((scenario) =>
      judgeScenario(
        { kind: "self-reported", make },
        scenario,
        skipListContract.grade,
      ).ok
        ? "o"
        : "X",
    )
    .join("");
}

const SIZES = [1 << 10, 1 << 12, 1 << 14];

/**
 * 씨앗 고정 층을 겨눈 입력. 넣은 차례 t 의 층이 `seededHeightSequence` 의 t 번째이므로, 한 층짜리 차례에는 오른쪽 덩어리의 키를
 * 오름차순으로, 나머지 차례에는 왼쪽 덩어리의 키를 준다. 그러면 오른쪽 덩어리가 0 층 줄로만 이어진다. 오른쪽 키를 전부 찾는
 * 호출 평균을 돌려준다. **구현을 읽어야 지어지는 입력이라 계약 스위트의 시나리오가 아니다**(불변 사실 44).
 */
function seededAttack(make: () => Measured, n: number): number {
  const heights = seededHeightSequence(SEED, n);
  let left = 0;
  let right = n;
  const keys = heights.map((height) => (height === 1 ? right++ : left++));
  const impl = make();
  for (const key of keys) impl.insert(key);
  const before = impl.__cost;
  for (let key = left; key < right; key++) impl.has(key);
  return Number(((impl.__cost - before) / (right - left)).toFixed(1));
}

const SEED = 0x5eed;

/** 0 … n-1 을 넣고, 고정한 섞기 차례로 전부 지우는 호출 평균. */
function shuffledDeletes(make: () => Measured, n: number): number {
  const impl = make();
  for (let i = 0; i < n; i++) impl.insert(i);
  const order = Array.from({ length: n }, (_, i) => i);
  let state = 12345;
  for (let i = n - 1; i > 0; i--) {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    const j = (state >>> 8) % (i + 1);
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  const before = impl.__cost;
  for (const key of order) impl.delete(key);
  return (impl.__cost - before) / n;
}

describe("skipList — 성격 전환은 같은 객체를 쓴다", () => {
  test("model · ops · edges · invariants · scenarios 가 tree/treap 의 것이고 name 만 다르다", () => {
    expect(skipListContract.model).toBe(treapContract.model);
    expect(skipListContract.ops).toBe(treapContract.ops);
    expect(skipListContract.edges).toBe(treapContract.edges);
    expect(skipListContract.invariants).toBe(treapContract.invariants);
    expect(skipListContract.scenarios).toBe(treapContract.scenarios);
    expect(skipListContract.grade).toBe(treapContract.grade);
    expect(skipListContract.name).toBe("SkipList");
  });
});

describe("skipList — 이 이름의 흔한 결함(층 규칙)", () => {
  test("층을 고르게 뽑거나 윗끝을 4 로 두면 넣기 둘 · 조회 · 구간에서 걸린다", () => {
    expect(flags(() => new LevelRuleSkipList<number>(uniformLevels(16)))).toBe(
      "XXXoXoo",
    );
    expect(
      flags(() => new LevelRuleSkipList<number>(cappedLevels(4, 0.5))),
    ).toBe("XXXoXoo");
  }, 60_000);

  test("물려받은 설계(윗끝 16)는 문턱 2^16 이 사다리 끝 2^14 위라 전부 통과한다 — 계약 위반이 숨은 통과", () => {
    expect(
      flags(() => new LevelRuleSkipList<number>(cappedLevels(16, 0.5))),
    ).toBe("ooooooo");
  }, 60_000);
});

describe("skipList — 씨앗을 고정한 층(결정론)", () => {
  test("스위트는 전부 통과시키고, 층의 수열을 되짚은 입력에서 찾기가 담긴 수에 비례한다", () => {
    const seeded = () => new LevelRuleSkipList<number>(seededLevels(SEED));
    expect(flags(seeded)).toBe("ooooooo");
    expect(SIZES.map((n) => seededAttack(seeded, n))).toEqual([
      157.5, 534.3, 2062.3,
    ]);
    // 같은 입력을 이 정본에 주면 로그에 머문다(층을 입력과 무관하게 뽑는다). 무작위라 여백으로만 적는다.
    for (const n of SIZES) {
      expect(seededAttack(() => new SkipList<number>(), n)).toBeLessThan(64);
    }
  }, 60_000);
});

describe("skipList — 스위트의 구멍: 머리부터 다시 훑는 지우기", () => {
  test("지우기 시나리오가 늘 최솟값을 지워 전부 통과하고, 무작위 차례로 지우면 담긴 수에 비례한다", () => {
    const scanning = () =>
      new LevelRuleSkipList<number>(cappedLevels(Infinity, 0.5), {
        scanDelete: true,
      });
    expect(flags(scanning)).toBe("ooooooo");
    for (const n of SIZES) {
      expect(shuffledDeletes(scanning, n)).toBeGreaterThan(n / 8);
      expect(shuffledDeletes(() => new SkipList<number>(), n)).toBeLessThan(64);
    }
  }, 60_000);
});
