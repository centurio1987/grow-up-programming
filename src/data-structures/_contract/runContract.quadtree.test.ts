/**
 * 하네스 자기시험 — `spatial/quadtree` 계약(평면 점 색인 · 범위 질의 · T4-07)과 `spatial/kdTree` 계약의 교차.
 *
 * `./runContract.test.ts` 와 같은 일을 한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실
 * 106·255). 결함 fixture 의 행 귀속은 `./runContract.kdTree.test.ts` 가 고정한다 — 두 스위트의 넣기 · 범위 질의 시나리오가 **같은
 * 객체**라 판정도 같다. 여기서 고정하는 것은 셋이다 — 가져온 항목이 같은 객체라는 것, 이쪽 정본의 계측, 그리고 두 계약이 **서로 담지
 * 않는다**는 것의 두 방향(B19 확정 「다르다」).
 */

import { describe, expect, test } from "bun:test";
import { KDTree } from "../spatial/kdTree/_reference/kdTree";
import {
  COORDINATE_LIMIT,
  fillRandom,
  type KDTreeSurface,
  kdTreeContract,
  nearestOf,
  pointIndexEdges,
} from "../spatial/kdTree/kdTree.contract";
import { Quadtree } from "../spatial/quadtree/_reference/quadtree";
import {
  type Point2D,
  type QuadtreeSurface,
  quadtreeContract,
} from "../spatial/quadtree/quadtree.contract";
import { RegionQuadtree } from "./_fixtures/regionQuadtree";
import { rngFrom } from "./judge";
import {
  type ContractSpec,
  type CostScenario,
  judgeScenario,
} from "./runContract";

/** 축1 을 하네스 밖에서 돈다 — 경계 케이스 전부와 무작위 500 회. 처음 갈린 자리를 돌려주고 없으면 `null`. */
function firstMismatch<Impl, Model>(
  spec: ContractSpec<Impl, Model>,
  factory: () => Impl,
): string | null {
  const byName = new Map(spec.ops.map((op) => [op.name, op] as const));
  const run = (
    steps: readonly { op: string; arg?: unknown }[],
    where: string,
  ): string | null => {
    const impl = factory();
    const model = spec.model();
    for (const [index, step] of steps.entries()) {
      const op = byName.get(step.op);
      if (op === undefined) return `${where} — 없는 연산 ${step.op}`;
      let observed: unknown;
      try {
        observed = op.onImpl(impl, step.arg);
      } catch (error) {
        observed = `던짐: ${(error as Error).name}`;
      }
      const expected = op.onModel(model, step.arg);
      if (JSON.stringify(observed) !== JSON.stringify(expected)) {
        return `${where} ${index}번째 ${step.op}`;
      }
    }
    return null;
  };
  for (const edge of spec.edges) {
    const found = run(edge.steps, `경계 「${edge.name}」`);
    if (found !== null) return found;
  }
  const rng = rngFrom(1);
  const steps = Array.from({ length: 500 }, () => {
    const op = spec.ops[Math.floor(rng() * spec.ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    return { op: op.name, arg: op.arg(rng) };
  });
  return run(steps, "무작위");
}

/** 네 갈래 정본에 좌표 검사와 훑는 최근접을 붙인 구현 — 최근접 행이 비용으로 아무것도 배제하지 않는다는 것을 재는 자리다. */
class ScanNearestQuadtree implements KDTreeSurface {
  readonly #inner = new Quadtree();

  get __cost(): number {
    return this.#inner.__cost;
  }

  insert(point: Point2D): void {
    if (
      !point.every(
        (c) => Number.isInteger(c) && Math.abs(c) <= COORDINATE_LIMIT,
      )
    ) {
      throw new RangeError("좌표는 절댓값이 2^25 이하인 정수여야 한다");
    }
    this.#inner.insert(point);
  }

  rangeSearch(min: Point2D, max: Point2D): Point2D[] {
    return this.#inner.rangeSearch(min, max);
  }

  nearestNeighbor(query: Point2D): Point2D | null {
    if (
      !query.every(
        (c) => Number.isInteger(c) && Math.abs(c) <= COORDINATE_LIMIT,
      )
    ) {
      throw new RangeError("좌표는 절댓값이 2^25 이하인 정수여야 한다");
    }
    const all = this.#inner.rangeSearch(
      [-Infinity, -Infinity],
      [Infinity, Infinity],
    );
    return nearestOf(all, query);
  }
}

function stats<Impl>(
  make: () => Impl & { __cost: number },
  scenario: CostScenario<Impl>,
): { ok: boolean; stats: number[] } {
  const verdict = judgeScenario(
    { kind: "self-reported", make },
    scenario,
    "complexity",
  );
  return {
    ok: verdict.ok,
    stats: verdict.points.map((point) => Number(point.stat.toFixed(2))),
  };
}

describe("가져온 항목은 같은 객체다", () => {
  test("시나리오 셋이 kdTree 스위트의 앞 셋과 같은 객체다", () => {
    quadtreeContract.scenarios.forEach((scenario, index) => {
      expect(scenario).toBe(kdTreeContract.scenarios[index] as never);
    });
    expect(quadtreeContract.scenarios).toHaveLength(3);
  });

  test("경계 케이스 앞 셋이 두 스위트에서 같은 객체다", () => {
    pointIndexEdges.forEach((edge, index) => {
      expect(quadtreeContract.edges[index]).toBe(edge);
      expect(kdTreeContract.edges[index]).toBe(edge);
    });
  });
});

describe("축3 — 네 갈래 정본", () => {
  test("시나리오 셋을 통과한다", () => {
    expect(
      quadtreeContract.scenarios.map((scenario) =>
        stats(() => new Quadtree(), scenario),
      ),
    ).toEqual([
      { ok: true, stats: [113.44, 155.03, 202.63] },
      { ok: true, stats: [113, 205, 365] },
      { ok: true, stats: [1365, 5461, 21845] },
    ]);
  });

  test("넣기를 worst 로 읽으면 걸린다 — 층을 모두 합치는 한 호출", () => {
    expect(
      stats(() => new Quadtree(), {
        ...(quadtreeContract.scenarios[0] as CostScenario<QuadtreeSurface>),
        qualifier: "worst",
      }).ok,
    ).toBe(false);
  });

  test("채운 뒤 가는 띠 n 번을 전부 재도 호출마다 제곱근 계급이다", () => {
    const slabsN: CostScenario<QuadtreeSurface> = {
      covers: ["rangeSearch"],
      qualifier: "worst",
      bound: "O(sqrt n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        fillRandom(impl, n, ctx.rng);
        for (let k = 0; k < n; k++) {
          const c = Math.floor(ctx.rng() * 4 * n) + 0.5;
          ctx.step(() => void impl.rangeSearch([c, -1], [c, 4 * n]));
        }
      },
    };
    expect(stats(() => new Quadtree(), slabsN)).toEqual({
      ok: true,
      stats: [125, 241, 489],
    });
  });

  test("칸의 가운데로 네 등분하는 구현(물려받은 설계)은 가는 띠에서 걸린다", () => {
    expect(
      stats(() => new RegionQuadtree(), quadtreeContract.scenarios[1] as never),
    ).toEqual({
      ok: false,
      stats: [246, 728, 2632],
    });
    expect(
      firstMismatch(quadtreeContract, () => new RegionQuadtree()),
    ).toBeNull();
  });
});

describe("두 계약은 서로 담지 않는다 — B19 확정 「다르다」", () => {
  test("축1 — 두 정본이 제 스위트를 통과한다", () => {
    expect(firstMismatch(quadtreeContract, () => new Quadtree())).toBeNull();
    expect(firstMismatch(kdTreeContract, () => new KDTree())).toBeNull();
  });

  test("kdTree 정본은 이쪽 스위트의 축1 에서 정수 아닌 점을 넣는 자리에서만 갈리고 시나리오 셋을 통과한다", () => {
    expect(firstMismatch(quadtreeContract, () => new KDTree())).toBe(
      "경계 「정수가 아니거나 아주 큰 좌표도 담는다」 0번째 insert",
    );
    // 정수 좌표만 쓰는 경계 케이스 셋은 통과하고, 무작위 시퀀스는 정수 아닌 점을 처음 넣는 자리에서 갈린다.
    expect(
      firstMismatch(
        { ...quadtreeContract, edges: pointIndexEdges },
        () => new KDTree(),
      ),
    ).toBe("무작위 3번째 insert");
    expect(
      quadtreeContract.scenarios.map(
        (scenario) => stats(() => new KDTree(), scenario).ok,
      ),
    ).toEqual([true, true, true]);
  });

  test("같은 호출에 다른 답 — insert([0.5, 2]) 뒤 rangeSearch([0, 0], [1, 3])", () => {
    const quad = new Quadtree();
    quad.insert([0.5, 2]);
    expect(quad.rangeSearch([0, 0], [1, 3])).toEqual([[0.5, 2]]);
    const kd = new KDTree();
    expect(() => kd.insert([0.5, 2])).toThrow(RangeError);
    expect(kd.rangeSearch([0, 0], [1, 3])).toEqual([]);
  });

  test("네 갈래 정본에 훑는 최근접을 붙이면 kdTree 계약을 전부 지킨다 — 최근접 행은 비용으로 배제하는 것이 없다", () => {
    expect(
      firstMismatch(kdTreeContract, () => new ScanNearestQuadtree()),
    ).toBeNull();
    const impl = new ScanNearestQuadtree();
    expect(
      kdTreeContract.scenarios.map((scenario) =>
        stats(() => new ScanNearestQuadtree(), scenario),
      ),
    ).toEqual([
      { ok: true, stats: [113.44, 155.03, 202.63] },
      { ok: true, stats: [113, 205, 365] },
      { ok: true, stats: [1365, 5461, 21845] },
      { ok: true, stats: [1365, 5461, 21845] },
    ]);
    for (const invariant of kdTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });
});
