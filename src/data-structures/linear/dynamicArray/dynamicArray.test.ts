/**
 * `linear/dynamicArray` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./dynamicArray.contract.ts` 에 있고,
 * 계약 자체는 `./dynamicArray.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트가 `capacity()` 의 값(처음 4 · 두 배 ·
 * 절반)을 단정하던 시험도 옮기지 않았다 — 헤더가 그 표면을 뺐다.
 */

import { runContract } from "../../_contract/runContract";
import { DynamicArray as Reference } from "./_reference/dynamicArray";
import { DynamicArray } from "./dynamicArray";
import { dynamicArrayContract } from "./dynamicArray.contract";

runContract(() => new DynamicArray<number>(), dynamicArrayContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), dynamicArrayContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});
