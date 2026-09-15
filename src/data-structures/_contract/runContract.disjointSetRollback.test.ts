/**
 * 하네스 자기시험 — `disjoint-set/disjointSetRollback` 계약(되돌릴 수 있는 분리 집합 · T3-05).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고
 * **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts`
 * 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 넷이다.
 *
 * 1. **축3 — 결함 계열이 어느 시나리오에서 걸리는가.** 요점은 **되돌리기가 상각에 기댄 설계를 깨뜨린다**는 것 —
 *    `unionFind` 스위트와 같은 입력인 앞 시나리오 셋을 통과하고 「되돌린 뒤 같은 합치기 거듭하기」에서만 걸리는
 *    구현이 넷이다.
 * 2. **`unionFind` 계약과의 교차.** 그 넷과 이 계약의 정본이 저쪽 스위트 셋을 전부 통과한다 — 앞은 되돌리기가
 *    가르고, 뒤는 로그 인수라 축3이 못 가른다(헤더 「이웃 계약과의 관계」).
 * 3. **한정자 근거.** 줄인 칸을 기록하는 구현의 되돌리기 한 호출이 원소 수에 비례하고 호출 평균은 상수다.
 * 4. **축1 — 되돌리는 단위가 호출이라는 약속과 이름표 복원이 관측된다**, 그리고 물려받은 스냅숏 정의의 구멍.
 */

import { describe, expect, test } from "bun:test";
import { DisjointSetRollback as Reference } from "../disjoint-set/disjointSetRollback/_reference/disjointSetRollback";
import {
  type DisjointSetRollbackContract,
  disjointSetRollbackContract,
  mergeByDoubling,
  RollbackSite,
} from "../disjoint-set/disjointSetRollback/disjointSetRollback.contract";
import {
  PartitionSite,
  unionFindContract,
} from "../disjoint-set/unionFind/unionFind.contract";
import { LoggingForest } from "./_fixtures/loggingForest";
import { RelabelingUndoPartition } from "./_fixtures/relabelingUndoPartition";
import { ReplayingPartition } from "./_fixtures/replayingPartition";
import { judgeGrowth, rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = DisjointSetRollbackContract & { __cost: number };

function site(make: (n: number) => Measured): CostSource<RollbackSite> {
  return { kind: "self-reported", make: () => new RollbackSite(make) };
}

function partitionSite(
  make: (n: number) => Measured,
): CostSource<PartitionSite> {
  return { kind: "self-reported", make: () => new PartitionSite(make) };
}

const makers = {
  reference: (n: number) => new Reference(n),
  underSecond: (n: number) => new LoggingForest(n, "underSecond", false),
  underFirst: (n: number) => new LoggingForest(n, "underFirst", false),
  compressedUnderSecond: (n: number) =>
    new LoggingForest(n, "underSecond", true),
  compressedUnderFirst: (n: number) => new LoggingForest(n, "underFirst", true),
  compressedBySize: (n: number) => new LoggingForest(n, "bySize", true),
  relabelFirst: (n: number) => new RelabelingUndoPartition(n, "first"),
  relabelSmaller: (n: number) => new RelabelingUndoPartition(n, "smaller"),
  replaying: (n: number) => new ReplayingPartition(n),
} as const;

const UNION = "union (적대적)";
const QUERIES = "find·connected (적대적)";
const MIXED = "union·find·connected";
const REPEAT = "union·connected·rollback (적대적)";
const ROLLBACK = "rollback (적대적)";

function labelOf<S>(scenario: CostScenario<S>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function outcomes(cost: CostSource<RollbackSite>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of disjointSetRollbackContract.scenarios) {
    result[labelOf(scenario)] = judgeScenario(cost, scenario, "complexity").ok;
  }
  return result;
}

function statsOf(
  cost: CostSource<RollbackSite>,
  scenario: CostScenario<RollbackSite> | string,
): number[] {
  const chosen =
    typeof scenario === "string"
      ? disjointSetRollbackContract.scenarios.find(
          (each) => labelOf(each) === scenario,
        )
      : scenario;
  if (!chosen) throw new Error(`시나리오를 못 찾았다: ${String(scenario)}`);
  return judgeScenario(cost, chosen, "complexity").points.map(
    (point) => point.stat,
  );
}

/** 실패 메시지에 구현 이름이 함께 찍히게 한다. */
function named(
  name: string,
  verdicts: Record<string, boolean>,
): Record<string, unknown> {
  return { name, ...verdicts };
}

/** 소수 둘째 자리까지. */
function hundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

function hundredthsOf(stats: number[]): number[] {
  return stats.map(hundredths);
}

describe("축3 — 되돌릴 수 있는 분리 집합 계약의 정본과 결함 계열", () => {
  test("정본이 다섯 시나리오를 전부 통과한다", () => {
    const reference = site(makers.reference);
    expect(outcomes(reference)).toEqual({
      [UNION]: true,
      [QUERIES]: true,
      [MIXED]: true,
      [REPEAT]: true,
      [ROLLBACK]: true,
    });
    expect(hundredthsOf(statsOf(reference, MIXED))).toEqual([7.35, 7.65, 7.64]);
    expect(hundredthsOf(statsOf(reference, REPEAT))).toEqual([
      2.33, 2.33, 2.33,
    ]);
    expect(statsOf(reference, ROLLBACK)).toEqual([1, 1, 1]);
  }, 120_000);

  test("인자 순서로 걸고 줄이지 않는 숲은 되돌리기만 재는 시나리오 하나를 빼고 전부 걸린다", () => {
    for (const forest of [makers.underSecond, makers.underFirst]) {
      const cost = site(forest);
      expect(outcomes(cost)).toEqual({
        [UNION]: false,
        [QUERIES]: false,
        [MIXED]: false,
        [REPEAT]: false,
        [ROLLBACK]: true,
      });
      expect(hundredthsOf(statsOf(cost, UNION))).toEqual([
        128.75, 512.75, 2048.75,
      ]);
      expect(statsOf(cost, REPEAT)).toEqual([173, 685, 2733]);
    }
  }, 120_000);

  test("앞 인자 쪽 번호표를 다시 적는 구현은 묻기만 재는 시나리오를 통과한다", () => {
    const cost = site(makers.relabelFirst);
    expect(outcomes(cost)).toEqual({
      [UNION]: false,
      [QUERIES]: true,
      [MIXED]: false,
      [REPEAT]: false,
      [ROLLBACK]: false,
    });
    expect(hundredthsOf(statsOf(cost, ROLLBACK))).toEqual([
      129.25, 513.25, 2049.25,
    ]);
  }, 120_000);

  /**
   * **되돌리기가 상각에 기댄 설계를 깨뜨린다.** 네 구현이 되돌리기가 없는 시나리오 셋을 통과하고 「되돌린 뒤 같은
   * 합치기 거듭하기」에서만(다시 합치는 구현은 되돌리기만 재는 시나리오에서도) 원소 수에 비례해 걸린다.
   */
  test("상각에 기댄 설계 넷은 되돌린 뒤 같은 합치기를 거듭하는 시나리오에서 걸린다", () => {
    const breaking = [
      ["compressedUnderSecond", [343, 1367, 5463], true],
      ["compressedUnderFirst", [343, 1367, 5463], true],
      ["relabelSmaller", [342.33, 1366.33, 5462.33], true],
      ["replaying", [854.33, 3414.33, 13654.33], false],
    ] as const;
    for (const [name, repeat, rollbackPasses] of breaking) {
      const cost = site(makers[name]);
      expect(named(name, outcomes(cost))).toEqual({
        name,
        [UNION]: true,
        [QUERIES]: true,
        [MIXED]: true,
        [REPEAT]: false,
        [ROLLBACK]: rollbackPasses,
      });
      expect(hundredthsOf(statsOf(cost, REPEAT))).toEqual([...repeat]);
    }
  }, 240_000);

  /**
   * **B19 의 「압축이 이전 상태를 지운다」는 계약의 문장이 아니다.** 크기로 걸고 줄인 칸을 기록하는 구현이 다섯을
   * 전부 통과한다 — 위 줄이는 숲과 거는 규칙 하나만 다르다.
   */
  test("크기로 걸면서 줄인 칸을 기록하는 구현은 다섯을 전부 통과한다", () => {
    const cost = site(makers.compressedBySize);
    expect(outcomes(cost)).toEqual({
      [UNION]: true,
      [QUERIES]: true,
      [MIXED]: true,
      [REPEAT]: true,
      [ROLLBACK]: true,
    });
    expect(hundredthsOf(statsOf(cost, REPEAT))).toEqual([3.33, 3.33, 3.33]);
  }, 120_000);
});

describe("축3 — `unionFind` 계약과의 교차(서로 담지 않는다)", () => {
  function unionFindOutcomes(
    cost: CostSource<PartitionSite>,
  ): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const scenario of unionFindContract.scenarios) {
      result[labelOf(scenario)] = judgeScenario(
        cost,
        scenario,
        "complexity",
      ).ok;
    }
    return result;
  }

  test("이 계약의 정본과 상각에 기댄 설계 넷이 unionFind 스위트 셋을 전부 통과한다", () => {
    for (const name of [
      "reference",
      "compressedUnderSecond",
      "compressedUnderFirst",
      "relabelSmaller",
      "replaying",
    ] as const) {
      expect(
        named(name, unionFindOutcomes(partitionSite(makers[name]))),
      ).toEqual({
        name,
        "union (적대적)": true,
        "find·connected (적대적)": true,
        union·find·connected: true,
      });
    }
  }, 240_000);

  function doublingThenFind(
    qualifier: "amortized" | "worst",
  ): CostScenario<PartitionSite> {
    return {
      covers: ["find"],
      qualifier,
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        mergeByDoubling(impl, n);
        for (let x = n - 1; x >= 0; x--) ctx.step(() => void impl.find(x));
      },
    };
  }

  /**
   * **이 계약의 정본은 `unionFind` 계약을 로그 인수만큼 어긴다.** 짝지어 두 배씩 합친 뒤 모든 원소를 찾으면 호출
   * 평균이 원소 수의 로그를 그대로 찍는다(6 · 7 · 8) — 저쪽 결함 fixture `byRank` 와 같은 값이다. 비율이 `O(1)` 과
   * `O(log n)` 구간에 함께 들어 축3은 이 갈림을 못 본다. 단일 호출 최대는 11 · 13 · 15 다.
   */
  test("정본의 로그 걸음이 O(1) 과 O(log n) 판정을 함께 통과한다", () => {
    const reference = partitionSite(makers.reference);
    const average = judgeScenario(
      reference,
      doublingThenFind("amortized"),
      "complexity",
    ).points;
    expect(average.map((point) => point.stat)).toEqual([6, 7, 8]);
    expect(judgeGrowth("O(1)", "discriminating", average).ok).toBe(true);
    expect(judgeGrowth("O(log n)", "discriminating", average).ok).toBe(true);
    expect(
      judgeScenario(
        reference,
        doublingThenFind("worst"),
        "complexity",
      ).points.map((point) => point.stat),
    ).toEqual([11, 13, 15]);
  }, 120_000);

  test("unionFind 의 경계 케이스 아홉을 같은 객체로 가져온다", () => {
    const own = disjointSetRollbackContract.edges;
    expect(unionFindContract.edges).toHaveLength(9);
    unionFindContract.edges.forEach((edge, at) => {
      expect(own[at]).toBe(edge);
    });
    expect(disjointSetRollbackContract.scenarios).not.toContain(
      unionFindContract.scenarios[0],
    );
  });
});

describe("축3 — 되돌리기 행이 amortized 인 근거", () => {
  function findAllThenRollback(
    qualifier: "amortized" | "worst",
  ): CostScenario<RollbackSite> {
    return {
      covers: ["rollback"],
      qualifier,
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(n);
        mergeByDoubling(impl, n);
        for (let x = 0; x < n; x++) ctx.step(() => void impl.find(x));
        ctx.step(() => void impl.rollback());
      },
    };
  }

  /**
   * 짝지어 두 배씩 합친 뒤 모든 원소를 찾으면 줄이는 구현이 거의 모든 칸을 뿌리에 바로 걸고 그 기록이 마지막 합치기
   * 뒤에 쌓인다. 이어지는 되돌리기 **한 호출**이 그것을 전부 되쓴다. 호출열 평균은 상수다. 입력이 크기로 거는 구현의
   * 나무 모양에 기대므로 계약 스위트의 시나리오가 아니다(불변 사실 44·264).
   */
  test("줄인 칸을 기록하는 구현의 되돌리기 한 호출은 원소 수에 비례하고 호출 평균은 상수다", () => {
    const cost = site(makers.compressedBySize);
    const worst = judgeScenario(
      cost,
      findAllThenRollback("worst"),
      "complexity",
    );
    expect(worst.points.map((point) => point.stat)).toEqual([
      1017, 4087, 16373,
    ]);
    expect(worst.ok).toBe(false);
    const average = judgeScenario(
      cost,
      findAllThenRollback("amortized"),
      "complexity",
    );
    expect(hundredthsOf(average.points.map((point) => point.stat))).toEqual([
      3.98, 3.99, 4,
    ]);
    expect(average.ok).toBe(true);
  }, 120_000);
});

/**
 * 약속 하나씩을 어기는 숲. 비용을 재지 않으므로 결함 fixture 파일로 두지 않았다.
 *
 * - `mergesOnly` — 아무것도 안 바꾼 합치기 호출을 되돌릴 호출로 쌓지 않는다.
 * - `keepsSmallest` — 되돌리며 뿌리의 가장 작은 원소를 되돌리지 않는다.
 */
class FlawedRollbackForest implements DisjointSetRollbackContract {
  readonly #parent: number[];
  readonly #size: number[];
  readonly #smallest: number[];
  readonly #history: ({ child: number; parent: number; was: number } | null)[] =
    [];
  readonly #flaw: "mergesOnly" | "keepsSmallest";

  constructor(n: number, flaw: "mergesOnly" | "keepsSmallest") {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`원소 수 ${n}`);
    this.#parent = Array.from({ length: n }, (_, at) => at);
    this.#size = Array.from({ length: n }, () => 1);
    this.#smallest = Array.from({ length: n }, (_, at) => at);
    this.#flaw = flaw;
  }

  find(x: number): number {
    return this.#smallest[this.#root(x)] as number;
  }

  union(x: number, y: number): void {
    const left = this.#root(x);
    const right = this.#root(y);
    if (left === right) {
      if (this.#flaw !== "mergesOnly") this.#history.push(null);
      return;
    }
    const [child, parent] =
      (this.#size[left] as number) < (this.#size[right] as number)
        ? [left, right]
        : [right, left];
    this.#history.push({
      child,
      parent,
      was: this.#smallest[parent] as number,
    });
    this.#parent[child] = parent;
    this.#size[parent] =
      (this.#size[parent] as number) + (this.#size[child] as number);
    this.#smallest[parent] = Math.min(
      this.#smallest[parent] as number,
      this.#smallest[child] as number,
    );
  }

  connected(x: number, y: number): boolean {
    return this.#root(x) === this.#root(y);
  }

  rollback(): boolean {
    if (this.#history.length === 0) return false;
    const merge = this.#history.pop();
    if (merge) {
      this.#parent[merge.child] = merge.child;
      this.#size[merge.parent] =
        (this.#size[merge.parent] as number) -
        (this.#size[merge.child] as number);
      if (this.#flaw !== "keepsSmallest") {
        this.#smallest[merge.parent] = merge.was;
      }
    }
    return true;
  }

  #root(x: number): number {
    if (!Number.isInteger(x) || x < 0 || x >= this.#parent.length) {
      throw new RangeError(`원소 ${x}`);
    }
    let at = x;
    while (this.#parent[at] !== at) at = this.#parent[at] as number;
    return at;
  }
}

/** 축1 경계 케이스에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(
  make: (n: number) => DisjointSetRollbackContract,
): string | null {
  const byName = new Map(
    disjointSetRollbackContract.ops.map((op) => [op.name, op] as const),
  );
  for (const edge of disjointSetRollbackContract.edges) {
    const impl = new RollbackSite(make);
    const model = disjointSetRollbackContract.model();
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

describe("축1 — 되돌리는 단위와 이름표 복원이 관측된다", () => {
  test("정본과 결함 계열 여덟은 경계 케이스를 전부 통과한다", () => {
    for (const make of Object.values(makers)) {
      expect(firstBehaviorSplit(make)).toBeNull();
    }
  });

  test("합친 일만 되돌릴 호출로 세는 숲과 이름표를 되돌리지 않는 숲이 경계 케이스에서 갈린다", () => {
    expect(
      firstBehaviorSplit((n) => new FlawedRollbackForest(n, "mergesOnly")),
    ).toBe(
      "아무것도 안 바꾼 합치기 호출도 되돌릴 합치기 하나로 친다 / 3번째 connected — 관측 false / 모델 true",
    );
    expect(
      firstBehaviorSplit((n) => new FlawedRollbackForest(n, "keepsSmallest")),
    ).toBe(
      "되돌리기는 나중 합치기부터 하나씩 되돌리고 이름표도 그 전으로 돌아간다 / 9번째 find — 관측 3 / 모델 7",
    );
  });

  /**
   * **물려받은 스냅숏 정의의 구멍**(헤더 「목적」). 판번호가 「그때까지 쌓인 합치기 수」이고 되살리기가 그 수까지
   * 되돌리는 정의를 정본 위에 그대로 올리면, 판을 뜬 뒤 그 앞 합치기를 되돌리고 다른 합치기를 한 자리에서 되살리기가
   * 아무것도 안 한다.
   */
  test("물려받은 스냅숏 정의는 판을 뜬 때의 분할로 되살리지 못한다", () => {
    const inner = new Reference(4);
    let pending = 0;
    const marks: number[] = [];
    const union = (x: number, y: number) => {
      inner.union(x, y);
      pending += 1;
    };
    const rollback = () => {
      if (inner.rollback()) pending -= 1;
    };
    const snapshot = () => marks.push(pending) - 1;
    const restore = (version: number) => {
      while (pending > (marks[version] as number)) rollback();
    };

    union(0, 1);
    const version = snapshot();
    rollback();
    union(2, 3);
    restore(version);
    expect({
      zeroOne: inner.connected(0, 1),
      twoThree: inner.connected(2, 3),
    }).toEqual({ zeroOne: false, twoThree: true });
  });

  /**
   * **무작위 시퀀스가 되돌리기와 거절 경로를 함께 지난다.** 원소 48 · seed 1 · 500 회에서 되돌리기 96 회 중 88 회가
   * 호출 하나를 되돌리고 8 회가 `false` 다. 되돌릴 호출이 가장 많이 쌓인 때가 11 개라 깊은 되돌리기는 경계 케이스가
   * 짚는다. 거절은 `reset` 103 회와 범위 밖 원소 41 회다.
   */
  test("seed 1 · 500 회 무작위 시퀀스의 연산 분포와 끝 상태", () => {
    const rng = rngFrom(1);
    const model = disjointSetRollbackContract.model();
    const counts: Record<string, number> = {};
    let rejected = 0;
    let undone = 0;
    let deepest = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        disjointSetRollbackContract.ops[
          Math.floor(rng() * disjointSetRollbackContract.ops.length)
        ];
      if (op === undefined) throw new Error("연산 목록이 비었다");
      const observed = op.onModel(model, op.arg(rng));
      counts[op.name] = (counts[op.name] ?? 0) + 1;
      if (observed === "RangeError") rejected += 1;
      if (observed === true && op.name === "rollback") undone += 1;
      deepest = Math.max(deepest, model.history.length);
    }
    expect({
      counts,
      rejected,
      undone,
      deepest,
      sets: new Set(model.smallest).size,
    }).toEqual({
      counts: {
        connected: 87,
        find: 100,
        reset: 103,
        rollback: 96,
        union: 114,
      },
      rejected: 144,
      undone: 88,
      deepest: 11,
      sets: 40,
    });
  });
});
