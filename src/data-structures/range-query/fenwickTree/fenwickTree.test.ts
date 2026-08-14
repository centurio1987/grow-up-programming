/**
 * `range-query/fenwickTree` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./fenwickTree.contract.ts`
 * 에 있고, 계약 자체는 `./fenwickTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 이 구조가 자리 수를 생성자로 받기 때문이다
 * (`./fenwickTree.contract.ts` 헤더의 껍데기 설명 — 불변 사실 83).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { FenwickTree as Reference } from "./_reference/fenwickTree";
import { FenwickTree } from "./fenwickTree";
import { fenwickTreeContract, Sized } from "./fenwickTree.contract";

runContract(() => new Sized((n) => new FenwickTree(n)), fenwickTreeContract, {
  label: "스텁",
});

runContract(() => new Sized((n) => new Reference(n)), fenwickTreeContract, {
  label: "정본",
  cost: {
    kind: "self-reported",
    make: () => new Sized((n) => new Reference(n)),
  },
});
