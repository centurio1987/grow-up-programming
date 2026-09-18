/**
 * 하네스 자기시험 — `graph-repr/graphAdjList` 계약 앞에 선 정본과 결함 둘.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106). 구조 하나의 자기시험을 제 파일에 두면 인용 전수
 * 대조가 필요 없다.
 *
 * 보는 것은 둘이다.
 *
 * 1. **결함 둘은 동작상 옳다.** 축1 · 축2를 전부 통과한다. 이 계약에서 둘을 가르는 것은 값이
 *    아니라 비용이다.
 * 2. **결함 둘이 축3에서 서로 다른 자리에 걸린다.** 행 단위로 적는다(불변 사실 84). 통과하는
 *    자리 가운데 계약 위반이 있으면 그 사실도 함께 적는다(불변 사실 62).
 *
 * | 시나리오 | 정본 | `GrowingMatrixGraph` | `EdgeListGraph` |
 * |---|---|---|---|
 * | `addVertex` O(1) | 1.00 → 1.00 | **걸림** 342.33 → 1,366.33 (위반) | 통과 |
 * | `addEdge` O(1) 고리 | 4.00 → 4.00 | 통과 | **걸림** 512.50 → 2,048.50 (위반) |
 * | `addEdge` O(n) 별 | 514.50 → 2,050.50 | **걸림** 1.00 → 1.00 (계급 아래 — 위반 아님) | 통과 — 별에서는 간선 수가 곧 차수 |
 * | `removeEdge` O(1) 고리 | 6.00 → 6.00 | 통과 | **걸림** 257.50 → 1,025.50 (위반) |
 * | `removeEdge` O(n) 별 | 270.18 → 1,024.82 | **걸림** 1.00 → 1.00 (계급 아래 — 위반 아님) | 통과 |
 * | `neighbors` O(1) 고리 | 3.00 → 3.00 | **걸림** 1,025 → 4,097 (위반) | **걸림** 1,025 → 4,097 (위반) |
 * | `neighbors` O(n) 별 | 1,025 → 4,097 | 통과 | 통과 |
 *
 * **`GrowingMatrixGraph` 가 통과하는 자리에 숨은 위반은 없다** — `addEdge`·`removeEdge` 가 계약보다
 * 빠를 뿐이다. **`EdgeListGraph` 는 차수를 키운 세 시나리오를 통과하면서 계약을 어긴다** — 거기서는
 * 간선 수와 차수가 같이 자라 두 계급이 갈리지 않는다. 그 위반을 잡는 것은 고리 쪽 셋이다.
 */

import { describe, expect, test } from "bun:test";
import { GraphAdjList as Reference } from "../graph-repr/graphAdjList/_reference/graphAdjList";
import {
  BothGraphs,
  graphAdjListContract,
} from "../graph-repr/graphAdjList/graphAdjList.contract";
import { EdgeListGraph } from "./_fixtures/edgeListGraph";
import { GrowingMatrixGraph } from "./_fixtures/growingMatrixGraph";
import { type CostSource, judgeScenario, runContract } from "./runContract";

const reference: CostSource<BothGraphs> = {
  kind: "self-reported",
  make: () => new BothGraphs((directed) => new Reference(directed)),
};
const growingMatrix: CostSource<BothGraphs> = {
  kind: "self-reported",
  make: () => new BothGraphs((directed) => new GrowingMatrixGraph(directed)),
};
const edgeList: CostSource<BothGraphs> = {
  kind: "self-reported",
  make: () => new BothGraphs((directed) => new EdgeListGraph(directed)),
};

/** 시나리오마다 `행 상한 → 통과 여부`. 이름은 헤더 표의 첫 열과 같다. */
function verdicts(cost: CostSource<BothGraphs>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of graphAdjListContract.scenarios) {
    const label = `${scenario.covers.join("·")} ${scenario.bound}`;
    found[label] = judgeScenario(cost, scenario, graphAdjListContract.grade).ok;
  }
  return found;
}

// 1. 결함 둘은 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(
  () => new BothGraphs((directed) => new GrowingMatrixGraph(directed)),
  graphAdjListContract,
  { label: "결함 fixture GrowingMatrixGraph" },
);
runContract(
  () => new BothGraphs((directed) => new EdgeListGraph(directed)),
  graphAdjListContract,
  { label: "결함 fixture EdgeListGraph" },
);

describe("GraphAdjList 축3 — 결함 둘이 서로 다른 행에서 걸린다", () => {
  test("정본은 일곱 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual({
      "addVertex O(1)": true,
      "addEdge O(1)": true,
      "addEdge O(n)": true,
      "removeEdge O(1)": true,
      "removeEdge O(n)": true,
      "neighbors O(1)": true,
      "neighbors O(n)": true,
    });
  });

  test("칸을 늘리는 행렬은 addVertex 와 차수 2 의 neighbors 에서 걸린다", () => {
    expect(verdicts(growingMatrix)).toEqual({
      "addVertex O(1)": false,
      "addEdge O(1)": true,
      // 계약보다 빠르다 — 계급 아래라서 걸리는 것이고 위반이 아니다(불변 사실 49).
      "addEdge O(n)": false,
      "removeEdge O(1)": true,
      "removeEdge O(n)": false,
      "neighbors O(1)": false,
      "neighbors O(n)": true,
    });
  });

  test("간선을 한 줄로 늘어놓은 목록은 차수를 누른 세 행에서만 걸린다", () => {
    expect(verdicts(edgeList)).toEqual({
      "addVertex O(1)": true,
      "addEdge O(1)": false,
      // 별에서는 간선 수가 곧 차수라 두 계급이 갈리지 않는다 — 통과하지만 계약 위반이다.
      "addEdge O(n)": true,
      "removeEdge O(1)": false,
      "removeEdge O(n)": true,
      "neighbors O(1)": false,
      "neighbors O(n)": true,
    });
  });
});
