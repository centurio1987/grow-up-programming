/**
 * 하네스 자기시험 — `spatial/kdTree` 계약(평면 점 색인 · 범위 질의 · 최근접 · T4-06).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고 **떨어뜨리지
 * 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 넷이다 — 축3 결함 계열의 행 귀속, 세로 띠와 가로 띠를 번갈아 묻는 근거, 두 한정자(넣기 `amortized` · 범위 `worst`)의
 * 근거, 최근접 상한이 정본에게서 원 위의 입력으로만 나온다는 것. `spatial/quadtree` 와의 교차는 그쪽 자기시험이 받는다.
 */

import { describe, expect, test } from "bun:test";
import { KDTree as Reference } from "../spatial/kdTree/_reference/kdTree";
import {
  fillFlanked,
  fillRandom,
  type KDTreeSurface,
  kdTreeContract,
  LINES,
  nearestScenario,
  STEPS,
  slabScenario,
} from "../spatial/kdTree/kdTree.contract";
import { BufferedPointIndex } from "./_fixtures/bufferedPointIndex";
import { RegionQuadtree } from "./_fixtures/regionQuadtree";
import { ScanningPointSet } from "./_fixtures/scanningPointSet";
import { SortedOutputPointIndex } from "./_fixtures/sortedOutputPointIndex";
import { UnbalancedPointTree } from "./_fixtures/unbalancedPointTree";
import { XSortedRunsPointSet } from "./_fixtures/xSortedRunsPointSet";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = KDTreeSurface & { __cost: number };

function self(make: () => Measured): CostSource<KDTreeSurface> {
  return { kind: "self-reported", make };
}

const makers = {
  reference: () => new Reference(),
  scanning: () => new ScanningPointSet(),
  unbalanced: () => new UnbalancedPointTree(),
  sortedOutput: () => new SortedOutputPointIndex(),
  buffered: () => new BufferedPointIndex(),
  xSortedRuns: () => new XSortedRunsPointSet(),
  region: () => new RegionQuadtree(),
} satisfies Record<string, () => Measured>;

/** 시나리오 네 개의 이름 — 표의 행 이름에 bound 를 붙여 같은 행의 두 시나리오를 가른다. */
function label(scenario: CostScenario<KDTreeSurface>): string {
  return `${scenario.covers.join("·")} ${scenario.bound}`;
}

function verdicts(make: () => Measured): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of kdTreeContract.scenarios) {
    result[label(scenario)] = judgeScenario(
      self(make),
      scenario,
      "complexity",
    ).ok;
  }
  return result;
}

function stats(
  make: () => Measured,
  scenario: CostScenario<KDTreeSurface>,
): { ok: boolean; stats: number[] } {
  const verdict = judgeScenario(self(make), scenario, "complexity");
  return {
    ok: verdict.ok,
    stats: verdict.points.map((point) => Number(point.stat.toFixed(2))),
  };
}

const INSERT = "insert O(log n)";
const SLAB = "rangeSearch O(sqrt n)";
const WHOLE = "rangeSearch O(n)";
const NEAREST = "nearestNeighbor O(n)";

describe("축3 — 평면 점 색인의 정본과 결함 계열(행 귀속)", () => {
  test("정본이 시나리오 넷을 통과한다", () => {
    expect(verdicts(makers.reference)).toEqual({
      [INSERT]: true,
      [SLAB]: true,
      [WHOLE]: true,
      [NEAREST]: true,
    });
    const [insert, slab, whole, nearest] = kdTreeContract.scenarios.map(
      (scenario) => stats(makers.reference, scenario).stats,
    );
    expect(insert).toEqual([118.44, 160.03, 207.62]);
    expect(slab).toEqual([108, 189, 337]);
    expect(whole).toEqual([1024, 4096, 16384]);
    expect(nearest).toEqual([1024, 4096, 16384]);
  });

  test("훑는 배열은 가는 띠에서만 걸린다 — 등급의 반례", () => {
    expect(verdicts(makers.scanning)).toEqual({
      [INSERT]: true,
      [SLAB]: false,
      [WHOLE]: true,
      [NEAREST]: true,
    });
  });

  test("다시 짓지 않는 나무는 대각선 넣기에서만 걸린다", () => {
    expect(verdicts(makers.unbalanced)).toEqual({
      [INSERT]: false,
      [SLAB]: true,
      [WHOLE]: true,
      [NEAREST]: true,
    });
    expect(
      stats(makers.unbalanced, kdTreeContract.scenarios[0] as never),
    ).toEqual({
      ok: false,
      stats: [511.5, 2047.5, 8191.5],
    });
  });

  test("답을 삽입 정렬로 늘어놓는 구현은 전부 담는 사각형(k = n)에서만 걸린다", () => {
    expect(verdicts(makers.sortedOutput)).toEqual({
      [INSERT]: true,
      [SLAB]: true,
      [WHOLE]: false,
      [NEAREST]: true,
    });
  });

  test("넣기를 쌓아 두는 구현은 질의 셋에서 걸리고 넣기를 통과한다", () => {
    expect(verdicts(makers.buffered)).toEqual({
      [INSERT]: true,
      [SLAB]: false,
      [WHOLE]: false,
      [NEAREST]: false,
    });
  });

  test("x 순 배열 묶음은 가는 띠에서만 걸린다", () => {
    expect(verdicts(makers.xSortedRuns)).toEqual({
      [INSERT]: true,
      [SLAB]: false,
      [WHOLE]: true,
      [NEAREST]: true,
    });
  });

  test("칸의 가운데로 네 등분하는 구현은 가는 띠에서만 걸린다 — 띠 양옆에 몰린 점", () => {
    expect(verdicts(makers.region)).toEqual({
      [INSERT]: true,
      [SLAB]: false,
      [WHOLE]: true,
      [NEAREST]: true,
    });
    expect(stats(makers.region, slabScenario)).toEqual({
      ok: false,
      stats: [246, 728, 2632],
    });
  });
});

/** 가는 띠 시나리오에서 한 방향만 남긴 사본. 채우기는 같고, 세로 줄만 · 가로 줄만 묻는다. 번갈아 묻는 근거를 재는 자리다. */
function oneDirection(vertical: boolean): CostScenario<KDTreeSurface> {
  return {
    ...slabScenario,
    run: (impl, n, ctx) => {
      const lines = fillFlanked(impl, n, ctx.rng);
      for (let k = 0; k < STEPS; k++) {
        const line = 2 * (k % (LINES / 2)) + (vertical ? 0 : 1);
        const c = (lines[line] as number) + 0.5;
        ctx.step(() =>
          vertical
            ? void impl.rangeSearch([c, -1], [c, 4 * n])
            : void impl.rangeSearch([-1, c], [4 * n, c]),
        );
      }
    },
  };
}

/** 무작위로만 채운 가는 띠(양옆에 몰린 점이 없다). 네 등분하는 구현이 무엇에 걸리는지 가르는 자리다. */
const uniformSlab: CostScenario<KDTreeSurface> = {
  ...slabScenario,
  run: (impl, n, ctx) => {
    fillRandom(impl, n, ctx.rng);
    for (let k = 0; k < STEPS; k++) {
      const c = Math.floor(ctx.rng() * 4 * n) + 0.5;
      ctx.step(() =>
        k % 2 === 0
          ? void impl.rangeSearch([c, -1], [c, 4 * n])
          : void impl.rangeSearch([-1, c], [4 * n, c]),
      );
    }
  },
};

describe("축3 — 가는 띠 시나리오의 채우기와 방향", () => {
  test("무작위로만 채우면 네 등분하는 구현이 통과한다 — 양옆에 몰린 점이 그것을 가른다", () => {
    expect(stats(makers.region, uniformSlab)).toEqual({
      ok: true,
      stats: [169, 320, 597],
    });
    expect(stats(makers.reference, uniformSlab).ok).toBe(true);
  });

  test("x 순 배열 묶음은 세로 띠만이면 계급 아래로 · 가로 띠만이면 담긴 수에 비례해 걸린다", () => {
    expect(stats(makers.xSortedRuns, oneDirection(true))).toEqual({
      ok: false,
      stats: [11, 13, 15],
    });
    expect(stats(makers.xSortedRuns, oneDirection(false))).toEqual({
      ok: false,
      stats: [1035, 4109, 16399],
    });
  });

  test("정본은 두 방향 모두 제곱근 계급이다", () => {
    expect(stats(makers.reference, oneDirection(true))).toEqual({
      ok: true,
      stats: [75, 111, 183],
    });
    expect(stats(makers.reference, oneDirection(false))).toEqual({
      ok: true,
      stats: [108, 189, 337],
    });
  });
});

describe("한정자의 근거", () => {
  test("넣기를 worst 로 읽으면 정본이 걸린다 — 층을 모두 합치는 한 호출", () => {
    expect(
      stats(makers.reference, {
        ...(kdTreeContract.scenarios[0] as CostScenario<KDTreeSurface>),
        qualifier: "worst",
      }),
    ).toEqual({ ok: false, stats: [34933, 164249, 755229] });
  });

  /** 채우기는 준비로 두고 가는 띠 n 번을 전부 잰다 — 두 통계로 읽는다. */
  const slabsN = (
    qualifier: "worst" | "amortized",
  ): CostScenario<KDTreeSurface> => ({
    covers: ["rangeSearch"],
    qualifier,
    bound: "O(sqrt n)",
    adversarial: true,
    run: (impl, n, ctx) => {
      fillRandom(impl, n, ctx.rng);
      for (let k = 0; k < n; k++) {
        const c = Math.floor(ctx.rng() * 4 * n) + 0.5;
        ctx.step(() => void impl.rangeSearch([c, -1], [c, 4 * n]));
      }
    },
  });

  test("범위 질의 worst 가 넣기를 쌓아 두는 계열을 배제하고 amortized 는 통과시킨다", () => {
    expect(stats(makers.buffered, slabsN("worst"))).toEqual({
      ok: false,
      stats: [125557, 695742, 3689685],
    });
    expect(stats(makers.buffered, slabsN("amortized"))).toEqual({
      ok: true,
      stats: [193.78, 314.08, 515.33],
    });
    expect(stats(makers.reference, slabsN("worst"))).toEqual({
      ok: true,
      stats: [89, 177, 361],
    });
  });

  test("최근접 worst 는 쌓아 두는 계열을 경계에서만 가른다(비율 5.35 · 5.16)", () => {
    // 원 위의 점을 준비로 넣고 최근접 여덟 번을 재는 스위트 시나리오 그대로다 — 쌓인 점을 넣는 첫 호출이 최댓값이다.
    expect(stats(makers.buffered, nearestScenario)).toEqual({
      ok: false,
      stats: [103247, 552459, 2849595],
    });
  });
});

describe("최근접 상한 — 정본이 O(n) 을 내는 입력은 원 위의 점이다", () => {
  const randomNearest = (
    bound: "O(n)" | "O(log n)",
  ): CostScenario<KDTreeSurface> => ({
    ...nearestScenario,
    bound,
    run: (impl, n, ctx) => {
      fillRandom(impl, n, ctx.rng);
      for (let k = 0; k < 8; k++) {
        const query: [number, number] = [
          Math.floor(ctx.rng() * 4 * n),
          Math.floor(ctx.rng() * 4 * n),
        ];
        ctx.step(() => void impl.nearestNeighbor(query));
      }
    },
  });

  test("무작위로 채우면 정본이 로그 쪽이라 O(n) 을 계급 아래로 못 통과한다", () => {
    expect(stats(makers.reference, randomNearest("O(n)"))).toEqual({
      ok: false,
      stats: [37, 37, 47],
    });
    expect(stats(makers.reference, randomNearest("O(log n)")).ok).toBe(true);
  });

  test("축1 무작위 시퀀스가 최근접 동률과 정의역 밖 호출을 실제로 지난다", () => {
    const rng = rngFrom(1);
    const model: [number, number][] = [];
    let ties = 0;
    let rejected = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        kdTreeContract.ops[Math.floor(rng() * kdTreeContract.ops.length)];
      if (op === undefined) throw new Error("연산 목록이 비었다");
      const arg = op.arg(rng);
      const result = op.onModel({ points: model }, arg);
      if (result === "RangeError") rejected++;
      if (op.name === "nearestNeighbor" && result !== "RangeError") {
        const [x, y] = arg as [number, number];
        const distances = model.map((p) => (p[0] - x) ** 2 + (p[1] - y) ** 2);
        const least = Math.min(...distances);
        const coords = new Set(
          model
            .filter((_, i) => distances[i] === least)
            .map((p) => `${p[0]},${p[1]}`),
        );
        if (coords.size > 1) ties++;
      }
    }
    expect({ points: model.length, ties, rejected }).toEqual({
      points: 156,
      ties: 28,
      rejected: 41,
    });
  });
});
