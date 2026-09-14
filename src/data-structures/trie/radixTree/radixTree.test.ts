/**
 * `trie/radixTree` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./radixTree.contract.ts` 에 있고 —
 * 그 파일은 `trie/ternarySearchTree` 의 스위트를 그대로 내보낸다 — 계약 자체는 `./radixTree.ts`
 * 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * **이 파일이 도는 것이 성격 전환의 실증이다.** 같은 스위트가 글자 하나씩 내려가는 두 정본과
 * 자식 하나뿐인 자리를 에지 하나로 접는 정본을 **모두 통과시킨다.** 통과시키지 못하면 계약이
 * 담는 모양을 처방하고 있는 것이다.
 *
 * 물려받은 손 테스트는 옮기지 않았다. 짚던 자리(중복 넣기 · 빈 낱말 · 접두사인 낱말 지우기 ·
 * 없는 낱말 지우기)를 계약 스위트의 경계 케이스가 짚고, 나머지는 무작위 교차검증이 참조 모델과
 * 대조한다. 에지를 쪼갠 뒤·합친 뒤를 짚던 두 테스트도 담는 모양이 아니라 값을 보고 있었고, 그
 * 값은 무작위 교차검증이 본다 — 정본에 대해 그 500 연산 안에서 쪼개기가 12 번, 합치기가 4 번
 * 일어난다(실측, 경계 케이스에서는 합치기 1 번). 벽시계 단정 둘(100ms · 50ms)은 버렸다
 * (불변 사실 7). 계약이 요구하는데 스위트가 재지 않는 자리 하나는
 * `src/data-structures/_contract/runContract.radixTree.test.ts` 가 따로 잰다.
 */

import { runContract } from "../../_contract/runContract";
import { RadixTree as Reference } from "./_reference/radixTree";
import { RadixTree } from "./radixTree";
import { radixTreeContract } from "./radixTree.contract";

runContract(() => new RadixTree(), radixTreeContract, { label: "스텁" });

runContract(() => new Reference(), radixTreeContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference() },
});
