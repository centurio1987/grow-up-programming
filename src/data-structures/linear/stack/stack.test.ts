/**
 * `linear/stack` 계약 스위트 실행부(규약2).
 *
 * 손으로 쓴 단정을 두지 않는다. 동작 계약은 `stack.contract.ts` 의 경계 케이스와 무작위
 * 교차검증이 덮는다 — 같은 것을 두 곳에 적으면 그 둘이 갈린다. 규약1이 계약을 헤더 한
 * 곳으로 모은 것과 같은 이유다.
 *
 * **벽시계 성능 테스트를 없앴다.** 고정 n 에서 `performance.now()` 임계값을 두는 것은
 * 복잡도 등급이 아니라 그 기계의 상수를 재는 일이다(불변 사실 7). 자리는 축3이 가져갔다.
 */

import { runContract } from "../../_contract/runContract";
import { Stack as Reference } from "./_reference/stack";
import { Stack } from "./stack";
import { stackContract } from "./stack.contract";

/** 학습자 구현. 계측기가 없으므로 축1·축2만 돈다 — 스텁에 `__cost` 를 요구하지 않는다. */
runContract(() => new Stack<number>(), stackContract, { label: "스텁" });

/** 정본. 명세에 적은 상한을 실제로 지키는지 보는 것이 이 대상의 몫이다. */
runContract(() => new Reference<number>(), stackContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});
