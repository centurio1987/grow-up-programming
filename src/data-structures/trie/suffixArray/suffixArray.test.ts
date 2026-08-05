/**
 * `trie/suffixArray` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./suffixArray.contract.ts` 에
 * 있고, 계약 자체는 `./suffixArray.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수이고, 진단된 결함(구성이 $\Theta(n^2 \log n)$)은 그런 단정을
 * 통과한 채로 살아 있을 수 있다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { SuffixArray as Reference } from "./_reference/suffixArray";
import { SuffixArray } from "./suffixArray";
import { Rebuildable, suffixArrayContract } from "./suffixArray.contract";

runContract(
  () => new Rebuildable((s) => new SuffixArray(s)),
  suffixArrayContract,
  { label: "스텁" },
);

runContract(
  () => new Rebuildable((s) => new Reference(s)),
  suffixArrayContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new Rebuildable((s) => new Reference(s)),
    },
  },
);
