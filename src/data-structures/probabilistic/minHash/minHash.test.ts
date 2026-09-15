/**
 * `probabilistic/minHash` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./minHash.contract.ts` 에 있고, 계약 자체는 `./minHash.ts` 헤더
 * 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 닮음 오차 · 실패 확률을 생성자가 정하고 닮음이 인스턴스 둘을 받기 때문이다
 * (`./minHash.contract.ts` 머리말 — 불변 사실 83).
 *
 * **정본은 무작위를 뽑으므로 오차 판정에서 벗어난 짝의 수가 실행마다 다르다.** 판정은 여유 3 으로 흔들림을 받는다 — 반복 실행
 * 결과는 `docs/ORD-006-conventions.md` 「A군 닮음 추정」.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^4 집합 200ms」 · 「10^3 쌍 100ms」는 옮기지 않았다.
 * `signature()` · `exact()` 시험은 헤더가 표면에서 뺀 연산이라 옮기지 않았고, 「update 를 여러 번 부르면 덮어쓴다」는 표면을 고친
 * 까닭이라 옮기지 않았다. 「같은 집합은 같은 서명」 · 「순서가 달라도 같은 서명」 · 「같은 집합의 닮음은 1 에 가깝다」는 결정적인 쪽
 * (닮음은 두 집합의 짝의 함수 · 같으면 정확히 1)으로, 「완전히 다른 집합은 0 에 가깝다」 · 「50% 겹침은 0.33 ± 0.1」 같은 표현
 * 매개변수(numHashes)로 적힌 수치는 헤더의 판정 문장(닮음 오차 · 실패 확률 · 여유 3)으로 대체됐다. 결함 fixture 의 자기시험은
 * `../../_contract/runContract.minHash.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { MinHash as Reference } from "./_reference/minHash";
import { MinHash } from "./minHash";
import { MinHashPair, minHashContract } from "./minHash.contract";

runContract(
  () => new MinHashPair((e, d) => new MinHash(e, d)),
  minHashContract,
  { label: "스텁" },
);

runContract(
  () => new MinHashPair((e, d) => new Reference(e, d)),
  minHashContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new MinHashPair((e, d) => new Reference(e, d)),
    },
  },
);
