/**
 * 하네스 자기시험 — `disjoint-set/unionFind` 계약(분리 집합 · T3-04).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 통과시키는지가 아니라 **계약을 어긴 구현을
 * 실제로 떨어뜨리는지**, 그리고 **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는
 * `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 106·255).
 *
 * **셋째 묶음이 역아커만 함수를 `O(1)` 로 접는 처분의 수치다**(`docs/ORD-006-conventions.md` 「`unionFind` 의
 * Bound 는 늘리지 않는다」 — 확정이고 다시 열지 않는다). 그 절이 적은 「경로 압축 없는 구현을 배제하려는 근거는
 * 축이 아니라 가이드가 받는다」를, 로그 인수만큼 어기는 구현 둘이 스위트를 통과하고 그 로그가 `O(1)` 구간과
 * `O(log n)` 구간에 **함께** 든다는 것으로 못 박는다. 그 입력(짝지어 두 배씩 합치기)은 아무것도 가르지 못하므로
 * 계약 스위트에 넣지 않았다(불변 사실 57).
 */

import { describe, expect, test } from "bun:test";
import { UnionFind as Reference } from "../disjoint-set/unionFind/_reference/unionFind";
import {
  PartitionSite,
  type UnionFindContract,
  unionFindContract,
} from "../disjoint-set/unionFind/unionFind.contract";
import { LinkingPartition } from "./_fixtures/linkingPartition";
import { RelabelingPartition } from "./_fixtures/relabelingPartition";
import { judgeGrowth, rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = UnionFindContract & { __cost: number };

function site(make: (n: number) => Measured): CostSource<PartitionSite> {
  return { kind: "self-reported", make: () => new PartitionSite(make) };
}

const reference = site((n) => new Reference(n));
const underSecond = site((n) => new LinkingPartition(n, "underSecond"));
const underFirst = site((n) => new LinkingPartition(n, "underFirst"));
const byRank = site((n) => new LinkingPartition(n, "byRank"));
const relabelFirst = site((n) => new RelabelingPartition(n, "first"));
const relabelSmaller = site((n) => new RelabelingPartition(n, "smaller"));

function labelOf(scenario: CostScenario<PartitionSite>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function outcomes(cost: CostSource<PartitionSite>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of unionFindContract.scenarios) {
    result[labelOf(scenario)] = judgeScenario(cost, scenario, "complexity").ok;
  }
  return result;
}

function statsOf(
  cost: CostSource<PartitionSite>,
  scenario: CostScenario<PartitionSite> | string,
): number[] {
  const chosen =
    typeof scenario === "string"
      ? unionFindContract.scenarios.find((each) => labelOf(each) === scenario)
      : scenario;
  if (!chosen) throw new Error(`시나리오를 못 찾았다: ${String(scenario)}`);
  return judgeScenario(cost, chosen, "complexity").points.map(
    (point) => point.stat,
  );
}

/** 소수 둘째 자리까지. */
function hundredths(value: number): number {
  return Math.round(value * 100) / 100;
}

const UNION = "union (적대적)";
const QUERIES = "find·connected (적대적)";
const MIXED = "union·find·connected";

/** 축1 경계 케이스에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(
  make: (n: number) => UnionFindContract,
): string | null {
  const byName = new Map(
    unionFindContract.ops.map((op) => [op.name, op] as const),
  );
  for (const edge of unionFindContract.edges) {
    const impl = new PartitionSite(make);
    const model = unionFindContract.model();
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

/**
 * 뿌리를 그대로 이름표로 돌려주는 숲. 헤더 「목적」의 선택(이름표 = 가장 작은 원소)이 관측되는 약속이라는
 * 것을 보이려고 여기서만 짓는다 — 비용을 재지 않으므로 결함 fixture 파일로 두지 않았다.
 */
class RootNamingForest implements UnionFindContract {
  readonly #parent: number[];
  readonly #size: number[];
  readonly #link: "underSecond" | "underFirst" | "bySize";

  constructor(n: number, link: "underSecond" | "underFirst" | "bySize") {
    if (!Number.isInteger(n) || n < 0) throw new RangeError(`원소 수 ${n}`);
    this.#parent = Array.from({ length: n }, (_, at) => at);
    this.#size = Array.from({ length: n }, () => 1);
    this.#link = link;
  }

  find(x: number): number {
    return this.#root(x);
  }

  union(x: number, y: number): void {
    const left = this.#root(x);
    const right = this.#root(y);
    if (left === right) return;
    let child = left;
    let parent = right;
    if (this.#link === "underFirst") [child, parent] = [right, left];
    if (this.#link === "bySize") {
      [child, parent] =
        (this.#size[left] as number) < (this.#size[right] as number)
          ? [left, right]
          : [right, left];
    }
    this.#parent[child] = parent;
    this.#size[parent] =
      (this.#size[parent] as number) + (this.#size[child] as number);
  }

  connected(x: number, y: number): boolean {
    return this.#root(x) === this.#root(y);
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

describe("축3 — 분리 집합 계약의 정본과 자명한 구현", () => {
  test("정본이 세 시나리오를 전부 통과한다", () => {
    expect(outcomes(reference)).toEqual({
      [UNION]: true,
      [QUERIES]: true,
      [MIXED]: true,
    });
    // 적대적 둘에서 정본의 나무는 별 모양이라 길 줄이기가 하는 일이 없다 — 걸음이 사다리 세 점에서 같다.
    expect(statsOf(reference, UNION).map(hundredths)).toEqual([1.5, 1.5, 1.5]);
    expect(statsOf(reference, QUERIES).map(hundredths)).toEqual([4.99, 5, 5]);
  }, 60_000);

  /**
   * **인자 순서로 거는 숲은 두 방향이 서로의 거울상이고, 스위트는 한 호출열에서 둘을 함께 겨눈다.** 한 방향만
   * 겨누면 반대 방향이 그 시나리오를 상수로 통과한다 — 합치기 시나리오의 두 절반이 각자 한 방향을 맡는다.
   */
  test("인자 순서로 거는 숲은 두 방향 모두 세 시나리오 전부에서 걸린다", () => {
    for (const forest of [underSecond, underFirst]) {
      expect(outcomes(forest)).toEqual({
        [UNION]: false,
        [QUERIES]: false,
        [MIXED]: false,
      });
      expect(statsOf(forest, UNION).map(hundredths)).toEqual([
        128.75, 512.75, 2048.75,
      ]);
    }
  }, 60_000);

  test("한쪽 번호표를 전부 다시 적는 구현은 합치기가 든 두 시나리오에서만 걸린다", () => {
    expect(outcomes(relabelFirst)).toEqual({
      [UNION]: false,
      [QUERIES]: true,
      [MIXED]: false,
    });
    expect(statsOf(relabelFirst, UNION).map(hundredths)).toEqual([
      129.25, 513.25, 2049.25,
    ]);
    expect(statsOf(relabelFirst, QUERIES)).toEqual([2, 2, 2]);
  }, 60_000);
});

describe("축1 — 이름표가 가장 작은 원소라는 약속이 관측된다", () => {
  test("정본과 결함 fixture 다섯은 경계 케이스를 전부 통과한다", () => {
    expect(firstBehaviorSplit((n) => new Reference(n))).toBeNull();
    for (const policy of ["underSecond", "underFirst", "byRank"] as const) {
      expect(
        firstBehaviorSplit((n) => new LinkingPartition(n, policy)),
      ).toBeNull();
    }
    for (const policy of ["first", "smaller"] as const) {
      expect(
        firstBehaviorSplit((n) => new RelabelingPartition(n, policy)),
      ).toBeNull();
    }
  });

  test("뿌리를 그대로 이름표로 돌려주는 숲은 인자 순서로 걸든 크기로 걸든 경계 케이스에서 갈린다", () => {
    expect(
      firstBehaviorSplit((n) => new RootNamingForest(n, "underSecond")),
    ).toBe(
      "합치면 이름표가 합친 집합의 가장 작은 원소가 된다 / 4번째 find — 관측 9 / 모델 2",
    );
    expect(
      firstBehaviorSplit((n) => new RootNamingForest(n, "underFirst")),
    ).toBe(
      "합치면 이름표가 합친 집합의 가장 작은 원소가 된다 / 1번째 find — 관측 5 / 모델 2",
    );
    expect(firstBehaviorSplit((n) => new RootNamingForest(n, "bySize"))).toBe(
      "합치면 이름표가 합친 집합의 가장 작은 원소가 된다 / 1번째 find — 관측 5 / 모델 2",
    );
  });

  /**
   * **무작위 시퀀스가 합치기가 쌓이는 동안 거절 경로와 함께 돈다.** 원소 48 · seed 1 · 500 회에서 합치기 143 회 중
   * 집합 수를 줄인 것이 47 회이고, 집합이 하나로 몰리는 것은 347 번째 걸음이다 — 그 뒤 150 걸음은 `find` 가 0 만
   * 돌려준다(`unionFind.contract.ts` 머리말). 거절은 `reset` 124 회와 범위 밖 원소 53 회다.
   */
  test("seed 1 · 500 회 무작위 시퀀스의 연산 분포와 끝 상태", () => {
    const rng = rngFrom(1);
    const model = unionFindContract.model();
    const counts: Record<string, number> = {};
    let rejected = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        unionFindContract.ops[Math.floor(rng() * unionFindContract.ops.length)];
      if (op === undefined) throw new Error("연산 목록이 비었다");
      const observed = op.onModel(model, op.arg(rng));
      counts[op.name] = (counts[op.name] ?? 0) + 1;
      if (observed === "RangeError") rejected += 1;
    }
    const sets = new Set(model.smallest).size;
    expect({ counts, rejected, sets }).toEqual({
      counts: { connected: 115, find: 118, reset: 124, union: 143 },
      rejected: 177,
      sets: 1,
    });
  });
});

/** 짝지어 두 배씩 합친다 — 크기 1 끼리, 2 끼리, 4 끼리 … 합치기가 모두 같은 크기의 두 집합을 만난다. */
function mergeByDoubling(impl: PartitionSite, n: number): void {
  for (let width = 1; width < n; width *= 2) {
    for (let at = 0; at + width < n; at += 2 * width) {
      impl.union(at, at + width);
    }
  }
}

const doublingUnions: CostScenario<PartitionSite> = {
  covers: ["union"],
  qualifier: "amortized",
  bound: "O(1)",
  adversarial: true,
  run: (impl, n, ctx) => {
    impl.reset(n);
    for (let width = 1; width < n; width *= 2) {
      for (let at = 0; at + width < n; at += 2 * width) {
        ctx.step(() => impl.union(at, at + width));
      }
    }
    ctx.step(() => impl.union(0, n - 1));
  },
};

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
      for (let x = n - 1; x >= 0; x--) ctx.step(() => impl.find(x));
    },
  };
}

describe("축3 — 역아커만 함수를 O(1) 로 접는 처분의 수치(확정 · 다시 열지 않는다)", () => {
  test("로그 인수만큼 어기는 구현 둘이 계약 스위트 셋을 전부 통과한다", () => {
    for (const hidden of [byRank, relabelSmaller]) {
      expect(outcomes(hidden)).toEqual({
        [UNION]: true,
        [QUERIES]: true,
        [MIXED]: true,
      });
    }
  }, 60_000);

  /**
   * **짝지어 두 배씩 합치면 두 구현이 각자 걸리는 행에서 원소 수의 로그를 그대로 찍는다** — 높이로 거는 숲의 찾기,
   * 작은 쪽을 다시 적는 구현의 합치기가 6 · 7 · 8 이다. 그런데 비율 1.17 · 1.14 가 `O(1)` 구간(0.70~1.30)과
   * `O(log n)` 구간(0.84~1.56 · 0.82~1.52)에 **함께** 든다. 정본은 같은 입력에서 3.0 · 1.0 안팎으로 머문다.
   */
  test("그 로그가 O(1) 과 O(log n) 판정을 함께 통과한다", () => {
    const rankFind = statsOf(byRank, doublingThenFind("amortized"));
    const smallerUnion = statsOf(relabelSmaller, doublingUnions);
    expect(rankFind).toEqual([6, 7, 8]);
    expect(smallerUnion.map(hundredths)).toEqual([6, 7, 8]);
    for (const stats of [rankFind, smallerUnion]) {
      const points = stats.map((stat, at) => ({ n: 1024 * 4 ** at, stat }));
      expect(judgeGrowth("O(1)", "discriminating", points).ok).toBe(true);
      expect(judgeGrowth("O(log n)", "discriminating", points).ok).toBe(true);
    }
    expect(
      statsOf(reference, doublingThenFind("amortized")).map(hundredths),
    ).toEqual([2.99, 3, 3]);
    expect(statsOf(reference, doublingUnions).map(hundredths)).toEqual([
      1.01, 1, 1,
    ]);
  }, 60_000);

  /**
   * **정본의 한 호출은 원소 수의 로그만큼 걷는다 — `amortized` 를 적은 근거다.** 같은 입력에서 큰 번호부터 찾으면
   * 줄이기 전의 긴 길을 처음 오르는 호출이 11 · 13 · 15 이고 호출 평균은 3.0 안팎이다. 이 입력은 정본이 같은
   * 크기끼리 합칠 때 어느 뿌리를 아래에 거는지에 기대므로 계약 스위트의 시나리오가 아니다(불변 사실 44·264).
   * **`worst` 로 읽어도 이 갈림이 안 보인다** — 비율 1.18 · 1.15 가 `O(1)` 구간 안이라 통과한다.
   */
  test("정본의 단일 호출 최대가 로그를 따라가도 worst O(1) 판정을 통과한다", () => {
    const verdict = judgeScenario(
      reference,
      doublingThenFind("worst"),
      "complexity",
    );
    expect(verdict.points.map((point) => point.stat)).toEqual([11, 13, 15]);
    expect(verdict.ok).toBe(true);
  }, 60_000);
});
