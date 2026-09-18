/**
 * `linear/pieceTable` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책** 하나만 둔다. 무엇을 검사하는지는 `./pieceTable.contract.ts` 에
 * 있고, 계약 자체는 `./pieceTable.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은 정본에만 돈다 — 학습자
 * 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 생성자가 인자를 받지 않으므로 껍데기가 없다(`./pieceTable.contract.ts` 헤더).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「1,000회 insert 연산이 100ms 이내」가 재는 것은 그 기계의 상수다.
 * 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { PieceTable as Reference } from "./_reference/pieceTable";
import { PieceTable } from "./pieceTable";
import {
  type PieceTableContract,
  pieceTableContract,
} from "./pieceTable.contract";

runContract(() => new PieceTable<number>(), pieceTableContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), pieceTableContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});

/**
 * 주입 정책은 계약의 일부다(규약1). 넘긴 배열 · 돌려받은 배열을 붙들지 않는다는 약속은 호출자 쪽 배열을 고쳐 봐야 드러나므로
 * 참조 모델 대조(축1)가 담지 못한다.
 */
function checkInjectionPolicy(
  label: string,
  make: () => PieceTableContract<number>,
): void {
  describe(`PieceTable 주입 정책 [${label}]`, () => {
    test("넘긴 배열 · 돌려받은 배열을 고쳐도 담긴 수열은 그대로다", () => {
      const sequence = make();
      const given = [1, 2, 3];
      sequence.insert(0, given);
      given[1] = 100;
      given.push(4);
      const listed = sequence.toArray();
      expect(listed).toEqual([1, 2, 3]);
      listed[0] = -1;
      expect(sequence.toArray()).toEqual([1, 2, 3]);
    });
  });
}

checkInjectionPolicy("스텁", () => new PieceTable<number>());
checkInjectionPolicy("정본", () => new Reference<number>());
