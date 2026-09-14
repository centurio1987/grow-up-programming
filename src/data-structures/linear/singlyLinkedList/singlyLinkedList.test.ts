/**
 * `linear/singlyLinkedList` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./singlyLinkedList.contract.ts` 에 있고,
 * 계약 자체는 `./singlyLinkedList.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^5 번을 100ms 안에」 셋이
 * 재던 것은 복잡도 등급이 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { SinglyLinkedList as Reference } from "./_reference/singlyLinkedList";
import { SinglyLinkedList } from "./singlyLinkedList";
import { singlyLinkedListContract } from "./singlyLinkedList.contract";

runContract(() => new SinglyLinkedList<number>(), singlyLinkedListContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), singlyLinkedListContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});
