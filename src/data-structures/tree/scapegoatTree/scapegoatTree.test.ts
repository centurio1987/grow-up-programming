/**
 * `tree/scapegoatTree` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./scapegoatTree.contract.ts`
 * 에 있고, 계약 자체는 `./scapegoatTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { ScapegoatTree as Reference } from "./_reference/scapegoatTree";
import { ScapegoatTree } from "./scapegoatTree";
import { scapegoatTreeContract } from "./scapegoatTree.contract";

runContract(() => new ScapegoatTree<number>(), scapegoatTreeContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), scapegoatTreeContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});
