/**
 * 하네스 자기시험 — `graph-repr/graphAdjMatrix` 계약 앞에 선 정본과 결함 하나.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106).
 *
 * **이 파일이 「공간이 존재 이유」 판별 절차의 셋째 걸음을 이 계약에서 실제로 돌린 자리다**
 * (`docs/ORD-006-conventions.md:2870-2877` · 셋째 걸음의 축 `:3037-3040`). 제약이 비용이므로 그것이
 * 사는 축은 축3이고, 그 제약을 무시하는 구현(정점마다 이웃 배열)을 넣으면 값은 전부 맞는데
 * 쌍을 다루는 네 행이 걸린다. 그래서 이 계약은 B15 처분이 아니라 따로 선다.
 *
 * | 시나리오 | 정본 | `NeighborListMatrixGraph` |
 * |---|---|---|
 * | `addEdge` O(1) 별 | 2.00 → 2.00 | **걸림** 513.50 → 2,049.50 (위반) |
 * | `removeEdge` O(1) 별 | 2.00 → 2.00 | **걸림** 272.80 → 1,030.04 (위반) |
 * | `hasEdge`·`weight` O(1) 별 | 3.00 → 3.00 | **걸림** 2,050 → 8,194 (위반) |
 * | `neighbors` O(n) | 1,025 → 4,097 | 통과 — 가운데 정점을 함께 물어 최대가 n 을 따라간다 |
 * | `vertexCount` O(1) | 1.00 → 1.00 | 통과 |
 *
 * 통과하는 두 자리에 숨은 위반은 없다 — `neighbors` 는 계약보다 빠를 뿐이다(불변 사실 49).
 */

import { describe, expect, test } from "bun:test";
import { GraphAdjMatrix as Reference } from "../graph-repr/graphAdjMatrix/_reference/graphAdjMatrix";
import {
  graphAdjMatrixContract,
  SizedGraphs,
} from "../graph-repr/graphAdjMatrix/graphAdjMatrix.contract";
import { NeighborListMatrixGraph } from "./_fixtures/neighborListMatrixGraph";
import { type CostSource, judgeScenario, runContract } from "./runContract";

const reference: CostSource<SizedGraphs> = {
  kind: "self-reported",
  make: () => new SizedGraphs((n, directed) => new Reference(n, directed)),
};
const neighborList: CostSource<SizedGraphs> = {
  kind: "self-reported",
  make: () =>
    new SizedGraphs((n, directed) => new NeighborListMatrixGraph(n, directed)),
};

function verdicts(cost: CostSource<SizedGraphs>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of graphAdjMatrixContract.scenarios) {
    const label = `${scenario.covers.join("·")} ${scenario.bound}`;
    found[label] = judgeScenario(
      cost,
      scenario,
      graphAdjMatrixContract.grade,
    ).ok;
  }
  return found;
}

// 결함은 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () =>
    new SizedGraphs((n, directed) => new NeighborListMatrixGraph(n, directed)),
  graphAdjMatrixContract,
  { label: "결함 fixture NeighborListMatrixGraph" },
);

describe("GraphAdjMatrix 축3 — 이웃 배열 구현이 쌍을 다루는 네 행에서 걸린다", () => {
  test("정본은 다섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual({
      "addEdge O(1)": true,
      "removeEdge O(1)": true,
      "hasEdge·weight O(1)": true,
      "neighbors O(n)": true,
      "vertexCount O(1)": true,
    });
  });

  test("정점마다 이웃 배열을 드는 구현은 쌍 연산 넷에서 걸리고 나머지 둘을 통과한다", () => {
    expect(verdicts(neighborList)).toEqual({
      "addEdge O(1)": false,
      "removeEdge O(1)": false,
      "hasEdge·weight O(1)": false,
      "neighbors O(n)": true,
      "vertexCount O(1)": true,
    });
  });
});

describe("GraphAdjMatrix 생성자 — 축1이 못 보는 조항", () => {
  // 껍데기가 생성자를 부르므로 축1 경계 케이스가 생성자의 `RangeError` 조항에 닿지 못한다.
  // 그 한 줄을 정본에 대해서만 여기서 짚는다.
  test("정점 수가 0 이상의 정수가 아니면 RangeError 이고 0 은 정당하다", () => {
    expect(() => new Reference(-1)).toThrow(RangeError);
    expect(() => new Reference(2.5)).toThrow(RangeError);
    expect(new Reference(0).vertexCount()).toBe(0);
  });
});
