/**
 * 하네스 자기시험 — `linear/gapBuffer` 정본의 원소 유실 결함을 고친 뒤(`S21`) 스위트가 그 결함을 떨어뜨리는가.
 *
 * `./runContract.test.ts` 가 이 계약의 정본과 결함 셋을 이미 고정한다. 파일을 따로 둔 이유는
 * `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 106 · 255) — 저쪽에 줄을 넣으면 이 카드 범위 밖 가이드의
 * 인용이 밀린다. 고정하는 것은 넷이다(불변 사실 240 · 241).
 *
 * 1. **고친 정본** — 축1 경계 일곱 · 무작위 500 회를 통과하고, 축3 여섯 시나리오의 수치가 고치기 전과 같다.
 * 2. **옛 정본(`_fixtures/fullGapErasingBuffer.ts`)** — 새 경계 케이스 한 자리에서만 걸리고, 나머지 경계 · 무작위 · 축3 은
 *    고친 정본과 한 자리도 다르지 않다. 비용이 값을 읽지 않으므로 축3 이 이 결함을 볼 길이 없다.
 * 3. **이미 있던 결함 셋** — 새 경계 케이스를 포함한 축1 을 그대로 통과한다(셋 다 값은 옳다).
 * 4. **축3 시나리오가 끝난 상태** — 옛 정본은 여섯 중 다섯이 원소를 잃은 채 끝나고 고친 정본은 하나도 안 잃는다. 시나리오
 *    끝에서 값을 대조할지는 하네스 규격 변경이라 여기서 정하지 않는다 — 이 수치는 그 판단의 입력이다.
 */

import { describe, expect, test } from "bun:test";
import { GapBuffer } from "../linear/gapBuffer/_reference/gapBuffer";
import {
  type GapBufferContract,
  gapBufferContract,
} from "../linear/gapBuffer/gapBuffer.contract";
import { FullGapErasingBuffer } from "./_fixtures/fullGapErasingBuffer";
import { RebuildingEditableSequence } from "./_fixtures/rebuildingEditableSequence";
import { RecountingEditableSequence } from "./_fixtures/recountingEditableSequence";
import { SplicingEditableSequence } from "./_fixtures/splicingEditableSequence";
import { rngFrom } from "./judge";
import { judgeScenario } from "./runContract";

type Measured = GapBufferContract<number> & { __cost: number };
type Steps = readonly { op: string; arg?: unknown }[];

/** 걸음열을 참조 모델과 나란히 돌려 처음 갈린 자리를 돌려준다. 없으면 `null`. */
function split(factory: () => Measured, steps: Steps): string | null {
  const byName = new Map(
    gapBufferContract.ops.map((op) => [op.name, op] as const),
  );
  const impl = factory();
  const model = gapBufferContract.model();
  for (const [index, step] of steps.entries()) {
    const op = byName.get(step.op);
    if (op === undefined) return `없는 연산 ${step.op}`;
    const observed = JSON.stringify(op.onImpl(impl, step.arg) ?? null);
    const expected = JSON.stringify(op.onModel(model, step.arg) ?? null);
    if (observed !== expected) {
      return `${index}번째 ${step.op} — 관측 ${observed} / 모델 ${expected}`;
    }
  }
  return null;
}

/** 경계 케이스마다 갈린 자리. 갈리지 않은 케이스는 싣지 않는다. */
function edgeSplits(factory: () => Measured): Record<string, string> {
  const found: Record<string, string> = {};
  for (const edge of gapBufferContract.edges) {
    const at = split(factory, edge.steps);
    if (at !== null) found[edge.name] = at;
  }
  return found;
}

/** 하네스 축1 과 같은 무작위 500 회(seed 1). */
function randomSplit(factory: () => Measured): string | null {
  const rng = rngFrom(1);
  const steps = Array.from({ length: 500 }, () => {
    const op =
      gapBufferContract.ops[Math.floor(rng() * gapBufferContract.ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비었다");
    return { op: op.name, arg: op.arg(rng) };
  });
  return split(factory, steps);
}

/** 여섯 시나리오의 판정과 크기별 통계. 순서는 `gapBuffer.contract.ts` 의 `scenarios` 순서다. */
function scenarioStats(
  make: () => Measured,
): { ok: boolean; stats: number[] }[] {
  return gapBufferContract.scenarios.map((scenario) => {
    const verdict = judgeScenario(
      { kind: "self-reported", make },
      scenario,
      gapBufferContract.grade,
    );
    return {
      ok: verdict.ok,
      stats: verdict.points.map((point) => Number(point.stat.toFixed(2))),
    };
  });
}

/** 시나리오 여섯을 크기 n 에서 한 번씩 돌린 뒤 `toArray()` 에 남은 빈 칸 수. 넣은 값은 전부 수라 빈 칸이 곧 잃은 원소다. */
function lostAtScenarioEnd(make: () => Measured, n: number): number[] {
  return gapBufferContract.scenarios.map((scenario) => {
    const impl = make();
    scenario.run(impl, n, { rng: rngFrom(1), step: (fn) => fn() });
    return impl.toArray().filter((item) => item === undefined).length;
  });
}

const reference = () => new GapBuffer<number>();
const erasing = () => new FullGapErasingBuffer<number>();

/** 고치기 전과 후가 같아야 하는 축3 수치(`./runContract.test.ts` 가 판정만 고정한 여섯). */
const REFERENCE_STATS = [
  { ok: true, stats: [2, 2] },
  { ok: true, stats: [1, 1] },
  { ok: true, stats: [4, 4] },
  { ok: true, stats: [2050, 8194] },
  { ok: true, stats: [2, 2] },
  { ok: true, stats: [1025, 4097] },
];

describe("gapBuffer — 고친 정본", () => {
  test("축1 경계 일곱과 무작위 500 회를 통과하고 축3 수치는 고치기 전과 같다", () => {
    expect(gapBufferContract.edges).toHaveLength(7);
    expect(edgeSplits(reference)).toEqual({});
    expect(randomSplit(reference)).toBeNull();
    expect(scenarioStats(reference)).toEqual(REFERENCE_STATS);
  }, 60_000);
});

describe("gapBuffer — 옛 정본(칸이 꼭 찼을 때 커서를 옮기면 원소를 지운다)", () => {
  test("새 경계 케이스의 크기 8 첫 읽기에서만 걸리고, 무작위 500 회와 축3 은 고친 정본과 같다", () => {
    expect(edgeSplits(erasing)).toEqual({
      "넣은 직후 크기마다 커서를 옮겼다 되돌려도 수열이 그대로다":
        "37번째 toArray — 관측 [1,2,3,4,null,null,null,null] / 모델 [1,2,3,4,5,6,7,8]",
    });
    expect(randomSplit(erasing)).toBeNull();
    expect(scenarioStats(erasing)).toEqual(REFERENCE_STATS);
  }, 60_000);

  test("축3 시나리오가 끝난 상태에서 옛 정본은 다섯 시나리오가 원소를 잃고 고친 정본은 하나도 안 잃는다", () => {
    expect(lostAtScenarioEnd(erasing, 1 << 10)).toEqual([
      512, 512, 1, 1024, 512, 0,
    ]);
    expect(lostAtScenarioEnd(reference, 1 << 10)).toEqual([0, 0, 0, 0, 0, 0]);
    // 채운 뒤 칸이 꼭 차지 않는 크기(1,000)에서는 옛 정본도 잃지 않는다. 사다리가 2 의 거듭제곱이라 시나리오 다섯이
    // 그 상태를 지나갔고, 값을 보지 않아 통과했다.
    expect(lostAtScenarioEnd(erasing, 1000)).toEqual([0, 0, 0, 0, 0, 0]);
  }, 60_000);
});

describe("gapBuffer — 이미 있던 결함 셋은 새 경계 케이스에서도 값이 옳다", () => {
  test("뒤를 미는 배열 하나 · 옮길 때마다 다시 짓는 두 배열 · 물을 때마다 세는 두 배열이 축1 을 전부 통과한다", () => {
    for (const make of [
      () => new SplicingEditableSequence<number>(),
      () => new RebuildingEditableSequence<number>(),
      () => new RecountingEditableSequence<number>(),
    ]) {
      expect(edgeSplits(make)).toEqual({});
      expect(randomSplit(make)).toBeNull();
    }
  }, 60_000);
});
