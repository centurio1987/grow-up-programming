/**
 * `linear/monotonicStack` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./monotonicStack.contract.ts` 에 있고,
 * 계약 자체는 `./monotonicStack.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 물려받은 스위트는 상태 없는 함수 셋(`nextGreater` · `prevGreater` · `nextSmaller`)을 손으로 쓴 단정과
 * 「10^5 원소를 100ms 안에」 벽시계 셋으로 쟀다. 표면이 바뀌어 전부 걷어 냈고, 벽시계의 자리는 축3이다
 * (불변 사실 7).
 */

import { runContract } from "../../_contract/runContract";
import { MonotonicStack as Reference } from "./_reference/monotonicStack";
import { MonotonicStack } from "./monotonicStack";
import { ascending, monotonicStackContract } from "./monotonicStack.contract";

runContract(
  () => new MonotonicStack<number>(ascending),
  monotonicStackContract,
  { label: "스텁" },
);

runContract(() => new Reference<number>(ascending), monotonicStackContract, {
  label: "정본",
  cost: {
    kind: "self-reported",
    make: () => new Reference<number>(ascending),
  },
});
