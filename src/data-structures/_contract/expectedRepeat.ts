/**
 * 축3 `expected` 의 반복 규격 — 반복 축을 **입력 씨앗**과 **시행**으로 가른다(원칙 B 하네스 변경 명세 H2).
 *
 * `./judge.ts` 의 `SEEDS.expected` 는 축이 하나였다. 씨앗 다섯을 도는데 **씨앗마다 새 인스턴스를 세우고
 * 같은 씨앗으로 입력열도 만들어서**, 씨앗 하나를 바꾸면 입력과 구현 무작위가 함께 바뀐다. 그래서 「같은
 * 입력에서 구현의 무작위만 달랐을 때 비용이 어떻게 흩어지는가」를 묻는 자리가 없고, 계약이 적은 **호출별
 * 기대**가 검사로 서지 못한다(`docs/ORD-006-conventions.md` 「원칙 B」의 B6). 규약이 H2 로 예약한 자리다.
 *
 * | 축 | 무엇이 바뀌나 | 크기 |
 * |---|---|---|
 * | 입력 씨앗 | 시나리오가 `ctx.rng` 로 짓는 입력열 | 씨앗이 입력을 만들면 `INPUT_SEEDS`, 아니면 하나 |
 * | 시행 | 같은 입력에서 인스턴스를 새로 세워 다시 뽑는 구현 무작위 | `REPEAT_UNITS ÷ 입력 씨앗 수` |
 *
 * **어느 축인지는 시나리오가 선언한다 — 그리고 하네스가 재서 대조한다.** `seededInput` · `fixedInput` 둘 중
 * 하나로 감싸는 것이 선언이고, 감싼 `run` 이 그 시나리오의 `ctx.rng` 호출 수를 세어 선언과 어긋나면 그
 * 자리에서 던진다. 선언만 두면 시나리오가 뒤에 바뀌었을 때 조용히 틀리고, 재기만 하면 「입력을 씨앗으로
 * 만든다」가 코드에 안 적힌다. 판정을 떨어뜨리지 않고 **던지는** 까닭은 이것이 계약 위반이 아니라 하네스
 * 오사용이기 때문이다(`./runContract.ts` 의 「경계 케이스가 없는 연산을 부른다」와 같은 자리).
 *
 * **감싸지 않은 시나리오는 옛 경로 그대로다.** `repeatPlan` 이 `SEEDS[한정자]` 를 돌려준다 — `worst` ·
 * `amortized` 는 규격 밖이고(감싸려 하면 던진다), 아직 안 옮긴 `expected` 계약도 한 자리도 안 움직인다.
 * 열둘을 옮기는 것은 `KAN-041` `S2` 이고, 열둘이 다 옮겨지면 「`expected` 인데 선언이 없다」를 게이트가
 * 막을 수 있다(지금은 막지 않는다 — 막으면 옮기기 전의 열둘이 전부 걸린다).
 *
 * **통계는 그대로 단위 평균의 중앙값이다**(`./judge.ts` 의 `statistic`). 바뀐 것은 무엇이 단위인가 하나다 —
 * 전에는 「입력이 다른 다섯」이고 지금은 「입력이 같은 시행 T 개 × 입력 씨앗 S 개」다.
 *
 * **탐침 시나리오는 이 규격 안에서 저절로 선다.** 「시행마다 감싼 호출 비용의 **합**을 표본 하나로 친다」가
 * H2 의 말인데, 감싼 걸음 수가 n 과 무관한 상수 c 이면 단위 평균 = 합 ÷ c 이고 c 가 사다리의 두 점에서
 * 같으므로 성장률 $r$ 이 합으로 잰 것과 **정확히 같다.** 그래서 합을 따로 셈하는 코드를 두지 않았다 —
 * `./expectedRepeat.test.ts` 가 그 같음을 수치로 고정한다. 탐침의 실물은 `tree/treap` 아홉째 시나리오다
 * (`docs/ORD-006-conventions.md` 「원칙 B 적용 — `tree/treap` · `probabilistic/skipList`」).
 *
 * **[보장] 이 아니라 [경험] 이다.** B5 의 Hoeffding 상한은 시행 통계가 [0, 1] 로 묶여야 성립하는데(그래서
 * `./judgeTrials.ts` 는 벗어난 몫 $Z_t$ 를 쓴다) 여기 시행 통계는 **비용의 평균이라 위 끝이 없다.** 계약이
 * 기댓값의 상수와 분산을 적지 않으므로(불변 사실 6) 마르코프로 세우는 상한도 축3 허용 폭에서 비어 있다
 * (B6 — 폭 1.3 배에서 0.916). 그러니 아래 수치는 전부 **정본에 대한 [경험]** 이고, 「상한」 · 「보장」 ·
 * 「떨어지지 않는다」로 읽지 않는다(B4).
 *
 * **워커를 쓰지 않는다 — 이것도 실측이다.** H2 는 「공유 범위가 실행인 계약은 H1 의 워커 시행을 쓴다」고
 * 적었다. 재 보고 안 쓰기로 했다. 열둘(+ 스위트를 같은 객체로 받는 둘 중 하나)의 축3 `expected` 시나리오
 * **65 자리**에서 「한 프로세스 안 시행 여덟」과 「프로세스 여덟 × 시행 하나」를 크기 2^10 · 씨앗 1 로
 * 견주니 **어긋난 자리가 0** 이다 — 17 자리는 양쪽 다 같은 상수 하나(결정론 정본 둘 `tree/multiset` ·
 * `range-query/intervalTree` 의 아홉, 그리고 무작위를 뽑되 비용이 거기 안 매인 여덟: 하이퍼로그로그 셋 ·
 * 민해시 둘 · 카운트-민 둘 · 블룸 `add`), 48 자리는 양쪽 다 흔들리고 폭도 같은 자리다. **새 실행 영역이
 * 축3 값을 바꾸는 자리가 없다.** 값이 안 바뀌는데 값은 비싸다 — 규격을 열둘에 적용하면 정본 대상 반복
 * 단위가 스위트 한 번에 2,070 개이고, 시행마다 워커를 띄우면 그 수가 그대로 워커 수라 지금 저장소의 워커
 * 예산(정본 800 · fixture 약 3,000)을 한 번에 넘어선다.
 *
 * 그래서 **시행끼리의 독립은 닫지 않고 B7 로 남긴다.** 다시 여는 조건은 「한 프로세스 안의 시행과
 * 프로세스를 가른 시행이 **다른 값**을 내는 자리가 나오면」이고, 그 대조는 위와 같은 방법으로 다시 난다.
 *
 * 남는 틈도 `tree/treap` 헤더 끝 「검사 못 하는 의무」 표가 B7 형식으로 적는다 — 통계가 중앙값이라 단위의
 * 절반까지 튀는 구현이 통과하고, 그 성질은 시행 수를 늘려도 안 바뀐다.
 */

import { SEEDS } from "./judge";
import type { CostScenario, ScenarioCtx } from "./runContract";

/**
 * 판정 하나가 크기 한 점에서 도는 **반복 단위 수**. 두 축의 곱이고, 시나리오 종류에 따라 갈리지 않는다 —
 * 입력이 고정이면 전부 시행 축으로 간다.
 *
 * **열로 고른 근거는 실측이다**(`KAN-041` `S1`). `expected` 계약 열둘의 정본에서 시행 평균을 (시나리오 ·
 * 크기 · 씨앗)마다 64 개씩 실제로 쟀고(시나리오 인스턴스 65 · 자리 183 · 시행 평균 58,560 개), 그 표본에서
 * 후보 나눔마다 판정을 **재표집 40,000 회**로 다시 세웠다. 아래는 **부당 탈락**(계약을 지키는 정본이
 * 성장률 판정에서 떨어지는 몫)의 시나리오별 최댓값이다.
 *
 * | 단위 수 | 나눔 | 부당 탈락 최댓값 |
 * |---|---|---|
 * | 5 | 씨앗 5 × 시행 1 (**옛 경로**) | 2.3 × 10^−3 |
 * | 5 | 씨앗 1 × 시행 5 | 2.9 × 10^−3 |
 * | 8 | 씨앗 2 × 시행 4 | 2.0 × 10^−4 |
 * | 8 | 씨앗 1 × 시행 8 | 7.0 × 10^−5 |
 * | **10** | **씨앗 2 × 시행 5** | **7.0 × 10^−5** |
 * | **10** | **씨앗 1 × 시행 10** | **0 / 40,000** |
 * | 20 | 씨앗 2 × 시행 10 · 씨앗 5 × 시행 4 | 0 / 40,000 |
 *
 * 열에서 옛 경로보다 **30 배 이상** 낮아지고, 스물로 올려도 더 낮아지는 것이 안 보인다 — 재표집 40,000 회의
 * 해상도가 2.5 × 10^−5 라 「0」은 「그보다 작다」까지만 말한다(**[경험]** · B4). 대가는 `expected` 계측이
 * **정확히 두 배**가 되는 것이다 — 정본 대상 1,035 → 2,070(전체 1,812 → 2,847), 자기시험 4,730 → 9,460
 * (전체 8,540 → 13,270). `worst` · `amortized` 계측은 한 번도 안 는다.
 *
 * **재표집이라 [보장] 이 아니다.** 시행 평균 64 개가 서로 독립이고 판정이 볼 분포가 그 경험분포와 같다고
 * 둔 계산이다. 앞엣것은 공유 범위가 「실행」인 계약에서 계약이 주지 않는 전제이고(B3), 뒤엣것은 표본이
 * 유한하다는 사실이 이미 어긴다. 그래서 위 표는 「부당 탈락의 상한」이 아니라 **잰 값**이다.
 */
export const REPEAT_UNITS = 10;

/**
 * 씨앗이 입력을 만드는 시나리오가 도는 **입력 씨앗 목록**. 옛 경로의 다섯이 아니라 **둘**이다.
 *
 * **줄인 근거도 실측이다.** 같은 시나리오 · 같은 크기에서 두 축의 흩어짐을 갈라 쟀다(위와 같은 표본 ·
 * 시행이 흔들리는 자리 140). 씨앗 사이의 표준편차는 씨앗 안(시행) 표준편차의 **0.027 ~ 0.312 배**(평균
 * 0.124)다. 그 값에는 시행 잡음이 √64 로 줄어 섞여 있어, 그것을 빼면 입력 축이 스스로 내는 흩어짐은 시행
 * 축의 **0 ~ 0.286 배**(평균 0.045)로 더 내려간다. n 이 1,024 이상인 무작위 입력열은 씨앗을 바꿔도 거의
 * 같은 입력이라는 뜻이다 — 단위를 입력 축에 쓰면 얻는 것이 적다.
 *
 * 그렇다고 하나로 두지 않는 까닭은 **축이 있다는 것을 판정이 보여야 하기 때문**이다. 둘이면 「입력이 달라도
 * 같은가」를 묻는 자리가 남고, 단위 다섯이 여전히 시행 축에 간다. 치우친 입력을 찾는 일은 씨앗 수가 아니라
 * **적대적 시나리오**가 한다(그쪽은 입력이 고정이라 여기 오지 않는다).
 */
export const INPUT_SEEDS: readonly number[] = [1, 2];

/** 입력이 고정인 시나리오가 쓰는 씨앗 하나. 값은 아무 것이나 되지만 옛 경로의 첫 씨앗과 맞춘다. */
export const FIXED_SEED = 1;

/** 반복 단위 하나 — 축 둘의 좌표다. */
export interface RepeatUnit {
  /** 입력 씨앗. 같은 값이면 같은 입력열이다. */
  seed: number;
  /** 그 입력 씨앗 안에서의 시행 번호(0 부터). 인스턴스를 새로 세우는 것 말고는 아무것도 바꾸지 않는다. */
  trial: number;
}

/** 축 둘의 크기. 규격을 선언하지 않은 시나리오는 `null` 이다(옛 경로). */
export interface RepeatAxes {
  inputSeeds: readonly number[];
  trials: number;
}

/** 시나리오가 선언한 것을 담아 두는 자리. 계약이 읽을 것이 아니라 이 파일이 읽을 것이라 심볼이다. */
const DECLARED: unique symbol = Symbol("expectedRepeat.inputFromSeed");

function declarationOf<Impl>(
  scenario: CostScenario<Impl>,
): boolean | undefined {
  return (scenario as { [DECLARED]?: boolean })[DECLARED];
}

/**
 * 이 시나리오가 도는 두 축의 크기. 선언이 없으면 `null` — 부르는 쪽이 옛 경로로 간다.
 */
export function repeatAxes<Impl>(
  scenario: CostScenario<Impl>,
): RepeatAxes | null {
  const inputFromSeed = declarationOf(scenario);
  if (inputFromSeed === undefined) return null;
  const inputSeeds = inputFromSeed ? INPUT_SEEDS : [FIXED_SEED];
  if (REPEAT_UNITS % inputSeeds.length !== 0)
    throw new Error(
      `반복 단위 ${REPEAT_UNITS} 가 입력 씨앗 ${inputSeeds.length} 로 나누어떨어지지 않는다 — ` +
        "축 둘의 곱이 시나리오 종류에 따라 갈리면 계측 수가 갈린다",
    );
  return { inputSeeds, trials: REPEAT_UNITS / inputSeeds.length };
}

/**
 * 크기 한 점에서 돌 반복 단위 목록. 판정 루프(`./runContract.ts` 의 `judgeScenario`)가 이것을 돈다.
 *
 * 선언이 없으면 `SEEDS[한정자]` 그대로다 — `worst` · `amortized` 가 지나가는 길이 여기이고, 옛 경로의
 * `expected` 도 같은 길을 지난다.
 */
export function repeatPlan<Impl>(
  scenario: CostScenario<Impl>,
): readonly RepeatUnit[] {
  const axes = repeatAxes(scenario);
  if (axes === null)
    return SEEDS[scenario.qualifier].map((seed) => ({ seed, trial: 0 }));
  const units: RepeatUnit[] = [];
  for (const seed of axes.inputSeeds)
    for (let trial = 0; trial < axes.trials; trial++)
      units.push({ seed, trial });
  return units;
}

/**
 * **입력을 `ctx.rng` 로 짓는 `expected` 시나리오**임을 선언한다. 입력 씨앗 축이 `INPUT_SEEDS` 다.
 */
export function seededInput<Impl>(
  scenario: CostScenario<Impl>,
): CostScenario<Impl> {
  return declare(scenario, true);
}

/**
 * **입력이 씨앗과 무관하게 고정인 `expected` 시나리오**임을 선언한다. 입력 씨앗 축이 하나라 단위가 전부
 * 시행 축으로 가고, 탐침 시나리오가 여기 선다.
 */
export function fixedInput<Impl>(
  scenario: CostScenario<Impl>,
): CostScenario<Impl> {
  return declare(scenario, false);
}

function declare<Impl>(
  scenario: CostScenario<Impl>,
  inputFromSeed: boolean,
): CostScenario<Impl> {
  const label = scenario.covers.join("·");
  if (scenario.qualifier !== "expected")
    throw new Error(
      `${label} 은 ${scenario.qualifier} 다 — 반복 축 둘은 expected 전용이고 ` +
        "worst · amortized 는 옛 경로를 그대로 지나간다",
    );
  if (declarationOf(scenario) !== undefined)
    throw new Error(`${label} 은 이미 선언됐다 — 한 시나리오에 선언은 하나다`);

  const watched: CostScenario<Impl> = {
    ...scenario,
    run(impl, n, ctx) {
      let reads = 0;
      const watching: ScenarioCtx = {
        rng: () => {
          reads++;
          return ctx.rng();
        },
        step: (fn, check) => {
          ctx.step(fn, check);
        },
      };
      scenario.run(impl, n, watching);
      const readSeed = reads > 0;
      if (readSeed === inputFromSeed) return;
      throw new Error(
        inputFromSeed
          ? `${label} 은 씨앗이 입력을 만든다고 선언했는데 ctx.rng 를 한 번도 안 읽었다 — ` +
              "입력이 이미 고정이면 fixedInput 이다(입력 씨앗 축이 헛돈다)"
          : `${label} 은 입력 고정으로 선언했는데 ctx.rng 를 ${reads} 번 읽었다 — ` +
              "씨앗이 입력을 정하면 seededInput 이다(시행이 같은 입력을 안 본다)",
      );
    },
  };
  return Object.assign(watched, { [DECLARED]: inputFromSeed });
}
