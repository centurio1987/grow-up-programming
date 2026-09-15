/**
 * `probabilistic/hyperLogLog` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./hyperLogLog.contract.ts` 에 있고, 계약 자체는
 * `./hyperLogLog.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 상대 오차 · 실패 확률을 생성자가 정하고 합치기가 인스턴스 둘을 받기 때문이다
 * (`./hyperLogLog.contract.ts` 머리말 — 불변 사실 83).
 *
 * **오차는 `trialContract` 가 독립 시행으로 판정한다**(`../../_contract/runTrials.ts` — 시행마다 새 워커). 구현은 모듈 주소와
 * export 이름으로 넘긴다 — 팩토리 함수는 워커 경계를 못 넘는다. 계약을 지키는 구현이 떨어질 확률의 [보장] 상한은
 * `./hyperLogLog.contract.ts` 머리말, 반복 실행의 [경험] 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^5 add 200ms」 · 「10^3 merge 100ms」는 옮기지 않았다.
 * `error()` 두 시험은 헤더가 표면에서 뺀 연산이라 옮기지 않았고, 「빈 HLL 의 count 는 0」 · 「n=1000 에서 15% 이내」 같은
 * 표현 매개변수(precision)로 적힌 수치는 헤더의 판정 문장(상대 오차 · 실패 확률 · 독립 시행)으로 대체됐다. 「중복 추가해도 크게
 * 변하지 않는다」는 「바뀌지 않는다」(결정적)로, 「merge 는 원본을 수정하지 않는다」는 합치기 판정으로 들어갔다. 결함 fixture 의
 * 자기시험은 `../../_contract/runContract.hyperLogLog.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { trialContract } from "../../_contract/runTrials";
import { HyperLogLog as Reference } from "./_reference/hyperLogLog";
import { HyperLogLog } from "./hyperLogLog";
import {
  hyperLogLogContract,
  hyperLogLogTrials,
  SketchPair,
} from "./hyperLogLog.contract";

runContract(
  () => new SketchPair((e, d) => new HyperLogLog(e, d)),
  hyperLogLogContract,
  { label: "스텁" },
);

runContract(
  () => new SketchPair((e, d) => new Reference(e, d)),
  hyperLogLogContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new SketchPair((e, d) => new Reference(e, d)),
    },
  },
);

trialContract(hyperLogLogTrials, {
  label: "스텁",
  implementation: {
    module: new URL("./hyperLogLog.ts", import.meta.url).href,
    exportName: "HyperLogLog",
  },
});

trialContract(hyperLogLogTrials, {
  label: "정본",
  implementation: {
    module: new URL("./_reference/hyperLogLog.ts", import.meta.url).href,
    exportName: "HyperLogLog",
  },
});
