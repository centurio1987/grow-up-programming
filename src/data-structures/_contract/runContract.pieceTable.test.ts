/**
 * 하네스 자기시험 — `linear/pieceTable` 계약(자리를 인자로 받는 편집 수열 · 편집 비용이 편집 수에 묶인다 · T5-03).
 *
 * `./runContract.test.ts` 와 같은 일을 한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실
 * 106·255). 고정하는 것은 넷이다.
 *
 * 1. **정본 계측** — 시나리오 여섯의 수치.
 * 2. **결함 fixture 의 행 귀속** — 여섯이 축1 을 전부 통과하고 어느 시나리오에서 걸리는지(불변 사실 84 · 182).
 * 3. **`worst` 가 추가로 배제하는 계열** — 추가 버퍼 하나를 두 배로 늘리는 설계가 호출열 전체로는 상한 안이고 한 호출로는
 *    밖이다(불변 사실 183).
 * 4. **`linear/gapBuffer` 계약과 서로 담지 않는다** — 두 설계가 서로의 약속에서 걸리는 입력 둘(불변 사실 54).
 */

import { describe, expect, test } from "bun:test";
import { PieceTable } from "../linear/pieceTable/_reference/pieceTable";
import {
  block,
  type PieceTableContract,
  pieceTableContract,
} from "../linear/pieceTable/pieceTable.contract";
import { CursorGapSequence } from "./_fixtures/cursorGapSequence";
import { DoublingBufferPieceTable } from "./_fixtures/doublingBufferPieceTable";
import { ItemwisePieceTable } from "./_fixtures/itemwisePieceTable";
import { ReplayingEditLog } from "./_fixtures/replayingEditLog";
import { SplicingOffsetSequence } from "./_fixtures/splicingOffsetSequence";
import { SummingLengthPieceTable } from "./_fixtures/summingLengthPieceTable";
import { rngFrom } from "./judge";
import { type CostScenario, judgeScenario } from "./runContract";

type Measured = PieceTableContract<number> & { __cost: number };

/** 축1 을 하네스 밖에서 돈다 — 경계 케이스 전부와 무작위 500 회. 처음 갈린 자리를 돌려주고 없으면 `null`. */
function firstMismatch(factory: () => Measured): string | null {
  const spec = pieceTableContract;
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
      const observed = op.onImpl(impl, step.arg);
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

/** 시나리오 하나를 이 계약의 엄격도로 판정하고 통과 여부와 크기별 통계를 돌려준다. */
function judged(
  make: () => Measured,
  scenario: CostScenario<PieceTableContract<number>>,
): { ok: boolean; stats: number[] } {
  const verdict = judgeScenario(
    { kind: "self-reported", make },
    scenario,
    pieceTableContract.grade,
  );
  return {
    ok: verdict.ok,
    stats: verdict.points.map((point) => Number(point.stat.toFixed(2))),
  };
}

/** 시나리오 여섯의 판정. 순서는 `pieceTable.contract.ts` 의 `scenarios` 순서다. */
function allScenarios(
  make: () => Measured,
): { ok: boolean; stats: number[] }[] {
  return pieceTableContract.scenarios.map((scenario) => judged(make, scenario));
}

describe("pieceTable — 정본 계측", () => {
  test("시나리오 여섯을 통과하고 편집 행은 편집 수에만 묶인다", () => {
    expect(firstMismatch(() => new PieceTable<number>())).toBeNull();
    expect(allScenarios(() => new PieceTable<number>())).toEqual([
      { ok: true, stats: [73, 73] },
      { ok: true, stats: [1037, 4109] },
      { ok: true, stats: [6, 6] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [1026, 4098] },
      { ok: true, stats: [1026, 4098] },
    ]);
  });
});

describe("pieceTable — 결함 fixture 의 행 귀속(여섯 다 축1 통과)", () => {
  test("한 줄로 들고 뒤를 미는 수열 — 편집 적게 넣기 · 지우기 둘에서 걸린다", () => {
    const make = () => new SplicingOffsetSequence<number>();
    expect(firstMismatch(make)).toBeNull();
    expect(allScenarios(make)).toEqual([
      { ok: false, stats: [1054, 4126] },
      { ok: true, stats: [3070, 12286] },
      { ok: false, stats: [2049, 8193] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [1025, 4097] },
      { ok: true, stats: [1025, 4097] },
    ]);
  });

  test("빈 구간을 편집 자리로 옮기는 수열 — 앞과 끝을 번갈아 고치는 둘에서 걸린다", () => {
    const make = () => new CursorGapSequence<number>();
    expect(firstMismatch(make)).toBeNull();
    expect(allScenarios(make)).toEqual([
      { ok: false, stats: [2050, 8194] },
      { ok: true, stats: [5632, 22528] },
      { ok: false, stats: [2049, 8193] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [1025, 4097] },
      { ok: true, stats: [1025, 4097] },
    ]);
  });

  test("원소를 하나씩 따로 넣고 지우는 조각 목록 — 크게 넣기 · 지우기, 그리고 준비가 조각을 n 개 만든 넣기에서 걸린다", () => {
    const make = () => new ItemwisePieceTable<number>();
    expect(firstMismatch(make)).toBeNull();
    expect(allScenarios(make)).toEqual([
      { ok: false, stats: [1058, 4130] },
      { ok: false, stats: [4720129, 75503617] },
      { ok: false, stats: [2625024, 41957376] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [2049, 8193] },
      { ok: true, stats: [2049, 8193] },
    ]);
  });

  test("추가 버퍼 하나를 두 배로 늘리는 조각 목록 — 편집 적게 넣기 하나에서 걸린다", () => {
    const make = () => new DoublingBufferPieceTable<number>();
    expect(firstMismatch(make)).toBeNull();
    expect(allScenarios(make)).toEqual([
      { ok: false, stats: [1028, 4100] },
      { ok: true, stats: [5133, 20493] },
      { ok: true, stats: [6, 6] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [1026, 4098] },
      { ok: true, stats: [1026, 4098] },
    ]);
  });

  test("편집을 적어 두었다 열거할 때 되풀이하는 기록 — 편집 많이 열거 하나에서 걸린다", () => {
    const make = () => new ReplayingEditLog<number>();
    expect(firstMismatch(make)).toBeNull();
    expect(allScenarios(make)).toEqual([
      { ok: true, stats: [2, 2] },
      { ok: true, stats: [1025, 4097] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [1025, 4097] },
      { ok: false, stats: [1576449, 25180161] },
    ]);
  });

  test("길이를 조각마다 더해 세는 조각 목록 — 편집 많이 길이 하나에서 걸린다", () => {
    const make = () => new SummingLengthPieceTable<number>();
    expect(firstMismatch(make)).toBeNull();
    expect(allScenarios(make)).toEqual([
      { ok: true, stats: [113, 113] },
      { ok: true, stats: [1044, 4116] },
      { ok: true, stats: [8, 8] },
      { ok: false, stats: [1025, 4097] },
      { ok: true, stats: [1026, 4098] },
      { ok: true, stats: [1026, 4098] },
    ]);
  });
});

/**
 * 호출열 전체 읽기 — 「넣기 · 편집 적게」와 같은 입력(n 개 한 번에 넣기 + 한 개씩 32 번)을 호출마다 재고, 호출의 몫
 * `m + k`(그 호출까지의 편집 수 + 그 호출이 넣은 수)에 대한 비를 둘로 읽는다. 무작위 자리는 시나리오와 다른 난수열이다.
 */
function sequenceReading(
  make: () => Measured,
  n: number,
): { total: number; single: number } {
  const impl = make();
  const rng = rngFrom(7);
  let edits = 0;
  let spent = 0;
  let allowed = 0;
  let single = 0;
  const call = (k: number, fn: () => void) => {
    const before = impl.__cost;
    fn();
    const cost = impl.__cost - before;
    edits += 1;
    spent += cost;
    allowed += edits + k;
    single = Math.max(single, cost / (edits + k));
  };
  call(n, () => impl.insert(0, block(n)));
  for (let i = 0; i < 32; i++) {
    const length = n + i;
    const offsets = [0, length, length >> 1, Math.floor(rng() * (length + 1))];
    const offset = offsets[i % 4] as number;
    call(1, () => impl.insert(offset, [i]));
  }
  return {
    total: Number((spent / allowed).toFixed(2)),
    single: Number(single.toFixed(2)),
  };
}

describe("pieceTable — `worst` 가 추가로 배제하는 계열", () => {
  test("두 배로 늘리는 추가 버퍼는 호출열 전체로는 상한 안이고 한 호출로는 밖이다 — 넣기마다 제 배열을 짓는 정본은 둘 다 안이다", () => {
    const sizes = [1 << 10, 1 << 12, 1 << 14];
    expect(
      sizes.map((n) => sequenceReading(() => new PieceTable<number>(), n)),
    ).toEqual([
      { total: 1.06, single: 2.19 },
      { total: 1.02, single: 2.19 },
      { total: 1.01, single: 2.19 },
    ]);
    expect(
      sizes.map((n) =>
        sequenceReading(() => new DoublingBufferPieceTable<number>(), n),
      ),
    ).toEqual([
      { total: 1.69, single: 342.67 },
      { total: 1.89, single: 1366.67 },
      { total: 1.97, single: 5462.67 },
    ]);
  });
});

/**
 * `linear/gapBuffer` 가 약속하는 입력 — **한 자리에서 거듭 편집한다.** 긴 수열의 가운데 한 자리에 n 번 넣는다. 커서 계약에서는
 * 커서를 한 번 옮기고 `insert` 를 n 번 부르는 것과 같다(넣은 원소가 그 자리 앞에 쌓이는 순서만 반대다). 그 계약의 `insert` 행이
 * `amortized O(1)` 이므로 호출 평균으로 잰다.
 */
const sameSpotInserts: CostScenario<PieceTableContract<number>> = {
  covers: ["insert"],
  qualifier: "amortized",
  bound: "O(1)",
  adversarial: true,
  run: (impl, n, ctx) => {
    impl.insert(0, block(n));
    const at = n >> 1;
    for (let i = 0; i < n; i++) ctx.step(() => impl.insert(at, [i]));
  },
};

describe("pieceTable — `linear/gapBuffer` 계약과 서로 담지 않는다", () => {
  test("조각 목록은 편집 적은 먼 편집에서 서고 한 자리 거듭 편집에서 걸린다 — 빈 구간 옮기기는 그 반대다", () => {
    const farEdits = pieceTableContract.scenarios[0] as CostScenario<
      PieceTableContract<number>
    >;
    const piece = () => new PieceTable<number>();
    const gap = () => new CursorGapSequence<number>();
    expect({
      pieceFar: judged(piece, farEdits),
      pieceSameSpot: judged(piece, sameSpotInserts),
      gapFar: judged(gap, farEdits),
      gapSameSpot: judged(gap, sameSpotInserts),
    }).toEqual({
      pieceFar: { ok: true, stats: [73, 73] },
      pieceSameSpot: { ok: false, stats: [516.5, 2052.5] },
      gapFar: { ok: false, stats: [2050, 8194] },
      gapSameSpot: { ok: true, stats: [4.5, 4.5] },
    });
  });
});
