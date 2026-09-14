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
 * 1. **계약 스위트 다섯 시나리오로는 안 걸린다.** `CopySplitRadixTree` 가 전부 통과한다 — 스위트의
 *    낱말 길이가 8 로 고정이라 꼬리도 8 글자를 넘지 않는다. **통과하는 것 중 `insert` · `delete` 는
 *    계약 위반이다**(불변 사실 62 가 요구하는 기록). 로그 인수(53)와 달리 해상도의 한계가 아니라
 *    **시나리오가 그 자리를 겨누지 않은 것**이다(63 과 같은 모양).
 * 2. **그 자리를 겨누는 입력을 지으면 걸린다.** 아래 `LONG_NEIGHBOUR` 시나리오 둘이 사다리로 키우는
 *    것은 담긴 낱말 수가 아니라 **곁에 선 긴 낱말의 길이**다. 넣고 지우는 낱말은 한 글자라 m = 1 로
 *    눌리므로 계약이 요구하는 성장은 `O(1)` 이다. 곁에 선 낱말의 길이는 표의 어느 상한에도 들어오지
 *    않는다 — 그래서 이 입력은 특정 구현의 내부를 읽고 만든 것이 아니라 계약의 상한을 겨눈 것이다
 *    (불변 사실 44).
 *
 * | 시나리오(곁에 선 낱말 길이 1,024 → 4,096) | 정본 | `CopySplitRadixTree` |
 * |---|---|---|
 * | 계약 스위트 insert O(1) | 8 → 10 | 통과 18 → 18 (위반) |
 * | 계약 스위트 delete O(1) (적대적) | 15 → 16 | 통과 20 → 20 (위반) |
 * | 곁에 긴 낱말 · insert O(1) | 4 → 4 | **걸림** 1,027 → 4,099 (r = 3.99) |
 * | 곁에 긴 낱말 · delete O(1) | 4 → 4 | **걸림** 1,027 → 4,099 (r = 3.99) |
 *
 * 나머지 세 스위트 시나리오(search · startsWith·wordsWithPrefix · size)는 두 구현의 걸음이 같다 —
 * 쪼개기·합치기를 부르지 않기 때문이다.
 *
 * **이 시나리오 둘은 계약 스위트가 아니다.** 스위트는 `trie/ternarySearchTree` 한 곳에 있고
 * (`src/data-structures/trie/ternarySearchTree/ternarySearchTree.contract.ts`), 이 배치는 그 파일을
 * 고치지 않는다. 여기서는 스위트에 넣었을 때 **다른 정본을 떨어뜨리지 않는가**까지 함께 잰다 —
 * 삼분 정본 16 → 16 · 자리마다 표 정본 2 → 2 로 셋 다 통과한다.
 */

import { describe, expect, test } from "bun:test";
import { RadixTree } from "../trie/radixTree/_reference/radixTree";
import { radixTreeContract } from "../trie/radixTree/radixTree.contract";
import { TernarySearchTree } from "../trie/ternarySearchTree/_reference/ternarySearchTree";
import type { TernarySearchTreeContract } from "../trie/ternarySearchTree/ternarySearchTree.contract";
import { Trie } from "../trie/trie/_reference/trie";
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

/** 첫 글자가 `first` 이고 길이가 `length` 인 낱말. 나머지 글자는 무작위다. */
function longWord(first: string, length: number, rng: () => number): string {
  let word = first;
  while (word.length < length)
    word += String.fromCharCode(97 + Math.floor(rng() * 26));
  return word;
}

/** 첫 글자가 서로 다른 긴 낱말 여덟. 한 호출 최대 비용을 한 번이 아니라 여덟 번에서 고른다. */
const FIRSTS = "abcdefgh";

/**
 * 곁에 긴 낱말이 선 자리에 그 첫 글자 하나를 넣고(`insert`) 지운다(`delete`). 사다리의 n 은
 * **곁에 선 낱말의 길이**다. 긴 낱말을 세우는 일은 준비이고 재지 않는다.
 */
const LONG_NEIGHBOUR: readonly CostScenario<TernarySearchTreeContract>[] = [
  {
    covers: ["insert"],
    qualifier: "worst",
    bound: "O(1)",
    adversarial: true,
    run: (impl, n, ctx) => {
      for (const first of FIRSTS) {
        impl.insert(longWord(first, n, ctx.rng));
        ctx.step(() => impl.insert(first));
      }
    },
  },
  {
    covers: ["delete"],
    qualifier: "worst",
    bound: "O(1)",
    adversarial: true,
    run: (impl, n, ctx) => {
      for (const first of FIRSTS) {
        impl.insert(longWord(first, n, ctx.rng));
        impl.insert(first);
        ctx.step(() => impl.delete(first));
      }
    },
  },
];

function verdicts(
  cost: CostSource<TernarySearchTreeContract>,
  scenarios: readonly CostScenario<TernarySearchTreeContract>[],
): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of scenarios) {
    const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    found[label] = judgeScenario(cost, scenario, radixTreeContract.grade).ok;
  }
  return found;
}

// 결함은 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new CopySplitRadixTree(), radixTreeContract, {
  label: "결함 fixture CopySplitRadixTree",
});

describe("RadixTree 축3 — 꼬리를 새로 만드는 쪼개기", () => {
  test("계약 스위트 다섯 시나리오는 정본과 결함을 둘 다 통과시킨다 — 결함의 insert · delete 는 계약 위반이다", () => {
    const all = {
      insert: true,
      search: true,
      "startsWith·wordsWithPrefix (적대적)": true,
      "delete (적대적)": true,
      size: true,
    };
    expect(verdicts(reference, radixTreeContract.scenarios)).toEqual(all);
    // **계약 위반인데 통과한다.** 스위트 낱말 길이가 8 로 고정이라 꼬리가 8 글자를 넘지 않는다.
    expect(verdicts(copySplit, radixTreeContract.scenarios)).toEqual(all);
  });

  test("곁에 긴 낱말을 세우면 결함만 insert · delete 에서 걸린다", () => {
    expect(verdicts(reference, LONG_NEIGHBOUR)).toEqual({
      "insert (적대적)": true,
      "delete (적대적)": true,
    });
    expect(verdicts(copySplit, LONG_NEIGHBOUR)).toEqual({
      "insert (적대적)": false,
      "delete (적대적)": false,
    });
    const scenario =
      LONG_NEIGHBOUR[0] as CostScenario<TernarySearchTreeContract>;
    const verdict = judgeScenario(copySplit, scenario, "invariant");
    expect(verdict.reason).toContain("O(1)");
    // 옮긴 글자 수가 곁에 선 낱말 길이를 따라간다.
    for (const point of verdict.points)
      expect(point.stat).toBeGreaterThan(point.n);
  });

  test("그 시나리오 둘은 다른 두 정본도 떨어뜨리지 않는다", () => {
    const both = { "insert (적대적)": true, "delete (적대적)": true };
    expect(
      verdicts(
        source(() => new TernarySearchTree()),
        LONG_NEIGHBOUR,
      ),
    ).toEqual(both);
    expect(
      verdicts(
        source(() => new Trie()),
        LONG_NEIGHBOUR,
      ),
    ).toEqual(both);
  });
});
