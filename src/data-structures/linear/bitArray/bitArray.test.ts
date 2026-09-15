/**
 * `linear/bitArray` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./bitArray.contract.ts` 에 있고, 계약 자체는
 * `./bitArray.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 자리 수를 생성자가 정하기 때문이다(`./bitArray.contract.ts` 머리말 — 불변
 * 사실 83).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^6 비트를 100ms 안에」 두 시험과 「32배
 * 압축」 시험은 옮기지 않았다 — 앞의 둘은 그 기계의 상수를 재고, 뒤의 것은 헤더가 계약 밖에 둔 공간을
 * 산수로 단정했다. `count` · `toggle` 시험도 헤더가 그 둘을 뺐으므로 옮기지 않았다. 결함 fixture 의 자기시험은
 * `../../_contract/runContract.bitArray.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { BitArray as Reference } from "./_reference/bitArray";
import { BitArray } from "./bitArray";
import { bitArrayContract, SizedBits } from "./bitArray.contract";

runContract(() => new SizedBits((n) => new BitArray(n)), bitArrayContract, {
  label: "스텁",
});

runContract(() => new SizedBits((n) => new Reference(n)), bitArrayContract, {
  label: "정본",
  cost: {
    kind: "self-reported",
    make: () => new SizedBits((n) => new Reference(n)),
  },
});
