/**
 * `trie/radixTree` 계약 스위트(규약2).
 *
 * **여기에는 스위트가 없다.** `trie/ternarySearchTree` 의 `ContractSpec` 을 그대로 내보내고
 * 이름표만 바꾼다. 계약이 같으므로(`./radixTree.ts` 헤더 맨 앞) 스위트도 같아야 하고, 같아야
 * 하는 것을 두 벌 적으면 그 둘이 갈린다 — 갈린 자리가 곧 ORD-006 이 고치려는 결함이다.
 *
 * **복사가 아니라 같은 객체다.** `ops`·`edges`·`invariants`·`scenarios` 가 전부 저쪽 파일의
 * 그것이고, 여기서 바꾸는 것은 실패 보고에 찍히는 `name` 하나뿐이다. 저쪽 계약이 움직이면
 * 이쪽이 자동으로 따라가므로 표류할 자리가 없다.
 *
 * **이 스위트가 재지 않는 자리가 하나 있고 여기서 메우지 않는다.** 꼬리를 새 문자열로 만들어
 * 쪼개는 구현이 계약을 어기는데 다섯 시나리오를 전부 통과한다(`./radixTree.ts` 헤더). 시나리오를
 * 이 파일에 더하면 스위트가 두 벌이 되므로, 그 자리를 겨누는 입력은 자기시험
 * (`src/data-structures/_contract/runContract.radixTree.test.ts`)에서만 돌린다.
 *
 * 표면 이름이 같아서 껍데기(어댑터)가 필요 없다 — 성격 전환이 물려받은 표면을 정본의 표면으로
 * 맞췄기 때문이다(마디 인터페이스 · private 필드 · 생성자를 뺀 자리).
 */

import {
  type TernarySearchTreeContract,
  ternarySearchTreeContract,
} from "../ternarySearchTree/ternarySearchTree.contract";

/** 문자열 집합 계약의 표면. 이름만 이 구조의 것으로 다시 부른다. */
export type RadixTreeContract = TernarySearchTreeContract;

export const radixTreeContract: typeof ternarySearchTreeContract = {
  ...ternarySearchTreeContract,
  name: "RadixTree",
};
