/**
 * 걸음 반환값 탐침 — **어느 시나리오가 값을 버리는가**를 소스를 읽지 않고 **재서** 낸다.
 *
 * 값 검사를 붙일 자리를 성질로 고를 때 앞의 두 기준((가) 버린다 · (나) 기대가 상수 하나다)은
 * 눈으로 세는 것이 아니라 재는 것이다(`docs/ORD-006-conventions.md` 「축3 시나리오가 지나간
 * 값을 보는 자리」의 기준 표). 이 파일이 그 재는 도구이고, **저장소 안에 둔다** — 목록을 다시
 * 만들 때 훑기를 처음부터 짓지 않게 하려는 것이다(`KAN-043` 검토 항목 7 의 반려 사유).
 *
 * **쓰는 법.** 계약 스위트 실행부 전부를 이 파일을 물려 돌린다. 판정은 하지 않는다 — 스텁이
 * 실패하는 것은 정상이고(`Not implemented`) 이 탐침이 보는 것은 실패 여부가 아니라 값이다.
 *
 * ```sh
 * bun test --preload ./src/data-structures/_contract/probeStepValues.preload.ts \
 *   $(git ls-files src/data-structures | grep '\.test\.ts$' | grep -v _contract)
 * ```
 *
 * 줄마다 `PROBE` 를 앞에 달아 표준출력으로 흘린다 — 저장소에 아무것도 쓰지 않는다. 파일로 받고
 * 싶으면 `PROBE_STEP_VALUES_OUT` 에 경로를 준다(있던 내용은 지우고 새로 쓴다). 위 명령이 고르는
 * 실행부가 **68 개**이고 계약 67 종 · 시나리오 실행 인스턴스 **364 개**가 **1.2 초** 안에
 * 돈다(2026-09-17 실측).
 *
 * **무엇을 가로채나.** `runContract` 만 바꿔 치고 시나리오를 크기 2^10 · seed 1 로 **한 번씩**
 * 돌린다. 걸음을 감싸는 일이 여기서는 `fn()` 을 부르고 돌아온 값을 적는 것뿐이다 — 재는 것이
 * 없으므로 `./runValues.ts` 의 검증 문맥과 같은 꼴이다. `trialContract` · `valueContract` 는
 * 빈 함수로 둔다(이 훑기가 보려는 것이 아니다). 계측기(`target.cost`)가 없는 대상과 축4 등급은
 * 건너뛴다 — 축3 이 안 도는 자리다.
 *
 * **「같은 값」의 기준을 여기서 정한다.** 기준 (나)는 「그 시나리오의 걸음이 전부 같은 한 값을
 * 돌려주는가」인데, 배열과 객체를 어떻게 견주느냐로 무리의 수가 갈린다. 이 파일은 **JSON 직렬화**
 * 를 쓴다 — 배열과 객체는 **내용**이 같아야 같은 값이다. 단서 둘을 적어 둔다.
 *
 * - `bigint` 는 `123n` 꼴 문자열로 바꾼다(`JSON.stringify` 가 던지는 자리다).
 * - **순환 구조는 `<object:unstringifiable>` 하나로 접힌다.** 마디 손잡이(연결 리스트 · 피보나치
 *   힙)가 여기 걸리므로 그런 행은 「한 값」으로 잡힌다 — 기준 (다)(그 값을 시나리오가 아니라
 *   **구현**이 정한다)에서 떨어뜨려야 한다. 직렬화가 접은 것이지 정말 한 값이어서가 아니다.
 *
 * 문자열화(`String`)로 견주면 **객체가 전부 `[object Object]` 로 같아져** 무리의 수가 달라진다.
 * 기준을 안 적으면 같은 표를 두 번 만들 때마다 수가 달라진다는 것이 이 주석의 존재 이유다.
 */

import { mock } from "bun:test";
import { appendFileSync, writeFileSync } from "node:fs";
import { rngFrom } from "./judge";
import type { ContractSpec, ScenarioCtx, Target } from "./runContract";
import * as runContractModule from "./runContract";
import * as runTrialsModule from "./runTrials";
import * as runValuesModule from "./runValues";

/** 훑는 크기. 판정 사다리의 첫 점이고, 한 번씩만 돈다 — 이 훑기는 판정이 아니다. */
const PROBE_SIZE = 1 << 10;

/** 한 줄이 나가는 곳. 환경 변수가 없으면 표준출력에 `PROBE` 접두로 흘린다. */
const OUT = process.env.PROBE_STEP_VALUES_OUT;
if (OUT !== undefined) writeFileSync(OUT, "");

/**
 * 「같은 값」의 판정 문자열. 배열 · 객체는 **내용**으로 견준다(머리말의 단서 둘을 같이 읽는다).
 */
export function sameValueKey(value: unknown): string {
  try {
    const text = JSON.stringify(value, (_key, inner: unknown) =>
      typeof inner === "bigint" ? `${inner}n` : inner,
    );
    return text === undefined ? `<${typeof value}:${String(value)}>` : text;
  } catch {
    return `<${typeof value}:unstringifiable>`;
  }
}

/** 한 줄 — 계약 · 시나리오 차례 · 덮는 행 · 걸음 수 · 서로 다른 값의 수 · 돌아온 값. */
function emit(fields: readonly (string | number)[]): void {
  const line = fields.join("\t");
  if (OUT === undefined) console.log(`PROBE\t${line}`);
  else appendFileSync(OUT, `${line}\n`);
}

function probe<Impl, Model>(
  spec: ContractSpec<Impl, Model>,
  target: Target<Impl>,
): void {
  const cost = target.cost;
  if (cost === undefined || spec.grade === "concurrency") return;

  spec.scenarios.forEach((scenario, index) => {
    const impl =
      cost.kind === "injected"
        ? cost.make(() => {
            /* 주입 tick 은 이 훑기가 보는 것이 아니다 */
          })
        : cost.make();
    const keys: string[] = [];
    const kinds = new Set<string>();
    let steps = 0;
    let dropped = 0;

    const ctx: ScenarioCtx = {
      rng: rngFrom(1),
      step(fn) {
        steps++;
        const observed = fn();
        if (observed === undefined) return;
        dropped++;
        keys.push(sameValueKey(observed));
        kinds.add(Array.isArray(observed) ? "array" : typeof observed);
      },
    };
    scenario.run(impl, PROBE_SIZE, ctx);

    const distinct = new Set(keys).size;
    emit([
      spec.name,
      index,
      scenario.covers.join("·"),
      steps,
      dropped,
      distinct,
      [...kinds].join("+"),
      scenario.endState === undefined ? "-" : "endState",
      (keys[0] ?? "").slice(0, 80),
    ]);
  });
}

mock.module("./runContract", () => ({
  ...runContractModule,
  runContract: <Impl, Model>(
    _factory: () => Impl,
    spec: ContractSpec<Impl, Model>,
    target: Target<Impl> = { label: "구현" },
  ) => probe(spec, target),
}));
mock.module("./runTrials", () => ({
  ...runTrialsModule,
  trialContract: () => {},
}));
mock.module("./runValues", () => ({
  ...runValuesModule,
  valueContract: () => {},
}));
