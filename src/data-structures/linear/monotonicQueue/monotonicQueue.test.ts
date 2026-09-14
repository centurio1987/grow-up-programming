/**
 * `linear/monotonicQueue` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./monotonicQueue.contract.ts` 에 있고,
 * 계약 자체는 `./monotonicQueue.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 물려받은 스위트는 상태 없는 함수 둘(`slidingWindowMax` · `slidingWindowMin`)을 손으로 쓴 단정과
 * 「10^5 원소를 100ms 안에」 벽시계 셋으로 쟀다. 표면이 바뀌어 전부 걷어 냈고, 벽시계의 자리는 축3이다
 * (불변 사실 7). 물려받은 예시 하나(크기 3 창)는 계약 스위트의 경계 케이스로 옮겼다.
 */

import { runContract } from "../../_contract/runContract";
import { MonotonicQueue as Reference } from "./_reference/monotonicQueue";
import { MonotonicQueue } from "./monotonicQueue";
import { ascending, monotonicQueueContract } from "./monotonicQueue.contract";

runContract(
  () => new MonotonicQueue<number>(ascending),
  monotonicQueueContract,
  { label: "스텁" },
);

runContract(() => new Reference<number>(ascending), monotonicQueueContract, {
  label: "정본",
  cost: {
    kind: "self-reported",
    make: () => new Reference<number>(ascending),
  },
});
