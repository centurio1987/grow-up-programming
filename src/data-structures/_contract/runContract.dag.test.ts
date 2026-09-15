/**
 * 하네스 자기시험 — `graph-repr/dag` 계약 앞에 선 정본 · 결함 셋.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 셋이다.
 *
 * 1. **값을 틀리지 않는 결함 둘은 축1 · 축2를 전부 통과하고 축3에서 서로 다른 행에 걸린다.** 행 단위로
 *    적는다(불변 사실 84).
 * 2. **넣을 때마다 그래프 전체로 순서를 지어 보는 구현은 `addEdge` 의 두 시나리오 중 떨어진 쌍에서만 걸린다.**
 *    사슬의 끝을 잇는 쪽에서는 닿는 부분이 곧 그래프 전체라 통과한다. 상한을 그래프 크기로 적었다면 이
 *    구현은 계약을 지킨다 — 그 선택이 사람 결정으로 올라간 자리이고, 이 표의 한 줄이 그 판단의 실측이다.
 * 3. **사이클 판정의 방향을 거꾸로 짠 구현은 축1이 경계 다섯에서 잡고 축2도 잡는다.** 축3에서 걸리는 한
 *    자리(사슬의 끝)는 비용의 위반이 아니라 사이클을 받아들인 결과다 — 뒤 호출이 같은 간선을 찾기만 해서
 *    계급 아래로 떨어진다(불변 사실 49 · 192).
 *
 * | 시나리오 (n = 1,024 → 4,096) | 정본 | `FullScanDag` | `RescanningOrderDag` | `ReversedSearchDag` |
 * |---|---|---|---|---|
 * | `addVertex` amortized O(1) | 1.00 → 1.00 | 통과 | 통과 | 통과 |
 * | `addEdge` amortized O(1) 떨어진 쌍 (적대적) | 3.00 → 3.00 | **걸림** 5,123 → 20,483 (위반) | 통과 | 통과 |
 * | `addEdge` amortized O(n) 사슬의 끝 | 2,048 → 8,192 | 통과 — 닿는 부분이 그래프 전체 | 통과 | **걸림** 2.00 → 2.00 (계급 아래 — 사이클을 받아들인 결과) |
 * | `topologicalOrder` worst O(n) | 4,095 → 16,383 | 통과 | **걸림** 527,871 → 8,402,943 (위반) | 통과 |
 * | `vertexCount`·`edgeCount` worst O(1) | 2.00 → 2.00 | 통과 | 통과 | 통과 |
 * | 축1 | 통과 | 통과 | 통과 | **걸림** — 경계 다섯 · 무작위 39번째 호출 |
 * | 축2 | 통과 | 통과 | 통과 | **걸림** — 무작위 101번째 호출 뒤 |
 *
 * **`FullScanDag` · `RescanningOrderDag` 가 통과하는 자리에 숨은 위반은 없다** — 걸리지 않는 행에서는 정본과
 * 같은 계급이다(불변 사실 62).
 */

import { describe, expect, test } from "bun:test";
import { DAG as Reference } from "../graph-repr/dag/_reference/dag";
import {
  type DagContract,
  DagShell,
  dagContract,
} from "../graph-repr/dag/dag.contract";
import { FullScanDag } from "./_fixtures/fullScanDag";
import { RescanningOrderDag } from "./_fixtures/rescanningOrderDag";
import { ReversedSearchDag } from "./_fixtures/reversedSearchDag";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

type Built = DagContract & { __cost: number };

function source(make: () => Built): CostSource<DagShell> {
  return {
    kind: "self-reported",
    make: () => new DagShell(make()),
  };
}

/**
 * 시나리오 이름. `addEdge` 가 둘이라 `covers` 로는 겹친다 — 판정을 모으는 이름이 겹치면 뒤 판정이 앞
 * 판정을 말없이 덮는다(불변 사실 222). 헤더 표의 첫 열과 차례가 같다.
 */
const LABELS = [
  "addVertex",
  "addEdge 떨어진 쌍",
  "addEdge 사슬의 끝",
  "topologicalOrder",
  "vertexCount·edgeCount",
] as const;

function verdicts(cost: CostSource<DagShell>): Record<string, boolean> {
  expect(dagContract.scenarios).toHaveLength(LABELS.length);
  const found: Record<string, boolean> = {};
  for (const [index, scenario] of dagContract.scenarios.entries()) {
    const label = LABELS[index] as string;
    found[label] = judgeScenario(cost, scenario, dagContract.grade).ok;
  }
  return found;
}

const ALL_PASS: Record<(typeof LABELS)[number], boolean> = {
  addVertex: true,
  "addEdge 떨어진 쌍": true,
  "addEdge 사슬의 끝": true,
  topologicalOrder: true,
  vertexCount·edgeCount: true,
};

const byName = new Map(dagContract.ops.map((op) => [op.name, op] as const));

/** 관측값 비교. 하네스의 `sameValue` 와 같은 뜻이다 — 배열은 원소마다, 나머지는 `Object.is`. */
function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 경계 케이스마다 첫 갈림을 값으로 돌려준다. 갈리지 않은 경계는 담지 않는다. */
function edgeSplits(make: () => Built): Record<string, string> {
  const found: Record<string, string> = {};
  for (const edge of dagContract.edges) {
    const impl = new DagShell(make());
    const model = dagContract.model();
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!same(observed, expected)) {
        found[edge.name] =
          `${index}번째 ${step.op} — 관측 ${JSON.stringify(observed)} / 모델 ${JSON.stringify(expected)}`;
        break;
      }
    }
  }
  return found;
}

/**
 * 무작위 교차검증의 첫 갈림 자리(0부터 센 호출 번호). 갈리지 않으면 `null`. seed 와 호출 수는
 * `runContract.ts` 의 축1 무작위 교차검증과 같게 둔다(seed 1 · 500회).
 */
function randomSplitAt(make: () => Built): number | null {
  const rng = rngFrom(1);
  const impl = new DagShell(make());
  const model = dagContract.model();
  const ops = dagContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비어 있다");
    const arg = op.arg(rng);
    if (!same(op.onImpl(impl, arg), op.onModel(model, arg))) return index;
  }
  return null;
}

/**
 * 축2 무작위 시퀀스에서 불변식이 처음 깨지는 호출 번호(0부터). 깨지지 않으면 `null`. seed 와 호출 수는
 * `runContract.ts` 의 축2 와 같게 둔다(seed 2 · 200회).
 */
function invariantSplitAt(make: () => Built): number | null {
  const rng = rngFrom(2);
  const impl = new DagShell(make());
  const ops = dagContract.ops;
  for (let index = 0; index < 200; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비어 있다");
    op.onImpl(impl, op.arg(rng));
    for (const invariant of dagContract.invariants) {
      if (invariant.check(impl) !== null) return index;
    }
  }
  return null;
}

// 1. 값을 틀리지 않는 결함 둘은 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new DagShell(new FullScanDag()), dagContract, {
  label: "결함 fixture FullScanDag",
});
runContract(() => new DagShell(new RescanningOrderDag()), dagContract, {
  label: "결함 fixture RescanningOrderDag",
});

describe("DAG 축3 — 값을 틀리지 않는 결함 둘이 서로 다른 행에서 걸린다", () => {
  test("정본은 다섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(source(() => new Reference()))).toEqual(ALL_PASS);
  });

  test("넣을 때마다 그래프 전체로 순서를 지어 보는 구현은 떨어진 쌍에서만 걸린다", () => {
    expect(verdicts(source(() => new FullScanDag()))).toEqual({
      ...ALL_PASS,
      "addEdge 떨어진 쌍": false,
    });
  });

  test("순서의 다음 정점을 매번 정점 전체에서 찾는 구현은 topologicalOrder 에서만 걸린다", () => {
    expect(verdicts(source(() => new RescanningOrderDag()))).toEqual({
      ...ALL_PASS,
      topologicalOrder: false,
    });
  });
});

describe("DAG 축1 · 축2 — 사이클 판정의 방향을 거꾸로 짠 구현은 값에서 걸린다", () => {
  test("정본과 값을 틀리지 않는 결함 둘은 경계 · 무작위 · 불변식에서 갈리지 않는다", () => {
    for (const make of [
      () => new Reference(),
      () => new FullScanDag(),
      () => new RescanningOrderDag(),
    ]) {
      expect(edgeSplits(make)).toEqual({});
      expect(randomSplitAt(make)).toBeNull();
      expect(invariantSplitAt(make)).toBeNull();
    }
  });

  test("경계 다섯에서 사이클을 받아들이거나 지름길을 거부한다", () => {
    expect(edgeSplits(() => new ReversedSearchDag())).toEqual({
      // 1 에서 0 에 못 닿으므로 받아들인다 — 두 정점 사이클이다.
      "반대 방향 간선은 두 정점 사이클이라 거부된다":
        "3번째 addEdge — 관측 true / 모델 false",
      // 0 에서 3 에 이미 닿으므로 지름길 0→3 을 사이클로 읽는다.
      "긴 사이클을 닫는 간선은 거부하고 지름길은 받는다":
        "7번째 addEdge — 관측 false / 모델 true",
      "거부된 간선은 뒤 판정에 남지 않는다":
        "4번째 addEdge — 관측 true / 모델 false",
      // 0 에서 4 에 못 닿으므로 받아들인다 — 4→3→1→0→4 사이클이다.
      "순서는 모든 간선 방향을 지키고 돌려준 배열을 고쳐도 바뀌지 않는다":
        "12번째 addEdge — 관측 true / 모델 false",
      "범위 밖 · 정수가 아닌 번호는 RangeError 이고 상태를 바꾸지 않는다":
        "10번째 addEdge — 관측 true / 모델 false",
    });
  });

  test("무작위 교차검증은 39번째 호출(0부터 38)에서 잡는다", () => {
    expect(randomSplitAt(() => new ReversedSearchDag())).toBe(38);
  });

  test("받아들인 사이클의 정점이 순서에서 빠져 축2 불변식이 101번째 호출(0부터 100) 뒤에 깨진다", () => {
    expect(invariantSplitAt(() => new ReversedSearchDag())).toBe(100);
  });

  test("축3에서는 사슬의 끝 하나에서 계급 아래로 걸린다 — 사이클을 받아들인 결과다", () => {
    expect(verdicts(source(() => new ReversedSearchDag()))).toEqual({
      ...ALL_PASS,
      "addEdge 사슬의 끝": false,
    });
  });
});
