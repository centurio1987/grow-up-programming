/**
 * 하네스 자기시험 — `linear/bitArray` 계약 앞에 선 정본 · 결함 둘 · 판정 도구 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로 인용하는
 * 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 셋이다.
 *
 * 1. **넷 다 동작상 옳다.** 축1 · 축2(공집합)를 전부 통과한다.
 * 2. **판정 도구 `BooleanSlotBits` 는 축3 네 시나리오를 정본과 같은 값으로 통과한다.** 이 구조가 이름을
 *    얻은 공간 제약(자리 하나가 비트 하나)을 무시한 구현이다. 어느 축도 그것을 가르지 못한다는 것이
 *    「공간이 존재 이유」 판별 절차 셋째 걸음의 실행 결과이고(`docs/ORD-006-conventions.md:2870-2877`), 그래서
 *    이 계약은 B15 처분이다. 공간 차이 자체는 실재한다 — 자리 1,000,000 개의 힙 증가가 정본 126,044 B ·
 *    이 구현 8,004,902 B 였다(`bun:jsc` `heapStats` 탐침, 두 번 같은 값). 힙은 GC 시점에 흔들려 여기서 단정하지 않는다.
 * 3. **결함 둘이 축3에서 행 단위로 따로 걸린다**(불변 사실 84). 둘 다 켜진 자리 번호만큼만 담는 표현이다 —
 *    드문 배열에서 자리를 아끼는 계열이 시간 상한에서 떨어진다.
 *
 * | 시나리오 (n = 1,024 → 4,096) | 정본 | `BooleanSlotBits` | `PositionListBits` | `SortedPositionBits` |
 * |---|---|---|---|---|
 * | `set` amortized O(1) 섞은 차례 | 1.00 → 1.00 | 통과 1.00 → 1.00 | **걸림** 512.50 → 2,048.50 | **걸림** 268.72 → 1,036.63 |
 * | `clear` amortized O(1) 섞은 차례 | 1.00 → 1.00 | 통과 1.00 → 1.00 | **걸림** 266.18 → 1,020.82 | **걸림** 264.03 → 1,036.11 |
 * | `get` worst O(1) 짝수 자리만 켬 | 1 → 1 | 통과 1 → 1 | **걸림** 512 → 2,048 | 통과 11 → 13 (**위반**) |
 * | `size` worst O(1) | 1 → 1 | 통과 | 통과 | 통과 |
 * | 축1 · 축2 | 통과 | 통과 | 통과 | 통과 |
 *
 * **`SortedPositionBits` 의 `get` 통과는 계약 위반이다.** 이분 탐색이라 켜진 수의 로그에 비례하는데 로그 인수가
 * 사다리 해상도 아래라 통과한다(불변 사실 53 · 62). 이름으로 적어 둔다 — 안 적으면 그 통과가 「계약을 지킨다」로
 * 읽힌다.
 *
 * **한 방향 차례는 두 결함 중 어느 것도 더 가르지 못했다(탐침, 불변 사실 57).** 오름차순으로 켜기 · 내림차순으로
 * 끄기는 `SortedPositionBits` 가 끝에서만 붙이고 떼어 통과하고(10.01 → 12.00 · 10.52 → 12.51), 반대 방향은 섞은 차례와
 * 같은 결함을 같은 계급으로 잡는다(522.50 → 2,060.50). `PositionListBits` 는 어느 차례에서나 걸린다. 그래서 스위트는
 * 섞은 차례 하나를 두고 적대적 시나리오를 두지 않았다.
 */

import { describe, expect, test } from "bun:test";
import { BitArray as Reference } from "../linear/bitArray/_reference/bitArray";
import {
  bitArrayContract,
  SizedBits,
} from "../linear/bitArray/bitArray.contract";
import { BooleanSlotBits } from "./_fixtures/booleanSlotBits";
import { PositionListBits } from "./_fixtures/positionListBits";
import { SortedPositionBits } from "./_fixtures/sortedPositionBits";
import { type CostSource, judgeScenario, runContract } from "./runContract";

type Maker = ConstructorParameters<typeof SizedBits>[0];

function source(make: Maker): CostSource<SizedBits> {
  return { kind: "self-reported", make: () => new SizedBits(make) };
}

const reference = source((n) => new Reference(n));
const booleanSlot = source((n) => new BooleanSlotBits(n));
const positionList = source((n) => new PositionListBits(n));
const sortedPosition = source((n) => new SortedPositionBits(n));

/** 시나리오마다 `행 → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(cost: CostSource<SizedBits>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of bitArrayContract.scenarios) {
    found[scenario.covers.join("·")] = judgeScenario(
      cost,
      scenario,
      bitArrayContract.grade,
    ).ok;
  }
  return found;
}

const ALL_PASS = { set: true, clear: true, get: true, size: true };

// 1. 넷 다 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () => new SizedBits((n) => new BooleanSlotBits(n)),
  bitArrayContract,
  { label: "판정 도구 fixture BooleanSlotBits" },
);
runContract(
  () => new SizedBits((n) => new PositionListBits(n)),
  bitArrayContract,
  { label: "결함 fixture PositionListBits" },
);
runContract(
  () => new SizedBits((n) => new SortedPositionBits(n)),
  bitArrayContract,
  { label: "결함 fixture SortedPositionBits" },
);

describe("BitArray 축3 — 공간 제약을 무시한 구현은 어느 행에서도 갈리지 않는다", () => {
  test("정본은 네 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("자리마다 불리언 하나를 담는 언어 배열도 네 시나리오를 전부 통과하고, 매 시나리오 통계가 정본과 같다", () => {
    expect(verdicts(booleanSlot)).toEqual(ALL_PASS);
    for (const scenario of bitArrayContract.scenarios) {
      const ours = judgeScenario(booleanSlot, scenario, bitArrayContract.grade);
      const theirs = judgeScenario(reference, scenario, bitArrayContract.grade);
      expect(ours.points).toEqual(theirs.points);
    }
  });
});

describe("BitArray 축3 — 켜진 자리 번호만큼 담는 결함 둘이 행 단위로 따로 걸린다", () => {
  test("번호를 순서 없이 늘어놓으면 set · clear · get 에서 걸린다", () => {
    expect(verdicts(positionList)).toEqual({
      ...ALL_PASS,
      set: false,
      clear: false,
      get: false,
    });
  });

  test("번호를 정렬해 이분 탐색하면 set · clear 에서만 걸리고 get 은 계약 위반인 채로 통과한다", () => {
    expect(verdicts(sortedPosition)).toEqual({
      ...ALL_PASS,
      set: false,
      clear: false,
    });
  });
});
