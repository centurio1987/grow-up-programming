/**
 * `heap/pairingHeap` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./pairingHeap.contract.ts` 에
 * 있고, 계약 자체는 `./pairingHeap.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 두 대상 다 껍데기(`MergeSite`)를 거친다. `merge` 가 두 번째 큐를 인자로 받으므로 하네스가
 * 팩토리 하나로는 그 자리를 만들지 못한다. 껍데기는 `heap/leftistHeap` 의 것을 그대로 쓴다.
 *
 * 비교자를 팩토리가 주입한다. 계약이 기본 비교자를 두지 않기로 했으므로 스위트도 방향을 하나
 * 골라 넣어야 하고, 고른 방향은 계약의 일부가 아니다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { ascending, MergeSite } from "../leftistHeap/leftistHeap.contract";
import { PairingHeap as Reference } from "./_reference/pairingHeap";
import { PairingHeap } from "./pairingHeap";
import { pairingHeapContract } from "./pairingHeap.contract";

runContract(
  () => new MergeSite<number>(() => new PairingHeap<number>(ascending)),
  pairingHeapContract,
  { label: "스텁" },
);

runContract(
  () => new MergeSite<number>(() => new Reference<number>(ascending)),
  pairingHeapContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new MergeSite<number>(() => new Reference<number>(ascending)),
    },
  },
);
