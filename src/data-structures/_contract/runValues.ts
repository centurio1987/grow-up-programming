/**
 * 값 검증 실행 — 축3 시나리오가 지나간 상태와 걸음의 반환값을 **한 번 대조한다**.
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
 * | 평가하는 실행 | **이 파일** — 새 인스턴스 · 계측 없는 문맥 · 작은 한 점 | 검증 비용이 측정할 구현의 비용에 섞이지 않게 |
 * | 평가하지 않는 실행 | `./runContract.ts` 의 `measureScenario` | 선택 인자를 줘도 측정 실행은 읽지 않는다 |
 *
 * **측정 실행과 검증 실행은 다른 인스턴스의 다른 실행이다.** 같은 실행에서 값을 보면 ① 검사가
 * 쓴 `__cost` 가 총 비용에 실리고 ② 주입 경로의 정직성 검사(총 비용 ≥ 주입 tick)가 그만큼
 * 흔들리며 ③ 검사가 난수를 뽑으면 시나리오당 하나뿐인 난수원이 밀려 뒤 입력열이 전부
 * 달라진다. 실행을 가르면 셋 다 원천적으로 생기지 않는다 — 규율을 사람 기억에 맡기지 않는
 * 자리다(`./runTrials.ts` 머리말의 「계측값과 판정값을 분리해 든다」와 같은 읽기).
 *
 * **축은 늘리지 않는다.** 이것은 축1(동작)의 판정을 축3 시나리오가 지은 입력 위에서 하는
 * 것이다. 성장률 판정(`./judge.ts`)은 이 파일을 모르고, 이 파일은 `./judge.ts` 의 상수를
 * 읽지 않는다 — 둘이 독립이라는 것을 `./runValues.test.ts` 가 수치로 고정한다.
 */

import { describe, expect, test } from "bun:test";
import { rngFrom } from "./judge";
import type { ContractSpec, CostScenario, ScenarioCtx } from "./runContract";

/**
 * 검증 실행이 서는 크기. **판정용 사다리를 쓰지 않는다** — 값의 옳고 그름은 크기를 타지
 * 않으므로 성장률처럼 세 점을 오를 까닭이 없고, 한 점이면 검증 비용이 시나리오당 한 번이다.
 *
 * 그 한 점을 사다리의 **가장 작은 점**(`SIZES` 의 첫 값과 같은 값)으로 두는 근거가 둘이다.
 *
 * 1. **축3 이 실제로 지나간 상태를 봐야 한다.** 사다리 밖의 크기를 고르면 「축3 이 지나가며
 *    놓친 것」이 아니라 다른 입력을 보는 것이 된다.
 * 2. **2 의 거듭제곱이라 내부 문턱을 지난다.** 칸 · 버킷 · 블록이 꼭 차는 크기는 구현의
 *    상수라 계약의 말로 짚을 수 없는데(런북 불변 사실 44), 2 의 거듭제곱은 그런 문턱을 자주
 *    지난다. 실측이 있다 — `linear/gapBuffer` 옛 정본은 n = 2^10 에서 시나리오 다섯이 원소를
 *    잃고 n = 1,000 에서는 여섯 다 하나도 안 잃는다(불변 사실 241).
 */
export const VALUE_SIZE = 1 << 10;

/** 검증 실행의 난수 씨앗. 축1 무작위 교차검증과 같은 값이라 실행이 재현된다. */
export const VALUE_SEED = 1;

/** 기대를 어긴 자리 하나. */
export interface ValueBreach {
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
  n: number = VALUE_SIZE,
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
  /** 검증 실행이 설 크기. 기본 `VALUE_SIZE`. */
  n?: number;
  /** 난수 씨앗. 기본 `VALUE_SEED`. */
  seed?: number;
}

/**
 * 계약의 시나리오 전부를 검증 실행에 태운다. 값을 돌려주므로 `bun:test` 없이 시험할 수 있다 —
 * `./runContract.ts` 의 `judgeScenario` 를 그렇게 둔 것과 같은 까닭이다.
 */
export function judgeValues<Impl, Model>(
  factory: () => Impl,
  spec: ContractSpec<Impl, Model>,
  options: ValueOptions = {},
): ValueVerdict {
  const n = options.n ?? VALUE_SIZE;
  const seed = options.seed ?? VALUE_SEED;
  const breaches: ValueBreach[] = [];
  let checked = 0;

  spec.scenarios.forEach((scenario, index) => {
    const run = checkScenarioValues(factory, scenario, n, seed);
    checked += run.checked;
    for (const breach of run.breaches)
      breaches.push({
        scenario: index,
        label: scenario.covers.join("·"),
        ...breach,
      });
  });

  const reason = breaches
    .map(
      (breach) =>
        `시나리오 #${breach.scenario}(${breach.label}) · ${breach.where} — ${breach.detail}`,
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
  const n = options.n ?? VALUE_SIZE;
  describe(`${spec.name} 축3 시나리오 값 검사 [${target.label}]`, () => {
    test(
      `크기 ${n} 의 검증 실행에서 걸음의 반환값과 끝 상태가 기대와 같다`,
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
 * 검증 실행의 비용은 「시나리오 수 × 한 점」으로 센다.
 */
const VALUE_TIMEOUT_MS = 60_000;
