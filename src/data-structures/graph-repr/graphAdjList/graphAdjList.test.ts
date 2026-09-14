/**
 * `graph-repr/graphAdjList` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./graphAdjList.contract.ts` 에 있고,
 * 계약 자체는 `./graphAdjList.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 방향 여부를 생성자가 정하기 때문이다
 * (`./graphAdjList.contract.ts` 헤더의 껍데기 설명 — 불변 사실 83).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 결함 fixture 의 자기시험은
 * `../../_contract/runContract.graphAdjList.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { GraphAdjList as Reference } from "./_reference/graphAdjList";
import { GraphAdjList } from "./graphAdjList";
import { BothGraphs, graphAdjListContract } from "./graphAdjList.contract";

runContract(
  () => new BothGraphs((directed) => new GraphAdjList(directed)),
  graphAdjListContract,
  { label: "스텁" },
);

runContract(
  () => new BothGraphs((directed) => new Reference(directed)),
  graphAdjListContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new BothGraphs((directed) => new Reference(directed)),
    },
  },
);
