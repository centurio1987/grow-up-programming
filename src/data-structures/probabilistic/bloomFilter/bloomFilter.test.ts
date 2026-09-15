/**
 * `probabilistic/bloomFilter` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` 호출만 둔다. 무엇을 검사하는지는 `./bloomFilter.contract.ts` 에 있고, 계약 자체는
 * `./bloomFilter.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 팩토리가 껍데기를 씌우는 것은 용량 · 목표 오차를 생성자가 정하기 때문이다(`./bloomFilter.contract.ts` 머리말 —
 * 불변 사실 83).
 *
 * **정본은 무작위를 뽑으므로 오차 판정의 거짓 양성 수가 실행마다 다르다.** 판정은 여유 2 로 흔들림을 받는다 —
 * 반복 실행 결과는 `docs/ORD-006-conventions.md` 「A군 확률 필터 둘」.
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 스위트의 「10^5 넣기 · 묻기를 100ms 안에」는 옮기지 않았고,
 * 「size=1 · hashCount=1 이면 모든 질의가 참」은 헤더가 뺀 표현 매개변수의 성질이라 옮기지 않았다. 「거짓 양성률이
 * 5% 미만」은 표현 매개변수로 적힌 수치라 헤더의 판정 문장(용량 · 목표 오차 · 여유 2)으로 대체됐다. 결함 fixture 의
 * 자기시험은 `../../_contract/runContract.bloomFilter.test.ts` 에 있다.
 */

import { runContract } from "../../_contract/runContract";
import { BloomFilter as Reference } from "./_reference/bloomFilter";
import { BloomFilter } from "./bloomFilter";
import { bloomFilterContract, SizedFilter } from "./bloomFilter.contract";

runContract(
  () => new SizedFilter((n, rate) => new BloomFilter(n, rate)),
  bloomFilterContract,
  { label: "스텁" },
);

runContract(
  () => new SizedFilter((n, rate) => new Reference(n, rate)),
  bloomFilterContract,
  {
    label: "정본",
    cost: {
      kind: "self-reported",
      make: () => new SizedFilter((n, rate) => new Reference(n, rate)),
    },
  },
);
