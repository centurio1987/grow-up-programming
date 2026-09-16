/**
 * `trie/trie` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./trie.contract.ts` 에 있고 — 그
 * 파일은 `trie/ternarySearchTree` 의 스위트를 그대로 내보낸다 — 계약 자체는 `./trie.ts` 헤더
 * 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * **이 파일이 도는 것이 성격 전환의 실증이다.** 같은 스위트가 자리마다 옆으로 견주는 정본과
 * 자리마다 표로 찾는 정본을 **둘 다 통과시킨다.** 통과시키지 못하면 계약이 담는 모양을
 * 처방하고 있는 것이다.
 *
 * 물려받은 손 테스트는 옮기지 않았다. 짚던 자리(중복 넣기 · 빈 낱말 · 접두사인 낱말 지우기 ·
 * 없는 낱말 지우기)를 계약 스위트의 경계 케이스가 짚고, 나머지는 무작위 교차검증이 참조 모델과
 * 대조한다. 그중 둘은 벽시계 단정이었다(고정 n 에서 100ms · 50ms). 고정 n 의 임계값이 재는 것은
 * 복잡도 등급이 아니라 그 기계의 상수다(불변 사실 7). 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { Trie as Reference } from "./_reference/trie";
import { Trie } from "./trie";
import { trieContract } from "./trie.contract";

runContract(() => new Trie(), trieContract, { label: "스텁" });

runContract(() => new Reference(), trieContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference() },
});
