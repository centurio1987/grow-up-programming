/**
 * `heap/priorityQueue` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./priorityQueue.contract.ts`
 * 에 있고, 계약 자체는 `./priorityQueue.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 비교자를 팩토리가 주입한다. 계약이 기본 비교자를 두지 않기로 했으므로(헤더 「주입 정책」)
 * 스위트도 방향을 하나 골라 넣어야 하고, 고른 방향은 계약의 일부가 아니다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { PriorityQueue as Reference } from "./_reference/priorityQueue";
import { PriorityQueue } from "./priorityQueue";
import { ascending, priorityQueueContract } from "./priorityQueue.contract";

runContract(() => new PriorityQueue<number>(ascending), priorityQueueContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(ascending), priorityQueueContract, {
  label: "정본",
  cost: {
    kind: "self-reported",
    make: () => new Reference<number>(ascending),
  },
});
