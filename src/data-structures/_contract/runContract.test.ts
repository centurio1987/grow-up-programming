/**
 * 하네스 자신에 대한 시험.
 *
 * 계약 스위트가 **통과시키는지**만 보면 아무것도 증명되지 않는다. 아무 검사도 하지 않는
 * 스위트가 그 시험을 통과한다. 그래서 여기서 보는 것은 반대쪽이다 — 계약을 어긴 구현을
 * 실제로 **떨어뜨리는가**.
 *
 * `_fixtures/` 의 결함 fixture 는 **전부 동작상 옳다.** 축1·축2로는 잡히지 않고 축3만이
 * 잡는다. 축2가 잡는 종류의 결함은 성격이 반대라 여기 인라인으로 둔다 — 그쪽은 동작이
 * 틀린 구현이고, 그 자리에서 무엇이 깨졌는지를 이름으로 말하는 것이 불변식의 일이다.
 */

import { describe, expect, test } from "bun:test";
import { Multiset as ReferenceMultiset } from "../hash/multiset/_reference/multiset";
import {
  type MultisetContract,
  multisetContract,
} from "../hash/multiset/multiset.contract";
import {
  type DequeContract,
  dequeContract,
} from "../linear/deque/deque.contract";
import { Stack as ReferenceStack } from "../linear/stack/_reference/stack";
import {
  type StackContract,
  stackContract,
} from "../linear/stack/stack.contract";
import { XorLinkedList as ReferenceXorLinkedList } from "../linear/xorLinkedList/_reference/xorLinkedList";
import {
  type XorLinkedListContract,
  xorLinkedListContract,
} from "../linear/xorLinkedList/xorLinkedList.contract";
import { IntervalTree as ReferenceIntervalTree } from "../range-query/intervalTree/_reference/intervalTree";
import {
  type IntervalTreeContract,
  intervalTreeContract,
} from "../range-query/intervalTree/intervalTree.contract";
import { FrontPushStack } from "./_fixtures/frontPushStack";
import { ScanIntervalList } from "./_fixtures/scanIntervalList";
import { SortedArrayMultiset } from "./_fixtures/sortedArrayMultiset";
import { TailScanList } from "./_fixtures/tailScanList";
import { TwoArrayDeque } from "./_fixtures/twoArrayDeque";
import { UnbalancedIntervalTree } from "./_fixtures/unbalancedIntervalTree";
import { UnshiftDeque } from "./_fixtures/unshiftDeque";
import { expectedRatio, judgeGrowth, statistic } from "./judge";
import {
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

function scenarioOf<Impl>(
  spec: { scenarios: readonly CostScenario<Impl>[] },
  covers: string,
  adversarial: boolean,
): CostScenario<Impl> {
  const found = spec.scenarios.find(
    (scenario) =>
      scenario.covers.includes(covers) && scenario.adversarial === adversarial,
  );
  if (!found)
    throw new Error(`시나리오를 못 찾았다: ${covers} (적대적=${adversarial})`);
  return found;
}

describe("판정 — 순수 부분", () => {
  test("기대 비율은 상한에서 나온다", () => {
    expect(expectedRatio("O(1)", 1024)).toBe(1);
    expect(expectedRatio("O(n)", 1024)).toBe(4);
    // log2(4096)/log2(1024) = 12/10
    expect(expectedRatio("O(log n)", 1024)).toBeCloseTo(1.2, 10);
    expect(expectedRatio("O(log n)", 4096)).toBeCloseTo(14 / 12, 10);
  });

  test("한정자는 기대 비율이 아니라 통계를 바꾼다", () => {
    const samples = [[1, 1, 10]];
    expect(statistic("worst", samples)).toBe(10);
    expect(statistic("amortized", samples)).toBeCloseTo(4, 10);
    expect(statistic("expected", [[2], [4], [100], [1], [3]])).toBe(3);
  });

  test("허용치 안이면 통과하고 벗어나면 실패한다", () => {
    const onTarget = judgeGrowth("O(1)", "discriminating", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 1.2 },
    ]);
    expect(onTarget.ok).toBe(true);

    const drifted = judgeGrowth("O(1)", "discriminating", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 4 },
    ]);
    expect(drifted.ok).toBe(false);
    expect(drifted.reason).toContain("O(1)");
  });

  test("회귀 수준은 O(1) 과 O(log n) 을 구분하지 않지만 O(n) 이탈은 잡는다", () => {
    const logLike = judgeGrowth("O(1)", "regression", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 1.2 },
    ]);
    expect(logLike.ok).toBe(true);

    const linear = judgeGrowth("O(1)", "regression", [
      { n: 1024, stat: 1 },
      { n: 4096, stat: 4 },
    ]);
    expect(linear.ok).toBe(false);
  });

  test("계측이 비었거나 간격이 4배가 아니면 판정 자체를 거부한다", () => {
    expect(
      judgeGrowth("O(1)", "regression", [
        { n: 1024, stat: 0 },
        { n: 4096, stat: 0 },
      ]).reason,
    ).toContain("계측이 비어 있으면");

    expect(
      judgeGrowth("O(1)", "regression", [
        { n: 1024, stat: 1 },
        { n: 2048, stat: 1 },
      ]).reason,
    ).toContain("4배 간격");
  });
});

const referenceStack: CostSource<StackContract<number>> = {
  kind: "self-reported",
  make: () => new ReferenceStack<number>(),
};

const frontPushStack: CostSource<StackContract<number>> = {
  kind: "self-reported",
  make: () => new FrontPushStack<number>(),
};

const unshiftDeque: CostSource<DequeContract<number>> = {
  kind: "self-reported",
  make: () => new UnshiftDeque<number>(),
};

const twoArrayDeque: CostSource<DequeContract<number>> = {
  kind: "self-reported",
  make: () => new TwoArrayDeque<number>(),
};

const referenceMultiset: CostSource<MultisetContract<number>> = {
  kind: "injected",
  make: (tick) =>
    new ReferenceMultiset<number>((a, b) => {
      tick();
      return a - b;
    }),
};

function sortedArrayMultiset(
  honest: boolean,
): CostSource<MultisetContract<number>> {
  return {
    kind: "injected",
    make: (tick) =>
      new SortedArrayMultiset<number>(
        (a, b) => {
          tick();
          return a - b;
        },
        { honest },
      ),
  };
}

const referenceIntervalTree: CostSource<IntervalTreeContract> = {
  kind: "self-reported",
  make: () => new ReferenceIntervalTree(),
};

const unbalancedIntervalTree: CostSource<IntervalTreeContract> = {
  kind: "self-reported",
  make: () => new UnbalancedIntervalTree(),
};

const scanIntervalList: CostSource<IntervalTreeContract> = {
  kind: "self-reported",
  make: () => new ScanIntervalList(),
};

const referenceXorLinkedList: CostSource<XorLinkedListContract> = {
  kind: "self-reported",
  make: () => new ReferenceXorLinkedList(),
};

const tailScanList: CostSource<XorLinkedListContract> = {
  kind: "self-reported",
  make: () => new TailScanList(),
};

describe("축3 — 정본은 통과한다", () => {
  test("Stack 정본의 push·pop 이 amortized O(1) 계약 안에 있다", () => {
    const verdict = judgeScenario(
      referenceStack,
      scenarioOf(stackContract, "push", false),
      "basic",
    );
    expect(verdict.reason).toBe("");
  });

  test("Multiset 정본이 무작위·오름차순 삽입 모두에서 expected O(log n) 을 지킨다", () => {
    for (const adversarial of [false, true]) {
      const verdict = judgeScenario(
        referenceMultiset,
        scenarioOf(multisetContract, "add", adversarial),
        "complexity",
      );
      expect(verdict.reason).toBe("");
    }
  });

  test("IntervalTree 정본이 여섯 시나리오를 전부 지킨다", () => {
    for (const scenario of intervalTreeContract.scenarios) {
      const verdict = judgeScenario(
        referenceIntervalTree,
        scenario,
        "complexity",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });

  test("XorLinkedList 정본이 네 시나리오를 전부 지킨다 — 회귀 수준으로", () => {
    for (const scenario of xorLinkedListContract.scenarios) {
      const verdict = judgeScenario(
        referenceXorLinkedList,
        scenario,
        "invariant",
      );
      expect(`${scenario.covers.join("·")}: ${verdict.reason}`).toBe(
        `${scenario.covers.join("·")}: `,
      );
    }
  });
});

describe("축3 — 결함 fixture 를 실제로 떨어뜨린다", () => {
  test("앞쪽으로 넣는 스택은 동작이 옳아도 회귀 수준에서 걸린다", () => {
    const verdict = judgeScenario(
      frontPushStack,
      scenarioOf(stackContract, "push", false),
      "basic",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("O(1)");
    // 연산당 비용이 n 에 비례하므로 비율이 1 이 아니라 4 쪽으로 간다.
    const stats = verdict.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  });

  test("정렬 배열 multiset 은 무작위 삽입에서 성장률로 걸린다", () => {
    const verdict = judgeScenario(
      sortedArrayMultiset(true),
      scenarioOf(multisetContract, "add", false),
      "complexity",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("O(log n)");
  });

  test("오름차순 삽입만으로는 정렬 배열이 잡히지 않는다 — 적대적 입력이 하나로 부족한 이유", () => {
    const verdict = judgeScenario(
      sortedArrayMultiset(true),
      scenarioOf(multisetContract, "add", true),
      "complexity",
    );
    // 뒤에 붙이기만 하면 되므로 정렬 배열에게 오름차순은 최선의 입력이다.
    expect(verdict.ok).toBe(true);
  });

  test("비용을 축소 보고하면 외부 계수와의 하한 검증이 잡는다", () => {
    const verdict = judgeScenario(
      sortedArrayMultiset(false),
      scenarioOf(multisetContract, "add", false),
      "complexity",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("외부 계수보다 작다");
  });

  test("배열 하나에 unshift 를 쓰는 덱은 앞쪽을 건드리는 전 시나리오에서 걸린다", () => {
    const failing = dequeContract.scenarios
      .filter((scenario) => scenario.qualifier === "amortized")
      .map((scenario) => judgeScenario(unshiftDeque, scenario, "complexity"));

    expect(failing.every((verdict) => !verdict.ok)).toBe(true);
    // 앞을 건드릴 때마다 뒤 원소 전부가 밀리므로 비율이 1 이 아니라 4 쪽으로 간다.
    for (const verdict of failing) {
      const stats = verdict.points.map((point) => point.stat);
      expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
    }
  });

  test("두 배열 덱은 앞뒤를 번갈아 뺄 때만 걸린다 — 큐 패턴에서는 상각이 옳다", () => {
    const queuePattern = judgeScenario(
      twoArrayDeque,
      scenarioOf(dequeContract, "pushBack", true),
      "complexity",
    );
    expect(queuePattern.ok).toBe(true);

    const alternating = judgeScenario(
      twoArrayDeque,
      scenarioOf(dequeContract, "popBack", true),
      "complexity",
    );
    expect(alternating.ok).toBe(false);
    expect(alternating.reason).toContain("O(1)");
  });

  test("균형을 안 잡는 증강 BST 는 오름차순 삽입에서만 걸린다 — 무작위 삽입은 통과한다", () => {
    const random = judgeScenario(
      unbalancedIntervalTree,
      scenarioOf(intervalTreeContract, "insert", false),
      "complexity",
    );
    // 무작위 순서로 들어온 키는 그 자체로 대체로 균형 잡힌 트리를 만든다.
    expect(random.ok).toBe(true);

    const sorted = judgeScenario(
      unbalancedIntervalTree,
      scenarioOf(intervalTreeContract, "insert", true),
      "complexity",
    );
    expect(sorted.ok).toBe(false);
    expect(sorted.reason).toContain("O(log n)");
    const stats = sorted.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);
  });

  test("전부 훑는 목록은 질의에서 걸리고 삽입에서는 통과한다 — 반대쪽에서 걸린다", () => {
    for (const adversarial of [false, true]) {
      const insert = judgeScenario(
        scanIntervalList,
        scenarioOf(intervalTreeContract, "insert", adversarial),
        "complexity",
      );
      // 배열 뒤에 붙이기만 하므로 삽입은 두 입력 모두에서 상수다.
      expect(insert.ok).toBe(true);
    }

    for (const covers of ["stabQuery", "overlapQuery"]) {
      const query = judgeScenario(
        scanIntervalList,
        scenarioOf(intervalTreeContract, covers, true),
        "complexity",
      );
      expect(query.ok).toBe(false);
      expect(query.reason).toContain("O(log n)");
    }
  });

  test("뒤 끝을 안 들고 매번 훑는 사슬은 붙이기에서만 걸리고 나머지 셋은 통과한다", () => {
    const append = judgeScenario(
      tailScanList,
      scenarioOf(xorLinkedListContract, "append", false),
      "invariant",
    );
    expect(append.ok).toBe(false);
    expect(append.reason).toContain("O(1)");
    const stats = append.points.map((point) => point.stat);
    expect((stats[1] ?? 0) / (stats[0] ?? 1)).toBeGreaterThan(3);

    // 순회 둘은 상한이 O(n) 이라 전부 훑어도 계약 안이고, size 는 세어 두면 상수다.
    // **축3이 이 계약에서 잡을 수 있는 것은 위의 한 자리뿐**이라는 것이 이 검사의 내용이다.
    for (const covers of ["toArray", "toArrayReverse", "size"]) {
      const verdict = judgeScenario(
        tailScanList,
        scenarioOf(xorLinkedListContract, covers, false),
        "invariant",
      );
      expect(`${covers}: ${verdict.reason}`).toBe(`${covers}: `);
    }
  });
});

/**
 * 축2가 잡으라고 있는 결함들. `_fixtures/` 의 것들과 달리 **동작이 틀린 구현**이라 축1도 함께
 * 잡는다. 다른 것은 실패가 말해 주는 내용이다 — 축1은 몇 번째 호출에서 값이 갈렸는지를
 * 말하고, 축2는 무엇이 깨졌는지를 이름으로 말한다.
 */
class LowKeyedIndex implements IntervalTreeContract {
  /** 시작점만 키로 잡았다. 시작점이 같은 구간을 넣으면 앞의 것이 조용히 밀려난다. */
  #byLow = new Map<number, [number, number]>();
  #inserted = 0;

  insert(low: number, high: number): void {
    this.#byLow.set(low, [low, high]);
    this.#inserted += 1;
  }

  delete(low: number, high: number): boolean {
    const stored = this.#byLow.get(low);
    if (stored === undefined || stored[1] !== high) return false;
    this.#byLow.delete(low);
    this.#inserted -= 1;
    return true;
  }

  stabQuery(point: number): [number, number][] {
    return this.overlapQuery(point, point);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    const found: [number, number][] = [];
    for (const stored of this.#byLow.values()) {
      if (stored[0] <= high && low <= stored[1]) found.push([...stored]);
    }
    return found;
  }

  size(): number {
    return this.#inserted;
  }
}

class SplitQueryIndex implements IntervalTreeContract {
  #items: [number, number][] = [];

  insert(low: number, high: number): void {
    this.#items.push([low, high]);
  }

  delete(low: number, high: number): boolean {
    const at = this.#items.findIndex(
      (stored) => stored[0] === low && stored[1] === high,
    );
    if (at < 0) return false;
    this.#items.splice(at, 1);
    return true;
  }

  /** 구간 질의와 따로 썼고, 끝점 비교가 한 글자 다르다. 끝점에 정확히 닿는 구간을 놓친다. */
  stabQuery(point: number): [number, number][] {
    return this.#items
      .filter((stored) => stored[0] <= point && point < stored[1])
      .map((stored) => [...stored] as [number, number]);
  }

  overlapQuery(low: number, high: number): [number, number][] {
    return this.#items
      .filter((stored) => stored[0] <= high && low <= stored[1])
      .map((stored) => [...stored] as [number, number]);
  }

  size(): number {
    return this.#items.length;
  }
}

describe("축2 — 불변식이 상태의 성질을 실제로 잡는다", () => {
  const [completeness, agreement] = intervalTreeContract.invariants;

  test("불변식 절이 둘이고 정본은 둘 다 만족한다", () => {
    expect(intervalTreeContract.invariants).toHaveLength(2);
    const impl = new ReferenceIntervalTree();
    impl.insert(1, 5);
    impl.insert(1, 9);
    impl.insert(3, 3);
    for (const invariant of intervalTreeContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("세고 있는 수와 내놓을 수 있는 수가 갈리면 불변식 1이 잡는다", () => {
    const impl = new LowKeyedIndex();
    impl.insert(1, 5);
    impl.insert(1, 9);
    expect(completeness?.check(impl)).toContain("전 범위 질의 1개 / size 2");
    // 두 질의는 서로 갈리지 않는다 — 같은 것을 잃었기 때문이다.
    expect(agreement?.check(impl)).toBeNull();
  });

  test("두 질의를 따로 쓰면 불변식 2가 갈림을 잡는다", () => {
    const impl = new SplitQueryIndex();
    impl.insert(1, 5);
    // 잃은 것이 없으므로 개수는 맞는다. 갈리는 것은 끝점 하나에서다.
    expect(completeness?.check(impl)).toBeNull();
    expect(agreement?.check(impl)).toContain("p=5");
  });
});

/** 자리를 정해 두고 넘치면 앞에서부터 버리는데, 붙인 횟수는 그대로 센다. */
class CappedLogList implements XorLinkedListContract {
  #values: number[] = [];
  #appended = 0;

  append(value: number): void {
    this.#values.push(value);
    if (this.#values.length > 8) this.#values.shift();
    this.#appended += 1;
  }

  toArray(): number[] {
    return [...this.#values];
  }

  toArrayReverse(): number[] {
    return [...this.#values].reverse();
  }

  size(): number {
    return this.#appended;
  }
}

/** 방향마다 이음을 따로 들었다. 뒤쪽 벌에 붙이는 자리가 앞쪽 벌과 같아서 두 벌이 갈린다. */
class TwoChainList implements XorLinkedListContract {
  #forward: number[] = [];
  #backward: number[] = [];

  append(value: number): void {
    this.#forward.push(value);
    this.#backward.push(value);
  }

  toArray(): number[] {
    return [...this.#forward];
  }

  toArrayReverse(): number[] {
    return [...this.#backward];
  }

  size(): number {
    return this.#forward.length;
  }
}

describe("축2 — 관측 경로가 둘이라야 정합을 물을 수 있다", () => {
  const [counted, agreed] = xorLinkedListContract.invariants;

  test("불변식 절이 둘이고 정본은 둘 다 만족한다", () => {
    expect(xorLinkedListContract.invariants).toHaveLength(2);
    const impl = new ReferenceXorLinkedList();
    for (const value of [3, 0, -1, 3]) impl.append(value);
    for (const invariant of xorLinkedListContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("자리가 넘쳐 앞을 버리면 불변식 1이 잡는다", () => {
    const impl = new CappedLogList();
    for (let i = 0; i < 9; i++) impl.append(i);
    expect(counted?.check(impl)).toContain("순회 8개 / size 9");
    // 버린 뒤에도 두 방향은 서로의 역순이다 — 같은 것을 잃었기 때문이다.
    expect(agreed?.check(impl)).toBeNull();
  });

  test("방향마다 이음을 따로 들면 불변식 2가 갈림을 잡는다", () => {
    const impl = new TwoChainList();
    impl.append(1);
    // 원소가 하나면 뒤집어도 같으므로 아직 갈리지 않는다.
    expect(agreed?.check(impl)).toBeNull();

    impl.append(2);
    // 잃은 것이 없으므로 개수는 맞는다. 갈리는 것은 순서다.
    expect(counted?.check(impl)).toBeNull();
    expect(agreed?.check(impl)).toContain("0번째에서 갈린다");
  });
});

/**
 * 최소·최대를 필드에 들어 두고 `add` 에서만 갱신한다. 지울 때 갱신을 빠뜨렸다.
 *
 * 이 구현은 **동작상 옳아 보인다** — `toArray()` 는 정렬돼 있고 개수도 다중도도 맞는다.
 * 갈리는 것은 최소를 읽는 두 길뿐이다. B10 이 `hash/multiset` 에 이 불변식을 새로 넣은
 * 근거가 이 구현이다.
 */
class StaleMinMultiset implements MultisetContract<number> {
  #items: number[] = [];
  #min: number | null = null;
  #max: number | null = null;

  add(item: number): void {
    const at = this.#items.findIndex((value) => value > item);
    this.#items.splice(at < 0 ? this.#items.length : at, 0, item);
    if (this.#min === null || item < this.#min) this.#min = item;
    if (this.#max === null || item > this.#max) this.#max = item;
  }

  delete(item: number): boolean {
    const at = this.#items.indexOf(item);
    if (at < 0) return false;
    this.#items.splice(at, 1);
    // 여기서 #min·#max 를 다시 잡아야 하는데 잡지 않는다.
    return true;
  }

  deleteAll(item: number): number {
    let removed = 0;
    while (this.delete(item)) removed += 1;
    return removed;
  }

  has(item: number): boolean {
    return this.#items.includes(item);
  }

  count(item: number): number {
    return this.#items.filter((value) => value === item).length;
  }

  min(): number | null {
    return this.#min;
  }

  max(): number | null {
    return this.#max;
  }

  size(): number {
    return this.#items.length;
  }

  toArray(): number[] {
    return [...this.#items];
  }
}

describe("축2 — B10 이 multiset 의 불변식 한 자리를 갈았다", () => {
  const [counted, multiplicity, ends] = multisetContract.invariants;

  test("불변식 절이 셋이고 정본은 셋 다 만족한다", () => {
    expect(multisetContract.invariants).toHaveLength(3);
    const impl = new ReferenceMultiset<number>();
    for (const value of [5, 1, 5, 9]) impl.add(value);
    impl.delete(1);
    for (const invariant of multisetContract.invariants) {
      expect(invariant.check(impl)).toBeNull();
    }
  });

  test("최소를 캐시하고 지울 때 갱신을 빠뜨리면 불변식 3이 잡는다", () => {
    const impl = new StaleMinMultiset();
    for (const value of [1, 5, 9]) impl.add(value);
    expect(ends?.check(impl)).toBeNull();

    impl.delete(1);
    // 개수도 다중도도 맞는다. 갈리는 것은 최소를 읽는 두 길뿐이다.
    expect(counted?.check(impl)).toBeNull();
    expect(multiplicity?.check(impl)).toBeNull();
    expect(ends?.check(impl)).toContain("min 1 인데 첫 원소 5");
  });

  test("정렬 순서는 축2가 아니라 축1이 본다 — 읽는 길이 하나뿐이다", () => {
    // `toArray()` 의 의미 열이 「비내림차순 배열의 사본」이므로 참조 모델과의 대조가 판정한다.
    const names = multisetContract.invariants.map((invariant) => invariant.name);
    expect(names.some((name) => name.includes("비내림차순"))).toBe(false);
  });
});

describe("축3 — 하네스가 계측을 신뢰하지 않는다", () => {
  test("amortized 계약은 n 회 측정을 요구한다", () => {
    const verdict = judgeScenario(
      referenceStack,
      {
        covers: ["push"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: false,
        run: (impl, _n, ctx) => {
          for (let i = 0; i < 4; i++) ctx.step(() => impl.push(i));
        },
      },
      "basic",
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.reason).toContain("n 회 측정");
  });
});
