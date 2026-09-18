/**
 * `hash/hashMapOpenAddressing` 계약 스위트 실행부(규약2).
 *
 * 무엇을 검사하는지는 `./hashMapOpenAddressing.contract.ts` 에 있고 — 그 파일은
 * `hash/hashMapChaining` 의 스위트를 그대로 내보낸다 — 계약 자체는
 * `./hashMapOpenAddressing.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 *
 * **이 파일이 도는 것이 성격 전환의 실증이다.** 같은 스위트가 한 자리에 여럿을 매다는 정본과
 * 옆자리로 밀어내는 정본을 **둘 다 통과시킨다.** 통과시키지 못하면 계약이 충돌 처리 기법을
 * 처방하고 있는 것이다.
 *
 * 여기 남은 손으로 쓴 테스트는 **이 기법이 특히 잘 놓치는 자리** 하나다. 계약 스위트의 경계
 * 케이스가 그 자리를 이미 겨누고 있지만(`hashMapChaining.contract.ts` 의 「몰린 자리의 가운데를
 * 지워도」), 지운 자리를 되쓰는 일까지는 경계 케이스로 못 담는다 — 되쓰지 않는 구현도 그
 * 케이스를 통과하고 표만 끝없이 자란다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7).
 */

import { expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { HashMapOpenAddressing as Reference } from "./_reference/hashMapOpenAddressing";
import { HashMapOpenAddressing } from "./hashMapOpenAddressing";
import { hashMapOpenAddressingContract } from "./hashMapOpenAddressing.contract";

const identity = (key: number): number => key;

runContract(
  () => new HashMapOpenAddressing<number, number>(identity),
  hashMapOpenAddressingContract,
  { label: "스텁" },
);

runContract(
  () => new Reference<number, number>(identity),
  hashMapOpenAddressingContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new Reference<number, number>((key) => {
          tick();
          return key;
        }),
    },
  },
);

test("한 키를 넣고 지우기를 되풀이해도 탐사가 길어지지 않는다", () => {
  const map = new Reference<number, number>(identity);
  const rounds = 20_000;
  for (let round = 0; round < rounds; round++) {
    map.set(7, round);
    map.delete(7);
  }
  expect(map.keys().length).toBe(0);

  // 지운 자리를 되쓰지 않는 구현은 여기서 표가 `rounds` 만큼 자라 있고, 그러면 한 번의
  // 열거가 담긴 수가 아니라 지나간 호출 수에 비례한다. 계약의 `keys` 행이 그것을 막는다.
  const before = map.__cost;
  map.keys();
  expect(map.__cost - before).toBeLessThan(rounds / 100);
});
