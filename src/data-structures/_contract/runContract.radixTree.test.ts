/**
 * 하네스 자기시험 — `trie/radixTree` 정본과 꼬리를 새로 만드는 결함 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106).
 *
 * **A군 판정이 논증으로만 남긴 자리를 여기서 잰다**(`docs/ORD-006-conventions.md` 「A군 17종 판정」
 * ② — 「압축 표현이 `O(m)` 을 지키는지는 구현이 가른다」). 에지를 쪼갤 때 딸린 꼬리를 새 문자열로
 * 만들면 꼬리 길이만큼 들고, 그 길이는 넣는 낱말의 길이 m 과 무관하다.
 *
 * 결과는 둘이다.
 *
 * 1. **담긴 낱말 수를 키우는 다섯 시나리오로는 안 걸린다.** `CopySplitRadixTree` 가 전부 통과한다 —
 *    그 다섯의 낱말 길이가 8 로 고정이라 꼬리도 8 글자를 넘지 않는다. **통과하는 것 중 `insert` ·
 *    `delete` 는 계약 위반이다**(불변 사실 62 가 요구하는 기록). 로그 인수(53)와 달리 해상도의 한계가
 *    아니라 **시나리오가 그 자리를 겨누지 않은 것**이다(63 과 같은 모양).
 * 2. **그 자리를 겨누는 「곁에 긴 낱말」 시나리오 둘에서 걸린다.** 둘이 사다리로 키우는 것은 담긴
 *    낱말 수가 아니라 **곁에 선 긴 낱말의 길이**다. 넣고 지우는 낱말은 한 글자라 m = 1 로 눌리므로
 *    계약이 요구하는 성장은 `O(1)` 이다. 곁에 선 낱말의 길이는 표의 어느 상한에도 들어오지 않는다 —
 *    그래서 이 입력은 특정 구현의 내부를 읽고 만든 것이 아니라 계약의 상한을 겨눈 것이다
 *    (불변 사실 44).
 *
 * **처음(S3)에는 둘을 이 파일에서만 돌렸고, S20 이 정본 스위트에 넣었다**
 * (`src/data-structures/trie/ternarySearchTree/ternarySearchTree.contract.ts` 시나리오 끝의 둘). 성격
 * 전환은 같은 객체를 쓰므로 `radixTreeContract.scenarios` 가 곧 그 일곱이다.
 *
 * | 시나리오(1,024 → 4,096) | 정본 | `CopySplitRadixTree` |
 * |---|---|---|
 * | insert O(1) — n 은 담긴 낱말 수 | 8 → 10 | 통과 18 → 18 (위반) |
 * | delete O(1) (적대적) — 같음 | 15 → 16 | 통과 20 → 20 (위반) |
 * | 곁에 긴 낱말 · insert O(1) (적대적) — n 은 곁에 선 낱말 길이 | 4 → 4 | **걸림** 1,027 → 4,099 (r = 3.99) |
 * | 곁에 긴 낱말 · delete O(1) (적대적) — 같음 | 4 → 4 | **걸림** 1,027 → 4,099 (r = 3.99) |
 *
 * 나머지 세 시나리오(search · startsWith·wordsWithPrefix · size)는 두 구현의 걸음이 같다 —
 * 쪼개기·합치기를 부르지 않기 때문이다. 다른 두 정본은 곁에 긴 낱말 둘에서 삼분 16 → 16 · 자리마다
 * 표 2 → 2 로 통과한다(각 구조의 `<name>.test.ts` 가 정본에 일곱을 전부 돌린다).
 */

import { describe, expect, test } from "bun:test";
import { RadixTree } from "../trie/radixTree/_reference/radixTree";
import { radixTreeContract } from "../trie/radixTree/radixTree.contract";
import type { TernarySearchTreeContract } from "../trie/ternarySearchTree/ternarySearchTree.contract";
import { CopySplitRadixTree } from "./_fixtures/copySplitRadixTree";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
  runContract,
} from "./runContract";

type Measured = TernarySearchTreeContract & { __cost: number };

function source(make: () => Measured): CostSource<TernarySearchTreeContract> {
  return { kind: "self-reported", make };
}

const reference = source(() => new RadixTree());
const copySplit = source(() => new CopySplitRadixTree());

/** 시나리오마다 `행 (적대적) → 통과 여부`. 같은 이름이 또 나오면 차례(`#2`)를 붙인다. */
function verdicts(
  cost: CostSource<TernarySearchTreeContract>,
): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of radixTreeContract.scenarios) {
    const base = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    let label = base;
    for (let nth = 2; label in found; nth++) label = `${base} #${nth}`;
    found[label] = judgeScenario(cost, scenario, radixTreeContract.grade).ok;
  }
  return found;
}

// 결함은 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new CopySplitRadixTree(), radixTreeContract, {
  label: "결함 fixture CopySplitRadixTree",
});

describe("RadixTree 축3 — 꼬리를 새로 만드는 쪼개기", () => {
  test("정본은 일곱 시나리오를 전부 통과하고, 결함은 곁에 긴 낱말 둘에서만 걸린다", () => {
    expect(verdicts(reference)).toEqual({
      insert: true,
      search: true,
      "startsWith·wordsWithPrefix (적대적)": true,
      "delete (적대적)": true,
      size: true,
      "insert (적대적)": true,
      "delete (적대적) #2": true,
    });
    expect(verdicts(copySplit)).toEqual({
      // **계약 위반인데 통과한다.** 담긴 낱말 수를 키우는 쪽은 낱말 길이가 8 이라 꼬리도 짧다.
      insert: true,
      search: true,
      "startsWith·wordsWithPrefix (적대적)": true,
      "delete (적대적)": true,
      size: true,
      // 곁에 긴 낱말 — 넣기 · 지우기
      "insert (적대적)": false,
      "delete (적대적) #2": false,
    });
  });

  test("걸리는 사유는 O(1) 행이고, 옮긴 글자 수가 곁에 선 낱말 길이를 따라간다", () => {
    // 스위트 끝의 둘이 곁에 긴 낱말 시나리오다.
    const longNeighbour: readonly CostScenario<TernarySearchTreeContract>[] =
      radixTreeContract.scenarios.slice(5);
    expect(longNeighbour.map((scenario) => scenario.covers.join("·"))).toEqual([
      "insert",
      "delete",
    ]);
    for (const scenario of longNeighbour) {
      const verdict = judgeScenario(copySplit, scenario, "invariant");
      expect(verdict.reason).toContain("O(1)");
      for (const point of verdict.points)
        expect(point.stat).toBeGreaterThan(point.n);
    }
  });
});
