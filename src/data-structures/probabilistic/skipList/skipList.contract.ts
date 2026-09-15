/**
 * `probabilistic/skipList` 계약 스위트(규약2).
 *
 * **여기에는 스위트가 없다.** `tree/treap` 의 `ContractSpec` 을 그대로 내보내고 이름표만 바꾼다. 계약이 같으므로
 * (`./skipList.ts` 헤더 맨 앞 — 연산 여덟 · 시간 한정자 · 주입 모형 안에서, 같은 헤더 「「같다」의 범위」) 스위트도 같아야 하고, 같아야 하는 것을 두 벌 적으면 그 둘이 갈린다 — 갈린 자리가 곧
 * ORD-006 이 고치려는 결함이다.
 *
 * **복사가 아니라 같은 객체다.** `model`·`ops`·`edges`·`invariants`·`scenarios` 가 전부 저쪽 파일의 그것이고, 여기서
 * 바꾸는 것은 실패 보고에 찍히는 `name` 하나뿐이다. 저쪽 계약이 움직이면 이쪽이 자동으로 따라가므로 표류할 자리가 없다.
 * 같은 객체라는 것은 `_contract/runContract.skipList.test.ts` 가 `toBe` 로 고정한다.
 *
 * 표면 이름이 같아서 껍데기(어댑터)가 필요 없다 — 성격 전환이 물려받은 표면을 정본의 표면으로 맞췄기 때문이다(정수 키를
 * 비교자 주입으로, `search` 를 `has` 로, `delete` 의 반환을 `boolean` 으로, `min`·`max`·`range`·`size` 를 넣은 자리).
 */

import {
  type TreapContract,
  treapContract,
} from "../../tree/treap/treap.contract";

/** 정렬 집합 `expected` 계약의 표면. 이름만 이 구조의 것으로 다시 부른다. */
export type SkipListContract<T> = TreapContract<T>;

export const skipListContract: typeof treapContract = {
  ...treapContract,
  name: "SkipList",
};
