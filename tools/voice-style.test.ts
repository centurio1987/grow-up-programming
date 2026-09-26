import { expect, test } from "bun:test";
import {
  FORBIDDEN_PHRASES,
  MAX_PROSE_RUN,
  METAPHORS,
  mirrorDrift,
} from "./voice-style.ts";

// 정의는 authoring-kit voice 설정에 있고 이 모듈은 사본을 읽기만 한다. 옮기기 전 `check-v2.ts`
// 가 들고 있던 개수와 같아야 한다 — 은유·다의어 12갈래, 논증 종료 문형 4개, 산문 상한 2.
test("사본에서 금지 항목을 읽는다", () => {
  expect(METAPHORS).toHaveLength(12);
  expect(FORBIDDEN_PHRASES).toEqual([
    "성립해서",
    "임을 알 수 있습니다",
    "이를 반복 적용하면",
    "자명합니다",
  ]);
  expect(MAX_PROSE_RUN).toBe(2);
});

test("정규식 항목이 옛 판정을 그대로 낸다 — 돌다는 잡고 돌려주다는 비킨다", () => {
  const hit = (s: string) => METAPHORS.some(({ re }) => re.test(s));
  expect(hit("루프가 돈다.")).toBe(true);
  expect(hit("결과를 돌려준다.")).toBe(false);
});

test("원본이 있으면 사본과 같다", async () => {
  const drift = await mirrorDrift();
  if (drift !== null) expect(drift).toEqual([]);
});
