/**
 * 하네스 자기시험 — `heap/vanEmdeBoasTree` 계약(정수 우주 위의 정렬 집합 · T2-05).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 통과시키는지가 아니라 **계약을
 * 어긴 구현을 실제로 떨어뜨리는지**, 그리고 **떨어뜨리지 못하는 자리가 어디인지**를 고정한다.
 * 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 106·255).
 *
 * **이 파일의 마지막 묶음이 Bound 판정의 근거다**(`docs/ORD-006-conventions.md` 「상한이 우주의 로그
 * 로그인 계약은 Bound 를 늘리지 않는다」). 판정 규격(`./judge.ts`)의 `O(1)`·`O(log n)` 구간이
 * $\log\log u$ 를 이미 받아들이고, 새 구간을 그어도 $O(\log u)$ 로 어기는 fixture 가 그 안에 든다는
 * 것을 수치로 못 박는다.
 *
 * **셋째 묶음은 그 앞의 둘과 반대쪽을 고정한다** — 4 배 사다리가 못 보는 로그 인수가 **사다리를
 * 비트 수로 읽는 시나리오 둘**에서는 보인다는 것이다. 판정 규격도 하네스도 그대로이고 바뀐 것은
 * 시나리오가 사다리의 n 을 읽는 방식 하나다.
 */

import { describe, expect, test } from "bun:test";
import { VanEmdeBoasTree as Reference } from "../heap/vanEmdeBoasTree/_reference/vanEmdeBoasTree";
import {
  FIXED_UNIVERSE,
  type IntegerUniverseSet,
  UniverseSite,
  vanEmdeBoasTreeContract,
} from "../heap/vanEmdeBoasTree/vanEmdeBoasTree.contract";
import { BitTrieIntegerSet } from "./_fixtures/bitTrieIntegerSet";
import { FlushingIntegerSet } from "./_fixtures/flushingIntegerSet";
import { HashPriorityTreapIntegerSet } from "./_fixtures/hashPriorityTreapIntegerSet";
import { ScanningBitSet } from "./_fixtures/scanningBitSet";
import { SortedArrayIntegerSet } from "./_fixtures/sortedArrayIntegerSet";
import { expectedRatio, judgeGrowth, rngFrom, SIZES, TOLERANCE } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
  measureScenario,
  runContract,
} from "./runContract";

type Measured = IntegerUniverseSet & { __cost: number };

function site(make: (universe: number) => Measured): CostSource<UniverseSite> {
  return {
    kind: "self-reported",
    make: () => new UniverseSite(make),
  };
}

const reference = site((universe) => new Reference(universe));
const scanningBitSet = site((universe) => new ScanningBitSet(universe));
const sortedArray = site((universe) => new SortedArrayIntegerSet(universe));
const bitTrie = site((universe) => new BitTrieIntegerSet(universe));
const flushing = site((universe) => new FlushingIntegerSet(universe));
const treap = site((universe) => new HashPriorityTreapIntegerSet(universe));

/**
 * **트립 fixture 는 계약을 지키는 쪽을 전부 지킨다 — 어기는 것은 비용뿐이다.** 계측기를 넘기지
 * 않으므로 여기서는 축1·축2 만 돈다(축3 은 아래 묶음들이 따로 잰다). 이 줄이 통과한다는 것이
 * 「답이 틀린 구현이 아니라 **계약을 지키면서 축3만 어기는 계열**」이라는 말의 근거다.
 */
runContract(
  () =>
    new UniverseSite((universe) => new HashPriorityTreapIntegerSet(universe)),
  vanEmdeBoasTreeContract,
  { label: "결함 fixture HashPriorityTreapIntegerSet" },
);

/**
 * 시나리오 차례마다의 자기시험 이름. **같은 이름이 또 나오면 차례를 붙인다** — 덮어쓰면 앞
 * 시나리오의 판정이 말없이 사라진다(§규약2 「성격 전환이 찾은 정본 스위트의 구멍은 정본 스위트
 * 끝에 한 벌을 붙여 막는다 — 적대 여부로 판정 이름을 가른다」 · `./runContract.test.ts` 의 같은 규칙).
 * 우주를 비트 수로 키우는 시나리오가 넷째와 행 · 적대 여부가 같아 `#2` 가 붙는 자리다.
 */
const LABELS: string[] = [];
for (const scenario of vanEmdeBoasTreeContract.scenarios) {
  const base = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
  let label = base;
  for (let nth = 2; LABELS.includes(label); nth++) label = `${base} #${nth}`;
  LABELS.push(label);
}

function labelOf(scenario: CostScenario<UniverseSite>): string {
  const label = LABELS[vanEmdeBoasTreeContract.scenarios.indexOf(scenario)];
  if (label === undefined) throw new Error("스위트에 없는 시나리오다");
  return label;
}

function outcomes(cost: CostSource<UniverseSite>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  vanEmdeBoasTreeContract.scenarios.forEach((scenario, index) => {
    result[LABELS[index] as string] = judgeScenario(
      cost,
      scenario,
      "complexity",
    ).ok;
  });
  return result;
}

function statsOf(
  cost: CostSource<UniverseSite>,
  label: string,
  scenario?: CostScenario<UniverseSite>,
): number[] {
  const chosen =
    scenario ?? vanEmdeBoasTreeContract.scenarios[LABELS.indexOf(label)];
  if (!chosen) throw new Error(`시나리오를 못 찾았다: ${label}`);
  return judgeScenario(cost, chosen, "complexity").points.map(
    (point) => point.stat,
  );
}

const INSERT = "insert (적대적)";
const DELETE = "delete (적대적)";
const QUERIES = "has·successor·predecessor";
const NEIGHBORS = "successor·predecessor·min·max·has (적대적)";
const UPDATES = "insert·delete (적대적)";
/** 우주를 **비트 수**로 키우는 사다리. 행과 적대 여부가 `NEIGHBORS` 와 같아 차례가 붙는다. */
const UNIVERSE_BITS = "successor·predecessor·min·max·has (적대적) #2";
/** 담긴 수를 **비트 수**로 키우는 사다리. 적대 여부가 `QUERIES` 와 달라 이름이 저절로 갈린다. */
const COUNT_BITS = "has·successor·predecessor (적대적)";

const ALL_PASS = {
  [INSERT]: true,
  [DELETE]: true,
  [QUERIES]: true,
  [NEIGHBORS]: true,
  [UPDATES]: true,
  [UNIVERSE_BITS]: true,
  [COUNT_BITS]: true,
};

describe("축3 — 정수 우주 위의 정렬 집합 계약의 정본", () => {
  test("정본이 일곱 시나리오를 전부 통과한다", () => {
    for (const scenario of vanEmdeBoasTreeContract.scenarios) {
      const verdict = judgeScenario(reference, scenario, "complexity");
      expect(verdict.ok ? "" : `${labelOf(scenario)} — ${verdict.reason}`).toBe(
        "",
      );
    }
  }, 60_000);

  /**
   * **우주를 키워도 내려가는 깊이가 같다.** u = $2^{10}$ · $2^{12}$ · $2^{14}$ 의 비트 수 10 · 12 · 14 를
   * 반씩 줄여 1 에 닿는 걸음이 셋 다 넷이다. 사다리가 $\log\log u$ 를 **한 칸도** 못 올린다는 것이 이
   * 계약의 축3이 그 상한을 `O(1)` 로 판정하는 이유의 실물이다.
   */
  test("우주를 키우는 두 시나리오에서 정본의 걸음이 사다리 세 점에서 같다", () => {
    expect(statsOf(reference, NEIGHBORS)).toEqual([19, 19, 19]);
    expect(statsOf(reference, UPDATES)).toEqual([17, 17, 17]);
  }, 60_000);

  test("무작위 시퀀스가 우주 밖 키와 거절되는 우주를 함께 지난다", () => {
    const rng = rngFrom(1);
    const model = vanEmdeBoasTreeContract.model();
    let rejectedKeys = 0;
    let rejectedResets = 0;
    let largest = 0;
    for (let index = 0; index < 500; index++) {
      const op =
        vanEmdeBoasTreeContract.ops[
          Math.floor(rng() * vanEmdeBoasTreeContract.ops.length)
        ];
      if (op === undefined) throw new Error("연산 목록이 비었다");
      const observed = op.onModel(model, op.arg(rng));
      if (observed === "RangeError") {
        if (op.name === "reset") rejectedResets += 1;
        else rejectedKeys += 1;
      }
      largest = Math.max(largest, model.items.size);
    }
    // 받아들이는 `reset` 은 무작위 시퀀스에 없으므로 담긴 수가 끊기지 않고 자란다.
    expect({ rejectedKeys, rejectedResets, largest }).toEqual({
      rejectedKeys: 25,
      rejectedResets: 50,
      largest: 36,
    });
  });
});

describe("축3 — 정수 우주 위의 정렬 집합 계약의 결함 fixture", () => {
  /**
   * **두 파라미터를 갈라 키우는 이유가 이 둘이다.** 칸을 훑는 계열은 우주를 키우는 셋에서만, 크기
   * 순 배열은 담긴 수를 키우는 넷에서만 걸린다. 한쪽 파라미터만 두면 반대쪽 계열이 전부 통과한다.
   */
  test("칸을 훑는 집합은 우주를 키우는 세 시나리오에서만 걸린다", () => {
    expect(outcomes(scanningBitSet)).toEqual({
      ...ALL_PASS,
      [NEIGHBORS]: false,
      [UPDATES]: false,
      [UNIVERSE_BITS]: false,
    });
    expect(statsOf(scanningBitSet, NEIGHBORS)).toEqual([2049, 8193, 32769]);
    expect(statsOf(scanningBitSet, UPDATES)).toEqual([1025, 4097, 16385]);
    // 비트 사다리에서는 우주가 $2^5$ · $2^{10}$ · $2^{20}$ 이라 훑는 칸이 32 배씩 는다.
    expect(statsOf(scanningBitSet, UNIVERSE_BITS)).toEqual([65, 2049, 2097153]);
  }, 60_000);

  test("크기 순 배열을 훑는 집합은 담긴 수를 키우는 네 시나리오에서만 걸린다", () => {
    expect(outcomes(sortedArray)).toEqual({
      ...ALL_PASS,
      [INSERT]: false,
      [DELETE]: false,
      [QUERIES]: false,
      [COUNT_BITS]: false,
    });
    expect(statsOf(sortedArray, INSERT)).toEqual([1024, 4096, 16384]);
    // 담긴 수가 $2^3$ · $2^6$ · $2^{12}$ 이라 훑는 칸이 그만큼 는다 — 로그가 아니라 원소 수다.
    expect(statsOf(sortedArray, COUNT_BITS)).toEqual([27, 195, 12280]);
  }, 120_000);

  /**
   * **일곱 행의 `worst` 가 추가로 배제하는 계열**(헤더 「한정자」). 원소 수를 키우는 지우기·조회에서
   * 걸리고, 넣기 n 번 뒤 이웃 찾기 n 번을 전부 재는 입력을 `amortized` 로 읽으면 통과한다 — 쌓인
   * 키 하나가 정본에 들어가는 일은 평생 한 번이다.
   */
  test("넣기를 쌓아 두는 집합은 worst 로 걸리고 같은 실행을 amortized 로 읽으면 통과한다", () => {
    expect(outcomes(flushing)).toEqual({
      ...ALL_PASS,
      [DELETE]: false,
      [QUERIES]: false,
      [COUNT_BITS]: false,
    });

    const fillThenQuery: CostScenario<UniverseSite> = {
      covers: ["insert", "successor"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.reset(FIXED_UNIVERSE);
        for (let i = 0; i < n; i++) ctx.step(() => impl.insert(4 * i));
        for (let i = 0; i < n; i++) ctx.step(() => impl.successor(4 * i));
      },
    };
    const asWorst = judgeScenario(flushing, fillThenQuery, "complexity");
    expect(asWorst.ok).toBe(false);
    expect(asWorst.points.map((point) => point.stat)).toEqual([
      18832, 75368, 301520,
    ]);

    const asAmortized = judgeScenario(
      flushing,
      { ...fillThenQuery, qualifier: "amortized" },
      "complexity",
    );
    expect(asAmortized.ok).toBe(true);
    expect(
      asAmortized.points.map((point) => Math.round(point.stat * 100) / 100),
    ).toEqual([15.06, 15.08, 15.08]);

    // 정본은 같은 입력을 `worst` 로 읽어도 통과한다 — 호출마다 제 상한 안이다.
    expect(judgeScenario(reference, fillThenQuery, "complexity").ok).toBe(true);
  }, 60_000);

  /**
   * **계약을 우주 쪽 로그 인수만큼 어기는 fixture — 4 배 사다리 다섯을 전부 통과하고 비트 사다리가
   * 잡는다.** $O(\log u)$ 는 $O(\log\log u)$ 계약의 위반이다. 다섯의 통과를 고정하는 것은 그것이
   * 옳아서가 아니라 **4 배 사다리가 이 자리를 못 본다는 것을 「계약을 지킨다」로 읽지 않게** 하려는
   * 것이다(불변 사실 62). 못 보는 이유는 세 점이 4 배 간격이라는 것 하나이고, 우주를 비트 수로
   * 올리면 같은 fixture 가 38 · 73 · 143($r$ = 1.92 · 1.96)으로 걸린다.
   */
  test("비트 하나씩 내려가는 트라이는 4 배 사다리 다섯을 통과하고 우주 비트 사다리에서 걸린다", () => {
    expect(outcomes(bitTrie)).toEqual({ ...ALL_PASS, [UNIVERSE_BITS]: false });
    expect(statsOf(bitTrie, NEIGHBORS)).toEqual([73, 87, 101]);
    expect(statsOf(bitTrie, UPDATES)).toEqual([24, 28, 32]);
    expect(statsOf(bitTrie, UNIVERSE_BITS)).toEqual([38, 73, 143]);
    // 담긴 수와는 무관한 계열이라 담긴 수 비트 사다리는 통과한다 — 잡는 자리가 서로 다르다.
    expect(statsOf(bitTrie, COUNT_BITS)).toEqual([75, 78, 78]);
  }, 60_000);

  /**
   * **원소 쪽 로그로 어기는 fixture — 4 배 사다리 다섯을 전부 통과하고 담긴 수 비트 사다리가
   * 잡는다.** 모든 연산이 $O(\log n)$ 이고 $n \le u$ 이므로 $O(\log u)$ 인데 계약은
   * $O(\log\log u)$ 를 적었다 — 헤더 「상한」 근거가 $O(\log u)$ 로 약하게 적지 않은 이유가 바로 이
   * 계열을 배제하는 것이다. 위 트라이가 우주 쪽 로그를 대표하듯 이 fixture 가 원소 쪽 로그를
   * 대표하고, **둘이 서로의 사다리에서는 통과한다** — 그래서 사다리가 둘이어야 한다.
   */
  test("비교로만 견주는 트립은 4 배 사다리 다섯을 통과하고 담긴 수 비트 사다리에서 걸린다", () => {
    expect(outcomes(treap)).toEqual({ ...ALL_PASS, [COUNT_BITS]: false });
    expect(statsOf(treap, INSERT)).toEqual([8, 9, 11]);
    expect(statsOf(treap, DELETE)).toEqual([14, 16, 20]);
    expect(statsOf(treap, QUERIES)).toEqual([63, 66, 81]);
    expect(statsOf(treap, NEIGHBORS)).toEqual([13, 14, 13]);
    expect(statsOf(treap, UPDATES)).toEqual([7, 9, 7]);
    expect(statsOf(treap, COUNT_BITS)).toEqual([15, 39, 66]);
    // 우주 비트 사다리는 담긴 키가 둘뿐이라 이 계열을 못 잡는다.
    expect(statsOf(treap, UNIVERSE_BITS)).toEqual([13, 13, 14]);
  }, 60_000);
});

/**
 * **검사 공백을 닫는 자리 — 사다리를 비트 수로 읽으면 로그 인수가 보인다.**
 *
 * 위 두 묶음이 고정한 것은 「로그로 어기는 fixture 둘이 4 배 사다리 다섯을 전부 통과한다」이고,
 * 이 묶음이 고정하는 것은 **같은 fixture 둘이 비트 사다리에서 걸린다**는 것이다. 판정 규격
 * (`./judge.ts` 의 구간과 허용치)도 하네스도 그대로다 — 바뀐 것은 시나리오가 사다리의 n 을 읽는
 * 방식 하나다(`../heap/vanEmdeBoasTree/vanEmdeBoasTree.contract.ts` 의 `bitsOf`).
 */
describe("축3 — 비트 사다리 둘이 로그 인수를 가른다", () => {
  test("우주 비트 사다리에서 로그는 비율 2.0 이고 로그 로그는 1.1 이다", () => {
    const trie = statsOf(bitTrie, UNIVERSE_BITS);
    const canonical = statsOf(reference, UNIVERSE_BITS);
    expect({ trie, canonical }).toEqual({
      trie: [38, 73, 143],
      canonical: [17, 19, 21],
    });
    const ratio = (stats: number[], at: number) =>
      Math.round(((stats[at + 1] as number) / (stats[at] as number)) * 100) /
      100;
    // 트라이는 `O(log n)` 구간(0.84~1.56 · 0.82~1.52)의 위를 넘고 정본은 그 안이다.
    expect([ratio(trie, 0), ratio(trie, 1)]).toEqual([1.92, 1.96]);
    expect([ratio(canonical, 0), ratio(canonical, 1)]).toEqual([1.12, 1.11]);
  }, 60_000);

  test("담긴 수 비트 사다리에서 트립이 걸리고 정본과 트라이는 통과한다", () => {
    expect({
      treap: statsOf(treap, COUNT_BITS),
      canonical: statsOf(reference, COUNT_BITS),
      trie: statsOf(bitTrie, COUNT_BITS),
    }).toEqual({
      treap: [15, 39, 66],
      canonical: [33, 34, 34],
      trie: [75, 78, 78],
    });
  }, 60_000);

  /**
   * **사다리 끝을 낮춰 달았다는 사실을 수치로 남긴다.** 담긴 수의 끝점을 $2^{20}$ 으로 두면 판정이
   * 같고(트립 27 · 63 · 114 실패 · 정본 34 · 34 · 34 통과 · 트라이 77 · 78 · 78 통과) 정본 계측이
   * 3,735 만인데, 크기 순 배열 fixture 가 원소 $2^{20}$ 개를 채우는 데 원소 수의 제곱이 들어 그
   * 계열을 이 시나리오에 태우지 못한다. 달아 둔 끝점 $2^{12}$ 의 계측은 1,714 만이고 그중
   * 1,703 만이 우주 $2^{22}$ 를 세우는 준비다.
   */
  test("담긴 수 비트 사다리의 계측 비용", () => {
    const scenario = vanEmdeBoasTreeContract.scenarios[
      LABELS.indexOf(COUNT_BITS)
    ] as CostScenario<UniverseSite>;
    const measured = SIZES.discriminating.map(
      (n) => measureScenario(reference, scenario, n, 1).total,
    );
    const total = measured.reduce((sum, each) => sum + each, 0);
    expect(total).toBe(17_137_200);
    // 준비(우주 세우기)가 거의 전부다 — 걸음으로 잰 몫은 세 점 합이 이만큼이다.
    expect(total - 3 * 5_677_780).toBe(103_860);
  }, 60_000);
});

describe("Bound 판정 — O(log log u) 를 판정 규격에 넣지 않는다", () => {
  const rigor = "discriminating" as const;
  const sizes = SIZES[rigor];
  const logLog = (u: number) => Math.log2(Math.log2(u));

  /** 사다리의 크기를 우주로 읽을 때 $\log\log u$ 를 계측값으로 삼은 측정점. */
  const logLogPoints = sizes.map((u) => ({ n: u, stat: logLog(u) }));

  test("사다리 위의 log log u 는 기존 O(1)·O(log n) 구간 둘 다에 든다", () => {
    const ratios = logLogPoints
      .slice(1)
      .map(
        (point, index) =>
          Math.round((point.stat / (logLogPoints[index]?.stat ?? 1)) * 1000) /
          1000,
      );
    expect(ratios).toEqual([1.079, 1.062]);
    expect(judgeGrowth("O(1)", rigor, logLogPoints).ok).toBe(true);
    expect(judgeGrowth("O(log n)", rigor, logLogPoints).ok).toBe(true);
  });

  /**
   * **새 구간을 그어도 가르는 것이 없다.** $\log\log$ 의 기대 비율에 ±30% 를 두른 구간이 트라이 fixture
   * 의 실측 비율(1.19 · 1.16)을 담는다 — 로그로 어기는 계열이 새 규격에서도 통과한다. 그 구간이
   * `O(1)` 과 다르게 판정하는 것은 1.30~1.40 과 0.70~0.75 의 띠뿐이고, 가르고 싶은 계열은 그 띠에
   * 오지 않는다.
   */
  test("log log 구간을 새로 그어도 O(log u) fixture 의 실측 비율이 그 안에 든다", () => {
    const measured = statsOf(bitTrie, NEIGHBORS);
    const tolerance = TOLERANCE[rigor];
    sizes.slice(1).forEach((upper, index) => {
      const lower = sizes[index] as number;
      const expected = logLog(upper) / logLog(lower);
      const r = (measured[index + 1] as number) / (measured[index] as number);
      expect(r).toBeGreaterThanOrEqual(expected * (1 - tolerance));
      expect(r).toBeLessThanOrEqual(expected * (1 + tolerance));
      // 같은 비율이 기존 `O(1)` 구간에도 든다.
      const constant = expectedRatio("O(1)", lower);
      expect(r).toBeLessThanOrEqual(constant * (1 + tolerance));
    });
  }, 60_000);

  /**
   * **사다리를 바꿔도 열리지 않는다.** 안전한 정수 전체($u \le 2^{53}$)에서 $\log\log u$ 가 움직이는
   * 폭이 1.72 배이고, 기존 규격에서 가장 작은 비상수 계급(`O(sqrt n)`)의 한 칸이 2.0 배다. 우주를 어떤
   * 간격으로 올려도 이 상한이 `O(1)` 과 한 칸만큼 벌어지는 두 점이 표현되는 수 안에 없다 —
   * `unionFind` 의 역아커만과 같은 판정이다(`docs/ORD-006-conventions.md` 「`unionFind` 의 Bound 는
   * 늘리지 않는다」).
   */
  test("표현되는 우주 전체에서 log log u 의 폭이 가장 작은 비상수 계급의 한 칸보다 좁다", () => {
    const span = logLog(2 ** 53) / logLog(sizes[0] as number);
    expect(Math.round(span * 100) / 100).toBe(1.72);
    expect(span).toBeLessThan(expectedRatio("O(sqrt n)", sizes[0] as number));
  });
});
