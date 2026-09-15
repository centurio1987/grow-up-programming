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
 * **정본은 무작위를 뽑으므로 오차 판정에서 벗어난 인스턴스의 수가 실행마다 다르다.** 판정은 여유 3 으로 흔들림을 받는다 —
 * 반복 실행 결과는 `docs/ORD-006-conventions.md` 「A군 스케치 둘」.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^5 add 200ms」 · 「10^3 merge 100ms」는 옮기지 않았다.
 * `error()` 두 시험은 헤더가 표면에서 뺀 연산이라 옮기지 않았고, 「빈 HLL 의 count 는 0」 · 「n=1000 에서 15% 이내」 같은
 * 표현 매개변수(precision)로 적힌 수치는 헤더의 판정 문장(상대 오차 · 실패 확률 · 여유 3)으로 대체됐다. 「중복 추가해도 크게
 * 변하지 않는다」는 「바뀌지 않는다」(결정적)로, 「merge 는 원본을 수정하지 않는다」는 합치기 판정으로 들어갔다. 결함 fixture 의
 * 자기시험은 `../../_contract/runContract.hyperLogLog.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { HyperLogLog as Reference } from "./_reference/hyperLogLog";
import { HyperLogLog } from "./hyperLogLog";
import { hyperLogLogContract, SketchPair } from "./hyperLogLog.contract";

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
