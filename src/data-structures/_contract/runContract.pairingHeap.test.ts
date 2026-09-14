/**
 * 하네스 자기시험 — `heap/pairingHeap` 계약(상수 시간 넣기·합치기 · T2-03).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 통과시키는지가 아니라 **계약을
 * 어긴 구현을 실제로 떨어뜨리는지**, 그리고 이웃 계약과의 관계가 축3에서 어떻게 보이는지를
 * 고정한다.
 *
 * **파일을 따로 둔 이유.** 저쪽 파일에 줄을 넣으면 그 파일을 `경로:줄` 로 가리키는 가이드
 * 인용 여덟 자리(`tree/treap`·`tree/multiset`·`tree/orderStatisticTree` 가이드)가 밀린다
 * (불변 사실 106). 그 셋은 이 유닛의 범위 밖이고, 병렬로 도는 `KAN-026` 도 저쪽 파일에 줄을
 * 넣으면 두 카드가 같은 인용을 서로 다른 값으로 고치게 된다. 새 파일은 어떤 인용도 밀지 않는다.
 *
 * **정본 교차의 기대 결과를 먼저 적는다**(§규약1 「한정자만 다른 계약은 정본을 교차시켜
 * 판정한다」 — 안 보이는 쌍에서 「통과했으니 담긴다」로 읽는 것이 그 절차의 유일한 오용이다).
 * 두 계약은 서로 담지 않는다(불변 사실 54). 축3이 보는 것은 **한 방향뿐**이어야 한다 — 이
 * 계약의 정본은 `worst` 빼기를 적은 저쪽에서 걸리고, 저쪽 정본은 넣기·합치기의 로그 인수가
 * 해상도 아래라 이쪽을 통과한다(불변 사실 53).
 */

import { describe, expect, test } from "bun:test";
import { BinomialHeap as ReferenceBinomialHeap } from "../heap/binomialHeap/_reference/binomialHeap";
import { LeftistHeap as ReferenceLeftistHeap } from "../heap/leftistHeap/_reference/leftistHeap";
import {
  ascending,
  leftistHeapContract,
  type MergeableQueue,
  MergeSite,
} from "../heap/leftistHeap/leftistHeap.contract";
import { PairingHeap as ReferencePairingHeap } from "../heap/pairingHeap/_reference/pairingHeap";
import { pairingHeapContract } from "../heap/pairingHeap/pairingHeap.contract";
import { BufferedLinkingHeap } from "./_fixtures/bufferedLinkingHeap";
import { DeferredSortPriorityQueue } from "./_fixtures/deferredSortPriorityQueue";
import { MergeableArrayHeap } from "./_fixtures/mergeableArrayHeap";
import { MergeableLinkingHeap } from "./_fixtures/mergeableLinkingHeap";
import { MergeableSortedArrayHeap } from "./_fixtures/mergeableSortedArrayHeap";
import { SequentialLinkingHeap } from "./_fixtures/sequentialLinkingHeap";
import type { Grade } from "./judge";
import {
  type ContractSpec,
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Site = MergeSite<number>;
type Measured = MergeableQueue<number> & { __cost: number };

function site(make: () => Measured): CostSource<Site> {
  return { kind: "self-reported", make: () => new MergeSite(make) };
}

const pairing = site(() => new ReferencePairingHeap<number>(ascending));
const leftist = site(() => new ReferenceLeftistHeap<number>(ascending));
const binomial = site(() => new ReferenceBinomialHeap<number>(ascending));
const sequentialLinking = site(
  () => new SequentialLinkingHeap<number>(ascending),
);
const bufferedLinking = site(() => new BufferedLinkingHeap<number>(ascending));
const mergeableLinking = site(
  () => new MergeableLinkingHeap<number>(ascending),
);
const mergeableArray = site(() => new MergeableArrayHeap<number>(ascending));
const mergeableSortedArray = site(
  () => new MergeableSortedArrayHeap<number>(ascending),
);

function labelOf(scenario: CostScenario<Site>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function outcomes(
  cost: CostSource<Site>,
  spec: ContractSpec<Site, number[]>,
  grade: Grade = "complexity",
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of spec.scenarios) {
    result[labelOf(scenario)] = judgeScenario(cost, scenario, grade).ok;
  }
  return result;
}

function scenarioOf(covers: string, adversarial: boolean): CostScenario<Site> {
  const found = pairingHeapContract.scenarios.find(
    (scenario) =>
      scenario.covers.includes(covers) && scenario.adversarial === adversarial,
  );
  if (!found)
    throw new Error(`시나리오를 못 찾았다: ${covers} (적대적=${adversarial})`);
  return found;
}

const ALL_PASS = {
  "enqueue (적대적)": true,
  "dequeue (적대적)": true,
  dequeue: true,
  "merge (적대적)": true,
  "peek·size·isEmpty (적대적)": true,
};

describe("축3 — 상수 시간 넣기·합치기 계약의 정본과 이웃 계약", () => {
  test("정본이 다섯 시나리오를 전부 통과한다", () => {
    for (const scenario of pairingHeapContract.scenarios) {
      const verdict = judgeScenario(pairing, scenario, "complexity");
      expect(verdict.ok ? "" : `${labelOf(scenario)} — ${verdict.reason}`).toBe(
        "",
      );
    }
  }, 60_000);

  /**
   * **의미 자리는 같은 객체이고 시나리오만 다르다.** 성격 전환(`heap/binomialHeap`)은 시나리오까지
   * 같은 객체였다 — 이 계약은 비용 열만 갈린 **다른 계약**이라 그 한 항목이 갈린다.
   */
  test("의미 자리는 합칠 수 있는 우선순위 큐와 같은 객체이고 시나리오만 갈린다", () => {
    expect(pairingHeapContract.name).toBe("PairingHeap");
    expect(pairingHeapContract.model).toBe(leftistHeapContract.model);
    expect(pairingHeapContract.ops).toBe(leftistHeapContract.ops);
    expect(pairingHeapContract.edges).toBe(leftistHeapContract.edges);
    expect(pairingHeapContract.scenarios).not.toBe(
      leftistHeapContract.scenarios,
    );
  });

  /**
   * **보이는 방향.** 이 계약의 정본을 `worst` 빼기 계약에 넣으면 빼기 두 시나리오에서만
   * 걸린다 — 넣기 n 번 뒤 빼기 한 번(599 · 5,303 · 24,335)과 크기 유지 교대(1,445 · 3,018 ·
   * 15,129). 넣기·합치기는 상수라 로그 상한 안이다. 걸리는 자리가 `heap/leftistHeap` 의
   * 결함 fixture `mergeableLinkingHeap` 과 **같다** — 그 fixture 가 이 계약의 계열이다.
   */
  test("정본 교차 — 이 계약의 정본은 합칠 수 있는 우선순위 큐의 빼기 둘에서만 걸린다", () => {
    const pairingOnLeftist: Record<string, boolean> = {};
    for (const scenario of leftistHeapContract.scenarios) {
      pairingOnLeftist[labelOf(scenario)] = judgeScenario(
        pairing,
        scenario,
        "complexity",
      ).ok;
    }
    expect(pairingOnLeftist).toEqual({
      "enqueue (적대적)": true,
      enqueue: true,
      "dequeue (적대적)": false,
      dequeue: false,
      "merge (적대적)": true,
      "peek·size·isEmpty (적대적)": true,
    });
  }, 120_000);

  /**
   * **안 보이는 방향.** 합칠 수 있는 우선순위 큐의 정본 둘은 합치기가 로그인데 이 계약의
   * 다섯 시나리오를 전부 통과한다. 좌편향 힙의 합치기가 15 · 17 · 19 로 로그를 그대로 찍는데
   * 허용 구간이 0.70~1.30 이라 판정이 못 가른다(불변 사실 53). **이 통과는 「담긴다」가
   * 아니다** — 계약으로는 그 구현이 이 계약을 만족하지 못한다(헤더 목적 「대가」 문단).
   */
  test("정본 교차 — 합칠 수 있는 우선순위 큐의 정본 둘은 이 계약을 전부 통과한다", () => {
    expect(outcomes(leftist, pairingHeapContract)).toEqual(ALL_PASS);
    expect(outcomes(binomial, pairingHeapContract)).toEqual(ALL_PASS);

    const merged = judgeScenario(
      leftist,
      scenarioOf("merge", true),
      "complexity",
    );
    expect(merged.points.map((point) => point.stat)).toEqual([15, 17, 19]);
  }, 120_000);

  /**
   * **같은 실행 두 통계.** 크기 유지 교대 시나리오를 `worst` 로만 바꿔 다시 읽으면 정본이
   * 걸린다 — 넣기 n 번 뒤의 처음 몇 호출이 밀린 일을 갚고(n = 1,024 에서 둘째 호출이 1,445)
   * 그 하나가 최댓값으로 보고된다. 빼기 행의
   * 한정자가 배제하지 않기로 한 계열이 무엇인지가 이 한 쌍에 있다.
   */
  test("같은 실행 두 통계 — 빼기 교대를 worst 로 읽으면 정본이 걸린다", () => {
    const alternating = scenarioOf("dequeue", true);
    expect(judgeScenario(pairing, alternating, "complexity").ok).toBe(true);

    const asWorst = judgeScenario(
      pairing,
      { ...alternating, qualifier: "worst" as const },
      "complexity",
    );
    expect(asWorst.ok).toBe(false);
    expect(asWorst.points.map((point) => point.stat)).toEqual([
      1445, 3018, 15129,
    ]);
  }, 60_000);
});

describe("축3 — 상수 시간 넣기·합치기 계약의 결함 fixture", () => {
  /**
   * **빼기를 상각으로 내려도 접는 방법이 아무것이나 되는 것은 아니다.** 정본에서 형제를 두 번
   * 훑던 것을 한 번으로 바꾼 것뿐인데 빼기 두 시나리오에서 걸리고, 둘 다 호출 평균이다.
   */
  test("형제를 한 줄로 잇는 힙은 빼기 두 시나리오에서만 걸린다", () => {
    expect(outcomes(sequentialLinking, pairingHeapContract)).toEqual({
      ...ALL_PASS,
      "dequeue (적대적)": false,
      dequeue: false,
    });
  }, 120_000);

  /**
   * **넣기 행의 `worst` 가 추가로 배제하는 계열.** 넣기에서 걸리고, 같은 입력을 `amortized` 로
   * 다시 재면 통과한다(§규약1 「강한 한정자의 근거는 추가로 배제되는 계열을 수치로 낸다」).
   *
   * **합치기에서도 걸린다 — 채우는 수가 그렇게 골라져 있어서다.** 합치기도 쌓인 줄을 먼저
   * 잇는데, 양쪽을 n/2 개(2의 거듭제곱)씩 채우면 그 줄이 하나뿐이라 통과한다. 계약 스위트가
   * 넘겨받는 큐를 3n/4 개로 채우는 이유이고, 아래가 그 두 채우기를 나란히 고정한다.
   */
  test("쌓아 두었다 이따금 잇는 힙은 넣기·합치기에서 걸리고 넣기를 amortized 로 읽으면 통과한다", () => {
    expect(outcomes(bufferedLinking, pairingHeapContract)).toEqual({
      ...ALL_PASS,
      "enqueue (적대적)": false,
      "merge (적대적)": false,
    });

    const quarterRun = judgeScenario(
      bufferedLinking,
      scenarioOf("merge", true),
      "complexity",
    );
    expect(quarterRun.points.map((point) => point.stat)).toEqual([
      520, 2056, 8200,
    ]);
    // 같은 크기 둘로 채우는 `heap/leftistHeap` 의 합치기 시나리오에서는 통과한다.
    const halvesRun = judgeScenario(
      bufferedLinking,
      leftistHeapContract.scenarios.find((scenario) =>
        scenario.covers.includes("merge"),
      ) as CostScenario<Site>,
      "complexity",
    );
    expect(halvesRun.points.map((point) => point.stat)).toEqual([8, 8, 8]);

    const ascendingRun = scenarioOf("enqueue", true);
    const asWorst = judgeScenario(bufferedLinking, ascendingRun, "complexity");
    expect(asWorst.points.map((point) => point.stat)).toEqual([
      1025, 4097, 16385,
    ]);

    const asAmortized = judgeScenario(
      bufferedLinking,
      { ...ascendingRun, qualifier: "amortized" as const },
      "complexity",
    );
    expect(asAmortized.ok).toBe(true);
    // 호출 평균이 3 에 붙는다(2.997 · 2.9993 · 2.9998). 원소 하나가 이어지는 일이 평생 한 번이다.
    for (const point of asAmortized.points)
      expect(point.stat).toBeCloseTo(3, 2);
  }, 60_000);

  /**
   * **이웃 계약의 결함 셋이 이 계약에서 겨누는 자리.** 배열 한 줄은 합치기에서, 늘 정렬해 두는
   * 줄은 넣기와 합치기에서 걸린다. **미뤄 두었다 접는 힙은 여기서 결함이 아니다** — 저쪽
   * 계약에서 빼기 둘에 걸리던 그 계열이 이 계약의 계열이라 다섯을 전부 통과한다.
   */
  test("합칠 수 있는 우선순위 큐의 결함 셋이 이 계약에서 겨누는 자리가 갈린다", () => {
    expect(outcomes(mergeableArray, pairingHeapContract)).toEqual({
      ...ALL_PASS,
      "merge (적대적)": false,
    });
    expect(outcomes(mergeableSortedArray, pairingHeapContract)).toEqual({
      ...ALL_PASS,
      "enqueue (적대적)": false,
      "merge (적대적)": false,
    });
    expect(outcomes(mergeableLinking, pairingHeapContract)).toEqual(ALL_PASS);
  }, 120_000);

  /**
   * **빼기 시나리오 둘이 겨누는 계열이 갈리는 자리.** 넣기를 쌓아 두었다 빼기 때 정렬해
   * 끼워 넣는 큐는 크기 유지 교대에서만 걸린다 — 빼기마다 하나씩 밀린 원소를 정렬된 줄 전체에
   * 끼워야 해서다. 채운 뒤 비우기만 하면 정렬이 한 번뿐이라 상각이 성립한다.
   *
   * 그 fixture 는 기본 우선순위 큐 계약의 것이라 `merge` 가 없다. **이 두 시나리오는 합치기를
   * 부르지 않으므로** 껍데기에 그대로 넣는다.
   */
  test("미뤄 두었다 정렬하는 큐는 빼기 교대에서만 걸린다", () => {
    const deferredSort = site(
      () =>
        new DeferredSortPriorityQueue<number>(ascending) as unknown as Measured,
    );
    expect(
      judgeScenario(deferredSort, scenarioOf("dequeue", true), "complexity").ok,
    ).toBe(false);
    expect(
      judgeScenario(deferredSort, scenarioOf("dequeue", false), "complexity")
        .ok,
    ).toBe(true);
  }, 60_000);
});
