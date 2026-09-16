/**
 * 하네스 자기시험 — 값 검증 실행(`./runValues.ts`)이 무엇을 잡고 무엇을 안 건드리는가.
 *
 * 고정하는 것이 넷이다.
 *
 * 1. **선택 인자는 계측을 안 바꾼다.** 기대를 붙인 시나리오와 기대를 벗긴 사본을 `measureScenario` 로
 *    재면 연산당 비용 · 총 비용 · 주입 tick 이 전부 같다. 「측정 실행은 선택 인자를 평가하지 않는다」를
 *    수치로 세우는 자리다.
 * 2. **값 검사와 성장률 판정은 독립이다.** `linear/gapBuffer` 옛 정본(`./_fixtures/fullGapErasingBuffer.ts`)이
 *    값 검사에서 걸리면서 **축3 판정은 고친 정본과 한 자리도 다르지 않게 통과한다.** 이것이 없으면
 *    「값도 본다」가 빈말이다.
 * 3. **한 점을 2 의 거듭제곱으로 둔 근거.** 같은 옛 정본이 크기 1,000 에서는 값 검사를 통과한다 —
 *    칸이 꼭 차는 크기를 안 지나가기 때문이다(`./runValues.ts` 의 `VALUE_SIZE` 주석).
 * 4. **걸음 반환값 기대의 실효.** `tree/treap` 아홉째 시나리오의 탐침 조회는 항상 참이어야 한다. 값만
 *    거짓말하고 비용은 정본과 똑같은 구현을 태우면 **값 검사가 걸고 성장률 판정은 통과시킨다.**
 *
 * 파일을 따로 둔 이유는 `./runContract.gapBuffer.test.ts` 머리말과 같다(런북 불변 사실 106 · 255) —
 * `./runContract.test.ts` 에 줄을 넣으면 이 카드 범위 밖 가이드의 인용이 밀린다.
 */

import { describe, expect, test } from "bun:test";
import { GapBuffer } from "../linear/gapBuffer/_reference/gapBuffer";
import {
  type GapBufferContract,
  gapBufferContract,
} from "../linear/gapBuffer/gapBuffer.contract";
import { Treap } from "../tree/treap/_reference/treap";
import {
  type TreapContract,
  treapContract,
} from "../tree/treap/treap.contract";
import { FullGapErasingBuffer } from "./_fixtures/fullGapErasingBuffer";
import type { CostScenario } from "./runContract";
import { judgeScenario, measureScenario } from "./runContract";
import { judgeValues, VALUE_SIZE } from "./runValues";

type MeasuredBuffer = GapBufferContract<number> & { __cost: number };
type MeasuredTreap = TreapContract<number> & { __cost: number };

const reference = () => new GapBuffer<number>();
const erasing = () => new FullGapErasingBuffer<number>();

/**
 * 기대를 벗긴 사본 — `ctx.step` 의 둘째 인자를 **버리고** 같은 걸음을 부르고, 끝 상태 검사도 떼어 낸다.
 * 이 사본과 원본의 계측값이 같다는 것이 「선택 인자는 측정 경로를 건드리지 않는다」다.
 */
function withoutChecks<Impl>(scenario: CostScenario<Impl>): CostScenario<Impl> {
  const stripped: CostScenario<Impl> = {
    covers: scenario.covers,
    qualifier: scenario.qualifier,
    bound: scenario.bound,
    adversarial: scenario.adversarial,
    run: (impl, n, ctx) =>
      scenario.run(impl, n, { rng: ctx.rng, step: (fn) => ctx.step(fn) }),
  };
  return stripped;
}

/** 시나리오 하나를 크기 n · seed 1 로 재서 계측값 셋을 문자열 하나로 만든다. */
function measured(scenario: CostScenario<MeasuredBuffer>, n: number): string {
  const result = measureScenario(
    { kind: "self-reported", make: reference },
    scenario,
    n,
    1,
  );
  return `perOp=${result.perOp.join(",")} total=${result.total} ticks=${result.ticks}`;
}

/** 시나리오 여섯의 판정과 크기별 통계. `./runContract.gapBuffer.test.ts` 와 같은 모양이다. */
function scenarioStats(
  make: () => MeasuredBuffer,
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

/** 어긴 자리를 「시나리오 차례 → 설명」 으로 모은다. 안 걸린 시나리오는 싣지 않는다. */
function breachesBy(
  make: () => MeasuredBuffer,
  n: number,
): Record<string, string> {
  const found: Record<string, string> = {};
  for (const breach of judgeValues(make, gapBufferContract, { n }).breaches) {
    found[`#${breach.scenario} ${breach.where}`] = breach.detail;
  }
  return found;
}

describe("값 검증 실행 — 선택 인자는 계측을 안 바꾼다", () => {
  test("기대를 붙인 시나리오와 벗긴 사본의 계측값(연산당 · 총 · tick)이 여섯 다 같다", () => {
    for (const scenario of gapBufferContract.scenarios) {
      expect(measured(scenario, VALUE_SIZE)).toBe(
        measured(withoutChecks(scenario), VALUE_SIZE),
      );
    }
  }, 60_000);

  test("기대를 붙인 뒤에도 축3 판정과 통계가 붙이기 전 값과 같다", () => {
    // `./runContract.gapBuffer.test.ts` 의 `REFERENCE_STATS` 와 같은 수다. 두 파일이 같은 값을 따로
    // 들고 있는 것이 아니라, 저쪽은 「정본 수정 전후가 같다」를 이쪽은 「기대 부착 전후가 같다」를 본다.
    expect(scenarioStats(reference)).toEqual([
      { ok: true, stats: [2, 2] },
      { ok: true, stats: [1, 1] },
      { ok: true, stats: [4, 4] },
      { ok: true, stats: [2050, 8194] },
      { ok: true, stats: [2, 2] },
      { ok: true, stats: [1025, 4097] },
    ]);
  }, 60_000);
});

describe("값 검증 실행 — 값을 틀리는 구현이 걸리고 성장률은 통과한다", () => {
  test("고친 정본은 기대 열넷을 전부 만족한다", () => {
    const verdict = judgeValues(reference, gapBufferContract, {
      n: VALUE_SIZE,
    });
    // 끝 상태 여섯 + 여섯째 시나리오의 걸음 여덟 = 열넷.
    expect(verdict.checked).toBe(14);
    expect(verdict.reason).toBe("");
    expect(verdict.ok).toBe(true);
  }, 60_000);

  test("옛 정본은 시나리오 다섯의 끝 상태에서 걸리고 잃은 원소 수가 그대로 보고된다", () => {
    expect(breachesBy(erasing, VALUE_SIZE)).toEqual({
      "#0 끝 상태": "1536 번째가 undefined 인데 512 여야 한다 (빈 칸 512 개)",
      "#1 끝 상태": "0 번째가 undefined 인데 512 여야 한다 (빈 칸 512 개)",
      "#2 끝 상태": "1023 번째가 undefined 인데 1023 여야 한다 (빈 칸 1 개)",
      "#3 끝 상태": "0 번째가 undefined 인데 0 여야 한다 (빈 칸 1024 개)",
      "#4 끝 상태": "512 번째가 undefined 인데 512 여야 한다 (빈 칸 512 개)",
    });
  }, 60_000);

  test("그 옛 정본의 축3 판정은 고친 정본과 한 자리도 다르지 않다 — 두 검사가 독립이다", () => {
    expect(scenarioStats(erasing)).toEqual(scenarioStats(reference));
  }, 60_000);

  test("크기가 2 의 거듭제곱이 아니면 같은 옛 정본이 값 검사를 통과한다 — 한 점을 2^10 으로 둔 근거", () => {
    expect(breachesBy(erasing, 1000)).toEqual({});
    expect(judgeValues(erasing, gapBufferContract, { n: 1000 }).ok).toBe(true);
  }, 60_000);
});

/**
 * 탐침 조회의 답만 거짓말하는 구현. **비용은 정본 그대로다** — 진짜 `has` 를 부른 뒤 답 하나를 뒤집으므로
 * `__cost` 증가가 정본과 같다. 값 검사만 이것을 잡는다.
 *
 * `./_fixtures/` 에 두지 않은 이유: 이 구현은 계약을 넘어 공유될 것이 아니라 **선택 자리 하나의 실효를
 * 보이는 자리**이고, 축1 무작위 교차검증이면 곧바로 걸린다(계약을 지키는 다른 구현이 아니라 거짓말이다).
 */
class ProbeLyingTreap<T> {
  readonly #inner: Treap<T>;
  #lied = false;

  constructor(compare: (a: T, b: T) => number) {
    this.#inner = new Treap<T>(compare);
  }

  get __cost(): number {
    return this.#inner.__cost;
  }

  insert(item: T): void {
    this.#inner.insert(item);
  }
  delete(item: T): boolean {
    return this.#inner.delete(item);
  }
  has(item: T): boolean {
    const answer = this.#inner.has(item);
    // 처음 묻는 한 자리만 뒤집는다. 뒤집는 자리를 하나로 둔 것은 「값 하나만 틀려도 걸린다」를 보이려는 것이다.
    if (this.#lied) return answer;
    this.#lied = true;
    return !answer;
  }
  min(): T | null {
    return this.#inner.min();
  }
  max(): T | null {
    return this.#inner.max();
  }
  range(low: T, high: T): T[] {
    return this.#inner.range(low, high);
  }
  size(): number {
    return this.#inner.size();
  }
  toArray(): T[] {
    return this.#inner.toArray();
  }
}

describe("값 검증 실행 — 걸음의 반환값 기대(`tree/treap` 아홉째 탐침)", () => {
  const ascending = (a: number, b: number) => a - b;
  const probe = treapContract.scenarios[8];
  if (probe === undefined) throw new Error("아홉째 시나리오가 없다");

  test("정본은 탐침 열여섯을 전부 참으로 답한다", () => {
    const verdict = judgeValues(
      () => new Treap<number>(ascending) as MeasuredTreap,
      { ...treapContract, scenarios: [probe] },
      { n: VALUE_SIZE },
    );
    expect(verdict.checked).toBe(16);
    expect(verdict.reason).toBe("");
  }, 60_000);

  test("답 하나만 뒤집은 구현은 값 검사에서 걸리고 성장률 판정은 통과한다", () => {
    const make = () => new ProbeLyingTreap<number>(ascending) as MeasuredTreap;
    const values = judgeValues(
      make,
      { ...treapContract, scenarios: [probe] },
      { n: VALUE_SIZE },
    );
    expect(values.breaches.map((breach) => breach.where)).toEqual([
      "0번째 걸음",
    ]);
    expect(values.breaches[0]?.detail).toBe(
      "has(0) 가 false 다 — 준비가 0 부터 차례로 넣은 키다",
    );

    // 같은 구현의 축3 은 통과한다. 통계를 수로 고정하지 않는 이유는 정본이 마디 우선순위를 `Math.random`
    // 으로 뽑아 실행마다 값이 흔들리기 때문이다(`tree/treap/_reference/treap.ts` 의 우선순위) — 고정하는
    // 것은 판정이다.
    const growth = judgeScenario(
      { kind: "self-reported", make },
      probe,
      treapContract.grade,
    );
    expect(growth.ok ? "" : growth.reason).toBe("");
  }, 120_000);
});
