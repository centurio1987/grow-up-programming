/**
 * `tree/bPlusTree` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./bPlusTree.contract.ts` 에
 * 있고 — 그 파일은 `tree/redBlackTree` 의 스위트를 그대로 내보낸다 — 계약 자체는
 * `./bPlusTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * **이 파일이 도는 것이 성격 전환의 실증이다.** 같은 스위트가 원소를 잎에만 두고 사슬로
 * 잇는 정본과 자리마다 값을 담는 정본을 **둘 다 통과시킨다.** 통과시키지 못하면 계약이
 * 원소를 어디에 두는지를 처방하고 있는 것이다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { BPlusTree as Reference } from "./_reference/bPlusTree";
import { BPlusTree } from "./bPlusTree";
import { bPlusTreeContract } from "./bPlusTree.contract";

runContract(() => new BPlusTree<number>(), bPlusTreeContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), bPlusTreeContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});
