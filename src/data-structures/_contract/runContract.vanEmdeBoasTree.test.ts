/**
 * 하네스 자기시험 — `heap/vanEmdeBoasTree` 계약(정수 우주 위의 정렬 집합 · T2-05).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 통과시키는지가 아니라 **계약을
 * 어긴 구현을 실제로 떨어뜨리는지**, 그리고 **떨어뜨리지 못하는 자리가 어디인지**를 고정한다.
 * 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 106·255).
 *
 * **이 파일의 셋째 묶음이 Bound 판정의 근거다**(`docs/ORD-006-conventions.md` 「상한이 우주의 로그
 * 로그인 계약은 Bound 를 늘리지 않는다」). 판정 규격(`./judge.ts`)의 `O(1)`·`O(log n)` 구간이
 * $\log\log u$ 를 이미 받아들이고, 새 구간을 그어도 $O(\log u)$ 로 어기는 fixture 가 그 안에 든다는
 * 것을 수치로 못 박는다.
 */

import { describe, expect, test } from "bun:test";
import { VanEmdeBoasTree as Reference } from "../heap/vanEmdeBoasTree/_reference/vanEmdeBoasTree";
import {
  FIXED_UNIVERSE,
  type IntegerUniverseSet,
  UniverseSite,
  vanEmdeBoasTreeContract,
} from "../heap/vanEmdeBoasTree/vanEmdeBoasTree.contract";
import { BitTrieIntegerSet } from "./_fixtures/bitTrieIntegerSet";
import { FlushingIntegerSet } from "./_fixtures/flushingIntegerSet";
import { ScanningBitSet } from "./_fixtures/scanningBitSet";
import { SortedArrayIntegerSet } from "./_fixtures/sortedArrayIntegerSet";
import { expectedRatio, judgeGrowth, rngFrom, SIZES, TOLERANCE } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = IntegerUniverseSet & { __cost: number };

function site(make: (universe: number) => Measured): CostSource<UniverseSite> {
  return {
    kind: "self-reported",
    make: () => new UniverseSite(make),
  };
}

const reference = site((universe) => new Reference(universe));
const scanningBitSet = site((universe) => new ScanningBitSet(universe));
const sortedArray = site((universe) => new SortedArrayIntegerSet(universe));
const bitTrie = site((universe) => new BitTrieIntegerSet(universe));
const flushing = site((universe) => new FlushingIntegerSet(universe));

function labelOf(scenario: CostScenario<UniverseSite>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function outcomes(cost: CostSource<UniverseSite>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of vanEmdeBoasTreeContract.scenarios) {
    result[labelOf(scenario)] = judgeScenario(cost, scenario, "complexity").ok;
  }
  return result;
}

function statsOf(
  cost: CostSource<UniverseSite>,
  label: string,
  scenario?: CostScenario<UniverseSite>,
): number[] {
  const chosen =
    scenario ??
    vanEmdeBoasTreeContract.scenarios.find((each) => labelOf(each) === label);
  if (!chosen) throw new Error(`시나리오를 못 찾았다: ${label}`);
  return judgeScenario(cost, chosen, "complexity").points.map(
    (point) => point.stat,
  );
}

const INSERT = "insert (적대적)";
const DELETE = "delete (적대적)";
const QUERIES = "has·successor·predecessor";
const NEIGHBORS = "successor·predecessor·min·max·has (적대적)";
const UPDATES = "insert·delete (적대적)";

const ALL_PASS = {
  [INSERT]: true,
  [DELETE]: true,
  [QUERIES]: true,
  [NEIGHBORS]: true,
  [UPDATES]: true,
};

describe("축3 — 정수 우주 위의 정렬 집합 계약의 정본", () => {
  test("정본이 다섯 시나리오를 전부 통과한다", () => {
    for (const scenario of vanEmdeBoasTreeContract.scenarios) {
      const verdict = judgeScenario(reference, scenario, "complexity");
      expect(verdict.ok ? "" : `${labelOf(scenario)} — ${verdict.reason}`).toBe(
        "",
      );
    }
  }, 60_000);

  /**
   * **우주를 키워도 내려가는 깊이가 같다.** u = $2^{10}$ · $2^{12}$ · $2^{14}$ 의 비트 수 10 · 12 · 14 를
   * 반씩 줄여 1 에 닿는 걸음이 셋 다 넷이다. 사다리가 $\log\log u$ 를 **한 칸도** 못 올린다는 것이 이
   * 계약의 축3이 그 상한을 `O(1)` 로 판정하는 이유의 실물이다.
   */
  test("우주를 키우는 두 시나리오에서 정본의 걸음이 사다리 세 점에서 같다", () => {
    expect(statsOf(reference, NEIGHBORS)).toEqual([19, 19, 19]);
    expect(statsOf(reference, UPDATES)).toEqual([17, 17, 17]);
  }, 60_000);

  test("무작위 시퀀스가 우주 밖 키와 거절되는 우주를 함께 지난다", () => {
    const rng = rngFrom(1);
    const model = vanEmdeBoasTreeContract.model();
    let rejectedKeys = 0;
    let rejectedResets = 0;
    let largest = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        vanEmdeBoasTreeContract.ops[
          Math.floor(rng() * vanEmdeBoasTreeContract.ops.length)
        ];
      if (op === undefined) throw new Error("연산 목록이 비었다");
      const observed = op.onModel(model, op.arg(rng));
      if (observed === "RangeError") {
        if (op.name === "reset") rejectedResets += 1;
        else rejectedKeys += 1;
      }
      largest = Math.max(largest, model.items.size);
    }
    // 받아들이는 `reset` 은 무작위 시퀀스에 없으므로 담긴 수가 끊기지 않고 자란다.
    expect({ rejectedKeys, rejectedResets, largest }).toEqual({
      rejectedKeys: 25,
      rejectedResets: 50,
      largest: 36,
    });
  });
});

describe("축3 — 정수 우주 위의 정렬 집합 계약의 결함 fixture", () => {
  /**
   * **두 파라미터를 갈라 키우는 이유가 이 둘이다.** 칸을 훑는 계열은 우주를 키우는 둘에서만, 크기
   * 순 배열은 원소 수를 키우는 셋에서만 걸린다. 한쪽 사다리만 두면 반대쪽 계열이 전부 통과한다.
   */
  test("칸을 훑는 집합은 우주를 키우는 두 시나리오에서만 걸린다", () => {
    expect(outcomes(scanningBitSet)).toEqual({
      ...ALL_PASS,
      [NEIGHBORS]: false,
      [UPDATES]: false,
    });
    expect(statsOf(scanningBitSet, NEIGHBORS)).toEqual([2049, 8193, 32769]);
    expect(statsOf(scanningBitSet, UPDATES)).toEqual([1025, 4097, 16385]);
  }, 60_000);

  test("크기 순 배열을 훑는 집합은 원소 수를 키우는 세 시나리오에서만 걸린다", () => {
    expect(outcomes(sortedArray)).toEqual({
      ...ALL_PASS,
      [INSERT]: false,
      [DELETE]: false,
      [QUERIES]: false,
    });
    expect(statsOf(sortedArray, INSERT)).toEqual([1024, 4096, 16384]);
  }, 120_000);

  /**
   * **일곱 행의 `worst` 가 추가로 배제하는 계열**(헤더 「한정자」). 원소 수를 키우는 지우기·조회에서
   * 걸리고, 넣기 n 번 뒤 이웃 찾기 n 번을 전부 재는 입력을 `amortized` 로 읽으면 통과한다 — 쌓인
   * 키 하나가 정본에 들어가는 일은 평생 한 번이다.
   */
  test("넣기를 쌓아 두는 집합은 worst 로 걸리고 같은 실행을 amortized 로 읽으면 통과한다", () => {
    expect(outcomes(flushing)).toEqual({
      ...ALL_PASS,
      [DELETE]: false,
      [QUERIES]: false,
    });

    const fillThenQuery: CostScenario<UniverseSite> = {
      covers: ["insert", "successor"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(FIXED_UNIVERSE);
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(4 * i));
        for (let i = 0; i < n; i++) ctx.step(() => impl.successor(4 * i));
      },
    };
    const asWorst = judgeScenario(flushing, fillThenQuery, "complexity");
    expect(asWorst.ok).toBe(false);
    expect(asWorst.points.map((point) => point.stat)).toEqual([
      18832, 75368, 301520,
    ]);

    const asAmortized = judgeScenario(
      flushing,
      { ...fillThenQuery, qualifier: "amortized" },
      "complexity",
    );
    expect(asAmortized.ok).toBe(true);
    expect(
      asAmortized.points.map((point) => Math.round(point.stat * 100) / 100),
    ).toEqual([15.06, 15.08, 15.08]);

    // 정본은 같은 입력을 `worst` 로 읽어도 통과한다 — 호출마다 제 상한 안이다.
    expect(judgeScenario(reference, fillThenQuery, "complexity").ok).toBe(true);
  }, 60_000);

  /**
   * **계약을 로그 인수만큼 어기는 fixture 가 다섯을 전부 통과한다.** $O(\log u)$ 는 $O(\log\log u)$
   * 계약의 위반이다. 통과를 고정하는 것은 그것이 옳아서가 아니라 **축3이 이 자리를 못 본다는 것을
   * 다음 배치가 「계약을 지킨다」로 읽지 않게** 하려는 것이다(불변 사실 62).
   */
  test("비트 하나씩 내려가는 트라이는 계약을 어기는데 다섯을 전부 통과한다", () => {
    expect(outcomes(bitTrie)).toEqual(ALL_PASS);
    expect(statsOf(bitTrie, NEIGHBORS)).toEqual([73, 87, 101]);
    expect(statsOf(bitTrie, UPDATES)).toEqual([24, 28, 32]);
  }, 60_000);
});

describe("Bound 판정 — O(log log u) 를 판정 규격에 넣지 않는다", () => {
  const rigor = "discriminating" as const;
  const sizes = SIZES[rigor];
  const logLog = (u: number) => Math.log2(Math.log2(u));

  /** 사다리의 크기를 우주로 읽을 때 $\log\log u$ 를 계측값으로 삼은 측정점. */
  const logLogPoints = sizes.map((u) => ({ n: u, stat: logLog(u) }));

  test("사다리 위의 log log u 는 기존 O(1)·O(log n) 구간 둘 다에 든다", () => {
    const ratios = logLogPoints
      .slice(1)
      .map(
        (point, index) =>
          Math.round((point.stat / (logLogPoints[index]?.stat ?? 1)) * 1000) /
          1000,
      );
    expect(ratios).toEqual([1.079, 1.062]);
    expect(judgeGrowth("O(1)", rigor, logLogPoints).ok).toBe(true);
    expect(judgeGrowth("O(log n)", rigor, logLogPoints).ok).toBe(true);
  });

  /**
   * **새 구간을 그어도 가르는 것이 없다.** $\log\log$ 의 기대 비율에 ±30% 를 두른 구간이 트라이 fixture
   * 의 실측 비율(1.19 · 1.16)을 담는다 — 로그로 어기는 계열이 새 규격에서도 통과한다. 그 구간이
   * `O(1)` 과 다르게 판정하는 것은 1.30~1.40 과 0.70~0.75 의 띠뿐이고, 가르고 싶은 계열은 그 띠에
   * 오지 않는다.
   */
  test("log log 구간을 새로 그어도 O(log u) fixture 의 실측 비율이 그 안에 든다", () => {
    const measured = statsOf(bitTrie, NEIGHBORS);
    const tolerance = TOLERANCE[rigor];
    sizes.slice(1).forEach((upper, index) => {
      const lower = sizes[index] as number;
      const expected = logLog(upper) / logLog(lower);
      const r = (measured[index + 1] as number) / (measured[index] as number);
      expect(r).toBeGreaterThanOrEqual(expected * (1 - tolerance));
      expect(r).toBeLessThanOrEqual(expected * (1 + tolerance));
      // 같은 비율이 기존 `O(1)` 구간에도 든다.
      const constant = expectedRatio("O(1)", lower);
      expect(r).toBeLessThanOrEqual(constant * (1 + tolerance));
    });
  }, 60_000);

  /**
   * **사다리를 바꿔도 열리지 않는다.** 안전한 정수 전체($u \le 2^{53}$)에서 $\log\log u$ 가 움직이는
   * 폭이 1.72 배이고, 기존 규격에서 가장 작은 비상수 계급(`O(sqrt n)`)의 한 칸이 2.0 배다. 우주를 어떤
   * 간격으로 올려도 이 상한이 `O(1)` 과 한 칸만큼 벌어지는 두 점이 표현되는 수 안에 없다 —
   * `unionFind` 의 역아커만과 같은 판정이다(`docs/ORD-006-conventions.md` 「`unionFind` 의 Bound 는
   * 늘리지 않는다」).
   */
  test("표현되는 우주 전체에서 log log u 의 폭이 가장 작은 비상수 계급의 한 칸보다 좁다", () => {
    const span = logLog(2 ** 53) / logLog(sizes[0] as number);
    expect(Math.round(span * 100) / 100).toBe(1.72);
    expect(span).toBeLessThan(expectedRatio("O(sqrt n)", sizes[0] as number));
  });
});
