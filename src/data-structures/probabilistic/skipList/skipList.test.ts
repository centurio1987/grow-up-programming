/**
 * `probabilistic/skipList` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` · `valueContract` 호출만 둔다. 무엇을 검사하는지는 `./skipList.contract.ts` 에 있고 — 그 파일은
 * `tree/treap` 의 스위트를 그대로 내보낸다 — 계약 자체는 `./skipList.ts` 헤더 한 곳이다. 여덟째 시나리오의 탐침 조회에 붙은
 * 기대도 저쪽 것 그대로다(`KAN-043` · `../../_contract/runValues.ts`).
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은 정본에만 돈다 — 학습자
 * 스텁에 `__cost` 를 요구하지 않는다.
 *
 * **이 파일이 도는 것이 성격 전환의 실증이다.** 같은 스위트가 우선순위를 뽑아 트리를 짓는 정본과 층을 뽑아 줄을 짓는 정본을
 * **둘 다 통과시킨다.** 통과시키지 못하면 계약이 무작위를 담는 모양을 처방하고 있는 것이다. 정본이 `Math.random()` 을 쓰므로
 * 계측값은 실행마다 다르고, 20 회 돌려 20 회 통과했다(`docs/ORD-006-runbook.md` 불변 사실 238).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「무작위 순서 10^4 insert/search/delete를 200ms 이내」가 재는 것은
 * 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { valueContract } from "../../_contract/runValues";
import { SkipList as Reference } from "./_reference/skipList";
import { SkipList } from "./skipList";
import { skipListContract } from "./skipList.contract";

runContract(() => new SkipList<number>(), skipListContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), skipListContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});

valueContract(() => new SkipList<number>(), skipListContract, {
  label: "스텁",
});

valueContract(() => new Reference<number>(), skipListContract, {
  label: "정본",
});
