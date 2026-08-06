/**
 * `tree/bPlusTree` 계약 스위트(규약2).
 *
 * **여기에는 스위트가 없다.** `tree/redBlackTree` 의 `ContractSpec` 을 그대로 내보내고
 * 이름표만 바꾼다. 계약이 같으므로(`./bPlusTree.ts` 헤더 맨 앞) 스위트도 같아야 하고,
 * 같아야 하는 것을 두 벌 적으면 그 둘이 갈린다 — 갈린 자리가 곧 ORD-006 이 고치려는
 * 결함이다.
 *
 * **복사가 아니라 같은 객체다.** `ops`·`edges`·`invariants`·`scenarios` 가 전부 저쪽
 * 파일의 그것이고, 여기서 바꾸는 것은 실패 보고에 찍히는 `name` 하나뿐이다. 저쪽 계약이
 * 움직이면 이쪽이 자동으로 따라가므로 표류할 자리가 없다.
 *
 * **`range` 시나리오를 이 구조에 맞춰 다시 짓지 않는다.** 잎 사슬이 그 연산을 싸게 하는
 * 것은 맞지만 싸다는 것은 상수 배수이고, 시나리오를 그쪽에 맞춰 지으면 **사슬 없는 구현을
 * 떨어뜨리는 스위트**가 된다 — 계약이 처방하지 않기로 한 것을 스위트가 처방하는 자리다
 * (불변 사실 44).
 */

import {
  type RedBlackTreeContract,
  redBlackTreeContract,
} from "../redBlackTree/redBlackTree.contract";

/** 정렬 집합 `worst` 계약의 표면. 이름만 이 구조의 것으로 다시 부른다. */
export type BPlusTreeContract<T> = RedBlackTreeContract<T>;

export const bPlusTreeContract: typeof redBlackTreeContract = {
  ...redBlackTreeContract,
  name: "BPlusTree",
};
