/**
 * `probabilistic/countMinSketch` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./countMinSketch.contract.ts` 에 있고, 계약 자체는
 * `./countMinSketch.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 목표 오차 · 실패 확률을 생성자가 정하기 때문이다(`./countMinSketch.contract.ts` 머리말 —
 * 불변 사실 83).
 *
 * **정본은 무작위를 뽑으므로 오차 판정에서 한계를 넘는 추정의 수가 실행마다 다르다.** 판정은 여유 2 로 흔들림을 받는다 —
 * 반복 실행 결과는 `docs/ORD-006-conventions.md` 「A군 스케치 둘」.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^5 증분 · 10^3 추정을 100ms 안에」는 옮기지 않았다.
 * 「update 하지 않은 원소의 추정값은 0」은 거짓이라(헤더 「목적」 · 불변 사실 207) 「0 이상」으로 바뀌었고, 「width=1,
 * depth=1」은 헤더가 뺀 표현 매개변수의 사례라 옮기지 않았다. 「추정 오차 0.05·N 이내」는 표현 매개변수로 적힌 수치라 헤더의
 * 판정 문장(목표 오차 · 실패 확률 · 여유 2)으로 대체됐다. 결함 fixture 의 자기시험은
 * `../../_contract/runContract.countMinSketch.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { CountMinSketch as Reference } from "./_reference/countMinSketch";
import { CountMinSketch } from "./countMinSketch";
import { countMinSketchContract, SizedSketch } from "./countMinSketch.contract";

runContract(
  () => new SizedSketch((e, d) => new CountMinSketch(e, d)),
  countMinSketchContract,
  { label: "스텁" },
);

runContract(
  () => new SizedSketch((e, d) => new Reference(e, d)),
  countMinSketchContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new SizedSketch((e, d) => new Reference(e, d)),
    },
  },
);
