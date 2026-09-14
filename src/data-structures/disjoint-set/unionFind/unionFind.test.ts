/**
 * `disjoint-set/unionFind` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./unionFind.contract.ts` 에 있고, 계약
 * 자체는 `./unionFind.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가
 * 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기(`PartitionSite`)를 씌우는 것은 이 구조가 원소 수를 생성자로 받기 때문이다
 * (`./unionFind.contract.ts` 머리말 — 불변 사실 83). 주입 정책은 「주입받는 것이 없다」라 손으로 쓴
 * 테스트가 남지 않는다.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이 아니라 그
 * 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { UnionFind as Reference } from "./_reference/unionFind";
import { UnionFind } from "./unionFind";
import { PartitionSite, unionFindContract } from "./unionFind.contract";

runContract(
  () => new PartitionSite((n) => new UnionFind(n)),
  unionFindContract,
  { label: "스텁" },
);

runContract(
  () => new PartitionSite((n) => new Reference(n)),
  unionFindContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new PartitionSite((n) => new Reference(n)),
    },
  },
);
