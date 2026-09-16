/**
 * 하네스 자기시험 — `trie/ahoCorasick` 계약(고정한 패턴 집합의 모든 출현 · T5-08).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 **계약을 어긴 구현을 실제로 떨어뜨리는지**, 그리고
 * **떨어뜨리지 못하는 자리가 어디인지**를 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts`
 * 머리말과 같다(불변 사실 106·255).
 *
 * 묶음이 넷이다 — 축3 결함 계열의 행 귀속, 구성 시점과 `worst` 의 근거, `trie/suffixTree` 와의 거울상(통과하는 로그 인수 포함),
 * 축1 과 정본 변이.
 */

import { describe, expect, test } from "bun:test";
import { AhoCorasick as Reference } from "../trie/ahoCorasick/_reference/ahoCorasick";
import {
  ahoCorasickContract,
  binaryPattern,
  FIXED_TEXT,
  FIXED_WORDS,
  PATTERN_WIDTH,
  Reindexable,
} from "../trie/ahoCorasick/ahoCorasick.contract";
import { SuffixTree } from "../trie/suffixTree/_reference/suffixTree";
import { DeferredAhoCorasick } from "./_fixtures/deferredAhoCorasick";
import { OutputRuleAutomaton } from "./_fixtures/outputRuleAutomaton";
import { PatternwiseScanMatcher } from "./_fixtures/patternwiseScanMatcher";
import { RestartingTrieMatcher } from "./_fixtures/restartingTrieMatcher";
import { rngFrom } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Measured = {
  search(text: string): Map<string, number[]>;
  __cost: number;
};
type Maker = (patterns: string[]) => Measured;

/**
 * `trie/suffixTree` 정본으로 이 계약의 표면을 지은 구현 — 검색마다 텍스트로 접미사 트리를 짓고 서로 다른 패턴마다 자리를 모은다.
 * 거울상 판정의 한 방향이고 계약을 어기는 비교 구현이라 fixture 가 아니라 여기 둔다(저쪽 정본을 읽기만 한다).
 */
class SuffixIndexMatcher {
  readonly #words: string[] = [];
  #own = 0;
  #spent = 0;

  constructor(patterns: string[]) {
    const seen = new Set<string>();
    for (const word of patterns) {
      this.#own += 1;
      if (seen.has(word)) continue;
      seen.add(word);
      this.#words.push(word);
    }
  }

  get __cost(): number {
    return this.#own + this.#spent;
  }

  search(text: string): Map<string, number[]> {
    const tree = new SuffixTree(text);
    const found = new Map<string, number[]>();
    for (const word of this.#words) {
      const starts = tree.findAll(word).sort((a, b) => a - b);
      if (starts.length > 0) found.set(word, starts);
    }
    this.#spent += tree.__cost;
    return found;
  }
}

const makers = {
  reference: (patterns) => new Reference(patterns),
  patternwise: (patterns) => new PatternwiseScanMatcher(patterns),
  restarting: (patterns) => new RestartingTrieMatcher(patterns),
  chain: (patterns) => new OutputRuleAutomaton(patterns, { output: "chain" }),
  copied: (patterns) => new OutputRuleAutomaton(patterns, { output: "copied" }),
  copyAppend: (patterns) =>
    new OutputRuleAutomaton(patterns, { append: "copy" }),
  deferred: (patterns) => new DeferredAhoCorasick(patterns),
  suffixIndex: (patterns) => new SuffixIndexMatcher(patterns),
} satisfies Record<string, Maker>;

function selfReported(make: Maker): CostSource<Reindexable> {
  return {
    kind: "self-reported",
    make: () =>
      new Reindexable(make) as Reindexable & {
        __cost: number;
      },
  };
}

/** 시나리오 다섯의 이름 — 계약 스위트의 차례 그대로다(같은 행 · 같은 한정자 시나리오가 여럿이라 `covers` 로 못 가른다). */
const SCENARIO_KEYS = [
  "구성 무작위",
  "구성 긴 패턴의 모든 자리에서 끝남",
  "검색 패턴 수",
  "검색 텍스트 k=0",
  "검색 텍스트 k=Θ(ℓ)",
] as const;

function verdicts(
  make: Maker,
): Record<string, { ok: boolean; stats: number[] }> {
  const result: Record<string, { ok: boolean; stats: number[] }> = {};
  ahoCorasickContract.scenarios.forEach((scenario, index) => {
    const verdict = judgeScenario(selfReported(make), scenario, "complexity");
    result[SCENARIO_KEYS[index] as string] = {
      ok: verdict.ok,
      stats: verdict.points.map((point) => point.stat),
    };
  });
  return result;
}

/** 경계 케이스와 무작위 시퀀스(seed 1 · 500 회)에서 처음 갈리는 자리. 갈리지 않으면 `null`. */
function firstBehaviorSplit(make: Maker): string | null {
  const byName = new Map(
    ahoCorasickContract.ops.map((op) => [op.name, op] as const),
  );
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);
  for (const edge of ahoCorasickContract.edges) {
    const impl = new Reindexable(make);
    const model = ahoCorasickContract.model();
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!same(observed, expected)) {
        return `${edge.name} / ${index}번째 ${step.op} — 관측 ${JSON.stringify(observed)} / 모델 ${JSON.stringify(expected)}`;
      }
    }
  }
  const rng = rngFrom(1);
  const impl = new Reindexable(make);
  const model = ahoCorasickContract.model();
  for (let index = 0; index < 500; index++) {
    const op =
      ahoCorasickContract.ops[
        Math.floor(rng() * ahoCorasickContract.ops.length)
      ];
    if (!op) throw new Error("연산 목록이 비었다");
    const arg = op.arg(rng);
    if (!same(op.onImpl(impl, arg), op.onModel(model, arg))) {
      return `무작위 ${index}번째 ${op.name}`;
    }
  }
  return null;
}

const PASS = (stats: number[]) => ({ ok: true, stats });
const FAIL = (stats: number[]) => ({ ok: false, stats });

describe("축3 — 패턴 집합 색인의 정본과 결함 계열(행 귀속)", () => {
  test("정본은 시나리오 다섯을 통과한다", () => {
    expect(verdicts(makers.reference)).toEqual({
      "구성 무작위": PASS([1665, 5883, 21192]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([1451, 5379, 20764]),
      "검색 패턴 수": PASS([181, 181, 181]),
      "검색 텍스트 k=0": PASS([2016, 8128, 32640]),
      "검색 텍스트 k=Θ(ℓ)": PASS([4033, 16257, 65281]),
    });
  });

  /** 자명한 구현 하나 — 검색이 패턴 수 × 텍스트 길이. 생성자는 목록의 칸만 읽어도 무작위 절반 덕에 계급 아래로 안 떨어진다. */
  test("패턴마다 훑는 구현은 검색 세 시나리오에서 걸린다", () => {
    expect(verdicts(makers.patternwise)).toEqual({
      "구성 무작위": PASS([112, 427, 1731]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([78, 268, 992]),
      "검색 패턴 수": FAIL([103143, 410343, 1639143]),
      "검색 텍스트 k=0": FAIL([33728, 266112, 2113280]),
      "검색 텍스트 k=Θ(ℓ)": FAIL([36834, 278466, 2162562]),
    });
  });

  /** 자명한 구현 둘 — 패턴 수에는 안 기대고 텍스트 길이 × 패턴 길이. 패턴 수 시나리오의 패턴 깊이는 텍스트에서 넷까지만 내려간다. */
  test("자리마다 트라이를 내려가는 구현은 텍스트 길이 끝 둘에서만 걸린다", () => {
    expect(verdicts(makers.restarting)).toEqual({
      "구성 무작위": PASS([1027, 4103, 16386]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([1027, 4103, 16391]),
      "검색 패턴 수": PASS([331, 331, 331]),
      "검색 텍스트 k=0": FAIL([34289, 268257, 2121665]),
      "검색 텍스트 k=Θ(ℓ)": FAIL([36306, 276386, 2154306]),
    });
  });

  test("실패 쪽 사슬을 끝까지 따라가 패턴을 찾는 구현은 텍스트 길이 끝 둘에서만 걸린다", () => {
    expect(verdicts(makers.chain)).toEqual({
      "구성 무작위": PASS([1665, 5883, 21192]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([1451, 5379, 20764]),
      "검색 패턴 수": PASS([393, 393, 393]),
      "검색 텍스트 k=0": FAIL([35313, 272353, 2138049]),
      "검색 텍스트 k=Θ(ℓ)": FAIL([37330, 280482, 2170690]),
    });
  });

  /** 물려받은 문서 3단계를 배열 복사로 옮긴 설계 — 끝나는 패턴 목록의 길이 합이 m·√m 까지 가서 구성만 걸린다. */
  test("끝나는 패턴 목록을 복사해 합치는 구현은 둘째 구성 시나리오에서만 걸린다", () => {
    expect(verdicts(makers.copied)).toEqual({
      "구성 무작위": PASS([3048, 12033, 44759]),
      "구성 긴 패턴의 모든 자리에서 끝남": FAIL([6970, 50652, 385556]),
      "검색 패턴 수": PASS([181, 181, 181]),
      "검색 텍스트 k=0": PASS([2016, 8128, 32640]),
      "검색 텍스트 k=Θ(ℓ)": PASS([4033, 16257, 65281]),
    });
  });

  /** 상한의 `+ k` 가 가르는 계열 — 답의 수 끝에서만 걸린다(`spatial/kdTree` 의 `sortedOutputPointIndex` 와 같은 자리). */
  test("답을 적을 때마다 배열을 복사하는 구현은 k = Θ(ℓ) 끝에서만 걸린다", () => {
    expect(verdicts(makers.copyAppend)).toEqual({
      "구성 무작위": PASS([1665, 5883, 21192]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([1451, 5379, 20764]),
      "검색 패턴 수": PASS([659, 659, 659]),
      "검색 텍스트 k=0": PASS([2016, 8128, 32640]),
      "검색 텍스트 k=Θ(ℓ)": FAIL([1020337, 16533345, 266411713]),
    });
  });
});

describe("축3 — 구성 시점(불변 사실 52 ③)과 두 행 worst 의 근거", () => {
  test("짓기를 첫 검색으로 미루는 구현은 구성을 통과하고 패턴 수 시나리오에서 걸린다", () => {
    expect(verdicts(makers.deferred)).toEqual({
      "구성 무작위": PASS([112, 427, 1731]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([78, 268, 992]),
      "검색 패턴 수": FAIL([20435, 81103, 323780]),
      "검색 텍스트 k=0": PASS([2116, 8324, 33028]),
      "검색 텍스트 k=Θ(ℓ)": PASS([4101, 16389, 65541]),
    });
  });

  /**
   * **불변 구조의 셋째 계열**(불변 사실 328 — `range-query/sparseTable` 선례). 짓자마자 검색 n 번을 전부 재면 단일 호출 최대가 걸리고
   * 호출 평균(짓는 몫을 검색 n 번에 나눈 것)은 통과한다. 정본은 두 통계 모두 181 이다.
   */
  test("짓기를 미루는 계열은 worst 로 걸리고 amortized 로 통과한다", () => {
    const searchesAfterBuild = (
      qualifier: "worst" | "amortized",
    ): CostScenario<Reindexable> => ({
      covers: ["search"],
      qualifier,
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const patterns = Array.from({ length: n }, (_, i) =>
          binaryPattern(i, PATTERN_WIDTH),
        );
        patterns.push(...FIXED_WORDS);
        impl.reindex(patterns);
        for (let k = 0; k < n; k++) {
          ctx.step(() => void impl.search(FIXED_TEXT));
        }
      },
    });
    const read = (make: Maker, qualifier: "worst" | "amortized") => {
      const verdict = judgeScenario(
        selfReported(make),
        searchesAfterBuild(qualifier),
        "complexity",
      );
      return {
        ok: verdict.ok,
        stats: verdict.points.map(
          (point) => Math.round(point.stat * 100) / 100,
        ),
      };
    };
    expect({
      deferredWorst: read(makers.deferred, "worst"),
      deferredAverage: read(makers.deferred, "amortized"),
      referenceWorst: read(makers.reference, "worst"),
      referenceAverage: read(makers.reference, "amortized"),
    }).toEqual({
      deferredWorst: FAIL([20435, 81103, 323780]),
      deferredAverage: PASS([200.78, 200.76, 200.75]),
      referenceWorst: PASS([181, 181, 181]),
      referenceAverage: PASS([181, 181, 181]),
    });
  });
});

describe("trie/suffixTree 와의 거울상 — 서로 담지 않는다(한 방향 실측)", () => {
  /**
   * 저쪽 정본으로 이쪽 표면을 지으면 검색이 패턴 수에 기대 중심 시나리오에서 걸린다. 텍스트 길이 끝 둘은 **통과한다** — 텍스트마다
   * 짓는 접미사 트리가 ℓ log ℓ 이라 이 계약의 `O(ℓ + k)` 를 로그 인수만큼 어기는데 비율 4.67 · 4.58 이 `O(n)` 구간 안이다(불변 사실
   * 53 · 62 — 통과하는 계약 위반).
   */
  test("접미사 트리로 지은 구현은 패턴 수 시나리오에서만 걸린다", () => {
    expect(verdicts(makers.suffixIndex)).toEqual({
      "구성 무작위": PASS([112, 427, 1731]),
      "구성 긴 패턴의 모든 자리에서 끝남": PASS([78, 268, 992]),
      "검색 패턴 수": FAIL([3690, 6762, 19050]),
      "검색 텍스트 k=0": PASS([60484, 282756, 1294596]),
      "검색 텍스트 k=Θ(ℓ)": PASS([62502, 290886, 1327238]),
    });
  });
});

describe("축1 과 정본 변이", () => {
  test("정본 · 결함 계열 · 비교 구현이 전부 경계 케이스와 무작위 시퀀스를 통과한다", () => {
    for (const make of Object.values(makers)) {
      expect(firstBehaviorSplit(make)).toBeNull();
    }
  });

  /** 정본의 변이(불변 사실 72) — 지금 상태에서 끝나는 패턴 하나만 적으면 진접미사에서 끝나는 패턴을 놓친다. */
  test("지금 상태의 패턴만 적는 사본은 고전 예제에서 갈린다", () => {
    expect(
      firstBehaviorSplit(
        (patterns) => new OutputRuleAutomaton(patterns, { output: "own" }),
      ),
    ).toBe(
      '고전 예제 — 나타난 패턴만 키가 된다 / 1번째 search — 관측 [["hers",[4]],["his",[1]],["she",[3]]] / 모델 [["he",[4]],["hers",[4]],["his",[1]],["she",[3]]]',
    );
  });

  test("무작위 시퀀스가 빈 패턴 · 겹친 패턴 목록 · 여러 키의 답을 지난다", () => {
    const rng = rngFrom(1);
    const model = ahoCorasickContract.model();
    let withEmpty = 0;
    let withDuplicate = 0;
    let keys = 0;
    let positions = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        ahoCorasickContract.ops[
          Math.floor(rng() * ahoCorasickContract.ops.length)
        ];
      if (!op) throw new Error("연산 목록이 비었다");
      const arg = op.arg(rng);
      const answer = op.onModel(model, arg);
      if (op.name === "reindex") {
        const list = arg as string[];
        if (list.includes("")) withEmpty += 1;
        if (new Set(list).size < list.length) withDuplicate += 1;
      } else {
        const found = answer as [string, number[]][];
        keys += found.length;
        for (const [, starts] of found) positions += starts.length;
      }
    }
    expect({ withEmpty, withDuplicate, keys, positions }).toEqual({
      withEmpty: 27,
      withDuplicate: 30,
      keys: 269,
      positions: 791,
    });
  });
});
