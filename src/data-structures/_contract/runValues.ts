/**
 * 값 검증 실행 — 축3 시나리오가 지나간 상태와 걸음의 반환값을 **등급의 크기 사다리에서 대조한다**.
 *
 * `./runContract.ts` 의 축3 은 비용만 모은다. 시나리오의 `run` 은 임의 코드라 걸음이 연산
 * 이름을 갖지 않고(축1 과 다른 자리다), 그래서 참조 모델을 나란히 굴릴 경로가 없다. 그
 * 결과 **답을 틀리면서 비용만 맞는 구현이 축3 을 그대로 지나간다** — `linear/gapBuffer` 의 옛
 * 정본이 시나리오 여섯 중 다섯에서 원소를 잃으면서 축3 판정을 한 자리도 안 어긋나게 통과했다
 * (`./runContract.gapBuffer.test.ts` · 런북 불변 사실 241). 규약이 이 물음을 T5-03 에서 열어
 * 두었고(`docs/ORD-006-conventions.md` 「축3 시나리오의 준비 상태는 아무도 값을 보지 않는다」의
 * 넘기는 물음 ②) 이 파일이 닫는다.
 *
 * | 무엇 | 어디서 | 왜 |
 * |---|---|---|
 * | 걸음의 반환값 기대 | `ctx.step` 의 **선택 둘째 인자**(`StepCheck`) | 시나리오가 값을 받을 자리가 없어 버리고 있었다 |
 * | 시나리오 끝 상태 기대 | `CostScenario.endState` **선택 필드** | 준비 작업이 남긴 상태를 아무도 안 봤다 |
 * | 평가하는 실행 | **이 파일** — 새 인스턴스 · 계측 없는 문맥 · 등급의 크기 사다리 | 검증 비용이 측정할 구현의 비용에 섞이지 않게 |
 * | 평가하지 않는 실행 | `./runContract.ts` 의 `measureScenario` | 선택 인자를 줘도 측정 실행은 읽지 않는다 |
 *
 * **측정 실행과 검증 실행은 다른 인스턴스의 다른 실행이다.** 같은 실행에서 값을 보면 ① 검사가
 * 쓴 `__cost` 가 총 비용에 실리고 ② 주입 경로의 정직성 검사(총 비용 ≥ 주입 tick)가 그만큼
 * 흔들리며 ③ 검사가 난수를 뽑으면 시나리오당 하나뿐인 난수원이 밀려 뒤 입력열이 전부
 * 달라진다. 실행을 가르면 셋 다 원천적으로 생기지 않는다 — 규율을 사람 기억에 맡기지 않는
 * 자리다(`./runTrials.ts` 머리말의 「계측값과 판정값을 분리해 든다」와 같은 읽기).
 *
 * **축은 늘리지 않는다.** 이것은 축1(동작)의 판정을 축3 시나리오가 지은 입력 위에서 하는
 * 것이다. 성장률 판정(`./judge.ts`)은 이 파일을 모르고, 이 파일이 `./judge.ts` 에서 읽는
 * 것은 **어느 크기를 걸을지 정하는 둘**뿐이다 — `SIZES`(크기 사다리)와 `RIGOR_OF_GRADE`
 * (등급 → 엄격도). 판정에 쓰이는 것들(`TOLERANCE` 허용치 · `statistic` 통계 · `SEEDS` seed
 * 목록 · `expectedRatio` 기대 비율)은 하나도 안 읽는다. 둘이 독립이라는 것을
 * `./runValues.test.ts` 가 수치로 고정한다.
 */

import { describe, expect, test } from "bun:test";
import type { Grade } from "./judge";
import { RIGOR_OF_GRADE, rngFrom, SIZES } from "./judge";
import type { ContractSpec, CostScenario, ScenarioCtx } from "./runContract";

/**
 * 검증 실행이 걷는 크기 — **그 계약 등급의 판정용 사다리 전부**다(느슨하면 두 점 · 엄격하면
 * 세 점). seed 는 하나로 둔다. 근거가 둘이다.
 *
 * 1. **축3 이 실제로 지나간 상태를 봐야 한다.** 사다리 밖의 크기를 고르면 「축3 이 지나가며
 *    놓친 것」이 아니라 다른 입력을 보는 것이 된다. 사다리 위의 점은 전부 축3 이 지나간
 *    인스턴스이고(`SEEDS` 는 세 한정자 모두 1 을 품는다), 그래서 전부 볼 값이 있다.
 * 2. **값 결함은 내부 문턱을 탄다 — 크기를 한 점으로 두면 문턱 하나만 본다.** 칸 · 버킷 ·
 *    블록이 꼭 차는 크기는 구현의 상수라 계약의 말로 짚을 수 없는데(런북 불변 사실 44),
 *    그 문턱을 지나는지가 값 결함이 드러나는지를 가른다. 실측이 받친다 — `linear/gapBuffer`
 *    옛 정본은 n = 2^10 에서 시나리오 다섯이 원소를 잃고 n = 1,000 에서는 여섯 다 하나도 안
 *    잃는다(불변 사실 241). 같은 구현 · 같은 시나리오인데 크기가 판정을 뒤집는다. 그러니
 *    「값의 옳고 그름은 크기를 타지 않는다」는 **틀린 문장**이고, 사다리 위의 다른 점도
 *    다른 문턱을 지나므로 안 보면 놓친다.
 *
 * **비용은 시나리오당 두세 번이라 작다.** 측정 실행이 이미 시나리오당 크기 2~3 × seed 1~5
 * 회를 도는 옆에서, 검증 실행은 크기 2~3 × seed 1 회다. 지금 관찰이 붙은 계약 셋을 정본으로
 * 재면(2026-09-17 · 3 회 평균) 한 점일 때 검사 46 개 · 7.5 ms 이던 것이 사다리 전부에서
 * 검사 **124 개** · **222 ms** 가 된다 — `linear/gapBuffer` 두 점 28 개 37 ms ·
 * `tree/treap` 세 점 48 개 149 ms · `probabilistic/skipList` 세 점 48 개 36 ms. 검사 수가
 * 크기 배수만큼 느는 것이 전부이고(점당 검사 수는 크기를 안 탄다), 가장 큰 점(2^14)이 비용의
 * 대부분이다. 벽시계는 판정에 쓰지 않는다(불변 사실 7) — 여기 적은 것은 「감당 가능한가」의
 * 참고 수치다.
 */
export function valueSizes(grade: Grade): readonly number[] {
  return SIZES[RIGOR_OF_GRADE[grade]];
}

/** 검증 실행의 난수 씨앗. 축1 무작위 교차검증과 같은 값이라 실행이 재현된다. */
export const VALUE_SEED = 1;

/** 기대를 어긴 자리 하나. */
export interface ValueBreach {
  /** 어긴 크기. 사다리의 한 점이다 — 같은 자리가 크기마다 따로 선다. */
  n: number;
  /** 시나리오의 차례(0 부터). `spec.scenarios` 의 첨자다. */
  scenario: number;
  /** 시나리오 라벨 — `covers` 를 이어 붙인 것. */
  label: string;
  /** 어느 기대인가. 걸음이면 `n번째 걸음`, 끝 상태면 `끝 상태`. */
  where: string;
  /** 기대가 돌려준 설명. */
  detail: string;
}

export interface ValueVerdict {
  ok: boolean;
  /** 어겼으면 자리마다 한 줄, 통과면 빈 문자열. */
  reason: string;
  /** 실제로 평가한 기대의 수. 0 이면 관찰이 하나도 없다는 뜻이라 통과로 치지 않는다. */
  checked: number;
  breaches: ValueBreach[];
}

/** 시나리오 하나의 검증 실행 결과. */
export interface ScenarioValues {
  /** 평가한 기대의 수. */
  checked: number;
  /** 감싼 걸음의 수. 측정 실행의 `perOp.length` 와 같아야 한다. */
  steps: number;
  breaches: { where: string; detail: string }[];
}

/**
 * 시나리오 하나를 **새 인스턴스**에서 계측 없는 문맥으로 돌리고 기대를 평가한다.
 *
 * 걸음을 감싸는 일이 여기서는 `fn()` 을 부르는 것뿐이다 — 재는 것이 없으므로 감싼 것과
 * 안 감싼 것의 차이가 「기대를 평가할 자리인가」 하나로 줄어든다.
 */
export function checkScenarioValues<Impl>(
  make: () => Impl,
  scenario: CostScenario<Impl>,
  n: number,
  seed: number = VALUE_SEED,
): ScenarioValues {
  const impl = make();
  const breaches: { where: string; detail: string }[] = [];
  let checked = 0;
  let steps = 0;

  const ctx: ScenarioCtx = {
    rng: rngFrom(seed),
    step(fn, check) {
      const index = steps++;
      const observed = fn();
      if (check === undefined) return;
      checked++;
      const violation = check(observed);
      if (violation !== null)
        breaches.push({ where: `${index}번째 걸음`, detail: violation });
    },
  };
  scenario.run(impl, n, ctx);

  if (scenario.endState !== undefined) {
    checked++;
    const violation = scenario.endState(impl, n);
    if (violation !== null)
      breaches.push({ where: "끝 상태", detail: violation });
  }
  return { checked, steps, breaches };
}

export interface ValueOptions {
  /**
   * **한 점으로 묶는다.** 주지 않으면 등급의 사다리 전부를 걷는다(`valueSizes`). 주는 자리는
   * 크기 자체가 물음인 시험뿐이다 — 자기시험이 1,000 과 2^10 을 나란히 견주는 자리가 그것이다.
   */
  n?: number;
  /** 난수 씨앗. 기본 `VALUE_SEED`. */
  seed?: number;
}

/**
 * 계약의 시나리오 전부를 **등급의 사다리 전 점에서** 검증 실행에 태운다. 값을 돌려주므로
 * `bun:test` 없이 시험할 수 있다 — `./runContract.ts` 의 `judgeScenario` 를 그렇게 둔 것과
 * 같은 까닭이다.
 */
export function judgeValues<Impl, Model>(
  factory: () => Impl,
  spec: ContractSpec<Impl, Model>,
  options: ValueOptions = {},
): ValueVerdict {
  const sizes = options.n === undefined ? valueSizes(spec.grade) : [options.n];
  const seed = options.seed ?? VALUE_SEED;
  const breaches: ValueBreach[] = [];
  let checked = 0;

  for (const n of sizes)
    spec.scenarios.forEach((scenario, index) => {
      const run = checkScenarioValues(factory, scenario, n, seed);
      checked += run.checked;
      for (const breach of run.breaches)
        breaches.push({
          n,
          scenario: index,
          label: scenario.covers.join("·"),
          ...breach,
        });
    });

  const reason = breaches
    .map(
      (breach) =>
        `크기 ${breach.n} · 시나리오 #${breach.scenario}(${breach.label}) · ${breach.where} — ${breach.detail}`,
    )
    .join("\n");
  return { ok: breaches.length === 0, reason, checked, breaches };
}

/** 검증 실행의 보고용 라벨. `runContract` 의 `Target` 과 같은 값을 준다. */
export interface ValueTarget {
  /** 예: `스텁`, `정본`. `describe` 이름에 들어가 CI 모드의 `-t 정본` 이 고른다. */
  label: string;
}

/**
 * 값 검증을 `bun:test` 에 등록한다. 계약 스위트 실행부(`<name>.test.ts`)가 `runContract` 옆에서
 * 부른다 — `./runTrials.ts` 의 `trialContract` 와 같은 자리다.
 *
 * **관찰이 하나도 없으면 떨어뜨린다.** 기대를 하나도 안 적은 계약이 이 함수를 부르면 「값도
 * 본다」가 빈말이 되는데, 조용히 통과하면 그 사실이 보이지 않는다.
 */
export function valueContract<Impl, Model>(
  factory: () => Impl,
  spec: ContractSpec<Impl, Model>,
  target: ValueTarget,
  options: ValueOptions = {},
): void {
  const sizes = options.n === undefined ? valueSizes(spec.grade) : [options.n];
  describe(`${spec.name} 축3 시나리오 값 검사 [${target.label}]`, () => {
    test(
      `크기 ${sizes.join(" · ")} 의 검증 실행에서 걸음의 반환값과 끝 상태가 기대와 같다`,
      () => {
        const verdict = judgeValues(factory, spec, options);
        expect(verdict.ok ? "" : verdict.reason).toBe("");
        expect(
          verdict.checked > 0
            ? ""
            : `${spec.name} 은 관찰을 하나도 적지 않았다 — 검증 실행을 부르지 않는다`,
        ).toBe("");
      },
      VALUE_TIMEOUT_MS,
    );
  });
}

/**
 * 테스트 하나의 시간 한도. 비용 판정이 아니다(불변 사실 7) — 멈춘 실행을 끊는 장치이고,
 * 검증 실행의 비용은 「시나리오 수 × 사다리의 점 수」로 센다.
 */
const VALUE_TIMEOUT_MS = 60_000;
