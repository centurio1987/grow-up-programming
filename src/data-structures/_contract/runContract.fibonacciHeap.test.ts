/**
 * 하네스 자기시험 — `heap/fibonacciHeap` 계약(키 낮추기를 가진 우선순위 큐 · T2-04).
 *
 * `./runContract.test.ts` 와 같은 일을 한다 — 계약 스위트가 통과시키는지가 아니라 **계약을
 * 어긴 구현을 실제로 떨어뜨리는지**, 그리고 이웃 계약과의 관계가 축3에서 어떻게 보이는지를
 * 고정한다. 파일을 따로 둔 이유는 `./runContract.pairingHeap.test.ts` 머리말과 같다(불변 사실 255).
 *
 * **관계의 기대 결과를 먼저 적는다.**
 * - **`heap/pairingHeap`(계약 C)을 담는다.** 담는 쪽 정본은 담기는 쪽 스위트를 전부 통과해야 하고,
 *   담기는 쪽만 지키는 구현은 담는 쪽에서 **더한 행에서만** 걸려야 한다(§규약1 「연산 집합이 갈린
 *   계약의 포섭은 정본 교차로 못 잰다」). 담기는 쪽 정본은 키 낮추기가 없어 이쪽에 넣을 수 없다.
 * - **`heap/leftistHeap`(계약 B)과는 서로 담지 않는다.** 이쪽 정본은 저쪽 `worst` 빼기 둘에서
 *   걸려야 한다. 저쪽 정본은 키 낮추기가 없어 이쪽에 넣을 수 없다 — 그 방향은 연산 집합이 답한다.
 */

import { describe, expect, test } from "bun:test";
import { FibonacciHeap as ReferenceFibonacciHeap } from "../heap/fibonacciHeap/_reference/fibonacciHeap";
import {
  DecreaseSite,
  fibonacciHeapContract,
} from "../heap/fibonacciHeap/fibonacciHeap.contract";
import {
  ascending,
  leftistHeapContract,
  MergeSite,
} from "../heap/leftistHeap/leftistHeap.contract";
import { pairingHeapContract } from "../heap/pairingHeap/pairingHeap.contract";
import { RescanningTopHeap } from "./_fixtures/rescanningTopHeap";
import { SiftingLinkingHeap } from "./_fixtures/siftingLinkingHeap";
import { rngFrom } from "./judge";
import {
  type ContractSpec,
  type CostScenario,
  type CostSource,
  judgeScenario,
} from "./runContract";

type Site = DecreaseSite<number>;

/** 이 계약의 껍데기에 넣을 수 있는 구현. 핸들 타입은 구현마다 다르다. */
interface Decreasable {
  enqueue(item: number): unknown;
  dequeue(): number | null;
  // biome-ignore lint/suspicious/noExplicitAny: 구현마다 핸들 타입이 달라 한자리에 담는 곳이다
  decreaseKey(handle: any, item: number): boolean;
  // biome-ignore lint/suspicious/noExplicitAny: 같은 구현의 큐를 받는 자리라 구현마다 타입이 다르다
  merge(other: any): void;
  peek(): number | null;
  size(): number;
  isEmpty(): boolean;
  __cost: number;
}

function onDecreaseSite(make: () => Decreasable): CostSource<Site> {
  return { kind: "self-reported", make: () => new DecreaseSite(make) };
}

function onMergeSite(make: () => Decreasable): CostSource<MergeSite<number>> {
  return { kind: "self-reported", make: () => new MergeSite(make) };
}

const fibonacci = () => new ReferenceFibonacciHeap<number>(ascending);
const sifting = () => new SiftingLinkingHeap<number>(ascending);
const rescanning = () => new RescanningTopHeap<number>(ascending);

function labelOf<Impl>(scenario: CostScenario<Impl>): string {
  return `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
}

function outcomes<Impl, Model>(
  cost: CostSource<Impl>,
  spec: ContractSpec<Impl, Model>,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const scenario of spec.scenarios) {
    result[labelOf(scenario)] = judgeScenario(cost, scenario, "complexity").ok;
  }
  return result;
}

function scenarioOf(covers: string, adversarial: boolean): CostScenario<Site> {
  const found = fibonacciHeapContract.scenarios.find(
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
  "decreaseKey (적대적)": true,
  decreaseKey: true,
  "peek·size·isEmpty (적대적)": true,
};

const PAIRING_ALL_PASS = {
  "enqueue (적대적)": true,
  "dequeue (적대적)": true,
  dequeue: true,
  "merge (적대적)": true,
  "peek·size·isEmpty (적대적)": true,
};

describe("축1 — 키 낮추기 계약의 스위트가 이웃에게서 가져온 것", () => {
  /**
   * **공유는 항목마다 갈린다**(`fibonacciHeap.contract.ts` 머리말 표). 불변 사실 251 의 셋째 모양
   * (의미 열이 같은 다른 계약)과 달리 `model`·`ops` 는 따로이고, 경계 케이스와 시나리오는 **일부만**
   * 같은 객체다.
   */
  test("경계 케이스 여덟과 시나리오 넷이 이웃과 같은 객체이고 모델·연산은 따로다", () => {
    for (const edge of leftistHeapContract.edges) {
      expect(fibonacciHeapContract.edges).toContain(edge);
    }
    expect(fibonacciHeapContract.edges.length).toBe(
      leftistHeapContract.edges.length + 6,
    );

    const shared = pairingHeapContract.scenarios.filter(
      (scenario) => !scenario.covers.includes("peek"),
    );
    expect(shared).toHaveLength(4);
    shared.forEach((scenario, index) => {
      expect(fibonacciHeapContract.scenarios[index]).toBe(
        scenario as unknown as CostScenario<Site>,
      );
    });
    const pairingPeek = pairingHeapContract.scenarios.find((scenario) =>
      scenario.covers.includes("peek"),
    );
    expect(fibonacciHeapContract.scenarios).not.toContain(
      pairingPeek as unknown as CostScenario<Site>,
    );

    expect(fibonacciHeapContract.model).not.toBe(leftistHeapContract.model);
    expect(fibonacciHeapContract.ops).not.toBe(leftistHeapContract.ops);
  });

  /**
   * **무작위 시퀀스에 같은 우선순위가 한 번도 두 번 나오지 않는다.** 겹치면 어느 원소가 빠졌는지를
   * 계약이 정하지 않아 키 낮추기의 답이 구현마다 갈릴 수 있다(`fibonacciHeap.contract.ts` 의
   * `DOMAIN` 주석). 하네스와 같은 방식으로 인자를 뽑아 본다 — 연산 고르기와 인자 뽑기가 같은
   * 난수열을 번갈아 쓰므로 순서까지 같게 뽑아야 같은 값이 나온다. 500 은 `runContract.ts` 의
   * `RANDOM_OPS` 이고, `tools/emit-vectors.ts` 의 200 회는 그 앞부분이다.
   */
  test("무작위 교차검증 시퀀스(seed 1 · 500회)의 값이 전부 다르다", () => {
    const rng = rngFrom(1);
    const values: number[] = [];
    let decreaseKeys = 0;
    for (let index = 0; index < 500; index++) {
      const op = fibonacciHeapContract.ops[
        Math.floor(rng() * fibonacciHeapContract.ops.length)
      ] as (typeof fibonacciHeapContract.ops)[number];
      const arg = op.arg(rng);
      if (op.name === "enqueue") values.push(arg as number);
      if (op.name === "merge") values.push(...(arg as number[]));
      if (op.name === "decreaseKey") {
        values.push((arg as [number, number])[1]);
        decreaseKeys += 1;
      }
    }
    expect(decreaseKeys).toBeGreaterThan(50);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("축3 — 키 낮추기 계약의 정본과 이웃 계약", () => {
  test("정본이 일곱 시나리오를 전부 통과한다", () => {
    for (const scenario of fibonacciHeapContract.scenarios) {
      const verdict = judgeScenario(
        onDecreaseSite(fibonacci),
        scenario,
        "complexity",
      );
      expect(verdict.ok ? "" : `${labelOf(scenario)} — ${verdict.reason}`).toBe(
        "",
      );
    }
  }, 60_000);

  /** **담는 방향.** 이 계약의 정본은 넣기·합치기를 상수에 두는 우선순위 큐 계약을 전부 통과한다. */
  test("정본 교차 — 이 계약의 정본은 계약 C 의 다섯 시나리오를 전부 통과한다", () => {
    expect(outcomes(onMergeSite(fibonacci), pairingHeapContract)).toEqual(
      PAIRING_ALL_PASS,
    );
  }, 60_000);

  /**
   * **서로 담지 않는 방향.** 이 계약의 정본은 합칠 수 있는 우선순위 큐의 `worst` 빼기 둘에서만
   * 걸린다 — 넣기 n 번 뒤 빼기 한 번, 크기 유지 교대. 넣기·합치기는 상수라 로그 상한 안이다.
   */
  test("정본 교차 — 이 계약의 정본은 계약 B 의 빼기 둘에서만 걸린다", () => {
    const cost = onMergeSite(fibonacci);
    expect(outcomes(cost, leftistHeapContract)).toEqual({
      "enqueue (적대적)": true,
      enqueue: true,
      "dequeue (적대적)": false,
      dequeue: false,
      "merge (적대적)": true,
      "peek·size·isEmpty (적대적)": true,
    });

    const single = leftistHeapContract.scenarios.find(
      (scenario) => scenario.covers.includes("dequeue") && scenario.adversarial,
    ) as CostScenario<MergeSite<number>>;
    expect(
      judgeScenario(cost, single, "complexity").points.map(
        (point) => point.stat,
      ),
    ).toEqual([4083, 16369, 65519]);
  }, 120_000);

  /**
   * **같은 실행 두 통계 — 빼기 행이 `amortized` 인 근거.** 계약 C 에서 가져온 크기 유지 교대를
   * `worst` 로 다시 읽으면 정본이 걸린다. 넣기 n 번 뒤의 첫 빼기가 밀린 뿌리 n 개를 잇는다.
   */
  test("같은 실행 두 통계 — 빼기 교대를 worst 로 읽으면 정본이 걸린다", () => {
    const alternating = scenarioOf("dequeue", true);
    const asAmortized = judgeScenario(
      onDecreaseSite(fibonacci),
      alternating,
      "complexity",
    );
    expect(asAmortized.ok).toBe(true);
    expect(
      asAmortized.points.map((point) => Number(point.stat.toFixed(2))),
    ).toEqual([52.57, 61.29, 70.54]);

    const asWorst = judgeScenario(
      onDecreaseSite(fibonacci),
      { ...alternating, qualifier: "worst" as const },
      "complexity",
    );
    expect(asWorst.ok).toBe(false);
    expect(asWorst.points.map((point) => point.stat)).toEqual([
      4106, 16396, 65550,
    ]);
  }, 60_000);

  /**
   * **키 낮추기 행이 `amortized` 인 근거.** 정본의 이어 떼기가 담긴 원소 전부를 지나가는 상태를
   * 공개 연산만으로 짓는다. 한 바퀴가 원소 하나를 줄에 더한다.
   *
   * 1. 뿌리보다 뒤서는 원소 둘을 넣고 빼기를 한 번 돌려 뿌리에 곁가지(원소 둘)를 붙인다.
   * 2. 뿌리보다 앞서는 원소 하나와 뒤서는 원소 셋을 넣고 빼기를 한 번 돌려, 새 뿌리 아래로
   *    옛 뿌리를 넣는다.
   * 3. 곁가지를 앞당겨 빼면 옛 뿌리가 자식을 잃은 표시를 얻는다.
   * 4. 새 뿌리의 나머지 자식 셋을 앞당겨 뺀다.
   *
   * 빼기를 돌리는 일은 매우 앞선 값 하나를 넣고 곧바로 빼는 것이다. **이 입력은 계약 스위트의
   * 시나리오가 아니다** — 정본이 뿌리를 차수로 잇는다는 것을 알아야 짓는다(불변 사실 44). 근거로
   * 쓰는 것은 「그 계열이 실재한다」이다(불변 사실 122).
   */
  test("정본의 키 낮추기 한 호출이 담긴 원소 수만큼 걷는 상태가 있고 호출열 평균은 상수다", () => {
    const measured: { size: number; single: number; mean: number }[] = [];
    for (const rounds of [1024, 4096, 16384]) {
      const heap = new ReferenceFibonacciHeap<number>(ascending);
      let calls = 0;
      let low = 0;
      let high = 1e9;
      /** 뿌리 쪽 값 — 갈수록 앞선다. */
      const nextLow = () => {
        low -= 1;
        return low;
      };
      /** 곁가지 값 — 늘 뿌리보다 뒤선다. */
      const nextHigh = () => {
        high += 1;
        return high;
      };
      const TINY = -1e15;
      const enqueue = (value: number) => {
        calls += 1;
        return heap.enqueue(value);
      };
      const dequeue = () => {
        calls += 1;
        heap.dequeue();
      };
      const drop = (handle: ReturnType<typeof heap.enqueue>) => {
        calls += 1;
        heap.decreaseKey(handle, TINY);
        dequeue();
      };
      const settle = () => {
        enqueue(TINY);
        dequeue();
      };

      const bottom = enqueue(nextHigh());
      enqueue(nextLow());
      settle();
      for (let round = 0; round < rounds; round++) {
        const twigs = [enqueue(nextHigh()), enqueue(nextHigh())];
        settle();
        enqueue(nextLow());
        const rest = [
          enqueue(nextHigh()),
          enqueue(nextHigh()),
          enqueue(nextHigh()),
        ];
        settle();
        for (const twig of twigs.reverse()) drop(twig);
        for (const node of rest.reverse()) drop(node);
      }

      const mean = heap.__cost / calls;
      const size = heap.size();
      const before = heap.__cost;
      expect(heap.decreaseKey(bottom, TINY - 1)).toBe(true);
      // 계측이 먼저다 — `size()` 도 걸음 하나를 센다.
      const single = heap.__cost - before;
      measured.push({ size, single, mean: Number(mean.toFixed(2)) });
    }
    expect(measured).toEqual([
      { size: 1026, single: 1026, mean: 4.35 },
      { size: 4098, single: 4098, mean: 4.35 },
      { size: 16386, single: 16386, mean: 4.35 },
    ]);
  }, 60_000);
});

describe("축3 — 키 낮추기 계약의 결함 fixture", () => {
  /**
   * **포섭이 진부분이라는 수치.** 계약 C 의 정본에 키 낮추기를 자리 바꿔 올리기로 붙인 구현이
   * C 를 전부 지키고, 이 계약에서는 더한 행의 적대적 시나리오 하나에서만 걸린다.
   */
  test("자리를 바꿔 올리는 힙은 계약 C 를 전부 통과하고 이 계약의 키 낮추기 적대적 시나리오에서만 걸린다", () => {
    expect(outcomes(onMergeSite(sifting), pairingHeapContract)).toEqual(
      PAIRING_ALL_PASS,
    );
    expect(outcomes(onDecreaseSite(sifting), fibonacciHeapContract)).toEqual({
      ...ALL_PASS,
      "decreaseKey (적대적)": false,
    });
    expect(
      judgeScenario(
        onDecreaseSite(sifting),
        scenarioOf("decreaseKey", true),
        "complexity",
      ).points.map((point) => point.stat),
    ).toEqual([1024, 4096, 16384]);
  }, 120_000);

  /**
   * **조회 시나리오를 따로 적은 이유.** 앞당긴 뒤 보기가 뿌리를 다시 훑는 힙이 계약 C 의 조회
   * 시나리오(넣기·합치기로만 채운다)는 통과하고 이 계약의 조회 시나리오에서 걸린다. `amortized`
   * 로 다시 재도 같은 값이다 — 한정자가 아니라 채우기가 가른다.
   */
  test("앞당긴 뒤 뿌리를 다시 훑는 힙은 이 계약의 조회 시나리오에서만 걸리고 계약 C 는 전부 통과한다", () => {
    expect(outcomes(onMergeSite(rescanning), pairingHeapContract)).toEqual(
      PAIRING_ALL_PASS,
    );
    expect(outcomes(onDecreaseSite(rescanning), fibonacciHeapContract)).toEqual(
      {
        ...ALL_PASS,
        "peek·size·isEmpty (적대적)": false,
      },
    );

    const peekScenario = scenarioOf("peek", true);
    const asWorst = judgeScenario(
      onDecreaseSite(rescanning),
      peekScenario,
      "complexity",
    );
    expect(asWorst.points.map((point) => point.stat)).toEqual([
      1027, 4099, 16387,
    ]);
    const asAmortized = judgeScenario(
      onDecreaseSite(rescanning),
      { ...peekScenario, qualifier: "amortized" as const },
      "complexity",
    );
    expect(asAmortized.ok).toBe(false);
    expect(asAmortized.points.map((point) => point.stat)).toEqual([
      1027, 4099, 16387,
    ]);
  }, 120_000);
});
