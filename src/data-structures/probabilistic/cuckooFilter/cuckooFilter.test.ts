/**
 * `probabilistic/cuckooFilter` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` · `trialContract` 호출만 둔다. 무엇을 검사하는지는 `./cuckooFilter.contract.ts` 에 있고, 계약 자체는
 * `./cuckooFilter.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 용량 · 목표 오차를 생성자가 정하기 때문이다(불변 사실 83).
 *
 * **오차는 `trialContract` 가 독립 시행으로 판정한다**(`../../_contract/runTrials.ts` — 시행마다 새 워커). 구현은 모듈 주소와
 * export 이름으로 넘긴다 — 팩토리 함수는 워커 경계를 못 넘는다. 계약을 지키는 구현이 떨어질 확률의 [보장] 상한은
 * `./cuckooFilter.contract.ts` 머리말, 반복 실행의 [경험] 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7) — 물려받은 「10^5 넣기 · 묻기 100ms」 · 「10^4 지우기 50ms」는 옮기지 않았다.
 * `size` · `loadFactor` 시험은 헤더가 두 연산을 뺐으므로, 「fingerprintSize 가 클수록 거짓 양성이 낮다」는 헤더가 뺀 표현
 * 매개변수의 성질이라 옮기지 않았다. 「capacity 4 에 100 개를 넣으면 일부는 거짓」은 용량을 넘긴 넣기라 헤더가 정하지
 * 않는 자리다. 「존재하지 않는 항목 delete 는 false」는 헤더가 확률 문장으로 바꿨다(헷갈린 지우기). 결함 fixture 의
 * 자기시험은 `../../_contract/runContract.cuckooFilter.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { trialContract } from "../../_contract/runTrials";
import { CuckooFilter as Reference } from "./_reference/cuckooFilter";
import { CuckooFilter } from "./cuckooFilter";
import {
  cuckooFilterContract,
  cuckooFilterTrials,
  SizedCuckoo,
} from "./cuckooFilter.contract";

runContract(
  () => new SizedCuckoo((n, rate) => new CuckooFilter(n, rate)),
  cuckooFilterContract,
  { label: "스텁" },
);

runContract(
  () => new SizedCuckoo((n, rate) => new Reference(n, rate)),
  cuckooFilterContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new SizedCuckoo((n, rate) => new Reference(n, rate)),
    },
  },
);

trialContract(cuckooFilterTrials, {
  label: "스텁",
  implementation: {
    module: new URL("./cuckooFilter.ts", import.meta.url).href,
    exportName: "CuckooFilter",
  },
});

trialContract(cuckooFilterTrials, {
  label: "정본",
  implementation: {
    module: new URL("./_reference/cuckooFilter.ts", import.meta.url).href,
    exportName: "CuckooFilter",
  },
});
