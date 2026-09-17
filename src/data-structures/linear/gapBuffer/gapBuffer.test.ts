/**
 * `linear/gapBuffer` 계약 스위트 실행부(규약2).
 *
 * 여기에는 `runContract` · `valueContract` 호출만 둔다. 무엇을 검사하는지는 `./gapBuffer.contract.ts` 에
 * 있고, 계약 자체는 `./gapBuffer.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다.
 * 축3은 계측기가 붙은 정본에만 돈다 — 학습자 스텁에 `__cost` 를 요구하지 않는다.
 *
 * 생성자가 인자를 받지 않으므로 껍데기가 없다(`./gapBuffer.contract.ts` 헤더).
 *
 * **축3 시나리오가 지나간 상태를 아무도 안 보던 자리를 `valueContract` 가 본다**(`KAN-043`). 옛 정본은
 * 시나리오 여섯 중 다섯에서 원소를 잃으면서 축3 판정을 그대로 통과했다(불변 사실 240 · 241) — 그
 * 구멍이 이 계약에서 실물로 드러났기 때문에 여기가 첫 자리다. 검증 실행은 새 인스턴스 · 계측 없는
 * 문맥이라 측정 실행을 건드리지 않는다(`../../_contract/runValues.ts`).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 고정 n 의 임계값이 재는 것은 복잡도 등급이
 * 아니라 그 기계의 상수다. 자리는 축3이다.
 */

import { runContract } from "../../_contract/runContract";
import { valueContract } from "../../_contract/runValues";
import { GapBuffer as Reference } from "./_reference/gapBuffer";
import { GapBuffer } from "./gapBuffer";
import { gapBufferContract } from "./gapBuffer.contract";

runContract(() => new GapBuffer<number>(), gapBufferContract, {
  label: "스텁",
});

runContract(() => new Reference<number>(), gapBufferContract, {
  label: "정본",
  cost: { kind: "self-reported", make: () => new Reference<number>() },
});

valueContract(() => new GapBuffer<number>(), gapBufferContract, {
  label: "스텁",
});

valueContract(() => new Reference<number>(), gapBufferContract, {
  label: "정본",
});
